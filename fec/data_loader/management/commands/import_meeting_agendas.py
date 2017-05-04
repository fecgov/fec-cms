import datetime
import json

from dateutil import parser
from io import TextIOWrapper

from django.core.management import BaseCommand
from django.utils import timezone

from data_loader.utils import ImporterMixin
from home.models import AgendaPage, Page


class Command(ImporterMixin, BaseCommand):
    """
    Import JSON scraped from the Meeting Agenda pages at
    http://www.fec.gov/agenda/agendas.shtml.
    """
    help = 'Imports Meeting Agenda pages from JSON'
    requires_migrations_checks = True
    requires_system_checks = True

    def add_arguments(self, arg_parser) -> None:
        arg_parser.add_argument(
            'json_file_path',
            type=str,
            help='Path to JSON file to load'
        )

        arg_parser.add_argument(
            'parent_path',
            type=str,
            help='Path to the parent page to import these under (e.g. /home/about/reports-about-fec/oig-reports/)'
        )

        arg_parser.add_argument(
            '--delete-existing',
            action='store_true',
            dest='delete_existing',
            default=False,
            help='Delete existing records prior to importing',
        )

    def handle(self, *args, **options) -> None:
        self._delete_existing_records(options)
        with self._open_json_file(options) as json_text:
            self._create_pages(json_text, self._parent_page(options), options)


    def _delete_existing_records(self, options: dict) -> None:
        if options['delete_existing']:
            self._log('Deleting existing records...')
            self.delete_existing_records(AgendaPage, **options)

    @staticmethod
    def _open_json_file(options: dict) -> TextIOWrapper:
        return open(options['json_file_path'], 'r')

    def _log(self, message) -> None:
        self.stdout.write(repr(message))

    @staticmethod
    def _parent_page(options: dict) -> Page:
        return Page.objects.get(url_path=options['parent_path'])

    def _create_pages(self, json_text: TextIOWrapper, parent_page: Page, options: dict) -> None:
        self._log('Creating new pages...')
        for meeting_struct in json.load(json_text):
            self._create_agenda_page(meeting_struct, parent_page)

    def _create_agenda_page(self, meeting: dict, parent_page: Page) -> None:
        """
        Available keys are:
            ("agenda_document_links", Links), # list (Links)
            ("approved_minutes_date", Date),
            ("approved_minutes_link", Link),
            ("body", str),                    # HTML
            ("closed_captioning_link", Link),
            ("draft_minutes_links", Links),   # list (Links)
            ("link_title_text", str),         # Plain text
            ("meeting_type", str),            # "open" or "executive"
            ("pdf_disclaimer", str),          # HTML (outer HTML)
            ("posted_date", Date),
            ("primary_audio_link", Link),
            ("old_meeting_url", str),         # URL
            ("secondary_audio_links", Links), # list (Links)
            ("sunshine_act_links", Links),    # list (Links)
            ("title_text", str),
            ("video_link", Link)
        """

        if meeting['approved_minutes_date'] is not None:
            approved_minutes_date_import = datetime.datetime.strptime(meeting['approved_minutes_date']['iso8601'], '%Y-%m-%d').date()
        else:
            approved_minutes_date_import = None

        if meeting['approved_minutes_link'] is not None:
            approved_minutes_link_import = meeting['approved_minutes_link']['url']
        else:
            approved_minutes_link_import = ''

        new_page = AgendaPage(
            imported_html=self._raw_html_block(meeting['body']),
            date=datetime.datetime.strptime(meeting['posted_date']['iso8601'], '%Y-%m-%d').date(),
            meeting_type='O',
            draft_minutes_links='\n'.join([str(link['url']) for link in meeting['draft_minutes_links']]),
            approved_minutes_date=approved_minutes_date_import,
            approved_minutes_link=approved_minutes_link_import,
            sunshine_act_links='\n'.join([str(link['url']) for link in meeting['sunshine_act_links']]),
            mtg_media=self._media_blocks(meeting),
            # mtg_time doesn't appear to be in the json.
            depth=2,
            numchild=0,
            live=1,
            title=meeting['title_text'],
        )
        parent_page.add_child(instance=new_page)

    def _raw_html_block(self, legacy_cms_html: str) -> str:
        """
        Clean up a legacy HTML page and wrap it in JSON
        conforming to a Wagtail Stream with a RawHTMLBlock.
        """
        return json.dumps([
            {
                'type': 'html_block',  # Defined in AgendaPage in models.py
                'value': self.escape_quotes(self.clean_content(legacy_cms_html)),
            }
        ])

    def _media_blocks(self, meeting: dict) -> str:
        return json.dumps([
            {
                'type': 'full_video_url',  # Defined in AgendaPage in models.py
                'value': self._url_in_link(meeting['video_link'])
            },
            {
                'type': 'full_audio_url',
                'value': self._url_in_link(meeting['primary_audio_link'])
            },
            {
                'type': 'mtg_transcript_url',
                'value': self._url_in_link(meeting['closed_captioning_link'])
            },
        ])

    @staticmethod
    def _url_in_link(link_attribute) -> str:
        """
        The scraper returns *link attributes as either a dict with a `url` attribute,
        or a None.
        """
        if link_attribute is not None:
            return link_attribute['url']
        else:
            return ''
