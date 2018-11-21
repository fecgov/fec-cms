import os

import dj_database_url

from django.utils.crypto import get_random_string

from .env import env

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_DIR = os.path.dirname(PROJECT_DIR)
REPO_DIR = os.path.dirname(BASE_DIR)

CANONICAL_BASE = env.get_credential('CANONICAL_BASE', 'https://www.fec.gov')

USAJOBS_WHOMAYAPPLY = env.get_credential('USAJOBS_WHOMAYAPPLY')
USAJOBS_AGENCY_CODE = env.get_credential('USAJOBS_AGENCY_CODE')
USAJOBS_API_KEY = env.get_credential('USAJOBS_API_KEY')
GOVDELIVERY_TOKEN = env.get_credential('GOVDELIVERY_TOKEN')
FEC_APP_URL = env.get_credential('FEC_APP_URL')
FEC_API_URL = env.get_credential('FEC_API_URL', 'http://localhost:5000')
FEC_API_KEY = env.get_credential('FEC_WEB_API_KEY')
FEC_API_VERSION = env.get_credential('FEC_API_VERSION', 'v1')
FEC_API_KEY_PUBLIC = env.get_credential('FEC_WEB_API_KEY_PUBLIC', '')

# Disables crawling for all of our environments except for production
FEC_CMS_ROBOTS = True

FEC_RECAPTCHA_SECRET_KEY = env.get_credential('FEC_RECAPTCHA_SECRET_KEY')
FEC_GITHUB_TOKEN = env.get_credential('FEC_GITHUB_TOKEN')

# Config for the ServiceNow API for contacting RAD
FEC_SERVICE_NOW_API = env.get_credential('FEC_SERVICE_NOW_API')
FEC_SERVICE_NOW_USERNAME = env.get_credential('FEC_SERVICE_NOW_USERNAME')
FEC_SERVICE_NOW_PASSWORD = env.get_credential('FEC_SERVICE_NOW_PASSWORD')
FEC_DIGITALGOV_KEY = env.get_credential('FEC_DIGITALGOV_KEY')
FEC_DIGITALGOV_DRAWER_KEY_MAIN = env.get_credential('DIGITALGOV_DRAWER_KEY_MAIN', '')
FEC_DIGITALGOV_DRAWER_KEY_TRANSITION = env.get_credential('DIGITALGOV_DRAWER_KEY_TRANSITION', '')
DIGITALGOV_BASE_API_URL = 'https://i14y.usa.gov/api/v1'
DIGITALGOV_DRAWER_HANDLE = 'main'

FEC_TRANSITION_URL = env.get_credential('FEC_TRANSITION_URL', 'https://transition.fec.gov')
FEC_CLASSIC_URL = env.get_credential('FEC_CLASSIC_URL', 'http://classic.fec.gov')

FEATURES = {
    'record': bool(env.get_credential('FEC_FEATURE_RECORD', '')),
    'about': bool(env.get_credential('FEC_FEATURE_ABOUT', '')),
    'agendas': bool(env.get_credential('FEC_FEATURE_AGENDAS', '')),
    'tips': bool(env.get_credential('FEC_FEATURE_TIPS', '')),
    'radform': bool(env.get_credential('FEC_FEATURE_RADFORM', '')),
    'linecharts': bool(env.get_credential('FEC_FEATURE_LINECHARTS', '')),
    'adrs': bool(env.get_credential('FEC_FEATURE_ADRS', '')),
}

ENVIRONMENTS = {
    'local': 'LOCAL',
    'dev': 'DEVELOPMENT',
    'stage': 'STAGING',
    'prod': 'PRODUCTION',
    'feature': 'FEATURE',
}
FEC_CMS_ENVIRONMENT = ENVIRONMENTS.get(env.get_credential('FEC_CMS_ENVIRONMENT'), 'LOCAL')
CONTACT_EMAIL = 'webmanager@fec.gov'
WEBMANAGER_EMAIL = "webmanager@fec.gov"

# Application definition
INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'django_jinja',

    'taggit',
    'compressor',
    'modelcluster',
    'storages',

    'wagtail.core',
    'wagtail.admin',
    'wagtail.search',
    'wagtail.images',
    'wagtail.documents',
    'wagtail.snippets',
    'wagtail.users',
    'wagtail.sites',
    'wagtail.embeds',
    'wagtail.contrib.redirects',
    'wagtail.contrib.forms',

    'wagtail.contrib.modeladmin',
    'wagtail.contrib.search_promotions',
    'wagtail.contrib.table_block',
    'wagtail.contrib.styleguide',

    'fec',
    'search',
    'home',
    'data',
    'legal',
    'uaa_client',
    'extend_admin',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'uaa_client.middleware.UaaRefreshMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',

    'wagtail.core.middleware.SiteMiddleware',
    'wagtail.contrib.redirects.middleware.RedirectMiddleware',

    # logs
    'audit_log.middleware.UserLoggingMiddleware',
)

ROOT_URLCONF = 'fec.urls'

from data import constants


TEMPLATES = [
    {
        'BACKEND': 'django_jinja.backend.Jinja2',
        'APP_DIRS': True,
        'OPTIONS': {
            'environment': 'data.jinja2.environment',
            'match_extension': '.jinja',
            'constants': {
                'constants': constants,
                'CANONICAL_BASE': CANONICAL_BASE,
                'FEC_API_KEY': FEC_API_KEY,
                'FEC_API_KEY_PUBLIC': FEC_API_KEY_PUBLIC,
                'FEC_API_URL': FEC_API_URL,
                'WEBMANAGER_EMAIL': WEBMANAGER_EMAIL,
                'TRANSITION_URL': FEC_TRANSITION_URL,
                'CLASSIC_URL': FEC_CLASSIC_URL,
                'FEC_CMS_ENVIRONMENT': FEC_CMS_ENVIRONMENT,
                'FEATURES': FEATURES,
            },
        }
    },
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'fec.context.show_settings',
                'fec.context.features',
            ],
        },
    },
]

WSGI_APPLICATION = 'fec.wsgi.application'

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', get_random_string(50))


# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases

DATABASES = {
    # Be sure to set the DATABASE_URL environment variable on your local
    # development machine so that the local database can be connected to.
    'default': dj_database_url.config()
}


# Internationalization
# https://docs.djangoproject.com/en/1.8/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'America/New_York'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.8/howto/static-files/

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'compressor.finders.CompressorFinder',
)

STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'dist', 'fec', 'static'),
    os.path.join(PROJECT_DIR, 'static'),
    # We will need just the assets of certain npm modules for Wagtail
    # So we are including a folder of symlinks to modules for access
    os.path.join(BASE_DIR, 'fec', 'wagtail_npm_dependencies'),
)

DIST_DIR = os.path.join(BASE_DIR, 'dist')

STATIC_ROOT = os.path.join(BASE_DIR, 'static')
STATIC_URL = '/static/'

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'

COMPRESS_PRECOMPILERS = (
    ('text/x-scss', 'fec.utils.PatchedSCSSCompiler'),
)

# Proxy settings
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


# Wagtail settings
WAGTAIL_SITE_NAME = "fec"

# Custom settings
from fec import constants

CONSTANTS = constants


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 9,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


if FEC_CMS_ENVIRONMENT != 'LOCAL':
    AWS_QUERYSTRING_AUTH = False
    AWS_ACCESS_KEY_ID = env.get_credential('access_key_id')
    AWS_SECRET_ACCESS_KEY = env.get_credential('secret_access_key')
    AWS_STORAGE_BUCKET_NAME = env.get_credential('bucket')
    AWS_S3_REGION_NAME = env.get_credential('region')
    AWS_S3_CUSTOM_DOMAIN = env.get_credential('CMS_AWS_CUSTOM_DOMAIN')
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_LOCATION = 'cms-content'

UAA_CLIENT_ID = env.get_credential('CMS_LOGIN_CLIENT_ID', 'my-client-id')
UAA_CLIENT_SECRET = env.get_credential('CMS_LOGIN_CLIENT_SECRET', 'my-client-secret')
#fake uaa server deploys locally on port 8080.  Will be needed to login for local use
#TODO: These will have to have a explicit reference until we can figure out how
#to silence django warnings about the url being http (it expects https).
#UAA_AUTH_URL = env.get_credential('CMS_LOGIN_AUTH_URL', 'http://localhost:8080/oauth/authorize')
#UAA_TOKEN_URL = env.get_credential('CMS_LOGIN_TOKEN_URL','http://localhost:8080/oauth/token')
UAA_AUTH_URL = 'https://login.fr.cloud.gov/oauth/authorize'
UAA_TOKEN_URL = 'https://login.fr.cloud.gov/oauth/token'
WAGTAIL_FRONTEND_LOGIN_URL = 'uaa_client:login'

AUTHENTICATION_BACKENDS = \
    ['django.contrib.auth.backends.ModelBackend',
     'uaa_client.authentication.UaaBackend']

DEFAULT_AUTHENTICATION_CLASSES = ['rest_framework_jwt.authentication.JSONWebTokenAuthentication',]

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'console': {
            'format': '%(levelname)s:%(name)s: %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'console',
        },
    },
    'loggers': {
        '': {
            'handlers': ['console'],
            'level': 'INFO',
            'propogate': False,
        },
    },
}
