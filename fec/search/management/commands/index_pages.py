import json
import os
import requests

from django.conf import settings
from django.core.management import BaseCommand

drawer = settings.DIGITALGOV_DRAWER_HANDLE
key = settings.FEC_DIGITALGOV_DRAWER_KEY_MAIN


class Command(BaseCommand):
    help = 'Indexes pages'

    def add_arguments(self, parser):
        parser.add_argument(
            '--json_file_path',
            type=str,
            help='Path to JSON file to load'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Indexing pages'))

        if options['json_file_path']:
            file_name = options['json_file_path']
        else:
            file_name = os.path.join(settings.REPO_DIR, 'fec/search/management/data/output.json')

        with open(file_name, 'r') as json_contents:
            if options['verbosity'] > 1:
                self.stdout.write((options['json_file_path']))

            pages = json.load(json_contents)
            for page in pages:
                self.add(page)

        self.stdout.write(self.style.SUCCESS('All done'))

    def add(self, page):
        r = requests.post("https://i14y.usa.gov/api/v1/documents", auth=(drawer, key), data=page)
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
        url = "https://i14y.usa.gov/api/v1/documents/{}".format(page.get('document_id'))
        r = requests.put(url, auth=(drawer, key), data=page)
        if r.status_code == 200:
            self.stdout.write('Updated {}'.format(page['document_id']))
        else:
            self.stdout.write('Could not update {}'.format(page['document_id']))
            print(r.__dict__)

    def delete(self, page):
        self.stdout.write('Deleting {}'.format(page['document_id']))
        requests.delete("https://i14y.usa.gov/api/v1/documents", auth=(drawer, key), data=page)
