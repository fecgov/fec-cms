from django.conf.urls import include, url
from django.conf import settings
from django.contrib import admin
from django.views.generic.base import TemplateView

from wagtail.wagtailadmin import urls as wagtailadmin_urls
from wagtail.wagtaildocs import urls as wagtaildocs_urls
from wagtail.wagtailcore import urls as wagtail_urls

from home import views as home_views
from search import views as search_views


urlpatterns = [
    url(r'^django-admin/', include(admin.site.urls)),

    url(r'^admin/', include(wagtailadmin_urls)),
    url(r'^calendar/$', home_views.calendar),
    url(r'^commissioners/$', home_views.commissioners),
    url(r'^about/leadership-and-structure/commissioners/$', home_views.commissioners),
    url(r'^contact-us/$', home_views.contact),
    url(r'^documents/', include(wagtaildocs_urls)),
    url(r'^legal/advisory-opinions/process/$', home_views.ao_process),
    url(r'^search/$', search_views.search, name='search'),
    url(r'^updates/$', home_views.updates),

    url(r'', include(wagtail_urls)),
]

if settings.FEC_CMS_ROBOTS:
    url(
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
