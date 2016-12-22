import glob
import json

from dateutil import parser
from slugify import slugify
from urllib.parse import urljoin

from django.core.management import BaseCommand

from data_loader.utils import ImporterMixin
from home.models import DigestPage, Page
from home.utils.link_reroute import make_absolute_links


BASE_FEC_PRESS_URL = 'http://www.fec.gov/press/'


class Command(ImporterMixin, BaseCommand):
    help = 'Imports weekly digests from JSON'
    requires_migrations_checks = True
    requires_system_checks = True

    def add_arguments(self, parser):
        parser.add_argument(
            '--delete-existing',
            action='store_true',
            dest='delete_existing',
            default=False,
            help='Delete existing records prior to importing',
        )

    def handle(self, *args, **options):
        import_digest_from_json()

    def handle(self, *args, **options):
        if options['delete_existing']:
            self.stdout.write(
                self.style.WARNING('Deleting previous records...')
            )
            self.delete_existing_records(DigestPage, **options)

        self.stdout.write(self.style.WARNING('Starting import...'))


        # Base Page that the pages you are adding belong to
        base_page = Page.objects.get(url_path='/home/updates/')
        paths = sorted(glob.glob('data_loader/data/digest_json/' + '*.json'))

        for path in paths:
            with open(path, 'r') as json_contents:
                if options['verbosity'] > 1:
                    self.stdout.write((path))

                contents = json.load(json_contents)
                self.add_page(contents, base_page, **options)

        self.stdout.write(self.style.SUCCESS('Weekly digests imported.'))

    def add_page(self, item, base_page, **options):
        """
        Cleans the contents of a record and imports it as a page into Wagtail.
        """

        item_year = parser.parse(item['date']).year
        title = item['title'][:255]
        slug = slugify(str(item_year) + '-' + title)[:225]
        url_path = '/home/updates/' + slug + '/'

        # we need to load multiple times get rid of previous loads
        if Page.objects.filter(url_path=url_path).count() > 0:
            for p in Page.objects.filter(url_path=url_path):
                p.delete()

        clean_body = self.clean_content(item['html'], **options)
        linked_body = make_absolute_links(
            urljoin(BASE_FEC_PRESS_URL, item['href']),
            clean_body
        )
        body = self.escape_quotes(linked_body)
        body_list = [{"value": body, "type": "html"}]
        formatted_body = json.dumps(body_list)
        publish_date = parser.parse(item['date'])

        press_page = DigestPage(
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

        try:
            base_page.add_child(instance=press_page)
            saved_page = DigestPage.objects.get(id=press_page.id)
            saved_page.body = formatted_body
            saved_page.first_published_at = publish_date
            saved_page.created_at = publish_date
            saved_page.date = publish_date
            saved_page.save()

            if options['verbosity'] > 1:
                self.stdout.write(self.style.SUCCESS(
                    'Successfully added {0}.'.format(saved_page.id)
                ))
        except:
            self.stdout.write(self.style.WARNING(
                'Could not save page {0}'.format(press_page.title)
            ))
