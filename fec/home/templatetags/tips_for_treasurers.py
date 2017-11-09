import re

from django import template
from django.conf import settings
from home.models import TipsForTreasurersPage

register = template.Library()


@register.inclusion_tag('partials/tips-for-treasurers.html')
def tips_for_treasurers_feed():
    # get one of each update type (not featured)

    tips_for_treasurers = TipsForTreasurersPage.objects.live().order_by('-date')[:4]

    return {
        'tips_for_treasurers': tips_for_treasurers
    }
    