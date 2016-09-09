import glob
import json
import os
import django
django.setup()

from datetime import datetime
from dateutil import parser
from slugify import slugify

from home.models import PressReleasePage as prp

from django.core.management import BaseCommand


dirname = os.path.dirname
MAIN_DIRECTORY = dirname(dirname(dirname(__file__)))


def get_full_path(*path):
    return os.path.join(MAIN_DIRECTORY, *path)


def escape(text):
    escape_single = text.replace("'", "''")
    # escape_double = escape_single.replace('"', '\"')
    return escape_single


def add_page(item, p):
    latest_revision_created_at = datetime.now().strftime('%Y-%m-%d 00:00:00.000000')
    publish_date = parser.parse(item['date']).strftime('%Y-%m-%d 00:00:00.000000')
    item_year = parser.parse(item['date']).year
    wag_path = "000" + str(p)
    title = item['title'][:255]
    # validate
    category = escape(item['category'])
    slug = slugify(str(item_year) + '-' + category + '-' + title)[:225]
    url_path = "/home/media/" + slug + "/"
    body_string = escape(item['html'])
    body_list = [{"value": escape(item['html']), "type": "html"}]
    formatted_body = json.dumps(body_list)

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
        expired=0,
        owner_id=1,
        locked=0,
        latest_revision_created_at=latest_revision_created_at,
        first_published_at=publish_date,
        # would like to change later
        category='audit reports',
        path=wag_path,
    )
    press_page.save()
    print(press_page.id)
    saved_page = prp.objects.get(slug=slug)
    saved_page.body = formatted_body
    saved_page.save()

    print(url_path)

    return p + 1


def load_press_releases_from_json():
    """Loops through json files and adds them to wagtail"""
    # every 4 numbers are the identifiers for the parent page, the last 4 need to be unique
    p = int('0001000100063709')

    paths = sorted(glob.glob('data_loader/data/pr_json/' + '*.json'))

    for path in paths:
        with open(path, 'r') as json_contents:
            contents = json.load(json_contents)
            p = add_page(contents, p)


class Command(BaseCommand):
    help = "loads press releases from json"

    def handle(self, *args, **options):
        load_press_releases_from_json()
