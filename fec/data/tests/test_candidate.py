from unittest import TestCase
from unittest import mock
import copy

from data import api_caller
from data.views import get_candidate


@mock.patch.object(api_caller, 'load_candidate_statement_of_candidacy')
@mock.patch.object(api_caller, 'load_first_row_data')
@mock.patch.object(api_caller, 'load_with_nested')
class TestCandidate(TestCase):

    STOCK_CANDIDATE = {
        "candidate_id": "H001",
        "name": "Lady Liberty",
        "cycles": [2014, 2016, 2018],
        "election_years": [2016, 2018],
        "rounded_election_years": [2016, 2018],
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

    def test_base_case(self, load_with_nested_mock, load_first_row_data_mock,
                       load_candidate_statement_of_candidacy_mock):
        cycle = 2016
        show_full_election = True

        test_candidate = copy.deepcopy(self.STOCK_CANDIDATE)
        load_with_nested_mock.return_value = (
            test_candidate,
            self.STOCK_COMMITTEE_LIST,
            cycle
        )
        candidate = get_candidate('H001', 2018, show_full_election)

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

        assert len(candidate['raising_summary']) == 0
        assert len(candidate['spending_summary']) == 0
        assert len(candidate['cash_summary']) == 0

    def test_special_odd_year_return_rounded_number(
            self, load_with_nested_mock, load_first_row_data_mock,
            load_candidate_statement_of_candidacy_mock):

        # use new column rounded_election_years which round odd number in MV.
        test_candidate = copy.deepcopy(self.STOCK_CANDIDATE)
        test_candidate["cycles"] = [2016, 2018]
        test_candidate["election_years"] = [2013, 2015, 2018]
        test_candidate["rounded_election_years"] = [2014, 2016, 2018]

        load_with_nested_mock.return_value = (
            test_candidate,
            mock.MagicMock(),
            2016
        )
        candidate = get_candidate('H001', 2016, True)
        assert candidate["election_years"] == [2014, 2016, 2018]
        assert candidate["election_year"] == 2016
