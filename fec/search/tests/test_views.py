import unittest
import requests
import requests_mock
import re
import search.views as views

from django.conf import settings
from django.test import Client, TestCase, RequestFactory
from unittest import mock
from search.views import (
    search_candidates,
    search_committees,
    search_site,
    process_site_results,
    prev_offset,
    parse_icon,
    search
)

committee_url = re.compile('/committees')
candidate_url = re.compile('/candidates/search')
base_url = re.compile(settings.FEC_API_URL)
search_url = re.compile('https://search.usa.gov/api/v2/search/i14y')

@requests_mock.Mocker()
class TestViews(TestCase):
    def setUp(self):
        self.client = Client()
        self.factory = RequestFactory()


    def test_prev_offset_first_page(self, m):
      offset = prev_offset(5, 5)
      self.assertEqual(offset, 0)


    def test_prev_offset_next_page(self, m):
        offset = prev_offset(5, 10)
        self.assertEqual(offset, 5)


    def test_parse_icon_page(self, m):
        icon = parse_icon('/some-page/')
        self.assertEqual(icon, 'page')


    def test_parse_icon_data(self, m):
        icon = parse_icon('/data/receipts/')
        self.assertEqual(icon, 'data')


    def test_parse_icon_datapage(self, m):
        icon = parse_icon('/data/advanced/')
        self.assertEqual(icon, 'page')


    def test_search_candidates(self, m):
        """
        Test that the /candidates/search/ endpoint was called with the right q
        """
        m.register_uri('GET', candidate_url, json=[{"candidate_name": "Abe Lincoln"}])
        c = search_candidates('abe')
        history = m.request_history[0]
        self.assertTrue(m.called)
        self.assertEqual(history.qs['q'], ['abe'])


    def test_committee_search(self, m):
        """
        Test that the /committees/ endpoint was called with the right q
        """
        m.register_uri('GET', committee_url, json=[{"committee_name": "America USA"}])
        c = search_committees('america')
        history = m.request_history[0]
        self.assertTrue(m.called)
        self.assertEqual(history.qs['q'], ['america'])


    def test_process_site_results(self, m):
        results = {
            'web': {
                'results': [{'url': '/help', 'url': '/home'}],
                'total': 2,
                'next_offset': 20
            },
            'text_best_bets': [{'url': '/data'}],
        }
        r = process_site_results(results, limit=1, offset=0)
        self.assertEqual(r['results'][0], {'icon': 'page', 'url': '/home'})
        self.assertEqual(r['meta']['count'], 2)
        self.assertEqual(r['meta']['next_offset'], 20)
        self.assertEqual(r['best_bets']['count'], 1)


    @mock.patch.object(views, 'process_site_results')
    def test_site_search(self, m, process_site_results):
        m.register_uri('GET', search_url, status_code=200, json={})
        r = search_site('help', limit=10, offset=0)
        history = m.request_history[0]
        self.assertEqual(history.qs['query'], ['help'])
        self.assertEqual(history.qs['limit'], ['10'])
        self.assertEqual(history.qs['offset'], ['0'])
        process_site_results.assert_called_once()


    @mock.patch.object(views, 'process_site_results')
    def test_site_search_failed(self, m, process_site_results):
        m.register_uri('GET', search_url, status_code=500)
        search_site('help', limit=10, offset=0)
        process_site_results.assert_not_called()


    @mock.patch.object(views, 'search_candidates')
    def test_site_search_candidates(self, m, search_candidates):
        search_candidates.return_value = [{'name': 'Abe Lincoln'}]
        request = self.factory.get('/search?query=abe&type=candidates')
        response = search(request)
        search_candidates.assert_called_with('abe')
        self.assertEqual(response.status_code, 200)


    @mock.patch.object(views, 'search_candidates')
    def test_site_search_candidates_not_called(self, m, search_candidates):
        # Test that it's not called if type=site
        m.register_uri('GET', search_url, status_code=500)
        request = self.factory.get('/search?query=abe&type=site')
        response = search(request)
        search_candidates.assert_not_called()


    @mock.patch.object(views, 'search_committees')
    def test_site_search_committees(self, m, search_committees):
        search_committees.return_value = [{'name': 'Abe for USA'}]
        request = self.factory.get('/search?query=abe&type=committees')
        response = search(request)
        search_committees.assert_called_with('abe')
        self.assertEqual(response.status_code, 200)


    @mock.patch.object(views, 'search_committees')
    def test_site_search_committees_not_called(self, m, search_committees):
        # Test that it's not called if type=site
        m.register_uri('GET', search_url, status_code=500)
        request = self.factory.get('/search?query=abe&type=site')
        response = search(request)
        search_committees.assert_not_called()


    @mock.patch.object(views, 'search_site')
    def test_site_search_site(self, m, search_site):
        search_site.return_value = []
        request = self.factory.get('/search?query=help&type=site')
        response = search(request)
        search_site.assert_called_with('help', limit=10, offset=0)
        self.assertEqual(response.status_code, 200)


    @mock.patch.object(views, 'search_site')
    def test_site_search_site_not_called(self, m, search_site):
        # Test that it's not called if type=candidates
        m.register_uri('GET', candidate_url, json={})
        request = self.factory.get('/search?query=abe&type=candidates')
        response = search(request)
        search_site.assert_not_called()
