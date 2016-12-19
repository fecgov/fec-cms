from django.shortcuts import render
from django.conf import settings

def home(request):
    search_query = request.GET.get('query', None)
    page_context = {
      'content_section': 'legal-resources',
    }
    return render(request, 'legal/home.html', {
        'search_hero_heading': 'Legal resources',
        'search_query': search_query,
        'self': page_context
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

  return render(request, 'legal/ao_process.html', {
    'self': page_context
  })
