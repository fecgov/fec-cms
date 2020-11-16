from unittest import TestCase
from unittest import mock
import copy

from data import views, api_caller


@mock.patch.object(
    api_caller, "load_committee_statement_of_organization", return_value=None
)
@mock.patch.object(api_caller, "load_endpoint_results")
@mock.patch.object(views, "load_reports_and_totals")
@mock.patch.object(views, "load_cycle_data")
@mock.patch.object(views, "load_committee_history")
class TestCommittee(TestCase):

    STOCK_COMMITTEE = {
        "organization_type_full": None,
        "affiliated_committee_name": "SOME CONNECTED COMMITTEE",
        "zip": "37024",
        "committee_type": "N",
        "committee_type_full": "PAC - Nonqualified",
        "committee_id": "C001",
        "designation_full": "Joint fundraising committee",
        "party_full": None,
        "street_2": None,
        "designation": "J",
        "state_full": "Tennessee",
        "party": None,
        "street_1": "PO BOX 123",
        "state": "TN",
        "treasurer_name": "SMITH, SUSAN",
        "candidate_ids": [],
        "organization_type": None,
        "cycles": [2018],
        "filing_frequency": "Q",
        "cycle": 2018,
        "city": "BRENTWOOD",
        "name": "MY JOINT FUNDRAISING COMMITTEE",
        "cycles_has_financial": [2018],
        "last_cycle_has_financial": 2018,
        "cycles_has_activity": [2018],
        "last_cycle_has_activity": 2018,
        "former_candidate_id": "P001",
        "former_committee_name": "Friends of President",
        "former_candidate_name": "Optimus Prime",
    }

    STOCK_REPORTS = [
        {
            "non_allocated_fed_election_activity_period": None,
            "allocated_federal_election_levin_share_period": None,
            "total_disbursements_period": 7400.0,
            "coverage_end_date": "2018-09-30T00:00:00+00:00",
            "document_description": "OCTOBER QUARTERLY 2018",
            "refunded_political_party_committee_contributions_ytd": None,
            "loans_made_period": None,
            "net_operating_expenditures_period": None,
            "committee_type": "N",
            "committee_name": "GREEN VICTORY FUND",
            "amendment_indicator_full": "NEW",
            "net_contributions_period": None,
            "total_disbursements_ytd": None,
            "fec_url": "http://docquery.fec.gov/dcdev/posted/1273093.fec",
            "other_fed_receipts_period": None,
            "shared_fed_activity_ytd": None,
            "cash_on_hand_beginning_period": 0.0,
            "total_operating_expenditures_ytd": None,
            "non_allocated_fed_election_activity_ytd": None,
            "debts_owed_to_committee": 0.0,
            "pdf_url": " http://docquery.fec.gopdf042/201810159125475042/20181015912  5475042.pdf",
            "political_party_committee_contributions_period": None,
            "other_political_committee_contributions_period": None,
            "fec_file_id": "FEC-1273093",
            "beginning_image_number": "201810159125475042",
            "cash_on_hand_beginning_calendar_ytd": None,
            "coordinated_expenditures_by_party_committee_period": None,
            "total_nonfed_transfers_period": None,
            "loan_repayments_made_period": None,
            "fed_candidate_contribution_refunds_period": None,
            "individual_unitemized_contributions_period": None,
            "fed_candidate_committee_contribution_refunds_ytd": None,
            "total_fed_receipts_period": None,
            "transfers_from_affiliated_party_period": None,
            "total_contributions_ytd": None,
            "refunded_political_party_committee_contributions_period": None,
            "transfers_to_affiliated_committee_period": None,
            "subtotal_summary_ytd": None,
            "refunded_individual_contributions_period": None,
            "transfers_from_nonfed_levin_ytd": None,
            "other_political_committee_contributions_ytd": None,
            "report_form": "Form 3",
            "total_fed_operating_expenditures_period": None,
            "total_individual_contributions_period": None,
            "csv_url": "http://docquery.fec.gov/csv/093/1273093.csv",
            "total_contribution_refunds_period": None,
            "loans_made_ytd": None,
            "loan_repayments_made_ytd": None,
            "amendment_indicator": "N",
            "total_fed_election_activity_period": None,
            "transfers_from_nonfed_levin_period": None,
            "total_contributions_period": None,
            "offsets_to_operating_expenditures_period": None,
            "total_fed_election_activity_ytd": None,
            "report_year": 2018,
            "offsets_to_operating_expenditures_ytd": None,
            "other_fed_operating_expenditures_ytd": None,
            "total_fed_disbursements_ytd": None,
            "cash_on_hand_close_ytd": None,
            "most_recent_file_number": 1273093.0,
            "shared_fed_operating_expenditures_ytd": None,
            "total_contribution_refunds_ytd": None,
            "total_nonfed_transfers_ytd": None,
            "all_loans_received_period": None,
            "debts_owed_by_committee": 0.0,
            "shared_fed_activity_period": None,
            "net_contributions_ytd": None,
            "transfers_from_affiliated_party_ytd": None,
            "coverage_start_date": "2018-07-01T00:00:00+00:00",
            "refunded_individual_contributions_ytd": None,
            "loan_repayments_received_ytd": None,
            "individual_unitemized_contributions_ytd": None,
            "end_image_number": "201810159125475048",
            "previous_file_number": 1273093.0,
            "independent_expenditures_ytd": None,
            "fed_candidate_committee_contributions_ytd": None,
            "total_fed_receipts_ytd": None,
            "means_filed": "e-file",
            "committee_id": "C00687574",
            "amendment_chain": [1273093.0],
            "total_fed_disbursements_period": None,
            "cycle": 2018,
            "transfers_from_nonfed_account_ytd": None,
            "shared_fed_operating_expenditures_period": None,
            "shared_nonfed_operating_expenditures_period": None,
            "receipt_date": "2018-10-15T00:00:00",
            "refunded_other_political_committee_contributions_period": None,
            "most_recent": True,
            "html_url": "http://docquery.fec.gov/cgi-bin/forms/C00687574/127309",
            "shared_fed_activity_nonfed_ytd": None,
            "cash_on_hand_end_period": 0.0,
            "report_type": "Q3",
            "shared_nonfed_operating_expenditures_ytd": None,
            "subtotal_summary_page_period": None,
            "loan_repayments_received_period": None,
            "political_party_committee_contributions_ytd": None,
            "file_number": 1273093,
            "total_receipts_period": 7400.0,
            "other_fed_receipts_ytd": None,
            "other_disbursements_ytd": None,
            "calendar_ytd": None,
            "independent_expenditures_period": None,
            "individual_itemized_contributions_ytd": None,
            "refunded_other_political_committee_contributions_ytd": None,
            "individual_itemized_contributions_period": None,
            "total_receipts_ytd": None,
            "other_fed_operating_expenditures_period": None,
            "transfers_to_affilitated_committees_ytd": None,
            "report_type_full": "OCTOBER QUARTERLY",
            "coordinated_expenditures_by_party_committee_ytd": None,
            "total_individual_contributions_ytd": None,
            "fed_candidate_committee_contributions_period": None,
            "net_operating_expenditures_ytd": None,
            "transfers_from_nonfed_account_period": None,
            "total_fed_operating_expenditures_ytd": None,
            "all_loans_received_ytd": None,
            "total_operating_expenditures_period": None,
            "other_disbursements_period": None,
            "nonfed_share_allocated_disbursements_period": None,
            "is_amended": False,
        }
    ]

    STOCK_TOTALS = []

    def test_base_case(
        self,
        load_committee_history_mock,
        load_cycle_data_mock,
        load_reports_and_totals_mock,
        load_endpoint_results_mock,
        load_committee_statement_of_organization_mock,
    ):
        cycle = 2018

        test_committee = copy.deepcopy(self.STOCK_COMMITTEE)
        load_committee_history_mock.return_value = (test_committee, [], cycle)
        # cycle_out_of_range, last_cycle_has_financial, cycles
        load_cycle_data_mock.return_value = (False, 2018, [2018])
        load_reports_and_totals_mock.return_value = (
            self.STOCK_REPORTS,
            self.STOCK_TOTALS,
        )
        load_endpoint_results_mock.return_value = mock.MagicMock()
        load_committee_statement_of_organization_mock.return_value = {
            "receipt_date": "2019-11-30T00:00:00"
        }
        template_variables = views.get_committee("C001", 2018)

        committee = template_variables.get("committee")
        assert committee["name"] == test_committee["name"]
        assert committee["committee_id"] == test_committee["committee_id"]
        assert committee["committee_type_full"] == test_committee["committee_type_full"]
        assert committee["committee_type"] == test_committee["committee_type"]
        assert committee["designation_full"] == test_committee["designation_full"]
        assert committee["street_1"] == test_committee["street_1"]
        assert committee["street_2"] == test_committee["street_2"]
        assert committee["city"] == test_committee["city"]
        assert committee["state"] == test_committee["state"]
        assert committee["zip"] == test_committee["zip"]
        assert committee["treasurer_name"] == test_committee["treasurer_name"]
        assert committee["party_full"] == test_committee["party_full"]
        assert committee["former_candidate_id"] is not None
        assert committee["former_candidate_id"] == test_committee["former_candidate_id"]
        assert committee["former_committee_name"] == test_committee["former_committee_name"]
        assert committee["former_candidate_name"] == test_committee["former_candidate_name"]

        assert template_variables["context_vars"] == {
            "cycle": 2018,
            "timePeriod": "2017–2018",
            "name": "MY JOINT FUNDRAISING COMMITTEE",
            "cycleOutOfRange": False,
            "lastCycleHasFinancial": 2018,
        }
        assert template_variables["parent"] == "data"
        assert template_variables["totals"] == []
        assert template_variables["candidates"] == []
        assert template_variables["cycle"] == cycle
        assert template_variables["cycles"] == test_committee["cycles_has_activity"]
        assert template_variables["year"] == test_committee["cycle"]
        assert template_variables["result_type"] == "committees"
        assert template_variables["report_type"] == "pac-party"
        assert template_variables["reports"] == self.STOCK_REPORTS
        assert template_variables["statement_of_organization"] == {
            "receipt_date": "11/30/2019"
        }

    def test_ie_summary(
        self,
        load_committee_history_mock,
        load_cycle_data_mock,
        load_reports_and_totals_mock,
        load_endpoint_results_mock,
        load_committee_statement_of_organization_mock,
    ):
        cycle = 2018

        test_committee = copy.deepcopy(self.STOCK_COMMITTEE)
        test_committee["committee_type"] = "I"

        load_committee_history_mock.return_value = (test_committee, [], cycle)
        # cycle_out_of_range, last_cycle_has_financial, cycles
        load_cycle_data_mock.return_value = (False, 2018, [2018])
        load_reports_and_totals_mock.return_value = (
            {"report_type_full": "YEAR-END", "report_type": "YE"},
            {
                "total_independent_contributions": 11000.0,
                "total_independent_expenditures": 4262.0,
            },
        )
        template_variables = views.get_committee("C001", 2018)

        assert template_variables["ie_summary"] == [
            (11000.0, {"label": "Contributions received", "level": "1"}),
            (4262.0, {"label": "Independent expenditures", "level": "1"}),
        ]

    def test_inaugural_summary(
        self,
        load_committee_history_mock,
        load_cycle_data_mock,
        load_reports_and_totals_mock,
        load_endpoint_results_mock,
        load_committee_statement_of_organization_mock,
    ):
        cycle = 2018

        test_committee = copy.deepcopy(self.STOCK_COMMITTEE)
        test_committee["organization_type"] = "I"
        load_committee_history_mock.return_value = (test_committee, [], cycle)
        load_cycle_data_mock.return_value = (False, 2018, [2018])
        load_reports_and_totals_mock.return_value = (
            {"report_type_full": "POST INAUGURAL SUPPLEMENT", "report_type": "90S"},
            {"receipts": 85530042.0, "contribution_refunds": 966240.0},
        )

        committee = views.get_committee("C001", 2018)

        assert committee["inaugural_summary"] == [
            (85530042.0, {"label": "Total Donations Accepted", "level": "1"}),
            (966240.0, {"label": "Total Donations Refunded", "level": "1"}),
        ]

    def test_host_f4_summary(
        self,
        load_committee_history_mock,
        load_cycle_data_mock,
        load_reports_and_totals_mock,
        load_endpoint_results_mock,
        load_committee_statement_of_organization_mock,
    ):

        cycle = 2018

        test_committee = copy.deepcopy(self.STOCK_COMMITTEE)
        test_committee["organization_type"] = "H"
        load_committee_history_mock.return_value = (test_committee, [], cycle)
        load_cycle_data_mock.return_value = (False, 2018, [2018])
        load_reports_and_totals_mock.return_value = (
            {
                "report_type_full": "POST INAUGURAL SUPPLEMENT",
                "report_type": "90S",
                "form_type": "F4",
            },
            {
                "cash_on_hand_beginning_period": 503347.81,
                "committee_name": "COMMITTEE FOR CHARLOTTE_CHARLOTTE DNC HOST COMMITTEE",
                "other_disbursements": 0.0,
                "last_beginning_image_number": "201610109032226424",
                "itemized_refunds_relating_convention_exp": 0.0,
                "committee_designation_full": "Unauthorized",
                "refunds_relating_convention_exp": 0.0,
                "cycle": 2016,
                "committee_type_full": "Party - Nonqualified",
                "individual_contributions": 0.0,
                "unitemized_other_disb": 0.0,
                "loans_and_loan_repayments_received": 0.0,
                "last_report_year": 2016,
                "itemized_other_disb": 0.0,
                "coverage_start_date": "2016-07-01T00:00:00+00:00",
                "itemized_other_income": 0.0,
                "itemized_convention_exp": 4500.0,
                "exp_subject_limits": 4500.0,
                "other_refunds": 0.0,
                "last_cash_on_hand_end_period": 498847.81,
                "exp_prior_years_subject_limits": 0.0,
                "all_loans_received": 0.0,
                "last_report_type_full": "OCTOBER QUARTERLY",
                "loans_made": 0.0,
                "unitemized_other_income": 0.0,
                "loans_and_loan_repayments_made": 0.0,
                "receipts": 12345.0,
                "committee_id": "C00493254",
                "fed_disbursements": 0.0,
                "committee_designation": "U",
                "loan_repayments_received": 0.0,
                "itemized_other_refunds": 0.0,
                "unitemized_other_refunds": 0.0,
                "unitemized_refunds_relating_convention_exp": 0.0,
                "contributions": 0.0,
                "transfers_from_affiliated_party": 0.0,
                "coverage_end_date": "2016-09-30T00:00:00+00:00",
                "convention_exp": 4500.0,
                "individual_unitemized_contributions": 0.0,
                "federal_funds": 12345.0,
                "transfers_to_affiliated_committee": 0.0,
                "other_fed_receipts": 0.0,
                "party_full": "DEMOCRATIC PARTY",
                "last_debts_owed_by_committee": 5000,
                "loan_repayments_made": 0.0,
                "unitemized_convention_exp": 0.0,
                "committee_type": "X",
                "disbursements": 4500.0,
                "last_debts_owed_to_committee": 1000,
                "total_exp_subject_limits": None,
            },
        )

        template_variables = views.get_committee("C001", 2018)
        assert template_variables["raising_summary"] == [
            (
                12345.0,
                {"label": "Total receipts", "level": "1", "term": "total receipts"},
            ),
            (12345.0, {"label": "Federal funds", "level": "2"}),
            (
                0.0,
                {
                    "label": "Total Contributions to Defray Convention Expenses",
                    "level": "2",
                },
            ),
            (
                0.0,
                {
                    "label": "Itemized Contributions to Defray Convention Expenses",
                    "level": "3",
                },
            ),
            (
                0.0,
                {
                    "label": "Unitemized Contributions to Defray Convention Expenses",
                    "level": "3",
                },
            ),
            (0.0, {"label": "Transfers from affiliated committees", "level": "2"}),
            (0.0, {"label": "Loans Received", "level": "3"}),
            (0.0, {"label": "Loan Repayments Received", "level": "3"}),
            (
                0.0,
                {"label": "Other Refunds, Rebates, Returns of Deposits", "level": "2"},
            ),
            (
                0.0,
                {
                    "label": " Itemized Other Refunds, Rebates, Returns of Deposits",
                    "level": "3",
                },
            ),
            (
                0.0,
                {
                    "label": "Unitemized Other Refunds, Rebates, Returns of Deposits",
                    "level": "3",
                },
            ),
            (0.0, {"label": " Other Income", "level": "2"}),
            (0.0, {"label": "Itemized Other Income", "level": "3"}),
            (0.0, {"label": "Unitemized Other Income", "level": "3"}),
        ]

        assert template_variables["spending_summary"] == [
            (
                4500.0,
                {
                    "label": "Total disbursements",
                    "level": "1",
                    "term": "total disbursements",
                },
            ),
            (4500.0, {"label": "Convention Expenditures", "level": "2"}),
            (4500.0, {"label": "Itemized Convention Expenditures", "level": "3"}),
            (0.0, {"label": "Unitemized Convention Expenditures", "level": "3"}),
            (0.0, {"label": "Transfers to Affiliated Committees", "level": "2"}),
            (0.0, {"label": "Loans and Loan Repayments Made", "level": "2"}),
            (0.0, {"label": "Loans Made", "level": "3"}),
            (0.0, {"label": "Loan Repayments Made", "level": "3"}),
            (0.0, {"label": "Other Disbursements", "level": "2"}),
            (0.0, {"label": "Itemized Other Disbursements", "level": "3"}),
            (0.0, {"label": "Unitemized Other Disbursements", "level": "3"}),
        ]

        assert template_variables["cash_summary"] == [
            (503347.81, {"label": "Beginning cash on hand", "level": "2"}),
            (
                498847.81,
                {
                    "label": "Ending cash on hand",
                    "term": "ending cash on hand",
                    "level": "2",
                },
            ),
            (1000, {"label": "Debts/loans owed to committee", "level": "2"}),
            (5000, {"label": "Debts/loans owed by committee", "level": "2"}),
        ]

    def test_host_f3x_summary_returns_standard_values(
        self,
        load_committee_history_mock,
        load_cycle_data_mock,
        load_reports_and_totals_mock,
        load_endpoint_results_mock,
        load_committee_statement_of_organization_mock,
    ):
        cycle = 2018

        test_committee = copy.deepcopy(self.STOCK_COMMITTEE)
        test_committee["organization_type"] = "H"
        load_committee_history_mock.return_value = (test_committee, [], cycle)
        load_cycle_data_mock.return_value = (False, 2018, [2018])
        load_reports_and_totals_mock.return_value = (
            self.STOCK_REPORTS,
            self.STOCK_TOTALS,
        )

        template_variables = views.get_committee("C001", 2018)
        committee = template_variables.get("committee")

        assert committee["name"] == test_committee["name"]
        assert committee["committee_id"] == test_committee["committee_id"]
        assert committee["committee_type_full"] == test_committee["committee_type_full"]
        assert committee["committee_type"] == test_committee["committee_type"]
        assert committee["designation_full"] == test_committee["designation_full"]
        assert committee["street_1"] == test_committee["street_1"]
        assert committee["street_2"] == test_committee["street_2"]
        assert committee["city"] == test_committee["city"]
        assert committee["state"] == test_committee["state"]
        assert committee["zip"] == test_committee["zip"]
        assert committee["treasurer_name"] == test_committee["treasurer_name"]
        assert committee["cycle"] == test_committee["cycle"]
        assert committee["cycles"] == test_committee["cycles"]
        assert committee["party_full"] == test_committee["party_full"]

        assert template_variables["year"] == test_committee["cycle"]
        assert template_variables["parent"] == "data"
        assert template_variables["context_vars"] == {
            "cycle": 2018,
            "timePeriod": "2017–2018",
            "name": "MY JOINT FUNDRAISING COMMITTEE",
            "cycleOutOfRange": False,
            "lastCycleHasFinancial": 2018,
        }
        assert template_variables["totals"] == []
        assert template_variables["candidates"] == []
        assert template_variables["result_type"] == "committees"
        assert template_variables["report_type"] == "pac-party"
        assert template_variables["reports"] == self.STOCK_REPORTS


@mock.patch.object(api_caller, "load_endpoint_results")
@mock.patch.object(api_caller, "load_first_row_data")
class TestCommitteeApiCalls(TestCase):
    def test_load_committee_history_uses_last_cycle_has_financial(
        self, load_first_row_data_mock, load_endpoint_results_mock
    ):
        committee_id = "C007"
        cycle = None
        load_first_row_data_mock.return_value = {
            "city": "ELK GROVE",
            "organization_type_full": None,
            "committee_id": "C007",
            "zip": "95624",
            "last_cycle_has_financial": 2020,
            "cycle": 2020,
            "candidate_ids": ["P60017852"],
            "state_full": "California",
            "cycles_has_financial": [2020],
            "name": "CLIFTON ROBERTS FOR PRESIDENT",
            "last_cycle_has_activity": 2020,
            "organization_type": None,
            "committee_type_full": "Presidential",
            "party_full": "OTHER",
            "designation_full": "Principal campaign committee",
            "cycles": [2020],
            "cycles_has_activity": [2020],
            "committee_type": "P",
            "party": "OTH",
            "designation": "P",
            "affiliated_committee_name": "NONE",
            "street_1": "9382 WILLOW POND CIRCLE",
            "state": "CA",
            "street_2": None,
            "treasurer_name": "OWENS, STACY",
            "filing_frequency": "Q",
        }
        load_endpoint_results_mock.return_value = mock.MagicMock()
        committee, all_candidates, cycle = views.load_committee_history(
            committee_id, cycle
        )

        assert cycle == 2020

    def test_load_committee_history_uses_last_cycle_has_activity(
        self, load_first_row_data_mock, load_endpoint_results_mock
    ):
        committee_id = "C007"
        cycle = None
        first_row_data = {
            "city": "ELK GROVE",
            "organization_type_full": None,
            "committee_id": "C007",
            "zip": "95624",
            "last_cycle_has_financial": None,
            "cycle": None,
            "candidate_ids": ["P60017852"],
            "state_full": "California",
            "cycles_has_financial": [],
            "name": "CLIFTON ROBERTS FOR PRESIDENT",
            "last_cycle_has_activity": 2018,
            "organization_type": None,
            "committee_type_full": "Presidential",
            "party_full": "OTHER",
            "designation_full": "Principal campaign committee",
            "cycles": [],
            # make sure we clean 'None' value in cycles_has_activity correctly
            "cycles_has_activity": [2018, None],
            "committee_type": "P",
            "party": "OTH",
            "designation": "P",
            "affiliated_committee_name": "NONE",
            "street_1": "9382 WILLOW POND CIRCLE",
            "state": "CA",
            "street_2": None,
            "treasurer_name": "OWENS, STACY",
            "filing_frequency": "Q",
        }
        load_first_row_data_mock.return_value = first_row_data
        load_endpoint_results_mock.return_value = []
        committee, all_candidates, cycle = views.load_committee_history(
            committee_id, cycle
        )
        assert cycle == 2018
        assert all_candidates == []
        assert committee == first_row_data

        # check if cycles_has_activity include 'None' item
        # in function load_committee_history() in views.py (line 524)
        # we remove 'None' value in cycles_has_activity
        # so make sure cycles_has_activity not include 'None' value anymore,
        assert None not in committee["cycles_has_activity"]
        cycle_out_of_range, fallback_cycle, cycles = views.load_cycle_data(
            committee, cycle
        )

        assert cycle_out_of_range is False
        assert fallback_cycle == 2018
        assert cycles == [2018]

    def test_cycle_out_of_range(
        self, load_first_row_data_mock, load_endpoint_results_mock
    ):
        committee_id = "C007"
        cycle = 2020
        first_row_data = {
            "city": "ELK GROVE",
            "organization_type_full": None,
            "committee_id": "C007",
            "zip": "95624",
            "last_cycle_has_financial": None,
            "cycle": 2018,
            "candidate_ids": ["P60017852"],
            "state_full": "California",
            "cycles_has_financial": [2018],
            "name": "CLIFTON ROBERTS FOR PRESIDENT",
            "last_cycle_has_activity": 2018,
            "organization_type": None,
            "committee_type_full": "Presidential",
            "party_full": "OTHER",
            "designation_full": "Principal campaign committee",
            "cycles": [],
            "cycles_has_activity": [2018],
            "committee_type": "P",
            "party": "OTH",
            "designation": "P",
            "affiliated_committee_name": "NONE",
            "street_1": "9382 WILLOW POND CIRCLE",
            "state": "CA",
            "street_2": None,
            "treasurer_name": "OWENS, STACY",
            "filing_frequency": "Q",
        }
        load_first_row_data_mock.return_value = first_row_data
        load_endpoint_results_mock.return_value = []
        committee, all_candidates, cycle = views.load_committee_history(
            committee_id, cycle
        )
        assert cycle == 2020
        assert all_candidates == []
        assert committee == first_row_data

        cycle_out_of_range, fallback_cycle, cycles = views.load_cycle_data(
            committee, cycle
        )
        assert cycle_out_of_range is True
        assert fallback_cycle == 2018
        assert cycles == [2018]
