import re

from django import template
from django.conf import settings
from operator import attrgetter
from itertools import chain
from datetime import date
from home.models import DigestPage
from home.models import RecordPage
from home.models import PressReleasePage

register = template.Library()

@register.inclusion_tag('partials/press-feed.html')
def press_releases():
    press_releases = PressReleasePage.objects.live().order_by('-date')[:3]
    return {'updates': press_releases}

@register.inclusion_tag('partials/press-feed.html')
def weekly_digests():
    digests = DigestPage.objects.live().order_by('-date')[:3]
    return {'updates': digests}

@register.inclusion_tag('partials/home-page-updates.html')
def home_page_updates():
    press_releases = PressReleasePage.objects.filter(homepage_hide=False).order_by('-date')[:4]
    if settings.FEATURES['record']:
        records = RecordPage.objects.filter(homepage_hide=False).order_by('-date')[:4]
    else:
        records = []

    # combine press release and records queryset
    updates = chain(press_releases, records)

    updates_unpin_expired = []
    # remove homepage pin if expiration date has passed
    for update in updates:
        if update.homepage_pin_expiration:
            if update.homepage_pin_expiration < date.today():
                update.homepage_pin = False
                update.homepage_pin_expiration = None
        updates_unpin_expired.append(update)

    updates_sorted_by_date = sorted(updates_unpin_expired, key=lambda x: x.date, reverse=True)
    updates_sorted_by_homepage_pin = sorted(updates_sorted_by_date, key=lambda x: x.homepage_pin, reverse=True)

    return {'updates': updates_sorted_by_homepage_pin[:4]}
