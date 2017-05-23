import json
import os
import requests
from bs4 import BeautifulSoup

from django.core.management import BaseCommand
from django.conf import settings

BASE_URL = settings.CANONICAL_BASE


class Command(BaseCommand):
    help = 'Takes a JSON list of web app pages and scrapes content from the live site. Saves JSON for indexing on DigitalGov Search'

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
            file_name = os.path.join(settings.REPO_DIR, 'fec/search/management/data/web_app_pages.json')
        with open(file_name, 'r') as json_contents:
            """
            Read a JSON file with data structured like:
              {
                "document_id": "app-1",
                "title": "Campaign finance data home",
                "path": "https://beta.fec.gov/data/",
                "created": "2017-04-01",
                "language": "en",
                "promote": "true",
                "description": "See how candidates and committees raise and spend money in federal elections. This financial data helps voters make informed decisions.",
                "tags": "data, finance data, contributions, candidates, committees, pacs, super pacs, disclosure",
                "content": "",
                "scrape_content": ""
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

                # Scrape the content of the live page if the page explicitly asks for it
                if page.get('scrape_content'):
                    content = self.get_content(p['path'])
                    if content:
                      p['content'] = content

                extracted.append(p)

        self.write_articles(extracted)

    def get_content(self, url):
        """
        Scrapes the text content from a given URL.
        Looks specifically for #main
        """
        r  = requests.get(url)
        self.stdout.write('Getting content for ' + url)
        data = r.text
        soup = BeautifulSoup(data, 'lxml')
        text = ''

        main = soup.find_all('main', id='main')

        for tag in main:
            text = text + tag.get_text().replace('\n', ' ')

        return text

    def write_articles(self, pages, **options):
        """Write the extracted data to a file"""
        self.stdout.write('Writing to file')
        fname = os.path.join(settings.REPO_DIR, 'fec/search/management/data/output.json')
        with open(fname, 'w+') as f:
            json.dump(pages, f, indent=4)
