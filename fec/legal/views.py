from django.shortcuts import render
from django.http import Http404

import datetime
import re

from data import api_caller
from data import constants


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

    """ The following loop checks the currently iterated AO's doc dict for a document
    of category: "AO Request, Supplemental Material, and Extensions of Time",
    and if it matches the pattern in the regex, it parses the date.
    If the date is not expired, then it adds an item to the AO's dict named 'comment_deadline',
    which can then be accessed in the template as `pending_ao['comment_deadline']`.

    """

    for pending_ao in pending_aos['advisory_opinions']:
        for doc in pending_ao.get('documents'):
            if doc['category'] == 'AO Request, Supplemental Material, and Extensions of Time':

                # This regex searches in the document description for a string in this format:
                # "(Comments due by October 24, 2022)", case insensitive, forgiving for extra spaces and 1-digit month
                pattern = re.search(r'(?i)\(\s*Comments\s*due\s*by\s*(([a-z,A-Z]+)\s*\d{1,2}\s*,*\s*\d{4})\s*\)',
                    doc['description'])

                # If a match is found.
                if pattern:
                    # group(1) is the date only, as input by user. Example. "October 24, 2022"
                    display_date = pattern.group(1)
                    # rm comma
                    parseable_date = display_date.replace(',', '')
                    # `parseable_date_time` example: October 24 2022 11:59PM
                    parseable_date_time = parseable_date + ' 11:59PM'

                    # Check if `parseable_date_time` is actually parseable.
                    try:
                        datetime.datetime.strptime(parseable_date_time, '%B %d %Y %I:%M%p')
                    except ValueError:
                        # pass to avoid throwing a datetime error
                        pass
                    else:
                        # Since  `parseable_date_time` is parseable date string, parse it into a Python-readable date.
                        # Example code_date_time: 2022-10-24 23:59:00
                        code_date_time = datetime.datetime.strptime(parseable_date_time, '%B %d %Y %I:%M%p')

                        # Check if `code_date_time` has not expired.
                        present = datetime.datetime.now()
                        if code_date_time > present:
                            comment_deadline = display_date

                            # Append item to currently iterated AO's dict
                            pending_ao['comment_deadline'] = comment_deadline

    return render(request, 'legal-advisory-opinions-landing.jinja', {
        'parent': 'legal',
        'result_type': 'advisory_opinions',
        'display_name': 'advisory opinions',
        'recent_aos': recent_aos['advisory_opinions'],
        'pending_aos': pending_aos['advisory_opinions'],
        'social_image_identifier': 'advisory-opinions',
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
        'parent': 'legal',
        'social_image_identifier': 'advisory-opinions',
    })


def statutes_landing(request):
    return render(request, 'legal-statutes-landing.jinja', {
        'parent': 'legal',
        'result_type': 'statutes',
        'display_name': 'statutes',
        'social_image_identifier': 'legal',
    })


def mur_page(request, mur_no):
    mur = api_caller.load_legal_mur(mur_no)

    if not mur:
        raise Http404()

    return render(request, 'legal-' + mur['mur_type'] + '-mur.jinja', {
        'mur': mur,
        'parent': 'legal',
        'social_image_identifier': 'legal',
    })


def adr_page(request, adr_no):
    adr = api_caller.load_legal_adr(adr_no)

    if not adr:
        raise Http404()

    return render(request, 'legal' + '-adr.jinja', {
        'adr': adr,
        'parent': 'legal',
        'social_image_identifier': 'legal',
    })


def admin_fine_page(request, admin_fine_no):
    admin_fine = api_caller.load_legal_admin_fines(admin_fine_no)
    # If report code not found in report_type_full dict, then use report code
    report_type_full = constants.report_type_full.get(admin_fine['report_type']) or admin_fine['report_type']
    if not admin_fine:
        raise Http404()
    return render(request, 'legal' + '-admin_fine.jinja', {
        'admin_fine': admin_fine,
        'parent': 'legal',
        'social_image_identifier': 'legal',
        'report_type_full': report_type_full,
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
        'category_order': get_legal_category_order(results),
        'social_image_identifier': 'legal',
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
        'query': query,
        'social_image_identifier': 'advisory-opinions'
    })


def legal_doc_search_mur(request):
    results = {}
    query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)
    case_no = request.GET.get('case_no', '')
    sort = request.GET.get('sort', '')
    case_respondents = request.GET.get('case_respondents', '')
    case_min_open_date = request.GET.get('case_min_open_date', '')
    case_max_open_date = request.GET.get('case_max_open_date', '')
    case_min_close_date = request.GET.get('case_min_close_date', '')
    case_max_close_date = request.GET.get('case_max_close_date', '')
    case_statutory_citation = request.GET.get('case_statutory_citation', '')
    case_regulatory_citation = request.GET.get('case_regulatory_citation', '')

    # For JS sorting
    sort_dir = 'descending' if sort == '-case_no' or sort == '' or sort == 'null' else 'ascending'
    sort_dir_option = 'descending' if sort_dir == 'ascending' else 'ascending'
    sort_class = sort_dir[0:-6]

    results = api_caller.load_legal_search_results(
        query, 'murs',
        offset=offset,
        case_no=case_no,
        sort=sort,
        case_respondents=case_respondents,
        case_min_open_date=case_min_open_date,
        case_max_open_date=case_max_open_date,
        case_min_close_date=case_min_close_date,
        case_max_close_date=case_max_close_date,
        case_statutory_citation=case_statutory_citation,
        case_regulatory_citation=case_regulatory_citation,
    )

    return render(request, 'legal-search-results-murs.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'murs',
        'case_no': case_no,
        'sort': sort,
        'sort_dir': sort_dir,
        'sort_dir_option': sort_dir_option,
        'sort_class': sort_class,
        'case_respondents': case_respondents,
        'case_min_open_date': case_min_open_date,
        'case_max_open_date': case_max_open_date,
        'case_min_close_date': case_min_close_date,
        'case_max_close_date': case_max_close_date,
        'case_statutory_citation': case_statutory_citation,
        'case_regulatory_citation': case_regulatory_citation,        
        'query': query,
        'social_image_identifier': 'legal',
    })


def legal_doc_search_adr(request):
    results = {}
    query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)
    case_no = request.GET.get('case_no', '')
    case_respondents = request.GET.get('case_respondents', '')

    results = api_caller.load_legal_search_results(
        query, 'adrs', offset=offset, case_no=case_no, case_respondents=case_respondents)

    return render(request, 'legal-search-results-adrs.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'adrs',
        'case_no': case_no,
        'case_respondents': case_respondents,
        'query': query,
        'social_image_identifier': 'legal',
    })


def legal_doc_search_af(request):
    results = {}
    query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)
    case_no = request.GET.get('case_no', '')
    af_name = request.GET.get('af_name', '')
    results = api_caller.load_legal_search_results(
        query, 'admin_fines', offset=offset, case_no=case_no, af_name=af_name)

    return render(request, 'legal-search-results-afs.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'admin_fines',
        'case_no': case_no,
        'af_name': af_name,
        'query': query,
        'social_image_identifier': 'legal',
    })


def legal_doc_search_regulations(request):
    results = {}
    query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)

    results = api_caller.load_legal_search_results(query, 'regulations', offset=offset)

    return render(request, 'legal-search-results-regulations.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'regulations',
        'query': query,
        'social_image_identifier': 'legal',
    })


def legal_doc_search_statutes(request):
    results = {}
    query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)

    results = api_caller.load_legal_search_results(query, 'statutes', offset=offset)

    return render(request, 'legal-search-results-statutes.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'statutes',
        'query': query,
        'social_image_identifier': 'legal',
    })


def get_legal_category_order(results):
    """ Return categories in pre-defined order, moving categories with empty results
        to the end.
    """
    categories = ["advisory_opinions", "murs", "regulations", "statutes"]
    category_order = [x for x in categories if results.get("total_" + x, 0) > 0] +\
        [x for x in categories if results.get("total_" + x, 0) == 0]
    return category_order
