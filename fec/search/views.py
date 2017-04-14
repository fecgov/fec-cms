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
    r = requests.get(url, params={'q': query, 'sort': '-receipts', 'per_page': 5, 'api_key': settings.FEC_API_KEY})
    return r.json()['results']

def search_committees(query):
    path = os.path.join(settings.FEC_API_VERSION, 'committees')
    url = parse.urljoin(settings.FEC_API_URL, path)
    r = requests.get(url, params={'q': query, 'per_page': 5, 'api_key': settings.FEC_API_KEY})
    return r.json()['results']

def prev_offset(limit, next_offset):
    if (next_offset - limit) >= 0:
        return next_offset - limit
    else:
        return 0

def search(request):
    limit = 10
    search_query = request.GET.get('query', None)
    offset = request.GET.get('offset', 0)
    search_results = []
    candidate_results = []
    committee_results = []
    best_bets = []
    meta = {}

    # Search
    if search_query:
        params = {
            'affiliate': 'betafec_api',
            'access_key': settings.FEC_DIGITALGOV_KEY,
            'query': search_query,
            'limit': limit,
            'offset': offset
        }
        r = requests.get('https://search.usa.gov/api/v2/search/i14y', params=params)
        candidate_results = search_candidates(search_query)
        committee_results = search_committees(search_query)
        results = r.json()['web']
        search_results = results['results']
        best_bets = r.json()['text_best_bets']
        meta = {
            'count': results['total'],
            'next_offset': results['next_offset'],
            'prev_offset': prev_offset(limit, int(offset))
        }

    return render(request, 'search/search.html', {
        'search_query': search_query,
        'search_results': search_results,
        'candidate_results': candidate_results,
        'committee_results': committee_results,
        'best_bets': best_bets,
        'meta': meta,
        'self': {'title': 'Search results'}
    })
