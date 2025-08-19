import requests
import json
from fec.settings.env import env
import logging

logger = logging.getLogger(__name__)


def post_to_slack(message, channel):
    response = requests.post(
        env.get_credential("SLACK_HOOK"),
        data=json.dumps(
            {
                "text": message,
                "channel": channel,
                "link_names": 1,
                "username": "Robot",
                "icon_emoji": ":robot_face:",
            }
        ),
        headers={"Content-Type": "application/json"},
    )
    if response.status_code != 200:
        logger.error("SLACK ERROR- Message failed to send:{0}".format(message))
