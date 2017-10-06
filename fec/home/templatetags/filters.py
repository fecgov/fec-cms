import json
import os
import re

from django import template
from django.conf import settings
from django.templatetags.static import static
from django.utils.html import conditional_escape, format_html
from django.utils.safestring import mark_safe
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


@register.filter()
def highlight_matches(text):
    """Replaces the highlight markers with span tags for digitalgov search results"""
    highlighted_text = text.replace('\ue000', '<span class="t-highlight">').replace('\ue001', '</span>')
    return mark_safe(highlighted_text)


@register.filter(name='splitlines')
def splitlines(value):
    """
        Returns the value turned into a list.
    """
    return value.splitlines()


@register.filter(name='get_social_image')
def get_social_image(content_section):
    """
    Returns a path to a social iamge for the given content section
    """
    if content_section in ['legal', 'help']:
        return static('img/social/{}.png'.format(content_section))
    else:
        return static('img/social/general.png')


@register.filter(name='get_touch_icon')
def get_touch_icon(content_section, dimension):
    """
    Returns a path to a touch icon for the given dimension and content_section
    """
    if content_section in ['legal', 'help']:
        return static('img/favicon/{}/apple-touch-icon-{}.png'.format(content_section, dimension))
    else:
        return static('img/favicon/general/apple-touch-icon-{}.png'.format(dimension))


@register.filter(name='get_meta_description')
def get_meta_description(content_section):
    """
    Returns a meta description based on the parent section
    """
    if content_section == 'help':
        return 'Learn how individuals and groups can be active in federal elections. The new fec.gov organizes reporting and compliance guidance by the type of committee you’re researching, so you can find what you need right away.'
    if content_section == 'legal':
        return 'Clarify campaign finance legal requirements on the new fec.gov. Search across advisory opinions, Matters Under Review, statutes, and regulations all at once, with search results designed to help you find what you need quickly.'
    else:
        return 'The new fec.gov makes it easier than ever to find what you need to know about the federal campaign finance process. Explore legal resources, campaign finance data, help for candidates and committees, and more.'


@register.simple_tag
def asset_for_js(path):
    """Looks up the hashed asset path in rev-manifest-js.json
    If the path doesn't exist there, then just return the path to the static file
    without a hash"""

    key = '/static/js/{}'.format(path)
    assets = json.load(open('./dist/fec/static/js/rev-manifest-js.json'))

    return assets[key] if key in assets else key


@register.simple_tag
def asset_for_css(key):
    """Looks up the hashed asset key in rev-manifest-css.json
    If the key doesn't exist there, then just return the key to the static file
    without a hash"""

    assets = json.load(open('./dist/fec/static/css/rev-manifest-css.json'))

    if key in assets:
        return '/static/css/' + assets[key] 
    else:
        return key


@register.filter(name='remove_word')
def remove_word(str, words):
    """
    Removes a word or words from a string
    Returns a new string
    """
    return str.replace(words, '')
