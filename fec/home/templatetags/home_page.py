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
This is for the Wagtail preview of HomePageBannerAnnouncement and AlertForEmergencyUseOnly banners
Shows the latest draft of banner currenty being edited and any other banner(s) currently live and showing on the home page.
All are ordered by -date_active. Alert banners are always first, followed by regular banners. 
See: /partials/draft-home-page-banner-announcement.html
"""
@register.inclusion_tag('partials/draft-home-page-banner-announcement.html')
def draft_home_page_banner_announcement(id):
    # Banners live on the homepage. Excluding the one being edited in the case it is currently live
    live_banners = HomePageBannerAnnouncement.objects.live().filter(
        active=True, date_active__lte=datetime_now,
        date_inactive__gt=datetime_now).exclude(id=id).order_by('-date_active')[:2]
    
    # Latest drafts of any live banners
    live_banners_drafts = [page.get_latest_revision_as_object() for page in live_banners ]

    # The banner currently being edited in Wagtail
    edit_banner = HomePageBannerAnnouncement.objects.filter(id=id)

    # The latest draft of the banner being edited
    edit_banner_draft = [page.get_latest_revision_as_object() for page in edit_banner ]
    #edit_banner_draft = edit_banner[0].get_latest_revision_as_object()
    
    # Combine edit_banner_draft and live_banner_drafts for all that will be previwed
    combined_banners = edit_banner_draft + live_banners_drafts

    # All that will be previwed, sorted by date_active, descending
    preview_banners = sorted(combined_banners, key=lambda x: x.date_active, reverse=True)

    alert_live_banners = AlertForEmergencyUseOnly.objects.live().filter(
        alert_active=True, alert_date_active__lte=datetime_now,
        alert_date_inactive__gt=datetime_now).exclude(id=id).order_by('-alert_date_active')[:2]
    
    # Latest draft of any live alert banners
    alert_live_banners_drafts = [page.get_latest_revision_as_object() for page in alert_live_banners]
    
     # The alert banner currently being edited in Wagtail
    alert_edit_banner = AlertForEmergencyUseOnly.objects.filter(id=id)

    # The latest draft of the alert banner being edited
    alert_edit_banner_draft = [page.get_latest_revision_as_object() for page in alert_edit_banner]
    
    # Combine alert_edit_banner_draft and alert_live_banner_drafts for all that will be previwed
    combined_alert_banners = alert_edit_banner_draft + alert_live_banners_drafts

    # All that will be previwed, sorted  by date_active, descending
    alert_preview_banners = sorted(combined_alert_banners, key=lambda x: x.alert_date_active, reverse=True)
    
    return {
        'draft_id': id,
        'alert_preview_banners': alert_preview_banners,
        'preview_banners': preview_banners,
        #'edit_banner_draft': edit_banner_draft, 
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
