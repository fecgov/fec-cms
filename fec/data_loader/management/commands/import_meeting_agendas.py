from django.core.management import BaseCommand

from data_loader.utils import ImporterMixin


class Command(ImporterMixin, BaseCommand):
    help = 'Imports Meeting Agenda pages from JSON'
    requires_migrations_checks = True
    requires_system_checks = True

    def add_arguments(self, parser):
        pass

    def handle(self, *args, **options):
        pass

    def create_pages(self, page_structs, base_page):
        pass