# Get the most recent OIG reports, those in the oig group (defind in fec/constants.py)
from django import template
from home.models import DocumentPage
from fec import constants

register = template.Library()


@register.inclusion_tag('partials/oig-most-recent.html')
def oig_most_recent():
    # From all of the live DocumentPage items,
    # get the four most recent that are in one of the OIG categories
    docs = DocumentPage.objects.filter(
        category__in=constants.report_category_groups['oig']
    ).order_by('-last_published_at').live()[:4]

    return {
        'oig_most_recent': docs,
    }
