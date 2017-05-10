import requests

from django.shortcuts import render
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.conf import settings
from itertools import chain
from operator import attrgetter

from fec.forms import ContactRAD, form_categories
from home.models import (
    CommissionerPage,
    DigestPage,
    PressReleasePage,
    RecordPage,
    TipsForTreasurersPage,
    MeetingPage
)


def replace_dash(string):
    return string.replace('-', ' ')


def replace_space(string):
    return string.replace(' ', '-')


def get_records(category_list=None, year=None, search=None):
    records = RecordPage.objects.live()

    if category_list:
        for category in category_list:
            records = records.filter(category=category)

    if year:
        records = records.filter(date__year=year)

    if search:
        records = records.search(search)

    return records


def get_digests(year=None, search=None):
    digests = DigestPage.objects.live()
    if year:
        digests = digests.filter(date__year=year)

    if search:
        digests = digests.search(search)

    return digests


def get_press_releases(category_list=None, year=None, search=None):
    press_releases = PressReleasePage.objects.live()

    if category_list:
        for category in category_list:
            press_releases = press_releases.filter(category=category)

    if year:
        press_releases = press_releases.filter(date__year=year)

    if search:
        press_releases = press_releases.search(search)

    return press_releases


def get_tips(year=None, search=None):
    tips = TipsForTreasurersPage.objects.live()

    if year:
        tips = tips.filter(date__year=year)

    if search:
        tips = tips.search(search)

    return tips


def get_meetings(category_list=None, year=False, search=None):
    meetings = MeetingPage.objects.live()

    if category_list:
        for category in category_list:
            meetings = meetings.filter(meeting_type=category)

    if year:
        meetings = meetings.filter(date__year=year)
    return meetings


def updates(request):
    digests = ''
    records = ''
    press_releases = ''
    tips = ''
    meetings = ''

    # Get values from query
    update_types = request.GET.getlist('update_type', None)
    category_list = request.GET.getlist('category', '')
    year = request.GET.get('year', '')
    search = request.GET.get('search', '')

    category_list = list(map(replace_dash, category_list))

    # If there's a query, only get the types in the query
    if update_types:
        if 'for-media' in update_types:
            press_releases = get_press_releases(category_list=category_list,
                                                year=year, search=search)
            digests = get_digests(year=year, search=search)
        if 'for-committees' in update_types:
            records = get_records(category_list=category_list, year=year, search=search)
        if 'fec-record' in update_types:
            records = get_records(category_list=category_list, year=year, search=search)
        if 'press-release' in update_types:
            press_releases = get_press_releases(category_list=category_list,
                                                year=year, search=search)
        if 'weekly-digest' in update_types:
            digests = get_digests(year=year, search=search)
        if 'tips-for-treasurers' in update_types:
            tips = get_tips(year=year, search=search)
        if 'meetings' in update_types:
            meetings = get_meetings(category_list=category_list, year=year, search=search)

    else:
        # Get everything and filter by year if necessary
        digests = DigestPage.objects.live()
        press_releases = PressReleasePage.objects.live()
        records = RecordPage.objects.live()
        tips = TipsForTreasurersPage.objects.live()
        meetings = MeetingPage.objects.live()

        if year:
            press_releases = press_releases.filter(date__year=year)
            digests = digests.filter(date__year=year)
            records = records.filter(date__year=year)
            tips = tips.filter(date__year=year)
            meetings = meetings.filter(date__year=year)

        if search:
            press_releases = press_releases.search(search)
            digests = digests.search(search)
            records = records.search(search)
            tips = tips.search(search)
            meetings = meetings.search(search)

    # temporary: agenda meetings are only for logged in admin users
    if not request.user.is_authenticated():
        meetings = ''

    # Chain all the QuerySets together
    # via http://stackoverflow.com/a/434755/1864981
    updates = sorted(
      chain(press_releases, digests, records, tips, meetings),
      key=attrgetter('date'),
      reverse=True
    )

    # Handle pagination
    page = request.GET.get('page', 1)
    paginator = Paginator(updates, 20)
    try:
        updates = paginator.page(page)
    except PageNotAnInteger:
        updates = paginator.page(1)
    except EmptyPage:
        updates = paginator.page(paginator.num_pages)

    page_context = {
      'title': 'Latest updates',
    }

    category_list = list(map(replace_space, category_list))

    return render(request, 'home/latest_updates.html', {
        'self': page_context,
        'category_list': category_list,
        'update_types': update_types,
        'updates': updates,
        'year': year,
        'search': search
    })


def calendar(request):
    page_context = {
      'content_section': 'calendar',
      'title': 'Calendar'
    }
    return render(request, 'home/calendar.html', {
      'self': page_context,
    })


def contact(request):
    page_context = {
      'content_section': 'contact',
      'title': 'Contact'
    }

    return render(request, 'home/contact.html', {
      'self': page_context,
    })


def commissioners(request):
    chair_commissioner = CommissionerPage.objects.filter(commissioner_title__contains='Chair') \
      .exclude(commissioner_title__contains='Vice').first()
    vice_commissioner = CommissionerPage.objects.filter(commissioner_title__startswith='Vice').first()

    current_commissioners = CommissionerPage.objects.filter(commissioner_title__exact='', \
      term_expiration__isnull=True).order_by('last_name')
    past_commissioners = CommissionerPage.objects.filter(commissioner_title__exact='', \
      term_expiration__isnull=False).order_by('-term_expiration')

    page_context = {
      'title': 'All Commissioners',
      'chair_commissioner': chair_commissioner,
      'vice_commissioner': vice_commissioner,
      'current_commissioners': current_commissioners,
      'past_commissioners': past_commissioners,
      'content_section': 'about',
      'ancestors': [
        {
          'title': 'About the FEC',
          'url': '/about/',
        },
        {
          'title': 'Leadership and structure',
          'url': '/about/leadership-and-structure',
        },
      ]
    }

    return render(request, 'home/commissioners.html', {
      'self': page_context,
    })


def contact_rad(request):
    page_context = {
        'title': 'Submit a question to the Reports Analysis Division (RAD)',
        'ancestors': [{
          'title': 'Help for candidates and committees',
          'url': '/help-candidates-committees/',
        }],
        'content_section': 'help'
    }

    if settings.FEATURES['radform']:
        # If it's a POST, post to the ServiceNow API
        if request.method == 'POST':
            form = ContactRAD(request.POST)
            response = form.post_to_service_now()
            if response == 201:
                return render(request, 'home/contact-form.html', {
                  'self': page_context,
                  'success': True
                })
            else:
                return render(request, 'home/contact-form.html', {
                  'self': page_context,
                  'form': form,
                  'server_error': True
                })
        else:
            form = ContactRAD()
    else:
        form = False

    return render(request, 'home/contact-form.html', {
        'self': page_context,
        'form': form
    })
