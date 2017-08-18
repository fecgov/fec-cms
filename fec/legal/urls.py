from django.conf.urls import url

from legal import views

print('legal urls')

urlpatterns = [
    url(r'^data/legal/advisory-opinions/$', views.advisory_opinions_landing),
]
