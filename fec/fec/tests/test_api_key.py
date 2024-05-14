import unittest
from unittest import mock
import fec.context


class TestApiKeyFunction(unittest.TestCase):

    def setUp(self):
        self.request = mock.MagicMock()
        self.request.META = {}

    @mock.patch('fec.context.settings')
    def test_default_public_key(self, mock_settings):
        # Set up mock settings
        mock_settings.FEC_API_KEY_PUBLIC = 'default_public_key'

        # Call the function with an empty request
        result = fec.context.api_key(self.request)

        # Assert that the default public key is returned
        self.assertEqual(result['API_KEY_PUBLIC'],
                         mock_settings.FEC_API_KEY_PUBLIC)

    @mock.patch('fec.context.settings')
    def test_internal_ip_key(self, mock_settings):
        # Set up mock settings
        mock_settings.FEC_API_KEY_PUBLIC = 'default_public_key'
        mock_settings.FEC_INTERNAL_API_KEY_PUBLIC = 'internal_ip_key'
        mock_settings.FEC_INTERNAL_IP = 'internal_ip'

        # Set up X-Forwarded-For header with internal IP
        self.request.META['HTTP_X_FORWARDED_FOR'] = 'internal_ip'

        # Call the function with the modified request
        result = fec.context.api_key(self.request)

        # Assert that the internal IP key is returned
        self.assertEqual(result['API_KEY_PUBLIC'],
                         mock_settings.FEC_INTERNAL_API_KEY_PUBLIC)

    @mock.patch('fec.context.settings')
    def test_external_ip_key(self, mock_settings):
        # Set up mock settings
        mock_settings.FEC_API_KEY_PUBLIC = 'default_public_key'
        mock_settings.FEC_INTERNAL_API_KEY_PUBLIC = 'internal_ip_key'
        mock_settings.FEC_INTERNAL_IP = 'internal_ip'

        # Set up X-Forwarded-For header with external IP
        self.request.META['HTTP_X_FORWARDED_FOR'] = 'external_ip'

        # Call the function with the modified request
        result = fec.context.api_key(self.request)

        # Assert that the default public key is returned
        self.assertEqual(result['API_KEY_PUBLIC'],
                         mock_settings.FEC_API_KEY_PUBLIC)


if __name__ == '__main__':
    unittest.main()
