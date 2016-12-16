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

@register.inclusion_tag('partials/home-page-updates.html')
def home_page_updates():
    press_releases = PressReleasePage.objects.filter(homepage_hide=False).order_by('-date')[:4]
    records = RecordPage.objects.filter(homepage_hide=False).order_by('-date')[:4]

    updates = chain(press_releases, records)

    # TODO: homepage_pin_expiration date check on updates list

    updates_sorted_by_date = sorted(updates, key=lambda x: x.date, reverse=True)
    updates_sorted_by_homepage_pin = sorted(updates_sorted_by_date, key=lambda x: x.homepage_pin, reverse=True)

    return {'updates': updates_sorted_by_homepage_pin[:4]}
