import logging
import os
import requests
import inspect

from collections import OrderedDict
from operator import itemgetter
from urllib import parse
from django.conf import settings
from django.http import Http404

from data import constants, utils


MAX_FINANCIALS_COUNT = 4

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

session = requests.Session()
http_adapter = requests.adapters.HTTPAdapter(max_retries=2)
session.mount("https://", http_adapter)


def _call_api(*path_parts, **filters):
    if settings.FEC_API_KEY_PRIVATE:
        filters["api_key"] = settings.FEC_API_KEY_PRIVATE

    path = os.path.join(settings.FEC_API_VERSION, *[x.strip("/") for x in path_parts])
    url = parse.urljoin(settings.FEC_API_URL, path)
    # Timeout is set in seconds
    timeout = 90

    results = session.get(url, params=filters, timeout=timeout)

    # Log the caller function and API endpoint
    current_frame = inspect.currentframe()
    caller_frame = inspect.getouterframes(current_frame, 2)
    logger.info("{0}: {1}".format(caller_frame[1][3], results.url))

    if results.ok:
        return results.json()
    else:
        logger.error(
            "API ERROR with status {0} for {1} with filters: {2}".format(
                results.status_code, url, filters
            )
        )

        return {"results": []}


def load_search_results(query, query_type=None):
    filters = {}

    if query:
        filters["q"] = query
        filters["sort"] = ["-receipts"]
        filters["per_page"] = 5
        candidates = _call_api("/candidates/search", **filters)
        committees = _call_api("/committees", **filters)
        return {
            "candidates": candidates if len(candidates) else [],
            "committees": committees if len(committees) else [],
        }


def load_legal_search_results(query, query_exclude="", query_type="all", offset=0, limit=20, **kwargs):
    filters = dict((key, value) for key, value in kwargs.items() if value)

    # Apply type filter if only looking for one type
    if query_type != "all":
        filters["type"] = query_type

    filters["hits_returned"] = limit
    filters["from_hit"] = offset
    filters["q"] = query
    filters["q_exclude"] = query_exclude

    results = _call_api("legal", "search", **filters)
    results["limit"] = limit
    results["offset"] = offset

    if "statutes" in results:
        results["statutes_returned"] = len(results["statutes"])

    if "advisory_opinions" in results:
        results["advisory_opinions_returned"] = len(results["advisory_opinions"])

    if "murs" in results:
        results["murs_returned"] = len(results["murs"])

    if "adrs" in results:
        results["adrs_returned"] = len(results["adrs"])

    if "admin_fines" in results:
        results["admin_fines_returned"] = len(results["admin_fines"])

    return results


def load_legal_advisory_opinion(ao_no):
    url = "/legal/docs/advisory_opinions/"
    results = _call_api(url, parse.quote(ao_no))

    if not (results and "docs" in results and results["docs"]):
        raise Http404()

    ao = results["docs"][0]
    ao["sorted_documents"] = _get_sorted_documents(ao)
    ao["entities"] = sorted(ao["entities"], key=itemgetter("role"), reverse=True)
    return ao


def load_legal_mur(mur_no, requested_mur_type='current'):

    url = "/legal/docs/murs/"
    murs = _call_api(url, parse.quote(mur_no))

    if not murs:
        raise Http404

    # get matching doc by mur_type, else use the first
    if constants.ARCHIVED_MUR_EXCEPTION == mur_no:
        mur = next((doc for doc in murs["docs"] if doc['mur_type'] == requested_mur_type), murs["docs"][0])
    else:
        mur = murs["docs"][0]

    if mur["mur_type"] == "current":
        complainants = []
        for participant in mur["participants"]:
            if "complainant" in participant["role"].lower():
                complainants.append(participant["name"])

        mur["disposition_text"] = [d["action"] if d['action'] else '' for d in mur["commission_votes"]]
        '''
        for each index in mur["commission_votes"], if there is an empty action then log the mur and the
        particular index
        '''
        for i, d in enumerate(mur["commission_votes"]):
            if not d["action"]:
                logger.error(
                    "MUR " + str(mur_no) + ": There were no data for commission_votes action at index " + str(i)
                )
        mur["collated_dispositions"] = collate_dispositions(mur["dispositions"])
        mur["complainants"] = complainants
        mur["participants_by_type"] = _get_sorted_participants_by_type(mur)

        documents_by_type = OrderedDict()
        try:
            mur_docs = mur["documents"]
            if len(mur_docs) > 0:
                for doc in mur["documents"]:
                    if doc["category"] in documents_by_type:
                        documents_by_type[doc["category"]].append(doc)
                    else:
                        documents_by_type[doc["category"]] = [doc]
                mur["documents_by_type"] = documents_by_type
        except KeyError:
            logger.error("MUR " + str(mur_no) + ": There are no MUR documents loaded")
    return mur


def load_legal_adr(adr_no):

    url = "/legal/docs/adrs/"
    adr = _call_api(url, parse.quote(adr_no))

    if not adr:
        raise Http404

    adr = adr["docs"][0]

    complainants = []
    for participant in adr["participants"]:
        if "complainant" in participant["role"].lower():
            complainants.append(participant["name"])

    # Check if the list is not empty
    if adr["commission_votes"]:
        # Use the first one in the list
        adr["disposition_text"] = adr["commission_votes"][0]["action"]
    else:
        # Or any default value you prefer if the list is empty
        adr["disposition_text"] = None

    adr["collated_dispositions"] = collate_dispositions(adr["dispositions"])
    adr["complainants"] = complainants
    adr["participants_by_type"] = _get_sorted_participants_by_type(adr)

    referring_office = None  # Initialize referring_office variable

    for disposition in adr["dispositions"]:
        if "Received from" in disposition["disposition"]:
            referring_office = disposition["disposition"]
            # Transformation dictionary for referring office
            transformation_dict = {
                "Received from Commission": "FEC Commission",
                "Received from OGC": "FEC Office of General Counsel",
                "Received from RAD": "FEC Reports Analysis Division",
                "Received from Audit Division": "FEC Audit Division",
            }
            # Perform transformation if match found
            if referring_office in transformation_dict:
                referring_office = transformation_dict[referring_office]
            break  # Stop iterating if "Received from" disposition found

    # Assign referring_office to adr dictionary
    adr["referring_office"] = referring_office

    documents_by_type = OrderedDict()
    for doc in adr["documents"]:
        if doc["category"] in documents_by_type:
            documents_by_type[doc["category"]].append(doc)
        else:
            documents_by_type[doc["category"]] = [doc]
    adr["documents_by_type"] = documents_by_type
    return adr


def load_legal_admin_fines(admin_fine_no):
    url = "/legal/docs/admin_fines/"
    admin_fine = _call_api(url, parse.quote(admin_fine_no))
    if not admin_fine:
        raise Http404
    admin_fine = admin_fine["docs"][0]
    documents_by_type = OrderedDict()
    for doc in admin_fine["documents"]:
        if doc["category"] in documents_by_type:
            documents_by_type[doc["category"]].append(doc)
        else:
            documents_by_type[doc["category"]] = [doc]
    admin_fine["documents_by_type"] = documents_by_type
    disposition_items = OrderedDict()
    for item in admin_fine["dispositions"]:
        if item["disposition_description"] in disposition_items:
            disposition_items[item["disposition_description"]].append(item)
        else:
            disposition_items[item["disposition_description"]] = [item]
    admin_fine["disposition_items"] = disposition_items

    return admin_fine


def collate_dispositions(dispositions):
    """Collate dispositions - group them by disposition, penalty"""
    collated_dispositions = OrderedDict()
    for row in dispositions:
        # Filtering out rows with disposition containing "Received from"
        if "Received from" not in row["disposition"]:
            if row["disposition"] in collated_dispositions:
                if row["penalty"] in collated_dispositions[row["disposition"]]:
                    collated_dispositions[row["disposition"]][row["penalty"]].append(row)
                else:
                    collated_dispositions[row["disposition"]][row["penalty"]] = [row]
            else:
                collated_dispositions[row["disposition"]] = OrderedDict({row["penalty"]: [row]})
    return collated_dispositions


def load_single_type(data_type, c_id, *path, **filters):
    # Call API with single type in load_with_nested
    data = _call_api(data_type, c_id, *path, **filters)
    # Throw 404 if no data for candidate or committee in cycle
    return result_or_404(data)


def load_nested_type(parent_type, c_id, nested_type, *path, **filters):
    # Call API with nested types in load_with_nested
    return _call_api(parent_type, c_id, nested_type, *path, per_page=100, **filters)


def load_with_nested(primary_type, primary_id, secondary_type, cycle=None, **query):
    """ Handle Candidate or Committee endpoint
        Example: /candidate/P80003338/committees
        primary_type: "candidate"
        primary_id: "P80003338"
        secondary_type: "committees"
    """
    path = ("history", str(cycle)) if cycle else ("history",)
    """ Get data for just primary_type
        Example: candidate data for /candidate/* or committee data for /committee/*
    """
    data = load_single_type(primary_type, primary_id, *path, per_page=1, **query)

    cycle = cycle or max(data["cycles"])
    path = ("history", str(cycle))

    """ Get data for secondary_type
        Example: committee data for /candidate/P80003338/committees
    """
    nested_data = load_nested_type(
        primary_type, primary_id, secondary_type, *path, **query
    )

    return data, nested_data["results"], cycle


def load_first_row_data(*path_parts, **filters):
    response = _call_api(*path_parts, **filters)
    return response["results"][0] if response["results"] else None


def load_endpoint_results(*path_parts, **filters):
    response = _call_api(*path_parts, **filters)
    return response.get("results", [])


def load_candidate_statement_of_candidacy(candidate_id):
    """Get most recent F2 - default sort is `-receipt_date`"""
    response = _call_api("filings", candidate_id=candidate_id, form_type="F2")
    return response["results"][0] if response["results"] else None


def load_committee_statement_of_organization(committee_id):
    """Get most recent F1 - default sort is `-receipt_date`"""
    response = _call_api("filings", committee_id=committee_id, form_type="F1")

    return response["results"][0] if response["results"] else None


def result_or_404(data):
    if not data.get("results"):
        raise Http404()
    return data["results"][0]


def load_top_candidates(
    sort, office=None, election_year=constants.DEFAULT_ELECTION_YEAR, per_page=5
):
    response = _call_api(
        "candidates",
        "totals",
        sort_hide_null=True,
        election_year=election_year,
        election_full=True,
        is_active_candidate=True,
        office=office,
        sort=sort,
        per_page=per_page,
    )
    return response if "results" in response else None


def _get_sorted_participants_by_type(mur):
    """
    Returns the participants in a MUR sorted in the order
    of most important to least important
    """
    SORTED_PARTICIPANT_ROLES = [
        "Primary Respondent",
        "Respondent",
        "Previous Respondent",
        "Treasurer",
        "Previous Treasurer",
        "Complainant",
        "Respondent's Counsel",
        "Opposing counsel",
        "Representative",
        "Law Firm",
    ]
    participants_by_type = OrderedDict()

    # Prime with sorted roles
    for role in SORTED_PARTICIPANT_ROLES:
        participants_by_type[role] = []

    for participant in mur["participants"]:
        participants_by_type[participant["role"]].append(participant["name"])

    # Remove roles without participants
    for role in [key for key, value in participants_by_type.items() if not value]:
        del participants_by_type[role]

    # Sort remaining participants
    for key, value in participants_by_type.items():
        participants_by_type[key] = sorted(participants_by_type[key])

    return participants_by_type


def _get_sorted_documents(ao):
    """Sort documents within an AO by date DESC, description and document_id.
       We do this in 2 passes, making use of the fact that Python's `sorted`
       function performs a _stable_ sort.
    """
    sorted_documents = sorted(
        ao["documents"], key=itemgetter("description", "document_id"), reverse=False
    )
    sorted_documents = sorted(sorted_documents, key=itemgetter("date"), reverse=True)

    # Sort by document date unless it's a final opinion. Final opinion uses issue date.
    sorted_documents = sorted(
        sorted_documents,
        key=lambda doc: doc.get("date") if doc.get("ao_doc_category_id") != 'F' else ao.get("issue_date"),
        reverse=True
    )

    return sorted_documents


def call_senate_specials(state):
    """ Call the API to get Senate special election information for
        given state. Returns a list of dictionaries
        Example: [{details for election1}][{details for election2}]
    """
    special_results = _call_api(
        "election-dates", election_type_id="SG", office_sought="S", election_state=state
    )

    return special_results.get("results")


def format_special_results(special_results=[]):
    """ Takes special_results, which is a list of dictionaries,
        returns a list of election years. Round odd years up to even.
        Example: [2008, 2000]
    """
    senate_specials = []

    for result in special_results:
        # Round odd years up to even years
        result["election_year"] = result["election_year"] + (
            result["election_year"] % 2
        )
        senate_specials.append(result.get("election_year", None))

    return senate_specials


def get_regular_senate_cycles(state):
    """ Get the list of election cycles based off Senate class
    """
    senate_cycles = []

    for senate_class in ["1", "2", "3"]:
        if state.upper() in constants.SENATE_CLASSES[senate_class]:
            senate_cycles += utils.get_senate_cycles(senate_class)

    return senate_cycles


def get_all_senate_cycles(state):
    """  Add together regularly scheduled and special senate elections
        Return a list of election years sorted in descending order
    """
    senate_specials = format_special_results(call_senate_specials(state))
    senate_regular_cycles = get_regular_senate_cycles(state)

    all_senate_cycles = senate_regular_cycles

    for special_year in senate_specials:
        # Prevent duplicates
        if special_year not in all_senate_cycles:
            all_senate_cycles.append(special_year)

    # Sort for readability
    all_senate_cycles.sort(reverse=True)

    return all_senate_cycles
