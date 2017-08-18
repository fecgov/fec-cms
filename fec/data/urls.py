from django.conf.urls import url

from data import views

urlpatterns = [
  url(r'^data/$', views.landing),
  url(r'^data/advanced/$', views.advanced),
  url(r'^data/candidate/(?P<candidate_id>\w+)/$', views.candidate),
  url(r'^data/candidates/$', views.candidates),
  url(r'^data/committee/(?P<committee_id>\w+)/$', views.committee),
  url(r'^data/committees/$', views.committees),
  url(r'^data/elections/$', views.elections),
  url(r'^data/receipts/$', views.receipts),
]
