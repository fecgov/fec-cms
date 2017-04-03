import re

from django.conf import settings
from django import template
from django.utils.html import format_html
from wagtail.wagtailcore.models import Page

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
def child_page_count(page):
  """Returns the number of pages that are children of a particular page"""
  count = Page.objects.child_of(page).live().count()
  return "{} {}".format(count, 'result' if count == 1 else 'results')

@register.filter()
def remove_digits(string):
  """
  Strips digits from a string
  Useful in combination with built-in slugify in order to create strings
  that can be used as HTML IDs, which cannot begin with digits
  """
  return re.sub('\d+', '', string)

@register.filter()
def web_app_url(path):
    """
    Appends a path to the web app URL as defined in the settings
    This is useful for StaticBlocks, which don't have access to the entire context
    """
    return "{}{}".format(settings.FEC_APP_URL, path)

@register.filter()
def classic_url(path):
    """
    Appends a path to the classic FEC.gov url as defined in the settings
    """
    return "{}{}".format(settings.FEC_CLASSIC_URL, path)
