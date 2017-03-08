import re

from django import template
from django.utils.html import format_html
from home.models import DocumentPage

register = template.Library()

@register.filter
def clean_whitespace(value):
    return re.sub(r'\s+', '-', value)

@register.filter
def lookup(dict, arg):
  return dict.get(arg, '')

@register.simple_tag()
def formatted_title(page):
  if hasattr(page, 'formatted_title'):
    if page.formatted_title:
      return format_html(page.formatted_title)
    else:
      return format_html(page.title)
  else:
    return page.title

@register.filter()
def districts(max):
  """Returns a list of numbers 1-100 for district filter"""
  districts = range(max)
  return districts

@register.filter()
def document_count(page):
  """Returns the number of DocumentPages for a particular category"""
  count = DocumentPage.objects.child_of(page).live().count()
  return "{} {}".format(count, 'result' if count == 1 else 'results')
