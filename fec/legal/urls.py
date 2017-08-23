from django.conf.urls import url

from legal import views

print('legal urls')

urlpatterns = [
    url(r'^data/legal/advisory-opinions/(?P<ao_no>[\w-]+)/$', views.advisory_opinion_page),
    url(r'^data/legal/advisory-opinions/$', views.advisory_opinions_landing),
    url(r'^data/legal/advisory_opinions/$', views.advisory_opinions_landing),
    url(r'^data/legal/matter-under-review/(?P<mur_no>[0-9]+)/$', views.mur_page),
    url(r'^data/legal/search/advisory_opinions/$', views.legal_doc_search_ao),
    url(r'^data/legal/search/enforcement/$', views.legal_doc_search_mur),
    url(r'^data/legal/search/murs/$', views.legal_doc_search_mur),
    url(r'^data/legal/search/regulations/$', views.legal_doc_search_regulations),
    url(r'^data/legal/search/statutes/$', views.legal_doc_search_statutes),
    url(r'^data/legal/statutes/$', views.statutes_landing),
]
