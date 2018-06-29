import dateutil.parser
import requests

from django import template
from django.conf import settings
from data import constants

register = template.Library()

@register.inclusion_tag('partials/audit-search.html')
def search_audits():
    findings = [item for item in constants.audit_primary_categories_options]
    return {'findings': findings }