from django.utils.deprecation import MiddlewareMixin
from django.conf import settings


class AddSecureHeaders(MiddlewareMixin):
    """Add secure headers to each response"""

    def process_response(self, request, response):

        content_security_policy = {
            # 'data:' is like 'http:'
            "default-src": "\
                'self' \
                *.fec.gov \
                *.app.cloud.gov \
            ",
            "connect-src": "\
                'self' \
                *.fec.gov \
                *.app.cloud.gov \
                https://www.google-analytics.com \
            ",
            "font-src": "\
                'self' \
            ",
            "frame-src": "\
                'self' \
                https://www.google.com/recaptcha/ \
                https://www.youtube.com/ \
            ",
            "img-src": "\
                'self' \
                *.fec.gov \
                *.app.cloud.gov \
                data: \
                https://*.ssl.fastly.net \
                https://www.google-analytics.com \
            ",
            "script-src": "\
                'self' \
                'unsafe-inline' \
                'unsafe-eval' \
                https://www.google.com/recaptcha/ \
                https://ssl.google-analytics.com \
                https://www.google-analytics.com \
                https://www.googletagmanager.com \
                https://www.gstatic.com/recaptcha/ \
                https://polyfill.io \
                https://dap.digitalgov.gov \
            ",  # do we need unsafe-eval? (Doesn't it only allow 'eval()'?)
            "style-src": "\
                'self' \
                'unsafe-inline' \
                data: \
            ",
            "object-src": "\
                'none' \
            "
            # Google's requirements found at https://developers.google.com/tag-manager/web/csp
            # TODO: Do we have a way to handle reporting CSP violations,
            # TODO: like this https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#Enabling_reporting
            #
            # TODO: To get away from unsafe-inline, we could look into hashing our inline script elements:
            # TODO: like this https://content-security-policy.com/hash/
        }
        if settings.FEC_CMS_ENVIRONMENT == 'LOCAL':
            content_security_policy["default-src"] += " localhost:* http://127.0.0.1:*"  # TODO: add filesystem?

        if settings.FEC_CMS_ENVIRONMENT != 'PRODUCTION':  # pre-prod environments
            content_security_policy["script-src"] += " https://tagmanager.google.com"
            content_security_policy["style-src"] += " https://tagmanager.google.com https://fonts.googleapis.com"
            content_security_policy["img-src"] += " https://ssl.gstatic.com https://www.gstatic.com"
            content_security_policy["font-src"] += " https://fonts.gstatic.com data:"

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
