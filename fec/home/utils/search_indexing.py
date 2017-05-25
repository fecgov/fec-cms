import requests

from bs4 import BeautifulSoup
from django.conf import settings

from wagtail.wagtailcore.models import Page

# Only use the real search engine if we're on production
if settings.FEC_CMS_ENVIRONMENT == 'PRODUCTION':
    URL_BASE = settings.CANONICAL_BASE
    DIGITALGOV_BASE_URL = 'https://i14y.usa.gov/api/v1'
    DIGITALGOV_DRAWER_KEY = settings.FEC_DIGITALGOV_DRAWER_KEY_MAIN
    DIGITALGOV_DRAWER_HANDLE = 'main'
else:
    URL_BASE = 'http://localhost:8000'
    DIGITALGOV_BASE_URL = 'http://localhost:3000'
    DIGITALGOV_DRAWER_KEY = ''
    DIGITALGOV_DRAWER_HANDLE = ''


def scrape_page_content(url):
    """
    Scrapes the content for a given URL

    :arg str url: The url (in production) of the page to scrape_page_content
    :returns str : Returns the content scraped from that page
    """
    r  = requests.get(url)
    data = r.text
    soup = BeautifulSoup(data, 'lxml')
    text = ''

    # First look for an article. If that's not there, look for this section
    article = soup.find_all('article', class_="main")
    if not article:
        main = soup.find_all('section', class_="main__content--right")

    content = article if article else main

    for tag in content:
        text = text + tag.get_text().replace('\n', ' ')
    return text


def create_search_index_doc(page):
    """
    Creates a dict in the format required to POST/PUT to i14y

    :arg obj page: A page object returned from a database query
    :returns a dictionary
    """
    # Build the live URL of this page in production
    live_url = page.url_path.replace('/home', URL_BASE)
    doc = {
      "document_id": page.id,
      "title": page.title,
      "path": live_url,
      "created": page.first_published_at.strftime("%Y-%m-%d-%H%M%S"),
      "promote": "false",
      "language": "en",
    }

    # Go scrape the content
    doc['content'] = scrape_page_content(live_url)

    # If we've added a custom search description, add that
    if page.search_description:
        doc['description'] = page.search_description

    # If the page has been edited, add the date changed
    if page.latest_revision_created_at:
        doc['changed'] = page.latest_revision_created_at.strftime("%Y-%m-%d-%H%M%S"),

    return doc


def add_document(page):
    """
    Makes a POST request to i14y to add a new document with the information
    of the edited page

    :arg obj page: A page object returned from a database query
    """
    print('====Adding to index====')
    document = create_search_index_doc(page)
    url = '{}/documents'.format(DIGITALGOV_BASE_URL)
    r = requests.post(url, auth=(DIGITALGOV_DRAWER_HANDLE, DIGITALGOV_DRAWER_KEY), data=document)
    # A 422 means the page already exists,
    if r.status_code == 422:
        print('{} already exists'.format(document['document_id']))
        update_document(document_id)
    elif r.status_code == 201:
        print('Created {}'.format(document['document_id']))
    else:
        print('Could not create {}'.format(document['document_id']))
        print(r.__dict__)


def update_document(page):
    """
    Makes a PUT request to i14y to update the information of the edited page

    :arg obj page: A page object returned from a database query
    """
    print('====Updating in index====')
    document = create_search_index_doc(page)
    url = '{}/documents/{}'.format(DIGITALGOV_BASE_URL, document.get('document_id'))
    r = requests.put(url, auth=(DIGITALGOV_DRAWER_HANDLE, DIGITALGOV_DRAWER_KEY), data=document)
    if r.status_code == 200:
        print('Updated {}'.format(document['document_id']))
    else:
        print('Could not update {}'.format(document['document_id']))
        print(r.__dict__)


def handle_page_edit_or_create(page, method):
    """
    When a page is created or edited, this will check to make sure it's live and
    public and then call the correct add/update function based on
    the method provided.

    :arg dict page: A dict representing the page that was just added or updated
    :arg str method: "add" or "update", determines which i14y endpoint is called
    """
    if settings.FEC_CMS_ENVIRONMENT != 'PRODUCTION':
        return
    else:
        # Make sure the page is live and public
        try:
            p = Page.objects.live().public().get(id=page.id)
        except:
            p = None
        if p:
            print('===Page is public and live===')
            if method == 'add':
                add_document(p)
            elif method == 'update':
                update_document(p)


def handle_page_delete(page_id):
    """
    When a page is deleted on production, this will delete it from the i14y index

    :arg int page_id: The ID of the page to deleted
    """
    if settings.FEC_CMS_ENVIRONMENT == 'PRODUCTION':
        url = '{}/documents/{}'.format(DIGITALGOV_BASE_URL, page_id)
        r = requests.delete(url, auth=(DIGITALGOV_DRAWER_HANDLE, DIGITALGOV_DRAWER_KEY))
        if r.status_code == '200':
            print('Deleted {}'.format(page_id))
        else:
            print('Could not delete {}'.format(page_id))
