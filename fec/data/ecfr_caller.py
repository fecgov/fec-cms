import logging
import requests
import inspect

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def fetch_ecfr_data(query, date="current", limit=20, page=1):
    url = (f"https://www.ecfr.gov/api/search/v1/results?query={query}&"
           f"agency_slugs%5B%5D=federal-election-commission&"
           f"date={date}&"
           f"per_page={limit}&"
           f"page={page}&"
           f"order=relevance&"
           f"paginate_by=results")
    response = requests.get(url)

    # Log the caller function and API endpoint
    current_frame = inspect.currentframe()
    caller_frame = inspect.getouterframes(current_frame, 2)
    logger.info("{0}: {1}".format(caller_frame[1][3], url))

    if response.status_code == 200:
        return response.json()
    else:
        return None
