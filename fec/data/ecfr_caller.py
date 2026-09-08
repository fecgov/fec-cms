"""Fetch Title 11 regulation data from the public eCFR service."""

import logging
import time

import requests
from django.conf import settings
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

ECFR_BASE_URL = "https://www.ecfr.gov"
ECFR_SEARCH_PATH = "/api/search/v1/results"
ECFR_STRUCTURE_PATH = "/api/versioner/v1/structure/{date}/title-{title}.json"
ECFR_TITLES_PATH = "/api/versioner/v1/titles"
ECFR_SECTION_HTML_PATH = (
    "/current/title-{title}/chapter-I/subchapter-A/part-{part}{subpart}/section-{section}"
)
ECFR_VERSIONS_PATH = "/api/versioner/v1/versions/title-{title}.json"
ECFR_ANCESTRY_PATH = "/api/versioner/v1/ancestry/{date}/title-{title}.json"
ECFR_ERROR_MESSAGE = (
    "We could not retrieve regulation results from eCFR. "
    "Please try again later."
)
ECFR_STRUCTURE_ERROR_MESSAGE = (
    "We could not retrieve Title 11 regulations from eCFR. "
    "Please try again later."
)
ECFR_SECTION_ERROR_MESSAGE = (
    "We could not retrieve this regulation from eCFR. "
    "Please try again later."
)
ECFR_VERSIONS_ERROR_MESSAGE = (
    "We could not retrieve this regulation's timeline from eCFR. "
    "Please try again later."
)
# Reader paths retained from the working integration. These ranges must be
# reviewed when eCFR reorganizes a part; they are not derived from the API.
ECFR_SUBPART_RANGES = {
    '100': [
        ('A', 1, 50),
        ('B', 51, 57),
        ('C', 71, 94),
        ('D', 110, 114),
        ('E', 130, 155),
    ],
    '109': [('A', 1, 3), ('B', 10, 11), ('C', 20, 23), ('D', 30, 37)],
    '111': [('A', 1, 24), ('B', 30, 46), ('C', 50, 55)],
    '300': [
        ('A', 1, 2),
        ('B', 10, 37),
        ('C', 50, 52),
        ('D', 60, 65),
        ('E', 70, 72),
    ],
    '400': [
        ('A', 1, 10),
        ('B', 20, 25),
        ('C', 30, 32),
        ('D', 40, 42),
        ('E', 50, 54),
    ],
    '9008': [('A', 1, 16), ('B', 50, 55)],
}

session = requests.Session()
session.mount(
    "https://",
    requests.adapters.HTTPAdapter(
        max_retries=Retry(
            total=1,
            connect=1,
            read=1,
            status=1,
            backoff_factor=0,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=frozenset(["GET"]),
            raise_on_status=False,
        )
    ),
)


def _section_subpart(section):
    part, _, section_number = section.partition('.')
    try:
        section_number = int(section_number)
    except ValueError:
        return ''

    for subpart, first, last in ECFR_SUBPART_RANGES.get(part, []):
        if first <= section_number <= last:
            return f'/subpart-{subpart}'
    return ''


def _empty_ecfr_response(page=1, error=False, error_message=None):
    try:
        current_page = int(page or 1)
    except (TypeError, ValueError):
        current_page = 1

    return {
        "results": [],
        "meta": {
            "current_page": current_page,
            "total_pages": 0,
            "total_count": 0,
        },
        "error": error,
        "error_message": error_message,
    }


def _request_timeout():
    return (
        settings.API_CALLER_CONNECT_TIMEOUT,
        min(settings.API_CALLER_READ_TIMEOUT, 10),
    )


def _request(url, params=None, headers=None):
    start = time.monotonic()
    try:
        response = session.get(url, params=params, headers=headers, timeout=_request_timeout())
        logger.info("eCFR: %s (%dms)", response.url, (time.monotonic() - start) * 1000)
        if 'unblock.federalregister.gov' in response.url:
            logger.warning("eCFR returned an access interstitial for %s", url)
            return None
        return response
    except requests.RequestException:
        logger.exception("eCFR request failed: %s", url)
        return None


def _fetch_json(url, params=None, error_response=None):
    response = _request(url, params=params)
    if response is not None and response.ok:
        try:
            return response.json()
        except ValueError:
            logger.warning("eCFR returned invalid JSON: %s", url)
    return error_response


def _fetch_text(url, headers=None, error_response=None):
    response = _request(url, headers=headers)
    if response is not None and response.ok:
        response.encoding = 'utf-8'
        return {"text": response.text, "error": False, "error_message": None}
    # Preserve 404 so the view can distinguish removed text from an outage.
    return {
        **(error_response or {}),
        "status_code": response.status_code if response is not None else None,
    }


def fetch_ecfr_data(query, date="current", limit=20, page=1):
    order = "hierarchy"
    if query:
        order = "relevance"

    url = f"{ECFR_BASE_URL}{ECFR_SEARCH_PATH}"
    params = {
        "query": query,
        "agency_slugs[]": "federal-election-commission",
        "date": date,
        "per_page": limit,
        "page": page,
        "order": order,
        "paginate_by": "results",
    }

    return _fetch_json(
        url,
        params=params,
        error_response=_empty_ecfr_response(
            page=page,
            error=True,
            error_message=ECFR_ERROR_MESSAGE,
        ),
    )


def fetch_ecfr_structure(date="current", title=11):
    url = f"{ECFR_BASE_URL}{ECFR_STRUCTURE_PATH.format(date=date, title=title)}"
    return _fetch_json(
        url,
        error_response={
            "children": [],
            "error": True,
            "error_message": ECFR_STRUCTURE_ERROR_MESSAGE,
        },
    )


def fetch_ecfr_titles():
    url = f"{ECFR_BASE_URL}{ECFR_TITLES_PATH}"
    return _fetch_json(
        url,
        error_response={
            "titles": [],
            "error": True,
            "error_message": ECFR_VERSIONS_ERROR_MESSAGE,
        },
    )


def get_ecfr_title_issue_date(title=11):
    # Use title metadata when the reader page has no parseable issue date.
    titles_response = fetch_ecfr_titles()
    if titles_response.get("error"):
        return None

    for title_data in titles_response.get("titles", []):
        if title_data.get("number") == title:
            return title_data.get("latest_issue_date")

    return None


def fetch_ecfr_section_html(section, title=11):
    """Fetch the canonical reader page used for the regulation text."""
    # eCFR's reader URL includes the section's part and, where applicable, subpart.
    part = section.split('.', 1)[0]
    path = ECFR_SECTION_HTML_PATH.format(
        title=title,
        part=part,
        section=section,
        subpart=_section_subpart(section),
    )
    url = f"{ECFR_BASE_URL}{path}"
    return _fetch_text(
        url,
        headers={
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (compatible; FEC CMS regulation reader)',
        },
        error_response={
            "text": "",
            "date": None,
            "error": True,
            "error_message": ECFR_SECTION_ERROR_MESSAGE,
        },
    )


def fetch_ecfr_versions(section, date=None, title=11):
    issue_date = date or get_ecfr_title_issue_date(title=title)
    if not issue_date:
        return {
            "content_versions": [],
            "error": True,
            "error_message": ECFR_VERSIONS_ERROR_MESSAGE,
        }

    url = f"{ECFR_BASE_URL}{ECFR_VERSIONS_PATH.format(title=title)}"
    # Limit to versions available as of the section issue date.
    return _fetch_json(
        url,
        params={
            "section": section,
            "issue_date[lte]": issue_date,
        },
        error_response={
            "content_versions": [],
            "error": True,
            "error_message": ECFR_VERSIONS_ERROR_MESSAGE,
        },
    )


def fetch_ecfr_ancestry(section, date=None, title=11):
    issue_date = date or get_ecfr_title_issue_date(title=title)
    if not issue_date:
        return {
            "ancestors": [],
            "error": True,
            "error_message": ECFR_VERSIONS_ERROR_MESSAGE,
        }

    url = f"{ECFR_BASE_URL}{ECFR_ANCESTRY_PATH.format(date=issue_date, title=title)}"
    return _fetch_json(
        url,
        params={"section": section},
        error_response={
            "ancestors": [],
            "error": True,
            "error_message": ECFR_VERSIONS_ERROR_MESSAGE,
        },
    )
