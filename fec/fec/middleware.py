from django.utils.deprecation import MiddlewareMixin
from django.conf import settings


class AddSecureHeaders(MiddlewareMixin):
    """Add secure headers to each response"""

    def process_response(self, request, response):

        content_security_policy = {
            "default-src":
                "'self' *.fec.gov *.app.cloud.gov https://www.google-analytics.com",
            "frame-src":
                "'self' https://www.google.com/recaptcha/ https://www.youtube.com/",
            "img-src":
                "'self' *.fec.gov *.app.cloud.gov data: https://*.ssl.fastly.net \
                https://www.google-analytics.com https://www.googletagmanager.com",
            "script-src":
                "'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com/recaptcha/ \
                https://www.gstatic.com/recaptcha/ https://www.google-analytics.com \
                https://www.googletagmanager.com https://polyfill.io \
                https://dap.digitalgov.gov",
            "style-src": "'self' data: 'unsafe-inline'",
            "object-src": "'none'",
        }
        if settings.FEC_CMS_ENVIRONMENT == 'LOCAL':
            content_security_policy["default-src"] += " localhost:* http://127.0.0.1:*"
        # Skip CSP reporting in production so we don't clutter up the logs
        if settings.FEC_CMS_ENVIRONMENT != 'PRODUCTION':
            # Report violations to the API
            report_uri = "{0}/report-csp-violation/?api_key={1}".format(
                settings.FEC_API_URL, settings.FEC_API_KEY_PUBLIC
            )
            content_security_policy["report-uri"] = report_uri

        response["Content-Security-Policy"] = "".join(
            "{0} {1}; ".format(directive, value)
            for directive, value in content_security_policy.items()
        )
        response["cache-control"] = "max-age=600"
        return response
