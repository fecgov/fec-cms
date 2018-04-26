import requests_mock
import search.utils.search_indexing as search

from wagtail.core.models import Page
from unittest import mock
from django.test import Client, TestCase, override_settings
from django.conf import settings
from datetime import datetime

# Only use the real search engine if we're on production
if settings.FEC_CMS_ENVIRONMENT == 'PRODUCTION':
    DIGITALGOV_BASE_URL = 'https://i14y.usa.gov/api/v1'
    DIGITALGOV_DRAWER_KEY = settings.FEC_DIGITALGOV_DRAWER_KEY_MAIN
    DIGITALGOV_DRAWER_HANDLE = 'main'
else:
    DIGITALGOV_BASE_URL = 'http://localhost:3000/data'
    DIGITALGOV_DRAWER_KEY = ''
    DIGITALGOV_DRAWER_HANDLE = ''


class MockPage(object):
    id = 123
    title = 'Mock page'
    url_path = '/home/mock/'
    first_published_at = datetime(2017, 6, 1, 0, 0)
    search_description = None
    latest_revision_created_at = None

    def __init__(self, add_description=False, add_latest_revision=False, parent_path='/home/about/', ancestor_path='/home/'):
        self.parent_path = parent_path
        self.ancestor_path = ancestor_path
        if add_description:
            self.search_description = 'Fake description'
        if add_latest_revision:
            self.latest_revision_created_at = datetime(2017, 6, 2, 0, 0)

    def get_parent(self):
        return MockParent(self.parent_path)

    def get_ancestors(self):
        return [MockParent(self.parent_path), MockParent(self.ancestor_path)]

class MockParent(object):
    def __init__(self, path):
        self.url_path = path


# Override settings so the env will be treated as prod but we'll send to a nonexistent API url
@override_settings(
    FEC_CMS_ENVIRONMENT='PRODUCTION',
    CANONICAL_BASE='https://www.fec.gov')
@mock.patch.object(search, 'scrape_page_content')
class TestSearchIndexing(TestCase):
    def setUp(self):
        self.page = MockPage()

    def test_create_search_index_doc(self, scrape):
        # It builds the base doc object
        scrape.return_value = 'Fake content'
        doc = search.create_search_index_doc(self.page)
        self.assertEqual(doc, {
          'document_id': 123,
          'title': 'Mock page',
          'path': 'https://www.fec.gov/mock/',
          'content': 'Fake content',
          'created': '2017-06-01-000000',
          'promote': 'false',
          'language': 'en',
        })

        # It calls scrape_page_content with the correct url
        scrape.assert_called_with('https://www.fec.gov/mock/')

    def test_create_index_doc_with_description(self, scrape):
        # It adds description if the page has one
        page = MockPage(add_description=True)
        doc = search.create_search_index_doc(page)
        self.assertEqual(doc['description'], 'Fake description')


    def test_create_index_doc_edited(self, scrape):
        # It adds doc['changed'] if the page was edited
        page = MockPage(add_latest_revision=True)
        doc = search.create_search_index_doc(page)
        self.assertEqual(doc['changed'], '2017-06-02-000000')


    @requests_mock.Mocker()
    def test_add_document(self, scrape, m):
        # It makes a POST to the add endpoint
        m.register_uri('POST', '{}/documents'.format(DIGITALGOV_BASE_URL), status_code=201)
        search.add_document(self.page)
        self.assertTrue(m.called)


    @mock.patch.object(search, 'update_document')
    @requests_mock.Mocker()
    def test_add_existing_document(self, update_document, scrape, m):
        # It handles a 422 if the doc already exists
        m.register_uri('POST', '{}/documents'.format(DIGITALGOV_BASE_URL), status_code=422)
        search.add_document(self.page)
        update_document.assert_called_with(self.page)


    @requests_mock.Mocker()
    def test_update_document(self, scrape, m):
        # It makes a PUT to the update endpoint
        m.register_uri('PUT', '{}/documents/123'.format(DIGITALGOV_BASE_URL), status_code=200)
        search.update_document(self.page)
        self.assertTrue(m.called)


    @requests_mock.Mocker()
    def test_delete_document_in_prod(self, scrape, m):
        # It makes a DELETE to the update endpoint in production
        m.register_uri('DELETE', '{}/documents/123'.format(DIGITALGOV_BASE_URL), status_code=200)
        search.handle_page_delete(123)
        self.assertTrue(m.called)


    @override_settings(FEC_CMS_ENVIRONMENT='LOCAL')
    @requests_mock.Mocker()
    def test_delete_document_off_prod(self, scrape, m):
        # It does nothing if not on production
        m.register_uri('DELETE', '{}/documents/123'.format(DIGITALGOV_BASE_URL), status_code=200)
        search.handle_page_delete(123)
        self.assertFalse(m.called)


    @override_settings(FEC_CMS_ENVIRONMENT='LOCAL')
    @mock.patch.object(search, 'add_document')
    @mock.patch.object(Page, 'objects')
    def test_handle_page_edit_or_create_off_prod(self, objects, add, scrape):
        # It doesn't do anything if the environment is production
        objects.live.return_value.public.return_value.get.return_value = 'page'
        search.handle_page_edit_or_create(self.page, 'add')
        self.assertFalse(add.called)


    @mock.patch.object(search, 'add_document')
    @mock.patch.object(search, 'check_ancestors')
    @mock.patch.object(Page, 'objects')
    def test_handle_page_create_on_prod(self, objects, check, add, scrape):
        # It calls add_document if the method is 'add'
        objects.live.return_value.public.return_value.get.return_value = self.page
        check.return_value = self.page
        search.handle_page_edit_or_create(self.page, 'add')
        add.assert_called_with(self.page)


    @mock.patch.object(search, 'update_document')
    @mock.patch.object(search, 'check_ancestors')
    @mock.patch.object(Page, 'objects')
    def test_handle_page_edit_on_prod(self, objects, check, update, scrape):
        # It calls update_document if the method is 'update'
        objects.live.return_value.public.return_value.get.return_value = self.page
        check.return_value = self.page
        search.handle_page_edit_or_create(self.page, 'update')
        update.assert_called_with(self.page)


    @mock.patch.object(search, 'add_document')
    @mock.patch.object(search, 'check_ancestors')
    @mock.patch.object(Page, 'objects')
    def test_handle_page_not_published(self, objects, check, add, scrape):
        # It does nothing if the page isn't live and public
        objects.live.return_value.public.return_value.get.return_value = None
        check.return_value = self.page
        search.handle_page_edit_or_create(self.page, 'add')
        self.assertFalse(add.called)


    def test_check_ancestors_valid_parent(self, scrape):
        # check_ancestors returns the page when it has a valid direct parent
        p = search.check_ancestors(self.page)
        self.assertEqual(p, self.page)


    def test_check_ancestors_valid_ancestors(self, scrape):
        # check_ancestors returns the page when it has valid ancestors
        page = MockPage(parent_path='/home/legal-resources/something/', ancestor_path='/home/legal-resources/')
        p = search.check_ancestors(page)
        self.assertEqual(p, page)


    def test_check_ancestors_invalid_ancestors(self, scrape):
        # check_ancestors returns None when it has an invalid parent and ancestors
        page = MockPage(parent_path='/fake/', ancestor_path='/fake/fake/')
        p = search.check_ancestors(page)
        self.assertEqual(p, None)
