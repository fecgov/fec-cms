import unittest
import fec.forms
import requests

from unittest import mock
from django.test import TestCase
from fec.forms import ContactRAD

def mock_get():
  requests.patch()

class TestContactForm(TestCase):
  def test_valid_submission(self):
    categories = fec.forms.form_categories()
    form = ContactRAD({
          'u_contact_first_name': 'Noah',
          'u_contact_last_name': 'Manger',
          'u_contact_email': 'noah@example.com',
          'committee_name': 'NoahPAC',
          'u_committee': '12345',
          'u_contact_title': 'Mr.',
          'u_category': categories[1][0],
          'u_description': 'Lorem ipsum',
          'u_committee_member_certification': True
      })
    self.assertTrue(form.is_valid())

  def test_empty_submission(self):
    form = ContactRAD({})
    self.assertFalse(form.is_valid())

  @mock.patch.object(fec.forms, 'fetch_categories')
  def test_get_categories(self, fetch):
    fetch.return_value = [{'value': 'fake', 'label': 'Fake category'}]
    categories = fec.forms.form_categories()
    # It should return a list of tuples
    self.assertEqual(categories[1], ('fake', 'Fake category'))
    # It should add the empty option for "Select a category"
    self.assertEqual(categories[0][1], 'Choose a subject')
