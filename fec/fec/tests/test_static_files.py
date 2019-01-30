from django.test import Client, TestCase
import pytest


class TestStaticFiles(TestCase):
    def setUp(self):
        self.client = Client()

    def test_data_json_renders(self):
        response = self.client.get('/data.json')
        self.assertEqual(response.status_code, 200)

    def test_data_json_valid(self):
        response = self.client.get('/data.json')
        try:
            response.json()
        except Exception as e:
            pytest.fail("Data.json is not valid json: {0}".format(e))

    def test_code_json_renders(self):
        response = self.client.get('/code.json')
        self.assertEqual(response.status_code, 200)

    def test_code_json_valid(self):
        response = self.client.get('/code.json')
        try:
            response.json()
        except Exception as e:
            pytest.fail("Data.json is not valid json: {0}".format(e))
