import logging
import requests
import inspect

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _empty_response(page):
    try:
        current_page = int(page)
    except (TypeError, ValueError):
        current_page = 1

    return {
        "results": [],
        "meta": {
            "current_page": current_page,
            "total_pages": 0,
            "total_count": 0,
        },
    }


def fetch_ecfr_data(query, date="current", limit=20, page=1):
    order = "hierarchy"
    if query:
        order = "relevance"
    url = "https://www.ecfr.gov/api/search/v1/results"
    params = {
        "query": query,
        "agency_slugs[]": "federal-election-commission",
        "date": date,
        "per_page": limit,
        "page": page,
        "order": order,
        "paginate_by": "results",
    }

    response = requests.get(url, params=params)

    # Log the caller function and API endpoint
    current_frame = inspect.currentframe()
    caller_frame = inspect.getouterframes(current_frame, 2)
    logger.info("{0}: {1}".format(caller_frame[1][3], response.url))

    if response.status_code == 200:
        return response.json()
    else:
        logger.error(
            "eCFR API ERROR with status {0} for {1} with params: {2}".format(
                response.status_code, url, params
            )
        )
        return _empty_response(page)
