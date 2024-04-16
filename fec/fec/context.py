from django.conf import settings


def features(request):
    return {'features': settings.FEATURES}


def show_settings(request):
    return {'settings': settings}


def api_key(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    # Default to public key
    api_key = settings.FEC_API_KEY_PUBLIC
    # Check if X-Forwarded-For header matches internal IP
    if x_forwarded_for == settings.FEC_INTERNAL_IP:
        # Override API token with internal key
        api_key = settings.FEC_INTERNAL_API_KEY_PUBLIC
    return {'API_KEY_PUBLIC': api_key}
