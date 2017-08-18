from django.shortcuts import render
from django.http import Http404

import os
import datetime

from collections import OrderedDict

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
    return min(datetime.datetime.now().year, cycle)


# TODO: load query string
def landing(request):
    return render(request, 'landing.jinja', {
      'title': 'Campaign finance data',
    })


def advanced(request):
    return render(request, 'advanced.jinja', {
        'title': 'Advanced data'
    })


def candidate(request, candidate_id):
    # grab url query string parameters
    cycle = request.GET.get('cycle', None)
    election_full = request.GET.get('election_full', True)

    if cycle is not None:
        cycle = int(cycle)

    candidate, committees, cycle = api_caller.load_with_nested(
        'candidate', candidate_id, 'committees',
        cycle=cycle, cycle_key='two_year_period',
        election_full=election_full,
    )

    if election_full and cycle and cycle not in candidate['election_years']:
        next_cycle = next(
            (
                year for year in sorted(candidate['election_years'])
                if year > cycle
            ),
            max(candidate['election_years']),
        )

        # If the next_cycle is odd set it to whatever the cycle value was
        # and then set election_full to false
        # This solves an issue with special elections
        if next_cycle % 2 > 0:
            next_cycle = cycle
            election_full = False

        candidate, committees, cycle = api_caller.load_with_nested(
            'candidate', candidate_id, 'committees',
            cycle=next_cycle, cycle_key='two_year_period',
            election_full=election_full,
        )

    election_year = next(
        (year for year in sorted(candidate['election_years']) if year >= cycle),
        None,
    )

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
        'candidateID': candidate['candidate_id']
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
        list(range(cycle, cycle - duration, -2))
        if election_full
        else [cycle]
    )
    for committee in committees:
        committee['related_cycle'] = (
            max(cycle for cycle in aggregate_cycles if cycle in committee['cycles'])
            if election_full
            else candidate['two_year_period']
        )

    # Group the committees by designation
    committee_groups = groupby(committees, lambda each: each['designation'])
    committees_authorized = committee_groups.get('P', []) + committee_groups.get('A', [])

    committee_groups = committee_groups
    committees_authorized = committees_authorized
    committee_ids = [committee['committee_id'] for committee in committees_authorized]

    # Get aggregate totals for the financial summary
    # And pass through the data processing utils
    aggregate = api_caller.load_candidate_totals(
        candidate['candidate_id'],
        cycle=max_cycle,
        election_full=show_full_election,
    )
    if aggregate:
        raising_summary = utils.process_raising_data(aggregate)
        spending_summary = utils.process_spending_data(aggregate)
        cash_summary = utils.process_cash_data(aggregate)

    aggregate = aggregate

    # Get totals for the last two-year period of a cycle for showing on
    # raising and spending tabs
    two_year_totals = api_caller.load_candidate_totals(
        candidate['candidate_id'],
        cycle=max_cycle,
        election_full=False
    )

    # Get the statements of candidacy
    statement_of_candidacy = api_caller.load_candidate_statement_of_candidacy(
        candidate['candidate_id'],
        cycle=cycle
    )

    if statement_of_candidacy:
        for statement in statement_of_candidacy:
            # convert string to python datetime and parse for readable output
            statement['receipt_date'] = datetime.datetime.strptime(statement['receipt_date'], '%Y-%m-%dT%H:%M:%S')
            statement['receipt_date'] = statement['receipt_date'].strftime('%m/%d/%Y')

    # Get all the elections
    elections = sorted(
        zip(candidate['election_years'], candidate['election_districts']),
        key=lambda pair: pair[0],
        reverse=True,
    )

    return render(request, 'candidates-single.jinja', {
        'name': candidate['name'],
        'cycle': cycle,
        'office': candidate['office'],
        'office_full': candidate['office_full'],
        'state': candidate['state'],
        'district': candidate['district'],
        'candidate_id': candidate_id,
        'party_full': candidate['party_full'],
        'incumbent_challenge_full': candidate['incumbent_challenge_full'],
        'election_year': election_year,
        'election_years': candidate['election_years'],
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
        'context_vars': context_vars
    })


def committee(request, committee_id):
    # grab url query string parameters
    cycle = request.GET.get('cycle', None)

    redirect_to_previous = False if cycle else True
    committee, candidates, cycle = api_caller.load_with_nested('committee', committee_id, 'candidates', cycle)

    parent = 'data'
    cycle = cycle
    year = to_date(committee, cycle)
    result_type = 'committees'

    # Link to current cycle if candidate has a corresponding page, else link
    # without cycle query parameter
    # See https://github.com/18F/openFEC/issues/1536
    for candidate in candidates:
        election_years = [
            election_year for election_year in candidate['election_years']
            if election_year - election_durations[candidate['office']] < cycle <= election_year
        ]
        candidate['related_cycle'] = max(election_years) if election_years else None

    # add related candidates a level below
    financials = api_caller.load_cmte_financials(committee_id, cycle=cycle)

    report_type = report_types.get(committee['committee_type'], 'pac-party')
    reports = financials['reports']
    totals = financials['totals']

    context_vars = {
        'cycle': cycle,
        'timePeriod': str(cycle - 1) + '–' + str(cycle),
        'name': committee['name'],
    }

    ie_summary = None

    if financials['reports'] and financials['totals']:
        # Format the current two-year-period's totals using the process utilities
        if committee['committee_type'] == 'I':
            # IE-only committees have very little data, so they just get this one
            ie_summary = utils.process_ie_data(financials['totals'][0])
        else:
            # All other committees have three tables
            raising_summary = utils.process_raising_data(financials['totals'][0])
            spending_summary = utils.process_spending_data(financials['totals'][0])
            cash_summary = utils.process_cash_data(financials['totals'][0])

    if redirect_to_previous and not financials['reports']:
        # If there's no reports, find the first year with reports and redirect there
        for c in sorted(committee['cycles'], reverse=True):
            financials = api_caller.load_cmte_financials(committee['committee_id'], cycle=c)
            if financials['reports']:
                return redirect(
                    url_for('committee_page', c_id=committee['committee_id'], cycle=c)
                )

    has_raw_filings = None

    # If it's not a senate committee and we're in the current cycle
    # check if there's any raw filings in the last two days
    if committee['committee_type'] != 'S' and cycle == utils.current_cycle():
        raw_filings = api_caller._call_api(
            'efile', 'filings',
            cycle=cycle,
            committee_id=committee['committee_id'],
            min_receipt_date=utils.two_days_ago()
        )
        if len(raw_filings.get('results')) > 0:
            has_raw_filings = True
    else:
        has_raw_filings = False

    return render(request, 'committees-single.jinja', {
        'name': committee['name'],
        'committee': committee,
        'committee_id': committee_id,
        'committee_type_full': committee['committee_type_full'],
        'designation_full': committee['designation_full'],
        'street_1': committee['street_1'],
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
        'context_vars': context_vars,
        'ie_summary': ie_summary,
        'raising_summary': raising_summary,
        'spending_summary': spending_summary,
        'cash_summary': cash_summary,
        'has_raw_filings': has_raw_filings
    })


def elections(request):
    return render(request, 'election-lookup.jinja', {
        'parent': 'data'
    })


'''
Views for datatables
'''

# TODO: kwargs for candidates and committees
def candidates(request):
    candidates = api_caller._call_api('candidates')
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'candidates',
        'slug': 'candidates',
        'title': 'Candidates',
        'data': candidates['results'],
        # 'query': kwargs,
        'columns': constants.table_columns['candidates']
    })


def candidates_office(request, office):
    if office.lower() not in ['president', 'senate', 'house']:
        raise Http404()
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'candidates',
        'title': 'candidates for ' + office,
        'slug': 'candidates-office',
        'table_context': OrderedDict([('office', office)]),
        'columns': constants.table_columns['candidates-office-' + office.lower()]
    })


def committees(request):
    committees = api_caller._call_api('committees')
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'committees',
        'slug': 'committees',
        'title': 'Committees',
        'data': committees['results'],
        # 'query': kwargs,
        'columns': constants.table_columns['committees']
    })


def communication_costs(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'communication-costs',
        'title': 'Communication costs',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['communication-costs']
    })


def disbursements(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'disbursements',
        'title': 'Disbursements',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['disbursements'],
        'has_data_type_toggle': True
    })


def filings(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'filings',
        'title': 'Filings',
        'dates': utils.date_ranges(),
        'result_type': 'committees',
        'has_data_type_toggle': True,
        'columns': constants.table_columns['filings']
    })


def electioneering_communications(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'electioneering-communications',
        'title': 'Electioneering communications',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['electioneering-communications']
    })


def independent_expenditures(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'independent-expenditures',
        'title': 'Independent expenditures',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['independent-expenditures'],
        'has_data_type_toggle': True
    })


def individual_contributions(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'receipts',
        'title': 'Individual contributions',
        'slug': 'individual-contributions',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['individual-contributions']
    })


def loans(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'loans',
        'slug': 'loans',
        'title': 'loans',
        'columns': constants.table_columns['loans']
    })


def party_coordinated_expenditures(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'party-coordinated-expenditures',
        'title': 'Party coordinated expenditures',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['party-coordinated-expenditures']
    })


def receipts(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'receipts',
        'title': 'Receipts',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['receipts'],
        'has_data_type_toggle': True
    })


def reports(request, form_type):
    if form_type.lower() not in ['presidential', 'house-senate', 'pac-party', 'ie-only']:
        raise Http404()
    if form_type.lower() == 'presidential':
        title = 'Presidential committee reports'
    if form_type.lower() == 'house-senate':
        title = 'House and Senate committee reports'
    if form_type.lower() == 'pac-party':
        title = 'PAC and party committee reports'
    if form_type.lower() == 'ie-only':
        title = 'Independent expenditure only committee reports'

    context = OrderedDict([('form_type', form_type.lower())])

    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'reports',
        'title': title,
        'table_context': context,
        'dates': utils.date_ranges(),
        'has_data_type_toggle': True,
        'columns': constants.table_columns['reports-' + form_type.lower()]
    })


def individual_contributions(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'receipts',
        'title': 'Individual contributions',
        'slug': 'individual-contributions',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['individual-contributions']
    })
