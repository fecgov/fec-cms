import unittest
import home.views as views
from django.test import Client, TestCase

class TestViews(TestCase):
  def setUp(self):
    self.client = Client()

  def test_rad_form(self):
    resp = self.client.get('/help-candidates-and-committees/question-rad/')
    self.assertEqual(resp.status_code, 200)
    self.assertTemplateUsed(resp, 'home/contact-form.html')
    self.assertEqual(resp.context['self']['content_section'], 'help')

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
