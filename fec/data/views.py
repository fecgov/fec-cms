import requests
import github3
import json
import re
from distutils.util import strtobool
from datetime import date, datetime
from django.shortcuts import render, redirect
from django.urls import reverse
from django.http import Http404
from django.http import JsonResponse
from django.conf import settings
from data import api_caller
from data import constants
from data import utils


def groupby(values, keygetter):
    ret = {}
    for value in values:
        key = keygetter(value)
        ret.setdefault(key, []).append(value)
    return ret


election_durations = {"P": 4, "S": 6, "H": 2}

report_types = {
    "P": "presidential",
    "S": "house-senate",
    "H": "house-senate",
    "I": "ie-only",
}

validListUrlParamValues = ["P", "S", "H"]
# INITIALLY USED BY raising() AND spending() FOR VALIDATING URL PARAMETERS,
# THE list URL PARAM


def to_date(committee, cycle):
    if committee["committee_type"] in ["H", "S", "P"]:
        return None
    return min(datetime.now().year, int(cycle))


def aggregate_totals(request):
    office = request.GET.get("office", "S")

    election_year = int(
        request.GET.get("election_year", constants.DEFAULT_ELECTION_YEAR)
    )

    max_election_year = utils.current_cycle() + 4
    election_years = utils.get_cycles(max_election_year)

    FEATURES = settings.FEATURES

    return render(
        request,
        "widgets/aggregate-totals.jinja",
        {
            "title": "Aggregate Totals",
            "election_years": election_years,
            "election_year": election_year,
            "office": office,
            "FEATURES": FEATURES,
            "social_image_identifier": "data",
        },
    )


def landing(request):
    top_candidates_raising = api_caller.load_top_candidates("-receipts", per_page=3)

    return render(
        request,
        "landing.jinja",
        {
            "parent": "data",
            "title": "Campaign finance data",
            "dates": utils.date_ranges(),
            "top_candidates_raising": top_candidates_raising["results"]
            if top_candidates_raising
            else None,
            "first_of_year": date(date.today().year, 1, 1).strftime("%m/%d/%Y"),
            "last_of_year": date(date.today().year, 12, 31).strftime("%m/%d/%Y"),
            "social_image_identifier": "data",
        },
    )


def search(request):
    """Renders the data search results page

    If the string is a 16 or 11 digit number then it will redirect to
    the page-by-page viewer.

    If there's no query, then we'll load the main landing page with all the
    necessary data.
    """
    query = request.GET.get("search", "")

    if re.match(r"\d{16}", query) or re.match(r"\d{11}", query):
        url = "https://docquery.fec.gov/cgi-bin/fecimg/?" + query
        return redirect(url)
    else:
        results = api_caller.load_search_results(query)
        return render(
            request,
            "search-results.jinja",
            {"query": query, "title": "Search results", "results": results},
        )


def browse_data(request):
    monthly_coverage_date = utils.get_presidential_coverage_date("M")
    quarterly_coverage_date = utils.get_presidential_coverage_date("Q")
    default_presidential_year = constants.DEFAULT_PRESIDENTIAL_YEAR
    return render(
        request,
        "browse-data.jinja",
        {
            "title": "Browse data",
            "parent": "data",
            "social_image_identifier": "data",
            "monthly_coverage_date": monthly_coverage_date,
            "quarterly_coverage_date": quarterly_coverage_date,
            "default_presidential_year": default_presidential_year,
        },
    )


def format_receipt_date(receipt_date):
    # convert string to python datetime
    receipt_date = datetime.strptime(receipt_date, "%Y-%m-%dT%H:%M:%S")
    # parse for readable output
    return receipt_date.strftime("%m/%d/%Y")


def get_candidate(candidate_id, cycle, election_full):
    """
    1) By passing parameter "candidate_id" to get candidate data.
    2) "cycle" and "election_full" are optional parameters.
       if no election_full, election_full = true.
       if no cycle, cycle = the latest item in rounded_election_years.
    3) totally call 5-6 endpoints.
    """

    # (1) Call candidate/{candidate_id}/history/ under tag:candidate
    # get rounded_election_years(candidate_election_year).
    candidate = load_most_recent_candidate(candidate_id)
    if candidate is None:
        raise Http404()

    # if cycle = null, set cycle = the last of rounded_election_years.
    if not cycle:
        cycle = max(candidate.get("rounded_election_years"))

    # (2) Call candidate/{candidate_id}/history/{cycle} under tag:candidate
    # (3) Call candidate/{candidate_id}/committees/history/{cycle}
    # under tag:committee.
    candidate, committees, cycle = api_caller.load_with_nested(
        "candidate",
        candidate_id,
        "committees",
        cycle=cycle,
        election_full=election_full,
    )

    result_type = "candidates"
    duration = election_durations.get(candidate["office"], 2)
    min_cycle = cycle - duration if election_full else cycle
    report_type = report_types.get(candidate["office"])

    # For JavaScript
    context_vars = {
        "cycles": candidate["fec_cycles_in_election"],
        "name": candidate["name"],
        "cycle": cycle,
        "electionFull": election_full,
        "candidateID": candidate["candidate_id"],
    }

    max_cycle = int(cycle)
    # Check if cycle > latest_fec_cycles_in_election, such as:future candidate.
    if candidate["fec_cycles_in_election"]:
        latest_fec_cycles_in_election = max(candidate["fec_cycles_in_election"])
        if int(cycle) > latest_fec_cycles_in_election:
            max_cycle = latest_fec_cycles_in_election

    # Annotate committees with most recent available cycle
    aggregate_cycles = (
        list(range(cycle, cycle - duration, -2)) if election_full else [cycle]
    )
    for committee in committees:
        committee["related_cycle"] = committee["cycle"]

    # Group the committees by designation
    committee_groups = groupby(committees, lambda each: each["designation"])
    committees_authorized = committee_groups.get("P", []) + committee_groups.get(
        "A", []
    )
    committee_ids = [committee["committee_id"] for committee in committees_authorized]

    # Group the committees by leadership pac (designation=D)
    committees_d = committee_groups.get("D", [])
    committees_leadership_pac = []
    if committees_d:
        # The candidate(id=P00009183) returns two rows from api result,
        # one is pcc converted to D, another is leadership pac committee,
        # remove the duplicate committees with same committees_id.
        # example api call:
        # https://fec-dev-api.app.cloud.gov/v1/candidate/P00009183/committees/history/2020/
        len_d_cmte = len(committees_d)
        committees_leadership_pac.append(committees_d[0])
        for i in range(len_d_cmte):
            if (i + 1) < len_d_cmte and committees_d[i].get("committee_id") != committees_d[i + 1].get("committee_id"):
                committees_leadership_pac.append(committees_d[i + 1])

    # (4) Call candidate/{candidate_id}/totals/{cycle} under tag:candidate
    # Get aggregate totals for the financial summary
    filters = {
        "election_full": election_full,
        "cycle": cycle
    }
    path = "/candidate/" + candidate_id + "/totals/"
    aggregate = api_caller.load_first_row_data(path, **filters)

    if election_full:
        # (5) if election_full is true, need call
        # candidate/{candidate_id}/totals/{cycle} second time
        # for showing on raising and spending tabs
        # Get most recent 2-year period totals
        filters = {
            "election_full": False,
            "cycle": max_cycle
        }
        two_year_totals = api_caller.load_first_row_data(path, **filters)
    else:
        two_year_totals = aggregate

    if aggregate:
        raising_summary = utils.process_raising_data(aggregate)
        spending_summary = utils.process_spending_data(aggregate)
        cash_summary = utils.process_cash_data(aggregate)
    else:
        raising_summary = None
        spending_summary = None
        cash_summary = None

    # (6) Call /filings?candidate_id=P00003392&form_type=F2
    # Get the statements of candidacy
    statement_of_candidacy = api_caller.load_candidate_statement_of_candidacy(
        candidate["candidate_id"]
    )

    if statement_of_candidacy:
        statement_of_candidacy["receipt_date"] = format_receipt_date(
            statement_of_candidacy["receipt_date"]
        )

    # Get all the elections
    elections = sorted(
        zip(candidate["election_years"], candidate["election_districts"]),
        key=lambda pair: pair[0],
        reverse=True,
    )

    # (7) Call efile/filings/ under tag:efiling
    # Check if there are raw_filings for this candidate
    raw_filing_start_date = utils.three_days_ago()
    filters = {
        "min_receipt_date": raw_filing_start_date,
        "committee_id": candidate["candidate_id"],
        "cycle": cycle,
        "per_page": 100,
    }
    path = "/efile/" + "/filings/"
    raw_filings = api_caller.load_endpoint_results(path, **filters)
    has_raw_filings = True if raw_filings else False

    # Add message for when a candidate converts their candidate committee to an unauthorized committee
    current_committee_name = None
    converted_committee_id = None
    former_committee_name = None

    # Get the latest committee name, former authorized committee name, and committee ID.
    # This will be the first item returned in the committees list
    # If there are no committees, return the normal no results message
    if len(committees) > 0:
        if committees[0].get('former_candidate_id'):
            current_committee_name = committees[0].get('name')
            converted_committee_id = committees[0].get('committee_id')
            former_committee_name = committees[0].get('former_committee_name')

    return {
        "converted_committee_name": current_committee_name,
        "converted_committee_id": converted_committee_id,
        "former_committee_name": former_committee_name,
        "aggregate": aggregate,
        "aggregate_cycles": aggregate_cycles,
        "candidate": candidate,
        "candidate_id": candidate_id,
        "cash_summary": cash_summary,
        "committee_groups": committee_groups,
        "committee_ids": committee_ids,
        # filings endpoint takes candidate ID value as committee ID arg
        "committee_id": candidate["candidate_id"],
        "committees_authorized": committees_authorized,
        "committees_leadership_pac": committees_leadership_pac,
        "context_vars": context_vars,
        "cycle": int(cycle),
        "cycles": candidate["fec_cycles_in_election"],
        "district": candidate["district"],
        "duration": duration,
        "election_year": cycle,
        "election_years": candidate.get("rounded_election_years"),
        "elections": elections,
        "has_raw_filings": has_raw_filings,
        "incumbent_challenge_full": candidate["incumbent_challenge_full"],
        "max_cycle": max_cycle,
        "min_cycle": min_cycle,
        "min_receipt_date": raw_filing_start_date,
        "name": candidate["name"],
        "office": candidate["office"],
        "office_full": candidate["office_full"],
        "party_full": candidate["party_full"],
        "raising_summary": raising_summary,
        "report_type": report_type,
        "result_type": result_type,
        "show_full_election": election_full,
        "spending_summary": spending_summary,
        "state": candidate["state"],
        "statement_of_candidacy": statement_of_candidacy,
        "two_year_totals": two_year_totals,
        "social_image_identifier": "data",
    }


def candidate(request, candidate_id):
    """
    Take in the request, call get_candidate
    to get the required information from the API,
    and render the candidate profile page template
    """
    cycle = request.GET.get("cycle", None)
    if cycle is not None:
        cycle = int(cycle)

    election_full = request.GET.get("election_full", True)
    election_full = bool(strtobool(str(election_full)))

    candidate = get_candidate(candidate_id, cycle, election_full)
    return render(request, "candidates-single.jinja", candidate)


def get_committee(committee_id, cycle):
    """
    Given a committee_id and cycle, call the API and get the committee
    and committee financial data needed to render the committee profile page
    """
    committee, all_candidates, cycle = load_committee_history(committee_id, cycle)
    # When there are multiple candidate records of various offices (H, S, P)
    # linked to a single committee ID,
    # associate the candidate record with the matching committee type
    candidates = [
        candidate
        for candidate in all_candidates
        if committee["committee_type"] == candidate["office"]
    ]

    parent = "data"
    result_type = "committees"
    cycle = int(cycle)
    year = to_date(committee, cycle)

    # Link to current cycle if candidate has a corresponding page, else link
    # without cycle query parameter
    # See https://github.com/fecgov/openFEC/issues/1536
    for candidate in candidates:
        election_years = []
        for election_year in candidate["election_years"]:
            start_of_election_period = (
                election_year - election_durations[candidate["office"]]
            )
            if start_of_election_period < cycle and cycle <= election_year:
                election_years.append(election_year)
        # For each candidate, set related_cycle to the candidate's time period
        # relative to the selected cycle.
        candidate["related_cycle"] = cycle if election_years else None

    report_type = report_types.get(committee["committee_type"], "pac-party")

    cycle_out_of_range, fallback_cycle, cycles = load_cycle_data(committee, cycle)

    # (fec-cms #4366) at the beginning of every new 2-year period,
    # before we receive the Q1 reports, passed parameter 'cycle' is not in
    # `cycles_has_activity` yet. cycle_out_of_range = true.
    # we set cycle = fallback_cycle
    cycle = fallback_cycle if cycle_out_of_range else cycle

    reports, totals = load_reports_and_totals(
        committee_id, cycle, cycle_out_of_range, fallback_cycle
    )

    # Check organization types to determine SSF status
    is_ssf = committee.get("organization_type") in ["W", "C", "L", "V", "M", "T"]

    # Check if it's an inaugural organization type
    is_inaugural = committee.get("organization_type") in ["I"]

    # Check committee's status (active, terminated, or administratively terminated)
    is_active = committee.get("is_active")
    filing_frequency = committee.get("filing_frequency")

    if is_active:
        current_committee_status = "active"
    elif not is_active and filing_frequency == "A":
        current_committee_status = "admin_terminated"
    else:
        current_committee_status = "terminated"

    # if cycles_has_activity's options are more than cycles_has_financial's,
    # when clicking back to financial summary/raising/spending,
    # reset cycle=fallback_cycle and timePeriod and.
    # to make sure missing message page show correct timePeriod.
    time_period_js = str(int(cycle) - 1) + "–" + str(cycle)
    cycle_js = cycle
    if cycle_out_of_range:
        cycle_js = fallback_cycle
        time_period_js = str(int(cycle_js) - 1) + "–" + str(cycle_js)

    context_vars = {
        "cycle": cycle_js,
        "timePeriod": time_period_js,
        "name": committee["name"],
        "cycleOutOfRange": cycle_out_of_range,
        "lastCycleHasFinancial": fallback_cycle,
    }

    # sponsor_candidates saves a sponsor candidate list.
    sponsors_candidate_ids = committee.get("sponsor_candidate_ids")
    sponsor_candidates = []
    if sponsors_candidate_ids:
        path = "/candidate/{}/history/"
        filters = {"per_page": 1}
        for sponsor_id in sponsors_candidate_ids:
            election_years = []
            sponsor_candidate = load_most_recent_candidate(sponsor_id)
            # Handle API returning no results
            if sponsor_candidate:
                for election_year in sponsor_candidate["election_years"]:
                    start_of_election_period = (
                        election_year - election_durations[sponsor_candidate["office"]]
                    )
                    if start_of_election_period < cycle and cycle <= election_year:
                        election_years.append(election_year)

                # For each sponsor_candidate, set related_cycle
                # to the candidate's time period
                # relative to the selected cycle.
                sponsor_candidate["related_cycle"] = cycle if election_years else None
                sponsor_candidates.append(sponsor_candidate)

    # Human-friendly text and glossary links for the front-end
    com_org_type = committee.get('organization_type')
    com_com_type = committee.get('committee_type')
    com_desig = committee.get('designation')
    # The big "can't be" tests for organization_types
    if com_org_type == 'C':
        com_type_text = 'corporate'
        com_type_glossary = 'Corporation'
    elif com_org_type == 'W':
        com_type_text = 'corporations without capital stock'
        com_type_glossary = ''
    elif com_org_type == 'L':
        com_type_text = 'labor organization'
        com_type_glossary = 'Labor organization'
    elif com_org_type == 'M':
        com_type_text = 'membership organization'
        com_type_glossary = 'Membership organization'
    elif com_org_type == 'T':
        com_type_text = 'trade association'
        com_type_glossary = 'Trade association'
    elif com_org_type == 'V':
        com_type_text = 'cooperatives'
        com_type_glossary = 'Cooperative'
    # The three biggies which are also 'not' rules for committee_type
    elif com_com_type == 'H':
        com_type_text = '[H committee_type]'
        com_type_glossary = ''
    elif com_com_type == 'S':
        com_type_text = '[S committee_type]'
        com_type_glossary = ''
    elif com_com_type == 'P':
        com_type_text = '[P committee_type]'
        com_type_glossary = ''
    # regular designation with no other rules
    elif com_desig == 'B':
        com_type_text = 'lobbyist-registrant PACs'
        com_type_glossary = 'Lobbyist/Registrant PAC'
    elif com_desig == 'D':
        com_type_text = 'leadership PACs'
        com_type_glossary = 'Leadership PAC'
    # 'not' rules for designation
    elif com_desig == 'J':
        com_type_text = 'joint fundraising committees'
        com_type_glossary = 'Joint fundraising committee'
    elif com_desig == 'A':
        com_type_text = '[A designation]'
        com_type_glossary = ''
    elif com_desig == 'P':
        com_type_text = '[P designation]'
        com_type_glossary = ''
    # all the others that were restricted by the 'not' rules above
    elif com_com_type == 'O':
        com_type_text = 'super PACs'
        com_type_glossary = 'Super PAC'
    elif com_com_type == 'W':
        com_type_text = 'hybrid PACs'
        com_type_glossary = 'Hybrid PAC'
    elif com_com_type == 'V':
        com_type_text = 'hybrid PACs'
        com_type_glossary = 'Hybrid PAC'
    elif com_com_type == 'N':
        com_type_text = 'political action committees'
        com_type_glossary = 'Political Action Committee (PAC)'
    elif com_com_type == 'Q':
        com_type_text = 'political action committees'
        com_type_glossary = 'Political Action Committee (PAC)'
    elif com_com_type == 'U':
        com_type_text = '[U committee_type]'
        com_type_glossary = ''
    elif com_com_type == 'I':
        com_type_text = '[I committee_type]'
        com_type_glossary = ''
    elif com_com_type == 'Y':
        com_type_text = 'party committees'
        com_type_glossary = 'Party committee'
    elif com_com_type == 'X':
        com_type_text = 'party committees'
        com_type_glossary = 'Party committee'
    else:
        com_type_text = ''
        com_type_glossary = ''

    template_variables = {
        "candidates": candidates,
        "committee": committee,
        "committee_id": committee_id,
        "committee_type": committee["committee_type"],
        "com_type_text": com_type_text,
        "com_type_glossary": com_type_glossary,
        "context_vars": context_vars,
        "cycle": cycle,
        "cycles": cycles,
        "is_SSF": is_ssf,
        "is_inaugural": is_inaugural,
        "current_committee_status": current_committee_status,
        "cycle_out_of_range": cycle_out_of_range,
        "parent": parent,
        "result_type": result_type,
        "report_type": report_type,
        "reports": reports,
        "totals": totals,
        "min_receipt_date": utils.three_days_ago(),
        "context_vars": context_vars,
        "party_full": committee["party_full"],
        "social_image_identifier": "data",
        "year": year,
        "timePeriod": time_period_js,
        "sponsor_candidates": sponsor_candidates,
    }
    # Format the current two-year-period's totals
    if reports and totals:
        # IE-only committees
        if committee["committee_type"] == "I":
            template_variables["ie_summary"] = utils.process_ie_data(totals)
        # Inaugural Committees
        elif committee["organization_type"] == "I":
            template_variables["inaugural_summary"] = utils.process_inaugural_data(
                totals
            )
        # Host Committees that file on Form 4
        elif committee["organization_type"] == "H" and reports["form_type"] == "F4":
            template_variables["raising_summary"] = utils.process_host_raising_data(
                totals
            )
            template_variables["spending_summary"] = utils.process_host_spending_data(
                totals
            )
            template_variables["cash_summary"] = utils.process_cash_data(totals)
        else:
            # All other committees have three tables
            template_variables["raising_summary"] = utils.process_raising_data(totals)
            template_variables["spending_summary"] = utils.process_spending_data(totals)
            template_variables["cash_summary"] = utils.process_cash_data(totals)

    # When cycle >= constants.DEFAULT_TIME_PERIOD, check for raw filings in the last three days
    if cycle >= constants.DEFAULT_TIME_PERIOD:
        # (4)call efile/filings under tag: efiling
        path = "/efile/filings/"
        filters = {
            "committee_id": committee["committee_id"],
            "min_receipt_date": template_variables["min_receipt_date"]
        }
        raw_filings = api_caller.load_endpoint_results(path, **filters)

        template_variables["has_raw_filings"] = True if raw_filings else False
    else:
        template_variables["has_raw_filings"] = False

    # Needed for filings tab
    template_variables["filings_lookup"] = {
        "reports": ["F3", "F3X", "F3P", "F3L", "F4", "F5", "F7", "F13"],
        "notices": ["F5", "F24", "F6", "F9", "F10", "F11"],
        "statements": ["F1"],
        "other": ["F1M", "F8", "F99", "F12"],
    }

    # Call /filings?committee_id=C00693234&form_type=F1
    # Get the statements of organization
    statement_of_organization = api_caller.load_committee_statement_of_organization(
        committee_id
    )

    if statement_of_organization:
        statement_of_organization["receipt_date"] = format_receipt_date(
            statement_of_organization["receipt_date"]
        )

    template_variables["statement_of_organization"] = statement_of_organization

    # Add message for a committee that was formerly an authorized candidate committee.
    # These committees are now unauthorized committees.
    if committee['former_candidate_id']:
        template_variables["former_committee_name"] = committee['former_committee_name']
        template_variables["former_authorized_candidate_name"] = committee['former_candidate_name']
        template_variables["former_authorized_candidate_id"] = committee['former_candidate_id']

    return template_variables


def committee(request, committee_id):
    """
    Take in the request, call get_committee to get the required information
    from the API, and render the committee profile page template
    """

    cycle = request.GET.get("cycle", None)
    committee = get_committee(committee_id, cycle)

    return render(request, "committees-single.jinja", committee)


def load_most_recent_candidate(candidate_id):
    """
    Get most recent candidate information
    """
    path = "/candidate/" + candidate_id + "/history/"
    filters = {"per_page": 1}
    return api_caller.load_first_row_data(path, **filters)


def load_reports_and_totals(committee_id, cycle, cycle_out_of_range, fallback_cycle):

    filters = {
        "committee_id": committee_id,
        "cycle": fallback_cycle if cycle_out_of_range else cycle,
        "per_page": 1,
        "sort_hide_null": True,
    }

    # (3) Call /filings? under tag:filings
    # get reports from filings endpoint filter by form_category=REPORT
    path = "/filings/"
    reports = api_caller.load_first_row_data(
        path, form_category="REPORT", most_recent=True, **filters
    )

    # (4)call committee/{committee_id}/totals? under tag:financial
    # get financial totals
    path = "/committee/" + committee_id + "/totals/"
    totals = api_caller.load_first_row_data(path, **filters)

    return reports, totals


def load_committee_history(committee_id, cycle=None):
    filters = {"per_page": 1}
    if not cycle:
        # if no cycle parameter passed, use current fec cycle to call
        # (1)endpoint: committee/{committee_id}/history/ --under tag:committee
        path = "/committee/" + committee_id + "/history/"
        committee = api_caller.load_first_row_data(path, **filters)
        if committee is None:
            raise Http404()
        cycle = committee.get("last_cycle_has_financial")
        if not cycle:
            # when committees only file F1. fallback_cycle = null
            # set cycle = last_cycle_has_activity
            cycle = committee.get("last_cycle_has_activity")

    # To get correct committee history, use related cycle value to call
    # (2)endpoint: committee/{committee_id}/history/{cycle}/ --under tag:committee
    path = "/committee/" + committee_id + "/history/" + str(cycle)
    committee = api_caller.load_first_row_data(path, **filters)
    if committee is None:
        raise Http404()

    # (3)call endpoint: committee/{committee_id}/candidates/history/{cycle}
    # --under tag: candidate, get all candidates associated with that commitee
    path = "/committee/" + committee_id + "/candidates/history/" + str(cycle)
    all_candidates = api_caller.load_endpoint_results(path, election_full=False)

    # clean cycles_has_activity, remove 'None' value in cycles_has_activity
    committee["cycles_has_activity"] = list(
        filter(None, committee.get("cycles_has_activity"))
    )

    return committee, all_candidates, cycle


def load_cycle_data(committee, cycle):
    # when cycle is out of [cycles_has_financial] range
    # set cycle = fallback_cycle to call endpoint
    # to get reports and totals

    fallback_cycle = committee.get("last_cycle_has_financial")
    if not fallback_cycle:
        # when committees only file F1, fallback_cycle = null
        # set fallback_cycle = last_cycle_has_activity
        fallback_cycle = committee.get("last_cycle_has_activity")

    cycles = committee.get("cycles_has_activity")

    cycle_out_of_range = cycle not in cycles

    return cycle_out_of_range, fallback_cycle, cycles


def elections_lookup(request):

    cycle = constants.DEFAULT_ELECTION_YEAR
    cycles = utils.get_cycles(cycle + 4)

    return render(
        request,
        "election-lookup.jinja",
        {
            "parent": "data",
            "cycles": cycles,
            "cycle": cycle,
            "social_image_identifier": "data",
        },
    )


def elections(request, office, cycle, state=None, district=None):
    cycle = int(cycle)

    max_cycle = utils.current_cycle() + 4
    cycles = utils.get_cycles(max_cycle)

    if office.lower() == "president":
        cycles = [each for each in cycles if each % 4 == 0]
    elif office.lower() == "senate":
        cycles = api_caller.get_all_senate_cycles(state)

    if office.lower() not in ["president", "senate", "house"]:
        raise Http404()
    if (state is not None) and (state and state.upper() not in constants.states):
        raise Http404()

    election_duration = election_durations.get(office[0].upper(), 2)
    # Puerto Rico house/resident commissioners have 4-year cycles
    if state and state.upper() == "PR":
        election_duration = 4

    # map/redirect legacy tab names to correct anchor
    tab = request.GET.get("tab", "").replace("/", "")
    legacy_tabs = {
        "contributions": "#individual-contributions",
        "totals": "#candidate-financial-totals",
        "spending-by-others": "#independent-expenditures",
    }

    if tab in legacy_tabs:
        if office == "house":
            return redirect(
                reverse("elections-house", args=(office, state, district, cycle)) + legacy_tabs[tab]
            )
        elif office == "senate":
            return redirect(
                reverse("elections-senate", args=(office, state, cycle)) + legacy_tabs[tab]
            )
        elif office == "president":
            return redirect(
                reverse("elections-president", args=(cycle,)) + legacy_tabs[tab]
            )

    return render(
        request,
        "elections.jinja",
        {
            "office": office,
            "office_code": office[0],
            "parent": "data",
            "cycle": cycle,
            "election_duration": election_duration,
            "cycles": cycles,
            "state": state,
            "state_full": constants.states[state.upper()] if state else None,
            "district": district,
            "title": utils.election_title(cycle, office, state, district),
            "social_image_identifier": "data",
        },
    )


def elections_president(request, cycle):

    office = "president"
    cycle = int(cycle)

    max_cycle = utils.current_cycle() + 4
    cycles = utils.get_cycles(max_cycle)

    cycles = [each for each in cycles if each % 4 == 0]

    election_duration = election_durations.get(office[0].upper(), 2)

    tab = request.GET.get("tab", "").replace("/", "")
    legacy_tabs = {
        "contributions": "#individual-contributions",
        "totals": "#candidate-financial-totals",
        "spending-by-others": "#independent-expenditures",
    }

    if tab in legacy_tabs:
        return redirect(
            reverse("elections-president", args=(cycle, )) + legacy_tabs[tab]
        )

    return render(
        request,
        "elections.jinja",
        {
            "office": 'president',
            "office_code": office[0],
            "parent": "data",
            "cycle": cycle,
            "election_duration": election_duration,
            "cycles": cycles,
            "title": utils.election_title(cycle, office),
            "social_image_identifier": "data",
        },
    )


def house_senate_overview(request, office, cycle=None):

    """
    *** TODO: ***, Cycle is a KWARG instead of a positional(required in URL) argument. Do we even want the cycle arg?
     It might be wanted for the upcoming features on the page that have only one select for year,
     so one could load page with all features set to a certain election year. Example: /data/elections/senate/2018/
     But probably  want exclude the across-time feature from using this argument for its cycle,
     because we always want that to be current election year or (constants.DEFAULT_ELECTION_YEAR)

     """

    if cycle is not None:
        cycle = int(cycle)
    else:
        cycle = constants.DEFAULT_ELECTION_YEAR

    # cycle = request.GET.get("cycle", None)
    default_election_year = constants.DEFAULT_ELECTION_YEAR
    beginning_default_election_year = default_election_year - 1

    max_cycle = utils.current_cycle() + 4
    cycles = utils.get_cycles(max_cycle)

    if office.lower() not in ["president", "senate", "house"]:
        raise Http404()

    # Redirect to latest presidential election since we don't have presidential overview yet
    if office.lower() == "president":
        cycle = utils.current_cycle() if utils.current_cycle() % 4 == 0 else utils.current_cycle() + 2
        return redirect(
            reverse("elections-president", args=(cycle, ))
        )

    office_codes = {
        "senate": 'S',
        "house": 'H'
    }

    office_code = office_codes[office]

    # For JavaScript
    context_vars = {
        "office": office,
        "office_code": office_code,
    }

    return render(
        request,
        "house-senate-overview.jinja",
        {
            "office": office,
            "office_code": office_code,
            "parent": "data",
            "cycle": cycle,
            "cycles": cycles,
            "default_election_year": default_election_year,
            "beginning_default_election_year": beginning_default_election_year,
            "context_vars": context_vars,
            "social_image_identifier": "data",
        },
    )


def raising(request):
    office = request.GET.get("office", "P")  # The default for features like Who is raising the most

    election_year = int(
        request.GET.get("election_year", constants.DEFAULT_ELECTION_YEAR)
    )

    max_election_year = utils.current_cycle() + 4
    election_years = utils.get_cycles(max_election_year)

    return render(
        request,
        "raising-bythenumbers.jinja",
        {
            "parent": "data",
            "title": "Raising: by the numbers",
            "election_years": election_years,
            "election_year": election_year,
            "office": office,
            "social_image_identifier": "data",
        },
    )


def spending(request):
    office = request.GET.get("office", "P")  # The default for features like Who is spending the most

    election_year = int(
        request.GET.get("election_year", constants.DEFAULT_ELECTION_YEAR)
    )

    max_election_year = utils.current_cycle() + 4
    election_years = utils.get_cycles(max_election_year)

    return render(
        request,
        "spending-bythenumbers.jinja",
        {
            "parent": "data",
            "title": "Spending: by the numbers",
            "election_years": election_years,
            "election_year": election_year,
            "office": office,
            "social_image_identifier": "data",
        },
    )


def pres_finance_map(request):

    election_year = int(
        request.GET.get("election_year", constants.DEFAULT_PRESIDENTIAL_YEAR)
    )

    return render(
        request,
        "pres-finance-map.jinja",
        {
            "parent": "data",
            "title": "Presidential candidate map",
            "election_year": election_year,
            "social_image_identifier": "data",
            "page_specific_css": "/static/css/widgets/pres-finance-map.css",

        },
    )


def feedback(request):
    if request.method == "POST":

        # json.loads() is expecting a string in JSON format:
        # '{"param":"value"}'. Needs to be decoded in Python 3
        data = json.loads(request.body.decode("utf-8"))

        if not any(
            [
                data["action"],
                data["feedback"],
                data["about"],
                data["g-recaptcha-response"],
            ]
        ):
            return JsonResponse({"status": False}, status=500)
        else:
            # verify recaptcha
            verifyRecaptcha = requests.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": settings.FEC_RECAPTCHA_SECRET_KEY,
                    "response": data["g-recaptcha-response"],
                },
            )
            recaptchaResponse = verifyRecaptcha.json()
            if not recaptchaResponse["success"]:
                # if captcha failed, return failure
                return JsonResponse({"status": False}, status=500)
            else:
                # captcha passed, we're ready to submit the issue.
                title = "User feedback on " + request.META.get("HTTP_REFERER")
                body = (
                    "## What were you trying to do and how can we improve it?\n %s \n\n"
                    "## General feedback?\n %s \n\n"
                    "## Tell us about yourself\n %s \n\n"
                    "## Details\n"
                    "* URL: %s \n"
                    "* User Agent: %s"
                ) % (
                    data["action"],
                    data["feedback"],
                    data["about"],
                    request.META.get("HTTP_REFERER"),
                    request.META["HTTP_USER_AGENT"],
                )

                client = github3.login(token=settings.FEC_GITHUB_TOKEN)
                issue = client.repository("fecgov", "fec").create_issue(
                    title, body=body
                )

                return JsonResponse(issue.as_dict(), status=201)
    else:
        raise Http404()


def reactionFeedback(request):
    if request.method == "POST":

        # json.loads() is expecting a string in JSON format:
        # '{"param":"value"}'. Needs to be decoded in Python 3
        data = json.loads(request.body.decode("utf-8"))

        if not all(
            [
                data["name"],
                data["location"],
                data["reaction"],
                data["g-recaptcha-response"],
                data["userAgent"],
            ]
        ):
            # the required fields were not provided, return error.
            return JsonResponse({"status": False}, status=500)
        else:
            # verify recaptcha
            verifyRecaptcha = requests.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": settings.FEC_RECAPTCHA_SECRET_KEY,
                    "response": data["g-recaptcha-response"],
                },
            )
            recaptchaResponse = verifyRecaptcha.json()
            if not recaptchaResponse["success"]:
                # if captcha failed, return failure
                return JsonResponse({"status": False}, status=500)
            else:
                # captcha passed, we're ready to submit the issue.
                title = "User feedback on " + request.META.get("HTTP_REFERER")
                body = (
                    "## What were you trying to do and how can we improve it?\n %s \n\n"
                    "## General feedback?\n %s \n\n"
                    "## Tell us about yourself\n %s \n\n"
                    "## Details\n"
                    "* URL: %s \n"
                    "* User Agent: %s"
                ) % (
                    "\nChart Name: " + data["name"] + "\nChart Location: " + data["location"],
                    data["feedback"],
                    "\nThe reaction to the chart is: " + data["reaction"],
                    request.META.get("HTTP_REFERER"),
                    data["userAgent"],
                )

                client = github3.login(token=settings.FEC_GITHUB_TOKEN)
                issue = client.repository("fecgov", "fec").create_issue(
                    title, body=body
                )

                return JsonResponse(issue.as_dict(), status=201)
    else:
        raise Http404()
