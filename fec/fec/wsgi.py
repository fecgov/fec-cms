"""
WSGI config for fec project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/howto/deployment/wsgi/
"""

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fec.settings.production')

from django.core.wsgi import get_wsgi_application # noqa E402
from whitenoise.django import DjangoWhiteNoise # noqa E402

from fec.settings.env import env # noqa E402

application = get_wsgi_application()
application = DjangoWhiteNoise(application)
