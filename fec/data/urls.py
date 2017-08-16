from django.conf.urls import url

from data import views

urlpatterns = [
  url(r'^data/$', views.landing),
  url(r'^data/advanced/$', views.advanced),
  url(r'^data/candidate/(?P<candidate_id>\w+)/$', views.candidate),
]
