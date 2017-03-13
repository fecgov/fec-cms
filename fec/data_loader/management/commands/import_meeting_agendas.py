from django.core.management import BaseCommand
from io import TextIOWrapper
import json
from typing import Any, Dict

from data_loader.utils import ImporterMixin
from home.models import AgendaPage, Page


class Command(ImporterMixin, BaseCommand):
    help = 'Imports Meeting Agenda pages from JSON'
    requires_migrations_checks = True
    requires_system_checks = True

    def add_arguments(self, parser) -> None:
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
    def _open_json_file(options: Dict[str, Any]) -> TextIOWrapper:
        return open(options['json_file_path'], 'r')

    def _log_warning(self, message: Any) -> None:
        self.stdout.write(self.style.WARNING(repr(message)))

    @staticmethod
    def _parent_page(options: Dict[str, Any]) -> Page:
        return Page.objects.get(url_path=options['parent_path'])

    def _create_pages(self, json_text: TextIOWrapper, parent_page: Page, options: Dict[str, Any]) -> None:
        for meeting_struct in json.load(json_text):
            self._create_agenda_page(meeting_struct, parent_page)

    def _create_agenda_page(self, meeting_struct: Dict[str, Any], parent_page: Page) -> None:
        """
        Available keys are: [
            'agenda_document_links', 
            'approved_minutes_date', 
            'approved_minutes_link', 
            'body', 
            'closed_captioning_link', 
            'draft_minutes_links', 
            'sunshine_act_links', 
            'link_title_text', 
            'meeting_type', 
            'old_meeting_url', 
            'pdf_disclaimer', 
            'posted_date', 
            'primary_audio_link', 
            'secondary_audio_links', 
            'title_text', 
            'video_link']
        """
        new_page = AgendaPage(
            depth=2,
            numchild=0,
            title=meeting_struct['title_text'],
            live=1
        )
        parent_page.add_child(instance=new_page)
        new_page.save()
