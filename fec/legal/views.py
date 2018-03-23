from django.shortcuts import render
from django.http import Http404

import datetime

from data import api_caller


def advisory_opinions_landing(request):
    today = datetime.date.today()
    ao_min_date = today - datetime.timedelta(weeks=26)
    recent_aos = api_caller.load_legal_search_results(
        query='',
        query_type='advisory_opinions',
        ao_category=['F', 'W'],
        ao_min_issue_date=ao_min_date
    )
    pending_aos = api_caller.load_legal_search_results(
        query='',
        query_type='advisory_opinions',
        ao_category='R',
        ao_status='Pending'
    )
    return render(request, 'legal-advisory-opinions-landing.jinja', {
        'parent': 'legal',
        'result_type': 'advisory_opinions',
        'display_name': 'advisory opinions',
        'recent_aos': recent_aos['advisory_opinions'],
        'pending_aos': pending_aos['advisory_opinions']
    })


def advisory_opinion_page(request, ao_no):
    advisory_opinion = api_caller.load_legal_advisory_opinion(ao_no)

    if not advisory_opinion:
        raise Http404()

    final_opinion = [doc for doc in advisory_opinion['documents'] if doc['category'] == 'Final Opinion']
    final_opinion = final_opinion[0] if len(final_opinion) > 0 else None

    return render(request, 'legal-advisory-opinion.jinja', {
        'advisory_opinion': advisory_opinion,
        'final_opinion': final_opinion,
        'parent': 'legal'
    })


def statutes_landing(request):
    return render(request, 'legal-statutes-landing.jinja', {
        'parent': 'legal',
        'result_type': 'statutes',
        'display_name': 'statutes'
    })


def mur_page(request, mur_no):
    mur = api_caller.load_legal_mur(mur_no)

    if not mur:
        raise Http404()

    return render(request, 'legal-' + mur['mur_type'] + '-mur.jinja', {
        'mur': mur,
        'parent': 'legal'
    })


def legal_search(request):
    query = request.GET.get('search', '')
    result_type = request.GET.get('search_type', 'all')

    results = {}

    # Only hit the API if there's an actual query
    if query:
        results = api_caller.load_legal_search_results(query, result_type, limit=3)

    return render(request, 'legal-search-results.jinja', {
        'parent': 'legal',
        'query': query,
        'results': results,
        'result_type': result_type,
        'category_order': get_legal_category_order(results)
    })


def legal_doc_search_ao(request):
    results = {}
    query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)

    results = api_caller.load_legal_search_results(query, 'advisory_opinions', offset=offset)

    return render(request, 'legal-search-results-advisory_opinions.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'advisory_opinions',
        'query': query
    })


def legal_doc_search_mur(request):
    results = {}
    query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)
    mur_no = request.GET.get('mur_no', '')
    mur_respondents = request.GET.get('mur_respondents', '')
    mur_election_cycles = request.GET.get('mur_election_cycles', '')

    results = api_caller.load_legal_search_results(query, 'murs', offset=offset, mur_no=mur_no, mur_respondents=mur_respondents)

    return render(request, 'legal-search-results-murs.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'murs',
        'mur_no': mur_no,
        'mur_respondents': mur_respondents,
        'query': query
    })


def legal_doc_search_regulations(request):
    results = {}
    query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)

    if query:
        results = api_caller.load_legal_search_results(query, 'regulations', offset=offset)

    return render(request, 'legal-search-results-regulations.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'regulations',
        'query': query
    })


def legal_doc_search_statutes(request):
    results = {}
    query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)

    if query:
        results = api_caller.load_legal_search_results(query, 'statutes', offset=offset)

    return render(request, 'legal-search-results-statutes.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'statutes',
        'query': query
    })


def get_legal_category_order(results):
    """ Return categories in pre-defined order, moving categories with empty results
        to the end.
    """
    categories = ["advisory_opinions", "murs", "regulations", "statutes"]
    category_order = [x for x in categories if results.get("total_" + x, 0) > 0] +\
                    [x for x in categories if results.get("total_" + x, 0) == 0]
    return category_order
