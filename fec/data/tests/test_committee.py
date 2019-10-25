from unittest import TestCase
from unittest import mock
import copy

from data import api_caller
# from data.views import get_committee


class TestCommittee(TestCase):

    STOCK_COMMITTEE = {
        'organization_type_full': None,
        'affiliated_committee_name': 'SOME CONNECTED COMMITTEE',
        'zip': '37024',
        'committee_type': 'N',
        'committee_type_full': 'PAC - Nonqualified',
        'committee_id': 'C001',
        'designation_full': 'Joint fundraising committee',
        'party_full': None,
        'street_2': None,
        'designation': 'J',
        'state_full': 'Tennessee',
        'party': None,
        'street_1': 'PO BOX 123',
        'state': 'TN',
        'treasurer_name': 'SMITH, SUSAN',
        'candidate_ids': [],
        'organization_type': None,
        'cycles': [2018],
        'filing_frequency': 'Q',
        'cycle': 2018,
        'city': 'BRENTWOOD',
        'name': 'MY JOINT FUNDRAISING COMMITTEE',
        'cycles_has_financial': [2018],
        'last_cycle_has_financial': 2018,
        'cycles_has_activity': [2018],
        'last_cycle_has_activity': 2018,
    }

    STOCK_CANDIDATES = [
        {
            "last_file_date": "2016-07-30",
            "flags": "P00003392",
            "rounded_election_years": [
                2008,
                2016
            ],
            "election_years": [
                2008,
                2016
            ],
            "two_year_period": 2014,
            "address_zip": "22210",
            "district_number": 0,
            "last_f2_date": "2016-07-30",
            "address_street_2": None,
            "address_state": "VA",
            "cycles": [
                2008,
                2010,
                2012,
                2014,
                2016,
                2018,
                2020
            ],
            "candidate_inactive": False,
            "address_city": "ARLINGTON",
            "candidate_status": "P",
            "state": "US",
            "first_file_date": "2007-01-22",
            "incumbent_challenge": "O",
            "party_full": "DEMOCRATIC PARTY",
            "party": "DEM",
            "office": "P",
            "candidate_id": "P00003392",
            "candidate_election_year": 2016,
            "office_full": "President",
            "name": "CLINTON, HILLARY RODHAM",
            "active_through": 2016,
            "incumbent_challenge_full": "Open seat",
            "fec_cycles_in_election": [
                2008,
                2014,
                2016
            ],
            "load_date": "2011-06-21T09:19:07+00:00",
            "election_districts": [
                "00",
                "00"
            ],
            "address_street_1": "PO BOX 101436",
            "district": "00"
        }
    ]

    STOCK_REPORTS = {
        "candidate_name": None,
        "coverage_end_date": "2018-12-31T00:00:00",
        "senate_personal_funds": None,
        "party": None,
        "house_personal_funds": None,
        "total_receipts": 283160.64,
        "treasurer_name": None,
        "request_type": None,
        "ending_image_number": "201901289144039173",
        "document_description": "TERMINATION REPORT 2018",
        "document_type_full": None,
        "debts_owed_by_committee": 0.0,
        "most_recent": True,
        "pdf_url": "http://docquery.fec.gov/pdf/164/2019012891/2019012891.pdf",
        "beginning_image_number": "201901289144039164",
        "fec_file_id": "FEC-1307768",
        "is_amended": False,
        "csv_url": "http://docquery.fec.gov/csv/768/1307768.csv",
        "fec_url": "http://docquery.fec.gov/dcdev/posted/1307768.fec",
        "debts_owed_to_committee": 0.0,
        "office": None,
        "report_type": "TER",
        "total_individual_contributions": None,
        "opposition_personal_funds": None,
        "cash_on_hand_beginning_period": 3.94,
        "report_year": 2018,
        "amendment_indicator": "T",
        "sub_id": "4012820191636898774",
        "cycle": 2018,
        "form_type": "F4",
        "receipt_date": "2019-01-28T00:00:00",
        "committee_name": "CLEVELAND 2016 HOST COMMITTEE INC",
        "update_date": "2019-01-28T20:56:58",
        "primary_general_indicator": None,
        "total_independent_expenditures": None,
        "most_recent_file_number": 1307768,
        "committee_type": "X",
        "candidate_id": None,
        "previous_file_number": 1307768,
        "report_type_full": "TERMINATION REPORT",
        "means_filed": "e-file",
        "form_category": "REPORT",
        "html_url": "http://docquery.fec.gov/cgi-bin/forms/C00567057/1307768/",
        "amendment_chain": [1307768.0],
        "net_donations": None,
        "coverage_start_date": "2018-10-01T00:00:00",
        "pages": 10,
        "file_number": 1307768,
        "total_communication_cost": None,
        "total_disbursements": 283160.64,
        "state": None,
        "cash_on_hand_end_period": 3.94,
        "committee_id": "C00567057",
        "amendment_version": 0,
        "election_year": None,
        "document_type": None
    }

    @mock.patch.object(api_caller, 'load_first_row_data')
    def test_load_first_row_data(self, load_first_row_data_mock):
        # 1)test function load_first_row_data()
        load_first_row_data_mock.return_value = {
            'committees': [
                {
                    'committee_id': 'C0001',
                    'name': 'cmte name 1'
                }, {
                    'committee_id': 'C0002',
                    'name': 'cmte name 2'
                }
            ],
        }
        results = api_caller.load_first_row_data()
        assert len(results) == 1
        assert len(results['committees']) == 2
        assert results['committees'][0].get('committee_id') == 'C0001'
        assert results['committees'][0].get('name') == 'cmte name 1'
        assert results['committees'][1].get('committee_id') == 'C0002'
        assert results['committees'][1].get('name') == 'cmte name 2'

        # 2) assert with copy object of STOCK_COMMITTEE
        test_committee = copy.deepcopy(self.STOCK_COMMITTEE)
        load_first_row_data_mock.return_value = test_committee
        results = api_caller.load_first_row_data()
        assert results['name'] == test_committee['name']
        assert results['committee_id'] == 'C001'
        assert results['state'] == 'TN'
        assert results['committee_id'] == test_committee['committee_id']
        assert results['committee_type_full'] == test_committee['committee_type_full']
        assert results['committee_type'] == test_committee['committee_type']
        assert results['designation_full'] == test_committee['designation_full']
        assert results['street_1'] == test_committee['street_1']
        assert results['street_2'] == test_committee['street_2']
        assert results['city'] == test_committee['city']
        assert results['state'] == test_committee['state']
        assert results['zip'] == test_committee['zip']
        assert results['treasurer_name'] == test_committee['treasurer_name']
        assert results['cycle'] == test_committee['cycle']
        assert results['cycles'] == test_committee['cycles']
        assert results['party_full'] == test_committee['party_full']
        assert results['cycles_has_financial'] == test_committee['cycles_has_financial']
        assert results['last_cycle_has_financial'] == test_committee['last_cycle_has_financial']
        assert results['cycles_has_activity'] == test_committee['cycles_has_activity']
        assert results['last_cycle_has_activity'] == test_committee['last_cycle_has_activity']

        # 3) assert with copy object of STOCK_REPORTS
        test_reports = copy.deepcopy(self.STOCK_REPORTS)
        load_first_row_data_mock.return_value = test_reports
        results = api_caller.load_first_row_data()
        assert results['report_type'] == 'TER'
        assert results['most_recent'] == test_reports['most_recent']
        assert results['form_category'] == test_reports['form_category']
        assert results['candidate_name'] == test_reports['candidate_name']
        assert results['coverage_end_date'] == test_reports['coverage_end_date']
        assert results['senate_personal_funds'] == test_reports['senate_personal_funds']
        assert results['party'] == test_reports['party']
        assert results['house_personal_funds'] == test_reports['house_personal_funds']
        assert results['total_receipts'] == test_reports['total_receipts']
        assert results['request_type'] == test_reports['request_type']
        assert results['ending_image_number'] == test_reports['ending_image_number']
        assert results['document_description'] == test_reports['document_description']
        assert results['document_type_full'] == test_reports['document_type_full']
        assert results['debts_owed_by_committee'] == test_reports['debts_owed_by_committee']
        assert results['pdf_url'] == test_reports['pdf_url']
        assert results['beginning_image_number'] == test_reports['beginning_image_number']
        assert results['fec_file_id'] == test_reports['fec_file_id']
        assert results['is_amended'] == test_reports['is_amended']
        assert results['csv_url'] == test_reports['csv_url']
        assert results['fec_url'] == test_reports['fec_url']
        assert results['debts_owed_to_committee'] == test_reports['debts_owed_to_committee']
        assert results['office'] == test_reports['office']
        assert results['total_individual_contributions'] == test_reports['total_individual_contributions']
        assert results['opposition_personal_funds'] == test_reports['opposition_personal_funds']
        assert results['cash_on_hand_beginning_period'] == test_reports['cash_on_hand_beginning_period']
        assert results['report_year'] == test_reports['report_year']
        assert results['amendment_indicator'] == test_reports['amendment_indicator']
        assert results['sub_id'] == test_reports['sub_id']
        assert results['receipt_date'] == test_reports['receipt_date']
        assert results['committee_name'] == test_reports['committee_name']
        assert results['most_recent_file_number'] == test_reports['most_recent_file_number']
        assert results['candidate_id'] == test_reports['candidate_id']
        assert results['coverage_start_date'] == test_reports['coverage_start_date']
        assert results['file_number'] == test_reports['file_number']
        assert results['election_year'] == test_reports['election_year']
        assert results['committee_id'] == test_reports['committee_id']
        assert results['state'] == test_reports['state']
        assert results['total_communication_cost'] == test_reports['total_communication_cost']
        assert results['total_disbursements'] == test_reports['total_disbursements']

    @mock.patch.object(api_caller, 'load_endpoint_result')
    def test_load_endpoint_result(self, load_endpoint_result_mock):
        # 1)test function load_endpoint_result()
        load_endpoint_result_mock.return_value = {
            'candidates': [
                {
                    'candidate_id': 'P0001',
                    'name': 'candidate name 1'
                }, {
                    'candidate_id': 'P0002',
                    'name': 'candidate name 2'
                }
            ],
        }
        results = api_caller.load_endpoint_result()
        assert len(results) == 1
        assert len(results['candidates']) == 2

        # 2) assert with copy object of STOCK_CANDIDATES
        test_candidates = copy.deepcopy(self.STOCK_CANDIDATES)
        load_endpoint_result_mock.return_value = test_candidates
        results = api_caller.load_endpoint_result()
        assert results[0].get('name') == 'CLINTON, HILLARY RODHAM'
        assert results[0].get('candidate_id') == test_candidates[0].get('candidate_id')
        assert results[0].get('last_file_date') == test_candidates[0].get('last_file_date')
        assert results[0].get('flags') == test_candidates[0].get('flags')
        assert results[0].get('rounded_election_years') == test_candidates[0].get('rounded_election_years')
        assert results[0].get('election_years') == test_candidates[0].get('election_years')
        assert results[0].get('two_year_period') == test_candidates[0].get('two_year_period')
        assert results[0].get('district_number') == test_candidates[0].get('district_number')
        assert results[0].get('last_f2_date') == test_candidates[0].get('last_f2_date')
        assert results[0].get('address_state') == test_candidates[0].get('address_state')
        assert results[0].get('cycles') == test_candidates[0].get('cycles')
        assert results[0].get('candidate_inactive') == test_candidates[0].get('candidate_inactive')
        assert results[0].get('address_city') == test_candidates[0].get('address_city')
        assert results[0].get('candidate_status') == test_candidates[0].get('candidate_status')
        assert results[0].get('state') == test_candidates[0].get('state')
        assert results[0].get('first_file_date') == test_candidates[0].get('first_file_date')
        assert results[0].get('incumbent_challenge') == test_candidates[0].get('incumbent_challenge')
        assert results[0].get('party_full') == test_candidates[0].get('party_full')
        assert results[0].get('party') == test_candidates[0].get('party')
        assert results[0].get('office') == test_candidates[0].get('office')
        assert results[0].get('candidate_election_year') == test_candidates[0].get('candidate_election_year')
        assert results[0].get('office_full') == test_candidates[0].get('office_full')
        assert results[0].get('active_through') == test_candidates[0].get('active_through')
        assert results[0].get('incumbent_challenge_full') == test_candidates[0].get('incumbent_challenge_full')
        assert results[0].get('fec_cycles_in_election') == test_candidates[0].get('fec_cycles_in_election')
        assert results[0].get('load_date') == test_candidates[0].get('load_date')
        assert results[0].get('election_districts') == test_candidates[0].get('election_districts')
        assert results[0].get('address_street_1') == test_candidates[0].get('address_street_1')
        assert results[0].get('district') == test_candidates[0].get('district')

    # --------------------------------
    # [To Do List]: we need to know how to make mock “chained call”
    # to test "get_committee('C001', 2018)" function.
    # --------------------------------
    # def test_base_case(
    #     self, load_first_row_data_mock, load_endpoint_result_mock
    # ):
    #     cycle = 2018

    #     test_committee = copy.deepcopy(self.STOCK_COMMITTEE)
    #     load_first_row_data_mock.return_value = (test_committee, [], cycle)
    #     load_endpoint_result_mock.return_value = self.STOCK_CANDIDATES
    #     committee = get_committee('C001', 2018)
    #     assert committee['name'] == test_committee['name']
    #     assert committee['committee_id'] == test_committee['committee_id']
    #     assert committee['committee_type_full'] == test_committee['committee_type_full']
    #     assert committee['committee_type'] == test_committee['committee_type']
    #     assert committee['designation_full'] == test_committee['designation_full']
    #     assert committee['street_1'] == test_committee['street_1']
    #     assert committee['street_2'] == test_committee['street_2']
    #     assert committee['city'] == test_committee['city']
    #     assert committee['state'] == test_committee['state']
    #     assert committee['zip'] == test_committee['zip']
    #     assert committee['treasurer_name'] == test_committee['treasurer_name']
    #     assert committee['parent'] == 'data'
    #     assert committee['cycle'] == test_committee['cycle']
    #     assert committee['cycles'] == test_committee['cycles']
    #     assert committee['year'] == test_committee['cycle']
    #     assert committee['result_type'] == 'committees'
    #     assert committee['report_type'] == 'pac-party'
    #     assert committee['reports'] == self.STOCK_FINANCIALS['reports']
    #     assert committee['party_full'] == test_committee['party_full']
    #     assert committee['context_vars'] == {
    #         'cycle': 2018,
    #         'timePeriod': '2017–2018',
    #         'name': 'MY JOINT FUNDRAISING COMMITTEE',
    #     }
    #     assert committee['totals'] == []
    #     assert committee['candidates'] == []
    #     assert committee['cycles_has_financial'] == test_committee['cycles_has_financial']
