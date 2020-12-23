from .base import *  # noqa F401, F403
from .env import env

SECRET_KEY = env.get_credential('DJANGO_SECRET_KEY')

# These settings are used for all public environments:
# dev, stage, feature, and production

DEBUG = True
TEMPLATE_DEBUG = False

SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True

ALLOWED_HOSTS = [
    '.fec.gov',
    '.app.cloud.gov'
]

try:
    from .local import *  # noqa F401, F403
except ImportError:
    pass
