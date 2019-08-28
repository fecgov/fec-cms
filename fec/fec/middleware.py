from django.utils.deprecation import MiddlewareMixin
from django.conf import settings


class AddSecureHeaders(MiddlewareMixin):
    """Add secure headers to each response"""

    def process_response(self, request, response):

        content_security_policy = {
            "default-src": "'self' data: *.fec.gov *.app.cloud.gov https://www.google-analytics.com",
            "frame-src": "'self' https://www.google.com",
            "img-src": "'self' data: http://*.fastly.net https://www.google-analytics.com",
            "script-src": "'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.google-analytics.com https://www.gstatic.com https://polyfill.io https://dap.digitalgov.gov",
            "style-src": "'self' data: 'unsafe-inline'"
        }
        if settings.FEC_CMS_ENVIRONMENT == settings.ENVIRONMENTS.get('local'):
            content_security_policy["default-src"] += " localhost:* http://127.0.0.1:*"

        response["Content-Security-Policy"] = "".join(
            "{0} {1}; ".format(directive, value)
            for directive, value in content_security_policy.items()
        )
        response["cache-control"] = "max-age=600"
        return response
