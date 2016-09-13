import glob
import json
import os
import logging

from datetime import datetime
from dateutil import parser
from slugify import slugify

from home.models import PressReleasePage as prp
from home.models import Page

from django.core.management import BaseCommand


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


dirname = os.path.dirname
MAIN_DIRECTORY = dirname(dirname(dirname(__file__)))


def get_full_path(*path):
    return os.path.join(MAIN_DIRECTORY, *path)


def escape(text):
    escape_single = text.replace("'", "''")
    return escape_single

def validate_category(name):
    if name.lower() in [
        "audit reports",
        "campaign finance data summaries",
        "commission appointments",
        "disclosure initiatives",
        "enforcement matters",
        "hearings",
        "litigation",
        "non-filer publications",
        "open meetings and related matters",
        "presidential public funds",
        "rulemakings",
        "other agency actions",
    ]:
        return name.lower()
    else:
        print(name)
        return "other agency actions"


def add_page(item, base_page):
    item_year = parser.parse(item['date']).year
    title = item['title'][:255]
    category = validate_category(item['category'])
    slug = slugify(str(item_year) + '-' + category + '-' + title + '-1')[:225]
    url_path = "/home/media/" + slug + "/"
    body_list = [{"value": escape(item['html']), "type": "html"}]
    formatted_body = json.dumps(body_list)
    latest_revision_created_at = datetime.now().strftime('%Y-%m-%d 00:00:00.000000')
    publish_date = parser.parse(item['date']).strftime('%Y-%m-%d 00:00:00.000000')

    press_page = prp(
        depth=4,
        numchild=0,
        title=title,
        slug=slug,
        live=1,
        has_unpublished_changes='0',
        url_path=url_path,
        seo_title=title,
        show_in_menus=0,
        search_description=title,
        category=category,
        expired=0,
        owner_id=1,
        locked=0,
        latest_revision_created_at=latest_revision_created_at,
        first_published_at=publish_date,
        # path=wag_path,
    )

    # press_page.save()
    # saved_page = prp.objects.get(slug=slug)
    logger.info("About to save...")
    base_page.add_child(instance=press_page)
    logger.info(press_page.id)
    saved_page = prp.objects.get(id=press_page.id)
    saved_page.body = formatted_body
    saved_page.save()
    logger.info("Saved!")
    logger.info(saved_page.id)
    logger.info(url_path)


def load_press_releases_from_json():
    """Loops through json files and adds them to wagtail"""
    # Base Page that the pages are children of
    base_page = Page.objects.get(url_path='/home/media/')

    paths = sorted(glob.glob('data_loader/data/pr_json/' + '*.json'))
    logger.info("starting")
    for path in paths:
        with open(path, 'r') as json_contents:
            contents = json.load(json_contents)
            add_page(contents, base_page)


class Command(BaseCommand):
    help = "loads press releases from json"

    def handle(self, *args, **options):
        load_press_releases_from_json()

"""
Clean up notes:

remove <img src="../../../jpg/topfec.jpg" border="0" alt="FEC Home Page" width="81" height="81"/>


"""
