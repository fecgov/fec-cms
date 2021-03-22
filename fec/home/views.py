from datetime import datetime
from itertools import chain
from operator import attrgetter
import requests
import logging

from django.conf import settings
from django.core.paginator import EmptyPage, PageNotAnInteger, Paginator
from django.db.models import Q
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from wagtail.documents.models import Document

from fec.forms import ContactRAD, fetch_categories  # form_categories
from home.models import (CommissionerPage, DigestPage, MeetingPage,
                         PressReleasePage, RecordPage, TipsForTreasurersPage)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def replace_dash(string):
    # Leave the dash in place for non-filer publications
    # This matches what's in the database
    # Seems to have been a problem testing for the hyphenated version,
    # suspect the hyphen is escaped or encoded
    if all(x in string for x in ['non', 'filer', 'publications']):
        return "non-filer publications"
    return string.replace("-", " ")


def replace_space(string):
    return string.replace(" ", "-")


def get_records(category_list=None, year=None, search=None):
    records = RecordPage.objects.live()

    if category_list:
        for category in category_list:
            records = records.filter(category=category)

    if year:
        year = int(year)
        records = records.filter(date__gte=datetime(year, 1, 1)).filter(
            date__lte=datetime(year, 12, 31)
        )

    if search:
        records = records.search(search)

    return records


def get_digests(year=None, search=None):
    digests = DigestPage.objects.live()
    if year:
        year = int(year)
        digests = digests.filter(date__gte=datetime(year, 1, 1)).filter(
            date__lte=datetime(year, 12, 31)
        )

    if search:
        digests = digests.search(search)

    return digests


def get_press_releases(category_list=None, year=None, search=None):
    press_releases = PressReleasePage.objects.live()

    if category_list:
        for category in category_list:
            press_releases = press_releases.filter(category=category)

    if year:
        year = int(year)
        press_releases = press_releases.filter(date__gte=datetime(year, 1, 1)).filter(
            date__lte=datetime(year, 12, 31)
        )

    if search:
        press_releases = press_releases.search(search)

    return press_releases


def get_tips(year=None, search=None):
    tips = TipsForTreasurersPage.objects.live()

    if year:
        year = int(year)
        tips = tips.filter(date__gte=datetime(year, 1, 1)).filter(
            date__lte=datetime(year, 12, 31)
        )

    if search:
        tips = tips.search(search)

    return tips


def updates(request):
    digests = ""
    records = ""
    press_releases = ""
    tips = ""

    social_image_identifier = ""

    # Get values from query
    update_types = request.GET.getlist("update_type", None)
    category_list = request.GET.getlist("category", "")
    year = request.GET.get("year", "")
    search = request.GET.get("search", "")

    category_list = list(map(replace_dash, category_list))

    # If there's a query, only get the types in the query
    if update_types:
        if "fec-record" in update_types:
            records = get_records(category_list=category_list, year=year, search=search)
        if "press-release" in update_types:
            press_releases = get_press_releases(
                category_list=category_list, year=year, search=search
            )
            social_image_identifier = "press-release"
        if "weekly-digest" in update_types:
            digests = get_digests(year=year, search=search)
            social_image_identifier = 'weekly-digest'
        if "tips-for-treasurers" in update_types:
            tips = get_tips(year=year, search=search)

    else:
        # Get everything and filter by year if necessary
        digests = DigestPage.objects.live()
        press_releases = PressReleasePage.objects.live()
        records = RecordPage.objects.live()
        tips = TipsForTreasurersPage.objects.live()

        if year:
            # Trying to filter using the built-in date__year parameter doesn't
            # work when chaining filter() and search(), so this uses date_gte and date_lte
            year = int(year)
            press_releases = press_releases.filter(
                date__gte=datetime(year, 1, 1)
            ).filter(date__lte=datetime(year, 12, 31))
            digests = digests.filter(date__gte=datetime(year, 1, 1)).filter(
                date__lte=datetime(year, 12, 31)
            )
            records = records.filter(date__gte=datetime(year, 1, 1)).filter(
                date__lte=datetime(year, 12, 31)
            )
            tips = tips.filter(date__gte=datetime(year, 1, 1)).filter(
                date__lte=datetime(year, 12, 31)
            )

        if search:
            press_releases = press_releases.search(search)
            digests = digests.search(search)
            records = records.search(search)
            tips = tips.search(search)

    # Chain all the QuerySets together
    # via http://stackoverflow.com/a/434755/1864981
    updates = sorted(
        chain(press_releases, digests, records, tips),
        key=attrgetter("date"),
        reverse=True,
    )

    # Handle pagination
    page = request.GET.get("page", 1)
    paginator = Paginator(updates, 20)
    try:
        updates = paginator.page(page)
    except PageNotAnInteger:
        updates = paginator.page(1)
    except EmptyPage:
        updates = paginator.page(paginator.num_pages)

    page_context = {"title": "Latest updates", "content_section": "about"}

    category_list = list(map(replace_space, category_list))

    return render(
        request,
        "home/latest_updates.html",
        {
            "self": page_context,
            "category_list": category_list,
            "update_types": update_types,
            "updates": updates,
            "year": year,
            "search": search,
            'social_image_identifier': social_image_identifier
        },
    )


def calendar(request):
    page_context = {"content_section": "calendar", "title": "Calendar"}
    return render(request, "home/calendar.html", {"self": page_context})


def commissioners(request):
    chair_commissioner = (
        CommissionerPage.objects.filter(commissioner_title__contains="Chair")
        .exclude(commissioner_title__contains="Vice")
        .first()
    )
    vice_commissioner = CommissionerPage.objects.filter(
        commissioner_title__startswith="Vice"
    ).first()

    current_commissioners = CommissionerPage.objects.filter(
        commissioner_title__exact="", term_expiration__isnull=True
    ).order_by("last_name")
    past_commissioners = CommissionerPage.objects.filter(
        commissioner_title__exact="", term_expiration__isnull=False
    ).order_by("-term_expiration")

    page_context = {
        "title": "All Commissioners",
        "chair_commissioner": chair_commissioner,
        "vice_commissioner": vice_commissioner,
        "current_commissioners": current_commissioners,
        "past_commissioners": past_commissioners,
        "content_section": "about",
        "ancestors": [
            {"title": "About the FEC", "url": "/about/"},
            {
                "title": "Leadership and structure",
                "url": "/about/leadership-and-structure",
            },
        ],
    }

    return render(request, "home/commissioners.html", {"self": page_context})


def contact_rad(request):
    page_context = {
        "title": "Submit a question to the Reports Analysis Division (RAD)",
        "ancestors": [
            {
                "title": "Help for candidates and committees",
                "url": "/help-candidates-and-committees/",
            }
        ],
        "content_section": "help",
    }

    # Only show contact form if we can contact ServiceNow
    if fetch_categories():
        # If it's a POST, post to the ServiceNow API
        if request.method == "POST":
            form = ContactRAD(request.POST)
            # Get the captcha response from the post request and perform server-side verification
            capchaResponse = request.POST.get('g-recaptcha-response')
            verifyRecaptcha = requests.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": settings.FEC_RECAPTCHA_SECRET_KEY,
                    "response": capchaResponse,
                },
            )
            recaptchaResponse = verifyRecaptcha.json()
            if not recaptchaResponse["success"]:
                # if captcha failed, return and log failure
                logger.error("Recaptcha failed - possible spam")
                return render(
                    request,
                    "home/contact-form.html",
                    {"self": page_context, "form": form, "server_error": True},
                )
            else:
                # If the captcha is good, go ahead and post it
                response = form.post_to_service_now()
                if response == 201:
                    return render(
                        request,
                        "home/contact-form.html",
                        {"self": page_context, "success": True},
                    )
                else:
                    # This gets triggered when all the required fields are not entered into the POST request
                    logger.error("Error submitting RAD question")
                    return render(
                        request,
                        "home/contact-form.html",
                        {"self": page_context, "form": form, "server_error": True},
                    )
        else:
            form = ContactRAD()
    else:
        form = False

    return render(
        request, "home/contact-form.html", {"self": page_context, "form": form}
    )


def serve_wagtail_doc(request, document_id, document_filename):
    """
    Replacement for ``wagtail.documents.views.serve.serve``
    Wagtail's default document view serves everything as an attachment.
    We'll bounce back to the URL and let the media server serve it.
    """
    doc = get_object_or_404(Document, id=document_id)
    return HttpResponseRedirect(doc.file.url)


def index_meetings(request):
    """
    Serve 'commission meetings' page under 'about'
    """
    meetings = MeetingPage.objects.live().order_by("-date")
    open_meetings = meetings.filter(meeting_type="O").exclude(title__icontains="Hearing")
    executive_sessions = meetings.filter(meeting_type="E")
    hearings = meetings.filter(Q(title__icontains="Hearing") | Q(meeting_type="H"))
    year = request.GET.get("year", "")
    search = request.GET.get("search", "")
    active = request.GET.get("tab", "open-meetings")
    page = request.GET.get("page", 1)

    # Get the range of all years for each meeting type
    # Used to populate the selects with only values that make sense
    meeting_years = list(
        map(lambda x: x.year, MeetingPage.objects.dates("date", "year", order="DESC"))
    )
    hearing_years = list(
        map(lambda x: x.year, hearings.dates("date", "year", order="DESC"))
    )
    executive_years = list(
        map(lambda x: x.year, executive_sessions.dates("date", "year", order="DESC"))
    )

    meetings_query = ""
    hearings_query = ""
    executive_query = ""

    if year:
        # Trying to filter using the built-in date__year parameter doesn't
        # work when chaining filter() and search(), so this uses date_gte and date_lte
        year = int(year)
        meetings = meetings.filter(date__gte=datetime(year, 1, 1)).filter(
            date__lte=datetime(year, 12, 31)
        )
        open_meetings = open_meetings.filter(date__gte=datetime(year, 1, 1)).filter(
            date__lte=datetime(year, 12, 31)
        )
        hearings = hearings.filter(date__gte=datetime(year, 1, 1)).filter(
            date__lte=datetime(year, 12, 31)
        )
        executive_sessions = executive_sessions.filter(
            date__gte=datetime(year, 1, 1)
        ).filter(date__lte=datetime(year, 12, 31))

    if search:
        if active == "open-meetings":
            meetings_query = search
            open_meetings = open_meetings.search(meetings_query)
        if active == "hearings":
            hearings_query = search
            hearings = hearings.search(hearings_query)
        if active == "executive-sessions":
            executive_query = search
            executive_sessions = executive_sessions.search(executive_query)

    meetings_paginator = Paginator(open_meetings, 20)
    meetings_page = page if active == "open-meetings" else 1
    try:
        open_meetings = meetings_paginator.page(meetings_page)
    except PageNotAnInteger:
        open_meetings = meetings_paginator.page(1)
    except EmptyPage:
        open_meetings = meetings_paginator.page(meetings_paginator.num_pages)

    hearings_paginator = Paginator(hearings, 20)
    hearings_page = page if active == "hearings" else 1
    try:
        hearings = hearings_paginator.page(hearings_page)
    except PageNotAnInteger:
        hearings = hearings_paginator.page(1)
    except EmptyPage:
        hearings = hearings_paginator.page(hearings_paginator.num_pages)

    executive_paginator = Paginator(executive_sessions, 20)
    executive_page = page if active == "executive-sessions" else 1
    try:
        executive_sessions = executive_paginator.page(executive_page)
    except PageNotAnInteger:
        executive_sessions = executive_paginator.page(1)
    except EmptyPage:
        executive_sessions = executive_paginator.page(executive_paginator.num_pages)

    page_context = {"content_section": "about", "title": "Commission meetings"}

    return render(
        request,
        "home/commission_meetings.html",
        {
            "self": page_context,
            "year": year,
            "meetings_query": meetings_query,
            "hearings_query": hearings_query,
            "executive_query": executive_query,
            "open_meetings": open_meetings,
            "meeting_years": meeting_years,
            "hearing_years": hearing_years,
            "hearings": hearings,
            "executive_years": executive_years,
            "executive_sessions": executive_sessions,
            "social_image_identifier": 'commission-meetings',
        },
    )


def guides(request):
    page_context = {"content_section": "help", "title": "Guides"}
    return render(
        request,
        "home/candidate-and-committee-services/guides.html",
        {"self": page_context},
    )


# Custom handle 500 error for website status
def error_500(request, template_name="500.html"):
    cms_env = request.GET.get("FEC_CMS_ENVIRONMENT", "")
    if settings.FEATURES.get('website_status'):
        return render(
            request,
            '500-status.html',
            {'FEC_CMS_ENVIRONMENT': cms_env})

    return render(
        request,
        template_name,
        {'FEC_CMS_ENVIRONMENT': cms_env})
