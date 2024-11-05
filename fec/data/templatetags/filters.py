import datetime
import json
import locale
import re

from dateutil.parser import parse as parse_date

from django.conf import settings
from django_jinja import library
from django.utils.html import format_html

from data import constants


@library.filter
def currency(num, grouping=True):
    # set locale for currency filter
    locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')

    if isinstance(num, (int, float)):
        return locale.currency(num, grouping=grouping)
    return None


@library.filter
def currency_rounded(num, grouping=True):
    # set locale for currency filter
    locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
    to_return = None
    if isinstance(num, (int, float)):
        to_return = locale.currency(round(num), grouping=grouping)
        return to_return[:-3]
    return to_return


def ensure_date(value):
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value
    return parse_date(value)


@library.filter
def date(value, fmt='%m/%d/%Y'):
    if value is None:
        return None
    return ensure_date(value).strftime(fmt)


@library.filter
def date_full(value, fmt='%B %d, %Y', time_tag=False):
    '''Format a date in the format of 'January 01, 2000'
    :param value: date string to be formatted
    :param fmt: requested format for the date. defaults to Month, DD, YYYY
    :param time_tag: whether to wrap the returned date string in a <time> element
    :returns: formatted string, optionally inside a <time>
    '''
    if value is None:
        return None
    if time_tag:
        return format_html(ensure_date(value).strftime('<time datetime="%Y-%m-%d">' + fmt + '</time>'))

    return ensure_date(value).strftime(fmt)


@library.filter
def to_json(value):
    return json.dumps(value)


@library.global_function
def cycle_start(value):
    return datetime.datetime(value - 1, 1, 1)


@library.global_function
def cycle_end(value):
    return datetime.datetime(value, 12, 31)


def nullify(value, *nulls):
    return value if value not in nulls else None


@library.global_function
def get_election_url(candidate, cycle, district=None):
    if cycle:
        if candidate['office'] == 'H':
            if candidate.get('state') and candidate.get('district'):
                district_url = '/' + str(candidate['state']) + '/' + candidate['district']
            else:
                return None
        elif candidate['office'] == 'S':
            if candidate.get('state'):
                district_url = '/' + str(candidate['state'])
            else:
                return None
        else:
            district_url = ''

        return '/data/elections/' + candidate['office_full'].lower() + district_url + '/' + str(cycle)
    else:
        return None


@library.global_function
def clean_id(value):
    return re.compile(r'[^\w-]').sub('', value)


@library.filter
def fmt_year_range(year):
    if type(year) is int:
        return "{}–{}".format(year - 1, year)
    return None


@library.filter
def fmt_state_full(value):
    return constants.states[value.upper()]


@library.filter
def strip_zero_pad(number):
    '''
    Removes leading 0's for display purposes
    Commonly used for congressional districts
    '''
    if number:
        return number.lstrip("0")
    return "None"


def date_filter(value, fmt='%m/%d/%Y'):
    if value is None:
        return None
    return ensure_date(value).strftime(fmt)


@library.filter
def ao_document_date(value):
    date = date_filter(value)
    return 'Not dated' if date == '01/01/1900' else date


@library.filter
def get_max(list):
    return max(list)


@library.filter
def get_min(list):
    return min(list)


# for mur pages
@library.filter
def filesize(value):
    units = ['B', 'KB', 'MB', 'GB']
    unit = 0
    while value > 1024 and unit < len(units):
        value = value / 1024
        unit += 1

    return '%d %s' % (value, units[unit])


@library.global_function
def path_for_css(key):
    """Looks up the hashed asset key in rev-manifest-css.json
    If the key doesn't exist there, then just return the key to the static file
    without a hash"""

    assets = json.load(open(settings.DIST_DIR + '/fec/static/css/rev-manifest-css.json'))

    if key in assets:
        return '/static/css/' + assets[key]
    else:
        return key


@library.global_function
def path_for_js(path):
    """Looks up the hashed asset path in rev-manifest.json
    If the path doesn't exist there, then just return the path to the static file
    without a hash"""
    key = '/static/js/{}'.format(path)
    assets = json.load(open(settings.DIST_DIR + '/fec/static/js/rev-manifest-js.json'))
    return assets[key] if key in assets else key


@library.global_function
def tags_for_js_chunks(path, attribs_for_final_tag):
    """Looks up the hashed assets paths in rev-manifest-js.json and returns script tags for them.
    If the asset is a list, returns several script tags.
    If the asset is a string, returns the single script tag.
    If the paths don't exist there, then just return the path to the static file without a hash.
    While adding the last tag (the one that isn't dependencies), add the tag attributes"""
    key = '/static/js/{}'.format(path)
    assets = json.load(open(settings.DIST_DIR + '/fec/static/js/rev-manifest-js.json'))
    if key in assets:
        file_paths = assets[key]
        to_return = ''
        if isinstance(file_paths, list):
            for file_path in file_paths:
                if file_path == file_paths[-1]:
                    to_return = to_return + '<script src="{}" {}></script>'.format(file_path, attribs_for_final_tag)
                else:
                    to_return = to_return + '<script src="{}"></script>'.format(file_path)
        else:
            to_return = '<script src="{}" {}></script>'.format(file_paths, attribs_for_final_tag)
        return format_html(to_return)
    else:
        return key


@library.global_function
def get_social_image_path(identifier):
    # """
    # Returns a path to a social image for the given content section
    # Called by meta-tags.jinja
    # TODO: combine with fec/home/templatetags/filters.py ?
    # """
    imageFilename = identifier
    if identifier == 'advisory-opinions':
        imageFilename = 'fec-pen'
    elif identifier in ['commission-meetings', 'meeting-page']:
        imageFilename = 'fec-microphones'
    elif identifier == 'press-release':
        imageFilename = 'fec-microphone'
    elif identifier == 'weekly-digest':
        imageFilename = 'fec-seal'
    elif identifier == 'data':
        imageFilename = 'fec-data'
    elif identifier in ['legal', 'help']:
        imageFilename = 'fec-' + identifier
    else:
        imageFilename = 'fec-logo'
    return 'https://www.fec.gov/static/img/social/{}.png'.format(imageFilename)
