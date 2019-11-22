import logging
import os
import re
import requests
import inspect

from collections import OrderedDict
from operator import itemgetter
from urllib import parse
from django.conf import settings
from django.http import Http404

from data import constants, utils


MAX_FINANCIALS_COUNT = 4

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

session = requests.Session()
http_adapter = requests.adapters.HTTPAdapter(max_retries=2)
session.mount('https://', http_adapter)


def _call_api(*path_parts, **filters):
    if settings.FEC_API_KEY_PRIVATE:
        filters['api_key'] = settings.FEC_API_KEY_PRIVATE

    path = os.path.join(
        settings.FEC_API_VERSION,
        *[x.strip('/') for x in path_parts]
    )
    url = parse.urljoin(settings.FEC_API_URL, path)
    results = session.get(url, params=filters)

    # Log the caller function and API endpoint
    current_frame = inspect.currentframe()
    caller_frame = inspect.getouterframes(current_frame, 2)
    logger.info('{0}: {1}'.format(caller_frame[1][3], results.url))

    if results.ok:
        return results.json()
    else:
        logger.error('API ERROR with status {0} for {1} with filters: {2}'.format(
            results.status_code,
            url,
            filters
        ))

        return {'results': []}


def load_search_results(query, query_type=None):
    filters = {}

    if query:
        filters['q'] = query
        filters['sort'] = ['-receipts']
        filters['per_page'] = 5
        candidates = _call_api('/candidates/search', **filters)
        committees = _call_api('/committees', **filters)
        return {
            'candidates': candidates if len(candidates) else [],
            'committees': committees if len(committees) else [],
        }


def load_legal_search_results(query, query_type='all', offset=0, limit=20, **kwargs):
    filters = dict((key, value) for key, value in kwargs.items() if value)

    # Apply specific parameters if only looking for one type
    if query or query_type != 'all':
        filters['hits_returned'] = limit
        filters['type'] = query_type
        filters['from_hit'] = offset

        if query:
            filters['q'] = query

    results = _call_api('legal', 'search', **filters)
    results['limit'] = limit
    results['offset'] = offset

    if 'statutes' in results:
        results['statutes_returned'] = len(results['statutes'])

    if 'regulations' in results:
        results['regulations_returned'] = len(results['regulations'])

    if 'advisory_opinions' in results:
        results['advisory_opinions_returned'] = len(results['advisory_opinions'])

    if 'murs' in results:
        results['murs_returned'] = len(results['murs'])

    if 'adrs' in results:
        results['adrs_returned'] = len(results['adrs'])

    if 'admin_fines' in results:
        results['admin_fines_returned'] = len(results['admin_fines'])

    return results


def load_legal_advisory_opinion(ao_no):
    url = '/legal/docs/advisory_opinions/'
    results = _call_api(url, parse.quote(ao_no))

    if not (results and 'docs' in results and results['docs']):
        raise Http404()

    ao = results['docs'][0]
    ao['sorted_documents'] = _get_sorted_documents(ao)
    ao['entities'] = sorted(ao['entities'], key=itemgetter('role'), reverse=True)
    return ao


def load_legal_mur(mur_no):

    url = '/legal/docs/murs/'
    mur = _call_api(url, parse.quote(mur_no))

    if not mur:
        raise Http404

    mur = mur['docs'][0]

    if mur['mur_type'] == 'current':
        complainants = []
        for participant in mur['participants']:
            citations = []
            for stage in participant['citations']:
                for url in participant['citations'][stage]:
                    if 'uscode' in url:
                        section = re.search('section=([0-9]+)', url).group(1)
                        citations.append({'text': section, 'url': url})
                    if 'cfr' in url:
                        title_no = re.search('titlenum=([0-9]+)', url).group(1)
                        part_no = re.search('partnum=([0-9]+)', url).group(1)
                        section_no = re.search('sectionnum=([0-9]+)', url).group(1)
                        text = '%s C.F.R. %s.%s' % (title_no, part_no, section_no)
                        citations.append({'text': text, 'url': url})
            participant['citations'] = citations

            if 'complainant' in participant['role'].lower():
                complainants.append(participant['name'])

        mur['disposition_text'] = [d['action'] for d in mur['commission_votes']]

        mur['collated_dispositions'] = collate_dispositions(mur['dispositions'])
        mur['complainants'] = complainants
        mur['participants_by_type'] = _get_sorted_participants_by_type(mur)

        documents_by_type = OrderedDict()
        for doc in mur['documents']:
            if doc['category'] in documents_by_type:
                documents_by_type[doc['category']].append(doc)
            else:
                documents_by_type[doc['category']] = [doc]
        mur['documents_by_type'] = documents_by_type
    return mur


def load_legal_adr(adr_no):

    url = '/legal/docs/adrs/'
    adr = _call_api(url, parse.quote(adr_no))

    if not adr:
        raise Http404

    adr = adr['docs'][0]

    complainants = []
    for participant in adr['participants']:
        citations = []
        for stage in participant['citations']:
            for url in participant['citations'][stage]:
                if 'uscode' in url:
                    section = re.search('section=([0-9]+)', url).group(1)
                    citations.append({'text': section, 'url': url})
                if 'cfr' in url:
                    title_no = re.search('titlenum=([0-9]+)', url).group(1)
                    part_no = re.search('partnum=([0-9]+)', url).group(1)
                    section_no = re.search('sectionnum=([0-9]+)', url).group(1)
                    text = '%s C.F.R. %s.%s' % (title_no, part_no, section_no)
                    citations.append({'text': text, 'url': url})
        participant['citations'] = citations

        if 'complainant' in participant['role'].lower():
            complainants.append(participant['name'])

    adr['disposition_text'] = [d['action'] for d in adr['commission_votes']]

    adr['collated_dispositions'] = collate_dispositions(adr['dispositions'])
    adr['complainants'] = complainants
    adr['participants_by_type'] = _get_sorted_participants_by_type(adr)

    documents_by_type = OrderedDict()
    for doc in adr['documents']:
        if doc['category'] in documents_by_type:
            documents_by_type[doc['category']].append(doc)
        else:
            documents_by_type[doc['category']] = [doc]
    adr['documents_by_type'] = documents_by_type
    return adr


def load_legal_admin_fines(admin_fine_no):
    url = '/legal/docs/admin_fines/'
    admin_fine = _call_api(url, parse.quote(admin_fine_no))
    if not admin_fine:
        raise Http404
    admin_fine = admin_fine['docs'][0]
    admin_fine['disposition_text'] = [d['action'] for d in admin_fine['commission_votes']]
    documents_by_type = OrderedDict()
    for doc in admin_fine['documents']:
        if doc['category'] in documents_by_type:
            documents_by_type[doc['category']].append(doc)
        else:
            documents_by_type[doc['category']] = [doc]
    admin_fine['documents_by_type'] = documents_by_type
    return admin_fine


def collate_dispositions(dispositions):
    """ Collate dispositions - group them by disposition, penalty """
    collated_dispositions = OrderedDict()
    for row in dispositions:
        if row['disposition'] in collated_dispositions:
            if row['penalty'] in collated_dispositions[row['disposition']]:
                collated_dispositions[row['disposition']][row['penalty']].append(row)
            else:
                collated_dispositions[row['disposition']][row['penalty']] = [row]
        else:
            collated_dispositions[row['disposition']] = OrderedDict({row['penalty']: [row]})
    return collated_dispositions


def load_single_type(data_type, c_id, *path, **filters):
    # Call API with single type in load_with_nested
    data = _call_api(data_type, c_id, *path, **filters)
    # Throw 404 if no data for candidate or committee in cycle
    return result_or_404(data)


def load_nested_type(parent_type, c_id, nested_type, *path, **filters):
    # Call API with nested types in load_with_nested
    return _call_api(
        parent_type,
        c_id,
        nested_type,
        *path,
        per_page=100,
        **filters
    )


def load_with_nested(primary_type, primary_id, secondary_type, cycle=None, **query):
    """ Handle Candidate or Committee endpoint
        Example: /candidate/P80003338/committees
        primary_type: "candidate"
        primary_id: "P80003338"
        secondary_type: "committees"
    """
    path = ('history', str(cycle)) if cycle else ('history', )
    """ Get data for just primary_type
        Example: candidate data for /candidate/* or committee data for /committee/*
    """
    data = load_single_type(
        primary_type,
        primary_id,
        *path,
        per_page=1,
        **query
    )

    cycle = cycle or max(data['cycles'])
    path = ('history', str(cycle))

    """ Get data for secondary_type
        Example: committee data for /candidate/P80003338/committees
    """
    nested_data = load_nested_type(
        primary_type,
        primary_id,
        secondary_type,
        *path,
        **query
    )

    return data, nested_data['results'], cycle


def load_reports_and_totals(committee_id, cycle_out_of_range, cycle, last_cycle_has_financial):

    path = '/filings/'
    filters = {}
    filters['committee_id'] = committee_id
    if cycle_out_of_range:
        filters['cycle'] = last_cycle_has_financial
    else:
        filters['cycle'] = cycle

    filters['form_category'] = 'REPORT'
    filters['most_recent'] = 'true'
    filters['per_page'] = 1
    filters['sort_hide_null'] = 'true'

    reports = load_first_row_data(path, **filters)
    # (4)call committee/{committee_id}/totals? under tag:financial
    # get financial totals
    path = '/committee/' + committee_id + '/totals/'
    filters = {}
    if cycle_out_of_range:
        filters['cycle'] = last_cycle_has_financial
    else:
        filters['cycle'] = cycle
    filters['per_page'] = 1
    filters['sort_hide_null'] = 'true'
    totals = load_first_row_data(path, **filters)

    return reports, totals


def load_committee_history(committee_id, cycle=None):
    filters = {}
    filters['per_page'] = 1
    if not cycle:
        # if no cycle parameter given,
        # (1.1)call committee/{committee_id}/history/ under tag:committee
        # set cycle = last_cycle_has_financial
        path = '/committee/' + committee_id + '/history/'
        committee = load_first_row_data(path, **filters)
        cycle = committee.get('last_cycle_has_financial')
        if not cycle:
            # when committees only file F1.last_cycle_has_financial = null
            # set cycle = last_cycle_has_activity
            cycle = committee.get('last_cycle_has_activity')
    else:
        # (1.2)call committee/{committee_id}/history/{cycle}/
        # under tag:committee
        path = '/committee/' + committee_id + '/history/' + str(cycle)
        committee = load_first_row_data(path, **filters)

    # (2)call committee/{committee_id}/candidates/history/{cycle}
    # under: candidate, get all candidates associated with that commitee
    path = '/committee/' + committee_id + '/candidates/history/' + str(cycle)
    filters = {}
    filters['election_full'] = 'false'
    all_candidates = load_endpoint_result(path, **filters)

    return committee, all_candidates, cycle


def load_cycle_data(committee, cycle):
    # (3)call /filings? under tag:filings
    # get reports from filings endpoint filter by form_category=REPORT
    # when cycle is out of [cycles_has_financial] range.
    # set cycle = last_cycle_has_financial to call endpoint
    # to get reports and totals

    cycle_out_of_range = False
    last_cycle_has_financial = committee.get('last_cycle_has_financial')
    if not last_cycle_has_financial:
        # when committees only file F1, last_cycle_has_financial = null
        # set last_cycle_has_financial = last_cycle_has_activity
        last_cycle_has_financial = committee.get('last_cycle_has_activity')

    if committee.get('cycles_has_financial'):
        min_cycle_has_financial = min(committee.get('cycles_has_financial'))
        cycles = committee.get('cycles_has_financial')
    else:
        # when committees only file F1, cycles_has_financial = null
        # set cycles = cycles_has_activity
        min_cycle_has_financial = min(committee.get('cycles_has_activity'))
        cycles = committee.get('cycles_has_activity')

    if int(cycle) > int(last_cycle_has_financial) or int(cycle) < int(min_cycle_has_financial):
        cycle_out_of_range = True

    return cycle_out_of_range, last_cycle_has_financial, cycles


def load_first_row_data(*path_parts, **filters):
    response = _call_api(*path_parts, **filters)
    return response['results'][0] if response['results'] else None


def load_endpoint_data(*path_parts, **filters):
    return _call_api(
        *path_parts,
        **filters
    )


def load_endpoint_result(*path_parts, **filters):
    response = _call_api(*path_parts, **filters)
    return response['results']


def load_candidate_statement_of_candidacy(candidate_id, cycle):
    response = _call_api(
        'filings',
        candidate_id=candidate_id,
        form_type='F2',
    )

    # Cycle is always the even year; so to include odd year statements,
    # check for greater than or equal to the odd year
    year = cycle - 1

    if 'results' in response:
        return [
            statement for statement in response['results']
            if statement['election_year'] >= year
        ]
    else:
        return []


def result_or_404(data):
    if not data.get('results'):
        raise Http404()
    return data['results'][0]


def load_top_candidates(sort, office=None, election_year=constants.DEFAULT_ELECTION_YEAR, per_page=5):
    response = _call_api(
        'candidates', 'totals',
        sort_hide_null=True,
        election_year=election_year,
        election_full=True,
        is_active_candidate=True,
        office=office,
        sort=sort,
        per_page=per_page,
    )
    return response if 'results' in response else None


def _get_sorted_participants_by_type(mur):
    """
    Returns the participants in a MUR sorted in the order
    of most important to least important
    """
    SORTED_PARTICIPANT_ROLES = [
        "Primary Respondent",
        "Respondent",
        "Previous Respondent",
        "Treasurer",
        "Previous Treasurer",
        "Complainant",
        "Respondent's Counsel",
        "Opposing counsel",
        "Representative",
        "Law Firm",
    ]
    participants_by_type = OrderedDict()

    # Prime with sorted roles
    for role in SORTED_PARTICIPANT_ROLES:
        participants_by_type[role] = []

    for participant in mur['participants']:
        participants_by_type[participant['role']].append(participant['name'])

    # Remove roles without participants
    for role in [key for key, value in participants_by_type.items() if not value]:
        del participants_by_type[role]

    # Sort remaining participants
    for key, value in participants_by_type.items():
        participants_by_type[key] = sorted(participants_by_type[key])

    return participants_by_type


def _get_sorted_documents(ao):
    """Sort documents within an AO by date DESC, description and document_id.
       We do this in 2 passes, making use of the fact that Python's `sorted`
       function performs a _stable_ sort.
    """
    sorted_documents = sorted(
        ao['documents'],
        key=itemgetter('description', 'document_id'),
        reverse=False,
    )
    sorted_documents = sorted(
        sorted_documents,
        key=itemgetter('date'),
        reverse=True,
    )
    return sorted_documents


def call_senate_specials(state):
    """ Call the API to get Senate special election information for
        given state. Returns a list of dictionaries
        Example: [{details for election1}][{details for election2}]
    """
    special_results = _call_api(
        'election-dates',
        election_type_id='SG',
        office_sought='S',
        election_state=state,
    )

    return special_results.get('results')


def format_special_results(special_results=[]):
    """ Takes special_results, which is a list of dictionaries,
        returns a list of election years. Round odd years up to even.
        Example: [2008, 2000]
    """
    senate_specials = []

    for result in special_results:
        # Round odd years up to even years
        result['election_year'] = result['election_year'] + (result['election_year'] % 2)
        senate_specials.append(result.get('election_year', None))

    return senate_specials


def get_regular_senate_cycles(state):
    """ Get the list of election cycles based off Senate class
    """
    senate_cycles = []

    for senate_class in ['1', '2', '3']:
        if state.upper() in constants.SENATE_CLASSES[senate_class]:
            senate_cycles += utils.get_senate_cycles(senate_class)

    return senate_cycles


def get_all_senate_cycles(state):
    """  Add together regularly scheduled and special senate elections
        Return a list of election years sorted in descending order
    """
    senate_specials = format_special_results(call_senate_specials(state))
    senate_regular_cycles = get_regular_senate_cycles(state)

    all_senate_cycles = senate_regular_cycles

    for special_year in senate_specials:
        # Prevent duplicates
        if special_year not in all_senate_cycles:
            all_senate_cycles.append(special_year)

    # Sort for readability
    all_senate_cycles.sort(reverse=True)

    return all_senate_cycles
