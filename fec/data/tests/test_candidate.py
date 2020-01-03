from unittest import TestCase
from unittest import mock
import copy

from data import api_caller
from data.views import get_candidate


@mock.patch.object(api_caller, 'load_candidate_statement_of_candidacy', return_value=None)
@mock.patch.object(api_caller, 'load_first_row_data')
@mock.patch.object(api_caller, 'load_with_nested')
class TestCandidate(TestCase):

    STOCK_CANDIDATE = {
        "candidate_id": "H001",
        "name": "Lady Liberty",
        "fec_cycles_in_election": [2014, 2016, 2018],
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
        },
        {
            'designation': 'A',
            'cycles': [2016, 2014, 2012, 2018],
            'name': 'My Authorized Campaign Committee',
            'cycle': 2016,
            'committee_id': 'C002',
        },
        {
            'designation': 'J',
            'cycles': [2016, 2014, 2012, 2018],
            'name': 'Joint Fundraising Committee',
            'cycle': 2016,
            'committee_id': 'C003',
        },
    ]

    def test_base_case(
        self,
        load_with_nested_mock,
        load_first_row_data_mock,
        load_candidate_statement_of_candidacy_mock,
    ):
        cycle = 2016
        show_full_election = True

        test_candidate = copy.deepcopy(self.STOCK_CANDIDATE)
        load_with_nested_mock.return_value = (
            test_candidate,
            self.STOCK_COMMITTEE_LIST,
            cycle,
        )
        load_first_row_data_mock.return_value = mock.MagicMock()
        load_candidate_statement_of_candidacy_mock.return_value = {"receipt_date": "2019-11-30T00:00:00"}

        candidate = get_candidate("H001", 2018, show_full_election)

        assert candidate['candidate_id'] == test_candidate['candidate_id']
        assert candidate['name'] == test_candidate['name']
        assert candidate['cycles'] == test_candidate['fec_cycles_in_election']
        assert candidate['min_cycle'] == cycle - 2
        assert candidate['max_cycle'] == cycle
        assert candidate['election_year'] == cycle
        assert candidate['election_years'] == test_candidate['election_years']
        assert candidate['office'] == test_candidate['office']
        assert candidate['office_full'] == test_candidate['office_full']
        assert candidate['state'] == test_candidate['state']
        assert candidate['district'] == test_candidate['district']
        assert candidate['party_full'] == test_candidate['party_full']
        assert (
            candidate['incumbent_challenge_full']
            == test_candidate['incumbent_challenge_full']
        )
        assert candidate['cycle'] == cycle
        assert candidate['result_type'] == 'candidates'
        assert candidate['duration'] == 2
        assert candidate['report_type'] == 'house-senate'
        assert candidate['show_full_election'] == show_full_election

        assert candidate['committee_groups'] == {
            'P': [
                {
                    'designation': 'P',
                    'cycles': [2016, 2014, 2012, 2018],
                    'name': 'My Primary Campaign Committee',
                    'cycle': 2016,
                    'related_cycle': 2016,
                    'committee_id': 'C001',
                }
            ],
            'A': [
                {
                    'designation': 'A',
                    'cycles': [2016, 2014, 2012, 2018],
                    'name': 'My Authorized Campaign Committee',
                    'cycle': 2016,
                    'related_cycle': 2016,
                    'committee_id': 'C002',
                }
            ],
            'J': [
                {
                    'designation': 'J',
                    'cycles': [2016, 2014, 2012, 2018],
                    'name': 'Joint Fundraising Committee',
                    'cycle': 2016,
                    'related_cycle': 2016,
                    'committee_id': 'C003',
                }
            ],
        }

        assert candidate['committees_authorized'] == (
            candidate['committee_groups']['P'] + candidate['committee_groups']['A']
        )
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
            'candidateID': test_candidate["candidate_id"],
        }

        assert len(candidate['raising_summary']) == 0
        assert len(candidate['spending_summary']) == 0
        assert len(candidate['cash_summary']) == 0

        assert candidate["statement_of_candidacy"] == {'receipt_date': '11/30/2019'}

    def test_special_odd_year_return_rounded_number(
        self,
        load_with_nested_mock,
        load_first_row_data_mock,
        load_candidate_statement_of_candidacy_mock,
    ):

        # use new column rounded_election_years which round odd number in MV.
        test_candidate = copy.deepcopy(self.STOCK_CANDIDATE)
        test_candidate["fec_cycles_in_election"] = [2016, 2018]
        test_candidate["election_years"] = [2013, 2015, 2018]
        test_candidate["rounded_election_years"] = [2014, 2016, 2018]

        load_with_nested_mock.return_value = (test_candidate, mock.MagicMock(), 2016)
        load_first_row_data_mock.return_value = mock.MagicMock()

        candidate = get_candidate("H001", 2016, True)
        assert candidate["election_years"] == [2014, 2016, 2018]
        assert candidate["election_year"] == 2016

        assert candidate["statement_of_candidacy"] is None

    def test_future_candidate_max_cycle(
        self,
        load_with_nested_mock,
        load_first_row_data_mock,
        load_candidate_statement_of_candidacy_mock,
    ):

        test_candidate = copy.deepcopy(self.STOCK_CANDIDATE)
        test_candidate["candidate_id"] = ["S001"]
        test_candidate["fec_cycles_in_election"] = [2016, 2018, 2020]
        test_candidate["election_years"] = [2018, 2024]
        test_candidate["rounded_election_years"] = [2018, 2024]

        test_committee_list = copy.deepcopy(self.STOCK_COMMITTEE_LIST)
        test_committee_list[0] = (
            {
                'designation': 'P',
                'cycles': [2016, 2014, 2012, 2018, 2020],
                'name': 'My Primary Campaign Committee',
                'cycle': 2018,
                'committee_id': 'C001',
            },
        )
        test_committee_list.append(
            {
                'designation': 'P',
                'cycles': [2016, 2014, 2012, 2018, 2020],
                'name': 'My Primary Campaign Committee',
                'cycle': 2024,
                'committee_id': 'C001',
            }
        )

        load_with_nested_mock.return_value = (test_candidate, mock.MagicMock(), 2024)
        candidate = get_candidate('S001', 2024, True)
        assert candidate["election_years"] == [2018, 2024]
        assert candidate["election_year"] == 2024
        assert candidate["max_cycle"] == 2020

    def test_candidate_not_in_election_max_cycle(
        self,
        load_with_nested_mock,
        load_first_row_data_mock,
        load_candidate_statement_of_candidacy_mock,
    ):
        # test candidate election year(one or more of election_years)
        # is not exist in fec_cycles_in_election ex:P80001571/1988
        test_candidate = copy.deepcopy(self.STOCK_CANDIDATE)
        test_candidate["candidate_id"] = ["P001"]
        test_candidate["fec_cycles_in_election"] = [2016, 2018, 2020]
        test_candidate["election_years"] = [1988, 2016, 2020]
        test_candidate["rounded_election_years"] = [1988, 2016, 2020]

        test_committee_list = copy.deepcopy(self.STOCK_COMMITTEE_LIST)
        test_committee_list[0] = (
            {
                'designation': 'P',
                'cycles': [2016, 2014, 2012, 2018, 2020],
                'name': 'My Primary Campaign Committee',
                'cycle': 2018,
                'committee_id': 'C001',
            },
        )
        test_committee_list.append(
            {
                'designation': 'P',
                'cycles': [2016, 2014, 2012, 2018, 2020],
                'name': 'My Primary Campaign Committee',
                'cycle': 1988,
                'committee_id': 'C001',
            }
        )

        load_with_nested_mock.return_value = (test_candidate, mock.MagicMock(), 1988)
        candidate = get_candidate('P001', 1988, True)
        assert candidate["election_years"] == [1988, 2016, 2020]
        assert candidate["election_year"] == 1988
        assert candidate["max_cycle"] == 1988

    def test_null_fec_cycles_in_election_max_cycle(
        self,
        load_with_nested_mock,
        load_first_row_data_mock,
        load_candidate_statement_of_candidacy_mock,
    ):
        # test candidate only file F2. fec_cycles_in_election=null.
        # ex:P00012799 (2020)
        test_candidate = copy.deepcopy(self.STOCK_CANDIDATE)
        test_candidate["candidate_id"] = ["P002"]
        test_candidate["fec_cycles_in_election"] = None
        test_candidate["election_years"] = [2020]
        test_candidate["rounded_election_years"] = [2020]

        test_committee_list = copy.deepcopy(self.STOCK_COMMITTEE_LIST)
        test_committee_list[0] = (
            {
                'designation': 'P',
                'cycles': [2016, 2014, 2012, 2018, 2020],
                'name': 'My Primary Campaign Committee',
                'cycle': 2018,
                'committee_id': 'C001',
            },
        )
        test_committee_list.append(
            {
                'designation': 'P',
                'cycles': [2016, 2014, 2012, 2018, 2020],
                'name': 'My Primary Campaign Committee',
                'cycle': 2020,
                'committee_id': 'C001',
            }
        )

        load_with_nested_mock.return_value = (test_candidate, mock.MagicMock(), 2020)
        candidate = get_candidate('P002', 2020, True)
        assert candidate["election_years"] == [2020]
        assert candidate["election_year"] == 2020
        assert candidate["max_cycle"] == 2020
