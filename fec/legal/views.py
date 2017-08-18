from django.shortcuts import render

import datetime

from data import api_caller


def advisory_opinions_landing(request):
    today = datetime.date.today()
    ao_min_date = today - datetime.timedelta(weeks=26)
    recent_aos = api_caller.load_legal_search_results(
        query='',
        query_type='advisory_opinions',
        ao_category=['F', 'W'],
        ao_min_issue_date=ao_min_date
    )
    pending_aos = api_caller.load_legal_search_results(
        query='',
        query_type='advisory_opinions',
        ao_category='R',
        ao_is_pending=True
    )
    return render(request, 'legal-advisory-opinions-landing.jinja', {
        'parent': 'legal',
        'result_type': 'advisory_opinions',
        'display_name': 'advisory opinions',
        'recent_aos': recent_aos['advisory_opinions'],
        'pending_aos': pending_aos['advisory_opinions']
    })
