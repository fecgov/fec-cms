from django.shortcuts import render
from data import constants
from django.conf import settings


def checkweb(request, office='senate', cycle=2018, state='VA', district=None):
    return render(request, 'checkweb.jinja', {
        'office': office,
        'office_code': office[0],
        'parent': 'checkweb',
        'cycle': int(cycle),
        'state': state,
        'state_full': constants.states[state.upper()] if state else None,
        'district': district,
        'title': 'check website',
        'api_name': settings.FEC_API_URL,
    })
