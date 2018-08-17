from django.conf.urls import url

from checkweb import views

urlpatterns = [
    url(r'^checkweb/$', views.checkweb),
]
