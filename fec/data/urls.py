from django.conf.urls import url

from data import views

urlpatterns = [
  url(r'^data/$', views.landing),
  url(r'^data/advanced/$', views.advanced),
  url(r'^data/candidate/(?P<candidate_id>\w+)/$', views.candidate),
  url(r'^data/committee/(?P<committee_id>\w+)/$', views.committee),
  url(r'^data/elections/$', views.elections),

  # datatables
  url(r'^data/candidates/(?P<office>\w+)/$', views.candidates_office),
  url(r'^data/candidates/$', views.candidates),
  url(r'^data/committees/$', views.committees),
  url(r'^data/communication-costs/$', views.communication_costs),
  url(r'^data/disbursements/$', views.disbursements),
  url(r'^data/electioneering-communications/$', views.electioneering_communications),
  url(r'^data/filings/$', views.filings),
  url(r'^data/independent-expenditures/$', views.independent_expenditures),
  url(r'^data/individual-contributions/$', views.individual_contributions),
  url(r'^data/loans/$', views.loans),
  url(r'^data/party-coordinated-expenditures/$', views.party_coordinated_expenditures),
  url(r'^data/receipts/individual-contributions/$', views.individual_contributions),
  url(r'^data/receipts/$', views.receipts),
  url(r'^data/reports/(?P<form_type>[\w-]+)/$', views.reports),
]
