import unittest
from collections import OrderedDict
from unittest import mock

from django.test import TestCase, RequestFactory
from django.http import Http404

from data import api_caller
from legal import views


class TestLegal(unittest.TestCase):
    @mock.patch.object(api_caller, '_call_api')
    def test_load_legal_mur(self, call_api):
        call_api.return_value = {
            'docs': [{
                'no': '1234',
                'mur_type': 'current',
                'participants': [
                    {
                        'role': 'Complainant',
                        'name': 'Gollum',
                        'citations': []
                    },
                    {
                        'role': 'Respondent',
                        'name': 'Bilbo Baggins',
                        'citations': []
                    },
                ],
                'commission_votes': [],
                'dispositions': [
                    {
                        'disposition': 'Conciliation-PC',
                        'penalty': 100.0
                    },
                    {
                        'disposition': 'Conciliation-PC',
                        'penalty': 0.0
                    },
                ],
                'documents': []
            }]
        }

        mur = api_caller.load_legal_mur('1234')

        assert mur.get('no') == '1234'
        assert mur['participants_by_type'] == OrderedDict([
            ('Respondent', ['Bilbo Baggins']),
            ('Complainant', ['Gollum']),
        ])
        assert mur['collated_dispositions'] == OrderedDict([
            ('Conciliation-PC', OrderedDict([
                (100.0, [{'penalty': 100.0, 'disposition': 'Conciliation-PC'}]),
                (0.0, [{'penalty': 0.0, 'disposition': 'Conciliation-PC'}])
            ]))
        ])


class TestLegalDocumentRedirect(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    @mock.patch('data.api_caller.find_legal_document_by_filename')
    def test_legal_document_redirect_success(self, mock_find_document):
        """Test successful redirect for legal document by filename"""
        # Mock the api_caller function to return a document URL
        mock_find_document.return_value = 'https://www.fec.gov/files/legal/aos/1997-01/1069112.pdf'

        request = self.factory.get('/legal/search/documents/?filename=1069112')
        response = views.legal_document_redirect(request)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, 'https://www.fec.gov/files/legal/aos/1997-01/1069112.pdf')
        mock_find_document.assert_called_once_with('1069112')

    @mock.patch('requests.get')
    def test_legal_document_redirect_with_pdf_extension(self, mock_get):
        """Test successful redirect when filename includes .pdf extension"""
        # Mock API response with document found
        mock_response = mock.Mock()
        mock_response.ok = True
        mock_response.json.return_value = {
            'murs': [{
                'documents': [{
                    'filename': '00000182',
                    'url': '/files/legal/murs/4735/00000182.pdf',
                    'category': 'General Counsel Reports'
                }]
            }]
        }
        mock_get.return_value = mock_response

        request = self.factory.get('/legal/search/documents/?filename=00000182.pdf')
        response = views.legal_document_redirect(request)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, 'https://www.fec.gov/files/legal/murs/4735/00000182.pdf')

    @mock.patch('requests.get')
    def test_legal_document_redirect_not_found(self, mock_get):
        """Test 404 when document is not found"""
        # Mock API response with no documents found
        mock_response = mock.Mock()
        mock_response.ok = True
        mock_response.json.return_value = {
            'advisory_opinions': [],
            'murs': [],
            'adrs': [],
            'admin_fines': []
        }
        mock_get.return_value = mock_response

        request = self.factory.get('/legal/search/documents/?filename=nonexistent')

        with self.assertRaises(Http404):
            views.legal_document_redirect(request)

    @mock.patch('data.api_caller.find_legal_document_by_filename')
    def test_legal_document_redirect_api_error(self, mock_find_document):
        """Test 404 when API returns an error"""
        # Mock the api_caller function to raise an exception
        mock_find_document.side_effect = Exception('API Error')

        request = self.factory.get('/legal/search/documents/?filename=1069112')

        with self.assertRaises(Http404):
            views.legal_document_redirect(request)
        mock_find_document.assert_called_once_with('1069112')

    def test_legal_document_redirect_no_filename(self):
        """Test 404 when no filename parameter is provided"""
        request = self.factory.get('/legal/search/documents/')

        with self.assertRaises(Http404):
            views.legal_document_redirect(request)

    @mock.patch('data.api_caller.find_legal_document_by_filename')
    def test_legal_document_redirect_url_routing(self, mock_find_document):
        """Test that the /legal/search/documents/ URL correctly routes to the redirect function"""
        # Mock the api_caller function to return a document URL
        mock_find_document.return_value = 'https://www.fec.gov/files/legal/aos/1997-01/1069112.pdf'

        # Test the /legal/search/documents/ endpoint
        response = self.client.get('/legal/search/documents/?filename=1069112')
        # Should redirect (302) not give 404
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, 'https://www.fec.gov/files/legal/aos/1997-01/1069112.pdf')
        mock_find_document.assert_called_once_with('1069112')

    @mock.patch('data.api_caller.find_legal_document_by_filename')
    def test_legal_document_redirect_uses_canonical_base(self, mock_find_document):
        """Test that redirect uses CANONICAL_BASE setting"""
        # Mock the api_caller function to return a document URL with env base
        mock_find_document.return_value = 'https://env.fec.gov/files/legal/aos/1997-01/1069112.pdf'

        request = self.factory.get('/legal/search/documents/?filename=1069112')
        response = views.legal_document_redirect(request)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, 'https://env.fec.gov/files/legal/aos/1997-01/1069112.pdf')
        mock_find_document.assert_called_once_with('1069112')
