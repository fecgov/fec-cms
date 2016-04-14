from django.shortcuts import render

def home(request):
    search_query = request.GET.get('query', None)

    return render(request, 'legal/home.html', {
        'search_hero_heading': 'Legal Resources',
        'search_query': search_query,
    })
