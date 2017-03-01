import json

from dateutil import parser
from slugify import slugify

from django.core.management import BaseCommand

from data_loader.utils import ImporterMixin
from home.models import Page, TipsForTreasurersPage


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
            '--delete-existing',
            action='store_true',
            dest='delete_existing',
            default=False,
            help='Delete existing records prior to importing',
        )

        parser.add_argument(
            '--import-raw',
            action='store_true',
            dest='import_raw',
            default=False,
            help='Import the records as raw HTML',
        )

    def handle(self, *args, **options):
        if options['delete_existing']:
            self.stdout.write(
                self.style.WARNING('Deleting previous records...')
            )
            self.delete_existing_records(TipsForTreasurersPage, **options)

        self.stdout.write(self.style.WARNING('Starting import...'))

        # Base Page that the pages you are adding belong to.
        base_page = Page.objects.get(url_path='/home/updates/')

        with open(options['json_file_path'], 'r') as json_contents:
            if options['verbosity'] > 1:
                self.stdout.write((options['json_file_path']))

            contents = json.load(json_contents)
            self.add_page(contents, base_page, **options)

        self.stdout.write(self.style.SUCCESS('Tips pages imported.'))

    def add_page(self, contents, base_page, **options):
        """
        Cleans the contents of a tip and imports it as a page into Wagtail.
        """

        # Determine if the body content should go into a RichTextBlock or a
        # RawHTMLBlock as defined in our underlying ContentPage model.  Please
        # see Wagtail's documentation for more information on block types:
        # http://docs.wagtail.io/en/v1.8/topics/streamfield.html
        block_type = "paragraph"

        if options['import_raw']:
            block_type = "html"

        for item in contents:
            item_year = parser.parse(item['posted_date']).year
            title = item['title_text'][:255]

            slug = slugify(str(item_year) + '-' + title)[:225]
            # TODO:  Is this path correct?
            url_path = '/home/updates/' + slug + '/'
            clean_body = self.clean_content(item['body'], **options)
            body = self.escape_quotes(clean_body, **options)
            paragraph = self.wrap_with_paragraph(body, **options)
            body_list = [{"value": paragraph, "type": block_type}]
            formatted_body = json.dumps(body_list)
            publish_date = parser.parse(item['posted_date'])

            tip_page = TipsForTreasurersPage(
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
                first_published_at=publish_date
            )

            try:
                base_page.add_child(instance=tip_page)
                saved_page = TipsForTreasurersPage.objects.get(id=tip_page.id)
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
                    'Could not save page {0}'.format(tip_page.title)
                ))
