import unittest
import datetime

from django.test import Client
from django.test import TestCase
from django.core.urlresolvers import reverse
from unittest import mock
from urllib.parse import urlparse, parse_qs

from data import api_caller
from data import views
from data import legal_test_data

client = Client()


class TestCandidatePage(unittest.TestCase):

    def test_candidate(self):
        response = client.get(reverse('candidate-by-id', args=['S2MA00170']))
        assert response.status_code == 200
