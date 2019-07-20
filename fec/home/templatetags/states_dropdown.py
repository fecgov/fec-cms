from django import template
from data import constants
from data import utils

from django.conf import settings


register = template.Library()

@register.inclusion_tag('partials/states_dropdown.html')
def states_dropdown(request):
    states = constants.states

    return {'states':states}
