import dateutil.parser
import requests
from requests.exceptions import ConnectionError
import json

from django import template
from django.conf import settings
from fec.constants import USAJOBS_CODE_LIST as CODE_LIST


JOB_URL = "https://data.usajobs.gov/api/Search"
CODES_URL = "https://data.usajobs.gov/api/codelist/hiringpaths"
USAJOB_SEARCH_ERROR = """
USAJOBS is unavailable. We are temporarily unable to post open FEC positions. Please visit <a href="https://www.usajobs.gov/">usajobs.gov</a> for more information.
"""
register = template.Library()


@register.inclusion_tag("partials/jobs.html")
def get_jobs():
    """
    this function will query USAJOBS api and return all open FEC jobs.
    if api call failed, a status error message will be displayed in the
    jobs.html session in the career page.
    it also query code list to update hirepath info. a hard-coded code list
    is used for backup if query failed.
    """

    # url = 'https://data.usajobs.gov/api/Search'
    # codes_url = 'https://data.usajobs.gov/api/codelist/hiringpaths'
    querystring = {}
    querystring["Organization"] = settings.USAJOBS_AGENCY_CODE
    querystring["WhoMayApply"] = settings.USAJOBS_WHOMAYAPPLY
    headers = {
        "authorization-key": settings.USAJOBS_API_KEY,
        "host": "data.usajobs.gov",
        "cache-control": "no-cache",
    }

    # Query usajobs API for all open FEC jobs, catch any connection errors to avoid server error
    try:
        response = requests.get(JOB_URL, headers=headers, params=querystring)
    except ConnectionError:
        return {'error': USAJOB_SEARCH_ERROR}

    """
    Parse the JSON content of the response body and check that the JSON in the correct format for jobs listings.
    This will also catch any 4xx, 5xx responses that don't return JSON in the correct format
    """
    try:
        responses = response.json()
        responses.get("SearchResult", {})['SearchResultItems']
    except (KeyError, IndexError, TypeError):
        return {'error': USAJOB_SEARCH_ERROR}

    # Query the codelist/hiringpaths endpoint for mapping map hiring-path code(s) to description(s)
    codes_response = requests.get(CODES_URL, headers=headers)
    # Parse the JSON content of the codes_response body or Use the backup CODE_LIST constant if the codelist/hiringpaths enpoint is unsuccesful
    try:
        codes_responses = codes_response.json()
    except (KeyError, IndexError, TypeError):
        codes_responses = json.loads(CODE_LIST)

    jobData = []
    search_results = responses.get("SearchResult", {})

    # iterate over returned job data
    if "SearchResultItems" in search_results:
        for result in search_results.get("SearchResultItems", None):
            matched_object_descriptor = result.get("MatchedObjectDescriptor", {})
            if len(matched_object_descriptor.get("JobGrade", [])) > 0:
                job_grade = matched_object_descriptor.get("JobGrade", [])[0].get(
                    "Code", ""
                )
            else:
                job_grade = ""

            jobs_dict = {
                "position_title": matched_object_descriptor.get("PositionTitle", ""),
                "position_id": matched_object_descriptor.get("PositionID", ""),
                "position_uri": matched_object_descriptor.get("PositionURI", ""),
                "position_start_date": dateutil.parser.parse(
                    matched_object_descriptor.get("PositionStartDate", "")
                ),
                "position_end_date": dateutil.parser.parse(
                    matched_object_descriptor.get("PositionEndDate", "")
                ),
                "job_grade": job_grade,
                "low_grade": matched_object_descriptor.get("UserArea", {})
                .get("Details", {})
                .get("LowGrade", ""),
                "high_grade": matched_object_descriptor.get("UserArea", {})
                .get("Details", {})
                .get("HighGrade", ""),
            }
            # map hiring-path code(s) for each job to description(s)
            if len(codes_responses.get("CodeList", [])) > 0:
                hiring_path_codes = codes_responses.get("CodeList", [])[0].get(
                    "ValidValue", []
                )
            else:
                hiring_path_codes = []
            hiring_path = [
                item
                for item in result.get("MatchedObjectDescriptor", {})
                .get("UserArea", {})
                .get("Details", {})
                .get("HiringPath", [])
            ]
            hp = []
            for path in hiring_path:
                hpa = [
                    item for item in hiring_path_codes if item["Code"] == path.upper()
                ]
                if hpa:
                    hp.append(hpa[0].get("Value", ""))
                else:
                    hp.append(path)
            hiring_path_list = ", ".join(str(n) for n in hp)
            open_to = {"open_to": hiring_path_list}
            jobs_dict.update(open_to)
            jobData.append(jobs_dict)

    return {"jobData": jobData}
