
import datetime
import unittest
from unittest import mock
import io
import logging

from django.test import Client
from django.test import RequestFactory
from django.test import TestCase
from data import api_caller
from data import ecfr_caller
from data import legal_test_data
from legal import views
from legal.views import parse_query

client = Client()


class TestLegalSearchUtils(unittest.TestCase):
    def test_sort_ao_documents_handles_missing_issue_date(self):
        ao = {
            'issue_date': None,
            'documents': [
                {
                    'ao_doc_category_id': 'F',
                    'date': '2024-01-15',
                    'description': 'Final Opinion',
                    'document_id': 2,
                },
                {
                    'ao_doc_category_id': 'R',
                    'date': '2024-02-01',
                    'description': 'Request',
                    'document_id': 1,
                },
            ],
        }

        sorted_documents = api_caller._get_sorted_documents(ao)

        self.assertEqual(
            [doc['description'] for doc in sorted_documents],
            ['Request', 'Final Opinion']
        )


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
            'in kind donation', '', 'all', limit=3
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
        input_query_string = (
            '(coordinated | communications)|(in-kind + contributions)|("independent expenditure") -travel'
        )

        # Expected output after transformation
        expected_output = (
            '(coordinated | communications)|(in-kind' +
            ' contributions)|("independent expenditure") -travel'
        )

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

        load_legal_search_results.assert_called_once_with('in kind donation', '',
                                                          'statutes', offset=0,)

    # # Test 6: OK
    @mock.patch.object(api_caller, '_call_api')
    def test_result_counts(self, _call_api_mock):
        _call_api_mock.return_value = {
            'advisory_opinions': [
                {'no': 1, 'date': '2016'}, {'no': 2, 'date': '1999'}],
            'statutes': [{}] * 4}
        results = api_caller.load_legal_search_results(query='president')

        assert len(results['advisory_opinions']) == 2
        assert results['advisory_opinions_returned'] == 2
        assert results['statutes_returned'] == 4

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
                query_exclude='',
                query_type='advisory_opinions',
                ao_min_issue_date=ao_min_date,
                ao_doc_category_id=['F', 'W']
            ),
            mock.call(
                query='',
                query_exclude='',
                query_type='advisory_opinions',
                ao_status='Pending',
                ao_doc_category_id='R'
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


# Tests parsing legal query and extracting exclude parameters.
class TestParseQuery:
    def test_parse_query_no_exclude(self):
        query = "in-kind contribution"
        result = parse_query(query)
        assert result == (query, "")

    def test_parse_query_single_exclude(self):
        query = "-in-kind contribution"
        result = parse_query(query)
        assert result == ("contribution", "in-kind")

    def test_parse_query_multiple_exclude(self):
        query = "in-kind contribution -travel -authorization"
        result = parse_query(query)
        assert result == ("in-kind contribution", "travel authorization")

    def test_parse_query_exclude_with_spaces(self):
        query = "in-kind -authorization contribution"
        result = parse_query(query)
        assert result == ("in-kind contribution", "authorization")

    def test_parse_query_empty_string(self):
        query = ""
        result = parse_query(query)
        assert result == ("", "")


class TestLegalSearchQueryLimit:
    expected_error = (
        b"Search terms must be 10 characters or fewer. "
        b"Please shorten your search and try again."
    )
    no_results_message = (
        b"Sorry, we didn&rsquo;t find any documents matching your search."
    )

    def setup_method(self):
        self.factory = RequestFactory()

    @mock.patch.object(views.settings, 'LEGAL_SEARCH_MAX_QUERY_LENGTH', 10)
    def test_query_exclude_counts_toward_character_limit(self):
        error, error_fields = views.validate_legal_search_query(
            'ok',
            query_exclude='x' * 8
        )

        assert error == self.expected_error.decode()
        assert error_fields == ['search']

    @mock.patch.object(api_caller, 'load_legal_search_results')
    @mock.patch.object(views.settings, 'LEGAL_SEARCH_MAX_QUERY_LENGTH', 10)
    def test_search_rejects_query_over_character_limit(
        self,
        load_legal_search_results
    ):
        request = self.factory.get(
            '/data/legal/search/',
            {'search': 'x' * 11, 'search_type': 'all'}
        )

        response = views.legal_search(request)

        assert response.status_code == 400
        assert self.expected_error in response.content
        assert response.content.count(self.expected_error) == 1
        assert b'message filter__message message--error' in response.content
        assert response.content.index(b'main__content--right') < response.content.index(self.expected_error)
        assert b'x' * 11 not in response.content
        load_legal_search_results.assert_not_called()

    @mock.patch.object(api_caller, 'load_legal_search_results')
    @mock.patch.object(views.settings, 'LEGAL_SEARCH_MAX_QUERY_LENGTH', 10)
    def test_mur_search_rejects_query_over_character_limit(
        self,
        load_legal_search_results
    ):
        request = self.factory.get(
            '/data/legal/search/murs/',
            {'search': 'x' * 11, 'case_no': '1234'}
        )

        response = views.legal_doc_search_mur(request)

        assert response.status_code == 400
        assert self.expected_error in response.content
        assert response.content.count(self.expected_error) == 1
        assert b'No results' in response.content
        assert self.no_results_message in response.content
        assert b'js-filter-tags' not in response.content
        assert b'tag__category' not in response.content
        assert b'x' * 11 not in response.content
        load_legal_search_results.assert_not_called()

    @mock.patch.object(api_caller, 'load_legal_search_results')
    @mock.patch.object(views.settings, 'LEGAL_SEARCH_MAX_QUERY_LENGTH', 10)
    def test_mur_search_rejects_combined_query_and_exclude_over_character_limit(
        self,
        load_legal_search_results
    ):
        request = self.factory.get(
            '/data/legal/search/murs/',
            {'search': 'ok -' + 'x' * 8}
        )

        response = views.legal_doc_search_mur(request)

        assert response.status_code == 400
        assert self.expected_error in response.content
        assert response.content.count(self.expected_error) == 1
        assert b'No results' in response.content
        assert self.no_results_message in response.content
        assert b'x' * 8 not in response.content
        load_legal_search_results.assert_not_called()

    @mock.patch.object(api_caller, 'load_legal_search_results')
    @mock.patch.object(views.settings, 'LEGAL_SEARCH_MAX_QUERY_LENGTH', 10)
    def test_mur_search_rejects_q_proximity_over_character_limit(
        self,
        load_legal_search_results
    ):
        request = self.factory.get(
            '/data/legal/search/murs/',
            {'search': 'okay', 'case_no': '1234', 'q_proximity': ['okay', 'x' * 11]}
        )

        response = views.legal_doc_search_mur(request)

        assert response.status_code == 400
        assert self.expected_error in response.content
        assert response.content.count(self.expected_error) == 1
        assert b'No results' in response.content
        assert self.no_results_message in response.content
        assert b'js-filter-tags' not in response.content
        assert b'tag__category' not in response.content
        assert b'x' * 11 not in response.content
        load_legal_search_results.assert_not_called()

    @mock.patch.object(api_caller, 'load_legal_search_results')
    @mock.patch.object(views.settings, 'LEGAL_SEARCH_MAX_QUERY_LENGTH', 10)
    def test_ao_search_rejects_q_proximity_over_character_limit(
        self,
        load_legal_search_results
    ):
        request = self.factory.get(
            '/data/legal/search/advisory-opinions/',
            {'search': 'okay', 'ao_no': '2024-01', 'q_proximity': ['okay', 'x' * 11]}
        )

        response = views.legal_doc_search_ao(request)

        assert response.status_code == 400
        assert self.expected_error in response.content
        assert response.content.count(self.expected_error) == 1
        assert b'No results' in response.content
        assert self.no_results_message in response.content
        assert b'js-filter-tags' not in response.content
        assert b'tag__category' not in response.content
        assert b'x' * 11 not in response.content
        load_legal_search_results.assert_not_called()

    @mock.patch.object(api_caller, 'load_legal_search_results')
    @mock.patch.object(views.settings, 'LEGAL_SEARCH_MAX_QUERY_LENGTH', 10)
    def test_adr_search_rejects_q_proximity_over_character_limit(
        self,
        load_legal_search_results
    ):
        request = self.factory.get(
            '/data/legal/search/adrs/',
            {'search': 'okay', 'case_no': '1234', 'q_proximity': ['okay', 'x' * 11]}
        )

        response = views.legal_doc_search_adr(request)

        assert response.status_code == 400
        assert self.expected_error in response.content
        assert response.content.count(self.expected_error) == 1
        assert b'No results' in response.content
        assert self.no_results_message in response.content
        assert b'js-filter-tags' not in response.content
        assert b'tag__category' not in response.content
        assert b'x' * 11 not in response.content
        load_legal_search_results.assert_not_called()

    @mock.patch.object(api_caller, 'load_legal_search_results')
    @mock.patch.object(views.settings, 'LEGAL_SEARCH_MAX_QUERY_LENGTH', 10)
    def test_af_search_rejects_q_proximity_over_character_limit(
        self,
        load_legal_search_results
    ):
        request = self.factory.get(
            '/data/legal/search/admin-fines/',
            {'search': 'okay', 'case_no': '1234', 'q_proximity': ['okay', 'x' * 11]}
        )

        response = views.legal_doc_search_af(request)

        assert response.status_code == 400
        assert self.expected_error in response.content
        assert response.content.count(self.expected_error) == 1
        assert b'js-filter-tags' not in response.content
        assert b'tag__category' not in response.content
        assert b'x' * 11 not in response.content
        load_legal_search_results.assert_not_called()

    @mock.patch.object(ecfr_caller, 'fetch_ecfr_data')
    @mock.patch.object(views.settings, 'LEGAL_SEARCH_MAX_QUERY_LENGTH', 10)
    def test_regulations_search_rejects_query_over_character_limit(
        self,
        fetch_ecfr_data
    ):
        request = self.factory.get(
            '/data/legal/search/regulations/',
            {'search': 'x' * 11}
        )

        response = views.legal_doc_search_regulations(request)

        assert response.status_code == 400
        assert self.expected_error in response.content
        assert response.content.count(self.expected_error) == 1
        assert b'No results' in response.content
        assert self.no_results_message in response.content
        assert b'x' * 11 not in response.content
        fetch_ecfr_data.assert_not_called()

    @mock.patch.object(api_caller, 'load_legal_search_results')
    @mock.patch.object(views.settings, 'LEGAL_SEARCH_MAX_QUERY_LENGTH', 10)
    def test_statutes_search_rejects_query_over_character_limit(
        self,
        load_legal_search_results
    ):
        request = self.factory.get(
            '/data/legal/search/statutes/',
            {'search': 'x' * 11}
        )

        response = views.legal_doc_search_statutes(request)

        assert response.status_code == 400
        assert self.expected_error in response.content
        assert response.content.count(self.expected_error) == 1
        assert b'No results' in response.content
        assert self.no_results_message in response.content
        assert b'x' * 11 not in response.content
        load_legal_search_results.assert_not_called()
