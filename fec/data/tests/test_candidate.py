from unittest import TestCase
from unittest import mock
import copy

from data import api_caller
from data.views import get_candidate


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
        load_candidate_totals_mock.return_value = {}
        candidate = get_candidate('C001', 2018, show_full_election)

        assert candidate['candidate_id'] == test_candidate['candidate_id']
        assert candidate['name'] == test_candidate['name']
        assert candidate['cycles'] == test_candidate['cycles']
        assert candidate['min_cycle'] == cycle - 2
        assert candidate['max_cycle'] == cycle
        assert candidate['election_year'] == cycle
        assert candidate['election_years'] == test_candidate['election_years']
        assert candidate['office'] == test_candidate['office']
        assert candidate['office_full'] == test_candidate['office_full']
        assert candidate['state'] == test_candidate['state']
        assert candidate['district'] == test_candidate['district']
        assert candidate['party_full'] == test_candidate['party_full']
        assert candidate['incumbent_challenge_full'] == test_candidate[
                'incumbent_challenge_full']
        assert candidate['cycle'] == cycle
        assert candidate['result_type'] == 'candidates'
        assert candidate['duration'] == 2
        assert candidate['report_type'] == 'house-senate'
        assert candidate['show_full_election'] == show_full_election

        assert candidate['committee_groups'] == {
            'P': [{
                'designation': 'P',
                'cycles': [2016, 2014, 2012, 2018],
                'name': 'My Primary Campaign Committee',
                'cycle': 2016,
                'related_cycle': 2016,
                'committee_id': 'C001'}],
            'A': [{
                'designation': 'A',
                'cycles': [2016, 2014, 2012, 2018],
                'name': 'My Authorized Campaign Committee',
                'cycle': 2016,
                'related_cycle': 2016,
                'committee_id': 'C002'}],
            'J': [{
                'designation': 'J',
                'cycles': [2016, 2014, 2012, 2018],
                'name': 'Joint Fundraising Committee',
                'cycle': 2016,
                'related_cycle': 2016,
                'committee_id': 'C003'}]
        }

        assert candidate['committees_authorized'] == (
            candidate['committee_groups']['P'] +
            candidate['committee_groups']['A'])
        assert candidate['committee_ids'] == [
            committee['committee_id']
            for committee in candidate['committees_authorized']
        ]

        assert candidate['elections'] == [(2018, '02'), (2016, '01')]
        assert candidate['candidate'] == test_candidate
        assert candidate['context_vars'] == {
            'cycles': [2014, 2016, 2018],
            'name': test_candidate["name"],
            'cycle': cycle,
            'electionFull': show_full_election,
            'candidateID': test_candidate["candidate_id"]
        }

        assert candidate['raising_summary'] is None
        assert candidate['spending_summary'] is None
        assert candidate['cash_summary'] is None

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
        assert candidate["election_year"] == 2018

    def test_past_special_returns_election_year(
            self, load_with_nested_mock, load_candidate_totals_mock,
            load_candidate_statement_of_candidacy_mock):

        # Candidate ran in 2017 and 2018. Passing 2020 as cycle.
        # Election years should be rounded, election year should be 2018
        test_candidate = copy.deepcopy(self.STOCK_CANDIDATE)
        test_candidate["cycles"] = [2016, 2018]
        test_candidate["election_years"] = [2017, 2018]

        load_with_nested_mock.return_value = (
            test_candidate,
            mock.MagicMock(),
            2020
        )
        candidate = get_candidate('C001', 2020, True)
        assert candidate["election_years"] == [2018]
        assert candidate["election_year"] == 2018

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
