from django import template
from home.models import CourtCasePage

register = template.Library()


@register.inclusion_tag('partials/selected-court-cases.html')
def selected_court_cases():
    """Get all selected court cases"""
    selected_cases = CourtCasePage.objects.filter(
        selected_court_case=True
    ).live().order_by('index_title', 'title')

    return {
        'selected_cases': selected_cases,
    }
