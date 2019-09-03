import re

from django import template
from home.models import CommissionerPage
from django.db.models import Q

register = template.Library()

@register.inclusion_tag('partials/current-commissioners.html')
def current_commissioners():
    current_commissioners = CommissionerPage.objects.filter(term_expiration__isnull=True)
    chair_commissioner = current_commissioners.filter(commissioner_title__startswith='Chair') \
        .exclude(commissioner_title__contains='Vice').first()
    vice_commissioner = current_commissioners.filter(commissioner_title__startswith='Vice').first()
    other_commissioners = current_commissioners \
        .exclude(Q(commissioner_title__startswith='Chair') \
        | Q(commissioner_title__startswith='Vice')) \
        .order_by('last_name')

    # Checks if there are any current commissioners
    if current_commissioners:
        try:
            current_commissioners_count = len(current_commissioners)
        except:
            current_commissioners_count = 1
    else:
        current_commissioners_count = 0

    vacant_seats = range(0, 6 - current_commissioners_count)

    return {
        'chair_commissioner': chair_commissioner,
        'vice_commissioner': vice_commissioner,
        'commissioners': other_commissioners,
        'vacant_seats' : vacant_seats,
    }
