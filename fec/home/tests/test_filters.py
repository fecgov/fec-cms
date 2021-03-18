from django.test import TestCase

from home.templatetags.filters import highlight_matches


class TestFilters(TestCase):

    def test_highlight_matches(self):
        text = '\ue000Highlighted\ue001 results'
        highlighted_text = highlight_matches(text)
        self.assertEqual(
            highlighted_text,
            '<span class="t-highlight">Highlighted</span> results'
        )

    def test_highlight_matches_with_brackets(self):
        """highlight_matches should remove { and } from results"""
        text = '\ue000Highlighted\ue001 {results}'
        highlighted_text = highlight_matches(text)
        self.assertEqual(
            highlighted_text,
            '<span class="t-highlight">Highlighted</span> results'
        )
