from django.utils.deprecation import MiddlewareMixin
from django.conf import settings


class SecurityHeaders(MiddlewareMixin):

    def process_response(self, request, response):

        if settings.FEC_CMS_ENVIRONMENT == settings.ENVIRONMENTS.get('local'):
            content_security_policy = ''\
                'default-src \'self\' data: *.fec.gov localhost:* http://127.0.0.1:* http://*.app.cloud.gov https://*.app.cloud.gov; '\
                'frame-src \'self\' https://www.google.com; '\
                'img-src \'self\' data: http://*.fastly.net;'\
                'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://www.google.com https://www.gstatic.com https://polyfill.io; '\
                'style-src \'self\' data: \'unsafe-inline\'; '
        else:
            content_security_policy = ''\
                'default-src \'self\' data: *.fec.gov; '\
                'frame-src \'self\' https://www.google.com;'\
                'img-src \'self\' data: http://*.fastly.net; '\
                'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://www.google.com https://www.gstatic.com https://polyfill.io https://dap.digitalgov.gov; '\
                'style-src \'self\' data: \'unsafe-inline\'; '
        response['Content-Security-Policy'] = content_security_policy
        response['cache-control'] = "max-age=600"
        return response
