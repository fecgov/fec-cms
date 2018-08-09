import unittest
import datetime
import locale

from collections import OrderedDict
from django.test import TestCase
from unittest import mock

from data.templatetags import filters
import data.api_caller as api_caller


class TestSenateSpecials(unittest.TestCase):

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
