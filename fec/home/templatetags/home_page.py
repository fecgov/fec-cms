import datetime
import zoneinfo

from django import template
from itertools import chain, islice
from datetime import date
from home.models import (HomePageBannerAnnouncement, AlertForEmergencyUseOnly, DigestPage, RecordPage,
                         PressReleasePage, TipsForTreasurersPage)

register = template.Library()


@register.inclusion_tag('partials/home-page-banner-announcement.html')
def home_page_banner_announcement():
    eastern = zoneinfo.ZoneInfo('America/New_York')
    datetime_now = datetime.datetime.today().replace(tzinfo=eastern)
    banners = HomePageBannerAnnouncement.objects.live().filter(
        active=True, date_active__lte=datetime_now,
        date_inactive__gt=datetime_now).order_by('-date_active')[:2]
    alert_banners = AlertForEmergencyUseOnly.objects.live().filter(
        alert_active=True, alert_date_active__lte=datetime_now,
        alert_date_inactive__gt=datetime_now).order_by('-alert_date_active')[:2]

    return {
        'banners': banners,
        'alert_banners': alert_banners
    }


# This is for the Wagtail preview for Home Page Banner Announcement
@register.inclusion_tag('partials/draft-home-page-banner-announcement.html')
def draft_home_page_banner_announcement():
    draft_banners = HomePageBannerAnnouncement.objects.all().order_by('-date_active')
    draft_alert_banners = AlertForEmergencyUseOnly.objects.all().order_by('-alert_date_active')

    return {
        'draft_banners': draft_banners,
        'draft_alert_banners': draft_alert_banners
    }


@register.inclusion_tag('partials/home-page-news.html')
def home_page_news():
    # get one of each update type (not featured)
    record = RecordPage.objects.live().filter(homepage_hide=False, homepage_pin=False).order_by('-date')[:1]
    tips_for_treasurer = TipsForTreasurersPage.objects.live().order_by('-date')[:1]
    press_release = PressReleasePage.objects.live().filter(
        homepage_hide=False, homepage_pin=False).order_by('-date')[:1]
    weekly_digest = DigestPage.objects.live().order_by('-date')[:1]

    # get featured press releases and records
    press_releases_pinned = PressReleasePage.objects.live().filter(
        homepage_hide=False, homepage_pin=True, homepage_pin_start__lte=date.today()).order_by('-date')
    records_pinned = RecordPage.objects.live().filter(
        homepage_hide=False, homepage_pin=True, homepage_pin_start__lte=date.today()).order_by('-date')

    chained_featured_updates = chain(press_releases_pinned, records_pinned)

    # remove expired featured updates
    # limit to only one featured update
    featured_updates = []
    for update in chained_featured_updates:
        if update.homepage_pin_expiration:
            if update.homepage_pin_expiration > date.today():
                featured_updates.append(update)
                break
        else:
            featured_updates.append(update)
            break

    updates = islice(chain(featured_updates, record, tips_for_treasurer, press_release, weekly_digest), 4)

    return {
        'updates': updates
    }
