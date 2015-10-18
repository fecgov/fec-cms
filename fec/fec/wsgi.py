"""
WSGI config for fec project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/howto/deployment/wsgi/
"""

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fec.settings.production')

import newrelic.agent
from django.core.wsgi import get_wsgi_application
from whitenoise.django import DjangoWhiteNoise

from fec.settings.credentials import credentials

settings = newrelic.agent.global_settings()
settings.license_key = (
    os.getenv('NEW_RELIC_LICENSE_KEY') or
    credentials.get('NEW_RELIC_LICENSE_KEY')
)
newrelic.agent.initialize()

application = get_wsgi_application()
application = DjangoWhiteNoise(application)
