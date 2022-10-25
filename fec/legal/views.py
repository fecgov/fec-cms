from django.shortcuts import render
from django.http import Http404

import datetime
import re

# TO DO - can remove after testing
import json

from data import api_caller
from data import constants

""" TODO This is a sample of penfing_aos for testing the regex and the view logic.
This dict was created by making the exact same api call the api_caller does in the `pending_aos` variable below,
then editing doc desctiptions Document descriptions can be further edited to test the logic and see how
typos are either forgiven, or might break the regex or datetime parsing.
REMOVE BEFORE FINAL PR.

"""
pending_aos_sample = {
    "advisory_opinions": [
        {
            "summary": "Contributions by irrevocable trust to candidates and political committees.",
            "no": "2022-24",
            "ao_citations": [],
            "representative_names": ["Elias Law Group", "", ""],
            "requestor_names": [""],
            "documents": [
                {
                    "date": "2022-10-04T00:00:00",
                    "description": "Request by Allen Blue (Comments due by October 30, 2022)",
                    "document_id": 87165,
                    "category": "AO Request, Supplemental Material, and Extensions of Time",
                    "url": "/files/legal/aos/2022-24/202224R_1.pdf",
                }
            ],
            "commenter_names": [],
            "regulatory_citations": [],
            "type": "advisory_opinions",
            "aos_cited_by": [],
            "doc_id": "advisory_opinions_2022-24",
            "issue_date": "null",
            "statutory_citations": [],
            "entities": [
                {"role": "Requestor", "name": "Mr. Allen Blue ", "type": "Individual"},
                {
                    "role": "Counsel/Representative",
                    "name": "Elias Law Group",
                    "type": "Law Firm",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Mr. Ezra W. Reese Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Ms. Emma R. Anspach Esq.",
                    "type": "Individual",
                },
            ],
            "name": "Allen Blue",
            "request_date": "2022-10-04",
            "requestor_types": ["Individual"],
            "is_pending": "true",
            "status": "Pending",
            "highlights": [],
            "document_highlights": {},
        },
        {
            "summary": "Corporate license of patented technology for political committee use in advertising.",
            "no": "2022-23",
            "ao_citations": [],
            "representative_names": ["Berke Farah LLP", ""],
            "requestor_names": ["DataVault Holdings, Inc."],
            "documents": [
                {
                    "date": "2022-10-05T00:00:00",
                    "description": "Extension of Time",
                    "document_id": 87158,
                    "category": "AO Request, Supplemental Material, and Extensions of Time",
                    "url": "/files/legal/aos/2022-23/202223R_2.pdf",
                },
                {
                    "date": "2022-09-22T00:00:00",
                    "description": "Request by DataVault Holding's Inc. (Comments due by October 30, 2022)",
                    "document_id": 87159,
                    "category": "AO Request, Supplemental Material, and Extensions of Time",
                    "url": "/files/legal/aos/2022-23/202223R_1.pdf",
                },
                {
                    "date": "2022-09-22T00:00:00",
                    "description": "TEST SECOND NON-DRAFT DOC WITH EXP DATE - \
                        Request by DataVault Holding's Inc. (Comments due by November 05, 2022)",
                    "document_id": 87151,
                    "category": "AO Request, Supplemental Material, and Extensions of Time",
                    "url": "/files/legal/aos/2022-23/202223R_1.pdf",
                },
            ],
            "commenter_names": [],
            "regulatory_citations": [],
            "type": "advisory_opinions",
            "aos_cited_by": [],
            "doc_id": "advisory_opinions_2022-23",
            "issue_date": "null",
            "statutory_citations": [],
            "entities": [
                {
                    "role": "Requestor",
                    "name": "DataVault Holdings, Inc.",
                    "type": "Corporation (including LLCs electing corporate status)",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Berke Farah LLP",
                    "type": "Law Firm",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Mr. Elliot S. Berke Esq.",
                    "type": "Individual",
                },
            ],
            "name": "DataVault II",
            "request_date": "2022-09-22",
            "requestor_types": [
                "Corporation (including LLCs electing corporate status)"
            ],
            "is_pending": "true",
            "status": "Pending",
            "highlights": [],
            "document_highlights": {},
        },
        {
            "summary": 'Corporate sale of non-fungible tokens ("NFTs") to political committees.',
            "no": "2022-22",
            "ao_citations": [],
            "representative_names": ["", "Berke Farah LLP"],
            "requestor_names": ["DataVault Holdings, Inc."],
            "documents": [
                {
                    "date": "2022-10-05T00:00:00",
                    "description": "Extension of Time",
                    "document_id": 87156,
                    "category": "AO Request, Supplemental Material, and Extensions of Time",
                    "url": "/files/legal/aos/2022-22/202222R_2.pdf",
                },
                {
                    "date": "2022-10-03T00:00:00",
                    "description": "Request by DataVault Holdings, Inc. (Comments due by 10/03/2022)",
                    "document_id": 87157,
                    "category": "AO Request, Supplemental Material, and Extensions of Time",
                    "url": "/files/legal/aos/2022-22/202222R_1.pdf",
                },
            ],
            "commenter_names": [],
            "regulatory_citations": [],
            "type": "advisory_opinions",
            "aos_cited_by": [],
            "doc_id": "advisory_opinions_2022-22",
            "issue_date": "null",
            "statutory_citations": [],
            "entities": [
                {
                    "role": "Requestor",
                    "name": "DataVault Holdings, Inc.",
                    "type": "Corporation (including LLCs electing corporate status)",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Mr. Elliot S. Berke Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Berke Farah LLP",
                    "type": "Law Firm",
                },
            ],
            "name": "DataVault I",
            "request_date": "2022-10-03",
            "requestor_types": [
                "Corporation (including LLCs electing corporate status)"
            ],
            "is_pending": "true",
            "status": "Pending",
            "highlights": [],
            "document_highlights": {},
        },
        {
            "summary": "Payment for television advertisements featuring candidates that solicit funds \
                for national party committee’s legal proceedings account.",
            "no": "2022-21",
            "ao_citations": [],
            "representative_names": [
                "",
                "",
                "Holtzman Vogel Baran Torchinsky & Josefiak PLLC",
                "",
                "",
                "",
                "",
                "",
                "",
                "Elias Law Group",
                "",
                "",
                "",
                "",
            ],
            "requestor_names": [
                "People for Patty Murray",
                "DSCC",
                "Bennet for Colorado",
            ],
            "documents": [
                {
                    "date": "2022-10-06T00:00:00",
                    "description": "Comment on AOR 2022-21 by NRSC",
                    "document_id": 87167,
                    "category": "Comments and Ex parte Communications",
                    "url": "/files/legal/aos/2022-21/202221C_2.pdf",
                },
                {
                    "date": "2022-10-11T00:00:00",
                    "description": "Comment on AOR 2022-21 by DSCC, Bennet for Colorado, and People for Patty Murray",
                    "document_id": 87168,
                    "category": "Comments and Ex parte Communications",
                    "url": "/files/legal/aos/2022-21/202221C_3.pdf",
                },
                {
                    "date": "2022-10-11T00:00:00",
                    "description": "Comment on AOR 2022-21 by Campaign Legal Center",
                    "document_id": 87169,
                    "category": "Comments and Ex parte Communications",
                    "url": "/files/legal/aos/2022-21/202221C_4.pdf",
                },
                {
                    "date": "2022-10-13T00:00:00",
                    "description": "Extension of Time",
                    "document_id": 87170,
                    "category": "AO Request, Supplemental Material, and Extensions of Time",
                    "url": "/files/legal/aos/2022-21/202221R_2.pdf",
                },
                {
                    "date": "2022-10-03T00:00:00",
                    "description": "Comment on AOR 2022-21 by Campaign Legal Center",
                    "document_id": 87171,
                    "category": "Comments and Ex parte Communications",
                    "url": "/files/legal/aos/2022-21/202221C_1.pdf",
                },
                {
                    "date": "2022-09-23T00:00:00",
                    "description": "Request by DSCC, Bennet for Colorado, and People for \
                        Patty Murray (Comments due by October 6, 2022)",
                    "document_id": 87166,
                    "category": "AO Request, Supplemental Material, and Extensions of Time",
                    "url": "/files/legal/aos/2022-21/202221R_1.pdf",
                },
            ],
            "commenter_names": ["The NRSC", "Campaign Legal Center"],
            "regulatory_citations": [],
            "type": "advisory_opinions",
            "aos_cited_by": [],
            "doc_id": "advisory_opinions_2022-21",
            "issue_date": "null",
            "statutory_citations": [],
            "entities": [
                {
                    "role": "Commenter",
                    "name": "The NRSC",
                    "type": "Party committee, national",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Mr. Jan Witold Baran Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Mr. Thomas J. Josefiak Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Holtzman Vogel Baran Torchinsky & Josefiak PLLC",
                    "type": "Law Firm",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Mr. Michael Bayes Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Mr. Jason Torchinsky Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Counsel/Representative",
                    "name": " Jessica F. Johnson Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Counsel/Representative",
                    "name": " Matthew S Petersen Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Mr. Jonathan A. Peterson Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Ms. Jacquelyn K. Lopez Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Elias Law Group",
                    "type": "Law Firm",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Ms. Shanna M. Reulbach Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Ms. Rachel L. Jacobs Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Requestor",
                    "name": "People for Patty Murray",
                    "type": "Federal candidate/candidate committee/officeholder",
                },
                {
                    "role": "Requestor",
                    "name": "DSCC",
                    "type": "Party committee, national",
                },
                {
                    "role": "Requestor",
                    "name": "Bennet for Colorado",
                    "type": "Federal candidate/candidate committee/officeholder",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Ms. Erin Chlopak Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Counsel/Representative",
                    "name": "Mr. Saurav Ghosh Esq.",
                    "type": "Individual",
                },
                {
                    "role": "Commenter",
                    "name": "Campaign Legal Center",
                    "type": "Research/Public Interest/Educational Institution",
                },
            ],
            "name": "DSCC, Bennet for Colorado, and People for Patty Murray",
            "request_date": "2022-09-23",
            "requestor_types": [
                "Federal candidate/candidate committee/officeholder",
                "Party committee, national",
            ],
            "is_pending": "true",
            "status": "Pending",
            "highlights": [],
            "document_highlights": {},
        },
    ],
    "total_advisory_opinions": 4,
    "total_all": 4,
}


def advisory_opinions_landing(request):
    today = datetime.date.today()
    ao_min_date = today - datetime.timedelta(weeks=26)
    recent_aos = api_caller.load_legal_search_results(
        query='',
        query_type='advisory_opinions', ao_category=['F', 'W'],
        ao_min_issue_date=ao_min_date
    )

    pending_aos = api_caller.load_legal_search_results(
        query='',
        query_type='advisory_opinions',
        ao_category='R',
        ao_status='Pending'
    )

    """ TODO: For testing only. the below line overrides the `pending_aos` var above,
    using the "pending_aos_sample" data dict at the top of the file. So one can edit doc
    descriptions for testing the regex and logic. To use above live api_caller query instead,
    comment out or remove the line below. (Delete this comment and line below before merge.)

    """
    pending_aos = pending_aos_sample

    """ The following loop checks the currently iterated AO's doc dict for a document
    of category: "AO Request, Supplemental Material, and Extensions of Time", and
    if it matches the pattern in the regex, it parses the date.
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

                # If a matche is found.
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
                        # Since  `parseable_date_time` is a valid date format, parse it into a Python-readable date.
                        # Example code_date_time: 2022-10-31 23:59:00

                        code_date_time = datetime.datetime.strptime(parseable_date_time, '%B %d %Y %I:%M%p')

                        # Check if `code_date_time` has not expired.
                        present = datetime.datetime.now()
                        if code_date_time > present:
                            comment_deadline = display_date
                            pending_ao['comment_deadline'] = comment_deadline

    return render(request, 'legal-advisory-opinions-landing.jinja', {  # TODO: FOR TESTING
        'parent': 'legal',
        'result_type': 'advisory_opinions',
        'display_name': 'advisory opinions',
        'recent_aos': recent_aos['advisory_opinions'],
        'pending_aos': pending_aos['advisory_opinions'],
        'social_image_identifier': 'advisory-opinions',
        # TODO: For testing only. rm b4 merge.
        'pending_aos_pretty': json.dumps(pending_aos, sort_keys=False, indent=4),
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
    case_respondents = request.GET.get('case_respondents', '')
    case_min_open_date = request.GET.get('case_min_open_date', '')
    case_max_open_date = request.GET.get('case_max_open_date', '')
    case_min_close_date = request.GET.get('case_min_close_date', '')
    case_max_close_date = request.GET.get('case_max_close_date', '')

    results = api_caller.load_legal_search_results(
        query, 'murs',
        offset=offset,
        case_no=case_no,
        case_respondents=case_respondents,
        case_min_open_date=case_min_open_date,
        case_max_open_date=case_max_open_date,
        case_min_close_date=case_min_close_date,
        case_max_close_date=case_max_close_date
    )

    return render(request, 'legal-search-results-murs.jinja', {
        'parent': 'legal',
        'results': results,
        'result_type': 'murs',
        'case_no': case_no,
        'case_respondents': case_respondents,
        'case_min_open_date': case_min_open_date,
        'case_max_open_date': case_max_open_date,
        'case_min_close_date': case_min_close_date,
        'case_max_close_date': case_max_close_date,
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
