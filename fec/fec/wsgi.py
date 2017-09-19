"""
WSGI config for fec project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/howto/deployment/wsgi/
"""

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fec.settings.production')

from django.core.wsgi import get_wsgi_application
from whitenoise.django import DjangoWhiteNoise

from fec.settings.env import env


def initialize_newrelic():
    license_key = env.get_credential('NEW_RELIC_LICENSE_KEY')

    if license_key:
        import newrelic.agent
        settings = newrelic.agent.global_settings()
        settings.license_key = license_key
        newrelic.agent.initialize()

initialize_newrelic()

application = get_wsgi_application()
application = DjangoWhiteNoise(application)
