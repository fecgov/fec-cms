import requests
from datetime import datetime

from django.shortcuts import render
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.conf import settings
from itertools import chain
from operator import attrgetter

from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from wagtail.wagtaildocs.models import Document

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
        year = int(year)
        records = records.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))

    if search:
        records = records.search(search)

    return records


def get_digests(year=None, search=None):
    digests = DigestPage.objects.live()
    if year:
        year = int(year)
        digests = digests.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))

    if search:
        digests = digests.search(search)

    return digests


def get_press_releases(category_list=None, year=None, search=None):
    press_releases = PressReleasePage.objects.live()

    if category_list:
        for category in category_list:
            press_releases = press_releases.filter(category=category)

    if year:
        year = int(year)
        press_releases = press_releases.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))

    if search:
        press_releases = press_releases.search(search)

    return press_releases


def get_tips(year=None, search=None):
    tips = TipsForTreasurersPage.objects.live()

    if year:
        year = int(year)
        tips = tips.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))

    if search:
        tips = tips.search(search)

    return tips


def get_meetings(category_list=None, year=False, search=None):
    meetings = MeetingPage.objects.live()

    if category_list:
        for category in category_list:
            meetings = meetings.filter(meeting_type=category)

    if year:
        year = int(year)
        meetings = meetings.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))

    if search:
        meetings = meetings.search(search)

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
            # Trying to filter using the built-in date__year parameter doesn't
            # work when chaining filter() and search(), so this uses date_gte and date_lte
            year = int(year)
            press_releases = press_releases.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))
            digests = digests.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))
            records = records.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))
            tips = tips.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))
            meetings = meetings.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))

        if search:
            press_releases = press_releases.search(search)
            digests = digests.search(search)
            records = records.search(search)
            tips = tips.search(search)
            meetings = meetings.search(search)

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
          'url': '/help-candidates-and-committees/',
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

def serve_wagtail_doc(request, document_id, document_filename):
    """
    Replacement for ``wagtail.wagtaildocs.views.serve.serve``
    Wagtail's default document view serves everything as an attachment.
    We'll bounce back to the URL and let the media server serve it.
    """
    doc = get_object_or_404(Document, id=document_id)
    return HttpResponseRedirect(doc.file.url)

def index_meetings(request,  year=None, search=None):
    meetings = MeetingPage.objects.live()
    open_meetings = meetings.filter(meeting_type ='O')
    executive_sessions = meetings.filter(meeting_type ='E') or meetings.filter(title__contains='executive')
    hearings= meetings.filter(title__contains='Hearing')

    year = request.GET.get('year', '')
    search = request.GET.get('search', '')

    if year:
        # Trying to filter using the built-in date__year parameter doesn't
        # work when chaining filter() and search(), so this uses date_gte and date_lte
        year = int(year)
        meetings = meetings.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))
        executive_sessions = executive_sessions.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))
        open_meetings = open_meetings.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))
        hearings = hearings.filter(date__gte=datetime(year, 1, 1)).filter(date__lte=datetime(year, 12, 31))

    if search:
        meetings = meetings.search(search)
        executive_sessions = executive_sessions.search(search)
        open_meetings = open_meetings.search(search)
        hearings = hearings.search(search)


    # Handle pagination
    if open_meetings:
        page = request.GET.get('page', 1)
        paginator = Paginator(open_meetings, 20)
        try:
            open_meetings = paginator.page(page)

        except PageNotAnInteger:
            open_meetings = paginator.page(1)

        except EmptyPage:
            open_meetings = paginator.page(paginator.num_pages)

    elif executive_sessions:
        page= request.GET.get('page', 1)
        paginator_e = Paginator(executive_sessions, 20)

        try:
            executive_sessions = paginator_e.page(page)

        except PageNotAnInteger:
            executive_sessions = paginator_e.page(1)

        except EmptyPage:
            executive_sessions = paginator_e.page(1)

    elif hearings:
        page= request.GET.get('page', 1)
        paginator_h = Paginator(executive_sessions, 20)

        try:
            hearings = paginator_h.page(page)

        except PageNotAnInteger:
            hearings = paginator_h.page(1)

        except EmptyPage:
            hearings = paginator_h.page(1)


    page_context = {
      'title': 'Commission Meetings',
    }

    return render(request, 'home/commission_meetings.html', {
        'self': page_context,
        'year': year,
        'search': search,
        'meetings': meetings,
        'open_meetings': open_meetings,
        'executive_sessions': executive_sessions,
        'hearings': hearings,
    })
