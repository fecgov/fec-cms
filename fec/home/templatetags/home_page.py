import re

from django import template
from django.conf import settings
from operator import attrgetter
from itertools import chain
from datetime import date
from home.models import (GenericUpdate, DigestPage, RecordPage, PressReleasePage,
                        TipsForTreasurersPage, ServicesLandingPage)

register = template.Library()

@register.inclusion_tag('partials/home-page-updates.html')
def home_page_updates():
    generic_updates = GenericUpdate.objects.live().filter(homepage_expiration__gte=date.today())

    # get latest press releases, records, tips, that are not pinned
    press_releases = PressReleasePage.objects.live().filter(homepage_hide=False, homepage_pin=False).order_by('-date')[:4]
    records = RecordPage.objects.live().filter(homepage_hide=False, homepage_pin=False).order_by('-date')[:4]
    tips = TipsForTreasurersPage.objects.live().filter().order_by('-date')[:4]

    # get ALL press releases and records that are pinned
    press_releases_pinned = PressReleasePage.objects.live().filter(homepage_hide=False, homepage_pin=True).order_by('-date')
    records_pinned = RecordPage.objects.live().filter(homepage_hide=False, homepage_pin=True).order_by('-date')

    # combine all the querysets
    updates = chain(press_releases, records, tips, press_releases_pinned, records_pinned)

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

    # sort the pruned queryset by date first, then sort pinned posts up top
    updates_sorted_by_date = sorted(updates_unpin_expired, key=lambda x: x.date, reverse=True)
    updates_sorted_by_homepage_pin = sorted(updates_sorted_by_date, key=lambda x: x.homepage_pin, reverse=True)

    # Figure out how many non-generic updates to show
    update_limit = 4 - len(generic_updates)

    return {
        'generic_updates': generic_updates,
        'updates': updates_sorted_by_homepage_pin[:update_limit]
    }
