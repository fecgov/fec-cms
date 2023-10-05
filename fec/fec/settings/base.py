import os

import dj_database_url

from django.utils.crypto import get_random_string

from .env import env

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_DIR = os.path.dirname(PROJECT_DIR)
REPO_DIR = os.path.dirname(BASE_DIR)

CANONICAL_BASE = env.get_credential('CANONICAL_BASE', 'https://www.fec.gov')
WAGTAILADMIN_BASE_URL = CANONICAL_BASE

USAJOBS_WHOMAYAPPLY = env.get_credential('USAJOBS_WHOMAYAPPLY')
USAJOBS_AGENCY_CODE = env.get_credential('USAJOBS_AGENCY_CODE')
USAJOBS_API_KEY = env.get_credential('USAJOBS_API_KEY')
GOVDELIVERY_TOKEN = env.get_credential('GOVDELIVERY_TOKEN')
FEC_APP_URL = env.get_credential('FEC_APP_URL')
FEC_API_URL = env.get_credential('FEC_API_URL', 'http://localhost:5000')
FEC_API_KEY_PRIVATE = env.get_credential('FEC_WEB_API_KEY_PRIVATE')
FEC_API_VERSION = env.get_credential('FEC_API_VERSION', 'v1')
FEC_API_KEY_PUBLIC = env.get_credential('FEC_WEB_API_KEY_PUBLIC', '')
FEC_API_KEY_PUBLIC_CALENDAR = env.get_credential('FEC_WEB_API_KEY_PUBLIC_CALENDAR', FEC_API_KEY_PUBLIC)
FEC_DOWNLOAD_API_KEY = env.get_credential('FEC_DOWNLOAD_API_KEY', '')

FEC_RECAPTCHA_SECRET_KEY = env.get_credential('FEC_RECAPTCHA_SECRET_KEY')
FEC_GITHUB_TOKEN = env.get_credential('FEC_GITHUB_TOKEN')

# Config for the ServiceNow API for contacting RAD
FEC_SERVICE_NOW_API = env.get_credential('FEC_SERVICE_NOW_API')
FEC_SERVICE_NOW_USERNAME = env.get_credential('FEC_SERVICE_NOW_USERNAME')
FEC_SERVICE_NOW_PASSWORD = env.get_credential('FEC_SERVICE_NOW_PASSWORD')
# Search.gov website keys
SEARCHGOV_BASE_API_URL = env.get_credential('SEARCHGOV_BASE_API_URL', '')
SEARCHGOV_API_ACCESS_KEY = env.get_credential('SEARCHGOV_API_ACCESS_KEY')
SEARCHGOV_POLICY_GUIDANCE_KEY = env.get_credential('SEARCHGOV_POLICY_GUIDANCE_KEY')

WEBMANAGER_EMAIL = "webmanager@fec.gov"

ENVIRONMENTS = {
    'local': 'LOCAL',
    'dev': 'DEVELOPMENT',
    'stage': 'STAGING',
    'prod': 'PRODUCTION',
    'feature': 'FEATURE',
}
FEC_CMS_ENVIRONMENT = ENVIRONMENTS.get(env.get_credential('FEC_CMS_ENVIRONMENT'), ENVIRONMENTS['local'])

WAGTAILSEARCH_BACKENDS = {
    'default': {
        'BACKEND': 'wagtail.search.backends.database',
        'SEARCH_CONFIG': 'english',
    }
}

FEATURES = {
    'ierawfilters': bool(env.get_credential('FEC_FEATURE_IE_RAW_FILTERS', '')),

    # Functionality
    'website_status': bool(env.get_credential('FEC_FEATURE_WEBSITE_STATUS', '')),

    # Feature flags (hiding or displaying components)
    'adrs': bool(env.get_credential('FEC_FEATURE_ADRS', '')),
    'afs': bool(env.get_credential('FEC_FEATURE_AFS', '')),  # Admin fines search
    'aggregatetotals': bool(env.get_credential('FEC_FEATURE_AGGR_TOTS', '')),
    'barcharts': bool(env.get_credential('FEC_FEATURE_HOME_BARCHARTS', '')),
    'contributionsbystate': bool(env.get_credential('FEC_FEATURE_CONTRIBUTIONS_BY_STATE', '')),
    'debts': bool(env.get_credential('FEC_FEATURE_DEBTS', '')),
    'h4_allocated_disbursements': bool(env.get_credential('FEC_FEATURE_H4_ALLOCATED_DISBURSEMENTS', True)),
    'house_senate_overview': bool(env.get_credential('FEC_FEATURE_HOUSE_SENATE_OVERVIEW', '')),
    'house_senate_overview_methodology': bool(env.get_credential('FEC_FEATURE_HOUSE_SENATE_OVERVIEW_METHODOLOGY', '')),
    'house_senate_overview_summary': bool(env.get_credential('FEC_FEATURE_HOUSE_SENATE_OVERVIEW_SUMMARY', '')),
    'house_senate_overview_totals': bool(env.get_credential('FEC_FEATURE_HOUSE_SENATE_OVERVIEW_TOTALS', '')),
    'map': bool(env.get_credential('FEC_FEATURE_HOME_MAP', '')),
    'pac_party': bool(env.get_credential('FEC_FEATURE_PAC_PARTY', '')),
    'pac_snapshot': bool(env.get_credential('FEC_FEATURE_PAC_SNAPSHOT', '')),
    'presidential_map': bool(env.get_credential('FEC_FEATURE_PRESIDENTIAL_MAP', '')),
}

# Set feature flags to True for Feature
if FEC_CMS_ENVIRONMENT == ENVIRONMENTS['feature']:
    FEATURES['debts'] = True

# Set feature flags to True for local
if FEC_CMS_ENVIRONMENT == ENVIRONMENTS['local']:
    FEATURES['adrs'] = True
    FEATURES['afs'] = True
    FEATURES['aggregatetotals'] = True
    FEATURES['barcharts'] = True
    FEATURES['contributionsbystate'] = True
    FEATURES['debts'] = True
    FEATURES['map'] = True
    FEATURES['pac_party'] = True
    FEATURES['pac_snapshot'] = True
    FEATURES['presidential_map'] = True
    FEATURES['h4_allocated_disbursements'] = True
    FEATURES['house_senate_overview'] = True
    FEATURES['house_senate_overview_methodology'] = True
    FEATURES['house_senate_overview_summary'] = True
    FEATURES['house_senate_overview_totals'] = True

# Application definition
INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sitemaps',

    'django_jinja',

    'taggit',
    'compressor',
    'modelcluster',
    'storages',

    'wagtail',
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
    'wagtail.locales',

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

MIDDLEWARE = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # custom response headers
    'fec.middleware.AddSecureHeaders',
    'uaa_client.middleware.UaaRefreshMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'wagtail.contrib.redirects.middleware.RedirectMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    # 'wagtail.contrib.legacy.sitemiddleware.SiteMiddleware',
    # :up: SiteMiddleware :up: was removed for Wagtail 2.11. Safe to lose it altogether?
)

CSRF_TRUSTED_ORIGINS = ["fec.gov", "app.cloud.gov"]
if FEC_CMS_ENVIRONMENT == ENVIRONMENTS['local']:
    CSRF_TRUSTED_ORIGINS.extend(["127.0.0.1:5000"])

ROOT_URLCONF = 'fec.urls'

from data import constants # noqa E402


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
                'FEC_API_KEY_PRIVATE': FEC_API_KEY_PRIVATE,
                'FEC_DOWNLOAD_API_KEY': FEC_DOWNLOAD_API_KEY,
                'FEC_API_KEY_PUBLIC': FEC_API_KEY_PUBLIC,
                'FEC_API_URL': FEC_API_URL,
                'WEBMANAGER_EMAIL': WEBMANAGER_EMAIL,
                'FEC_CMS_ENVIRONMENT': FEC_CMS_ENVIRONMENT,
                'FEATURES': FEATURES,
            },
            'context_processors': [
                'django.template.context_processors.request'
            ]
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
LANGUAGES = (
    ('en', 'English'),
)
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
WAGTAILEMBEDS_RESPONSIVE_HTML = True

# Custom settings
from fec import constants # noqa E402

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

if FEC_CMS_ENVIRONMENT != ENVIRONMENTS['local']:
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
# fake uaa server deploys locally on port 8080.  Will be needed to login for local use
# TODO: These will have to have an explicit reference until we can figure out how
# to silence Django warnings about the url being http (it expects https).
# UAA_AUTH_URL = env.get_credential('CMS_LOGIN_AUTH_URL', 'http://localhost:8080/oauth/authorize')
# UAA_TOKEN_URL = env.get_credential('CMS_LOGIN_TOKEN_URL','http://localhost:8080/oauth/token')
UAA_AUTH_URL = 'https://login.fr.cloud.gov/oauth/authorize'
UAA_TOKEN_URL = 'https://login.fr.cloud.gov/oauth/token'
WAGTAIL_FRONTEND_LOGIN_URL = 'uaa_client:login'

AUTHENTICATION_BACKENDS = \
    ['django.contrib.auth.backends.ModelBackend',
     'uaa_client.authentication.UaaBackend']

DEFAULT_AUTHENTICATION_CLASSES = ['rest_framework_jwt.authentication.JSONWebTokenAuthentication']

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

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'
