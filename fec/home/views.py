from django.shortcuts import render
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from itertools import chain
from operator import attrgetter
from home.models import DigestPage
from home.models import RecordPage
from home.models import PressReleasePage

def updates(request):
    update_types = request.GET.getlist('update_type', None)
    categories = request.GET.getlist('category', None)
    digests = ''
    records = ''
    press_releases = ''

    # If there's a query, only get the types in the query
    if update_types:
      if 'fec-record' in update_types:
        records = RecordPage.objects.all()
      if 'weekly-digest' in update_types:
        digests = DigestPage.objects.all()
      if 'press-release' in update_types:
        press_releases = PressReleasePage.objects.all()
    else:
      records = RecordPage.objects.all()
      digests = DigestPage.objects.all()
      press_releases = PressReleasePage.objects.all()

    # Chain all the QuerySets together
    # via http://stackoverflow.com/a/434755/1864981
    updates = sorted(
      chain(press_releases, digests, records),
      key=attrgetter('date'),
      reverse=True
    )

    # Filter out any that don't match the category
    if categories:
      for update in updates:
        category = update.category.replace(' ', '-')
        if category not in categories:
          updates.remove(update)

    # Handle pagination
    page = request.GET.get('page', 1)
    paginator = Paginator(updates, 20)
    try:
        updates = paginator.page(page)
    except PageNotAnInteger:
        updates = paginator.page(1)
    except EmptyPage:
        updates = paginator.page(paginator.num_pages)


    return render(request, 'home/latest_updates.html', {
        'categories': categories,
        'update_types': update_types,
        'updates': updates,
    })
