from collections import OrderedDict

ELECTION_TYPES = OrderedDict([
    ('election', 'All elections'),
])

DEADLINE_TYPES = OrderedDict([
    ('report-M', 'Monthly'),
    ('report-Q', 'Quarterly'),
    ('report-E', 'Pre- and post-election'),
    ('report-MY', 'Mid-Year'),
    ('report-YE', 'Year-End')
])

REPORTING_PERIODS = OrderedDict([
    ('IE Periods', 'Independent expenditures'),
    ('EC Periods', 'Electioneering communications'),
    ('FEA Periods', 'Federal election activity periods')
])

OUTREACH_TYPES = OrderedDict([
    ('Conferences', 'Conferences'),
    ('Roundtables', 'Webinars'),
])

MEETING_TYPES = OrderedDict([
    ('Open Meetings', 'Open meeting'),
    ('Executive Sessions', 'Executive session'),
    ('Public Hearings', 'Public hearing'),
])

RULE_TYPES = OrderedDict([
    ('AOs and Rules', 'Advisory opinions and rulemakings'),
])

EVENT_CATEGORY_GROUPS = OrderedDict([
    ('elections', ELECTION_TYPES),
    ('deadliens', DEADLINE_TYPES),
    ('reporting_periods', REPORTING_PERIODS),
    ('outreach', OUTREACH_TYPES),
    ('meeting_types', MEETING_TYPES),
    ('rules', RULE_TYPES)
])
