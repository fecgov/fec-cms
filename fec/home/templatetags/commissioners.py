import re

from django import template
from home.models import CommissionerPage

register = template.Library()

@register.inclusion_tag('partials/current-commissioners.html')
def current_commissioners():
    chair_commissioner = CommissionerPage.objects.filter(commissioner_title__contains='Chair') \
        .exclude(commissioner_title__contains='Vice').first()
    vice_commissioner = CommissionerPage.objects.filter(commissioner_title__startswith='Vice').first()
    commissioners = CommissionerPage.objects.filter(commissioner_title__exact='', \
        term_expiration__isnull=True).order_by('last_name')

    return {
        'chair_commissioner': chair_commissioner,
        'vice_commissioner': vice_commissioner,
        'commissioners': commissioners
    }
