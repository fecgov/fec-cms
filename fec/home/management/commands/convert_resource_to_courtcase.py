"""
Management command to convert ResourcePage court cases to CourtCasePage.

Usage:
    python manage.py convert_resource_to_courtcase --dry-run  # Preview changes
    python manage.py convert_resource_to_courtcase            # Execute conversion
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from home.models import ResourcePage, CourtCasePage
from wagtail.models import Page


class Command(BaseCommand):
    help = 'Convert ResourcePage court cases to CourtCasePage'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without applying them',
        )
        parser.add_argument(
            '--parent-slug',
            type=str,
            default='court-cases',
            help='Slug of the parent page (default: court-cases)',
        )
        parser.add_argument(
            '--page-id',
            type=int,
            help='Convert only a single page by ID',
        )
        parser.add_argument(
            '--page-slug',
            type=str,
            help='Convert only a single page by slug',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        parent_slug = options['parent_slug']
        page_id = options.get('page_id')
        page_slug = options.get('page_slug')

        # Handle single page conversion
        if page_id or page_slug:
            try:
                if page_id:
                    resource_page = ResourcePage.objects.get(id=page_id)
                else:
                    resource_page = ResourcePage.objects.get(slug=page_slug)
                resource_pages = [resource_page]
                self.stdout.write(self.style.SUCCESS(f'Found page: {resource_page.title} (ID: {resource_page.id})'))
            except ResourcePage.DoesNotExist:
                identifier = f'ID {page_id}' if page_id else f'slug "{page_slug}"'
                self.stdout.write(self.style.ERROR(f'ResourcePage with {identifier} not found'))
                return
        else:
            # Find the court cases parent page
            try:
                parent_page = Page.objects.get(slug=parent_slug)
            except Page.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Parent page with slug "{parent_slug}" not found'))
                return

            # Find all ResourcePages that are children of the court-cases page
            resource_pages = ResourcePage.objects.live().descendant_of(parent_page)

            if not resource_pages.exists():
                self.stdout.write(self.style.WARNING('No ResourcePages found under court-cases'))
                return

            self.stdout.write(self.style.SUCCESS(f'Found {resource_pages.count()} ResourcePage(s) to convert'))

        if dry_run:
            self.stdout.write(self.style.WARNING('\n=== DRY RUN MODE ===\n'))

        for resource_page in resource_pages:
            self.stdout.write(f'\nConverting: {resource_page.title} (ID: {resource_page.id})')

            if dry_run:
                self.stdout.write('  - Would convert to CourtCasePage')
                self.stdout.write(f'  - Parent: {resource_page.get_parent().title}')
                continue

            # Perform the conversion in a transaction
            try:
                with transaction.atomic():
                    self._convert_page(resource_page)
                    self.stdout.write(self.style.SUCCESS('  ✓ Successfully converted'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ✗ Error: {str(e)}'))

        if dry_run:
            self.stdout.write(self.style.WARNING('\n=== DRY RUN COMPLETE ==='))
            self.stdout.write('Run without --dry-run to apply changes')
        else:
            self.stdout.write(self.style.SUCCESS('\n✓ Conversion complete'))

    def _convert_page(self, resource_page):
        """Convert a ResourcePage to CourtCasePage"""
        from django.contrib.contenttypes.models import ContentType
        from django.db import connection

        # Get the base Page object
        page_id = resource_page.page_ptr_id

        # Get the raw StreamField JSON data from the database
        # We need to query the database directly to get the JSON string
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    sidebar_title,
                    related_pages,
                    sections,
                    citations,
                    related_topics,
                    show_contact_card
                FROM home_resourcepage
                WHERE page_ptr_id = %s
                """,
                [page_id]
            )
            row = cursor.fetchone()

        data_to_copy = {
            'sidebar_title': row[0] or '',
            'related_pages': row[1] or '[]',
            'sections': row[2] or '[]',
            'citations': row[3] or '[]',
            'related_topics': row[4] or '[]',
            'show_contact_card': row[5] or False,
        }

        # Update the content_type on the Page model using raw SQL
        court_case_content_type = ContentType.objects.get_for_model(CourtCasePage)
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE wagtailcore_page SET content_type_id = %s WHERE id = %s",
                [court_case_content_type.id, page_id]
            )

        # Delete the old ResourcePage instance using raw SQL (keeps the base Page)
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM home_resourcepage WHERE page_ptr_id = %s",
                [page_id]
            )

        # Insert directly into the CourtCasePage table
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO home_courtcasepage (
                    page_ptr_id,
                    index_title,
                    status,
                    opinions,
                    see_also_cases,
                    case_numbers,
                    sidebar_title,
                    related_pages,
                    sections,
                    citations,
                    related_topics,
                    show_contact_card,
                    show_search,
                    selected_court_case
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                """,
                [
                    page_id,
                    '',  # index_title
                    'closed',  # status
                    '',  # opinions
                    '[]',  # see_also_cases (empty StreamField)
                    '[]',  # case_numbers (empty StreamField)
                    data_to_copy['sidebar_title'],
                    data_to_copy['related_pages'],
                    data_to_copy['sections'],
                    data_to_copy['citations'],
                    data_to_copy['related_topics'],
                    data_to_copy['show_contact_card'],
                    False,  # show_search
                    False,  # selected_court_case
                ]
            )

        self.stdout.write(f'  ✓ Converted to CourtCasePage (ID: {page_id})')
