from django.shortcuts import render
def get_jobs(request):
    from django.http import HttpResponse
    import requests
    import json
    from datetime import datetime
    import dateutil.parser
    url = "https://data.usajobs.gov/api/Search"

    querystring = {"Organization":"PU00","WhoMayApply":"All"}

    headers = {
        'authorization-key': "ZQbNd1iLrQ+rPN3Rj2Q9gDy2Qpi/3haXSXGuHbP1SRk=",
        'user-agent': "jcarroll@fec.gov",
        'host': "data.usajobs.gov",
        'cache-control': "no-cache",

        }

    response = requests.request("GET", url, headers=headers, params=querystring)


    responses=response.json()



    with open('usajobs/templates/fec_jobs_list.html', 'w') as joblist:

        
        if responses['SearchResult']['SearchResultItems']:
            joblist.write("<ul>")
            for i in responses['SearchResult']['SearchResultItems']:
                start_date = dateutil.parser.parse(i['MatchedObjectDescriptor']['PositionStartDate'])
                end_date = dateutil.parser.parse(i['MatchedObjectDescriptor']['PositionEndDate'])
                joblist.write("<li>")
                joblist.write("<h3><a href='" + i['MatchedObjectDescriptor']['PositionURI'] + "'>" + i['MatchedObjectDescriptor']['PositionID'] + ", " + i['MatchedObjectDescriptor']['PositionTitle'] + "</a></h3>")
                joblist.write("<ul>")
                joblist.write("<li class='t-sans'><strong>Open Period:</strong> "+ start_date.strftime('%b %d, %Y')+ " - " + end_date.strftime('%b %d, %Y')+ "</li>")
                joblist.write("<li class='t-sans'><strong>Who May Apply:</strong> "+ i['MatchedObjectDescriptor']['UserArea']['Details']['WhoMayApply']['Name'] + "</li>")
                joblist.write("<li class='t-sans'><strong>Grade:</strong> "+  i['MatchedObjectDescriptor']['JobGrade'][0]['Code'] + "-" + i['MatchedObjectDescriptor']['UserArea']['Details']['LowGrade']+ " - " + i['MatchedObjectDescriptor']['UserArea']['Details']['HighGrade'] + "</li>")
                joblist.write("</ul>")
                joblist.write("</li><br>")

            joblist.write("</ul>")

        else:
            joblist.write("There are currently no open positions available. Please check back on this page or Job Announcements on <a href='https://www.usajobs.gov/' title='USAJobs website'>USAJOBs</a> for the latest FEC Vacancy Announcements.")

    return render(request, 'jobs.html')
    #jobtable.close

    #return HttpResponse(jobtable)

