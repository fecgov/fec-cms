from django.conf import settings

def show_settings(request):
    return {'settings': settings}
