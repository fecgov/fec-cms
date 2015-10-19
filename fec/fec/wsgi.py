"""
WSGI config for fec project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/howto/deployment/wsgi/
"""

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fec.settings.production')

import hashlib

import newrelic.agent
from django.conf import settings
from django.core.wsgi import get_wsgi_application
from whitenoise.django import DjangoWhiteNoise
from hmac_authentication import hmacauth

from fec.settings.credentials import credentials

new_relic_settings = newrelic.agent.global_settings()
new_relic_settings.license_key = (
    os.getenv('NEW_RELIC_LICENSE_KEY') or
    credentials.get('NEW_RELIC_LICENSE_KEY')
)
newrelic.agent.initialize()

application = get_wsgi_application()

application = DjangoWhiteNoise(application)

if not settings.DEBUG:
    auth = hmacauth.HmacAuth(
        digest=hashlib.sha1,
        secret_key=credentials.get('HMAC_SECRET'),
        signature_header='X-Signature',
        headers=credentials.get('HMAC_HEADERS', '').split(','),
    )
    application = hmacauth.HmacMiddleware(application, auth)
