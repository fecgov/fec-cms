import glob
import json

from dateutil import parser
from slugify import slugify
from urllib.parse import urljoin

from django.core.management import BaseCommand

from data_loader.utils import ImporterMixin
from fec.constants import record_page_categories
from home.models import Page, RecordPage, RecordPageAuthors
from home.utils.link_reroute import make_absolute_links


BASE_FEC_PRESS_URL = 'http://www.fec.gov/press/'
DEFAULT_AUTHOR_EMAIL = 'N/A'
DEFAULT_AUTHOR_ROLE = 'author'
DEFAULT_AUTHOR_TITLE = 'N/A'
DEFAULT_CATEGORY = 'outreach'  # TODO:  Is this correct or sensible?

# Map of invalid category names known to be in the data.
INVALID_CATEGORIES = {
    'Commision': 'Commission',
    'CommissionCompliance': 'Commission',
    'Litgation': 'Litigation',
    'Outeach': 'Outreach',
    'OutreachCommission': 'Outreach',
    'OutreachReporting': 'Outreach',
    'RegulationsOutreach': 'Regulations',
}


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

    def handle(self, *args, **options):
        if options['delete_existing']:
            self.stdout.write(
                self.style.WARNING('Deleting previous records...')
            )
            self.delete_existing_records(RecordPage, **options)

        self.stdout.write(self.style.WARNING('Starting import...'))

        # Base Page that the pages you are adding belong to.
        # TODO:  Is this correct for record pages?
        base_page = Page.objects.get(url_path='/home/updates/')

        with open(options['json_file_path'], 'r') as json_contents:
            if options['verbosity'] > 1:
                self.stdout.write((options['json_file_path']))

            contents = json.load(json_contents)

            #if contents['title_text'] is None or contents['title_text'].isspace():
                # This seems to be the case for the record pages.
                #contents['title_text'] = contents['research_categories']

            self.add_page(contents, base_page, **options)

        self.stdout.write(self.style.SUCCESS('Record pages imported.'))

    def add_page(self, contents, base_page, **options):
        """
        Cleans the contents of a record and imports it as a page into Wagtail.
        """

        for item in contents:
            item_year = parser.parse(item['posted_date']).year
            title = item['title_text'][:255]

            category = self.clean_category(
                item.get('research_categories', DEFAULT_CATEGORY),
                INVALID_CATEGORIES,
                **options
            )

            category = self.validate_category(
                category,
                DEFAULT_CATEGORY,
                record_page_categories,
                **options
            )

            slug = slugify(str(item_year) + '-' + category + '-' + title)[:225]
            # TODO:  Is this path correct?
            url_path = '/home/updates/' + slug + '/'
            clean_body = self.clean_content(item['body'], **options)
            body = self.escape_quotes(clean_body, **options)
            body_list = [{"value": body, "type": "html"}]
            formatted_body = json.dumps(body_list)
            publish_date = parser.parse(item['posted_date'])
            monthly_issue_text = item.get('monthly_issue_text', '')
            monthly_issue_url = item.get('monthly_issue_url', '')

            keywords = self.clean_keywords(item.get('keywords', []))
            authors = self.clean_authors(
                item.get('authors', []),
                DEFAULT_AUTHOR_EMAIL,
                DEFAULT_AUTHOR_TITLE,
                **options
            )

            record_page = RecordPage(
                depth=4,
                numchild=0,
                title=title,
                live=1,
                has_unpublished_changes='0',
                url_path=url_path,
                seo_title=title,
                show_in_menus=0,
                search_description=title,
                category=category,
                expired=0,
                owner_id=1,
                locked=0,
                latest_revision_created_at=publish_date,
                first_published_at=publish_date,
                monthly_issue=monthly_issue_text,
                monthly_issue_url=monthly_issue_url
            )

            try:
                base_page.add_child(instance=record_page)
                saved_page = RecordPage.objects.get(id=record_page.id)
                saved_page.body = formatted_body
                saved_page.first_published_at = publish_date
                saved_page.created_at = publish_date
                saved_page.date = publish_date
                saved_page.keywords.add(*keywords)

                record_page_authors = self.get_or_create_record_page_authors(
                    authors,
                    saved_page,
                    **options
                )

                saved_page.authors.add(*record_page_authors)
                saved_page.save()

                if options['verbosity'] > 1:
                    self.stdout.write(self.style.SUCCESS(
                        'Successfully added {0}.'.format(saved_page.id)
                    ))
            except:
                self.stdout.write(self.style.WARNING(
                    'Could not save page {0}'.format(record_page.title)
                ))

    def get_or_create_record_page_authors(self, authors, record_page, **options):
        """
        Retrieves or creates RecordPageAuthors objects.
        """

        record_page_author_objects = []

        for author in authors:
            # The combination of an author and role is unique, but there is
            # the potential of there being more than one combination for any
            # given author.  Due to this, assume that the first pairing is the
            # one we're looking for if any are found.
            record_page_authors = RecordPageAuthors.objects.filter(
                author=author
            )
            record_page_authors_count = record_page_authors.count()

            if record_page_authors_count > 0:
                record_page_author_objects.append(record_page_authors[0])

                if record_page_authors_count > 1:
                    self.stdout.write(self.style.WARNING(
                        'Multiple record page authors found for name "{0}" ({1} total)'.format(
                            author.name,
                            record_page_authors_count
                        )
                    ))
            else:
                record_page_author_objects.append(
                    RecordPageAuthors.objects.create(
                        author=author,
                        role=DEFAULT_AUTHOR_ROLE,
                        page=record_page
                    )
                )

                if options['verbosity'] > 1:
                    self.stdout.write(self.style.SUCCESS(
                        'Successfully created record page author object for {0}'.format(
                            author
                        )
                    ))

        return record_page_author_objects
