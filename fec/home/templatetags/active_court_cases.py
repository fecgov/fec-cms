from django import template
from home.models import CourtCasePage, court_case_sort_key

register = template.Library()


@register.inclusion_tag('partials/active-court-cases.html')
def active_court_cases():
    """Get all active court cases (ongoing litigation)"""
    active_cases = list(CourtCasePage.objects.filter(
        status='active'
    ).live())
    # Sort alphabetically, then by case numbers (higher first) for same titles
    active_cases.sort(key=lambda c: court_case_sort_key(c))

    return {
        'active_cases': active_cases,
    }
