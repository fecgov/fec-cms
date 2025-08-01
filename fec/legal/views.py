from django.shortcuts import render, redirect
from django.http import Http404

import datetime
import re

from data import api_caller
from data import ecfr_caller
from data import constants


def parse_query(q):
    # Split the string by space and then find strings that start with - and collect them
    query_split = q.split(' ')
    exclude_words = [x for x in query_split if x.startswith('-')]
    # Remove the first character of each word in the list
    filtered_words = [word[1:] for word in exclude_words]
    query_exclude = ' '.join(filtered_words)
    # Filter the original_list to remove words that are in prefix_set
    query = ' '.join([word for word in query_split if word not in exclude_words])
    return query, query_exclude


def advisory_opinions_landing(request):
    today = datetime.date.today()
    ao_min_date = today - datetime.timedelta(weeks=26)
    recent_aos = api_caller.load_legal_search_results(
        query='',
        query_exclude='',
        query_type='advisory_opinions',
        ao_doc_category_id=['F', 'W'],  # TODO: this is erring, expecting a string
        ao_min_issue_date=ao_min_date
    )

    pending_aos = api_caller.load_legal_search_results(
        query='',
        query_exclude='',
        query_type='advisory_opinions',
        ao_doc_category_id='R',
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


def process_mur_subjects(mur):
    """
    Process the subjects in a MUR and return a list of subject names.
    Fallback to an empty list if no subjects are found or list is empty.
    """
    if 'subjects' in mur and mur['subjects']:
        return [subject.get('subject') for subject in mur['subjects'] if subject.get('subject')]
    return []


def mur_page(request, mur_no):
    requested_mur_type = request.GET.get('mur_type', 'current')
    mur = api_caller.load_legal_mur(mur_no, requested_mur_type)

    if not mur:
        raise Http404()

    # Process MUR subjects
    mur['subject_list'] = process_mur_subjects(mur)

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
# ((coordinated | communications) | (in-kind AND contributions) |
# ("independent expenditure")) AND (-authorization)
# eCFR query string transformation:
# (coordinated | communications) | (in-kind contributions) |
# ("independent expenditure") -authorization

def transform_ecfr_query_string(query_string):

    # Define the replacements for eCFR query string
    replacements = [
        (r' \+', ''),  # Replace space+ with empty string
    ]

    # Apply replacements sequentially
    for pattern, replacement in replacements:
        query_string = re.sub(pattern, replacement, query_string)
    return query_string


def legal_search(request):
    original_query = request.GET.get('search', '')
    updated_ecfr_query_string = transform_ecfr_query_string(original_query)
    result_type = request.GET.get('search_type', 'all')
    results = {}
    query, query_exclude = parse_query(original_query)

    # Only hit the API if there's an actual query
    if original_query:
        results = api_caller.load_legal_search_results(query, query_exclude, result_type, limit=3)

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
        'query': original_query,
        'q_proximities': None,
        'q_proximitys': None,
        'results': results,
        'result_type': result_type,
        'category_order': get_legal_category_order(results, result_type),
        'social_image_identifier': 'legal',
    })


def legal_doc_search_ao(request):
    # If there are no params passed, default to Final Opinions
    if len(request.GET) == 0:
        return redirect('/data/legal/search/advisory-opinions/?ao_doc_category_id=F')

    results = {}
    original_query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)
    limit = request.GET.get('limit', 20)
    sort = request.GET.get('sort', '')
    ao_no = request.GET.getlist('ao_no', [])
    ao_requestor = request.GET.get('ao_requestor', '')
    ao_is_pending = request.GET.get('ao_is_pending', '')
    ao_min_issue_date = request.GET.get('ao_min_issue_date', '')
    ao_max_issue_date = request.GET.get('ao_max_issue_date', '')
    ao_min_request_date = request.GET.get('ao_min_request_date', '')
    ao_max_request_date = request.GET.get('ao_max_request_date', '')
    ao_entity_name = request.GET.get('ao_entity_name', '')
    ao_doc_category_ids = request.GET.getlist('ao_doc_category_id', [])
    ao_requestor_type_ids = request.GET.getlist('ao_requestor_type', [])
    ao_regulatory_citation = request.GET.get('ao_regulatory_citation', '')
    ao_statutory_citation = request.GET.get('ao_statutory_citation', '')
    ao_citation_require_all = request.GET.get('ao_citation_require_all', '')
    ao_year = request.GET.get('ao_year', '')
    q_proximities = request.GET.getlist('q_proximity', [])
    max_gaps = request.GET.get('max_gaps', '')

    query, query_exclude = parse_query(original_query)

    # Call the function and unpack its return values
    results = api_caller.load_legal_search_results(
        query,
        query_exclude,
        'advisory_opinions',
        offset=offset,
        limit=limit,
        ao_no=ao_no,
        sort=sort,
        ao_requestor=ao_requestor,
        ao_requestor_type=ao_requestor_type_ids,
        ao_is_pending=ao_is_pending,
        ao_min_issue_date=ao_min_issue_date,
        ao_max_issue_date=ao_max_issue_date,
        ao_min_request_date=ao_min_request_date,
        ao_max_request_date=ao_max_request_date,
        ao_entity_name=ao_entity_name,
        ao_doc_category_id=ao_doc_category_ids,
        ao_regulatory_citation=ao_regulatory_citation,
        ao_statutory_citation=ao_statutory_citation,
        ao_citation_require_all=ao_citation_require_all,
        ao_year=ao_year,
        max_gaps=max_gaps,
        q_proximity=q_proximities,
    )

    # Define AO document categories dictionary
    ao_document_categories = {
        "F": "Final Opinion",
        "V": "Votes",
        "D": "Draft Documents",
        "R": "AO Request, Supplemental Material, and Extensions of Time",
        "W": "Withdrawal of Request",
        "C": "Comments and Ex parte Communications",
        "S": "Commissioner Statements"
    }

    # Define AO requestor types dictionary
    ao_requestor_types = {
        # "0": "Any",
        "1": "Federal candidate/candidate committee/officeholder",
        "2": "Publicly funded candidates/committees",
        "3": "Party committee, national",
        "4": "Party committee, state or local",
        "5": "Nonconnected political committee",
        "6": "Separate segregated fund",
        "7": "Labor Organization",
        "8": "Trade Association",
        "9": "Membership Organization, Cooperative, Corporation W/O Capital Stock",
        "10": "Corporation (including LLCs electing corporate status)",
        "11": "Partnership (including LLCs electing partnership status)",
        "12": "Governmental entity",
        "13": "Research/Public Interest/Educational Institution",
        "14": "Law Firm",
        "15": "Individual",
        "16": "Other",
    }

    # Possible values for the ao_year filter
    # We want 1975+ but not the future, so limit the range to > 1974
    ao_year_opts = {year: year for year in range(datetime.datetime.now().year, 1974, -1)}

    # Return the selected document category name
    ao_document_category_names = [ao_document_categories.get(id) for id in ao_doc_category_ids]

    # Return the selected requestor type name, when "Any" is selected, clear the value
    ao_requestor_type_names = [ao_requestor_types.get(id) for id in ao_requestor_type_ids if id != 0]

    # For Javascript
    context_vars = {
        'sort': sort,
        'sortType': sort.replace('-', '')
    }

    for ao in results['advisory_opinions']:
        for index, doc in enumerate(ao['documents']):
            # Checks if the selected document category filters matching the document categories
            doc['category_match'] = str(doc['ao_doc_category_id']) in ao_doc_category_ids
            # Checks for document keyword text match
            doc['text_match'] = str(index) in ao['document_highlights']
        
    return render(request, 'legal-search-results-advisory_opinions.jinja', {
        'parent': 'legal',
        'results': results,
        'ao_document_categories': ao_document_categories,
        'result_type': 'advisory_opinions',
        'ao_no': ao_no,
        'sort': sort,
        'context_vars': context_vars,
        'ao_requestor': ao_requestor,
        'ao_requestor_types': ao_requestor_types,
        'ao_is_pending': ao_is_pending,
        'ao_min_issue_date': ao_min_issue_date,
        'ao_max_issue_date': ao_max_issue_date,
        'ao_min_request_date': ao_min_request_date,
        'ao_max_request_date': ao_max_request_date,
        'ao_entity_name': ao_entity_name,
        'query': query,
        'ao_regulatory_citation': ao_regulatory_citation,
        'ao_statutory_citation': ao_statutory_citation,
        'ao_citation_require_all': ao_citation_require_all,
        'category_order': get_legal_category_order(results, 'advisory_opinions'),
        'max_gaps': max_gaps,
        'q_proximities': q_proximities,
        'social_image_identifier': 'legal',
        'selected_ao_doc_category_ids': ao_doc_category_ids,
        'selected_ao_doc_category_names': ao_document_category_names,
        'selected_ao_requestor_type_ids': ao_requestor_type_ids,
        'selected_ao_requestor_type_names': ao_requestor_type_names,
        'ao_year': ao_year,
        'ao_year_opts': ao_year_opts,
        'is_loading': True,  # Indicate that the page is loading initially
        
    })


def legal_doc_search_mur(request):
    original_query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)
    limit = request.GET.get('limit', 20)
    case_no = request.GET.get('case_no', '')
    sort = request.GET.get('sort', '')
    case_min_penalty_amount = request.GET.get('case_min_penalty_amount', '')
    case_max_penalty_amount = request.GET.get('case_max_penalty_amount', '')
    case_respondents = request.GET.get('case_respondents', '')
    case_min_document_date = request.GET.get('case_min_document_date', '')
    case_max_document_date = request.GET.get('case_max_document_date', '')
    case_min_open_date = request.GET.get('case_min_open_date', '')
    case_max_open_date = request.GET.get('case_max_open_date', '')
    case_min_close_date = request.GET.get('case_min_close_date', '')
    case_max_close_date = request.GET.get('case_max_close_date', '')
    case_doc_category_ids = request.GET.getlist('case_doc_category_id', [])
    mur_disposition_category_ids = request.GET.getlist('mur_disposition_category_id', [])
    case_citation_require_all = request.GET.get('case_citation_require_all', '')
    case_regulatory_citation = request.GET.getlist('case_regulatory_citation', [])
    case_statutory_citation = request.GET.getlist('case_statutory_citation', [])
    primary_subject_id = request.GET.get('primary_subject_id', '')
    secondary_subject_id = request.GET.get('secondary_subject_id', '')
    q_proximitys = request.GET.getlist('q_proximity', [])
    max_gaps = request.GET.get('max_gaps', '0')

    query, query_exclude = parse_query(original_query)

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
        case_citation_require_all=case_citation_require_all,
        case_doc_category_id=case_doc_category_ids,
        case_max_close_date=case_max_close_date,
        case_max_document_date=case_max_document_date,
        case_max_open_date=case_max_open_date,
        case_max_penalty_amount=case_max_penalty_amount,
        case_min_close_date=case_min_close_date,
        case_min_document_date=case_min_document_date,
        case_min_open_date=case_min_open_date,
        case_min_penalty_amount=case_min_penalty_amount,
        case_regulatory_citation=case_regulatory_citation,
        case_respondents=case_respondents,
        case_statutory_citation=case_statutory_citation,
        mur_disposition_category_id=mur_disposition_category_ids,
        primary_subject_id=primary_subject_id,
        secondary_subject_id=secondary_subject_id,
        q_proximity = q_proximitys,
        max_gaps = max_gaps,
        

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

    # mur_disposition_category_id variables:
    # Dropdown options
    mur_disposition_category_ids_display = constants.mur_disposition_category_ids
    # Suggested items above dropdown
    suggested_mur_disposition_category_ids = constants.suggested_mur_disposition_category_ids
    # Combine the dropdown options and suggested for the full list
    mur_disposition_category_ids_list = {
        **mur_disposition_category_ids_display,
        **suggested_mur_disposition_category_ids
    }
    # Get list of selected names
    selected_mur_disposition_names = [mur_disposition_category_ids_list.get(id) for id in mur_disposition_category_ids]

    # Get primary_subject_id_name from dict
    primary_subject_id_name = constants.primary_subject_ids.get(primary_subject_id, '')
    secondary_subject_ids = constants.secondary_subject_ids

    def get_secondary_subject_name(id):
        for key in secondary_subject_ids:
            if id in secondary_subject_ids[key]:
                return secondary_subject_ids[key][id]
    secondary_subject_id_name = get_secondary_subject_name(secondary_subject_id)

    # For Javascript
    context_vars = {
        'result_type': 'murs',
        'mur_disposition_category_id': mur_disposition_category_ids,
        'primary_subject_id': primary_subject_id,
        'secondary_subject_id': secondary_subject_id,
        'secondary_subject_ids': secondary_subject_ids,
    }

    for mur in results['murs']:
        # Process MUR subjects
        mur['subject_list'] = process_mur_subjects(mur)

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
        'case_min_penalty_amount': case_min_penalty_amount,
        'case_max_penalty_amount': case_max_penalty_amount,
        'case_min_document_date': case_min_document_date,
        'case_max_document_date': case_max_document_date,
        'case_min_open_date': case_min_open_date,
        'case_max_open_date': case_max_open_date,
        'case_min_close_date': case_min_close_date,
        'case_max_close_date': case_max_close_date,
        'query': original_query,
        'ARCHIVED_MUR_EXCEPTION': constants.ARCHIVED_MUR_EXCEPTION,
        'social_image_identifier': 'legal',
        'selected_doc_category_ids': case_doc_category_ids,
        'selected_doc_category_names': mur_document_category_names,
        'mur_disposition_category_ids': mur_disposition_category_ids,
        'selected_mur_disposition_names': selected_mur_disposition_names,
        'mur_disposition_category_ids_display': mur_disposition_category_ids_display,
        'suggested_mur_disposition_category_ids': suggested_mur_disposition_category_ids,
        'primary_subject_id': primary_subject_id,
        'secondary_subject_id': secondary_subject_id,
        'primary_subject_id_name': primary_subject_id_name,
        'secondary_subject_id_name': secondary_subject_id_name,
        'is_loading': True,  # Indicate that the page is loading initially
        'context_vars': context_vars,
        'case_citation_require_all': case_citation_require_all,
        'case_regulatory_citation': case_regulatory_citation,
        'case_statutory_citation': case_statutory_citation,
        'q_proximitys': q_proximitys,
        'max_gaps': max_gaps,      
    })


def legal_doc_search_adr(request):
    results = {}
    original_query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)
    limit = request.GET.get('limit', 20)
    case_no = request.GET.get('case_no', '')
    case_respondents = request.GET.get('case_respondents', '')
    case_min_penalty_amount = request.GET.get('case_min_penalty_amount', '')
    case_max_penalty_amount = request.GET.get('case_max_penalty_amount', '')
    case_min_document_date = request.GET.get('case_min_document_date', '')
    case_max_document_date = request.GET.get('case_max_document_date', '')
    case_min_open_date = request.GET.get('case_min_open_date', '')
    case_max_open_date = request.GET.get('case_max_open_date', '')
    case_min_close_date = request.GET.get('case_min_close_date', '')
    case_max_close_date = request.GET.get('case_max_close_date', '')
    case_doc_category_ids = request.GET.getlist('case_doc_category_id', [])
    q_proximitys = request.GET.getlist('q_proximity', [])
    max_gaps = request.GET.get('max_gaps', '0')

    query, query_exclude = parse_query(original_query)

    results = api_caller.load_legal_search_results(
        query,
        query_exclude,
        'adrs',
        offset=offset,
        limit=limit,
        case_no=case_no,
        case_respondents=case_respondents,
        case_min_penalty_amount=case_min_penalty_amount,
        case_max_penalty_amount=case_max_penalty_amount,
        case_min_document_date=case_min_document_date,
        case_max_document_date=case_max_document_date,
        case_min_open_date=case_min_open_date,
        case_max_open_date=case_max_open_date,
        case_min_close_date=case_min_close_date,
        case_max_close_date=case_max_close_date,
        case_doc_category_id=case_doc_category_ids,
        q_proximity = q_proximitys,
        max_gaps = max_gaps,
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
        'case_min_penalty_amount': case_min_penalty_amount,
        'case_max_penalty_amount': case_max_penalty_amount,
        'case_min_document_date': case_min_document_date,
        'case_max_document_date': case_max_document_date,
        'case_min_open_date': case_min_open_date,
        'case_max_open_date': case_max_open_date,
        'case_min_close_date': case_min_close_date,
        'case_max_close_date': case_max_close_date,
        'query': original_query,
        'social_image_identifier': 'legal',
        'selected_doc_category_ids': case_doc_category_ids,
        'selected_doc_category_names': adr_document_category_names,
        'is_loading': True,  # Indicate that the page is loading initially
        'q_proximitys': q_proximitys,
        'max_gaps': max_gaps,
    })


def legal_doc_search_af(request):
    results = {}
    original_query = request.GET.get('search', '')
    offset = request.GET.get('offset', 0)
    limit = request.GET.get('limit', 20)
    case_no = request.GET.get('case_no', '')
    af_name = request.GET.get('af_name', '')
    case_min_penalty_amount = request.GET.get('case_min_penalty_amount', '')
    case_max_penalty_amount = request.GET.get('case_max_penalty_amount', '')
    case_min_document_date = request.GET.get('case_min_document_date', '')
    case_max_document_date = request.GET.get('case_max_document_date', '')
    q_proximitys = request.GET.getlist('q_proximity', [])
    max_gaps = request.GET.get('max_gaps', '0')

    query, query_exclude = parse_query(original_query)

    results = api_caller.load_legal_search_results(
        query,
        query_exclude,
        'admin_fines',
        offset=offset,
        limit=limit,
        case_no=case_no,
        af_name=af_name,
        case_min_penalty_amount=case_min_penalty_amount,
        case_max_penalty_amount=case_max_penalty_amount,
        case_min_document_date=case_min_document_date,
        case_max_document_date=case_max_document_date,
        q_proximity = q_proximitys,
        max_gaps = max_gaps,

    )
    for af in results['admin_fines']:
        for index, doc in enumerate(af['documents']):
            # Checks for document keyword text match
            doc['text_match'] = str(index) in af['document_highlights']

    return render(request, 'legal-search-results-afs.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'admin_fines',
        'case_no': case_no,
        'af_name': af_name,
        'case_min_document_date': case_min_document_date,
        'case_max_document_date': case_max_document_date,
        'case_min_penalty_amount': case_min_penalty_amount,
        'case_max_penalty_amount': case_max_penalty_amount,
        'query': original_query,
        'social_image_identifier': 'legal',
        'is_loading': True,  # Indicate that the page is loading initially

        'q_proximitys': q_proximitys,
        'max_gaps': max_gaps,
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
    original_query = request.GET.get('search', '')
    results = {}
    offset = request.GET.get('offset', 0)

    query, query_exclude = parse_query(original_query)

    results = api_caller.load_legal_search_results(
            query,
            query_exclude,
            'statutes',
            offset=offset,
        )

    return render(request, 'legal-search-results-statutes.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'statutes',
        'query': original_query,
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
