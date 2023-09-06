import json
import re

from django import template
from django.conf import settings
from django.templatetags.static import static
from django.utils.html import format_html
from wagtail.models import Page

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
def prepend_non_digit(string):
    """
    Prepends non-digit-containing string.
    Useful in combination with built-in slugify in order to create strings
    from titles that can be used as HTML IDs, which cannot begin with digits.
    """
    if string[:1].isdigit():
        string = "go-to-{0}".format(string)
    return string


@register.filter()
def web_app_url(path):
    """
    Appends a path to the web app URL as defined in the settings
    This is useful for StaticBlocks, which don't have access to the entire context
    """
    return "{}{}".format(settings.FEC_APP_URL, path)


@register.filter()
def highlight_matches(text):
    """
    Replaces the highlight markers with span tags for Search.gov website search results.
    Because format_html uses str.format, remove { and } because they are special characters.
    """
    cleaned_text = text.replace("{", "").replace("}", "")
    highlighted_text = cleaned_text.replace(
        "\ue000", '<span class="t-highlight">'
    ).replace("\ue001", "</span>")

    return format_html(highlighted_text)


@register.filter(name='splitlines')
def splitlines(value):
    """
    Returns the value turned into a list.
    """
    return value.splitlines()


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
    Returns a meta description for social media
    """
    return 'Find what you need to know about the federal campaign finance process. \
        Explore legal resources, campaign finance data, help for candidates and committees, and more.'


@register.simple_tag
def asset_for_js(path):
    """Looks up the hashed asset path in rev-manifest-js.json
    If the path doesn't exist there, then just return the path to the static file
    without a hash"""

    key = '/static/js/{}'.format(path)
    assets = json.load(open(settings.DIST_DIR + '/fec/static/js/rev-manifest-js.json'))

    return assets[key] if key in assets else key


@register.simple_tag
def asset_for_css(key):
    """Looks up the hashed asset key in rev-manifest-css.json
    If the key doesn't exist there, then just return the key to the static file
    without a hash"""

    assets = json.load(open(settings.DIST_DIR + '/fec/static/css/rev-manifest-css.json'))

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


@register.filter(name='dot_or_not')
def dot_or_not(str):
    """
    Puts dot-after, only if string represemts a number
    Specifically for footnote lists on ReportingDatesTables
    """
    try:
        int(str)
        return '.'
    except ValueError:
        return ''


@register.filter(name='get_social_image_path')
def get_social_image_path(identifier):
    # """
    # Returns a path to a social image for the given content section
    # TODO: combine with fec/data/templatetags/filters.py ?
    # Called by meta-tags.html
    # """
    imageFilename = identifier

    if identifier == 'advisory-opinions':
        imageFilename = 'fec-pen'
    elif identifier in ['commission-meetings', 'meeting-page']:
        imageFilename = 'fec-microphones'
    elif identifier == 'press-release':
        imageFilename = 'fec-microphone'
    elif identifier == 'weekly-digest':
        imageFilename = 'fec-seal'
    elif identifier == 'data':
        imageFilename = 'fec-data'
    elif identifier in ['legal', 'help']:
        imageFilename = 'fec-' + identifier
    else:
        imageFilename = 'fec-logo'
    return 'https://www.fec.gov/static/img/social/{}.png'.format(imageFilename)


@register.filter(name='get_file_type')
def get_file_type(value):
    file_extension = value.rsplit('.', 1)[1].upper()
    xl = (file_extension == 'XLS') or (file_extension == 'XLSX')
    file_type = "EXCEL" if xl else file_extension

    return file_type
