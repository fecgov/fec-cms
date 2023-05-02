from django.shortcuts import render, redirect
from django.http import Http404

from collections import OrderedDict

from data import api_caller
from data import constants
from data import utils


def candidates(request):
    candidates = api_caller._call_api('candidates')
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'candidates',
        'slug': 'candidates',
        'title': 'Candidates',
        'data': candidates['results'],
        'columns': constants.table_columns['candidates'],
        'social_image_identifier': 'data',
    })


def candidates_office(request, office):
    office = office.lower()
    if office not in ['president', 'senate', 'house']:
        raise Http404()
    # only House/Senate are proper-cased
    office_breadcrumb = office.title() if office in ['senate', 'house'] else office
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'candidates',
        'title': 'Candidates for ' + office_breadcrumb,
        'slug': 'candidates-office',
        'table_context': OrderedDict([('office', office)]),
        'columns': constants.table_columns['candidates-office-' + office],
        'social_image_identifier': 'data',
    })


def committees(request):
    committees = api_caller._call_api('committees')
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'committees',
        'slug': 'committees',
        'title': 'Committees',
        'data': committees['results'],
        'columns': constants.table_columns['committees'],
        'social_image_identifier': 'data',
    })


def pac_party(request):

    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'pac_party',
        'slug': 'pac-party',
        'title': 'Political action and party committees',
        'columns': constants.table_columns['pac-party'],
        'social_image_identifier': 'data',
    })


def communication_costs(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'communication-costs',
        'title': 'Communication costs',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['communication-costs'],
        'social_image_identifier': 'data',
    })


# Temporarily adding min and max date redirect until we can
# handle null disbursement dates in a future implementation
def disbursements(request):
    if len(request.GET) == 0:
        return redirect('/data/disbursements/?two_year_transaction_period='
                        + str(constants.DEFAULT_ELECTION_YEAR)
                        + '&min_date=' + '01/01/' + str(constants.DEFAULT_ELECTION_YEAR - 1)
                        + '&max_date=' + '12/31/' + str(constants.DEFAULT_ELECTION_YEAR))

    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'disbursements',
        'title': 'Disbursements',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['disbursements'],
        'has_data_type_toggle': True,
        'social_image_identifier': 'data',
    })


# handle null disbursement dates in a future implementation
def allocated_federal_nonfederal_disbursements(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'allocated-federal-nonfederal-disbursements',
        'title': 'Allocated federal nonfederal disbursements',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['allocated-federal-nonfederal-disbursements'],
        'has_data_type_toggle': True,
        'social_image_identifier': 'data',
    })


def filings(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'filings',
        'title': 'Filings',
        'dates': utils.date_ranges(),
        'result_type': 'committees',
        'has_data_type_toggle': True,
        'columns': constants.table_columns['filings'],
        'social_image_identifier': 'data',
    })


def electioneering_communications(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'electioneering-communications',
        'title': 'Electioneering communications',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['electioneering-communications'],
        'social_image_identifier': 'data',
    })


def independent_expenditures(request):
    if len(request.GET) == 0:
        return redirect('/data/independent-expenditures/?most_recent=true')

    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'independent-expenditures',
        'title': 'Independent expenditures',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['independent-expenditures'],
        'has_data_type_toggle': True,
        'social_image_identifier': 'data',
    })


# Temporarily adding min and max date redirect until we can
# handle null disbursement dates in a future implementation
def individual_contributions(request):
    if len(request.GET) == 0:
        return redirect('/data/receipts/individual-contributions/?two_year_transaction_period='
                        + str(constants.DEFAULT_ELECTION_YEAR)
                        + '&min_date=' + '01/01/' + str(constants.DEFAULT_ELECTION_YEAR - 1)
                        + '&max_date=' + '12/31/' + str(constants.DEFAULT_ELECTION_YEAR))

    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'receipts',
        'title': 'Individual contributions',
        'slug': 'individual-contributions',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['individual-contributions'],
        'social_image_identifier': 'data',
    })


def loans(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'loans',
        'slug': 'loans',
        'title': 'Loans',
        'columns': constants.table_columns['loans'],
        'social_image_identifier': 'data',
    })


def debts(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'debts',
        'slug': 'debts',
        'title': 'Debts',
        'columns': constants.table_columns['debts'],
        'social_image_identifier': 'data',
    })


def audit(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'result_type': 'audit',
        'slug': 'audit',
        'title': 'Audit',
        'columns': constants.table_columns['audit'],
        'social_image_identifier': 'data',
    })


def party_coordinated_expenditures(request):
    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'party-coordinated-expenditures',
        'title': 'Party coordinated expenditures',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['party-coordinated-expenditures'],
        'social_image_identifier': 'data',
    })


# Temporarily adding min and max date redirect until we can
# handle null disbursement dates in a future implementation
def receipts(request):
    if len(request.GET) == 0:
        return redirect('/data/receipts/?two_year_transaction_period='
                        + str(constants.DEFAULT_ELECTION_YEAR)
                        + '&min_date=' + '01/01/' + str(constants.DEFAULT_ELECTION_YEAR - 1)
                        + '&max_date=' + '12/31/' + str(constants.DEFAULT_ELECTION_YEAR))

    return render(request, 'datatable.jinja', {
        'parent': 'data',
        'slug': 'receipts',
        'title': 'Receipts',
        'dates': utils.date_ranges(),
        'columns': constants.table_columns['receipts'],
        'has_data_type_toggle': True,
        'social_image_identifier': 'data',
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
        'columns': constants.table_columns['reports-' + form_type.lower()],
        'social_image_identifier': 'data',
    })
