import json
import os
import requests
from bs4 import BeautifulSoup

from django.core.management import BaseCommand

from home.models import Page
from home.models import (
    CommissionerPage,
    DigestPage,
    PressReleasePage,
    RecordPage,
    TipsForTreasurersPage
)

BASE_URL = 'https://beta.fec.gov'

class Command(BaseCommand):
    help = 'Scrapes pages'

    def add_arguments(self, parser):
        parser.add_argument(
            '--descendents_of',
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

        parser.add_argument(
            '-tips',
            type=bool,
            default=False,
            help='Get Tips for Treasurers only'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Getting pages...'))
        if options['page']:
            page = Page.objects.get(url_path=options['page'])
            # Hack so the loop below works
            pages = [page]
        elif options['descendents_of']:
            parent = Page.objects.get(url_path=options['descendant_of'])
            pages = Page.objects.descendant_of(parent).live()
        elif options['child_of']:
            parent = Page.objects.get(url_path=options['child_of'])
            pages = Page.objects.child_of(parent).live()
        elif options['tips']:
            pages = TipsForTreasurersPage.objects.live()
        extracted = []

        for page in pages:
            p = {
              "document_id": page.id,
              "title": page.title,
              "path": "https://beta.fec.gov" + page.url,
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
        url = "https://beta.fec.gov" + url
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
        fname = os.path.join('fec/search/management/dump.json')
        with open(fname, "w+") as f:
            json.dump(pages, f, indent=4)

    def post(page):
        requests.post("https://i14y.usa.gov/api/v1/documents", auth=(DIGITALGOV_DRAWER, DIGITALGOV_DRAWER_KEY), data=page)
