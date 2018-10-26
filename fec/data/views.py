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


def to_date(committee, cycle):
    if committee['committee_type'] in ['H', 'S', 'P']:
        return None
    return min(datetime.datetime.now().year, int(cycle))


def landing(request):
    top_candidates_raising = api_caller.load_top_candidates('-receipts', per_page=3)

    return render(
        request,
        'landing.jinja',
        {
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


def advanced(request):
    return render(request, 'advanced.jinja', {'title': 'Advanced data'})


def get_candidate(candidate_id, cycle, election_full):
    """
    Given candidate_id, cycle, election_full, call the API and get the candidate
    and candidate financial data needed to render the candidate profile page
    """

    candidate, committees, cycle = api_caller.load_with_nested(
        'candidate',
        candidate_id,
        'committees',
        cycle=cycle,
        cycle_key='two_year_period',
        election_full=election_full,
    )
    # cycle corresponds to the two-year period for which the committee has financial activity.
    # when selected election cycle is not in list of election years, get the next election cycle
    if election_full and cycle and cycle not in candidate['election_years']:

        next_cycle = next(
            (year for year in sorted(candidate['election_years']) if year > cycle),
            max(candidate['election_years']),
        )

        # If the next_cycle is odd set it to whatever the cycle value was- falls back to the cycle
        # and then set election_full to false
        # This solves issue# 1945 with odd year special elections
        if next_cycle % 2 > 0:
            next_cycle = cycle
            election_full = False
        # get the next election cycle data for this candidate
        candidate, committees, cycle = api_caller.load_with_nested(
            'candidate',
            candidate_id,
            'committees',
            cycle=next_cycle,
            cycle_key='two_year_period',
            election_full=election_full,
        )

    # Addresses issue#1644 - make any odd year special election an even year
    #  for displaying elections for pulldown menu in Candidate pages
    #  Using Set to ensure no duplicate years in final list
    even_election_years = list(
        {year + (year % 2) for year in candidate.get('election_years', [])}
    )

    election_year = next(
        (year for year in sorted(even_election_years) if year >= cycle), None
    )

    # If the candidate is not running in a future election,
    # return the most recent even eleciton year
    if not election_year:
        election_year = max(even_election_years)

    result_type = 'candidates'
    duration = election_durations.get(candidate['office'], 2)
    min_cycle = cycle - duration if election_full else cycle
    report_type = report_types.get(candidate['office'])

    # For JavaScript
    context_vars = {
        'cycles': candidate['cycles'],
        'name': candidate['name'],
        'cycle': cycle,
        'electionFull': election_full,
        'candidateID': candidate['candidate_id'],
    }

    # In the case of when a presidential or senate candidate has filed
    # for a future year that's beyond the current cycle,
    # set a max_cycle var to the current cycle we're in
    # and when calling the API for totals, set election_full to False.
    # The max_cycle value is also referenced in the templates for setting
    # the cycle for itemized tables. Because these are only in 2-year chunks,
    # the cycle should never be beyond the one we're in.
    cycles = [cycle for cycle in candidate['cycles'] if cycle <= utils.current_cycle()]
    max_cycle = cycle if cycle <= utils.current_cycle() else utils.current_cycle()
    show_full_election = election_full if cycle <= utils.current_cycle() else False

    # Annotate committees with most recent available cycle
    aggregate_cycles = (
        list(range(cycle, cycle - duration, -2)) if election_full else [cycle]
    )
    for committee in committees:
        committee['related_cycle'] = (
            max(cycle for cycle in aggregate_cycles if cycle in committee['cycles'])
            if election_full
            else candidate['two_year_period']
        )

    # Group the committees by designation
    committee_groups = groupby(committees, lambda each: each['designation'])
    committees_authorized = committee_groups.get('P', []) + committee_groups.get(
        'A', []
    )

    committee_groups = committee_groups
    committees_authorized = committees_authorized
    committee_ids = [committee['committee_id'] for committee in committees_authorized]

    # Get aggregate totals for the financial summary
    # And pass through the data processing utils
    aggregate = api_caller.load_candidate_totals(
        candidate['candidate_id'], cycle=max_cycle, election_full=election_full
    )
    if aggregate:
        raising_summary = utils.process_raising_data(aggregate)
        spending_summary = utils.process_spending_data(aggregate)
        cash_summary = utils.process_cash_data(aggregate)
    else:
        raising_summary = None
        spending_summary = None
        cash_summary = None

    aggregate = aggregate

    # Get totals for the last two-year period of a cycle for showing on
    # raising and spending tabs
    two_year_totals = api_caller.load_candidate_totals(
        candidate['candidate_id'], cycle=max_cycle, election_full=False
    )

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
            statement['receipt_date'] = statement['receipt_date'].strftime('%m/%d/%Y')

    # Get all the elections
    elections = sorted(
        zip(candidate['election_years'], candidate['election_districts']),
        key=lambda pair: pair[0],
        reverse=True,
    )

    return {
        'name': candidate['name'],
        'cycle': int(cycle),
        'office': candidate['office'],
        'office_full': candidate['office_full'],
        'state': candidate['state'],
        'district': candidate['district'],
        'candidate_id': candidate_id,
        'party_full': candidate['party_full'],
        'incumbent_challenge_full': candidate['incumbent_challenge_full'],
        'election_year': election_year,
        'election_years': even_election_years,
        'result_type': result_type,
        'duration': duration,
        'min_cycle': min_cycle,
        'report_type': report_type,
        'cycles': cycles,
        'max_cycle': max_cycle,
        'show_full_election': show_full_election,
        'committee_groups': committee_groups,
        'committees_authorized': committees_authorized,
        'committee_ids': committee_ids,
        'raising_summary': raising_summary,
        'spending_summary': spending_summary,
        'cash_summary': cash_summary,
        'aggregate': aggregate,
        'two_year_totals': two_year_totals,
        'statement_of_candidacy': statement_of_candidacy,
        'elections': elections,
        'candidate': candidate,
        'context_vars': context_vars,
    }


def candidate(request, candidate_id):
    """
    Take in the request, call get_candidate to get the required information
    from the API, and render the candidate profile page template
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
    committee, all_candidates, cycle = api_caller.load_with_nested(
        'committee', committee_id, 'candidates', cycle
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
    financials = api_caller.load_cmte_financials(committee_id, cycle=cycle)
    report_type = report_types.get(committee['committee_type'], 'pac-party')
    reports = financials['reports']
    totals = financials['totals']

    context_vars = {
        'cycle': cycle,
        'timePeriod': str(int(cycle) - 1) + '–' + str(cycle),
        'name': committee['name'],
    }

    template_variables = {
        'name': committee['name'],
        'committee': committee,
        'committee_id': committee_id,
        'committee_type_full': committee['committee_type_full'],
        'committee_type': committee['committee_type'],
        'organization_type': committee['organization_type'],
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
        if len(raw_filings.get('results')) > 0:
            template_variables['has_raw_filings'] = True
    else:
        template_variables['has_raw_filings'] = False

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

    cycle = utils.current_cycle()
    cycles = utils.get_cycles(cycle + 4)

    return render(
        request,
        'election-lookup.jinja',
        {'parent': 'data', 'cycles': cycles, 'cycle': cycle},
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

    # map/redirect legacy tab names to correct anchor
    tab = request.GET.get('tab', '').replace('/', '')
    legacy_tabs = {
        'contributions': '#individual-contributions',
        'totals': '#candidate-financial-totals',
        'spending-by-others': '#independent-expenditures',
    }

    if tab in legacy_tabs.keys():
        if office == 'senate' or office == 'house':
            return redirect(
                reverse(
                    'elections-state-district', args=(office, state, district, cycle)
                )
                + legacy_tabs[tab]
            )
        if office == 'president':
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
            'cycles': cycles,
            'state': state,
            'state_full': constants.states[state.upper()] if state else None,
            'district': district,
            'title': utils.election_title(cycle, office, state, district),
        },
    )


def raising(request):
    top_category = request.GET.get('top_category', 'P')
    cycles = utils.get_cycles(utils.current_cycle())
    cycle = request.GET.get('cycle', constants.DEFAULT_TIME_PERIOD)

    if top_category in ['pac']:
        top_raisers = api_caller.load_top_pacs('-receipts', cycle=cycle, per_page=10)
    elif top_category in ['party']:
        top_raisers = api_caller.load_top_parties('-receipts', cycle=cycle, per_page=10)
    else:
        top_raisers = api_caller.load_top_candidates(
            '-receipts', office=top_category, cycle=cycle, per_page=10
        )

    if cycle == datetime.datetime.today().year:
        coverage_end_date = datetime.datetime.today()
    else:
        coverage_end_date = datetime.date(cycle, 12, 31)

    page_info = top_raisers['pagination']

    return render(
        request,
        'raising-bythenumbers.jinja',
        {
            'parent': 'data',
            'title': 'Raising: by the numbers',
            'top_category': top_category,
            'coverage_start_date': datetime.date(cycle - 1, 1, 1),
            'coverage_end_date': coverage_end_date,
            'cycles': cycles,
            'cycle': cycle,
            'top_raisers': top_raisers['results'],
            'page_info': utils.page_info(top_raisers['pagination']),
        },
    )


def spending(request):
    top_category = request.GET.get('top_category', 'P')
    cycles = utils.get_cycles(utils.current_cycle())
    cycle = request.GET.get('cycle', constants.DEFAULT_TIME_PERIOD)

    if top_category in ['pac']:
        top_spenders = api_caller.load_top_pacs(
            '-disbursements', cycle=cycle, per_page=10
        )
    elif top_category in ['party']:
        top_spenders = api_caller.load_top_parties(
            '-disbursements', cycle=cycle, per_page=10
        )
    else:
        top_spenders = api_caller.load_top_candidates(
            '-disbursements', office=top_category, cycle=cycle, per_page=10
        )

    if cycle == datetime.datetime.today().year:
        coverage_end_date = datetime.datetime.today()
    else:
        coverage_end_date = datetime.date(cycle, 12, 31)

    return render(
        request,
        'spending-bythenumbers.jinja',
        {
            'parent': 'data',
            'title': 'Spending: by the numbers',
            'top_category': top_category,
            'coverage_start_date': datetime.date(cycle - 1, 1, 1),
            'coverage_end_date': coverage_end_date,
            'cycles': cycles,
            'cycle': cycle,
            'top_spenders': top_spenders['results'],
            'page_info': utils.page_info(top_spenders['pagination']),
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
        ) :
            # the required fields were not provided, return error.
            return JsonResponse({'status': False}, status=500)
        else:
            # verify recaptcha
            verifyRecaptcha = requests.post("https://www.google.com/recaptcha/api/siteverify", data={'secret': settings.FEC_RECAPTCHA_SECRET_KEY, 'response': data['g-recaptcha-response']})
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
