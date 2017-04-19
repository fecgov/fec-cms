import os
import requests
import json

from urllib import parse

from django.shortcuts import render
from django.conf import settings

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


def process_site_results(results, limit=0, offset=0):
    web_results = results['web']
    grouped = {
        'results': web_results['results'],
        'best_bets': {
            'results': results['text_best_bets'],
            'count': len(results['text_best_bets'])
        },
        'meta': {
            'count': web_results['total'],
            'next_offset': web_results['next_offset'],
            'prev_offset': prev_offset(limit, int(offset))
        }
    }

    # Parse the icons
    for result in grouped['results']:
        result['icon'] = parse_icon(result['url'])

    return grouped


def search_site(query, limit=0, offset=0):
    params = {
        'affiliate': 'betafec_api',
        'access_key': settings.FEC_DIGITALGOV_KEY,
        'query': query,
        'limit': limit,
        'offset': offset
    }
    r = requests.get('https://search.usa.gov/api/v2/search/i14y', params=params)

    if r.status_code == 200:
        return process_site_results(r.json(), limit=limit, offset=offset)


def search(request):
    limit = 10
    search_query = request.GET.get('query', None)
    offset = request.GET.get('offset', 0)
    search_type = request.GET.getlist('type', ['site'])
    results = {}

    if 'candidates' in search_type and search_query:
        results['candidates'] = search_candidates(search_query)

    if 'committees' in search_type and search_query:
        results['committees'] = search_committees(search_query)

    if 'site' in search_type and search_query:
        results['site'] = search_site(search_query, limit=limit, offset=offset)

    results['count'] = len(results)

    return render(request, 'search/search.html', {
        'search_query': search_query,
        'results': results,
        'type': search_type,
        'self': {'title': 'Search results'}
    })
