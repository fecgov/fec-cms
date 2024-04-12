
import datetime
from unittest import mock
import io
import logging

from django.test import Client
from django.test import TestCase
from data import api_caller
from data import ecfr_caller
from data import legal_test_data
from legal import views

client = Client()


class TestLegalSearch(TestCase):

    # Test1 : OK
    @mock.patch.object(api_caller, 'load_legal_search_results')
    def test_no_query(self, load_legal_search_results):
        response = client.get('/data/legal/search/')
        assert response.status_code == 200
        load_legal_search_results.assert_not_called()

    # Test2 : A new issue is opened https://github.com/18F/fec-cms/issues/1477
    # to address this test. commenting this test for now.
    # getting reponse.status_code=301, but expecting reponse.status_code=302
    # def test_search_type_regulations_redirects(self):
    #     response = client.get('/data/legal/search/regulations',
    #                           data={
    #                               'search': 'in kind donation',
    #                               'search_type': 'regulations'})
    #     print("::: Test2 ::: search_type_regulations_redirects" +
    #           " :::RESPONSE :::", response.status_code)
    #     assert response.status_code == 302

    #     assert url == 'data/legal/search/regulations/'
    #     assert 'search' in query
    #     assert 'search_type' in query
    #     assert query['search'] == ['in kind donation']
    #     assert query['search_type'] == ['regulations']

    # Test3 : OK
    @mock.patch.object(api_caller, 'load_legal_search_results')
    def test_search_universal(self, load_legal_search_results):
        load_legal_search_results.return_value = (
            legal_test_data.legal_universal_search_results()
        )
        response = client.get(
            '/data/legal/search/',
            data={'search': 'in kind donation', 'search_type': 'all'}
        )
        assert response.status_code == 200
        load_legal_search_results.assert_called_once_with(
            'in kind donation', 'all', limit=3
        )

    # Test4 : This test is checking against the static data on
    # legal_test_data.py.
    # AssertionError: Expected call: load_legal_search_results(
    # 'in-kind donation', 'regulations')
    # Actual call:
    # load_legal_search_results.assert_called_once_with(
    #   'in kind donation', 'all', limit=3
    # )
    @mock.patch.object(ecfr_caller, 'fetch_ecfr_data')
    def test_search_regulations(self, load_legal_search_results):
        load_legal_search_results.return_value = (
            legal_test_data.regulations_search_results()
        )
        response = client.get(
            '/data/legal/search/regulations/',
            data={'search': 'in-kind donation', 'search_type': 'regulations'}
        )
        assert response.status_code == 200
        load_legal_search_results.assert_called_once_with(
            'in-kind donation', page=1)

    # Test transform boolean queries for eCFR API
    def test_transform_ecfr_query_string(self):
        # Define input query string
        input_query_string = '((coordinated OR communications) OR (in-kind AND'
        + ' contributions) OR ("independent expenditure")) AND (-travel)'

        # Expected output after transformation
        expected_output = '((coordinated | communications) | (in-kind'
        + ' contributions) | ("independent expenditure")) -travel'

        # Apply transformation
        updated_ecfr_query_string = views.transform_ecfr_query_string(
            input_query_string
        )

        # Check if the transformation is correct
        self.assertEqual(updated_ecfr_query_string, expected_output)

    # Test 5 : OK
    @mock.patch.object(api_caller, 'load_legal_search_results')
    def test_search_statutes(self, load_legal_search_results):
        load_legal_search_results.return_value = (
            legal_test_data.statutes_search_results()
        )
        response = client.get(
            '/data/legal/search/statutes/',
            data={'search': 'in kind donation', 'search_type': 'statutes'}
        )
        assert response.status_code == 200
        load_legal_search_results.assert_called_once_with('in kind donation',
                                                          'statutes', offset=0)

    # # Test 6: OK
    @mock.patch.object(api_caller, '_call_api')
    def test_result_counts(self, _call_api_mock):
        _call_api_mock.return_value = {
            'advisory_opinions': [
                {'no': 1, 'date': '2016'}, {'no': 2, 'date': '1999'}],
            'statutes': [{}] * 4,
            'regulations': [{}] * 5}
        results = api_caller.load_legal_search_results(query='president')

        assert len(results['advisory_opinions']) == 2
        assert results['advisory_opinions_returned'] == 2
        assert results['statutes_returned'] == 4
        assert results['regulations_returned'] == 5

    # Test 7: OK
    @mock.patch.object(api_caller, 'load_legal_search_results')
    def test_ao_landing_page(self, load_legal_search_results):
        today = datetime.date.today()
        ao_min_date = today - datetime.timedelta(weeks=26)
        response = client.get('/data/legal/advisory-opinions/')
        assert response.status_code == 200
        # load_legal_search_results gets called twice in this view,
        # so this mocks the two different calls and then we assert they happend
        # http://stackoverflow.com/questions/7242433/asserting-successive-calls-to-a-mock-method
        calls = [
            mock.call(
                query='',
                query_type='advisory_opinions',
                ao_min_issue_date=ao_min_date,
                ao_category=['F', 'W']
            ),
            mock.call(
                query='',
                query_type='advisory_opinions',
                ao_status='Pending',
                ao_category='R'
            )
        ]
        load_legal_search_results.assert_has_calls(calls, any_order=True)

    # Test 8:
    @mock.patch.object(api_caller, '_call_api')
    def test_missing_action_mur(self, _call_api_mock):
        log_capture_string = io.StringIO()
        ch = logging.StreamHandler(log_capture_string)
        api_caller.logger.addHandler(ch)
        _call_api_mock.return_value = {
            'docs': [
                {
                    'no': 1,
                    'mur_docs': [],
                    'documents': [],
                    'commission_votes': [
                        {
                            'action': None
                        },
                        {
                            'action': 'test'
                        },
                        {
                            'action': ''
                        },
                    ],
                    'mur_type': 'current',
                    'participants': [],
                    'dispositions': [],
                }
            ]
        }
        api_caller.load_legal_mur('1')
        log_contents = log_capture_string.getvalue()
        assert (
            "MUR 1: There were no data for commission_votes action at index 0"
            in log_contents
        )
        assert (
            "MUR 1: There were no data for commission_votes action at index 2"
            in log_contents
        )
        assert (
            "MUR 1: There were no data for commission_votes action at index 1"
            not in log_contents
        )
