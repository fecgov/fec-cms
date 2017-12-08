import unittest
import datetime
import locale

from collections import OrderedDict
from django.test import TestCase
from unittest import mock

from data.templatetags import filters
import data.utils as utils
import data.api_caller as api_caller

class TestUtils(TestCase):
    def test_currency_filter_not_none(self):
        assert filters.currency(1.05) == '$1.05'


    def test_currency_filter_none(self):
        assert filters.currency(None) is None


    def test_fmt_year_range_int(self):
        assert filters.fmt_year_range(1985) == '1984–1985'


    def test_fmt_year_range_not_int(self):
        assert filters.fmt_year_range('1985') is None
        assert filters.fmt_year_range(None) is None


    def test_fmt_state_full(self):
        value = 'ny'
        assert filters.fmt_state_full(value) == 'New York'


    def test_election_url(self):
        candidate = {'office': 'P', 'office_full': 'President', 'state': 'US', 'district': None}
        assert filters.get_election_url(candidate, 2012) == '/data/elections/president/2012'
        candidate = {'office': 'S', 'office_full': 'Senate', 'state': 'NJ', 'district': None}
        assert filters.get_election_url(candidate, 2012) == '/data/elections/senate/NJ/2012'
        candidate = {'office': 'S', 'office_full': 'Senate', 'state': 'NJ', 'district': '00'}
        assert filters.get_election_url(candidate, 2012) == '/data/elections/senate/NJ/2012'
        candidate = {'office': 'H', 'office_full': 'House', 'state': 'NJ', 'district': '02'}
        assert filters.get_election_url(candidate, 2012) == '/data/elections/house/NJ/02/2012'

    def test_financial_summary_processor(self):
        totals = {
            'receipts': 200,
            'disbursements': 100
        }
        formatter = OrderedDict([
            ('receipts', ('Total receipts', '1')),
            ('disbursements', ('Total disbursements', '1'))
        ])
        assert utils.financial_summary_processor(totals, formatter) == [(200, ('Total receipts', '1')), (100, ('Total disbursements', '1'))]

    def current_cycle(self):
        return 2016


class TestCycles(unittest.TestCase):
    @mock.patch('data.utils.current_cycle')
    def test_get_cycles(self, current_cycle):
        # Mock out the current_cycle so it doesn't change in the future
        current_cycle.return_value = 2016
        # Check that it returns the correct default when no arg supplied
        assert utils.get_cycles() == range(2016, 1979, -2)
        # Check that it returns the correct range when an arg is supplied
        assert utils.get_cycles(2020) == range(2020, 1979, -2)

    def test_get_senate_cycles(self):
        current_cycle = 2018
        assert utils.get_senate_cycles('1', current_cycle) == range(
            2018, 1979, -6)
        assert utils.get_senate_cycles('2', current_cycle) == range(
            2020, 1979, -6)
        assert utils.get_senate_cycles('3', current_cycle) == range(
            2022, 1979, -6)

        current_cycle = 2020
        assert utils.get_senate_cycles('1', current_cycle) == range(
            2024, 1979, -6)
        assert utils.get_senate_cycles('2', current_cycle) == range(
            2020, 1979, -6)
        assert utils.get_senate_cycles('3', current_cycle) == range(
            2022, 1979, -6)

        current_cycle = 2022
        assert utils.get_senate_cycles('1', current_cycle) == range(
            2024, 1979, -6)
        assert utils.get_senate_cycles('2', current_cycle) == range(
            2026, 1979, -6)
        assert utils.get_senate_cycles('3', current_cycle) == range(
            2022, 1979, -6)


    def test_state_senate_cycles(self):

        # Testing mock result from call_senate_specials()
        # and format_special_results() results
        call_senate_specials_mock_wv = [{
            'election_type_id': 'SG',
            'election_type_full': 'Special election general',
            'create_date': '2010-07-22T17:27:1600:00',
            'election_state': 'WV',
            'election_party': None,
            'update_date': None,
            'election_year': 2010,
            'office_sought': 'S',
            'election_date': '2010-11-02',
            'election_notes': "Sen. Robert Byrd's Seat.",
            'primary_general_date': '2016-09-16T16:09:22.555513'}]

        # According to our mock call, WV has a special in 2010 and not 2018
        westvirginia = api_caller.format_special_results(
            call_senate_specials_mock_wv)

        assert 2010 in westvirginia
        assert 2018 not in westvirginia

        # Testing with an example state, Wisconsin
        # There should be an election in 2016 but not 2014
        # because of the classes the state has
        wisconsin = api_caller.get_regular_senate_cycles('wi')
        assert 2016 in wisconsin
        assert 2014 not in wisconsin
        