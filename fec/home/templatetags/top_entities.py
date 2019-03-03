from django import template
from data import constants

import datetime
from django.conf import settings
from data import api_caller
from data import constants
from data import utils

register = template.Library()

@register.inclusion_tag("home/raising-bythenumbers-home.html")
def raising(request):

    validListUrlParamValues = ['P', 'S', 'H', 'pac', 'party']
    # INITIALLY USED BY raising() AND spending() FOR VALIDATING URL PARAMETERS, THE list URL PARAM


    top_category = request.GET.get('top_category', 'P')

    # IGNORING INVALID list URL PARAMETERS
    if request.GET.get('list') and request.GET.get('list') in validListUrlParamValues:
        top_category = request.GET.get('list')
        # IF A VALID list VALUE EXISTS, WE'LL LET IT OVERRIDE top_category

    cycles = utils.get_cycles(utils.current_cycle())
    cycle = int(request.GET.get('cycle', constants.DEFAULT_TIME_PERIOD))

    if top_category in ['pac']:
        top_raisers = api_caller.load_top_pacs('-receipts', cycle=cycle, per_page=3)
    elif top_category in ['party']:
        top_raisers = api_caller.load_top_parties('-receipts', cycle=cycle, per_page=3)
    else:
        top_raisers = api_caller.load_top_candidates(
            '-receipts', office=top_category, cycle=cycle, per_page=3
        )

    if cycle == datetime.datetime.today().year:
        coverage_end_date = datetime.datetime.today()
    else:
        coverage_end_date = datetime.date(cycle, 12, 31)

    page_info = top_raisers['pagination']

    #embed = request.GET.get('embed')
    #embed = request.GET.get('embed', '').replace('/', '')

    return {
        'parent': 'data',
        'title': 'Raising: by the numbers',
        'top_category': top_category,
        'coverage_start_date': datetime.date(cycle - 1, 1, 1),
        'coverage_end_date': coverage_end_date,
        'cycles': cycles,
        'cycle': cycle,
        'top_raisers': top_raisers['results'],
        'page_info': utils.page_info(top_raisers['pagination']),
        'office': top_category,
        'per_page':3
      }
