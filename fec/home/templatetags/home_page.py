import datetime
import zoneinfo

from django import template
from django.db.models import Q
from django.db.models import Q
from itertools import chain, islice
from datetime import date
from home.models import (HomePageBannerAnnouncement, AlertForEmergencyUseOnly, DigestPage, RecordPage,
                         PressReleasePage, TipsForTreasurersPage)

register = template.Library()

eastern = zoneinfo.ZoneInfo('America/New_York')
datetime_now = datetime.datetime.today().replace(tzinfo=eastern)
eastern = zoneinfo.ZoneInfo('America/New_York')
datetime_now = datetime.datetime.today().replace(tzinfo=eastern)

@register.inclusion_tag('partials/home-page-banner-announcement.html')
def home_page_banner_announcement():


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


""" 
This is for the Wagtail preview for Home Page Banner Announcement. 
Shows the banner currenty being edited (draft_banner or draft_alert_banner) and any live_banner(s) or alert_draft_alert_banner(s).
All are ordered by -date_active.
"""
@register.inclusion_tag('partials/draft-home-page-banner-announcement.html')
def draft_home_page_banner_announcement(id):
    live_banners = HomePageBannerAnnouncement.objects.live().filter(
        active=True, date_active__lte=datetime_now,
        date_inactive__gt=datetime_now).order_by('-date_active')[:2] 
    live_alert_banners = AlertForEmergencyUseOnly.objects.live().filter(
        alert_active=True, alert_date_active__lte=datetime_now,
        alert_date_inactive__gt=datetime_now).order_by('-alert_date_active')[:2]
    
    # This is the banner currently being edited in Wagtail
    draft_banner = HomePageBannerAnnouncement.objects.filter(id=id)
    # Combine the draft banner with any currently live banners
    preview_banners = draft_banner | live_banners 
    # Limit to three to allow up to two live banners (the homepage limit) plus the one being edited
    display_banners = preview_banners.order_by('-date_active')[:3]
    
    # This is the alert_banner currently being edited in Wagtail
    draft_alert_banner = AlertForEmergencyUseOnly.objects.filter(id=id)
    # Combine the draft alert banner with any currently live alert banners
    preview_alert_banners = draft_alert_banner | live_alert_banners
    # Limit to two to represent what the homepage would show
    display_alert_banners = preview_alert_banners.order_by('-alert_date_active')[:2]

    return {
        'draft_id': id,
        'display_banners': display_banners,
        'display_alert_banners': display_alert_banners,
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
