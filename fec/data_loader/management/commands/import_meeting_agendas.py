from django.core.management import BaseCommand
from typing import Any, Dict

from data_loader.utils import ImporterMixin
from home.models import AgendaPage, Page


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

    def handle(self, *args, **options) -> None:
        self._delete_existing_records(options)
        with self._open_json_file(options) as json:
            self._create_pages(json, self._parent_page(options), options)

    def _delete_existing_records(self, options: Dict[str, Any]) -> None:
        if options['delete_existing']:
            self._log_warning('Deleting existing records...')
            self.delete_existing_records(AgendaPage, **options)

    @staticmethod
    def _open_json_file(options: Dict[str, Any]):
        return open(options['json_file_path'], 'r')

    def _create_pages(self, json, parent_page, options: Dict[str, Any]) -> None:
        self._log_warning(json.readlines())

    def _log_warning(self, message: Any) -> None:
        self.stdout.write(self.style.WARNING(str(message)))

    @staticmethod
    def _parent_page(options: Dict[str, Any]):
        return Page.objects.get(url_path=options['parent_path'])