from django import template
from django.conf import settings
from django.conf import os
from home.models import *

register = template.Library()

# contrubution limits table snippet
@register.inclusion_tag('partials/contribution_limits_table.html', takes_context=True)
def get_contribution_limits(context):
    return {
        'Contribution_limits': ContributionLimitsChart.objects.all(),
    }