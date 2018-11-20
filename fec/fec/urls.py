from django.conf.urls import include, url
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
    url(r'^documents/(\d+)/(.*)$', home_views.serve_wagtail_doc, name='wagtaildocs_serve'),
    url(r'^auth/', include(uaa_urls)),
    url(r'^admin/', include(wagtailadmin_urls)),
    url(r'^calendar/$', home_views.calendar),
    url(r'^about/leadership-and-structure/commissioners/$', home_views.commissioners),
    url(r'^documents/', include(wagtaildocs_urls)),
    url(r'^help-candidates-and-committees/question-rad/$', home_views.contact_rad),
    url(r'^help-candidates-and-committees/guides/$', home_views.guides),
    url(r'^meetings/$', home_views.index_meetings, name="meetings_page"),
    url(r'^search/$', search_views.search, name='search'),
    url(r'^updates/$', home_views.updates),
    url(r'', include('data.urls')),  # URLs for /data
    url(r'', include('legal.urls')),  # URLs for legal pages
    url(r'', include(wagtail_urls)),
    url(r'^code\.json$',
        TemplateView.as_view(
            template_name='code.json'
        )
    )
]

if settings.FEC_CMS_ENVIRONMENT != 'LOCAL':
    #admin/login always must come before admin/, so place at beginning of list
    urlpatterns.insert(0,url(r'^admin/login', uaa_views.login, name='login'))


if settings.FEC_CMS_ENVIRONMENT != 'PRODUCTION':
    urlpatterns += url(
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

    #hide django-admin unless DEBUG=True
    urlpatterns.insert(1,url(r'^django-admin/', include(admin.site.urls)))
