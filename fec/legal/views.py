from django.shortcuts import render

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
