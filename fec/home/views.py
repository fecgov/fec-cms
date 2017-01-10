from django.shortcuts import render
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.conf import settings
from itertools import chain
from operator import attrgetter
from home.models import CommissionerPage
from home.models import DigestPage
from home.models import RecordPage
from home.models import PressReleasePage

def replace_dash(string):
  return string.replace('-', ' ')

def replace_space(string):
  return string.replace(' ', '-')

def get_records(category_list=False, year=False):
  records = RecordPage.objects.live()
  if category_list != '':
    for category in category_list:
      records = records.filter(category=category)
  if year != '':
    records = records.filter(date__year=year)
  return records

def get_digests(year=False):
  digests = DigestPage.objects.live()
  if year != '':
    digests = digests.filter(date__year=year)
  return digests

def get_press_releases(category_list=False, year=False):
  press_releases = PressReleasePage.objects.live()
  if category_list:
    for category in category_list:
      press_releases = press_releases.filter(category=category)
  if year:
    press_releases = press_releases.filter(date__year=year)
  return press_releases

def updates(request):
    digests = ''
    records = ''
    press_releases = ''
    categories = ''

    # Get values from query
    update_types = request.GET.getlist('update_type', None)
    category_list = request.GET.getlist('category', '')
    year = request.GET.get('year', '')

    category_list = list(map(replace_dash, category_list))

    # If there's a query, only get the types in the query
    if update_types:
      if 'for-media' in update_types:
        press_releases = get_press_releases(category_list=category_list, year=year)
        digests = get_digests(year=year)
      if 'for-committees' in update_types:
        records = get_records(category_list=category_list, year=year)
      if 'fec-record' in update_types:
        records = get_records(category_list=category_list, year=year)
      if 'press-release' in update_types:
        press_releases = get_press_releases(category_list=category_list, year=year)
      if 'weekly-digest' in update_types:
        digests = get_digests(year=year)

    else:
      # Get everything and filter by year if necessary
      digests = DigestPage.objects.live()
      press_releases = PressReleasePage.objects.live()

      # Hide behind feature flag unless explicitly requested
      # Only authenticated users will be able to explicitly request them for now
      if settings.FEATURES['record']:
        records = RecordPage.objects.live()

      if year:
        records = records.filter(date__year=year)
        press_releases = press_releases.filter(date__year=year)
        digests = digests.filter(date__year=year)

    # Chain all the QuerySets together
    # via http://stackoverflow.com/a/434755/1864981
    updates = sorted(
      chain(press_releases, digests, records),
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
        'year': year
    })

def calendar(request):
  page_context = {
    'content_section': 'Calendar',
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

def ao_process(request):
  ancestors = [
    {
      'title': 'Legal resources',
      'url': '/legal-resources/',
    }, {
      'title': 'Advisory opinions',
      'url': settings.FEC_APP_URL + '/legal/advisory-opinions',
    }
  ]
  page_context = {
    'content_section': 'legal',
    'title': 'The advisory opinion process',
    'ancestors': ancestors
  }

  return render(request, 'home/legal/ao_process.html', {
    'self': page_context
  })

def commissioners(request):
  chair_commissioner = CommissionerPage.objects.filter(commissioner_title__contains='Chair') \
    .exclude(commissioner_title__contains='Vice').first()
  vice_commissioner = CommissionerPage.objects.filter(commissioner_title__startswith='Vice').first()
  commissioners = CommissionerPage.objects.filter(commissioner_title__exact='').order_by('last_name')

  page_context = {
    'title': 'All Commissioners',
    'chair_commissioner': chair_commissioner,
    'vice_commissioner': vice_commissioner,
    'commissioners': commissioners
  }

  return render(request, 'home/commissioners.html', {
    'self': page_context,
  })
