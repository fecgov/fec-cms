"""
Load testing for the API and web app. Run from the root directory using the
    `locust --host=https://stage.fec.gov` (stage)
    `locust --host=https://www.fec.gov` (prod)
    `locust --host=https://dev.fec.gov` (dev)

command, then open localhost:8089 to run tests.
"""

import random
import locust
import os
import resource
import requests
from locust_helpers import urls, helpers
from locust import task, user, TaskSet

API_KEY = os.environ["FEC_API_KEY"]

# Avoid "Too many open files" error
resource.setrlimit(resource.RLIMIT_NOFILE, (10000, 999999))


class Tasks(TaskSet):

    def on_start(self):
        helpers.candidate_ids = self.fetch_ids("candidates", "candidate_id")
        helpers.committee_ids = self.fetch_ids("committees", "committee_id")

    def fetch_ids(self, endpoint, key):
        params = {"api_key": API_KEY}

        if 'dev' in self.parent.host:
            url = urls.dev_api_url
        elif 'stage' in self.parent.host or 'feature' in self.parent.host:
            url = urls.stage_api_url
        else:
            url = urls.prod_api_url

        resp = requests.get(url=url + endpoint, params=params)

        if resp.status_code == 200:
            return [result[key] for result in resp.json()["results"]]
        else:
            helpers.logging.error('{} error fetching pre-load id'.format(resp.status_code))

    @task
    def browse_candidate_committee_election(self):
        name = "candidate, committee, and election pages"
        url, path_list = random.choice(list(urls.candidate_committee_and_election_pages.items()))
        url = helpers.build_url_path(url, path_list)
        resp = self.client.get(url, name=name)
        helpers.log_response(name, resp)

    @task(6)
    def browse_data_tables(self):
        name = "data table pages"
        url, param_list = random.choice(list(urls.data_table_pages.items()))
        params = helpers.get_params(param_list)
        resp = self.client.get(url, name=name, params=params)
        helpers.log_response(name, resp)

    @task
    def browse_help(self):
        name = "help pages"
        url = random.choice(urls.help_pages)
        resp = self.client.get(url, name=name)
        helpers.log_response(name, resp)

    @task
    def browse_legal(self):
        name = "legal resource pages"
        url = random.choice(urls.legal_resource_pages)
        resp = self.client.get(url, name=name)
        helpers.log_response(name, resp)

    @task
    def browse_campaign_finance(self):
        name = "campaign finance pages"
        url = random.choice(urls.campaign_finance_pages)
        resp = self.client.get(url, name=name)
        helpers.log_response(name, resp)

    @task
    def browse_about(self):
        name = "about pages"
        url = random.choice(urls.about_pages)
        resp = self.client.get(url, name=name)
        helpers.log_response(name, resp)

    @task
    def browse_calendar_and_press(self):
        name = "calendar and press pages"
        url = random.choice(urls.calendar_and_press_pages)
        resp = self.client.get(url, name=name)
        helpers.log_response(name, resp)

    @task(3)
    def search_website(self):
        name = "website search"
        term = random.choice(helpers.search_terms)
        url = urls.website_search_url + term
        resp = self.client.get(url, name=name)
        helpers.log_response(name, resp)

    @task
    def search_data(self):
        name = "data search"
        url = urls.data_search_url + random.choice(helpers.search_terms)
        resp = self.client.get(url, name=name)
        helpers.log_response(name, resp)

    @task
    def search_legal(self):
        name = "legal search"
        url, param_list = random.choice(list(urls.legal_search_pages.items()))
        params = helpers.get_params(param_list)
        resp = self.client.get(url, name=name, params=params)
        helpers.log_response(name, resp)


class Swarm(user.HttpUser):
    tasks = [Tasks]
    wait_time = locust.between(1, 5)
