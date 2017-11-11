import re

from django import template
from django.conf import settings
from home.models import RecordPage

register = template.Library()

@register.inclusion_tag('partials/legal-news.html')
def legal_news_feed():
    # get one of each update type (not featured)

    records = RecordPage.objects.live().filter(homepage_hide=False, homepage_pin=False).order_by('-date')[:4]

    return {
        'records': records
    }