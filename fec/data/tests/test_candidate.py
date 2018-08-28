from unittest import TestCase
from unittest import mock
import copy

from data import api_caller
from data.views import get_candidate, groupby


@mock.patch.object(api_caller, 'load_candidate_statement_of_candidacy')
@mock.patch.object(api_caller, 'load_candidate_totals')
@mock.patch.object(api_caller, 'load_with_nested')
class TestCandidate(TestCase):

    STOCK_CANDIDATE = {
        "candidate_id": "C001",
        "name": "Lady Liberty",
        "cycles": [2014, 2016, 2018],
        "election_years": [2016, 2018],
        "election_districts": ["01", "02"],
        "office": "H",
        "office_full": "House",
        "state": "VA",
        "district": "01",
        "party_full": "Independent",
        "incumbent_challenge_full": "Incumbent",
    }
    STOCK_COMMITTEE_LIST = [
        {
            'designation': 'P',
            'cycles': [2016, 2014, 2012, 2018],
            'name': 'My Primary Campaign Committee',
            'cycle': 2016,
            'committee_id': 'C001',
        }, {
            'designation': 'A',
            'cycles': [2016, 2014, 2012, 2018],
            'name': 'My Authorized Campaign Committee',
            'cycle': 2016,
            'committee_id': 'C002',
        }, {
            'designation': 'J',
            'cycles': [2016, 2014, 2012, 2018],
            'name': 'Joint Fundraising Committee',
            'cycle': 2016,
            'committee_id': 'C003',
        }
    ]

    def test_base_case(self, load_with_nested_mock, load_candidate_totals_mock,
                       load_candidate_statement_of_candidacy_mock):
        cycle = 2016
        show_full_election = True

        test_candidate = copy.deepcopy(self.STOCK_CANDIDATE)
        load_with_nested_mock.return_value = (
            test_candidate,
            self.STOCK_COMMITTEE_LIST,
            cycle
        )
        candidate = get_candidate('C001', 2018, show_full_election)

        assert candidate['candidate_id'] == test_candidate['candidate_id']
        assert candidate['name'] == test_candidate['name']
        assert candidate['cycles'] == test_candidate['cycles']
        assert candidate['election_years'] == test_candidate['election_years']
        assert candidate['office'] == test_candidate['office']
        assert candidate['office_full'] == test_candidate['office_full']
        assert candidate['state'] == test_candidate['state']
        assert candidate['district'] == test_candidate['district']
        assert candidate['party_full'] == test_candidate['party_full']
        assert candidate['incumbent_challenge_full'] == test_candidate[
                'incumbent_challenge_full']
        assert candidate['cycle'] == cycle
        assert candidate['election_year'] == cycle
        assert candidate['result_type'] == 'candidates'
        assert candidate['duration'] == 2
        assert candidate['min_cycle'] == cycle - 2
        assert candidate['report_type'] == 'house-senate'
        assert candidate['max_cycle'] == cycle
        assert candidate['show_full_election'] == show_full_election

        committee_groups = groupby(
            self.STOCK_COMMITTEE_LIST, lambda each: each['designation']
        )

        assert candidate['committee_groups'] == committee_groups
        assert candidate['committees_authorized'] == committee_groups.get(
            'P', []) + committee_groups.get('A', [])
        assert candidate['committee_ids'] == [
            committee['committee_id']
            for committee in candidate['committees_authorized']
        ]

        assert candidate['raising_summary'] == []
        assert candidate['spending_summary'] == []
        assert candidate['cash_summary'] == []
        assert candidate['elections'] == [(2018, '02'), (2016, '01')]
        assert candidate['candidate'] == test_candidate
        assert candidate['context_vars'] == {
            'cycles': [2014, 2016, 2018],
            'name': test_candidate["name"],
            'cycle': cycle,
            'electionFull': show_full_election,
            'candidateID': test_candidate["candidate_id"]
        }

    def test_special_election_election_years_only_rounded(
            self, load_with_nested_mock, load_candidate_totals_mock,
            load_candidate_statement_of_candidacy_mock):

        # Candidate ran in 2017 and 2018. Passing 2016 as cycle.
        # Election years should be rounded, election year should be 2017
        test_candidate = copy.deepcopy(self.STOCK_CANDIDATE)
        test_candidate["cycles"] = [2016, 2018]
        test_candidate["election_years"] = [2017, 2018, 2019]

        load_with_nested_mock.return_value = (
            test_candidate,
            mock.MagicMock(),
            2016
        )
        candidate = get_candidate('C001', 2016, True)
        assert candidate["election_years"] == [2018, 2020]
        assert candidate["election_year"] == 2017

    def test_candidate_with_future_cycle_falls_back_to_present(
            self, load_with_nested_mock, load_candidate_totals_mock,
            load_candidate_statement_of_candidacy_mock):

        test_candidate = copy.deepcopy(self.STOCK_CANDIDATE)
        test_candidate["election_years"] = [2018, 2100]
        test_candidate["cycles"] = [2018]
        test_candidate["office"] == 'S'
        load_with_nested_mock.return_value = (
            test_candidate,
            self.STOCK_COMMITTEE_LIST,
            2018
        )
        candidate = get_candidate('C001', 2100, True)
        assert candidate["cycle"] == 2018
        assert candidate["cycles"] == [2018]

    def test_election_full_returns_false_nested_returns_future_cycle(
            self, load_with_nested_mock, load_candidate_totals_mock,
            load_candidate_statement_of_candidacy_mock):

        test_candidate = copy.deepcopy(self.STOCK_CANDIDATE)
        test_committee = copy.deepcopy(self.STOCK_COMMITTEE_LIST[0])
        test_candidate["election_years"] = [2018, 2100]
        test_committee["cycles"] = [2018, 2100]

        load_with_nested_mock.return_value = (
            test_candidate,
            [test_committee],
            2100
        )
        candidate = get_candidate('C001', 2100, True)
        assert candidate["show_full_election"] is False

    def test_aggregates(
            self, load_with_nested_mock, load_candidate_totals_mock,
            load_candidate_statement_of_candidacy_mock):
        load_with_nested_mock.return_value = (
            self.STOCK_CANDIDATE,
            self.STOCK_COMMITTEE_LIST,
            2018
        )
        load_candidate_totals_mock.side_effect = [
            # 'aggregate'
            {
                'loan_repayments_other_loans': 0.0,
                'contributions': 26127221.0,
                'loan_repayments_candidate_loans': 0.0,
                'net_operating_expenditures': 13403095.0,
                'operating_expenditures': 13456880.0,
                'individual_contributions': 25695351.0,
                'full_election': True,
                'individual_itemized_contributions': 9017667.0,
                'political_party_committee_contributions': 2090.0,
                'cycle': 2018,
                'last_report_type_full': 'JULY QUARTERLY',
                'refunded_other_political_committee_contributions': 2493.0,
                'offsets_to_operating_expenditures': 53775.0,
                'last_debts_owed_by_committee': 0.0,
                'transaction_coverage_date': '2018-06-30T00:00:00+00:00',
                'loans_made_by_candidate': 0.0,
                'last_debts_owed_to_committee': 0.0,
                'disbursements': 14702788.0,
                'other_political_committee_contributions': 429778.0,
                'net_contributions': 25925858.0,
                'candidate_contribution': 0.0,
                'loan_repayments': 0.0,
                'last_net_contributions': 2279216.0,
                'total_offsets_to_operating_expenditures': None,
                'offsets_to_legal_accounting': None,
                'receipts': 30035777.0,
                'candidate_id': 'S2MA00170',
                'coverage_start_date': '2013-01-01T00:00:00+00:00',
                'last_cash_on_hand_end_period': 15627661.0,
                'all_other_loans': 0.0,
                'individual_unitemized_contributions': 16677677.0,
                'last_beginning_image_number': '201807190200580760',
                'other_disbursements': 1044533.0,
                'refunded_political_party_committee_contributions': 400.0,
                'other_receipts': 175793.0,
                'loans': 0.0,
                'coverage_end_date': '2018-06-30T00:00:00+00:00',
                'exempt_legal_accounting_disbursement': None,
                'federal_funds': None,
                'transfers_to_other_authorized_committee': 0.0,
                'refunded_individual_contributions': 198466.0,
                'contribution_refunds': 201361.0,
                'last_report_year': 2018,
                'offsets_to_fundraising_expenditures': None,
                'fundraising_disbursements': None,
                'last_net_operating_expenditures': 2253555.0,
                'transfers_from_other_authorized_committee': 3678961.0
            },
            # 'two_year_totals'
            {
                'loan_repayments_other_loans': 0.0,
                'contributions': 16969092.0,
                'loan_repayments_candidate_loans': 0.0,
                'net_operating_expenditures': 9579415.0,
                'operating_expenditures': 9582171.0,
                'individual_contributions': 16636062.0,
                'full_election': False,
                'individual_itemized_contributions': 6176593.0,
                'political_party_committee_contributions': 0.0,
                'cycle': 2018,
                'last_report_type_full': 'JULY QUARTERLY',
                'refunded_other_political_committee_contributions': 1993.0,
                'offsets_to_operating_expenditures': 2752.0,
                'last_debts_owed_by_committee': 0.0,
                'transaction_coverage_date': '2018-06-30T00:00:00+00:00',
                'loans_made_by_candidate': 0.0,
                'last_debts_owed_to_committee': 0.0,
                'disbursements': 9873958.0,
                'other_political_committee_contributions': 333028.0,
                'net_contributions': 16834766.0,
                'candidate_contribution': 0.0,
                'loan_repayments': 0.0,
                'last_net_contributions': 2279216.0,
                'total_offsets_to_operating_expenditures': None,
                'offsets_to_legal_accounting': None,
                'receipts': 20656072.0,
                'candidate_id': 'S2MA00170',
                'coverage_start_date': '2017-01-01T00:00:00+00:00',
                'last_cash_on_hand_end_period': 15627661.0,
                'all_other_loans': 0.0,
                'individual_unitemized_contributions': 10459468.0,
                'last_beginning_image_number': '201807190200580760',
                'other_disbursements': 157458.0,
                'refunded_political_party_committee_contributions': 0.0,
                'other_receipts': 26563.0,
                'loans': 0.0,
                'coverage_end_date': '2018-06-30T00:00:00+00:00',
                'exempt_legal_accounting_disbursement': None,
                'federal_funds': None,
                'transfers_to_other_authorized_committee': 0.0,
                'refunded_individual_contributions': 132330.0,
                'contribution_refunds': 134324.0,
                'last_report_year': 2018,
                'offsets_to_fundraising_expenditures': None,
                'fundraising_disbursements': None,
                'last_net_operating_expenditures': 2253555.0,
                'transfers_from_other_authorized_committee': 3657657.0
            }
        ]
        candidate = get_candidate('S001', 2018, True)

        assert candidate["cash_summary"] == [(15627661.0, {
            'label': 'Ending cash on hand',
            'term': 'ending cash on hand',
            'level': '2'
        }), (0.0, {
            'label': 'Debts/loans owed to committee',
            'level': '2'
        }), (0.0, {
            'label': 'Debts/loans owed by committee',
            'level': '2'
        })]
        assert candidate["raising_summary"] == [(30035777.0, {
            'label': 'Total receipts',
            'level': '1',
            'term': 'total receipts'
        }), (26127221.0, {
            'label': 'Total contributions',
            'level': '2'
        }), (25695351.0, {
            'label': 'Total individual contributions',
            'level': '3'
        }), (9017667.0, {
            'label': 'Itemized individual contributions',
            'level': '4',
            'type': {
                'link': 'receipts',
                'P': 'F3P-17A',
                'H': 'F3-11AI',
                'S': 'F3-11AI',
                'O': 'F3X-11AI'
            }
        }), (16677677.0, {
            'label': 'Unitemized individual contributions',
            'level': '4'
        }), (2090.0, {
            'label': 'Party committee contributions',
            'level': '3',
            'type': {
                'link': 'receipts',
                'P': 'F3P-17B',
                'H': 'F3-11B',
                'S': 'F3-11B',
                'O': 'F3X-11B'
            }
        }), (429778.0, {
            'label': 'Other committee contributions',
            'level': '3',
            'type': {
                'link': 'receipts',
                'P': 'F3P-17C',
                'H': 'F3-11C',
                'S': 'F3-11C',
                'O': 'F3X-11C'
            }
        }), (0.0, {
            'label': 'Candidate contributions',
            'level': '3',
            'type': {
                'link': 'receipts',
                'P': 'F3P-17D',
                'H': 'F3-11D',
                'S': 'F3-11D'
            }
        }), (3678961.0, {
            'label': 'Transfers from other authorized committees',
            'level': '2',
            'type': {
                'link': 'receipts',
                'H': 'F3-12',
                'S': 'F3-12'
            }
        }), (0.0, {
            'label': 'Total loans received',
            'level': '2'
        }), (0.0, {
            'label': 'Loans made by candidate',
            'level': '3',
            'type': {
                'link': 'receipts',
                'H': 'F3-13A',
                'S': 'F3-13A'
            }
        }), (0.0, {
            'label': 'Other loans',
            'level': '3',
            'type': {
                'link': 'receipts',
                'H': 'F3-13B',
                'S': 'F3-13B'
            }
        }), (53775.0, {
            'label': 'Offsets to operating expenditures',
            'level': '2',
            'type': {
                'link': 'receipts',
                'H': 'F3-14',
                'S': 'F3-14',
                'O': 'F3X-15'
            }
        }), (175793.0, {
            'label': 'Other receipts',
            'level': '2',
            'type': {
                'link': 'receipts',
                'P': 'F3P-21',
                'H': 'F3-15',
                'S': 'F3-15'
            }
        })]

        assert candidate["spending_summary"] == [(14702788.0, {
            'label': 'Total disbursements',
            'level': '1',
            'term': 'total disbursements'
        }), (13456880.0, {
            'label': 'Operating expenditures',
            'term': 'operating expenditures',
            'level': '2',
            'type': {
                'link': 'disbursements',
                'P': 'F3P-23',
                'H': 'F3-17',
                'S': 'F3-17'
            }
        }), (0.0, {
            'label': 'Transfers to other authorized committees',
            'level': '2',
            'type': {
                'link': 'disbursements',
                'H': 'F3-18',
                'S': 'F3-18',
                'P': 'F3P-24'
            }
        }), (201361.0, {
            'label': 'Total contribution refunds',
            'level': '2'
        }), (198466.0, {
            'label': 'Individual refunds',
            'level': '3',
            'type': {
                'link': 'disbursements',
                'P': 'F3P-28A',
                'H': 'F3-20A',
                'S': 'F3-20A',
                'O': 'F3X-28A'
            }
        }), (400.0, {
            'label': 'Political party refunds',
            'level': '3',
            'type': {
                'link': 'disbursements',
                'P': 'F3P-28B',
                'H': 'F3-20B',
                'S': 'F3-20B',
                'O': 'F3X-28B'
            }
        }), (2493.0, {
            'label': 'Other committee refunds',
            'level': '3',
            'type': {
                'link': 'disbursements',
                'P': 'F3P-28C',
                'H': 'F3-20C',
                'S': 'F3-20C',
                'O': 'F3X-28C'
            }
        }), (0.0, {
            'label': 'Total loan repayments',
            'level': '2'
        }), (0.0, {
            'label': 'Candidate loan repayments',
            'level': '3',
            'type': {
                'link': 'disbursements',
                'H': 'F3-19A',
                'S': 'F3-19A'
            }
        }), (0.0, {
            'label': 'Other loan repayments',
            'level': '3',
            'type': {
                'link': 'disbursements',
                'H': 'F3-19B',
                'S': 'F3-19B'
            }
        }), (1044533.0, {
            'label': 'Other disbursements',
            'level': '2',
            'type': {
                'link': 'disbursements',
                'P': 'F3P-29',
                'H': 'F3-21',
                'S': 'F3-21',
                'O': 'F3X-29'
            }
        })]

    def test_no_aggregates(
            self, load_with_nested_mock, load_candidate_totals_mock,
            load_candidate_statement_of_candidacy_mock):
        load_with_nested_mock.return_value = (
            self.STOCK_CANDIDATE,
            self.STOCK_COMMITTEE_LIST,
            2018
        )
        load_candidate_totals_mock.side_effect = [{}, {}]
        candidate = get_candidate('S001', 2018, True)
        assert candidate["cash_summary"] is None
        assert candidate["raising_summary"] is None
        assert candidate["spending_summary"] is None
