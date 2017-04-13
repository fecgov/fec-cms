import os

from .base import *  # noqa
from .env import env

SECRET_KEY = env.get_credential('DJANGO_SECRET_KEY')

DEBUG = False
TEMPLATE_DEBUG = False

# TODO(jmcarp) Update after configuring DNS
ALLOWED_HOSTS = ['*']

COMPRESS_ENABLED = True
COMPRESS_OFFLINE = True

try:
    from .local import *  # noqa
except ImportError:
    pass
