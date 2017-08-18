from django.shortcuts import render
from django.http import Http404

import datetime

from collections import OrderedDict

from data import api_caller
from data import constants
from data import utils


def candidates(request):
    # TODO: kwargs
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
    # TODO: kwargs
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
