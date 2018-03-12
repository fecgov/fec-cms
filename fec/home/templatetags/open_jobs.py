
from django import template
import requests
import dateutil.parser

register = template.Library()

@register.inclusion_tag('partials/jobs.html')
def get_jobs():
    """query USAJobs for FEC jobs and hiring path code-list to cross reference agianst"""
    url = "https://data.usajobs.gov/api/Search"
    get_codes_url = "https://data.usajobs.gov/api/codelist/hiringpaths"

    querystring = {"Organization":"LF00", "WhoMayApply":"All"}
    headers = {
        'authorization-key': 'nPBInwg8jHzg4fjcxznoFxfAyp79RfOHG6s0mhEKU8Q=',
        'user-agent': "jcarroll@fec.gov",
        'host': "data.usajobs.gov",
        'cache-control': "no-cache",
        }

    response = requests.request("GET", url, headers=headers, params=querystring)

    responses = response.json()

    codes_response = requests.request("GET", get_codes_url, headers=headers, params=querystring)

    codes_responses = codes_response.json()

    jobData = []
    for i in responses['SearchResult']['SearchResultItems']:
        x = {
        "position_title": i["MatchedObjectDescriptor"]["PositionTitle"],
        "position_id": i["MatchedObjectDescriptor"]["PositionID"],
        "position_uri": i["MatchedObjectDescriptor"]["PositionURI"],
        "position_start_date" : dateutil.parser.parse(i['MatchedObjectDescriptor']['PositionStartDate']),
        "position_end_date" : dateutil.parser.parse(i['MatchedObjectDescriptor']['PositionEndDate']),
        "job_grade" : i['MatchedObjectDescriptor']['JobGrade'][0]['Code'],
        "low_grade" : i['MatchedObjectDescriptor']['UserArea']['Details']['LowGrade'],
        "high_grade" : i['MatchedObjectDescriptor']['UserArea']['Details']['HighGrade']
        }

        hiring_path_codes = codes_responses['CodeList'][0]['ValidValue']
        hiring_path = [item for item in i['MatchedObjectDescriptor']['UserArea']['Details']['HiringPath']]
        hp = []
        for k in hiring_path:
            hpa = [item for item in hiring_path_codes if item['Code'] == k.upper()]
            hp.append(hpa[0]['Value'])
            hiring_path_list = ', '.join(str(n) for n in hp)
            open_to = {'open_to':hiring_path_list}
        x.update(open_to)
        jobData.append(x)
    return {'jobData':jobData}
