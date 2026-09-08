import unittest
from unittest import mock

from data import api_caller, ecfr_caller


class TestEcfrCaller(unittest.TestCase):
    @mock.patch.object(ecfr_caller.session, 'get')
    def test_json_and_access_interstitial_failures_are_not_empty_results(self, get):
        for url in ('https://www.ecfr.gov/api/search/v1/results', 'https://unblock.federalregister.gov/'):
            response = mock.Mock(ok=True, url=url)
            response.json.side_effect = ValueError('not JSON')
            get.return_value = response
            result = ecfr_caller.fetch_ecfr_data('loans')
            self.assertTrue(result['error'])
            self.assertEqual(result['results'], [])
            if 'unblock' in url:
                response.json.assert_not_called()

    @mock.patch.object(ecfr_caller.session, 'get')
    def test_fetch_ecfr_data_uses_public_api_without_key(self, get):
        response = mock.Mock(
            ok=True,
            status_code=200,
            url='https://www.ecfr.gov/api/search/v1/results',
        )
        response.json.return_value = {'results': [], 'meta': {'total_count': 0}}
        get.return_value = response

        result = ecfr_caller.fetch_ecfr_data('segregated funds', limit=3, page=2)

        self.assertEqual(result, response.json.return_value)
        get.assert_called_once()
        _, kwargs = get.call_args
        self.assertEqual(kwargs['params']['query'], 'segregated funds')
        self.assertEqual(kwargs['params']['agency_slugs[]'], 'federal-election-commission')
        self.assertEqual(kwargs['params']['order'], 'relevance')
        self.assertNotIn('api_key', kwargs['params'])

    @mock.patch.object(ecfr_caller.session, 'get')
    def test_fetch_ecfr_data_returns_error_shape_on_request_failure(self, get):
        get.side_effect = ecfr_caller.requests.Timeout('timed out')

        result = ecfr_caller.fetch_ecfr_data('segregated funds')

        self.assertTrue(result['error'])
        self.assertEqual(result['results'], [])
        self.assertEqual(result['meta']['total_count'], 0)
        self.assertEqual(result['error_message'], ecfr_caller.ECFR_ERROR_MESSAGE)

    @mock.patch.object(ecfr_caller.session, 'get')
    def test_fetch_ecfr_data_requests_each_response(self, get):
        response = mock.Mock(
            ok=True,
            status_code=200,
            url='https://www.ecfr.gov/api/search/v1/results',
        )
        response.json.side_effect = [
            {'results': [{'id': 1}]},
            {'results': [{'id': 2}]},
        ]
        get.return_value = response

        first_result = ecfr_caller.fetch_ecfr_data('current response')
        second_result = ecfr_caller.fetch_ecfr_data('current response')

        self.assertEqual(first_result['results'], [{'id': 1}])
        self.assertEqual(second_result['results'], [{'id': 2}])
        self.assertEqual(get.call_count, 2)

    @mock.patch.object(ecfr_caller.session, 'get')
    def test_fetch_ecfr_structure_uses_public_api_without_key(self, get):
        response = mock.Mock(
            ok=True,
            status_code=200,
            url='https://www.ecfr.gov/api/versioner/v1/structure/current/title-11.json',
        )
        response.json.return_value = {'identifier': '11', 'children': []}
        get.return_value = response

        result = ecfr_caller.fetch_ecfr_structure()

        self.assertEqual(result, response.json.return_value)
        get.assert_called_once()
        args, kwargs = get.call_args
        self.assertIn('/api/versioner/v1/structure/current/title-11.json', args[0])
        self.assertNotIn('api_key', kwargs.get('params') or {})

    @mock.patch.object(ecfr_caller.session, 'get')
    def test_fetch_ecfr_section_html_uses_canonical_reader_url(self, get):
        response = mock.Mock(
            ok=True,
            status_code=200,
            url='https://www.ecfr.gov/current/title-11/chapter-I/subchapter-A/part-114/section-114.7',
            content=b'<h1>\xc2\xa7 114.7</h1>',
            text='<h1>§ 114.7</h1>',
        )
        get.return_value = response

        result = ecfr_caller.fetch_ecfr_section_html('114.7')

        self.assertEqual(result['text'], '<h1>§ 114.7</h1>')
        args, kwargs = get.call_args
        self.assertEqual(
            args[0],
            'https://www.ecfr.gov/current/title-11/chapter-I/subchapter-A/part-114/section-114.7',
        )
        self.assertIsNone(kwargs['params'])

    @mock.patch.object(ecfr_caller.session, 'get')
    def test_fetch_ecfr_section_html_includes_part_100_subpart(self, get):
        response = mock.Mock(
            ok=True,
            status_code=200,
            url='https://www.ecfr.gov/current/title-11/chapter-I/subchapter-A/part-100/subpart-A/section-100.7',
            content=b'<h1>Section 100.7</h1>',
        )
        get.return_value = response

        ecfr_caller.fetch_ecfr_section_html('100.7')

        self.assertIn('/part-100/subpart-A/section-100.7', get.call_args.args[0])

    @mock.patch.object(ecfr_caller.session, 'get')
    def test_fetch_ecfr_section_html_preserves_not_found_status(self, get):
        get.return_value = mock.Mock(
            ok=False,
            status_code=404,
            url='https://www.ecfr.gov/current/title-11/chapter-I/subchapter-A/part-100/subpart-A/section-100.7',
        )

        result = ecfr_caller.fetch_ecfr_section_html('100.7')

        self.assertEqual(result['status_code'], 404)
        self.assertTrue(result['error'])

    @mock.patch.object(ecfr_caller.session, 'get')
    def test_fetch_ecfr_versions_uses_public_api_without_key(self, get):
        response = mock.Mock(
            ok=True,
            status_code=200,
            url='https://www.ecfr.gov/api/versioner/v1/versions/title-11.json',
        )
        response.json.return_value = {'content_versions': []}
        get.return_value = response

        result = ecfr_caller.fetch_ecfr_versions('102.1', date='2026-06-08')

        self.assertEqual(result, response.json.return_value)
        get.assert_called_once()
        args, kwargs = get.call_args
        self.assertIn('/api/versioner/v1/versions/title-11.json', args[0])
        self.assertEqual(kwargs['params']['section'], '102.1')
        self.assertEqual(kwargs['params']['issue_date[lte]'], '2026-06-08')
        self.assertNotIn('api_key', kwargs['params'])

    @mock.patch.object(ecfr_caller.session, 'get')
    def test_fetch_ecfr_ancestry_uses_public_api_without_key(self, get):
        response = mock.Mock(
            ok=True,
            status_code=200,
            url='https://www.ecfr.gov/api/versioner/v1/ancestry/2026-06-08/title-11.json',
        )
        response.json.return_value = {'ancestors': []}
        get.return_value = response

        result = ecfr_caller.fetch_ecfr_ancestry('102.1', date='2026-06-08')

        self.assertEqual(result, response.json.return_value)
        get.assert_called_once()
        args, kwargs = get.call_args
        self.assertIn('/api/versioner/v1/ancestry/2026-06-08/title-11.json', args[0])
        self.assertEqual(kwargs['params']['section'], '102.1')
        self.assertNotIn('api_key', kwargs['params'])

    @mock.patch.object(api_caller, '_call_legal_api')
    def test_load_legal_rulemakings_for_regulation_searches_by_citation(self, call_api):
        call_api.return_value = {'rulemakings': []}

        result = api_caller.load_legal_rulemakings_for_regulation('114.5')

        self.assertEqual(result, {'rulemakings': []})
        call_api.assert_called_once_with(
            '/rulemaking/search/',
            q='("11 CFR 114.5" | "11 C.F.R. 114.5" | "11 C.F.R. \u00a7 114.5")',
            hits_returned=20,
            from_hit=0,
        )
