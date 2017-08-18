from django_jinja import library

import jinja2

import re
import json
import locale
import datetime

from dateutil.parser import parse as parse_date

from data import constants


@library.filter
def currency(num, grouping=True):
    # set locale for currency filter
    locale.setlocale(locale.LC_ALL, '')

    if isinstance(num, (int, float)):
        return locale.currency(num, grouping=grouping)
    return None


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
def date_full(value, fmt='%B %d, %Y'):
    if value is None:
        return None
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
            district_url = '/' + str(candidate['state']) + '/' + nullify(candidate['district'], '00')
        elif candidate['office'] == 'S':
            district_url = '/' + str(candidate['state'])
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
    if type(year) == int:
        return "{}–{}".format(year - 1, year)
    return None


@library.filter
def fmt_state_full(value):
    return constants.states[value.upper()]


@library.filter
def strip_zero_pad(number):
    return number.strip("0")


def date_filter(value, fmt='%m/%d/%Y'):
    if value is None:
        return None
    return ensure_date(value).strftime(fmt)


@library.filter
def ao_document_date(value):
    date = date_filter(value)
    return 'Not dated' if date == '01/01/1900' else date


# @app.template_filter('filesize')
# def filesize_filter(value):
#     units = ['B', 'KB', 'MB', 'GB']
#     unit = 0
#     while value > 1024 and unit < len(units):
#         value = value / 1024
#         unit += 1

#     return '%d %s' % (value, units[unit])

# def _unique(values):
#     ret = []
#     for value in values:
#         if value not in ret:
#             ret.append(value)
#     return ret


# @app.template_filter()
# def fmt_cycle_min_max(cycles):
#     if len(cycles) > 1:
#         return '{}–{}'.format(min(cycles), max(cycles))
#     return cycles[0]

# @app.template_filter()
# def get_max(list):
#     return max(list)

# @app.template_filter()
# def get_min(list):
#     return min(list)


