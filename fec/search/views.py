import os
import requests
import math

from urllib import parse

from django.shortcuts import render
from django.conf import settings


def search_candidates(query):
    """Searches the data API for candidates matching the query"""
    path = os.path.join(settings.FEC_API_VERSION, 'candidates', 'search')
    url = parse.urljoin(settings.FEC_API_URL, path)
    r = requests.get(url, params={
        'q': query, 'sort': '-receipts', 'per_page': 3, 'api_key': settings.FEC_API_KEY_PRIVATE
    })
    return r.json()


def search_committees(query):
    """Searches the data API for committees matching the query"""
    path = os.path.join(settings.FEC_API_VERSION, 'committees')
    url = parse.urljoin(settings.FEC_API_URL, path)
    r = requests.get(url, params={
        'q': query, 'per_page': 3, 'sort': '-receipts', 'api_key': settings.FEC_API_KEY_PRIVATE
    })
    return r.json()


def prev_offset(limit, next_offset):
    """
    Helper function for determining the previous offset, which is used
    for paging to previous pages
    """
    if (next_offset - limit) >= 0:
        return next_offset - limit
    else:
        return 0


def results_range(current_offset, next_offset, total_results):
    """
    Helper function to return "x-xx" results count messages.
    current_offset is 0-based, i.e. a current_offset of 0 is the first result, current_offset 10 is the eleventh
    """
    first_result_num = int(current_offset) + 1
    if next_offset:
        last_result_num = max(first_result_num, int(next_offset))
    else:
        last_result_num = total_results
    return '-'.join([str(first_result_num), str(last_result_num)])


def parse_icon(path):
    """
    Parse which icon to show by checking if the URL is at /data/
    But because some /data/ pages aren't data tables, screen those out with
    the pages list
    """
    pages = ['/legal/advisory-opinions/', '/legal/statutes/', '/browse-data/']
    if '/data/' in path and not any(p for p in pages if p in path):
        return 'data'
    else:
        return 'page'


def replace_url(url):
    """
    Replace the base part of the URL with the canonical URL from settings
    Useful for the initial switch over from beta.fec.gov to fec.gov
    """
    parsed = parse.urlparse(url)
    if parsed.netloc == 'beta.fec.gov':
        # Only return a new url if the base is beta.fec.gov
        return parse.urljoin(settings.CANONICAL_BASE, parsed.path)
    else:
        return url


def process_site_results(results, limit=0, offset=0):
    """Organizes the results from Search.gov website into a better format"""
    web_results = results['web']
    grouped = {
        'results': web_results['results'],
        'best_bets': {
            'results': results['text_best_bets'],
            'count': len(results['text_best_bets'])
        },
        'meta': {
            'count': web_results['total'],
            'current_offset': int(offset),
            'next_offset': web_results['next_offset'],
            'prev_offset': prev_offset(limit, int(offset)),
            'results_range': results_range(offset, web_results['next_offset'], web_results['total']),
        }
    }

    # Parse the icons and replace the URLs
    for result in grouped['results']:
        result['icon'] = parse_icon(result['url'])
        result['url'] = replace_url(result['url'])

    return grouped


def search_site(query, limit=0, offset=0):
    """Calls the Search.gov website and then processes the results if successful"""
    params = {
        'affiliate': 'betafec_api',
        'access_key': settings.SEARCHGOV_API_ACCESS_KEY,
        'query': query,
        'limit': limit,
        'offset': offset
    }
    r = requests.get('https://api.gsa.gov/technology/searchgov/v2/results/i14y', params=params)

    if r.status_code == 200:
        return process_site_results(r.json(), limit=limit, offset=offset)


def search(request):
    """
    Takes a page request and calls the appropriate searches
    depending on the type requested
    """

    limit = 10
    search_query = request.GET.get('query', None)
    offset = request.GET.get('offset', 0)
    search_type = request.GET.getlist('type', ['site'])
    results = {}
    results['count'] = 0

    if 'candidates' in search_type and search_query:
        results['candidates'] = search_candidates(search_query)
        if results['candidates']:
            results['count'] += len(results['candidates']['results'])

    if 'committees' in search_type and search_query:
        results['committees'] = search_committees(search_query)
        if results['committees']:
            results['count'] += len(results['committees']['results'])

    if 'site' in search_type and search_query:
        results['site'] = search_site(search_query, limit=limit, offset=offset)
        if results['site']:
            results['count'] += len(results['site']['results'])

    return render(request, 'search/search.html', {
        'search_query': search_query,
        'results': results,
        'type': search_type,
        'self': {'title': 'Search results'}
    })


# Policy and guidance search

# Search.gov API call
def policy_guidance_search_site(query, limit=0, offset=0):
    """Calls the Search.gov policy and guidance search and then processes the results if successful"""
    params = {
        'affiliate': 'fec_content_s3',
        'access_key': settings.SEARCHGOV_POLICY_GUIDANCE_KEY,
        'query': query,
        'limit': limit,
        'offset': offset
    }

    r = requests.get('https://api.gsa.gov/technology/searchgov/v2/results/i14y', params=params)
    if r.status_code == 200:
        return process_site_results(r.json(), limit=limit, offset=offset)


def policy_guidance_search(request):
    """
    Takes a page request and calls the appropriate searches
    depending on the type requested
    """

    limit = 10
    search_query = request.GET.get('query', None)
    offset = request.GET.get('offset', 0)

    results = policy_guidance_search_site(search_query, limit=limit, offset=offset)
    current_page = int(int(offset) / limit) + 1
    num_pages = 1
    total_count = 0
    if results:
        num_pages = math.ceil(int(results['meta']['count']) / limit)
        total_count = results['meta']['count'] + results['best_bets']['count']

    resultset = {}
    resultset['search_query'] = search_query
    resultset['results'] = results
    resultset['self'] = {'title': 'Guidance documents'}
    resultset['offset'] = offset
    resultset['num_pages'] = num_pages
    resultset['current_page'] = current_page
    resultset['total_count'] = total_count

    return render(request, 'search/policy_guidance_search_page.html', resultset)
