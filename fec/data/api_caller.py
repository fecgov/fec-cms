from django.conf import settings

from operator import itemgetter
import os
from urllib import parse
import re

import requests

from data import utils

from data import constants

from collections import OrderedDict

MAX_FINANCIALS_COUNT = 4

session = requests.Session()
http_adapter = requests.adapters.HTTPAdapter(max_retries=2)
session.mount('https://', http_adapter)


def _call_api(*path_parts, **filters):
    if settings.FEC_API_KEY:
        filters['api_key'] = settings.FEC_API_KEY

    path = os.path.join(settings.FEC_API_VERSION,
                        *[x.strip('/') for x in path_parts])
    url = parse.urljoin(settings.FEC_API_URL, path)

    results = session.get(url, params=filters)

    return results.json() if results.ok else {}


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

    if query or query_type in ['advisory_opinions', 'murs']:
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

    return results


def load_legal_advisory_opinion(ao_no):
    url = '/legal/docs/advisory_opinions/'
    results = _call_api(url, parse.quote(ao_no))

    if not (results and 'docs' in results and results['docs']):
        abort(404)

    ao = results['docs'][0]
    ao['sorted_documents'] = _get_sorted_documents(ao)
    ao['entities'] = sorted(ao['entities'], key=itemgetter('role'), reverse=True)
    return ao


def load_legal_mur(mur_no):

    url = '/legal/docs/murs/'
    mur = _call_api(url, parse.quote(mur_no))

    if not mur:
        abort(404)

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
    return _call_api(parent_type, c_id, nested_type, *path, per_page=100, **filters)


def load_with_nested(primary_type, primary_id, secondary_type, cycle=None,
                     cycle_key='cycle', **query):
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
    data = load_single_type(primary_type, primary_id, *path, per_page=1, **query)

    cycle = cycle or max(data['cycles'])

    path = ('history', str(data[cycle_key]))
    """ Get data for secondary_type
        Example: committee data for /candidate/P80003338/committees
    """
    nested_data = load_nested_type(primary_type, primary_id, secondary_type, *path, **query)
    return data, nested_data['results'], cycle


def load_cmte_financials(committee_id, **filters):
    filters.update({
        'is_amended': 'false',
        'per_page': MAX_FINANCIALS_COUNT,
        'report_type': filters.get('report_type', []) + ['-TER'],
        'sort_hide_null': 'true',
    })

    reports = _call_api('committee', committee_id, 'reports', **filters)
    totals = _call_api('committee', committee_id, 'totals', **filters)

    return {
        'reports': reports['results'],
        'totals': totals['results'],
    }


def load_candidate_totals(candidate_id, cycle, election_full=True):
    response = _call_api(
        'candidate', candidate_id, 'totals',
        cycle=cycle, full_election=election_full,
    )

    return response['results'][0] if response['results'] else None


def load_candidate_statement_of_candidacy(candidate_id, cycle):
    response = _call_api(
        'filings',
        candidate_id=candidate_id, form_type='F2'
    )

    # Cycle is always the even year; so to include odd year statements,
    # check for greater than or equal to the odd year
    year = cycle - 1

    if 'results' in response:
        return [statement for statement in response['results'] if statement['election_year'] >= year]
    else:
        return []


def result_or_404(data):
    if not data.get('results'):
        abort(404)
    return data['results'][0]


def load_top_candidates(sort, office=None, cycle=constants.DEFAULT_TIME_PERIOD, per_page=5):
        response = _call_api(
            'candidates', 'totals',
            sort_hide_null=True,
            cycle=cycle,
            election_full=False,
            office=office,
            sort=sort,
            per_page=per_page
        )

        return response if 'results' in response else None


def load_top_pacs(sort, cycle=constants.DEFAULT_TIME_PERIOD, per_page=5):
        response = _call_api(
            'totals', 'pac',
            sort_hide_null=True, cycle=cycle, sort=sort, per_page=per_page
        )
        return response if 'results' in response else None


def load_top_parties(sort, cycle=constants.DEFAULT_TIME_PERIOD, per_page=5):
        response = _call_api(
            'totals', 'party',
            sort_hide_null=True, cycle=cycle, sort=sort, per_page=per_page
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
    sorted_documents = sorted(ao['documents'], key=itemgetter('description', 'document_id'), reverse=False)
    sorted_documents = sorted(sorted_documents, key=itemgetter('date'), reverse=True)
    return sorted_documents
