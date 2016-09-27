import glob
import json
import os
import logging
import re

from dateutil import parser
from slugify import slugify
from urllib.parse import urljoin

from django.core.management import BaseCommand

from home.models import DigestPage as dp
from home.models import Page
from home.utils.link_reroute import make_absolute_links as relink


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

dirname = os.path.dirname
MAIN_DIRECTORY = dirname(dirname(dirname(__file__)))


base_url = 'http://www.fec.gov/press/'

def delete_all_digests():
    errors = []
    for x in dp.objects.all():
        try :
            x.delete()
        except:
            errors.append(x.id)
    if len(errors) > 0:
        logger.info("look at : {0}".format(errors))
    logger.info('Completed deleting old Weekly digests')



#### move to a another file
def strip_cruft(body, title):
    replacements = [
        # deletions - these are from the header and we don't need them as part of the content
        ('<body bgcolor="#FFFFFF">', ''),
        ('<a href="http://www.fec.gov"><img src="../jpg/topfec.jpg" border="0" width="81" height="81" alt="FEC Home Page"/></a> </p>', ''),
        ("""width="100%""""", ''),
        ('width="57"', ''),
        ("""width="187""""", ''),
        ('<h1><a name="content"/> Weekly Digest </h1>', ''),
        ("<h1 class=\"style1\">Weekly Digest </h1>", ''),
        ('<h1>FEC Digest </h1>', ''),
        ('<p><a href="/">HOME</a> / <a href="/press/press.shtml">PRESS OFFICE</a><br/>', ''),
        ('News Releases, Media Advisories<br/>', ''),
        # replacements to make things render better in the new context
        ("""<p align="right"><b>Contact:</b></p>""", """<p><b>Contact:</b></p>"""),
        ('Contact:', 'Contact:  '),
        # neutering font for now
        ('face="Book Antiqua"', ''),
        # old heading photo
        ('<a href="http://www.fec.gov"><img src="../jpg/topfec.jpg" border="0" width="81" height="81"/></a>', ''),
        ('<td width="3%" valign="top"><div align="center"><img width="16" vspace="0" hspace="0" height="16" align="default" alt="PDF" src="../../../images/filetype-pdf.gif"/> </div></td>', ''),
        ('<img width="16" vspace="0" hspace="0" height="16" align="default" alt="PDF" src="../../../images/filetype-pdf.gif"/>', ''),
        ('<img src="../../../images/filetype-pdf.gif" alt="PDF" width="16" height="16" hspace="0" vspace="0" align="default"/>', ''),
        ('<a href="http://www.fec.gov"><img src="../jpg/topfec.jpg" border="0" width="81" height="81" alt="FEC Seal Linking to FEC.GOV"/></a>', ''),
        ('<img src="../../jpg/topfec.jpg" border="0" alt="FEC Home Page" width="81" height="81"/></a>', ''),
        ('<a href="http://www.fec.gov"><font><img src="../jpg/topfec.jpg" border="0"/></font></a>', ''),
        ('<a href="http://www.fec.gov"><img src="../jpg/topfec.jpg" border="0"/>', ''),
        ('<img src="../jpg/topfec.jpg" border="0" width="81" height="81"/>', ''),
        ('<img src="/jpg/topfec.jpg" ismap="ismap" border="0"/>', ''),
        # we got an ok to not have redundant content
        ('<a href="\.\./pdf/[0-9]+digest.pdf">.pdf version of this Weekly Digest...a>', ''),
        ('.pdf version of this Weekly Digest', ''),
        # In the 80s, they used pre to get spacing, but that kills the font in a bad way, I am adding some inline styling to preserve the spaces. It isn't perfect, but it is better.
        ('<pre>', '<div style="white-space: pre-wrap;">'),
        ('</pre>', '</div>'),
        ('<p><u/></p>', ''),
        ('<p><strong><u/></strong></p>', ''),
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
        ('<a href="http://www.fec.gov/press/press2016/pdf/20160909digest.pdf">pdf version of this Weekly Digest</a>', ''),
        ('<a href="\.\.\/pdf\/[0-9]+release.pdf">\.pdf version of this Weekly Digest...a>', ''),
        ('<a href="\.\.\/pdf\/[0-9]+release.pdf">\.pdf version of this Weekly Digest..a>', ''),
        ('<a href="\.\.\/pdf\/[0-9]+release.pdf">\.pdf version of this Weekly Digest<a>', ''),
        ('<a href="\.\.\/pdf\/[0-9]+release.pdf">\.pdf version...a>', ''),
        ('\.pdf version of this Weekly Digest', ''),
    ]

    for old, new in replacements:
        body = str.replace(body, old, new)

    for old, new in regex_replacements:
        body = re.sub(old, new, body)

    if title:
        body = str.replace(body, """<p align="center"><strong>Weekly Digest</strong></p><p align="center"><strong>{0} </strong></p>""".format(title), '')
        body = str.replace(body, """<h3 align="center"><strong>Weekly Digest </strong></h3><p align="center"><strong><br/></strong><strong>{0} </strong></p>""".format(title), '')
        body = str.replace(body, """<p align="center"><strong>Weekly Digest</strong></p><p align="center"><strong>{0}</strong></p>""".format(title), '')
        body = str.replace(body, """<h3 align="center"><strong>Weekly Digest </strong></h3><p align="center"><strong><br/></strong><strong>{0}</strong></p>""".format(title), '')

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


def add_page(item, base_page):
    item_year = parser.parse(item['date']).year
    title = item['title'][:255]
    slug = slugify(str(item_year) + '-' + title)[:225]
    url_path = "/home/media/" + slug + "/"

    # we need to load multiple times get rid of previous loads
    if Page.objects.filter(url_path=url_path).count() > 0:
        for p in Page.objects.filter(url_path=url_path):
            p.delete()
    clean_body = strip_cruft(item['html'], item['title'])
    linked_body = relink(urljoin(base_url, item['href']), clean_body)
    body = escape(linked_body)
    body_list = [{"value": body, "type": "html"}]
    formatted_body = json.dumps(body_list)
    publish_date = parser.parse(item['date'])

    press_page = dp(
        depth=4,
        numchild=0,
        title=title,
        live=1,
        has_unpublished_changes='0',
        url_path=url_path,
        seo_title=title,
        show_in_menus=0,
        search_description=title,
        expired=0,
        owner_id=1,
        locked=0,
        latest_revision_created_at=publish_date,
        first_published_at=publish_date,
    )

    base_page.add_child(instance=press_page)
    saved_page = dp.objects.get(id=press_page.id)
    saved_page.body = formatted_body
    saved_page.first_published_at = publish_date
    saved_page.created_at = publish_date
    saved_page.date = publish_date
    saved_page.save()


def load_digest_from_json():
    """Loops through json files and adds them to wagtail"""
    # Base Page that the pages you are adding belong to
    base_page = Page.objects.get(url_path='/home/media/')

    paths = sorted(glob.glob('data_loader/data/digest_json/' + '*.json'))
    logger.info("starting...")

    for path in paths:
        with open(path, 'r') as json_contents:
            logger.info(path)
            contents = json.load(json_contents)
            add_page(contents, base_page)


class Command(BaseCommand):
    help = "loads weekly digests from json"

    def handle(self, *args, **options):
        delete_all_digests()
        load_digest_from_json()
        logger.info('Weekly digests loaded')
