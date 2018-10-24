from django.conf.urls import url
from django.conf import settings

from legal import views

urlpatterns = [
    url(r'^data/legal/advisory-opinions/(?P<ao_no>[\w-]+)/$',
        views.advisory_opinion_page),
    url(r'^data/legal/advisory-opinions/$', views.advisory_opinions_landing),
    url(r'^data/legal/matter-under-review/(?P<mur_no>[\w-]+)/$',
        views.mur_page),
    url(r'^data/legal/statutes/$', views.statutes_landing),
    # Legal search results
    url(r'^data/legal/search/$', views.legal_search),

    url(r'^data/legal/search/advisory-opinions/$', views.legal_doc_search_ao),
    url(r'^data/legal/search/enforcement/$', views.legal_doc_search_mur),
    url(r'^data/legal/search/murs/$', views.legal_doc_search_mur),
    url(r'^data/legal/search/regulations/$',
        views.legal_doc_search_regulations),
    url(r'^data/legal/search/statutes/$', views.legal_doc_search_statutes),
]

if settings.FEATURES['adrs']:
    urlpatterns += url(
        r'^data/legal/search/adrs/$', views.legal_doc_search_adr
    ),

