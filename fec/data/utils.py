import math
import calendar
import datetime

from data import constants


def current_cycle(delayed_start=False):
    """
    Calculate the current cycle from the calendar date,
    except when `delayed_start` is True - in that case,
    don't roll over to the next cycle
    until April 15th of the next year.

    Example: on 1/20/19, current_cycle should be 2018 because we don't have
    2020 data yet. On 4/15/19 (April Quarterly deadline), roll over to 2020
    """
    if delayed_start:
        date = datetime.date.today() + datetime.timedelta(-104)
    else:
        date = datetime.date.today()
    year = date.year
    return year + year % 2


def date_ranges():
    """Build date ranges for current day, month, quarter, and year.
    """
    today = datetime.date.today()
    quarter = math.floor((today.month - 1) / 3)
    cycle = current_cycle()
    return {
        'month': (
            today.replace(day=1),
            today.replace(day=calendar.monthrange(today.year, today.month)[1]),
        ),
        'quarter': (
            today.replace(day=1, month=quarter * 3 + 1),
            today.replace(
                day=calendar.monthrange(today.year, quarter * 3 + 3)[1],
                month=quarter * 3 + 3,
            ),
        ),
        'year': (
            today.replace(day=1, month=1),
            today.replace(
                day=calendar.monthrange(today.year, 12)[1],
                month=12,
            ),
        ),
        'cycle': (
            datetime.date(
                year=cycle - 1,
                month=1,
                day=1,
            ),
            datetime.date(
                year=cycle,
                month=12,
                day=calendar.monthrange(cycle, 12)[1],
            ),
        ),
    }


def get_cycles(max_cycle=None):
    max = max_cycle if max_cycle else current_cycle()
    return range(max, constants.START_YEAR, -2)


def election_title(cycle, office, state=None, district=None):
    # If this logic changes, please update `page-header.jinja` logic
    base = ' '.join(
        [str(cycle), 'Election', 'United States', office.capitalize()])
    parts = [base]
    if state:
        parts.append(constants.states[state.upper()])
    if district:
        parts.append('District {0}'.format(district))
    return ' - '.join(parts)


def page_info(pagination):
    """Generate a string showing number of results out of how many
    based on a pagination object from an API response
    """
    page = pagination['page']
    per_page = pagination['per_page']
    count = '{:,}'.format(pagination['count'])
    range_start = per_page * (page - 1) + 1
    range_end = (page - 1) * 10 + per_page
    return '{range_start}-{range_end} of {count}'.format(
        range_start=range_start, range_end=range_end, count=count)


def financial_summary_processor(totals, formatter):
    """ Process totals data by getting the label and hierarchy level for each value
    """
    processed = []
    for i in formatter:
        if i in totals:
            line = (totals[i], formatter[i])
            processed.append(line)
    return processed


def process_raising_data(totals):
    """
    Processes raising totals by mapping to the RAISING_FORMATTER constant
    Occasionally, the API schema is slightly out of sync with what we want to
    display, so there's logic here to remove or rename items depending on the
    form we're showing
    """

    # If there's repayments_loans_made_by_candidate, it's an F3P .
    # In this case, loan_repayments_made is a subtotal and shouldn't be linked to
    # For F3, loan_repayments_made is just a single line and should be a link
    # So this renames it for proper formatting of F3P
    if 'loan_repayments_made' in totals and 'repayments_loans_made_by_candidate' in totals:
        totals['total_loan_repayments_made'] = totals['loan_repayments_made']
        del totals['loan_repayments_made']

    # If there's shared_fed_operating_expenditures, it's an F3X filer.
    # In this case, operating_expenditures is a subtotal and shouldn't be linked
    # So this renames it and deletes the original reference for F3X
    if 'operating_expenditures' in totals and 'shared_fed_operating_expenditures' in totals:
        totals['total_operating_expenditures'] = totals['operating_expenditures']
        del totals['operating_expenditures']

    # There's some fields only available on F3P but that are included in the responses for F3.
    # So this checks for them and then deletes
    if 'offsets_to_legal_accounting' in totals and 'all_other_loans' in totals:
        del totals['offsets_to_legal_accounting']
        del totals['offsets_to_fundraising_expenditures']
        del totals['total_offsets_to_operating_expenditures']
        del totals['federal_funds']

    # Presidential committees show total offsets AND offsets to operating expenditures
    # We want to nest the latter under the former as a third-level item,
    # but because other committees use offsets_to_operating expenditures at the second level,
    # we store that as a new value and remove the old one
    if 'total_offsets_to_operating_expenditures' in totals and 'offsets_to_legal_accounting' in totals:
        totals['subtotal_offsets_to_operating_expenditures'] = totals['offsets_to_operating_expenditures']
        del totals['offsets_to_operating_expenditures']

    return financial_summary_processor(totals, constants.RAISING_FORMATTER)


def process_spending_data(totals):
    # Remove items from combined candidate disbursements for F3
    if 'fundraising_disbursements' in totals and 'loan_repayments' in totals:
        del totals['fundraising_disbursements']
        del totals['exempt_legal_accounting_disbursement']

    return financial_summary_processor(totals, constants.SPENDING_FORMATTER)


def process_cash_data(totals):
    return financial_summary_processor(totals, constants.CASH_FORMATTER)


def process_ie_data(totals):
    return financial_summary_processor(totals, constants.IE_FORMATTER)


def process_inaugural_data(totals):
    return financial_summary_processor(totals, constants.INAUGURAL_FORMATTER)


def process_host_raising_data(totals):
    return financial_summary_processor(totals, constants.HOST_RAISING_FORMATTER)


def process_host_spending_data(totals):
    return financial_summary_processor(totals, constants.HOST_SPENDING_FORMATTER)


def get_next_senate_elections(current_cycle):
    """
    Returns an dictionary of senate classes in chronological order
    based on current cycle year
    Uses mod 6 to determine what senate classes are up for election
    in the current cycle

    For example, class 1 will always be up for election in years
    with year % 6 = 2, for example 2018.
    """
    next_election_decoder = {
        2: {'1': current_cycle, '2': (current_cycle + 2), '3': (current_cycle + 4)},
        4: {'2': current_cycle, '3': (current_cycle + 2), '1': (current_cycle + 4)},
        0: {'3': current_cycle, '1': (current_cycle + 2), '2': (current_cycle + 4)}
    }
    return next_election_decoder.get(current_cycle % 6)


def get_senate_cycles(senate_class, cycle=None):
    """
    Returns an list of elections based on senate class
    Uses get_next_senate_elections to find out
    which classes are up for election
    Adds years to current cycle depending on what position the class is in
    """
    if cycle is None:
        cycle = current_cycle()
    senate_classes = get_next_senate_elections(cycle)
    return range(senate_classes.get(senate_class), constants.START_YEAR, -6)


def three_days_ago():
    """Find the date three days ago, return as mm/dd/yyyy"""
    three_days_ago = datetime.datetime.today() - datetime.timedelta(days=3)
    return three_days_ago.strftime('%m/%d/%Y')


def extend(*dicts):
    """Create a new dictionary from multiple existing dictionaries
    without overwriting."""
    new_dict = {}
    for each in dicts:
        new_dict.update(each)
    return new_dict
