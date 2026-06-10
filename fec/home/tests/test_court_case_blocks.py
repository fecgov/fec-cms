"""
Tests for court case blocks (ActiveCourtCasesBlock, SelectedCourtCasesBlock)
"""

from django.test import TestCase, RequestFactory
from wagtail.models import Page

from ..models import (
    CourtCasePage,
    HomePage
)
from ..blocks import ActiveCourtCasesBlock, SelectedCourtCasesBlock


class ActiveCourtCasesBlockTests(TestCase):
    """Tests for ActiveCourtCasesBlock"""

    def setUp(self):
        self.home_page = HomePage.objects.first()
        if not self.home_page:
            root_page = Page.objects.get(depth=1)
            self.home_page = HomePage(title="Home", slug="home")
            root_page.add_child(instance=self.home_page)

        self.factory = RequestFactory()
        self.block = ActiveCourtCasesBlock()

    def test_active_court_cases_block_renders(self):
        """Test that ActiveCourtCasesBlock renders without errors"""
        # Create an active case
        active_case = CourtCasePage(
            title="Active Block Test v. FEC",
            slug="active-block-test-v-fec",
            status="active",
        )
        self.home_page.add_child(instance=active_case)
        active_case.save()

        # Render the block
        html = self.block.render(self.block.to_python({}))

        self.assertIn('Active Block Test v. FEC', html)

    def test_active_court_cases_block_empty_state(self):
        """Test that ActiveCourtCasesBlock handles no active cases"""
        # Don't create any active cases

        # Render the block
        html = self.block.render(self.block.to_python({}))

        self.assertIn('no active court cases', html.lower())

    def test_active_court_cases_block_filters_closed_cases(self):
        """Test that ActiveCourtCasesBlock only shows active cases"""
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

        # Render the block
        html = self.block.render(self.block.to_python({}))

        self.assertIn('Active Case v. FEC', html)
        self.assertNotIn('Closed Case v. FEC', html)


class SelectedCourtCasesBlockTests(TestCase):
    """Tests for SelectedCourtCasesBlock"""

    def setUp(self):
        self.home_page = HomePage.objects.first()
        if not self.home_page:
            root_page = Page.objects.get(depth=1)
            self.home_page = HomePage(title="Home", slug="home")
            root_page.add_child(instance=self.home_page)

        self.factory = RequestFactory()
        self.block = SelectedCourtCasesBlock()

    def test_selected_court_cases_block_renders(self):
        """Test that SelectedCourtCasesBlock renders without errors"""
        # Create a selected case
        selected_case = CourtCasePage(
            title="Selected Block Test v. FEC",
            slug="selected-block-test-v-fec",
            selected_court_case=True,
        )
        self.home_page.add_child(instance=selected_case)
        selected_case.save()

        # Render the block
        html = self.block.render(self.block.to_python({}))

        self.assertIn('Selected Block Test v. FEC', html)

    def test_selected_court_cases_block_empty_state(self):
        """Test that SelectedCourtCasesBlock handles no selected cases"""
        # Don't create any selected cases

        # Render the block
        html = self.block.render(self.block.to_python({}))

        self.assertIn('no selected court cases', html.lower())

    def test_selected_court_cases_block_filters_non_selected(self):
        """Test that SelectedCourtCasesBlock only shows selected cases"""
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

        # Render the block
        html = self.block.render(self.block.to_python({}))

        self.assertIn('Selected Case v. FEC', html)
        self.assertNotIn('Regular Case v. FEC', html)

    def test_selected_court_cases_uses_index_title(self):
        """Test that selected cases display uses index_title when available"""
        # Create selected case with index_title
        selected_case = CourtCasePage(
            title="Full Long Case Name v. FEC",
            slug="full-long-case-v-fec",
            index_title="Short: FEC v.",
            selected_court_case=True,
        )
        self.home_page.add_child(instance=selected_case)
        selected_case.save()

        # Render the block
        html = self.block.render(self.block.to_python({}))

        self.assertIn('Short: FEC v.', html)
