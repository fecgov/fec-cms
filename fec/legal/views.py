from django.shortcuts import render
from django.http import Http404

import datetime
import re

from data import api_caller
from data import ecfr_caller
from data import constants


def advisory_opinions_landing(request):
    today = datetime.date.today()
    ao_min_date = today - datetime.timedelta(weeks=26)
    recent_aos = api_caller.load_legal_search_results(
        query='',
        query_exclude='',
        query_type='advisory_opinions',
        ao_category=['F', 'W'],  # TODO: this is erring, expecting a string
        ao_min_issue_date=ao_min_date
    )

    pending_aos = api_caller.load_legal_search_results(
        query='',
        query_exclude='',
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

                # This regex searches in the document description for a string
                # in this format:
                # "(Comments due by October 24, 2022)", case insensitive,
                # forgiving for extra spaces and 1-digit month
                pattern = re.search(r'(?i)\(\s*Comments\s*due\s*by\s*'
                                    r'(([a-z,A-Z]+)\s*\d{1,2}\s*,'
                                    r'*\s*\d{4})\s*\)',
                                    doc['description'])

                # If a match is found.
                if pattern:
                    # group(1) is the date only, as input by user.
                    # Example. "October 24, 2022"
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
                        # Since  `parseable_date_time` is parseable date
                        # string, parse it into a Python-readable date.
                        # Example code_date_time: 2022-10-24 23:59:00
                        code_date_time = datetime.datetime.strptime(
                            parseable_date_time, '%B %d %Y %I:%M%p')

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

    final_opinion = [doc for doc in advisory_opinion['documents']
                     if doc['category'] == 'Final Opinion']
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
    report_type_full = (constants.report_type_full.get(
                        admin_fine['report_type'])
                        or admin_fine['report_type'])
    if not admin_fine:
        raise Http404()
    return render(request, 'legal' + '-admin_fine.jinja', {
        'admin_fine': admin_fine,
        'parent': 'legal',
        'social_image_identifier': 'legal',
        'report_type_full': report_type_full,
    })


# Transform boolean queries for eCFR API
# Query string:
# ((coordinated OR communications) OR (in-kind AND contributions) OR
# ("independent expenditure")) AND (-authorization)
# eCFR query string transformation:
# (coordinated | communications) | (in-kind contributions) |
# ("independent expenditure") -authorization

def transform_ecfr_query_string(query_string):

    # Define the replacements for eCFR query string
    replacements = [
        (r'\((-[^)]*)\)', r'\1'),  # Removes parentheses around on statement
    ]

    # Apply replacements sequentially
    for pattern, replacement in replacements:
        query_string = re.sub(pattern, replacement, query_string)
    return query_string


def transform_exclude_query_string(query_exclude_string):

    # Define the replacements for query_exclude string
    replacements = [
        (r'-', ''),  # Replace space dash with empty
    ]

    # Apply replacements sequentially
    for pattern, replacement in replacements:
        query_exclude_string = re.sub(pattern, replacement, query_exclude_string)

    return query_exclude_string


def legal_search(request):
    query = request.GET.get('search', '')
    query_exclude = request.GET.get('search_exclude', '')
    updated_query_exclude_string = transform_exclude_query_string(query_exclude)
    print("EXCLUDE:::::"+updated_query_exclude_string)
    updated_ecfr_query_string = transform_ecfr_query_string(query)
    result_type = request.GET.get('search_type', 'all')
    results = {}

    # Only hit the API if there's an actual query
    if query or query_exclude:
        results = api_caller.load_legal_search_results(query, updated_query_exclude_string, result_type, limit=3)

        # Only search regulations if result_type is all or regulations
        if result_type == 'all' or result_type == 'regulations':
            ecfr_results = ecfr_caller.fetch_ecfr_data(updated_ecfr_query_string, limit=3, page=1)
            if 'results' in ecfr_results:
                regulations = [{
                    "doc_id": None,
                    "document_highlights": {},
                    "highlights": [obj['headings']['part'],
                                   obj['full_text_excerpt']],
                    "name": obj['headings']['section'],
                    "no": obj['hierarchy']['section'],
                    "type": None,
                    "url": (
                        "https://www.ecfr.gov/current/title-11/"
                        f"chapter-{obj['hierarchy']['chapter']}/"
                        f"section-{obj['hierarchy']['section']}"
                    )
                } for obj in ecfr_results['results']]

                results['regulations'] = regulations
                results["total_regulations"] = ecfr_results.get('meta', {}).get(
                    'total_count', 0)
                results["regulations_returned"] = ('3' if results["total_regulations"] > 3
                                                   else results["total_regulations"])

    return render(request, 'legal-search-results.jinja', {
        'parent': 'legal',
        'query': query,
        'query_exclude': query_exclude,
        'results': results,
        'result_type': result_type,
        'category_order': get_legal_category_order(results, result_type),
        'social_image_identifier': 'legal',
    })


def legal_doc_search_ao(request):
    results = {}
    query = request.GET.get('search', '')
    query_exclude = request.GET.get('search_exclude', '')
    offset = request.GET.get('offset', 0)

    results = api_caller.load_legal_search_results(query, query_exclude, 'advisory_opinions',
                                                   offset=offset)

    return render(request, 'legal-search-results-advisory_opinions.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'advisory_opinions',
        'query': query,
        'query_exclude': query_exclude,
        'social_image_identifier': 'advisory-opinions'
    })


def legal_doc_search_mur(request):
    query = request.GET.get('search', '')
    query_exclude = request.GET.get('search_exclude', '')
    offset = request.GET.get('offset', 0)
    limit = request.GET.get('limit', 20)
    case_no = request.GET.get('case_no', '')
    sort = request.GET.get('sort', '')
    case_respondents = request.GET.get('case_respondents', '')
    case_min_open_date = request.GET.get('case_min_open_date', '')
    case_max_open_date = request.GET.get('case_max_open_date', '')
    case_min_close_date = request.GET.get('case_min_close_date', '')
    case_max_close_date = request.GET.get('case_max_close_date', '')
    case_doc_category_ids = request.GET.getlist('case_doc_category_id', [])

    # For JS sorting
    sort_dir = ('descending' if sort == '-case_no' or sort == '' or
                sort == 'null' else 'ascending')
    sort_dir_option = 'descending' if sort_dir == 'ascending' else 'ascending'
    sort_class = sort_dir[0:-6]

    # Call the function and unpack its return values
    results = api_caller.load_legal_search_results(
        query,
        query_exclude,
        'murs',
        offset=offset,
        limit=limit,
        case_no=case_no,
        sort=sort,
        case_respondents=case_respondents,
        case_min_open_date=case_min_open_date,
        case_max_open_date=case_max_open_date,
        case_min_close_date=case_min_close_date,
        case_max_close_date=case_max_close_date,
        case_doc_category_id=case_doc_category_ids,
    )

    # Define MUR document categories dictionary
    mur_document_categories = {
        "1": "Conciliation and Settlement Agreements",
        "2": "Complaint, Responses, Designation of Counsel and Extensions of Time",
        "3": "General Counsel Reports, Briefs, Notifications and Responses",
        "4": "Certifications",
        "5": "Civil Penalties, Disgorgements and Other Payments",
        "6": "Statements of Reasons"
    }

    # Return the selected document category name
    mur_document_category_names = [mur_document_categories.get(id) for id in case_doc_category_ids]

    for mur in results['murs']:
        for index, doc in enumerate(mur['documents']):
            # Checks if the selected document category filters matching the document categories
            doc['category_match'] = mur["mur_type"] != "archived" and str(doc['doc_order_id']) in case_doc_category_ids
            # Checks for document keyword text match
            doc['text_match'] = str(index) in mur['document_highlights']

    return render(request, 'legal-search-results-murs.jinja', {
        'parent': 'legal',
        'results': results,
        'mur_document_categories': mur_document_categories,
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
        'query': query,
        'query_exclude': query_exclude,
        'social_image_identifier': 'legal',
        'selected_doc_category_ids': case_doc_category_ids,
        'selected_doc_category_names': mur_document_category_names,
        'is_loading': True,  # Indicate that the page is loading initially
    })


def legal_doc_search_adr(request):
    results = {}
    query = request.GET.get('search', '')
    query_exclude = request.GET.get('search_exclude', '')
    offset = request.GET.get('offset', 0)
    limit = request.GET.get('limit', 20)
    case_no = request.GET.get('case_no', '')
    case_respondents = request.GET.get('case_respondents', '')
    case_min_open_date = request.GET.get('case_min_open_date', '')
    case_max_open_date = request.GET.get('case_max_open_date', '')
    case_min_close_date = request.GET.get('case_min_close_date', '')
    case_max_close_date = request.GET.get('case_max_close_date', '')
    case_doc_category_ids = request.GET.getlist('case_doc_category_id', [])

    results = api_caller.load_legal_search_results(
        query,
        query_exclude,
        'adrs',
        offset=offset,
        limit=limit,
        case_no=case_no,
        case_respondents=case_respondents,
        case_min_open_date=case_min_open_date,
        case_max_open_date=case_max_open_date,
        case_min_close_date=case_min_close_date,
        case_max_close_date=case_max_close_date,
        case_doc_category_id=case_doc_category_ids,
    )

    # Define ADR document categories dictionary
    adr_document_categories = {
        "1001": "Settlement Agreements",
        "1002": "Complaint, Responses, Designation of Counsel and Extensions of Time",
        "1003": "ADR Memoranda, Notifications and Responses",
        "1004": "Certifications",
        "1005": "Civil Penalties, Disgorgements, Other Payments and Letters of Compliance",
        "1006": "Statements of Reasons"
    }

    # Return the selected document category name
    adr_document_category_names = [adr_document_categories.get(id) for id in case_doc_category_ids]

    for adr in results['adrs']:
        for index, doc in enumerate(adr['documents']):
            # Checks if the selected document category filters matching the document categories
            doc['category_match'] = str(doc['doc_order_id']) in case_doc_category_ids
            # Checks for document keyword text match
            doc['text_match'] = str(index) in adr['document_highlights']

    return render(request, 'legal-search-results-adrs.jinja', {
        'parent': 'legal',
        'results': results,
        'adr_document_categories': adr_document_categories,
        'result_type': 'adrs',
        'case_no': case_no,
        'case_respondents': case_respondents,
        'case_min_open_date': case_min_open_date,
        'case_max_open_date': case_max_open_date,
        'case_min_close_date': case_min_close_date,
        'case_max_close_date': case_max_close_date,
        'query': query,
        'query_exclude': query_exclude,
        'social_image_identifier': 'legal',
        'selected_doc_category_ids': case_doc_category_ids,
        'selected_doc_category_names': adr_document_category_names,
        'is_loading': True,  # Indicate that the page is loading initially
    })


def legal_doc_search_af(request):
    results = {}
    query = request.GET.get('search', '')
    query_exclude = request.GET.get('search_exclude', '')
    offset = request.GET.get('offset', 0)
    limit = request.GET.get('limit', 20)
    case_no = request.GET.get('case_no', '')
    af_name = request.GET.get('af_name', '')
    results = api_caller.load_legal_search_results(
        query, query_exclude, 'admin_fines', offset=offset, limit=limit, case_no=case_no, af_name=af_name)

    return render(request, 'legal-search-results-afs.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'admin_fines',
        'case_no': case_no,
        'af_name': af_name,
        'query': query,
        'query_exclude': query_exclude,
        'social_image_identifier': 'legal',
        'is_loading': True,  # Indicate that the page is loading initially
    })


def legal_doc_search_regulations(request):
    results = {}
    query = request.GET.get('search', '')
    page = request.GET.get('page', 1)
    updated_ecfr_query_string = transform_ecfr_query_string(query)
    ecfr_results = ecfr_caller.fetch_ecfr_data(updated_ecfr_query_string,
                                               page=page)

    regulations = [{
                "highlights": [obj['full_text_excerpt']],
                "name": obj['headings']['section'],
                "no": obj['hierarchy']['section'],
                "type": None,
                "url":  (
                    "https://www.ecfr.gov/current/title-11/"
                    f"chapter-{obj['hierarchy']['chapter']}/"
                    f"section-{obj['hierarchy']['section']}"
                )
                } for obj in ecfr_results['results']]
    current_page = ecfr_results['meta']['current_page']
    total_pages = ecfr_results['meta']['total_pages']
    total_count = ecfr_results['meta']['total_count']
    results['regulations'] = regulations
    results['total_all'] = total_count

    return render(request, 'legal-search-results-regulations.jinja', {
        'parent': 'legal',
        'results': results,
        'current_page': current_page,
        'total_pages': total_pages,
        'total_count': total_count,
        'limit': 20,
        'result_type': 'regulations',
        'query': query,
        'social_image_identifier': 'legal',
    })


def legal_doc_search_statutes(request):
    results = {}
    query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)

    results = api_caller.load_legal_search_results(query, 'statutes',
                                                   offset=offset)

    return render(request, 'legal-search-results-statutes.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'statutes',
        'query': query,
        'social_image_identifier': 'legal',
    })


def get_legal_category_order(results, result_type):
    """ Return categories in pre-defined order, moving categories with empty
        results to the end. Move chosen category(result_type) to top when not searching 'all'
    """
    categories = ["admin_fines", "advisory_opinions", "adrs", "murs", "regulations", "statutes"]
    category_order = [x for x in categories if results.get("total_" + x, 0) > 0] +\
        [x for x in categories if results.get("total_" + x, 0) == 0]

    # Default to 'admin_fines' first if result_type is 'all', because we dont want 'all' in category_order
    result_type = "admin_fines" if result_type == 'all' else result_type
    # Move chosen search type to the top if not searching 'all'
    category_order.insert(0, category_order.pop(category_order.index(result_type)))

    return category_order
