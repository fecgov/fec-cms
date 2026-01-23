from django import template
from home.models import CourtCasePage, court_case_sort_key

register = template.Library()


@register.inclusion_tag('partials/selected-court-cases.html')
def selected_court_cases():
    """Get all selected court cases"""
    selected_cases = list(CourtCasePage.objects.filter(
        selected_court_case=True
    ).live())
    # Sort alphabetically, then by case numbers (higher first) for same titles
    selected_cases.sort(key=lambda c: court_case_sort_key(c))

    return {
        'selected_cases': selected_cases,
    }
