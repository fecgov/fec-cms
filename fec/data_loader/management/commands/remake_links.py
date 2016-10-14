import logging

from django.core.management import BaseCommand

from home.models import PressReleasePage, DigestPage

from home.utils.link_reroute import remake_links as relink

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def process_links():
    text_models = [PressReleasePage, DigestPage]

    for m in text_models:
        logger.info('Working on {0}'.format(m))
        for post in m.objects.all():
            text = str(post.body)
            post.body = relink(text)
            post.save()


class Command(BaseCommand):
    help = "Remaking links in the text of pages that have moved from the old site to the new site"

    def handle(self, *args, **options):
        process_links()
        logger.info('Done!')
