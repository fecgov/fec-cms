import json
import os
import requests
from bs4 import BeautifulSoup

from django.core.management import BaseCommand
from django.conf import settings

from home.models import Page
from home.models import (
    CommissionerPage,
    DigestPage,
    PressReleasePage,
    RecordPage,
    TipsForTreasurersPage
)

BASE_URL = settings.CANONICAL_BASE

# These are the parent pages for which we want *all* descendants of, not just direct children
descendents_of = [
    '/home/legal-resources/',
    '/home/help-candidates-and-committees/',
    '/home/press/'
]

# These are the parent pages for which we want *only* direct children
children_of = [
    '/home/',
    '/home/about/',
    '/home/about/leadership-and-structure/'
]

class Command(BaseCommand):
    help = 'Scrapes pages from the CMS into JSON for indexing on DigitalGov Search'

    def add_arguments(self, parser):
        parser.add_argument(
            '--descendants_of',
            type=str,
            help='Path of the parent page whose descendents to get, ex. /home/legal-resources/'
        )

        parser.add_argument(
            '--child_of',
            type=str,
            help='Path of the parent page whose children to get, ex. /home/legal-resources/'
        )

        parser.add_argument(
            '--page',
            type=str,
            help='Specific path to get, ex. /home/legal-resources/'
        )

        parser.add_argument(
            '-no-content',
            type=bool,
            default=False,
            help='Don\'t scrape the content of the page'
        )


    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Getting pages...'))
        if options['page']:
            page = Page.objects.live().public().get(url_path=options['page'])
            # Hack so the loop below works
            pages = [page]
        elif options['descendants_of']:
            parent = Page.objects.live().public().get(url_path=options['descendants_of'])
            pages = Page.objects.descendant_of(parent).live().public()
        elif options['child_of']:
            parent = Page.objects.live().public().get(url_path=options['child_of'])
            pages = Page.objects.child_of(parent).live().public()
        else:
            # If no specific pages were requested, just get them all
            pages = []
            # Get all the pages that are descendants of pages
            for p in descendents_of:
                parent = Page.objects.live().public().get(url_path=p)
                pages += Page.objects.descendant_of(parent).live().public()
            # Get all the pages that are direct children of pages
            for p in children_of:
                parent = Page.objects.live().public().get(url_path=p)
                pages += Page.objects.child_of(parent).live().public()

        extracted = []

        for page in pages:
            p = {
              "document_id": page.id,
              "title": page.title,
              "path": BASE_URL + page.url,
              "created": page.first_published_at.strftime("%Y-%m-%d-%H%M%S"),
              "promote": "false",
              "language": "en",
            }

            if 'no-content' not in options:
              content = self.get_content(page.url)
              if content:
                  p["content"] = content

            extracted.append(p)

        self.write_articles(extracted)

    def get_content(self, url):
        url = BASE_URL + url
        r  = requests.get(url)
        self.stdout.write('Getting content for ' + url)
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

    def write_articles(self, pages, **options):
        self.stdout.write('Writing to file')
        fname = os.path.join(settings.REPO_DIR, 'fec/search/management/data/output.json')
        with open(fname, "w+") as f:
            json.dump(pages, f, indent=4)
