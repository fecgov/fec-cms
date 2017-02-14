from django import template
from django.conf import settings
from home.models import DocumentPage

register = template.Library()

@register.inclusion_tag('partials/document-feed.html')
def document_feed(page, request):
    """
    Queries for all DocumentPages that are childern of the current page
    and optionally filters by year if it was passed in the request
    """

    year = request.GET.get('year', '')
    category = request.GET.get('category', '')
    documents = DocumentPage.objects.child_of(page).live().order_by('-date')

    if year:
      documents = documents.filter(date__year=year)

    if category:
        documents = documents.filter(category=category)

    return {
      'documents': documents
    }
