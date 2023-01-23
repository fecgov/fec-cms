import sys
from django.test import TestCase
from django.conf import settings
from django.urls import clear_url_caches
from importlib import reload, import_module


# URLs need to be reloaded with new settings
def reload_url_conf():
    clear_url_caches()
    urlconf = settings.ROOT_URLCONF
    if urlconf in sys.modules:
        reload(sys.modules[urlconf])
    else:
        import_module(urlconf)


class TestRobots(TestCase):

    def test_robots_txt_returns_200_stage(self):

        with self.settings(FEC_CMS_ENVIRONMENT='STAGING'):
            response = self.client.get('/robots.txt')
            self.assertContains(response, "Disallow", count=None, status_code=200, msg_prefix='', html=False)
            self.assertEqual(response.status_code, 200)

    def test_robots_txt_throws_404(self):

        with self.settings(FEC_CMS_ENVIRONMENT='PRODUCTION'):
            reload_url_conf()
            response = self.client.get('/robots.txt')
            self.assertContains(response, "Sitemap", count=2, status_code=200, msg_prefix='', html=False)
            self.assertEqual(response.status_code, 200)
