import dj_database_url

from .base import *  # noqa


DATABASES = {'default': dj_database_url.config()}


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
