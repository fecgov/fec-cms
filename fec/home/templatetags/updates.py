import re

from django import template
from operator import attrgetter
from itertools import chain
from home.models import DigestPage
from home.models import RecordPage
from home.models import PressReleasePage

register = template.Library()

@register.inclusion_tag('partials/press-feed.html')
def press_releases():
    press_releases = PressReleasePage.objects.all().order_by('-date')[:3]
    return {'updates': press_releases}

@register.inclusion_tag('partials/press-feed.html')
def weekly_digests():
    digests = DigestPage.objects.all().order_by('-date')[:3]
    return {'updates': digests}
