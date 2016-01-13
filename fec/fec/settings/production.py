import dj_database_url

from .base import *  # noqa
from .env import env


DATABASES = {'default': dj_database_url.config()}

SECRET_KEY = env.get_credential('DJANGO_SECRET_KEY')
SECRET_KEY = 'HI'

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
