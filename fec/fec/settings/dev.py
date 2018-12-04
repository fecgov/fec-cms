from .base import *  # noqa

# These settings are for local development only.

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
for t in TEMPLATES:
    t.setdefault('OPTIONS', {})
    t['OPTIONS']['debug'] = True

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


try:
    from .local import *  # noqa
except ImportError:
    pass
