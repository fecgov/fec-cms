from django.shortcuts import render
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from itertools import chain
from operator import attrgetter
from home.models import DigestPage
from home.models import RecordPage
from home.models import PressReleasePage

def updates(request):
    digests = ''
    records = ''
    press_releases = ''
    update_types = []
    categories = ''

    # Get values from query
    update_types = update_types + request.GET.getlist('update_type', None)
    record_category = request.GET.get('record-category', '')
    release_category = request.GET.get('release-category', '')

    # Determine update_type from the kind of category
    if record_category:
      update_types = update_types + ['fec-record']
    if release_category:
      update_types = update_types + ['press-release']

    # If there's a query, only get the types in the query
    if update_types:
      if 'fec-record' in update_types:
        if record_category:
          records = RecordPage.objects.filter(category=record_category.replace('-', ' '))
        else:
          records = RecordPage.objects.live()
      if 'press-release' in update_types:
        if release_category:
          press_releases = PressReleasePage.objects.filter(category=release_category.replace('-', ' '))
        else:
          press_releases = PressReleasePage.objects.live()
      if 'weekly-digest' in update_types:
        digests = DigestPage.objects.live()

    else:
      records = RecordPage.objects.live()
      digests = DigestPage.objects.live()
      press_releases = PressReleasePage.objects.live()

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

    return render(request, 'home/latest_updates.html', {
        'page_context': page_context,
        'record_category': record_category,
        'release_category': release_category,
        'update_types': update_types,
        'updates': updates,
    })
