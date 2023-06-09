from django.urls import re_path

from data import views
from data import views_datatables
from fec import settings

urlpatterns = [
    re_path(r'^data/$', views.landing, name='data-landing'),
    re_path(r'^data/search/$', views.search),
    re_path(r'^data/browse-data/$', views.browse_data, name='browse-data'),
    re_path(r'^data/candidate/(?P<candidate_id>\w+)/$', views.candidate),
    re_path(r'^data/committee/(?P<committee_id>\w+)/$', views.committee, name='committee-by-id'),
    re_path(r'^data/elections/(?P<office>\w+)/(?P<state>\w+)/(?P<district>\w+)/(?P<cycle>[0-9]+)/$',
            views.elections, name='elections-house'),
    re_path(r'^data/elections/(?P<office>\w+)/(?P<state>\w+)/(?P<cycle>[0-9]+)/$', views.elections,
            name='elections-senate'),
    re_path(r'^data/elections/president/(?P<cycle>[0-9]+)/$', views.elections_president, name='elections-president'),
    re_path(r'^data/elections/$', views.elections_lookup),
    re_path(r'^data/raising-bythenumbers/$', views.raising),
    re_path(r'^data/spending-bythenumbers/$', views.spending),

    # Feedback Tool
    re_path(r'^data/issue/reaction/$', views.reactionFeedback),
    re_path(r'^data/issue/$', views.feedback),

    # Datatables
    re_path(r'^data/candidates/(?P<office>\w+)/$',
            views_datatables.candidates_office),
    re_path(r'^data/candidates/$', views_datatables.candidates),
    re_path(r'^data/committees/$', views_datatables.committees),
    re_path(r'^data/communication-costs/$',
            views_datatables.communication_costs),
    re_path(r'^data/disbursements/$', views_datatables.disbursements),
    re_path(r'^data/electioneering-communications/$',
            views_datatables.electioneering_communications),
    re_path(r'^data/filings/$', views_datatables.filings),
    re_path(r'^data/independent-expenditures/$',
            views_datatables.independent_expenditures),
    re_path(r'^data/individual-contributions/$',
            views_datatables.individual_contributions),
    re_path(r'^data/loans/$', views_datatables.loans),
    re_path(r'^data/party-coordinated-expenditures/$',
            views_datatables.party_coordinated_expenditures),
    re_path(r'^data/receipts/individual-contributions/$',
            views_datatables.individual_contributions),
    re_path(r'^data/receipts/$', views_datatables.receipts),
    re_path(r'^data/reports/(?P<form_type>[\w-]+)/$', views_datatables.reports),
    re_path(r'^legal-resources/enforcement/audit-search/$', views_datatables.audit),

    re_path(r'^widgets/aggregate-totals/$', views.aggregate_totals),
]

if settings.FEATURES.get('pac_party'):
    urlpatterns.append(
        re_path(r'^data/committees/pac-party/$', views_datatables.pac_party)
    )

if settings.FEATURES.get('debts'):
    urlpatterns.append(
        re_path(r'^data/debts/$', views_datatables.debts)
    )

if settings.FEATURES.get('presidential_map'):
    # Presidential candidate map
    urlpatterns.append(
        re_path(r'^data/candidates/president/presidential-map/$', views.pres_finance_map)
    )

if settings.FEATURES.get('house_senate_overview'):
    """
    There is a new pattern above (data/elections/president) and new view(`views.elections_president`) to resolve
    the issue of 'data/elections<office/cycle>' now pointing to `views.house_senate_overview`

    """
    urlpatterns.append(
        re_path(r'^data/elections/(?P<office>\w+)/(?P<cycle>[0-9]+)/$', views.house_senate_overview,
                name='elections-overview')
    )
    urlpatterns.append(
        re_path(r'^data/elections/(?P<office>\w+)/$', views.house_senate_overview)
    )
