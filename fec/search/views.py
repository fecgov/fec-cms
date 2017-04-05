import os
import requests
import json

from urllib import parse

from django.shortcuts import render
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.conf import settings

from wagtail.wagtailcore.models import Page
from wagtail.wagtailsearch.models import Query
from wagtail.contrib.wagtailsearchpromotions.models import SearchPromotion

def search_candidates(query):
    path = os.path.join(settings.FEC_API_VERSION, 'candidates', 'search')
    url = parse.urljoin(settings.FEC_API_URL, path)
    r = requests.get(url, params={'q': query, 'sort': '-receipts', 'per_page': 5})
    return r.json()['results']

def search(request):
    search_query = request.GET.get('query', None)
    page = request.GET.get('page', 1)
    search_results = []
    candidate_results = []
    # Search
    if search_query:
        params = {
            'affiliate': 'betafec_api',
            'access_key': settings.FEC_DIGITALGOV_KEY,
            'query': search_query,
            'enable_highlighting': 'false'
        }
        r = requests.get('https://search.usa.gov/api/v2/search/i14y', params=params)
        query = Query.get(search_query)

        # Record hit
        query.add_hit()
        candidate_results = search_candidates(search_query)

        search_results = r.json()['web']['results']

    # Pagination
    # paginator = Paginator(search_results, 5)
    # try:
    #     search_results = paginator.page(page)
    # except PageNotAnInteger:
    #     search_results = paginator.page(1)
    # except EmptyPage:
    #     search_results = paginator.page(paginator.num_pages)

    return render(request, 'search/search.html', {
        'search_query': search_query,
        'search_results': search_results,
        'candidate_results': candidate_results,
        'self': {'title': 'Search results'}
    })
