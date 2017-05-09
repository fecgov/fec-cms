import json
import os
import requests
from bs4 import BeautifulSoup

from django.conf import settings
from django.core.management import BaseCommand

from home.models import Page


DIGITALGOV_DRAWER = 'main'
DIGITALGOV_DRAWER_KEY = settings.FEC_DIGITALGOV_DRAWER_KEY

class Command(BaseCommand):
    help = 'Scrapes pages'

    def add_arguments(self, parser):
        parser.add_argument(
            'json_file_path',
            type=str,
            help='Path to JSON file to load'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Indexing pages'))

        with open(options['json_file_path'], 'r') as json_contents:
            if options['verbosity'] > 1:
                self.stdout.write((options['json_file_path']))

            pages = json.load(json_contents)
            for page in pages:
                self.add(page)

        self.stdout.write(self.style.SUCCESS('All done'))

    def add(self, page):
        r = requests.post("https://i14y.usa.gov/api/v1/documents", auth=(DIGITALGOV_DRAWER, DIGITALGOV_DRAWER_KEY), data=page)
        # A 422 means the page already exists,
        if r.status_code == 422:
            self.stdout.write('{} already exists'.format(page['document_id']))
            self.update(page)
        elif r.status_code == 201:
            self.stdout.write('Created {}'.format(page['document_id']))
        else:
            self.stdout.write('Could not create {}'.format(page['document_id']))
            print(r.__dict__)

    def update(self, page):
        self.stdout.write('Updating {}'.format(page['document_id']))
        requests.put("https://i14y.usa.gov/api/v1/documents", auth=(DIGITALGOV_DRAWER, DIGITALGOV_DRAWER_KEY), data=page)

    def delete(self, page):
        self.stdout.write('Deleting {}'.format(page['document_id']))
        requests.delete("https://i14y.usa.gov/api/v1/documents", auth=(DIGITALGOV_DRAWER, DIGITALGOV_DRAWER_KEY), data=page)
