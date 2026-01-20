"""
Management command to import opinions data from the old court case index page.
Uses Django test client - no external dependencies needed.

Usage:
    python manage.py import_court_case_opinions_local
"""

from django.core.management.base import BaseCommand
from django.test import Client
from django.conf import settings
from home.models import CourtCasePage
from django.db import transaction
from html.parser import HTMLParser


class CourtCaseTableParser(HTMLParser):
    """Simple HTML parser to extract court case data from tables"""

    # Void elements that don't have closing tags
    VOID_ELEMENTS = {'br'}

    def __init__(self):
        super().__init__()
        self.cases = []
        self.current_case = {}
        self.in_tbody = False
        self.in_tr = False
        self.in_td = False
        self.td_count = 0
        self.in_a = False
        self.capturing_opinions = False
        self.opinions_content = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == 'tbody':
            self.in_tbody = True
        elif tag == 'tr' and self.in_tbody:
            self.in_tr = True
            self.current_case = {}
            self.td_count = 0
        elif tag == 'td' and self.in_tr:
            self.in_td = True
            self.td_count += 1
            if self.td_count == 2:
                # Start capturing opinions content
                self.capturing_opinions = True
                self.opinions_content = []
        elif tag == 'a' and self.in_td and self.td_count == 1:
            self.in_a = True
            href = attrs_dict.get('href', '')
            self.current_case['url'] = href
        elif self.capturing_opinions:
            # Reconstruct HTML tags for opinions
            attrs_str = ' '.join([f'{k}="{v}"' for k, v in attrs])
            if attrs_str:
                self.opinions_content.append(f'<{tag} {attrs_str}>')
            else:
                self.opinions_content.append(f'<{tag}>')

    def handle_endtag(self, tag):
        if tag == 'tbody':
            self.in_tbody = False
        elif tag == 'tr':
            if self.in_tr and self.current_case:
                self.cases.append(self.current_case.copy())
            self.in_tr = False
        elif tag == 'td':
            self.in_td = False
            if self.capturing_opinions:
                self.capturing_opinions = False
                opinions = ''.join(self.opinions_content).strip()
                self.current_case['opinions'] = opinions
        elif tag == 'a' and self.in_a:
            self.in_a = False
        elif self.capturing_opinions and tag not in self.VOID_ELEMENTS:
            # Don't add closing tags for void elements like <br>, <hr>, etc.
            self.opinions_content.append(f'</{tag}>')

    def handle_data(self, data):
        if self.in_a and self.td_count == 1:
            self.current_case['title'] = data.strip()
        elif self.capturing_opinions:
            self.opinions_content.append(data)


class Command(BaseCommand):
    help = 'Import opinions data from the old court case alphabetical index page'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without applying them',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed debug information',
        )
        parser.add_argument(
            '--server-name',
            type=str,
            default=None,
            help='Server name to use (defaults to first ALLOWED_HOST)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verbose = options.get('verbose', False)
        server_name = options.get('server_name')

        # Determine server name from settings if not provided
        if not server_name:
            allowed_hosts = settings.ALLOWED_HOSTS
            if allowed_hosts and allowed_hosts[0] != '*':
                server_name = allowed_hosts[0]
            else:
                server_name = 'localhost'

        self.stdout.write(f'Using server name: {server_name}')
        self.stdout.write('Fetching court case index page...')

        client = Client()
        response = client.get(
            '/legal-resources/court-cases/court-case-alphabetical-index/',
            SERVER_NAME=server_name
        )

        if response.status_code != 200:
            self.stdout.write(
                self.style.ERROR(f'Failed to fetch page. Status: {response.status_code}')
            )
            return

        # Parse the HTML
        parser = CourtCaseTableParser()
        parser.feed(response.content.decode('utf-8'))

        if not parser.cases:
            self.stdout.write(self.style.ERROR('No court cases found on the page'))
            return

        self.stdout.write(f'Found {len(parser.cases)} court case entries')

        if verbose:
            self.stdout.write('\nFirst 3 parsed cases:')
            for case in parser.cases[:3]:
                self.stdout.write(f"  Title: {case.get('title', 'N/A')}")
                self.stdout.write(f"  URL: {case.get('url', 'N/A')}")
                opinions = case.get('opinions', 'N/A')
                opinions_preview = opinions[:80] + '...' if len(opinions) > 80 else opinions
                self.stdout.write(f"  Opinions: {opinions_preview}\n")

        if dry_run:
            self.stdout.write(self.style.WARNING('\n=== DRY RUN MODE ===\n'))

        updated_count = 0
        not_found_count = 0
        skipped_count = 0

        for case_data in parser.cases:
            case_url = case_data.get('url', '')
            case_title = case_data.get('title', '')
            opinions_html = case_data.get('opinions', '').strip()

            # Skip completely empty entries (parser artifacts)
            if not case_title and not case_url:
                continue

            # Skip if it's just "None" or empty
            if '<em>None</em>' in opinions_html or not opinions_html:
                if verbose:
                    self.stdout.write(f'  Skipping "{case_title}" - no opinions data')
                skipped_count += 1
                continue

            # Extract slug from URL
            slug = case_url.strip('/').split('/')[-1] if case_url else None

            if not slug:
                # Only warn if there's a title (real issue), not for empty rows
                if case_title and verbose:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  Skipping "{case_title}" - no URL found'
                        )
                    )
                not_found_count += 1
                continue

            try:
                court_case = CourtCasePage.objects.get(slug=slug)
            except CourtCasePage.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'  CourtCasePage not found for slug: {slug}')
                )
                not_found_count += 1
                continue

            if dry_run:
                preview = opinions_html[:100] + '...' if len(opinions_html) > 100 else opinions_html
                self.stdout.write(f'\nWould update: {court_case.title} (slug: {slug})')
                self.stdout.write(f'  Opinions: {preview}')
            else:
                with transaction.atomic():
                    court_case.opinions = opinions_html
                    court_case.save()
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✓ Updated: {court_case.title}')
                    )

            updated_count += 1

        self.stdout.write('\n' + '='*50)
        if dry_run:
            self.stdout.write(self.style.WARNING('=== DRY RUN COMPLETE ==='))
            self.stdout.write(f'Would update {updated_count} court case(s)')
        else:
            self.stdout.write(self.style.SUCCESS(f'✓ Updated {updated_count} court case(s)'))

        self.stdout.write(f'Skipped {skipped_count} case(s) with no opinions')
        self.stdout.write(f'Could not find {not_found_count} court case(s)')

        if dry_run:
            self.stdout.write('\nRun without --dry-run to apply changes')
