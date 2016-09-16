import re

from django import template
from operator import attrgetter
from itertools import chain
from home.models import DigestPage
from home.models import RecordPage
from home.models import PressReleasePage

register = template.Library()

@register.inclusion_tag('partials/press-feed.html')
def press_updates():
    press_releases = PressReleasePage.objects.all().order_by('-date')[:5]
    digests = DigestPage.objects.all().order_by('-date')[:2]
    updates = sorted(
      chain(press_releases, digests),
      key=attrgetter('date'),
      reverse=True
    )

    return {'updates': updates}
