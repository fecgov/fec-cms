from django.shortcuts import render

import os

from data import api_caller
from data import constants


# TODO: load query string
def landing(request):
    canonical_base = os.environ.get('CANONICAL_BASE', 'https://www.fec.gov')

    return render(request, 'landing.jinja', {
      'canonical_base': canonical_base,
      'title': 'Campaign finance data'
    })


def advanced(request):
    return render(request, 'advanced.jinja', {
        'title': 'Advanced data'
    })


def candidate(request, candidate_id):
    # TODO: check for these url variables
    cycle = None
    election_full = True

    candidate, committees, cycle = api_caller.load_with_nested(
        'candidate', candidate_id, 'committees',
        cycle=cycle, cycle_key='two_year_period',
        election_full=election_full,
    )

    context_vars = {
        'cycles': candidate['cycles'],
        'name': candidate['name'],
        'cycle': cycle,
        'electionFull': election_full,
        'candidateID': candidate['candidate_id']
    }

    return render(request, 'candidates-single.jinja', {
        'name': candidate['name'],
        'cycle': cycle,
        'office_full': candidate['office_full'],
        'candidate_id': candidate_id,
        'party_full': candidate['party_full'],
        'candidate': 'candidate',
        'committee_groups': '',
        'constants': constants,
        'cycle_start': '',
        'context_vars': context_vars
    })
