
from django import template
import requests
from django.conf import settings
from django.conf import os
import dateutil.parser

register = template.Library()

@register.inclusion_tag('partials/jobs.html')
def get_jobs():
    url = "https://data.usajobs.gov/api/Search"

    querystring = {"Organization":"LF00","WhoMayApply":"All"}
    headers = {
        'authorization-key': settings.USAJOBS_API_KEY,  
        'user-agent': "jcarroll@fec.gov",
        'host': "data.usajobs.gov",
        'cache-control': "no-cache",
        }
    
    response = requests.request("GET", url, headers=headers, params=querystring)

    responses=response.json()    

    jobData = []
    for i in responses['SearchResult']['SearchResultItems']:
        x= {}
        x = { "PositionTitle": i["MatchedObjectDescriptor"]["PositionTitle"] , 
        "PositionID": i["MatchedObjectDescriptor"]["PositionID"], "PositionURI": i ["MatchedObjectDescriptor"]["PositionURI"],
        "PositionStartDate" : dateutil.parser.parse(i['MatchedObjectDescriptor']['PositionStartDate']),
        "PositionEndDate" : dateutil.parser.parse(i['MatchedObjectDescriptor']['PositionEndDate']),
        "WhoMayApply" : i['MatchedObjectDescriptor']['UserArea']['Details']['WhoMayApply']['Name'],
        "JobGrade" : i['MatchedObjectDescriptor']['JobGrade'][0]['Code'],
        "LowGrade" : i['MatchedObjectDescriptor']['UserArea']['Details']['LowGrade'],
        "HighGrade" : i['MatchedObjectDescriptor']['UserArea']['Details']['HighGrade'] }
        jobData.append(x)

    return ({'jobData':jobData})


