from django.urls import re_path
from django.views.generic.base import RedirectView
from django.conf import settings

from legal import views
from data import views_datatables

urlpatterns = [
    # AFs | Admin fines, Administrative fines
    # TODO: landing page?
    re_path(r'^legal/admin-fines/(?P<admin_fine_no>[\w-]+)/$', views.admin_fine_page),  # single
    re_path(r'^legal/administrative-fines/(?P<admin_fine_no>[\w-]+)/$', views.admin_fine_page),  # single
    re_path(r'^data/legal/administrative-fine/(?P<admin_fine_no>[\w-]+)/$', views.admin_fine_page),


    # AOs | Advisory opinions
    re_path(r'^legal/advisory-opinions/$', views.advisory_opinions_landing),  # landing
    re_path(r'^data/legal/advisory-opinions/$', views.advisory_opinions_landing),  # TODO: retire this one

    re_path(r'^legal/advisory-opinions/(?P<ao_no>[\w-]+)/$', views.advisory_opinion_page),  # single
    re_path(r'^data/legal/advisory-opinions/(?P<ao_no>[\w-]+)/$',
            views.advisory_opinion_page),  # TODO: retire this one

    re_path(r'^legal/search/advisory-opinions/$', views.legal_doc_search_ao),  # search
    re_path(r'^data/legal/search/advisory-opinions/$', views.legal_doc_search_ao),  # TODO: retire this one


    # ADRs | Alternative Dispute Resolutions
    # TODO: landing page?
    re_path(r'^legal/alternative-dispute-resolutions/(?P<adr_no>[\w-]+)/$', views.adr_page),  # single
    re_path(r'^data/legal/alternative-dispute-resolution/(?P<adr_no>[\w-]+)/$',
            views.adr_page),  # TODO: retire this one


    # MURs | Matters Under Review
    # TODO: landing page?
    re_path(r'^legal/matters-under-review/(?P<mur_no>[\w-]+)/$', views.mur_page),  # single
    re_path(r'^data/legal/matter-under-review/(?P<mur_no>[\w-]+)/$', views.mur_page),  # TODO: retire this one

    re_path(r'^legal/search/murs/$', views.legal_doc_search_mur),  # search, datatables
    re_path(r'^legal/search/matters-under-review/$', views.legal_doc_search_mur),  # search, datatables TODO: redirect?
    re_path(r'^data/legal/search/murs/$', views.legal_doc_search_mur),  # TODO: retire this one

    re_path(r'^legal/search/enforcement/$', views.legal_doc_search_mur),
    re_path(r'^data/legal/search/enforcement/$', views.legal_doc_search_mur),  # TODO: retire this one


    # Statutes
    re_path(r'^legal/statutes/$', views.statutes_landing),  # landing
    re_path(r'^data/legal/statutes/$', views.statutes_landing),  # TODO: retire this one

    # TODO: single?

    re_path(r'^legal/search/statutes/$', views.legal_doc_search_statutes),  # search
    re_path(r'^data/legal/search/statutes/$', views.legal_doc_search_statutes),  # TODO: retire this one

    re_path(r'^legal/search/regulations/$', views.legal_doc_search_regulations),
    re_path(r'^data/legal/search/regulations/$', views.legal_doc_search_regulations),  # TODO: retire this one


    # Search
    re_path(r'^legal/search/$', views.legal_search),  # legal search landing page
    re_path(r'^data/legal/search/$', views.legal_search),  # TODO: retire this one
]

if settings.FEATURES['adrs']:
    urlpatterns += re_path(r'^legal/search/adrs/$', views.legal_doc_search_adr),
    urlpatterns += re_path(r'^data/legal/search/adrs/$', views.legal_doc_search_adr),  # TODO: retire this one

# TODO: do we still need this feature flag?
if settings.FEATURES['afs']:
    urlpatterns += [
        # Redirect from `admin_fines` to `admin-fines`
        re_path(
            r'^data/legal/search/admin_fines/$',
            RedirectView.as_view(url='/legal/search/admin-fines/', query_string=True)
        ),  # TODO: do we still need this redirect?
        # The actual `admin-fines` view
        re_path(r'^legal/search/admin-fines/$', views.legal_doc_search_af),  # landing page / datatables
        re_path(r'^data/legal/search/admin-fines/$', views.legal_doc_search_af),  # TODO: retire this one
    ]

# Rulemakings - datatables
if settings.FEATURES['rulemakings']:
    urlpatterns += [
        re_path(r'^legal/search/rulemakings/$', views_datatables.rulemaking),  # datatables
    ]

# Rulemakings - single
if settings.FEATURES['rulemakings_single']:
    urlpatterns += [
        re_path(r'^legal/rulemakings/(?P<rm_no>[\w-]+)/$', views.rulemaking),  # single
    ]

# Rulemakings - commenting (commenting requires single, too)
if settings.FEATURES['rulemakings_commenting'] and settings.FEATURES['rulemakings_single']:
    urlpatterns += [
        # comment on single:
        # re_path(r'^legal/rulemakings/(?P<rm_no>[\w-]+)/add-comments/$', views.rulemaking_add_comments),
        # save comments:
        # re_path(r'^legal/rulemaking/save-comments/', views.save_rulemaking_comments, name='save_rulemaking_comments'),
    ]


# Legal document redirect endpoint
urlpatterns += [
    re_path(r'^legal/search/documents/$', views.legal_document_redirect, name='legal_document_redirect'),
]
