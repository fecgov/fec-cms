from django.conf import settings


def features(request):
    return {'features': settings.FEATURES}


def show_settings(request):
    return {'settings': settings}


def api_key(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    # Default to public key
    api_key = settings.FEC_API_KEY_PUBLIC

    # Update API_KEY based on X-Forwarded-For header value
    if x_forwarded_for:
        ip_list = [ip.strip() for ip in x_forwarded_for.split(',')]
        if settings.FEC_INTERNAL_IP in ip_list:
            api_key = settings.FEC_INTERNAL_API_KEY_PUBLIC

    return {'API_KEY_PUBLIC': api_key}
