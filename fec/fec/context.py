from django.conf import settings

def features(request):
    return {'features': settings.FEATURES}

def show_settings(request):
    return {'settings': settings}
