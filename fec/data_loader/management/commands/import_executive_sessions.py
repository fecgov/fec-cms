import datetime
import json
import os

from dateutil import parser

from django.conf import settings
from django.core.management import BaseCommand
from django.utils import timezone

from data_loader.utils import ImporterMixin
from home.models import MeetingPage, Page


class Command(ImporterMixin, BaseCommand):
    help = 'Imports Meeting Agenda pages from JSON'
    requires_migrations_checks = True
    requires_system_checks = True

    def handle(self, *args, **options):

        file_name = os.path.join(settings.REPO_DIR, 'fec/data_loader/management/executive_sessions.json')
        with open(file_name, 'r') as json_contents:
            self._create_pages(json_contents, self._parent_page(), options)

    def _log(self, message):
        self.stdout.write(repr(message))

    def _parent_page(self):
        return Page.objects.get(url_path='/home/updates/')

    def _create_pages(self, json_text, parent_page, options):
        self._log('Creating new pages...')
        for meeting_struct in json.load(json_text):
            self._create_agenda_page(meeting_struct, parent_page)

    def _create_agenda_page(self, meeting, parent_page):
        if meeting['second_notice_link']:
            notice_links = '\n'.join([meeting['notice_link'], meeting['second_notice_link']])
        else:
            notice_links = meeting['notice_link']

        new_page = MeetingPage(
            date=datetime.datetime.strptime(meeting['start_date'], '%m/%d/%Y').date(),
            end_date=datetime.datetime.strptime(meeting['end_date'], '%m/%d/%Y').date() if meeting['end_date'] else None,
            meeting_type='E',
            sunshine_act_links= notice_links,
            depth=2,
            numchild=0,
            live=1,
            title=meeting['title']
        )
        parent_page.add_child(instance=new_page)
