from django.core.management import BaseCommand

from data_loader.utils import ImporterMixin


class Command(ImporterMixin, BaseCommand):
    help = 'Imports Meeting Agenda pages from JSON'
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
        pass

    def create_pages(self, page_structs, base_page):
        pass