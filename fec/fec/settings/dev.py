from .base import *  # noqa F403

# These settings are for local development only.

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True

for t in TEMPLATES: # noqa F405
    t.setdefault('OPTIONS', {})
    t['OPTIONS']['debug'] = True

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

try:
    from .local import *   # noqa F401, F403
except ImportError:
    pass
