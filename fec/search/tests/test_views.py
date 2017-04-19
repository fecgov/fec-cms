import unittest
import search.views as views

from django.test import Client, TestCase
from unittest import mock
from search.views import (
    search_candidates,
    search_committees,
    prev_offset,
    parse_icon,
    search
)

class TestViews(TestCase):
    def setUp(self):
        self.client = Client()


    def test_prev_offset_first_page(self):
      offset = prev_offset(5, 5)
      self.assertEqual(offset, 0)


    def test_prev_offset_next_page(self):
        offset = prev_offset(5, 10)
        self.assertEqual(offset, 5)


    def test_parse_icon_page(self):
        icon = parse_icon('/some-page/')
        self.assertEqual(icon, 'page')


    def test_parse_icon_data(self):
        icon = parse_icon('/data/receipts/')
        self.assertEqual(icon, 'data')


    def test_parse_icon_datapage(self):
        icon = parse_icon('/data/advanced/')
        self.assertEqual(icon, 'page')
