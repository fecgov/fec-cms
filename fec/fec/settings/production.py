from .base import *  # noqa
from .env import env

SECRET_KEY = env.get_credential('DJANGO_SECRET_KEY')

# These settings are used for all public environments:
# dev, stage, feature, and production

DEBUG = False
TEMPLATE_DEBUG = False

SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True

# TODO(jmcarp) Update after configuring DNS
ALLOWED_HOSTS = ['*']

try:
    from .local import *  # noqa
except ImportError:
    pass
