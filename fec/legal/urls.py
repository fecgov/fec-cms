from django.urls import re_path
from django.views.generic.base import RedirectView
from django.conf import settings

from legal import views

urlpatterns = [
    re_path(r'^data/legal/advisory-opinions/(?P<ao_no>[\w-]+)/$',
            views.advisory_opinion_page),
    re_path(r'^data/legal/advisory-opinions/$', views.advisory_opinions_landing),
    re_path(r'^data/legal/matter-under-review/(?P<mur_no>[\w-]+)/$',
            views.mur_page),
    re_path(r'^data/legal/alternative-dispute-resolution/(?P<adr_no>[\w-]+)/$',
            views.adr_page),
    re_path(r'^data/legal/administrative-fine/(?P<admin_fine_no>[\w-]+)/$',
            views.admin_fine_page),
    re_path(r'^data/legal/statutes/$', views.statutes_landing),
    # Legal search results
    re_path(r'^data/legal/search/$', views.legal_search),

    re_path(r'^data/legal/search/advisory-opinions/$', views.legal_doc_search_ao),
    re_path(r'^data/legal/search/enforcement/$', views.legal_doc_search_mur),
    re_path(r'^data/legal/search/murs/$', views.legal_doc_search_mur),
    re_path(r'^data/legal/search/regulations/$',
            views.legal_doc_search_regulations),
    re_path(r'^data/legal/search/statutes/$', views.legal_doc_search_statutes),
    re_path(r'^data/legal/api/create-submission/', views.create_submission, name='create_submission'),
]

if settings.FEATURES['adrs']:
    urlpatterns += re_path(
        r'^data/legal/search/adrs/$', views.legal_doc_search_adr
    ),

if settings.FEATURES['afs']:
    urlpatterns += [
        # Redirect from `admin_fines` to `admin-fines`
        re_path(
            r'^data/legal/search/admin_fines/$',
            RedirectView.as_view(url='/data/legal/search/admin-fines/', query_string=True)
        ),
        # The actual `admin-fines` view
        re_path(
            r'^data/legal/search/admin-fines/$', views.legal_doc_search_af
        ),
    ]
