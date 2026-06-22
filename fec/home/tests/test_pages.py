from django.contrib.messages.storage.fallback import FallbackStorage
from django.core.exceptions import ValidationError
from django.test import Client, RequestFactory
from wagtail.models import Page
from wagtail.test.utils import WagtailPageTests
from ..models import Author, HomePage, RecordPage, DigestPage, PressReleasePage
from ..wagtail_hooks import prevent_copying_unique_pages


class SubPageTestMixin(object):
    parent_page_model = HomePage
    sub_page_model = None
    create_datas = []

    def setUp(self):
        super(SubPageTestMixin, self).setUp()
        self.parent_page = self.parent_page_model.objects.get()
        self.author = Author.objects.create(
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

        # We need to make sure we reference the correct author to account for
        # foreign key relationships.
        if 'authors-0-author' in data:
            data['authors-0-author'] = str(self.author.pk)

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


class UniquePageTest(WagtailPageTests):
    def test_unique_page_clean_raises_validation_error_for_duplicate(self):
        duplicate_home_page = HomePage(title='Duplicate home page')

        with self.assertRaisesMessage(ValidationError, 'Only one HomePage allowed'):
            duplicate_home_page.clean()

    def test_unique_page_max_count_prevents_admin_creation(self):
        root_page = Page.objects.get(depth=1)

        self.assertFalse(HomePage.can_create_at(root_page))

    def test_unique_page_copy_is_blocked(self):
        home_page = HomePage.objects.get()
        request = RequestFactory().get('/')
        request.session = {}
        # The copy hook adds a Wagtail admin message before redirecting.
        request._messages = FallbackStorage(request)

        response = prevent_copying_unique_pages(request, home_page)

        self.assertEqual(response.status_code, 302)
        self.assertIn(str(home_page.get_parent().id), response.url)
