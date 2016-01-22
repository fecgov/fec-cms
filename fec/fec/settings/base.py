"""
Django settings for fec project.

Generated by 'django-admin startproject' using Django 1.8.3.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.8/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os

from django.utils.crypto import get_random_string

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_DIR = os.path.dirname(PROJECT_DIR)
REPO_DIR = os.path.dirname(BASE_DIR)


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/


# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'taggit',
    'compressor',
    'modelcluster',

    'wagtail.wagtailcore',
    'wagtail.wagtailadmin',
    'wagtail.wagtailsearch',
    'wagtail.wagtailimages',
    'wagtail.wagtaildocs',
    'wagtail.wagtailsnippets',
    'wagtail.wagtailusers',
    'wagtail.wagtailsites',
    'wagtail.wagtailembeds',
    'wagtail.wagtailredirects',
    'wagtail.wagtailforms',

    'wagtailmodeladmin',

    'fec',
    'search',
    'home',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',

    'wagtail.wagtailcore.middleware.SiteMiddleware',
    'wagtail.wagtailredirects.middleware.RedirectMiddleware',

    'wagtailmodeladmin.middleware.ModelAdminMiddleware',
)

ROOT_URLCONF = 'fec.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(PROJECT_DIR, 'templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'fec.context.show_settings',
            ],
        },
    },
]

WSGI_APPLICATION = 'fec.wsgi.application'

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', get_random_string(50))


# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}


# Internationalization
# https://docs.djangoproject.com/en/1.8/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

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
    os.path.join(REPO_DIR, 'node_modules', 'fec-style'),
    os.path.join(REPO_DIR, 'node_modules'),
    os.path.join(PROJECT_DIR, 'static'),
)

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

FEC_APP_URL = os.getenv('FEC_APP_URL')
FEC_WEB_STYLE_URL = os.getenv('FEC_WEB_STYLE_URL')
FEC_CMS_ROBOTS = os.getenv('FEC_CMS_ROBOTS')
ENVIRONMENTS = {
    'dev': 'DEVELOPMENT',
    'stage': 'STAGING',
    'prod': 'PRODUCTION',
}
FEC_CMS_ENVIRONMENT = ENVIRONMENTS.get(os.getenv('FEC_CMS_ENVIRONMENT'), 'DEVELOPMENT')
CONTACT_EMAIL = 'betafeedback@fec.gov';

if os.getenv('SENTRY_DSN'):
    INSTALLED_APPS += ('raven.contrib.django.raven_compat', )
    RAVEN_CONFIG = {
        'dsn': os.getenv('SENTRY_DSN'),
    }
