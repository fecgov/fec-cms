import json
import os
import requests
from bs4 import BeautifulSoup

from django.core.management import BaseCommand
from django.conf import settings

BASE_URL = 'https://transition.fec.gov'


class Command(BaseCommand):
    help = 'Takes a JSON list of transition pages and scrapes content from the live site. Saves JSON for indexing on DigitalGov Search'

    def add_arguments(self, parser):
        parser.add_argument(
            '--json_file_path',
            type=str,
            help='Path to JSON file to load'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Getting pages...'))
        extracted = []
        if options['json_file_path']:
            file_name = options['json_file_path']
        else:
            file_name = os.path.join(settings.REPO_DIR, 'fec/search/management/data/transition_pages.json')
        with open(file_name, 'r') as json_contents:
            """
            Read a JSON file with data structured like:
              {
                "document_id": "transition-1",
                "path": "http://transition.fec.gov/pubrec/publicrecordsoffice.shtml",
                "created": "04/01/2017",
                "language": "en",
                "title": "Public Records Office",
                "tags": [optional],
                "description": [optional]
              },
            """
            pages = json.load(json_contents)
            # Populate meta data
            for page in pages:
                p = {
                  'document_id': page.get('document_id'),
                  'title': page.get('title'),
                  'path': page.get('path'),
                  'created': page.get('created'),
                  'promote': page.get('promote', 'false'),
                  'description': page.get('description', ''),
                  'tags': page.get('tags', ''),
                  'language': 'en'
                }

                # Scrape the content of the live page
                content = self.get_content(p['path'])
                if content:
                  p['content'] = content

                extracted.append(p)

        self.write_articles(extracted)

    def get_content(self, url):
        """
        Scrapes the text content from a given URL.
        Looks specifically for #fec_mainContentWide or #fec_mainContent,
        the main IDs of the body content areas on these pages.
        """
        r  = requests.get(url)
        self.stdout.write('Getting content for ' + url)
        data = r.text
        soup = BeautifulSoup(data, 'lxml')
        text = ''

        mainContentWide = soup.find_all('div', id='fec_mainContentWide')
        if not mainContentWide:
            mainContent = soup.find_all('div', id='fec_mainContent')
        content = mainContentWide if mainContentWide else mainContent

        for tag in content:
            text = text + tag.get_text().replace('\n', ' ')

        return text

    def write_articles(self, pages, **options):
        """Write the extracted data to a file"""
        self.stdout.write('Writing to file')
        fname = os.path.join(settings.REPO_DIR, 'fec/search/management/data/output.json')
        with open(fname, 'w+') as f:
            json.dump(pages, f, indent=4)
