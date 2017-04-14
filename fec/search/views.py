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
    r = requests.get(url, params={'q': query, 'sort': '-receipts', 'per_page': 3, 'api_key': settings.FEC_API_KEY})
    return r.json()


def search_committees(query):
    path = os.path.join(settings.FEC_API_VERSION, 'committees')
    url = parse.urljoin(settings.FEC_API_URL, path)
    r = requests.get(url, params={'q': query, 'per_page': 3, 'sort': '-receipts', 'api_key': settings.FEC_API_KEY})
    return r.json()


def prev_offset(limit, next_offset):
    if (next_offset - limit) >= 0:
        return next_offset - limit
    else:
        return 0


def parse_icon(path):
    """
    Parse which icon to show by checking if the URL is at /data/ 
    But because some /data/ pages aren't data tables, screen those out with
    the pages list
    """
    pages = ['/legal/advisory-opinions/', '/legal/statutes/', '/advanced/']
    if '/data/' in path and not any(p for p in pages if p in path):
        return 'data'
    else:
        return 'page'

def search(request):
    limit = 5
    search_query = request.GET.get('query', None)
    offset = request.GET.get('offset', 0)
    search_type = request.GET.getlist('type', ['site'])
    results = {}

    if 'candidates' in search_type and search_query:
        results['candidates'] = search_candidates(search_query)

    if 'committees' in search_type and search_query:
        results['committees'] = search_committees(search_query)

    if 'site' in search_type and search_query:
        params = {
            'affiliate': 'betafec_api',
            'access_key': settings.FEC_DIGITALGOV_KEY,
            'query': search_query,
            'limit': 10,
            'offset': offset
        }
        r = requests.get('https://search.usa.gov/api/v2/search/i14y', params=params)
        web_results = r.json()['web']
        results['site'] = {
            'results': web_results['results'],
            'best_bets': {
                'results': r.json()['text_best_bets'],
                'count': len(r.json()['text_best_bets'])
            },
            'meta': {
                'count': web_results['total'],
                'next_offset': web_results['next_offset'],
                'prev_offset': prev_offset(limit, int(offset))
            }
        }

        for result in results['site']['results']:
            result['icon'] = parse_icon(result['url'])

    results['count'] = len(results)

    return render(request, 'search/search.html', {
        'search_query': search_query,
        'results': results,
        'type': search_type,
        'self': {'title': 'Search results'}
    })
