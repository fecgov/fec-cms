import unittest
from django.test import Client
from wagtail.tests.utils import WagtailPageTests
from ..models import Author, HomePage, RecordPage, DigestPage, PressReleasePage


class SubPageTestMixin(object):
    parent_page_model = HomePage
    sub_page_model = None
    create_datas = []

    def setUp(self):
        super(SubPageTestMixin, self).setUp()
        self.parent_page = self.parent_page_model.objects.get()
        Author.objects.create(
            name="Aron Griffis",
            title="Scamp",
            email="aron@scampersand.com",
        )

    def create_page(self, data=None):
        """
        Create a page from self.sub_page_model. If data is None then uses
        self.create_datas[0].
        """
        if data is None:
            data = self.create_datas[0]
        pks_before = list(self.sub_page_model.objects
                          .values_list('pk', flat=True))
        self.assertCanCreate(self.parent_page, self.sub_page_model, data,
                             "can't create: {!r}".format(data))
        pages_after = list(self.sub_page_model.objects
                           .exclude(pk__in=pks_before))
        self.assertEqual(len(pages_after), 1)
        return pages_after[0]

    def test_create(self):
        for data in self.create_datas or [{}]:
            self.create_page(data)

    def test_render(self):
        page = self.create_page()
        response = Client().get(page.url)
        self.assertEqual(response.status_code, 200)
        response.content  # force lazy rendering and coverage measurement


class RecordPageTest(SubPageTestMixin, WagtailPageTests):
    sub_page_model = RecordPage
    create_datas = [
        {
            'title': "Title",
            'body-count': "0",
            'category': "statistics",
            'date': "2016-08-28",
            'authors-TOTAL_FORMS': "1",
            'authors-INITIAL_FORMS': "0",
            'authors-MIN_NUM_FORMS': "0",
            'authors-MAX_NUM_FORMS': "1000",
            'authors-0-author': "1",
            'authors-0-role': "writer",
            'authors-0-id': "",
            'authors-0-ORDER': "1",
            'authors-0-DELETE': "",
            'read_next': "",
            'related_section_title': "Explore campaign finance data",
            'related_section_url': "/data/",
        }
    ]


class DigestPageTest(SubPageTestMixin, WagtailPageTests):
    sub_page_model = DigestPage
    create_datas = [
        {
            'title': "Title",
            'body-count': "0",
            'date': "2016-08-28",
            'authors-TOTAL_FORMS': "0",
            'authors-INITIAL_FORMS': "0",
            'authors-MIN_NUM_FORMS': "0",
            'authors-MAX_NUM_FORMS': "1000",
        }
    ]


class PressReleasePageTest(SubPageTestMixin, WagtailPageTests):
    sub_page_model = PressReleasePage
    create_datas = [
        {
            'title': "Title",
            'body-count': "0",
            'category': "litigation",
            'date': "2016-08-28",
            'authors-TOTAL_FORMS': "0",
            'authors-INITIAL_FORMS': "0",
            'authors-MIN_NUM_FORMS': "0",
            'authors-MAX_NUM_FORMS': "1000",
        }
    ]
