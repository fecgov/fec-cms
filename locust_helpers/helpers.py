from faker import Faker
import datetime
import random
import logging
fake = Faker("en_US")

committee_ids = []
candidate_ids = []
year_params = ["two_year_transaction_period", "cycle", "election_year"]
search_params = ["search", "query"]
year_range_params = [
    "min_date",
    "min_receipt_date",
    "min_coverage_end_date",
    "min_incurred_date",
    "min_contribution_receipt_date",
    "min_disbursement_date",
]

search_terms = [
    "trump",
    "winred",
    "donald+trump",
    "contribution+limits",
    "1792400",
    "michael+flynn",
    "biden",
    "1793385",
    "actblue",
    "flynn",
    "Win+red",
    "Winred",
    "aipac",
    "TRUMP%2C+DONALD+J.",
    "PAC",
    "act+blue",
    "mike+johnson",
    "form+1",
    "pac",
    "save+america",
    "c00882498",
    "AIPAC",
    "election+costs",
    "Michelle+Obama",
    "trump+flynn",
    "republican+national+committee",
    "REPUBLICAN+NATIONAL+COMMITTEE",
    "AMERICAN+ISRAEL+PUBLIC+AFFAIRS+COMMITTEE+POLITICAL+ACTION+COMMITTEE",
    "donations",
    "statement+of+candidacy",
    "BIDEN+FOR+PRESIDENT",
    "form+2",
    "individual+contributions",
    "biden+victory+fund",
    "BIDEN+VICTORY+FUND",
    "obama",
    "TRUMP+SAVE+AMERICA+JOINT+FUNDRAISING+COMMITTEE",
    "contributions",
    "AMERICAN+VALUES+2024",
    "p40020406",
    "trump-flynn",
    "DSCC",
    "Donald+Trump",
    "SAVE+AMERICA",
    "DNC+SERVICES+CORP+%2F+DEMOCRATIC+NATIONAL+COMMITTEE",
    "tim+scott",
    "C00832691",
    "dscc",
    "cori+bush",
    "fecfile",
    "fec+form+1",
    "DESANTIS%2C+RON",
    "Joe+Biden",
    "forms",
    "gabe+evans",
    "independent+expenditures",
    "HARVEY+WIZARD+FOR+PRESIDENT",
    "Donations",
    "RAMASWAMY%2C+VIVEK",
    "JILL+STEIN+FOR+PRESIDENT+2024",
    "john",
    "SFA+FUND%2C+INC",
    "bob+good",
    "suozzi",
    "NIKKI+HALEY+FOR+PRESIDENT+INC.",
    "DONALD+J.+TRUMP+FOR+PRESIDENT+2024%2C+INC.",
    "leadership+pac",
    "CONGRESSIONAL+LEADERSHIP+FUND",
    "FAIRSHAKE",
    "HMP",
    "jon+tester",
    "1793383",
    "AMERICANS+FOR+PROSPERITY+ACTION%2C+INC.+%28AFP+ACTION%29+DBA+CVA+ACTION+AND+DBA+LIBRE+ACTION",
    "BIDEN%2C+JOSEPH+R+JR",
    "C00669259",
    "black+rifle",
    "fec+form+2",
    "form+99",
    "senate+majority+pac",
    "trump-flynn+2024",
    "vice+president",
    "TRUMP+MAKE+AMERICA+GREAT+AGAIN+COMMITTEE",
    "UNITED+DEMOCRACY+PROJECT+%28%27UDP%27%29",
    "Contribution%20in%20the%20name%20of%20another"
]


def get_fake_date(start_date=''):
    if start_date == '':
        start_date = datetime.date(year=1979, month=1, day=1)
    return fake.date_between(start_date)


def get_fake_year():
    date = get_fake_date()
    year = date.year

    if year % 2 != 0:
        year += 1

    if year % 4 != 0:
        year += 2

    return year


def get_params(param_list):
    params = {}
    for param in param_list:
        if param in year_params:
            params[param] = get_fake_year()
        elif param in year_range_params:
            min_date = get_fake_date()
            max_date = get_fake_date(min_date)

            params[param] = min_date.strftime('%m-%d-%Y')
            params[param.replace("min", "max")] = max_date.strftime('%m-%d-%Y')
        elif param in search_params:
            params[param] = random.choice(search_terms)
        elif param == "candidate_id":
            params[param] = random.choice(candidate_ids)
        elif param == "committee_id":
            params[param] = random.choice(committee_ids)
        elif param == "zip":
            params[param] = fake.postalcode()
    return params


def build_url_path(url, param_list):
    for param in param_list:
        if param == "candidate_id":
            url += random.choice(candidate_ids)
        elif param == "committee_id":
            url += random.choice(committee_ids)
        elif param == "election_year":
            url += str(get_fake_year())
        elif param == "state":
            url = url + fake.state_abbr(include_territories=False, include_freely_associated_states=False) + "/"
    return url


def log_response(name, resp):
    if resp.status_code == 200:
        logging.info('********* fetching {}, response: {}'.format(name, resp))
        logging.info('url: %s', resp.url)
    else:
        logging.error('{} error fetching {}'.format(resp.status_code, resp.url))
