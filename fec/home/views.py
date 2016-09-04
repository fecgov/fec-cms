from django.shortcuts import render
from home.models import DigestPage
from home.models import RecordPage
from home.models import PressReleasePage

def updates(request):
    digests = DigestPage.objects.all()
    records = RecordPage.objects.all()
    press_releases = PressReleasePage.objects.all()

    return render(request, 'home/latest_updates.html', {
        'digests': digests,
        'records': records,
        'press_releases' : press_releases,
    })
