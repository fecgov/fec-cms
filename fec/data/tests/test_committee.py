from unittest import TestCase
from unittest import mock
import copy

from data import api_caller
from data.views import get_committee


@mock.patch.object(api_caller, '_call_api')
@mock.patch.object(api_caller, 'load_cmte_financials')
@mock.patch.object(api_caller, 'load_with_nested')
class TestCommittee(TestCase):

    STOCK_COMMITTEE = {
        'organization_type_full': None,
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
        'name': 'MY JOINT FUNDRAISING COMMITTEE'
    }

    STOCK_FINANCIALS = {
        'reports': [
            {
                'non_allocated_fed_election_activity_period': None,
                'allocated_federal_election_levin_share_period': None,
                'total_disbursements_period': 7400.0,
                'coverage_end_date': '2018-09-30T00:00:00+00:00',
                'document_description': 'OCTOBER QUARTERLY 2018',
                'refunded_political_party_committee_contributions_ytd': None,
                'loans_made_period': None,
                'net_operating_expenditures_period': None,
                'committee_type': 'N',
                'committee_name': 'GREEN VICTORY FUND',
                'amendment_indicator_full': 'NEW',
                'net_contributions_period': None,
                'total_disbursements_ytd': None,
                'fec_url': 'http://docquery.fec.gov/dcdev/posted/1273093.fec',
                'other_fed_receipts_period': None,
                'shared_fed_activity_ytd': None,
                'cash_on_hand_beginning_period': 0.0,
                'total_operating_expenditures_ytd': None,
                'non_allocated_fed_election_activity_ytd': None,
                'debts_owed_to_committee': 0.0,
                'pdf_url': ' http://docquery.fec.gopdf042/201810159125475042/20181015912  5475042.pdf',
                'political_party_committee_contributions_period': None,
                'other_political_committee_contributions_period': None,
                'fec_file_id': 'FEC-1273093',
                'beginning_image_number': '201810159125475042',
                'cash_on_hand_beginning_calendar_ytd': None,
                'coordinated_expenditures_by_party_committee_period': None,
                'total_nonfed_transfers_period': None,
                'loan_repayments_made_period': None,
                'fed_candidate_contribution_refunds_period': None,
                'individual_unitemized_contributions_period': None,
                'fed_candidate_committee_contribution_refunds_ytd': None,
                'total_fed_receipts_period': None,
                'transfers_from_affiliated_party_period': None,
                'total_contributions_ytd': None,
                'refunded_political_party_committee_contributions_period': None,
                'transfers_to_affiliated_committee_period': None,
                'subtotal_summary_ytd': None,
                'refunded_individual_contributions_period': None,
                'transfers_from_nonfed_levin_ytd': None,
                'other_political_committee_contributions_ytd': None,
                'report_form': 'Form 3',
                'total_fed_operating_expenditures_period': None,
                'total_individual_contributions_period': None,
                'csv_url': 'http://docquery.fec.gov/csv/093/1273093.csv',
                'total_contribution_refunds_period': None,
                'loans_made_ytd': None,
                'loan_repayments_made_ytd': None,
                'amendment_indicator': 'N',
                'total_fed_election_activity_period': None,
                'transfers_from_nonfed_levin_period': None,
                'total_contributions_period': None,
                'offsets_to_operating_expenditures_period': None,
                'total_fed_election_activity_ytd': None,
                'report_year': 2018,
                'offsets_to_operating_expenditures_ytd': None,
                'other_fed_operating_expenditures_ytd': None,
                'total_fed_disbursements_ytd': None,
                'cash_on_hand_close_ytd': None,
                'most_recent_file_number': 1273093.0,
                'shared_fed_operating_expenditures_ytd': None,
                'total_contribution_refunds_ytd': None,
                'total_nonfed_transfers_ytd': None,
                'all_loans_received_period': None,
                'debts_owed_by_committee': 0.0,
                'shared_fed_activity_period': None,
                'net_contributions_ytd': None,
                'transfers_from_affiliated_party_ytd': None,
                'coverage_start_date': '2018-07-01T00:00:00+00:00',
                'refunded_individual_contributions_ytd': None,
                'loan_repayments_received_ytd': None,
                'individual_unitemized_contributions_ytd': None,
                'end_image_number': '201810159125475048',
                'previous_file_number': 1273093.0,
                'independent_expenditures_ytd': None,
                'fed_candidate_committee_contributions_ytd': None,
                'total_fed_receipts_ytd': None,
                'means_filed': 'e-file',
                'committee_id': 'C00687574',
                'amendment_chain': [1273093.0],
                'total_fed_disbursements_period': None,
                'cycle': 2018,
                'transfers_from_nonfed_account_ytd': None,
                'shared_fed_operating_expenditures_period': None,
                'shared_nonfed_operating_expenditures_period': None,
                'receipt_date': '2018-10-15T00:00:00',
                'refunded_other_political_committee_contributions_period': None,
                'most_recent': True,
                'html_url': 'http://docquery.fec.gov/cgi-bin/forms/C00687574/127309',
                'shared_fed_activity_nonfed_ytd': None,
                'cash_on_hand_end_period': 0.0,
                'report_type': 'Q3',
                'shared_nonfed_operating_expenditures_ytd': None,
                'subtotal_summary_page_period': None,
                'loan_repayments_received_period': None,
                'political_party_committee_contributions_ytd': None,
                'file_number': 1273093,
                'total_receipts_period': 7400.0,
                'other_fed_receipts_ytd': None,
                'other_disbursements_ytd': None,
                'calendar_ytd': None,
                'independent_expenditures_period': None,
                'individual_itemized_contributions_ytd': None,
                'refunded_other_political_committee_contributions_ytd': None,
                'individual_itemized_contributions_period': None,
                'total_receipts_ytd': None,
                'other_fed_operating_expenditures_period': None,
                'transfers_to_affilitated_committees_ytd': None,
                'report_type_full': 'OCTOBER QUARTERLY',
                'coordinated_expenditures_by_party_committee_ytd': None,
                'total_individual_contributions_ytd': None,
                'fed_candidate_committee_contributions_period': None,
                'net_operating_expenditures_ytd': None,
                'transfers_from_nonfed_account_period': None,
                'total_fed_operating_expenditures_ytd': None,
                'all_loans_received_ytd': None,
                'total_operating_expenditures_period': None,
                'other_disbursements_period': None,
                'nonfed_share_allocated_disbursements_period': None,
                'is_amended': False
            }
        ],
        'totals': []
    }

    def test_base_case(self, load_with_nested_mock, load_cmte_financials_mock,
                       _call_api_mock):
        cycle = 2018

        test_committee = copy.deepcopy(self.STOCK_COMMITTEE)
        load_with_nested_mock.return_value = (
            test_committee,
            [],
            cycle
        )
        load_cmte_financials_mock.return_value = self.STOCK_FINANCIALS
        committee = get_committee('C001', 2018)

        assert committee['name'] == test_committee['name']
        assert committee['committee_id'] == test_committee['committee_id']
        assert committee['committee_type_full'] == test_committee['committee_type_full']
        assert committee['committee_type'] == test_committee['committee_type']
        assert committee['designation_full'] == test_committee['designation_full']
        assert committee['street_1'] == test_committee['street_1']
        assert committee['street_2'] == test_committee['street_2']
        assert committee['city'] == test_committee['city']
        assert committee['state'] == test_committee['state']
        assert committee['zip'] == test_committee['zip']
        assert committee['treasurer_name'] == test_committee['treasurer_name']
        # assert committee['parent'] == test_committee['parent']
        assert committee['cycle'] == test_committee['cycle']
        assert committee['cycles'] == test_committee['cycles']
        # assert committee['year'] == test_committee['year']
        # assert committee['result_type'] == test_committee['result_type']
        # assert committee['report_type'] == test_committee['report_type']
        # assert committee['reports'] == test_committee['reports']
        assert committee['context_vars'] == {
            'cycle': 2018,
            'timePeriod': '2017–2018',
            'name': 'MY JOINT FUNDRAISING COMMITTEE'
        }
