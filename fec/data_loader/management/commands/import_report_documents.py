import json

from dateutil import parser
from slugify import slugify

from django.utils import timezone
from django.core.management import BaseCommand

from data_loader.utils import ImporterMixin
from fec.constants import report_child_categories
from home.models import Page, DocumentPage

DEFAULT_CATEGORY = ''

class Command(ImporterMixin, BaseCommand):
    help = 'Imports record pages from JSON'
    requires_migrations_checks = True
    requires_system_checks = True

    def add_arguments(self, parser):
        parser.add_argument(
            'json_file_path',
            type=str,
            help='Path to JSON file to load'
        )

        parser.add_argument(
            'parent_path',
            type=str,
            help='Path to the parent page to import these under (e.g. /home/about/reports-about-fec/oig-reports/)'
        )

        parser.add_argument(
            '--delete-existing',
            action='store_true',
            dest='delete_existing',
            default=False,
            help='Delete existing records prior to importing',
        )

    def handle(self, *args, **options):
        if options['delete_existing']:
            self.stdout.write(
                self.style.WARNING('Deleting previous records...')
            )
            self.delete_existing_records(DocumentPage, **options)

        self.stdout.write(self.style.WARNING('Starting import...'))

        # Base Page that the pages you are adding belong to.
        base_page = Page.objects.get(url_path=options['parent_path'])

        with open(options['json_file_path'], 'r') as json_contents:
            if options['verbosity'] > 1:
                self.stdout.write((options['json_file_path']))

            contents = json.load(json_contents)
            self.add_page(contents, base_page, **options)

        self.stdout.write(self.style.SUCCESS('Document pages imported.'))

    def add_page(self, contents, base_page, **options):
        """
        Adds the report info to a new DocumentPage
        Expects json in the format:
        [
          {
            "title": "February 2015 OIG Report",
            "url": "http://www.fec.gov/fecig/documents/ReviewofOutstandingRecommendationsasofFebruary2015-FinalReport.pdf",
            "date": "02/01/2015",
            "category": "oig report"
          },
        ]
        """
        for item in contents:
            item_year = parser.parse(item['date']).year
            title = item['title']
            slug = slugify(str(item_year) + '-' + title)[:225]
            url_path = options['parent_path'] + slug + '/'
            dt_unaware = parser.parse(item['date'])
            # Make datetime timezone aware to get rid of warnings
            publish_date = timezone.make_aware(dt_unaware, timezone.get_current_timezone())
            size = item['size'] if 'size' in item else None
            year_only = item['year_only'] if 'year_only' in item else False
            category = self.validate_category(
                item.get('category', DEFAULT_CATEGORY),
                DEFAULT_CATEGORY,
                report_child_categories,
                **options
            )
            document_page = DocumentPage(
                depth=4,
                numchild=0,
                title=title,
                file_url=item['url'],
                size=size,
                category=category,
                year_only=year_only,
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
                first_published_at=publish_date
            )

            try:
                base_page.add_child(instance=document_page)
                saved_page = DocumentPage.objects.get(id=document_page.id)
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
                    'Could not save page {0}'.format(document_page.title)
                ))
