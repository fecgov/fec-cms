from django.shortcuts import render, redirect
from django.urls import reverse
from django.http import Http404
from django.http import JsonResponse
from django.conf import settings

from distutils.util import strtobool

import requests
import datetime
import github3
import json
import re

from data import api_caller
from data import constants
from data import utils


def groupby(values, keygetter):
    ret = {}
    for value in values:
        key = keygetter(value)
        ret.setdefault(key, []).append(value)
    return ret


election_durations = {'P': 4, 'S': 6, 'H': 2}

report_types = {
    'P': 'presidential',
    'S': 'house-senate',
    'H': 'house-senate',
    'I': 'ie-only',
}

validListUrlParamValues = ['P', 'S', 'H']
# INITIALLY USED BY raising() AND spending() FOR VALIDATING URL PARAMETERS, THE list URL PARAM

def to_date(committee, cycle):
    if committee['committee_type'] in ['H', 'S', 'P']:
        return None
    return min(datetime.datetime.now().year, int(cycle))


def aggregate_totals(request):
    office = request.GET.get('office', 'P')

    election_year = int(request.GET.get('election_year', constants.DEFAULT_ELECTION_YEAR))

    max_election_year = utils.current_cycle() + 4
    election_years = utils.get_cycles(max_election_year)

    FEATURES = settings.FEATURES

    return render(
        request,
        'widgets/aggregate-totals.jinja',
        {
            'title': 'Aggregate Totals',
            'election_years': election_years,
            'election_year': election_year,
            'office': office,
            'FEATURES': FEATURES,
            'social_image_identifier': 'data',
        }
    )

def landing(request):
    top_candidates_raising = api_caller.load_top_candidates('-receipts', per_page=3)

    return render(
        request,
        'landing.jinja',
        {
            'parent':'data',
            'title': 'Campaign finance data',
            'dates': utils.date_ranges(),
            'top_candidates_raising': top_candidates_raising['results']
            if top_candidates_raising
            else None,
            'first_of_year': datetime.date(datetime.date.today().year, 1, 1).strftime(
                '%m/%d/%Y'
            ),
            'last_of_year': datetime.date(datetime.date.today().year, 12, 31).strftime(
                '%m/%d/%Y'
            ),
            'social_image_identifier': 'data',
        },
    )


def search(request):
    """Renders the data search results page

    If the string is a 16 or 11 digit number then it will redirect to
    the page-by-page viewer.

    If there's no query, then we'll load the main landing page with all the
    necessary data.
    """
    query = request.GET.get('search', '')

    if re.match('\d{16}', query) or re.match('\d{11}', query):
        url = 'http://docquery.fec.gov/cgi-bin/fecimg/?' + query
        return redirect(url)
    else:
        results = api_caller.load_search_results(query)
        return render(
            request,
            'search-results.jinja',
            {'query': query, 'title': 'Search results', 'results': results},
        )


def browse_data(request):
    return render(
        request,
        'browse-data.jinja',
        {
            'title': 'Browse data',
            'parent': 'data',
            'social_image_identifier': 'data',
        }
    )


def get_candidate(candidate_id, cycle, election_full):
    """
    1) By passing parameter "candidate_id" to get candidate data.
    2) "cycle" and "election_full" are optional parameters.
       if no election_full, election_full = true.
       if no cycle, cycle = the latest item in rounded_election_years.
    3) totally call 5-6 endpoints.
    """

    # (1)call candidate/{candidate_id}/history/ under tag:candidate
    # get rounded_election_years(candidate_election_year).
    path = '/candidate/' + candidate_id + '/history/'
    filters = {}
    filters['per_page'] = 1
    candidate = api_caller.load_first_row_data(path, **filters)

    # a)Build List: even_election_years for candidate election dropdown list
    #   on candidate profile page.
    # b)rounded_election_years round up any odd year special election_year
    #   to even number. (ex:2017=>2018)
    # even_election_years = candidate.get('rounded_election_years')

    # if cycle = null, set cycle = the last of rounded_election_years.
    if not cycle:
        cycle = max(candidate.get('rounded_election_years'))

    # (2)call candidate/{candidate_id}/history/{cycle} under tag:candidate
    # (3)call candidate/{candidate_id}/committees/history/{cycle}
    # under tag:committee.
    candidate, committees, cycle = api_caller.load_with_nested(
        'candidate',
        candidate_id,
        'committees',
        cycle=cycle,
        election_full=election_full,
    )

    result_type = 'candidates'
    duration = election_durations.get(candidate['office'], 2)
    min_cycle = cycle - duration if election_full else cycle
    report_type = report_types.get(candidate['office'])

    # For JavaScript
    context_vars = {
        'cycles': candidate['fec_cycles_in_election'],
        'name': candidate['name'],
        'cycle': cycle,
        'electionFull': election_full,
        'candidateID': candidate['candidate_id'],
    }

    max_cycle = int(cycle)
    # Check if cycle > latest_fec_cycles_in_election, such as:future candidate.
    if candidate['fec_cycles_in_election']:
        latest_fec_cycles_in_election = max(candidate['fec_cycles_in_election'])
        if int(cycle) > latest_fec_cycles_in_election:
            max_cycle = latest_fec_cycles_in_election

    # Annotate committees with most recent available cycle
    aggregate_cycles = (
        list(range(cycle, cycle - duration, -2)) if election_full else [cycle]
    )
    for committee in committees:
        committee['related_cycle'] = committee['cycle']

    # Group the committees by designation
    committee_groups = groupby(committees, lambda each: each['designation'])
    committees_authorized = committee_groups.get(
        'P', []
    ) + committee_groups.get(
        'A', []
    )

    committee_ids = [
        committee['committee_id']for committee in committees_authorized
    ]

    # (4)call candidate/{candidate_id}/totals/{cycle} under tag:candidate
    # Get aggregate totals for the financial summary
    filters['election_full'] = election_full
    filters['cycle'] = cycle
    path = '/candidate/' + candidate_id + '/totals/'
    aggregate = api_caller.load_first_row_data(path, **filters)

    if election_full:
        # (5)if election_full is true, need call
        # candidate/{candidate_id}/totals/{cycle} second time
        # for showing on raising and spending tabs
        # Get most recent 2-year period totals
        filters['election_full'] = False
        filters['cycle'] = max_cycle
        two_year_totals = api_caller.load_first_row_data(path, **filters)
    else:
        two_year_totals = aggregate

    if aggregate:
        raising_summary = utils.process_raising_data(aggregate)
        spending_summary = utils.process_spending_data(aggregate)
        cash_summary = utils.process_cash_data(aggregate)
    else:
        raising_summary = None
        spending_summary = None
        cash_summary = None

    # (6)Call /filings?candidate_id=P00003392&form_type=F2
    # Get the statements of candidacy
    statement_of_candidacy = api_caller.load_candidate_statement_of_candidacy(
        candidate['candidate_id'], cycle=cycle
    )

    if statement_of_candidacy:
        for statement in statement_of_candidacy:
            # convert string to python datetime and parse for readable output
            statement['receipt_date'] = datetime.datetime.strptime(
                statement['receipt_date'], '%Y-%m-%dT%H:%M:%S'
            )
            statement['receipt_date'] = statement['receipt_date'].strftime(
                '%m/%d/%Y'
            )

    # Get all the elections
    elections = sorted(
        zip(candidate['election_years'], candidate['election_districts']),
        key=lambda pair: pair[0],
        reverse=True,
    )

    # (7)call efile/filings/ under tag:efiling
    # Check if there are raw_filings for this candidate
    raw_filing_start_date = utils.three_days_ago()
    filters['min_receipt_date'] = raw_filing_start_date
    filters['committee_id'] = candidate['candidate_id']
    filters['cycle'] = cycle
    filters['per_page'] = 100
    path = '/efile/' + '/filings/'
    raw_filings = api_caller.load_endpoint_data(path, **filters)
    has_raw_filings = True if raw_filings.get('results') else False
    return {
        'aggregate': aggregate,
        'aggregate_cycles': aggregate_cycles,
        'candidate': candidate,
        'candidate_id': candidate_id,
        'cash_summary': cash_summary,
        'committee_groups': committee_groups,
        'committee_ids': committee_ids,
        # filings endpoint takes candidate ID value as committee ID arg
        'committee_id': candidate['candidate_id'],
        'committees_authorized': committees_authorized,
        'context_vars': context_vars,
        'cycle': int(cycle),
        'cycles': candidate['fec_cycles_in_election'],
        'district': candidate['district'],
        'duration': duration,
        'election_year': cycle,
        'election_years': candidate.get('rounded_election_years'),
        'elections': elections,
        'has_raw_filings': has_raw_filings,
        'incumbent_challenge_full': candidate['incumbent_challenge_full'],
        'max_cycle': max_cycle,
        'min_cycle': min_cycle,
        'min_receipt_date': raw_filing_start_date,
        'name': candidate['name'],
        'office': candidate['office'],
        'office_full': candidate['office_full'],
        'party_full': candidate['party_full'],
        'raising_summary': raising_summary,
        'report_type': report_type,
        'result_type': result_type,
        'show_full_election': election_full,
        'spending_summary': spending_summary,
        'state': candidate['state'],
        'statement_of_candidacy': statement_of_candidacy,
        'two_year_totals': two_year_totals,
        'social_image_identifier': 'data',
    }


def candidate(request, candidate_id):
    """
    Take in the request, call get_candidate
    to get the required information from the API,
    and render the candidate profile page template
    """
    cycle = request.GET.get('cycle', None)
    if cycle is not None:
        cycle = int(cycle)

    election_full = request.GET.get('election_full', True)
    election_full = bool(strtobool(str(election_full)))

    candidate = get_candidate(candidate_id, cycle, election_full)
    return render(request, 'candidates-single.jinja', candidate)


def get_committee(committee_id, cycle):
    """
    Given a committee_id and cycle, call the API and get the committee
    and committee financial data needed to render the committee profile page
    """

    redirect_to_previous = False if cycle else True
    committee, all_candidates, cycle = api_caller.get_committee_all_candidates_cycle(
        'committee',
        committee_id,
        'candidates',
        cycle,
        election_full=False,
    )

    # When there are multiple candidate records of various offices (H, S, P)
    # linked to a single committee ID,
    # associate the candidate record with the matching committee type
    candidates = [
        candidate
        for candidate in all_candidates
        if committee['committee_type'] == candidate['office']
    ]

    parent = 'data'
    result_type = 'committees'
    cycle = int(cycle)
    year = to_date(committee, cycle)

    # Link to current cycle if candidate has a corresponding page, else link
    # without cycle query parameter
    # See https://github.com/fecgov/openFEC/issues/1536
    for candidate in candidates:
        election_years = []
        for election_year in candidate['election_years']:
            start_of_election_period = (
                election_year - election_durations[candidate['office']]
            )
            if start_of_election_period < cycle and cycle <= election_year:
                election_years.append(election_year)
        # For each candidate, set related_cycle to the candidate's time period
        # relative to the selected cycle.
        candidate['related_cycle'] = cycle if election_years else None

    # Load financial totals and reports for the committee
    financials = api_caller.load_cmte_financials(committee_id, committee, cycle)
    report_type = report_types.get(committee['committee_type'], 'pac-party')
    reports = financials['reports']
    totals = financials['totals']

    # Check organization types to determine SSF status
    is_SSF = committee.get('organization_type') in ['W','C','L','V','M','T']

    context_vars = {
        'cycle': cycle,
        'timePeriod': str(int(cycle) - 1) + '–' + str(cycle),
        'name': committee['name'],
    }

    template_variables = {
        'name': committee['name'],
        'committee': committee,
        'committee_id': committee_id,
        'committee_type': committee['committee_type'],
        'committee_type_full': committee['committee_type_full'],
        'affiliated_committee_name': committee['affiliated_committee_name'],
        'organization_type': committee['organization_type'],
        'organization_type_full': committee['organization_type_full'],
        'is_SSF': is_SSF,
        'designation_full': committee['designation_full'],
        'street_1': committee['street_1'],
        'street_2': committee['street_2'],
        'city': committee['city'],
        'state': committee['state'],
        'zip': committee['zip'],
        'treasurer_name': committee['treasurer_name'],
        'parent': parent,
        'cycle': cycle,
        'cycles': committee['cycles'],
        'year': year,
        'result_type': result_type,
        'report_type': report_type,
        'reports': reports,
        'totals': totals,
        'min_receipt_date': utils.three_days_ago(),
        'context_vars': context_vars,
        'party_full': committee['party_full'],
        'candidates': candidates,
        'social_image_identifier': 'data',
    }

    if financials['reports'] and financials['totals']:
        # Format the current two-year-period's totals using the process utilities
        if committee['committee_type'] == 'I':
            # IE-only committees have very little data, so they just get this one
            template_variables['ie_summary'] = utils.process_ie_data(
                financials['totals'][0]
            )
        # Inaugural Committees
        elif committee['organization_type'] == 'I':
            template_variables['inaugural_summary'] = utils.process_inaugural_data(
                financials['totals'][0]
            )
        # Host Committees that file on Form 4
        elif (
            committee['organization_type'] == 'H'
            and financials['reports'][0]['report_form'] == 'Form 4'
        ):
            template_variables['raising_summary'] = utils.process_host_raising_data(
                financials['totals'][0]
            )
            template_variables['spending_summary'] = utils.process_host_spending_data(
                financials['totals'][0]
            )
            template_variables['cash_summary'] = utils.process_cash_data(
                financials['totals'][0]
            )
        else:
            # All other committees have three tables
            template_variables['raising_summary'] = utils.process_raising_data(
                financials['totals'][0]
            )
            template_variables['spending_summary'] = utils.process_spending_data(
                financials['totals'][0]
            )
            template_variables['cash_summary'] = utils.process_cash_data(
                financials['totals'][0]
            )

    # If there are no reports, find the first cycle with reports and start again
    if redirect_to_previous and not financials['reports']:
        for previous_cycle in sorted(committee['cycles'], reverse=True):
            financials = api_caller.load_cmte_financials(
                committee['committee_id'], cycle=previous_cycle
            )
            if financials['reports']:
                # Start again with the given cycle
                return get_committee(committee_id, previous_cycle)

    # If we're in the current cycle, check for raw filings in the last three days
    if cycle == utils.current_cycle():
        raw_filings = api_caller._call_api(
            'efile',
            'filings',
            cycle=cycle,
            committee_id=committee['committee_id'],
            min_receipt_date=template_variables['min_receipt_date'],
        )
        template_variables['has_raw_filings'] = (
            True if raw_filings.get('results') else False
        )
    else:
        template_variables['has_raw_filings'] = False

    # Needed for filings tab
    template_variables['filings_lookup'] = {
        'reports': ['F3', 'F3X', 'F3P', 'F3L', 'F4', 'F5', 'F7', 'F13'],
        'notices': ['F5', 'F24', 'F6', 'F9', 'F10', 'F11'],
        'statements': ['F1'],
        'other': ['F1M', 'F8', 'F99', 'F12'],
    }

    return template_variables


def committee(request, committee_id):
    """
    Take in the request, call get_committee to get the required information
    from the API, and render the committee profile page template
    """

    cycle = request.GET.get('cycle', None)
    committee = get_committee(committee_id, cycle)
    return render(request, 'committees-single.jinja', committee)


def elections_lookup(request):

    cycle = constants.DEFAULT_ELECTION_YEAR
    cycles = utils.get_cycles(cycle + 4)

    return render(
        request,
        'election-lookup.jinja',
        {'parent': 'data', 'cycles': cycles, 'cycle': cycle, 'social_image_identifier': 'data',},
    )


def elections(request, office, cycle, state=None, district=None):
    cycle = int(cycle)

    max_cycle = utils.current_cycle() + 4
    cycles = utils.get_cycles(max_cycle)

    if office.lower() == 'president':
        cycles = [each for each in cycles if each % 4 == 0]
    elif office.lower() == 'senate':
        cycles = api_caller.get_all_senate_cycles(state)

    if office.lower() not in ['president', 'senate', 'house']:
        raise Http404()
    if (state is not None) and (state and state.upper() not in constants.states):
        raise Http404()

    election_duration = election_durations.get(office[0].upper(), 2)
    # Puerto Rico house/resident commissioners have 4-year cycles
    if state and state.upper() == 'PR':
        election_duration = 4

    # map/redirect legacy tab names to correct anchor
    tab = request.GET.get('tab', '').replace('/', '')
    legacy_tabs = {
        'contributions': '#individual-contributions',
        'totals': '#candidate-financial-totals',
        'spending-by-others': '#independent-expenditures',
    }

    if tab in legacy_tabs:
        if office == 'house':
            return redirect(
                reverse('elections-house', args=(office, state, district, cycle))
                + legacy_tabs[tab]
            )
        elif office == 'senate':
            return redirect(
                reverse('elections-senate', args=(office, state, cycle))
                + legacy_tabs[tab]
            )
        elif office == 'president':
            return redirect(
                reverse('elections-president', args=(office, cycle)) + legacy_tabs[tab]
            )

    return render(
        request,
        'elections.jinja',
        {
            'office': office,
            'office_code': office[0],
            'parent': 'data',
            'cycle': cycle,
            'election_duration': election_duration,
            'cycles': cycles,
            'state': state,
            'state_full': constants.states[state.upper()] if state else None,
            'district': district,
            'title': utils.election_title(cycle, office, state, district),
            'social_image_identifier': 'data',
        },
    )


def raising(request):
    office = request.GET.get('office', 'P')

    election_year = int(request.GET.get('election_year', constants.DEFAULT_ELECTION_YEAR))

    max_election_year = utils.current_cycle() + 4
    election_years = utils.get_cycles(max_election_year)

    return render(
        request,
        'raising-bythenumbers.jinja',
        {
            'parent': 'data',
            'title': 'Raising: by the numbers',
            'election_years': election_years,
            'election_year': election_year,
            'office': office,
            'social_image_identifier': 'data',
        },
    )


def spending(request):
    office = request.GET.get('office', 'P')

    election_year = int(request.GET.get('election_year', constants.DEFAULT_ELECTION_YEAR))

    max_election_year = utils.current_cycle() + 4
    election_years = utils.get_cycles(max_election_year)

    return render(
        request,
        'spending-bythenumbers.jinja',
        {
            'parent': 'data',
            'title': 'Spending: by the numbers',
            'election_years': election_years,
            'election_year': election_year,
            'office': office,
            'social_image_identifier': 'data',
        },
    )


def feedback(request):
    if request.method == 'POST':

        # json.loads() is expecting a string in JSON format:
        # '{"param":"value"}'. Needs to be decoded in Python 3
        data = json.loads(request.body.decode("utf-8"))

        if not any(
            [
                data['action'],
                data['feedback'],
                data['about'],
                data['g-recaptcha-response'],
            ]
        ):
            return JsonResponse({'status': False}, status=500)
        else:
            # verify recaptcha
            verifyRecaptcha = requests.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    'secret': settings.FEC_RECAPTCHA_SECRET_KEY,
                    'response': data['g-recaptcha-response'],
                },
            )
            recaptchaResponse = verifyRecaptcha.json()
            if not recaptchaResponse['success']:
                # if captcha failed, return failure
                return JsonResponse({'status': False}, status=500)
            else:
                # captcha passed, we're ready to submit the issue.
                title = 'User feedback on ' + request.META.get('HTTP_REFERER')
                body = ("## What were you trying to do and how can we improve it?\n %s \n\n"
                        "## General feedback?\n %s \n\n"
                        "## Tell us about yourself\n %s \n\n"
                        "## Details\n"
                        "* URL: %s \n"
                        "* User Agent: %s") % (
                            data['action'],
                            data['feedback'],
                            data['about'],
                            request.META.get('HTTP_REFERER'),
                            request.META['HTTP_USER_AGENT'])

                client = github3.login(token=settings.FEC_GITHUB_TOKEN)
                issue = client.repository('fecgov', 'fec').create_issue(
                    title, body=body
                )

                return JsonResponse(issue.to_json(), status=201)
    else:
        raise Http404()


def reactionFeedback(request):
    if request.method == 'POST':

        # json.loads() is expecting a string in JSON format:
        # '{"param":"value"}'. Needs to be decoded in Python 3
        data = json.loads(request.body.decode("utf-8"))

        if not all(
            [
                data['name'],
                data['location'],
                data['reaction'],
                data['g-recaptcha-response'],
                data['userAgent'],
            ]
        ):
            # the required fields were not provided, return error.
            return JsonResponse({'status': False}, status=500)
        else:
            # verify recaptcha
            verifyRecaptcha = requests.post(
                "https://www.google.com/recaptcha/api/siteverify", data={'secret': settings.FEC_RECAPTCHA_SECRET_KEY, 'response': data['g-recaptcha-response']})
            recaptchaResponse = verifyRecaptcha.json()
            if not recaptchaResponse['success']:
                # if captcha failed, return failure
                return JsonResponse({'status': False}, status=500)
            else:
                # captcha passed, we're ready to submit the issue.
                title = 'User feedback on ' + request.META.get('HTTP_REFERER')
                body = (
                    "## What were you trying to do and how can we improve it?\n %s \n\n"
                    "## General feedback?\n %s \n\n"
                    "## Tell us about yourself\n %s \n\n"
                    "## Details\n"
                    "* URL: %s \n"
                    "* User Agent: %s"
                ) % (
                    "\nChart Name: " + data['name'] + "\nChart Location: " + data['location'],
                    data['feedback'],
                    "\nThe reaction to the chart is: " + data['reaction'],
                    request.META.get('HTTP_REFERER'),
                    data['userAgent'],
                )

                client = github3.login(token=settings.FEC_GITHUB_TOKEN)
                issue = client.repository('fecgov', 'fec').create_issue(title, body=body)

                return JsonResponse(issue.to_json(), status=201)
    else:
        raise Http404()
