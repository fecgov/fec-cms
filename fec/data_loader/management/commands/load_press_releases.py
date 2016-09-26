import glob
import json
import os
import logging
import re

from dateutil import parser
from slugify import slugify
from urllib.parse import urljoin

from django.core.management import BaseCommand

from home.models import PressReleasePage as prp
from home.models import Page
from home.utils.link_reroute import make_absolute_links as relink

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

dirname = os.path.dirname
MAIN_DIRECTORY = dirname(dirname(dirname(__file__)))

base_url = 'http://www.fec.gov/press/'


# only works in shell for some reason
def delete_all_press_releases():
    errors = []
    from home.models import PressReleasePage as prp
    for x in prp.objects.all():
        try:
            x.delete()
        except:
            errors.append(x.id)
    if len(errors) > 0:
        logger.info("look at : {0}".format(errors))
    logger.info('Completed deleting old press releases')



#### move to a another file
def strip_cruft(body, title):

    replacements = [
        # deletions - these are from the header and we don't need them as part of the content
        ('<body bgcolor="#FFFFFF">', ''),
        ('<a href="http://www.fec.gov"><img src="../jpg/topfec.jpg" border="0" width="81" height="81" alt="FEC Home Page"/></a> </p>', ''),
        ("""width="100%""""", ''),
        ("""width="187""""", ''),
        # looked weird on the media landing page, still looks okay on the individual pages without it
        ('<td height="524" colspan="4">', '<td colspan="4">'),
        ("""<p align="right"><b>Contact:</b></p>""",  """<p><b>Contact:</b></p>"""),
        ('Contact:', 'Contact: '),
        # neutering font for now will replace later
        ('face="Book Antiqua"', ''),
        #photos from the old header
        ('<p><a href="/">HOME</a> / <a href="/press/press.shtml">PRESS OFFICE</a><br/>', ''),
        ('News Releases, Media Advisories<br/>', ''),
        ('<h1>News Releases</h1>', ''),
        ('<img src="../../../images/filetype-pdf.gif" alt="PDF" width="16" height="16" hspace="0" vspace="0" align="default"/>', ''),
        ('<a href="http://www.fec.gov"><img src="../jpg/topfec.jpg" border="0" width="81" height="81" alt="FEC Seal Linking to FEC.GOV"/></a>', ''),
        ('<a href="http://www.fec.gov"><img src="../jpg/topfec.jpg"  alt="FEC Home Page" width="81" height="81"/></a>', ''),
        ('<a href="http://www.fec.gov"><img src="../jpg/topfec.jpg" border="0" width="81" height="81"/></a>', ''),
        ('<img src="../../jpg/topfec.jpg" border="0" alt="FEC Home Page" width="81" height="81"/></a>', ''),
        ('<img src="../../jpg/topfec.jpg"  alt="FEC Home Page" width="81" height="81"/>', ''),
        ('<a href="http://www.fec.gov"><img src="../jpg/topfec.jpg" border="0"/>', ''),
        ('<img src="../jpg/topfec.jpg" border="0" width="81" height="81"/>', ''),
        ('<img align="default" alt="PDF"  hspace="0" src="../../../images/filetype-pdf.gif" vspace="0" width="16"/>', ''),
        ('<img src="../jpg/topfec.jpg"  width="81" height="81"/>', ''),
        ('<img src="/jpg/topfec.jpg" ismap="ismap" border="0"/>', ''),
        # In the 80s, they used pre to get spacing, but that kills the font in a bad way, I am adding some inline styling to perserve the spaces. It isn't perfect, but it is better.
        ('<pre>', '<div style="white-space: pre-wrap;">'),
        ('</pre>', '</div>'),
    ]
    regex_replacements = [
        ('height="[0-9]+"', ''),
        ('border="[0-9]+"', ''),
        # remove colors
        ('bgcolor="#[A-Z0-9]+"', ''),
        ('color="#[A-Z0-9]+"', ''),
        ('text="#[A-Z0-9]+"', ''),
        ('link="#[A-Z0-9]+"', ''),
        ('vlink="#[A-Z0-9]+"', ''),
        ('alink="#[A-Z0-9]+"', ''),
        ('bordercolor="#[A-Z0-9]+"', ''),
        ('size="[0-9]+"', ''),
        ('size="-[0-9]+"', ''),
        # we got an ok to not have redundant content
        ('<a href="\.\.\/pdf\/[0-9]+release.pdf">\.pdf version of this news release.</a>', ''),
        ('<a href="\.\.\/pdf\/[0-9]+release.pdf">\.pdf version of this news release</a>', ''),
        ('<a href="\.\.\/pdf\/[0-9]+release.pdf">\.pdf version...a>', ''),
        ('<a href="\.\.\/pdf\/[0-9]+release.pdf">\.pdf version..a>', ''),
        ('\.pdf version of this news release', ''),
    ]

    for old, new in replacements:
        body = str.replace(body, old, new)

    for old, new in regex_replacements:
        body = re.sub(old, new, body)

    # already have title
    if title:
        title_layouts = [
            """<p><strong>{0}<br/></strong></p>""".format(title),
            """<td colspan="4"><p style="text-align:center;"><strong>{0}</strong></p>""".format(title.upper()),
            """<p align="center">{0}</p>""".format(title.upper()),
            """<p><strong>{0}</strong></p>""".format(title),
        ]

        for layout in title_layouts:
            body = str.replace(body, layout, '')

    # Flag
    if """You have performed a blocked operation""" in body:
        print('-----BLOCKED PAGE------')
    return body
###


def get_full_path(*path):
    return os.path.join(MAIN_DIRECTORY, *path)


def escape(text):
    # for loading into the db correctly
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
        return "other agency actions"


def add_page(item, base_page):
    item_year = parser.parse(item['date']).year
    title = item['title'][:255]
    if 'category' in item:
        category = validate_category(item['category'])
    else:
        category = "other agency actions"
    slug = slugify(str(item_year) + '-' + category + '-' + title)[:225]
    url_path = "/home/media/" + slug + "/"
    clean_body = strip_cruft(item['html'], item['title'])
    linked_body = relink(urljoin(base_url, item['href']), clean_body)
    body = escape(linked_body)
    body_list = [{"value": body, "type": "html"}]
    formatted_body = json.dumps(body_list)
    publish_date = parser.parse(item['date'])

    press_page = prp(
        depth=4,
        numchild=0,
        title=title,
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
        latest_revision_created_at=publish_date,
        first_published_at=publish_date,
    )

    base_page.add_child(instance=press_page)
    saved_page = prp.objects.get(id=press_page.id)
    saved_page.body = formatted_body
    saved_page.first_published_at = publish_date
    saved_page.created_at = publish_date
    saved_page.date = publish_date
    saved_page.save()


def load_press_releases_from_json():
    """Loops through json files and adds them to wagtail"""
    # Base Page that the pages you are adding belong to
    base_page = Page.objects.get(url_path='/home/media/')

    paths = sorted(glob.glob('data_loader/data/pr_json/' + '*.json'))
    logger.info("starting...")
    for path in paths:
        with open(path, 'r') as json_contents:
            logger.info(path)
            contents = json.load(json_contents)
            if contents['title'] is None or contents['title'].isspace():
                # this seems to be the case for the PR docs
                contents['title'] = contents['category']
            add_page(contents, base_page)


class Command(BaseCommand):
    help = "loads press releases from json"

    def handle(self, *args, **options):
        delete_all_press_releases()
        load_press_releases_from_json()
        logger.info('Press releases loaded')
