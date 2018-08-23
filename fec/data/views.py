from django.shortcuts import render, redirect
from django.urls import reverse
from django.http import Http404
from django.http import JsonResponse
from django.conf import settings

from distutils.util import strtobool

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

election_durations = {
    'P': 4,
    'S': 6,
    'H': 2,
}

report_types = {
    'P': 'presidential',
    'S': 'house-senate',
    'H': 'house-senate',
    'I': 'ie-only'
}


def to_date(committee, cycle):
    if committee['committee_type'] in ['H', 'S', 'P']:
        return None
    return min(datetime.datetime.now().year, int(cycle))


def landing(request):
    top_candidates_raising = api_caller.load_top_candidates('-receipts', per_page=3)

    return render(request, 'landing.jinja', {
        'title': 'Campaign finance data',
        'dates': utils.date_ranges(),
        'top_candidates_raising': top_candidates_raising['results'] if top_candidates_raising else None,
        'first_of_year': datetime.date(datetime.date.today().year, 1, 1).strftime('%m/%d/%Y'),
        'last_of_year': datetime.date(datetime.date.today().year, 12, 31).strftime('%m/%d/%Y'),
    })


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
        return render(request, 'search-results.jinja', {
            'query': query,
            'title': 'Search results',
            'results': results
        })


def advanced(request):
    return render(request, 'advanced.jinja', {
        'title': 'Advanced data'
    })


def cycle_in_range(cycle):
    try:
        return cycle <= utils.current_cycle()
    except:
        return False


def candidate(request, candidate_id):

    # grab url query string parameters
    show_full_election = bool(request.GET.get('election_full', True))

    request_cycle = request.GET.get('cycle', None)
    if request_cycle:
        request_cycle = int(request_cycle)

    candidate, committees, latest_cycle = api_caller.load_with_nested(
        'candidate', candidate_id, 'committees',
        cycle=request_cycle, cycle_key='two_year_period',
        election_full=show_full_election,
    )

    if cycle_in_range(request_cycle):
        cycle = request_cycle
    else:
        cycle = latest_cycle

    duration = election_durations.get(candidate['office'], 2)
    report_type = report_types.get(candidate['office'])

    cycles = [year for year in candidate['cycles'] if cycle_in_range(year)]
    min_cycle = cycle - duration if show_full_election else cycle

    # For elections dropdown menu in Candidate pages
    # Round any odd year special election an even year
    # Use Set to ensure no duplicate years in final list
    even_election_years = list(
        {year + (year % 2) for year in candidate.get('election_years', [])}
    )

    election_year = next(
        (year for year in sorted(candidate['election_years']) if year >= cycle),
        None,
    )

    committee_groups = groupby(committees, lambda each: each['designation'])
    authorized_committee_ids = [
        committee['committee_id'] for committee in committees
        if committee.get('designation') in ('P', 'A')
    ]

    # Get aggregate totals for the financial summary
    aggregate = api_caller.load_candidate_totals(
        candidate['candidate_id'],
        cycle=cycle,
        election_full=show_full_election,
    )
    if aggregate:
        raising_summary = utils.process_raising_data(aggregate)
        spending_summary = utils.process_spending_data(aggregate)
        cash_summary = utils.process_cash_data(aggregate)
    else:
        raising_summary = None
        spending_summary = None
        cash_summary = None

    # Get most recent totals for raising and spending tabs
    two_year_totals = api_caller.load_candidate_totals(
        candidate['candidate_id'],
        cycle=cycle,
        election_full=False
    )

    # Get the statements of candidacy
    statement_of_candidacy = api_caller.load_candidate_statement_of_candidacy(
        candidate['candidate_id'],
        cycle=cycle
    )

    # For JavaScript
    context_vars = {
        'cycles': candidate['cycles'],
        'name': candidate['name'],
        'cycle': cycle,
        'electionFull': show_full_election,
        'candidateID': candidate['candidate_id']
    }

    return render(request, 'candidates-single.jinja', {
        'name': candidate['name'],
        'cycle': int(cycle),
        'office': candidate['office'],
        'office_full': candidate['office_full'],
        'state': candidate['state'],
        'district': candidate['district'],
        'candidate_id': candidate_id,
        'party_full': candidate['party_full'],
        'incumbent_challenge_full': candidate['incumbent_challenge_full'],
        'election_years': even_election_years,
        'election_year': election_year,
        'result_type': 'candidates',
        'duration': duration,
        'min_cycle': min_cycle,
        'report_type': report_type,
        'cycles': cycles,
        'max_cycle': latest_cycle,
        'show_full_election': show_full_election,
        'committee_groups': committee_groups,
        'committee_ids': authorized_committee_ids,
        'raising_summary': raising_summary,
        'spending_summary': spending_summary,
        'cash_summary': cash_summary,
        'aggregate': aggregate,
        'two_year_totals': two_year_totals,
        'statement_of_candidacy': statement_of_candidacy,
        'candidate': candidate,
        'context_vars': context_vars
    })


def committee(request, committee_id):
    # grab url query string parameters
    cycle = request.GET.get('cycle', None)

    redirect_to_previous = False if cycle else True
    committee, all_candidates, cycle = api_caller.load_with_nested('committee', committee_id, 'candidates', cycle)

    # When there are multiple candidate records of various offices (H, S, P) linked to a single
    # committee ID, we want to associate the candidate record with the matching committee type
    # For each candidate, check if the committee type is equal to the candidate's office. If true
    # add that candidate to the list of candidates to return
    candidates = []
    for candidate in all_candidates:
        if committee['committee_type'] == candidate['office']:
            candidates.append(candidate)

    parent = 'data'
    cycle = int(cycle)
    year = to_date(committee, cycle)
    result_type = 'committees'

    # Link to current cycle if candidate has a corresponding page, else link
    # without cycle query parameter
    # See https://github.com/fecgov/openFEC/issues/1536
    # For each candidate, set related_cycle to the candidate's time period
    # relative to the selected cycle.
    for candidate in candidates:
        election_years = []
        for election_year in candidate['election_years']:
            start_of_election_period = election_year - election_durations[candidate['office']]
            if start_of_election_period < cycle and cycle <= election_year:
                election_years.append(election_year)

        candidate['related_cycle'] = cycle if election_years else None


    # Load financial totals and reports for a given committee
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
            template_variables['ie_summary'] = utils.process_ie_data(financials['totals'][0])
        else:
            # All other committees have three tables
            template_variables['raising_summary'] = utils.process_raising_data(financials['totals'][0])
            template_variables['spending_summary'] = utils.process_spending_data(financials['totals'][0])
            template_variables['cash_summary'] = utils.process_cash_data(financials['totals'][0])

    if redirect_to_previous and not financials['reports']:
        # If there's no reports, find the first year with reports and redirect there
        for c in sorted(committee['cycles'], reverse=True):
            financials = api_caller.load_cmte_financials(committee['committee_id'], cycle=c)
            if financials['reports']:
                return redirect(
                    reverse('committee-by-id', kwargs={'committee_id': committee['committee_id']}) + '?cycle=' + str(c)
                )

    # If it's not a senate committee and we're in the current cycle
    # check if there's any raw filings in the last three days
    if committee['committee_type'] != 'S' and cycle == utils.current_cycle():
        raw_filings = api_caller._call_api(
            'efile', 'filings',
            cycle=cycle,
            committee_id=committee['committee_id'],
            min_receipt_date=template_variables['min_receipt_date']
        )
        if len(raw_filings.get('results')) > 0:
            template_variables['has_raw_filings'] = True
    else:
        template_variables['has_raw_filings'] = False

    return render(request, 'committees-single.jinja', template_variables)


def elections_lookup(request):

    cycle = utils.current_cycle()
    cycles = utils.get_cycles(cycle + 4)

    return render(request, 'election-lookup.jinja', {
        'parent': 'data',
        'cycles': cycles,
        'cycle': cycle,
    })


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

    #map/redirect legacy tab names to correct anchor
    tab = request.GET.get('tab','').replace('/','')
    legacy_tabs = {
         'contributions':'#individual-contributions',
         'totals' : '#candidate-financial-totals',
         'spending-by-others':'#independent-expenditures'
         }

    if tab in legacy_tabs.keys():
        if office == 'senate' or office == 'house':
            return redirect(
               reverse('elections-state-district', args=(office,state,district,cycle)) + legacy_tabs[tab]
               )
        if office == 'president':
            return redirect(
               reverse('elections-president', args=(office,cycle)) + legacy_tabs[tab]
               )

    return render(request, 'elections.jinja', {
        'office': office,
        'office_code': office[0],
        'parent': 'data',
        'cycle': cycle,
        'cycles': cycles,
        'state': state,
        'state_full': constants.states[state.upper()] if state else None,
        'district': district,
        'title': utils.election_title(cycle, office, state, district),

    })


def raising(request):
    top_category = request.GET.get('top_category', 'P')
    cycles = utils.get_cycles(utils.current_cycle())
    cycle = request.GET.get('cycle', constants.DEFAULT_TIME_PERIOD)

    if top_category in ['pac']:
        top_raisers = api_caller.load_top_pacs('-receipts', cycle=cycle, per_page=10)
    elif top_category in ['party']:
        top_raisers = api_caller.load_top_parties('-receipts', cycle=cycle, per_page=10)
    else:
        top_raisers = api_caller.load_top_candidates('-receipts', office=top_category, cycle=cycle, per_page=10)

    if cycle == datetime.datetime.today().year:
        coverage_end_date = datetime.datetime.today()
    else:
        coverage_end_date = datetime.date(cycle, 12, 31)

    page_info = top_raisers['pagination']

    return render(request, 'raising-breakdown.jinja', {
        'parent': 'data',
        'title': 'Raising breakdown',
        'top_category': top_category,
        'coverage_start_date': datetime.date(cycle - 1, 1, 1),
        'coverage_end_date': coverage_end_date,
        'cycles': cycles,
        'cycle': cycle,
        'top_raisers': top_raisers['results'],
        'page_info': utils.page_info(top_raisers['pagination'])
    })


def spending(request):
    top_category = request.GET.get('top_category', 'P')
    cycles = utils.get_cycles(utils.current_cycle())
    cycle = request.GET.get('cycle', constants.DEFAULT_TIME_PERIOD)

    if top_category in ['pac']:
        top_spenders = api_caller.load_top_pacs('-disbursements', cycle=cycle, per_page=10)
    elif top_category in ['party']:
        top_spenders = api_caller.load_top_parties('-disbursements', cycle=cycle, per_page=10)
    else:
        top_spenders = api_caller.load_top_candidates('-disbursements', office=top_category, cycle=cycle, per_page=10)

    if cycle == datetime.datetime.today().year:
        coverage_end_date = datetime.datetime.today()
    else:
        coverage_end_date = datetime.date(cycle, 12, 31)

    return render(request, 'spending-breakdown.jinja', {
        'parent': 'data',
        'title': 'Spending breakdown',
        'top_category': top_category,
        'coverage_start_date': datetime.date(cycle - 1, 1, 1),
        'coverage_end_date': coverage_end_date,
        'cycles': cycles,
        'cycle': cycle,
        'top_spenders': top_spenders['results'],
        'page_info': utils.page_info(top_spenders['pagination'])
    })


def feedback(request):
    if request.method == 'POST':

        # json.loads() is expecting a string in JSON format:
        # '{"param":"value"}'. Needs to be decoded in Python 3
        data = json.loads(request.body.decode("utf-8"))

        if not any([data['action'], data['feedback'], data['about']]):
            return JsonResponse({'status': False}, status=500)
        else:
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
            issue = client.repository('fecgov', 'fec').create_issue(title, body=body)

            return JsonResponse(issue.to_json(), status=201)
    else:
        raise Http404()

