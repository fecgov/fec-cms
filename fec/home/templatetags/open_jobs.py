import dateutil.parser

import requests

from django import template
from django.conf import settings


register = template.Library()

@register.inclusion_tag('partials/jobs.html')
def get_jobs():
    url = 'https://data.usajobs.gov/api/Search'
    codes_url = 'https://data.usajobs.gov/api/codelist/hiringpaths'
    querystring = {'Organization':'LF00','WhoMayApply':'All'}

    headers = {
        'authorization-key': settings.USAJOBS_API_KEY,
        'user-agent': 'jcarroll@fec.gov',
        'host': 'data.usajobs.gov',
        'cache-control': 'no-cache',
    }

    #query usajobs API for all open fec jobs
    response = requests.get(
        url,
        headers=headers,
        params=querystring
    )

    #query usajobs API for list of all hiring-path codes
    codes_response = requests.get(
        codes_url,
        headers=headers
    )

    responses = response.json()
    codes_responses = codes_response.json()

    jobData = []
    search_results = responses.get('SearchResult', {})

    #iterate over returned job data
    if 'SearchResultItems' in search_results:
        for result in search_results.get('SearchResultItems', None):
            matched_object_descriptor = result.get('MatchedObjectDescriptor', {})
            if matched_object_descriptor.get('JobGrade')[0]:
                job_grade = matched_object_descriptor.get('JobGrade', [])[0].get('Code', '')
            else:
                job_grade = ''

            jobs_dict = {
                'position_title': matched_object_descriptor.get('PositionTitle', ''),
                'position_id': matched_object_descriptor.get('PositionID', ''),
                'position_uri': matched_object_descriptor.get('PositionURI', ''),
                'position_start_date': dateutil.parser.parse(matched_object_descriptor.get('PositionStartDate', '')),
                'position_end_date': dateutil.parser.parse(matched_object_descriptor.get('PositionEndDate', '')),
                'job_grade' : job_grade,#'job_grade': matched_object_descriptor.get('JobGrade', [])[0].get('Code', ''),
                'low_grade': matched_object_descriptor.get('UserArea', {}).get('Details', {}).get('LowGrade', ''),
                'high_grade': matched_object_descriptor.get('UserArea', {}).get('Details', {}).get('HighGrade', '')
            }
            #map hiring-path code(s) for each job to description(s)
            hiring_path_codes = codes_responses.get('CodeList', [])[0].get('ValidValue')#codes_responses['CodeList'][0]['ValidValue']

            #hiring_path = [item for item in result['MatchedObjectDescriptor']['UserArea']['Details']['HiringPath']]
            hiring_path = [item for item in result.get('MatchedObjectDescriptor', {}).get('UserArea', {}).get('Details', {}).get('HiringPath', [])]
            hp = []
            for path in hiring_path:
                hpa = [item for item in hiring_path_codes if item['Code'] == path.upper()]
                hp.append(hpa[0].get('Value', ''))#(hpa[0]['Value'])
                hiring_path_list = ', '.join(str(n) for n in hp)
                open_to = {'open_to':hiring_path_list}
            jobs_dict.update(open_to)
            jobData.append(jobs_dict)

    return {'jobData': jobData }
