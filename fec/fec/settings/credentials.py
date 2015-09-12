import os
import json
import itertools


services = json.loads(os.getenv('VCAP_SERVICES', '{}')).get('user-provided', [])
credentials = dict(
    itertools.chain.from_iterable(
        each.get('credentials', {}).items()
        for each in services
    )
)
