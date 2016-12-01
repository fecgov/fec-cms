import re

from django import template
from django.utils.html import format_html

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
