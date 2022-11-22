from django.urls import include, re_path
from django.conf import settings
from django.contrib import admin
from django.views.generic.base import TemplateView

from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls
from wagtail.core import urls as wagtail_urls
from uaa_client import urls as uaa_urls
from uaa_client import views as uaa_views

from home import views as home_views
from search import views as search_views


urlpatterns = [
    re_path(
        r'^documents/(\d+)/(.*)$',
        home_views.serve_wagtail_doc,
        name='wagtaildocs_serve',
    ),
    re_path(r'^auth/', include(uaa_urls)),
    re_path(r'^admin/', include(wagtailadmin_urls)),
    re_path(r'^calendar/$', home_views.calendar),
    re_path(r'^about/leadership-and-structure/commissioners/$', home_views.commissioners),
    re_path(r'^documents/', include(wagtaildocs_urls)),
    re_path(r'^help-candidates-and-committees/question-rad/$', home_views.contact_rad),
    re_path(r'^help-candidates-and-committees/guides/$', home_views.guides),
    re_path(r'^meetings/$', home_views.index_meetings, name="meetings_page"),
    re_path(r'^search/$', search_views.search, name='search'),
    re_path(r'^legal-resources/policy-and-other-guidance/guidance-documents/$', search_views.policy_guidance_search,
        name='policy-guidance-search'),
    re_path(r'^updates/$', home_views.updates),
    re_path(r'', include('data.urls')),  # URLs for /data
    re_path(r'', include('legal.urls')),  # URLs for legal pages
    re_path(r'', include(wagtail_urls)),
    re_path(
        r'^code\.json$',
        TemplateView.as_view(
            template_name='code.json', content_type="application/json"
        ),
    ),
    re_path(
        r'^data\.json$',
        TemplateView.as_view(
            template_name='data.json', content_type="application/json"
        ),
    ),
]


if settings.FEC_CMS_ENVIRONMENT != 'LOCAL':
    # admin/login always must come before admin/, so place at beginning of list
    urlpatterns.insert(0, re_path(r'^admin/login', uaa_views.login, name='login'))

if settings.FEC_CMS_ENVIRONMENT != 'PRODUCTION':
    urlpatterns += re_path(
        r'^robots\.txt$',
        TemplateView.as_view(
            template_name='robots.txt',
            content_type='text/plain'
        ),
    ),


if settings.DEBUG:
    from django.conf.urls.static import static
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    # Serve static and media files from development server
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    # hide django-admin unless DEBUG=True
    urlpatterns.insert(1, re_path(r'^django-admin/', admin.site.urls))

handler500 = 'home.views.error_500'
