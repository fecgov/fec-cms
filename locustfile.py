# -*- coding: utf-8 -*-
"""Load testing for the API and web app. Run from the root directory using the

`locust --host=https://stage.fec.gov` (stage)
`locust --host=https://www.fec.gov` (prod)
`locust --host=https://dev.fec.gov` (dev)

command, then open localhost:8089 to run tests.
"""

import os
import random
import resource
import locust

from locust_log_queries import log_queries

# Avoid "Too many open files" error
resource.setrlimit(resource.RLIMIT_NOFILE, (9999, 999999))

API_KEY = os.environ["FEC_API_KEY"]


class Tasks(locust.TaskSet):

    @locust.task
    def load_big_queries(self, term=None):
        url = random.choice(list(log_queries.keys()))
        if log_queries[url]:
            params = random.choice(log_queries[url])
            params["api_key"] = API_KEY
        self.client.get(url, name="load_big_queries")



class Swarm(locust.HttpLocust):
    task_set = Tasks
    min_wait = 5000
    max_wait = 50000
