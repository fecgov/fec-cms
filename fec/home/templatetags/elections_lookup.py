from django import template
from data import constants

import datetime
from django.conf import settings
from data import api_caller
from data import constants
from data import utils

register = template.Library()

@register.inclusion_tag("home/election-lookup-home.html")
def elections_lookup(request):

    cycle = constants.DEFAULT_ELECTION_YEAR
    cycles = utils.get_cycles(cycle + 4)

    return {'parent': 'data', 'cycles': cycles, 'cycle': cycle, 'range': range(100)}

