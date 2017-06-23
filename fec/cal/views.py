from django.shortcuts import render

def calendar(request):
    page_context = {
      'content_section': 'calendar',
      'title': 'Calendar'
    }
    return render(request, 'calendar/calendar.html', {
      'self': page_context,
    })
