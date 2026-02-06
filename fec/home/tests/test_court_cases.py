"""
Tests for court case functionality including:
- CourtCasePage model
- CourtCaseIndexPage model
- Template tags (active_court_cases, selected_court_cases)
- Management commands
"""

from django.test import TestCase, Client
from django.core.management import call_command
from io import StringIO
from wagtail.test.utils import WagtailPageTests
from wagtail.models import Page

from ..models import (
    CourtCasePage,
    CourtCaseIndexPage,
    ResourcePage,
    HomePage,
    court_case_sort_key,
)
from ..templatetags.active_court_cases import active_court_cases
from ..templatetags.selected_court_cases import selected_court_cases


class CourtCasePageTests(WagtailPageTests):
    """Tests for CourtCasePage model"""

    def setUp(self):
        self.home_page = HomePage.objects.first()
        if not self.home_page:
            root_page = Page.objects.get(depth=1)
            self.home_page = HomePage(title="Home", slug="home")
            root_page.add_child(instance=self.home_page)

    def test_can_create_court_case_page(self):
        """Test that a CourtCasePage can be created"""
        court_case = CourtCasePage(
            title="Test v. FEC",
            slug="test-v-fec",
            index_title="Test: FEC v.",
            status="closed",
            opinions="<p>Test opinion</p>",
        )
        self.home_page.add_child(instance=court_case)
        court_case.save()

        self.assertEqual(CourtCasePage.objects.count(), 1)
        self.assertEqual(court_case.title, "Test v. FEC")
        self.assertEqual(court_case.status, "closed")

    def test_court_case_page_status_choices(self):
        """Test court case page has correct status choices"""
        court_case = CourtCasePage(
            title="Active Case v. FEC",
            slug="active-case-v-fec",
            status="active",
        )
        self.home_page.add_child(instance=court_case)
        court_case.save()

        self.assertEqual(court_case.status, "active")

    def test_court_case_page_renders(self):
        """Test that a CourtCasePage renders without errors"""
        court_case = CourtCasePage(
            title="Render Test v. FEC",
            slug="render-test-v-fec",
            index_title="Render Test: FEC v.",
            status="closed",
            opinions="<p>Test opinion content</p>",
        )
        self.home_page.add_child(instance=court_case)
        court_case.save()

        client = Client()
        response = client.get(court_case.url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Render Test v. FEC")

    def test_selected_court_case_field(self):
        """Test selected_court_case boolean field"""
        court_case = CourtCasePage(
            title="Selected Case v. FEC",
            slug="selected-case-v-fec",
            selected_court_case=True,
        )
        self.home_page.add_child(instance=court_case)
        court_case.save()

        self.assertTrue(court_case.selected_court_case)

    def test_index_title_fallback(self):
        """Test that display uses index_title when available, otherwise title"""
        court_case = CourtCasePage(
            title="Full Case Name v. FEC",
            slug="full-case-name-v-fec",
            index_title="Short Name: FEC v.",
        )
        self.home_page.add_child(instance=court_case)
        court_case.save()

        # The template uses index_title if present
        self.assertEqual(court_case.index_title, "Short Name: FEC v.")

    def test_search_fields_defined(self):
        """Test that CourtCasePage has search_fields for the page chooser search.

        The page chooser uses autocomplete(), so AutocompleteField entries
        are required for the chooser's search bar to work.
        """
        from wagtail.search import index

        field_names = [f.field_name for f in CourtCasePage.search_fields]
        # title comes from Page.search_fields
        self.assertIn('title', field_names)
        # index_title is added by CourtCasePage
        self.assertIn('index_title', field_names)

        # Verify AutocompleteField entries exist (needed by page chooser)
        autocomplete_fields = [
            f.field_name for f in CourtCasePage.search_fields
            if isinstance(f, index.AutocompleteField)
        ]
        self.assertIn('title', autocomplete_fields)
        self.assertIn('index_title', autocomplete_fields)


class CourtCaseIndexPageTests(WagtailPageTests):
    """Tests for CourtCaseIndexPage model"""

    def setUp(self):
        self.home_page = HomePage.objects.first()
        if not self.home_page:
            root_page = Page.objects.get(depth=1)
            self.home_page = HomePage(title="Home", slug="home")
            root_page.add_child(instance=self.home_page)

        # Create index page
        self.index_page = CourtCaseIndexPage(
            title="Court Cases",
            slug="court-cases-index",
        )
        self.home_page.add_child(instance=self.index_page)
        self.index_page.save()

    def test_can_create_court_case_index_page(self):
        """Test that a CourtCaseIndexPage can be created"""
        self.assertEqual(CourtCaseIndexPage.objects.count(), 1)
        self.assertEqual(self.index_page.title, "Court Cases")

    def test_index_page_lists_all_court_cases(self):
        """Test that index page shows all court cases site-wide"""
        # Create court cases in different locations
        case1 = CourtCasePage(
            title="Adams v. FEC",
            slug="adams-v-fec",
            index_title="Adams: FEC v.",
        )
        self.home_page.add_child(instance=case1)
        case1.save()

        case2 = CourtCasePage(
            title="Brown v. FEC",
            slug="brown-v-fec",
            index_title="Brown: FEC v.",
        )
        self.home_page.add_child(instance=case2)
        case2.save()

        client = Client()
        response = client.get(self.index_page.url)

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Adams: FEC v.")
        self.assertContains(response, "Brown: FEC v.")

    def test_index_page_groups_alphabetically(self):
        """Test that cases are grouped by first letter"""
        # Create cases starting with different letters
        case_a = CourtCasePage(
            title="Adams v. FEC",
            slug="adams-v-fec",
            index_title="Adams: FEC v.",
        )
        self.home_page.add_child(instance=case_a)
        case_a.save()

        case_b = CourtCasePage(
            title="Brown v. FEC",
            slug="brown-v-fec",
            index_title="Brown: FEC v.",
        )
        self.home_page.add_child(instance=case_b)
        case_b.save()

        client = Client()
        response = client.get(self.index_page.url)

        # Check for alphabetical section headers
        self.assertContains(response, '<h3 class="t-ruled--bold">A</h3>')
        self.assertContains(response, '<h3 class="t-ruled--bold">B</h3>')

    def test_index_page_search_filtering(self):
        """Test that search query filters results"""
        case1 = CourtCasePage(
            title="Adams v. FEC",
            slug="adams-v-fec",
            index_title="Adams: FEC v.",
        )
        self.home_page.add_child(instance=case1)
        case1.save()

        case2 = CourtCasePage(
            title="Brown v. FEC",
            slug="brown-v-fec",
            index_title="Brown: FEC v.",
        )
        self.home_page.add_child(instance=case2)
        case2.save()

        client = Client()
        response = client.get(self.index_page.url, {'q': 'Adams'})

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Adams: FEC v.")
        # Brown should not appear because of server-side filtering
        # (client-side JS filtering is tested separately)

    def test_index_page_shows_total_count(self):
        """Test that index page displays total case count"""
        case1 = CourtCasePage(
            title="Case One v. FEC",
            slug="case-one-v-fec",
        )
        self.home_page.add_child(instance=case1)
        case1.save()

        case2 = CourtCasePage(
            title="Case Two v. FEC",
            slug="case-two-v-fec",
        )
        self.home_page.add_child(instance=case2)
        case2.save()

        client = Client()
        response = client.get(self.index_page.url)

        self.assertContains(response, "2 total court cases")

    def test_index_page_no_results_message(self):
        """Test that no results message appears for empty search"""
        client = Client()
        response = client.get(self.index_page.url, {'q': 'NonexistentCase'})

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "No results")

    def test_index_page_sorts_by_index_title(self):
        """Test that cases are sorted by index_title when present"""
        # Create cases with index_titles that differ from regular titles
        case_z = CourtCasePage(
            title="Zebra Case Full Name v. FEC",
            slug="zebra-case-v-fec",
            index_title="Adams: FEC v.",  # Should sort under A
        )
        self.home_page.add_child(instance=case_z)
        case_z.save()

        case_a = CourtCasePage(
            title="Apple Case Full Name v. FEC",
            slug="apple-case-v-fec",
            index_title="Zebra: FEC v.",  # Should sort under Z
        )
        self.home_page.add_child(instance=case_a)
        case_a.save()

        client = Client()
        response = client.get(self.index_page.url)

        # Check that Zebra title appears under A section
        self.assertContains(response, '<h3 class="t-ruled--bold">A</h3>')
        self.assertContains(response, '<h3 class="t-ruled--bold">Z</h3>')

    def test_index_page_handles_numeric_titles(self):
        """Test that titles starting with numbers are grouped by spelled-out number"""
        # Create case starting with number
        case_21 = CourtCasePage(
            title="21st Century Fund v. FEC",
            slug="21st-century-fund-v-fec",
            index_title="21st Century Fund v. FEC",
        )
        self.home_page.add_child(instance=case_21)
        case_21.save()

        case_501 = CourtCasePage(
            title="501(c)(4) Organization v. FEC",
            slug="501c4-organization-v-fec",
            index_title="501(c)(4) Organization v. FEC",
        )
        self.home_page.add_child(instance=case_501)
        case_501.save()

        client = Client()
        response = client.get(self.index_page.url)

        # 21 = "twenty-one" should be under T
        self.assertContains(response, '<h3 class="t-ruled--bold">T</h3>')
        # 501 = "five hundred one" should be under F
        self.assertContains(response, '<h3 class="t-ruled--bold">F</h3>')
        self.assertContains(response, '21st Century Fund v. FEC')
        self.assertContains(response, '501(c)(4) Organization v. FEC')

    def test_get_sort_key_converts_numbers_to_words(self):
        """Test that get_sort_key properly converts leading numbers"""
        # Test the helper method directly
        result = self.index_page.get_sort_key("21st Century Fund")
        self.assertEqual(result, "twenty-onest Century Fund")

        result = self.index_page.get_sort_key("501(c)(4)")
        self.assertEqual(result, "five hundred one(c)(4)")

        result = self.index_page.get_sort_key("Adams v. FEC")
        self.assertEqual(result, "Adams v. FEC")

        result = self.index_page.get_sort_key("100 Citizens Group")
        self.assertEqual(result, "one hundred Citizens Group")


class CourtCaseSortKeyTests(TestCase):
    """Tests for court_case_sort_key function"""

    def setUp(self):
        self.home_page = HomePage.objects.first()
        if not self.home_page:
            root_page = Page.objects.get(depth=1)
            self.home_page = HomePage(title="Home", slug="home")
            root_page.add_child(instance=self.home_page)

    def test_same_name_cases_sort_reverse_chronologically(self):
        """Test that cases with the same name sort by first case number, newest first"""
        case_oldest = CourtCasePage(
            title="Campaign Legal Center v. FEC (21-1376)",
            slug="clc-v-fec-21-1376",
        )
        self.home_page.add_child(instance=case_oldest)

        case_mid = CourtCasePage(
            title="Campaign Legal Center v. FEC (22-838)",
            slug="clc-v-fec-22-838",
        )
        self.home_page.add_child(instance=case_mid)

        case_newest = CourtCasePage(
            title="Campaign Legal Center v. FEC (22-1976 / 22-5339)",
            slug="clc-v-fec-22-1976",
        )
        self.home_page.add_child(instance=case_newest)

        cases = [case_oldest, case_mid, case_newest]
        sorted_cases = sorted(cases, key=lambda c: court_case_sort_key(c))

        # Reverse chronological: newest (highest first case number) first
        self.assertEqual(sorted_cases[0].slug, "clc-v-fec-22-1976")
        self.assertEqual(sorted_cases[1].slug, "clc-v-fec-22-838")
        self.assertEqual(sorted_cases[2].slug, "clc-v-fec-21-1376")

    def test_sort_uses_first_case_number_not_highest(self):
        """Test that sorting uses the first case number in the title, not the highest"""
        # Case A has a lower first number (20-100) but a higher second number (23-9999)
        case_a = CourtCasePage(
            title="Test v. FEC (20-100 / 23-9999)",
            slug="test-v-fec-a",
        )
        self.home_page.add_child(instance=case_a)

        # Case B has a higher first number (22-500)
        case_b = CourtCasePage(
            title="Test v. FEC (22-500)",
            slug="test-v-fec-b",
        )
        self.home_page.add_child(instance=case_b)

        sorted_cases = sorted([case_a, case_b], key=lambda c: court_case_sort_key(c))

        # Case B's first number (22-500) is higher than Case A's first number (20-100)
        # so Case B should sort first (reverse chronological)
        self.assertEqual(sorted_cases[0].slug, "test-v-fec-b")
        self.assertEqual(sorted_cases[1].slug, "test-v-fec-a")


class CourtCaseTemplateTagTests(TestCase):
    """Tests for court case template tags"""

    def setUp(self):
        self.home_page = HomePage.objects.first()
        if not self.home_page:
            root_page = Page.objects.get(depth=1)
            self.home_page = HomePage(title="Home", slug="home")
            root_page.add_child(instance=self.home_page)

    def test_active_court_cases_template_tag(self):
        """Test active_court_cases template tag returns only active cases"""
        # Create active case
        active_case = CourtCasePage(
            title="Active Case v. FEC",
            slug="active-case-v-fec",
            status="active",
        )
        self.home_page.add_child(instance=active_case)
        active_case.save()

        # Create closed case
        closed_case = CourtCasePage(
            title="Closed Case v. FEC",
            slug="closed-case-v-fec",
            status="closed",
        )
        self.home_page.add_child(instance=closed_case)
        closed_case.save()

        # Call template tag
        result = active_court_cases()

        self.assertIn('active_cases', result)
        self.assertEqual(len(result['active_cases']), 1)
        self.assertEqual(result['active_cases'][0].title, "Active Case v. FEC")

    def test_selected_court_cases_template_tag(self):
        """Test selected_court_cases template tag returns only selected cases"""
        # Create selected case
        selected_case = CourtCasePage(
            title="Selected Case v. FEC",
            slug="selected-case-v-fec",
            selected_court_case=True,
        )
        self.home_page.add_child(instance=selected_case)
        selected_case.save()

        # Create non-selected case
        regular_case = CourtCasePage(
            title="Regular Case v. FEC",
            slug="regular-case-v-fec",
            selected_court_case=False,
        )
        self.home_page.add_child(instance=regular_case)
        regular_case.save()

        # Call template tag
        result = selected_court_cases()

        self.assertIn('selected_cases', result)
        self.assertEqual(len(result['selected_cases']), 1)
        self.assertEqual(result['selected_cases'][0].title, "Selected Case v. FEC")

    def test_active_court_cases_empty(self):
        """Test active_court_cases returns empty when no active cases"""
        # Create only closed cases
        closed_case = CourtCasePage(
            title="Closed Case v. FEC",
            slug="closed-case-v-fec",
            status="closed",
        )
        self.home_page.add_child(instance=closed_case)
        closed_case.save()

        result = active_court_cases()

        self.assertEqual(len(result['active_cases']), 0)


class ConvertResourceToCourtCaseCommandTests(TestCase):
    """Tests for convert_resource_to_courtcase management command"""

    def setUp(self):
        self.home_page = HomePage.objects.first()
        if not self.home_page:
            root_page = Page.objects.get(depth=1)
            self.home_page = HomePage(title="Home", slug="home")
            root_page.add_child(instance=self.home_page)

        # Create a parent page for court cases
        self.court_cases_parent = ResourcePage(
            title="Court Cases",
            slug="court-cases",
        )
        self.home_page.add_child(instance=self.court_cases_parent)
        self.court_cases_parent.save()

    def test_convert_resource_to_courtcase_dry_run(self):
        """Test convert command in dry-run mode doesn't make changes"""
        # Create a ResourcePage
        resource_page = ResourcePage(
            title="Test Case v. FEC",
            slug="test-case-v-fec",
        )
        self.court_cases_parent.add_child(instance=resource_page)
        resource_page.save()

        initial_resource_count = ResourcePage.objects.count()
        initial_court_case_count = CourtCasePage.objects.count()

        # Run command in dry-run mode
        out = StringIO()
        call_command(
            'convert_resource_to_courtcase',
            '--dry-run',
            stdout=out
        )

        # Counts should not change
        self.assertEqual(ResourcePage.objects.count(), initial_resource_count)
        self.assertEqual(CourtCasePage.objects.count(), initial_court_case_count)
        self.assertIn('DRY RUN', out.getvalue())

    def test_convert_single_page_by_id(self):
        """Test converting a single page by ID"""
        # Create a ResourcePage
        resource_page = ResourcePage(
            title="Single Test Case v. FEC",
            slug="single-test-case-v-fec",
        )
        self.court_cases_parent.add_child(instance=resource_page)
        resource_page.save()

        page_id = resource_page.id

        # Run conversion
        out = StringIO()
        call_command(
            'convert_resource_to_courtcase',
            f'--page-id={page_id}',
            stdout=out
        )

        # Check conversion happened
        self.assertEqual(CourtCasePage.objects.filter(id=page_id).count(), 1)
        self.assertIn('Successfully converted', out.getvalue())

    def test_convert_single_page_by_slug(self):
        """Test converting a single page by slug"""
        # Create a ResourcePage
        resource_page = ResourcePage(
            title="Slug Test Case v. FEC",
            slug="slug-test-case-v-fec",
        )
        self.court_cases_parent.add_child(instance=resource_page)
        resource_page.save()

        # Run conversion
        out = StringIO()
        call_command(
            'convert_resource_to_courtcase',
            '--page-slug=slug-test-case-v-fec',
            stdout=out
        )

        # Check conversion happened
        self.assertTrue(
            CourtCasePage.objects.filter(slug='slug-test-case-v-fec').exists()
        )


class ImportCourtCaseOpinionsCommandTests(TestCase):
    """Tests for import_court_case_opinions_local management command"""

    def setUp(self):
        self.home_page = HomePage.objects.first()
        if not self.home_page:
            root_page = Page.objects.get(depth=1)
            self.home_page = HomePage(title="Home", slug="home")
            root_page.add_child(instance=self.home_page)

        # Create legal resources parent
        self.legal_resources = ResourcePage(
            title="Legal Resources",
            slug="legal-resources",
        )
        self.home_page.add_child(instance=self.legal_resources)
        self.legal_resources.save()

        # Create court cases parent
        self.court_cases_parent = ResourcePage(
            title="Court Cases",
            slug="court-cases",
        )
        self.legal_resources.add_child(instance=self.court_cases_parent)
        self.court_cases_parent.save()

        # Create the index page that the command will fetch
        self.index_page = CourtCaseIndexPage(
            title="Court Case Alphabetical Index",
            slug="court-case-alphabetical-index",
        )
        self.court_cases_parent.add_child(instance=self.index_page)
        self.index_page.save()

    def test_import_opinions_command_dry_run(self):
        """Test import opinions command in dry-run mode"""
        # Create a court case page with opinions
        court_case = CourtCasePage(
            title="Test Import Case v. FEC",
            slug="test-import-case-v-fec",
            opinions="<p>Existing opinion</p>",
        )
        self.court_cases_parent.add_child(instance=court_case)
        court_case.save()

        # Run command in dry-run mode
        out = StringIO()
        err = StringIO()
        call_command(
            'import_court_case_opinions_local',
            '--dry-run',
            stdout=out,
            stderr=err
        )

        output = out.getvalue() + err.getvalue()
        # Verify dry-run message appears
        self.assertIn('DRY RUN', output)
