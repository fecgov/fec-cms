from django.conf.urls import url

from legal import views

print('legal urls')

urlpatterns = [
    url(r'^data/legal/advisory-opinions/(?P<ao_no>[\w-]+)/$', views.advisory_opinion_page),
    url(r'^data/legal/advisory-opinions/$', views.advisory_opinions_landing),
    url(r'^data/legal/advisory_opinions/$', views.advisory_opinions_landing),
    url(r'^data/legal/search/advisory_opinions/$', views.legal_doc_search),
    url(r'^data/legal/statutes/$', views.statutes_landing),
]
