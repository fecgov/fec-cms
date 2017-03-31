import re

from django import template
from django.conf import settings
from operator import attrgetter
from itertools import chain
from datetime import date
from home.models import DigestPage
from home.models import RecordPage
from home.models import PressReleasePage
from home.models import TipsForTreasurersPage
from home.models import ServicesLandingPage

register = template.Library()

@register.inclusion_tag('partials/home-page-updates.html')
def home_page_updates():
    press_releases = PressReleasePage.objects.live().filter(homepage_hide=False).order_by('-date')[:4]
    if settings.FEATURES['record']:
        records = RecordPage.objects.live().filter(homepage_hide=False).order_by('-date')[:4]
    else:
        records = []
    if settings.FEATURES['tips']:
        tips = TipsForTreasurersPage.objects.live().filter().order_by('-date')[:4]
    else:
        tips = []

    # combine press release, records and tips queryset
    updates = chain(press_releases, records, tips)

    # remove homepage pin if expiration date has passed
    updates_unpin_expired = []
    for update in updates:
        if hasattr(update, 'homepage_pin'):
            if update.homepage_pin_expiration:
                if update.homepage_pin_expiration < date.today():
                    update.homepage_pin = False
                    update.homepage_pin_expiration = None
            # remove the pin if it's before the date when it should be pinned
            if update.homepage_pin_start:
                if update.homepage_pin_start > date.today():
                    update.homepage_pin = False
        else:
            # If it doesn't have homepage_pin property, just set it to false
            # Necessary for sorting
            update.homepage_pin = False
        updates_unpin_expired.append(update)

    updates_sorted_by_date = sorted(updates_unpin_expired, key=lambda x: x.date, reverse=True)
    updates_sorted_by_homepage_pin = sorted(updates_sorted_by_date, key=lambda x: x.homepage_pin, reverse=True)

    return {'updates': updates_sorted_by_homepage_pin[:4]}

@register.inclusion_tag('partials/candidate_committee_services.html')
def candidate_committee_services():
    service_page = ServicesLandingPage.objects.first()

    return {'service_page': service_page}
