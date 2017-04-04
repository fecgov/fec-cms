import re

from django import template
from home.models import CommissionerPage
from django.db.models import Q

register = template.Library()

@register.inclusion_tag('partials/current-commissioners.html')
def current_commissioners():
    #vacant_chair = ""
    chair_commissioner = CommissionerPage.objects.filter(commissioner_title__startswith='Chair') \
        .exclude(commissioner_title__contains='Vice').first()
    vice_commissioner = CommissionerPage.objects.filter(commissioner_title__startswith='Vice').first()
    commissioners = CommissionerPage.objects.filter(term_expiration__isnull=True) \
        .exclude(Q(commissioner_title__startswith='Chair') \
        | Q(commissioner_title__startswith='Vice')) \
        .order_by('last_name')

    vacant_seats = range(0, 4 - commissioners.count())

    return {
        'chair_commissioner': chair_commissioner,
        'vice_commissioner': vice_commissioner,
        'commissioners': commissioners,
        'vacant_seats' : vacant_seats,
    }
