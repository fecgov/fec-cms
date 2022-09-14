import os
import logging

logger = logging.getLogger(__name__)

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_DIR = os.path.dirname(PROJECT_DIR)


def run_job():
    logger.info('Hello, This is my first cron job...' + ' 2>&1 ')
    # logger.info ('Hello, This is my first cron job...' + os.path.join(BASE_DIR,'scheduler.log' + ' 2>&1 '))
    # call scrape_cms_pages
    # os.system('python fec/manage.py scrape_cms_pages')
