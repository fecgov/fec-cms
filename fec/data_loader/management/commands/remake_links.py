import logging
import json

from django.core.management import BaseCommand

from home.models import PressReleasePage, DigestPage

from home.utils.link_reroute import remake_links as relink

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def escape(text):
    text = str(text)
    # for loading into the db correctly
    escape_single = text.replace("'", "''")
    return escape_single


def process_links():
    text_models = [PressReleasePage, DigestPage]
    for m in text_models:
        logger.info('Working on {0}'.format(m))
        for post in m.objects.all():
            post_id = post.id
            saved_page = m.objects.get(id=post_id)
            contents = str(saved_page.body)
            new_contents = relink(contents)
            body = escape(new_contents)
            body_list = [{"value": body, "type": "html"}]
            formatted_body = json.dumps(body_list)
            saved_page.body = formatted_body
            saved_page.save()


class Command(BaseCommand):
    help = "Remaking links in the text of pages that have moved from the old site to the new site"

    def handle(self, *args, **options):
        process_links()
        logger.info('Done!')
