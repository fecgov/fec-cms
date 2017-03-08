import unittest
import fec.forms
import requests

from unittest import mock
from django.test import TestCase
from fec.forms import ContactRAD

def mock_get():
  requests.patch()

class TestContactForm(TestCase):
  form_data = {
    'u_contact_first_name': 'Noah',
    'u_contact_last_name': 'Manger',
    'u_contact_email': 'noah@example.com',
    'committee_name': 'NoahPAC',
    'u_committee': '12345',
    'u_contact_title': 'Mr.',
    'u_category': 'fake',
    'u_description': 'Lorem ipsum',
    'u_committee_member_certification': True
  }

  @mock.patch.object(fec.forms, 'form_categories')
  def test_valid_submission(self, form_categories):
    form_categories.return_value = [('fake', 'Fake category')]
    form = ContactRAD(self.form_data)
    self.assertTrue(form.is_valid())

  def test_empty_submission(self):
    form = ContactRAD({})
    self.assertFalse(form.is_valid())

  @mock.patch.object(fec.forms, 'form_categories')
  @mock.patch.object(fec.forms.requests, 'post')
  def test_post_to_service_now(self, mock_post, form_categories):
    form_categories.return_value = [('fake', 'Fake category')]
    # Test to make sure this method removes the `committee_name` field
    form = ContactRAD(self.form_data)
    form.post_to_service_now()
    call_data = mock_post.call_args[1]['data']
    self.assertFalse('committee_name' in call_data)

  @mock.patch.object(fec.forms, 'fetch_categories')
  def test_get_categories(self, fetch):
    fetch.return_value = [{'value': 'fake', 'label': 'Fake category'}]
    categories = [('fake', 'Fake category')]
    # It should return a list of tuples
    self.assertEqual(categories[0], ('fake', 'Fake category'))
