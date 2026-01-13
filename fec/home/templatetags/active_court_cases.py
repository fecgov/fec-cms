from django import template
from home.models import CourtCasePage

register = template.Library()


@register.inclusion_tag('partials/active-court-cases.html')
def active_court_cases():
    """Get all active court cases (ongoing litigation)"""
    active_cases = CourtCasePage.objects.filter(
        status='active'
    ).live().order_by('index_title', 'title')

    return {
        'active_cases': active_cases,
    }
