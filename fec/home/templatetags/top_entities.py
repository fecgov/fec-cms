from django import template
from data import constants

import datetime
from django.conf import settings
from data import constants
from data import utils

register = template.Library()


@register.inclusion_tag('partials/raising-spending.html')
def raising_spending(request):
    office = request.GET.get('office', 'P')

    election_year = int(request.GET.get('election_year', constants.DEFAULT_ELECTION_YEAR))

    max_election_year = utils.current_cycle() + 4
    election_years = utils.get_cycles(max_election_year)

    FEATURES = settings.FEATURES

    return {
    #'parent': 'data',
    'API_KEY':settings.FEC_API_KEY_PUBLIC,
    'BASE_URL': settings.CANONICAL_BASE,
    'BASE_PATH': '/data',
    'FEC_APP_URL': settings.FEC_APP_URL,
    'API_LOCATION':settings.FEC_API_URL,
    'API_VERSION' :settings.FEC_API_VERSION,
    'CANONICAL_BASE': settings.CANONICAL_BASE,
    'name_field':'name',
    'id_field:' :'candidate_id',
    'candidate' :'candidate_id',
    'action': 'raised',
    'title': 'Raising: by the numbers',
    'election_years': election_years,
    'election_year': election_year,
    'office': office,
    'FEATURES':FEATURES
    }
