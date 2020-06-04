from django import template
from data import constants

from django.conf import settings
from data import constants  # noqa F401
from data import utils

register = template.Library()


@register.inclusion_tag('partials/elections-lookup.html')
def elections_lookup(request):

    cycle = constants.DEFAULT_ELECTION_YEAR
    cycles = utils.get_cycles(cycle + 4)
    FEATURES = settings.FEATURES
    states = constants.states

    return {'parent': 'data', 'cycles': cycles, 'cycle': cycle, 'states': states, 'FEATURES': FEATURES}
