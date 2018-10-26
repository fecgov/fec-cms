import unittest
import json
import logging
from unittest import mock

from home.templatetags.open_jobs import (
    get_jobs,
    USAJOB_SEARCH_ERROR,
    JOB_URL,
    CODES_URL,
)
from fec.constants import USAJOBS_CODE_LIST

logger = logging.getLogger(__name__)

# import home.views as views
# from django.test import Client, TestCase

"""
things need to tested:
1. both requests GET are fired when get_jobs are called
2. when search request failed, need to check error message are back
3. when code_list request failed, need to make sure hard-coded copy kicks in.
4. when code is not in code_list, make sure hire_path parsed from job data
"""

# a normal job data(with some simplification) used for tests
JOB_DATA = """
{"LanguageCode": "EN",
 "SearchParameters": {},
 "SearchResult": {"SearchResultCount": 1,
                  "SearchResultCountAll": 1,
                  "SearchResultItems": [
    {"MatchedObjectDescriptor":
                  {
                 "ApplicationCloseDate": "2018-11-06",
                 "ApplyURI": ["https://www.usajobs.gov:443/GetJob/ViewDetails/513873400?PostingChannelID=RESTAPI"],
                 "DepartmentName": "Organizations",
                 "JobCategory": [{"Code": "2210", "Name": " "}],
                 "JobGrade": [{"Code": "GS"}],
                 "OrganizationName": "Federal Election Commission",
             "PositionEndDate": "2018-11-06",
                 "PositionFormattedDescription": [{"Label": "Dynamic Teaser",
                                                   "LabelDescription": "Hit "}],
            "PositionID": "FEC-10316553-OPM",
                 "PositionLocation": [{"CityName": "Washington DC",
                                       "CountryCode": "United States",
                                    "CountrySubDivisionCode": "District of Columbia",
                                       "Latitude": 38.8959465,
                                       "LocationName": "Washington DC, District of Columbia",
                                       "Longitude": -77.02595}],
                 "PositionLocationDisplay": "Washington DC, District of Columbia",
                 "PositionOfferingType": [{"Code": "15317",
                                           "Name": "Permanent"}],
                 "PositionSchedule": [{"Code": "1",
                                       "Name": "Full-Time"}],
                 "PositionStartDate": "2018-10-16",
             "PositionTitle": "Information Technology Specialist",
             "PositionURI": "https://www.usajobs.gov:443/GetJob/ViewDetails/513873400",
                 "PublicationStartDate": "2018-10-16",
                 "QualificationSummary": "dummy",
                 "UserArea": {"Details": {"AgencyMarketingStatement": "Senate.",
                                          "ApplyOnlineUrl": "https://apply.usastaffing.gov/Application/Apply",
                                          "DetailStatusUrl": "",
                                          "HighGrade": "13",
                                          "HiringPath": ["public"],
                                          "JobSummary": "",
                                          "LowGrade": "11",
                                          "PromotionPotential": "13",
                                          "TravelCode": "0",
                                          "WhoMayApply": {"Code": "",
                                                          "Name": ""}
                                          },
                              "IsRadialSearch": ""}
                    },
             "MatchedObjectId": "513873400",
             "RelevanceRank": 0.0}
 ]}}
"""


class MockResponse:
    def __init__(self, json_data, status_code):
        self.json_data = json_data
        self.status_code = status_code

    def json(self):
        return self.json_data


# Our test case class
class MyGreatClassTestCase(unittest.TestCase):

    # This method will be used by the mock to replace requests.get
    def mocked_requests_get1(*args, **kwargs):
        if args[0] == JOB_URL:
            return MockResponse(json.loads(JOB_DATA), 200)
        elif args[0] == CODES_URL:
            return MockResponse(json.loads(USAJOBS_CODE_LIST), 200)
        return MockResponse(None, 404)

    # first test case: everything normal
    @mock.patch("requests.get", side_effect=mocked_requests_get1)
    def test_get_job1(self, mock_get):
        logger.info("usajob test1:")
        job_data = get_jobs()
        # print(job_data)
        self.assertEqual(job_data["jobData"][0]["open_to"], "The public")

    # second test case: job search failed
    def mocked_requests_get2(*args, **kwargs):
        if args[0] == JOB_URL:
            return MockResponse(json.loads(JOB_DATA), 500)  # error response
        elif args[0] == CODES_URL:
            return MockResponse(json.loads(USAJOBS_CODE_LIST), 200)
        return MockResponse(None, 404)

    @mock.patch("requests.get", side_effect=mocked_requests_get2)
    def test_get_job2(self, mock_get):
        logger.info("usajob test2:")
        job_data = get_jobs()
        self.assertTrue("error" in job_data)

    def mocked_requests_get3(*args, **kwargs):
        if args[0] == JOB_URL:
            return MockResponse(json.loads(JOB_DATA), 200)  # error response
        elif args[0] == CODES_URL:
            return MockResponse(json.loads(USAJOBS_CODE_LIST), 500)
        return MockResponse(None, 404)

    # 3rd test case: code list query failed, hard cached copy kick in
    @mock.patch("requests.get", side_effect=mocked_requests_get3)
    def test_get_job3(self, mock_get):
        logger.info("usajob test3:")
        job_data = get_jobs()
        self.assertEqual(job_data["jobData"][0]["open_to"], "The public")

    def mocked_requests_get4(*args, **kwargs):
        job_data = json.loads(JOB_DATA)
        job_data["SearchResult"]["SearchResultItems"][0]["MatchedObjectDescriptor"][
            "UserArea"
        ]["Details"]["HiringPath"] = ["some new code"]

        if args[0] == JOB_URL:
            return MockResponse(job_data, 200)  # error response
        elif args[0] == CODES_URL:
            return MockResponse(json.loads(USAJOBS_CODE_LIST), 500)
        return MockResponse(None, 404)

    # 4th test case: code list query failed, hard cached copy kick in,
    # but new code found, use original job data
    @mock.patch("requests.get", side_effect=mocked_requests_get4)
    def test_get_job4(self, mock_get):
        logger.info("usajob test4:")
        job_data = get_jobs()
        self.assertEqual(job_data["jobData"][0]["open_to"], "some new code")


if __name__ == "__main__":
    unittest.main()
