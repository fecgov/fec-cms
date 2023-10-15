from django.urls import include, re_path
from django.conf import settings
from django.contrib import admin
from django.views.generic.base import TemplateView

from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls
from wagtail import urls as wagtail_urls
from uaa_client import urls as uaa_urls
from uaa_client import views as uaa_views

from wagtail.contrib.sitemaps.views import sitemap

from home import views as home_views
from search import views as search_views

# ############# NEW ############
import re
from itertools import chain
from django.contrib.sitemaps import Sitemap
from wagtail.documents.models import Document
from wagtail.models import Page
from home.models import DocumentPage, DocumentFeedPage, ResourcePage

# ############# /END NEW ############

urlpatterns = [
    re_path(
        r'^documents/(\d+)/(.*)$',
        home_views.serve_wagtail_doc,
        name='wagtaildocs_serve',
    ),
    re_path(r'^auth/', include(uaa_urls)),
    re_path(r'^admin/', include(wagtailadmin_urls)),
    re_path(r'^sitemap-wagtail\.xml/$', sitemap),
    re_path(r'^calendar/$', home_views.calendar),
    re_path(r'^about/leadership-and-structure/commissioners/$',
            home_views.commissioners),
    re_path(r'^documents/', include(wagtaildocs_urls)),
    re_path(r'^help-candidates-and-committees/question-rad/$',
            home_views.contact_rad),
    re_path(r'^help-candidates-and-committees/guides/$', home_views.guides),
    re_path(r'^meetings/$', home_views.index_meetings, name="meetings_page"),
    re_path(r'^search/$', search_views.search, name='search'),
    re_path(r'^legal-resources/policy-and-other-guidance/guidance-documents/$',
            search_views.policy_guidance_search,
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


# ########### NEW ################

class FormsSitemap(Sitemap):
    changefreq = "never"
    priority = 0.5
    protocol = 'https'

    def items(self):
        return Document.objects.filter(file__icontains="fecfrm")

    def location(self, obj):
        # WORKS BUT: WORKS LOCALLY RESOLVING TO `MEDIA`, TEST ON DEV TO SEE IF IT RESOLVES TO `DEFAULT_FILE_STORAGE`
        # UPDATE^^: RETURNS THIS ON DEV: \
        # `https://dev.fec.govhttps://fec-dev-proxy.app.cloud.gov/resources/cms-content/documents/fecfrm2sf.pdf`
        # return obj.file.url

        # WORKS: RETURNS JUST THE FILE THEN CONCATENATES THE PATH TO IT
        # return '/resources/cms_content/'+str(obj.file)
        # return str(obj.file).replace('documents/', '/resources/cms_content/documents/')

        # WORKS: THIS ONE REMOVES THE `https://fec-dev-proxy.app.cloud.gov` , TESTED ON DEV
        loc = re.sub(r'^[^:]+:\/\/[^/?#]+', '', obj.file.url)
        return loc

    def lastmod(self, obj):
        return obj.created_at


urlpatterns += [

    re_path(
        r'^sitemap-forms\.xml/$',
        sitemap,
        {"sitemaps": {'forms': FormsSitemap()}},
        name="django.contrib.sitemaps.views.sitemap",
    ),
]

# #################


class ReportsSitemap(Sitemap):
    changefreq = "never"
    priority = 0.5
    protocol = 'https'

    def items(self):
        #return DocumentPage.objects.live()
        #return DocumentFeedPage.objects.get_children()

        docfeeds = DocumentFeedPage.objects.live()

        reports = []
        for pg in docfeeds:
            rpts =  DocumentPage.objects.live().descendant_of(pg, inclusive=False) ##or child_of()
            #pgs = ResourcePage.objects.descendant_of(pg, inclusive=False) ##or child_of()
            reports.extend(list(rpts))

        return reports

    def location(self, obj):
        # loc = obj.file_url.replace('https://www.fec.gov', '') if obj.file_url else obj.url_path.replace('/home', '')
        # loc = re.sub(r'https:\/\/(www|beta)\.fec\.gov', '', obj.file_url) \
        #     if obj.file_url \
        #     else obj.url_path.replace('/home', '')

        # 'http://127.0.0.1:8000https://www.fec.gov/resources/cms-content/documents/2012WorkPlan.pdf'
        
        #if hasattr(obj, 'file_url'):
        if obj.file_url:
            loc = re.sub(r'https:\/\/(www|beta)\.fec\.gov', '', obj.file_url) 
        else: 
            loc = obj.url_path.replace('/home', '')

        return loc

    def lastmod(self, obj):
        return obj.latest_revision_created_at

    # Not a thing
    def description(self, obj):
        return obj.page_title


urlpatterns += [

    re_path(
        r'^sitemap-reports\.xml/$',
        sitemap,
        {"sitemaps": {'reports': ReportsSitemap()}},
        name="django.contrib.sitemaps.views.sitemap",
    ),
]

# ################# /END NEW ################


if settings.FEC_CMS_ENVIRONMENT != 'LOCAL':
    # admin/login always must come before admin/, so place at beginning of list
    urlpatterns.insert(0, re_path(r'^admin/login', uaa_views.login, name='login'))

# robots.txt configurations vary depending on environment
if settings.FEC_CMS_ENVIRONMENT != 'PRODUCTION':
    urlpatterns += re_path(
        r'^robots\.txt$',
        TemplateView.as_view(
            template_name='robots.txt',
            content_type='text/plain'
        ),
    ),
elif settings.FEC_CMS_ENVIRONMENT == 'PRODUCTION':
    urlpatterns += re_path(
        r'^robots\.txt$',
        TemplateView.as_view(
            template_name='robots_prod.txt',
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
