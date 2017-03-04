import unittest
import home.views as views
from django.test import Client, TestCase

class TestViews(TestCase):
  def setUp(self):
    self.client = Client()

  def test_rad_form(self):
    resp = self.client.get('/registration-and-reporting/question-RAD/')
    self.assertEqual(resp.status_code, 200)
    self.assertTemplateUsed(resp, 'home/contact-form.html')
    self.assertEqual(resp.context['self']['content_section'], 'registration-and-reporting')

  def test_contact_page(self):
    resp = self.client.get('/contact-us/')
    self.assertEqual(resp.status_code, 200)
    self.assertTemplateUsed(resp, 'home/contact.html')
    self.assertEqual(resp.context['self']['content_section'], 'contact')

  def test_calendar(self):
    resp = self.client.get('/calendar/')
    self.assertEqual(resp.status_code, 200)
    self.assertTemplateUsed(resp, 'home/calendar.html')
    self.assertEqual(resp.context['self']['content_section'], 'calendar')

  def test_latest_updates(self):
    resp = self.client.get('/updates/')
    self.assertEqual(resp.status_code, 200)
    self.assertTemplateUsed(resp, 'home/latest_updates.html')

  def test_commissioners_page(self):
    resp = self.client.get('/about/leadership-and-structure/commissioners/')
    self.assertEqual(resp.status_code, 200)
    self.assertTemplateUsed(resp, 'home/commissioners.html')
    self.assertEqual(resp.context['self']['content_section'], 'about')

