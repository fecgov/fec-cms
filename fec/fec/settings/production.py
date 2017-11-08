import os

from .base import *  # noqa
from .env import env

SECRET_KEY = env.get_credential('DJANGO_SECRET_KEY')

DEBUG = False
TEMPLATE_DEBUG = False

# TODO(jmcarp) Update after configuring DNS
ALLOWED_HOSTS = ['*']

try:
    from .local import *  # noqa
except ImportError:
    pass
