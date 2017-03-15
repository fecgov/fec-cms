from django import template
from itertools import chain
from operator import attrgetter

from django.conf import settings
from home.models import DocumentPage, ResourcePage
from wagtail.wagtailcore.models import Page, Orderable

register = template.Library()

def get_documents(page, year='', category=''):
    documents = DocumentPage.objects.child_of(page).live().order_by('-date')

    if year:
      documents = documents.filter(date__year=year)

    if category:
        documents = documents.filter(category=category)

    return documents

def get_resource_pages(page, year='', category=''):
    resource_pages = ResourcePage.objects.child_of(page).live()

    return resource_pages

@register.inclusion_tag('partials/document-feed.html')
def document_feed(page, request):
    """
    Queries for all DocumentPages that are childern of the current page
    and optionally filters by year if it was passed in the request
    """

    year = request.GET.get('year', '')
    category = request.GET.get('category', '')
    documents = get_documents(page, year=year, category=category)
    resource_pages = get_resource_pages(page, year=year, category=category)
    all_documents = sorted(
      chain(documents, resource_pages),
      key=attrgetter('date'),
      reverse=True
    )

    return {
      'documents': all_documents
    }
