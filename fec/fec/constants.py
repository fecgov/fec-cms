from collections import OrderedDict

election_types = OrderedDict([
    ('election', 'All elections'),
])

deadline_types = OrderedDict([
    ('report-M', 'Monthly'),
    ('report-Q', 'Quarterly'),
    ('report-E', 'Pre- and post-election')
])

reporting_periods = OrderedDict([
    ('IE Periods', 'Independent expenditures'),
    ('EC Periods', 'Electioneering communications'),
    ('FEA Periods', 'Federal election activity periods')
])

outreach_types = OrderedDict([
    ('Conferences', 'Conferences'),
    ('Roundtables', 'Webinars'),
])

meeting_types = OrderedDict([
    ('Open Meetings', 'Open meeting'),
    ('Executive Sessions', 'Executive session'),
    ('Public Hearings', 'Public hearing'),
])

rule_types = OrderedDict([
    ('AOs and Rules', 'Advisory opinions and rulemakings'),
])

states = OrderedDict([
    ('AK', 'Alaska'),
    ('AL', 'Alabama'),
    ('AR', 'Arkansas'),
    ('AS', 'American Samoa'),
    ('AZ', 'Arizona'),
    ('CA', 'California'),
    ('CO', 'Colorado'),
    ('CT', 'Connecticut'),
    ('DC', 'District of Columbia'),
    ('DE', 'Delaware'),
    ('FL', 'Florida'),
    ('GA', 'Georgia'),
    ('GU', 'Guam'),
    ('HI', 'Hawaii'),
    ('IA', 'Iowa'),
    ('ID', 'Idaho'),
    ('IL', 'Illinois'),
    ('IN', 'Indiana'),
    ('KS', 'Kansas'),
    ('KY', 'Kentucky'),
    ('LA', 'Louisiana'),
    ('MA', 'Massachusetts'),
    ('MD', 'Maryland'),
    ('ME', 'Maine'),
    ('MI', 'Michigan'),
    ('MN', 'Minnesota'),
    ('MO', 'Missouri'),
    ('MP', 'Northern Mariana Islands'),
    ('MS', 'Mississippi'),
    ('MT', 'Montana'),
    ('NC', 'North Carolina'),
    ('ND', 'North Dakota'),
    ('NE', 'Nebraska'),
    ('NH', 'New Hampshire'),
    ('NJ', 'New Jersey'),
    ('NM', 'New Mexico'),
    ('NV', 'Nevada'),
    ('NY', 'New York'),
    ('OH', 'Ohio'),
    ('OK', 'Oklahoma'),
    ('OR', 'Oregon'),
    ('PA', 'Pennsylvania'),
    ('PR', 'Puerto Rico'),
    ('RI', 'Rhode Island'),
    ('SC', 'South Carolina'),
    ('SD', 'South Dakota'),
    ('TN', 'Tennessee'),
    ('TX', 'Texas'),
    ('UT', 'Utah'),
    ('VA', 'Virginia'),
    ('VI', 'Virgin Islands'),
    ('VT', 'Vermont'),
    ('WA', 'Washington'),
    ('WI', 'Wisconsin'),
    ('WV', 'West Virginia'),
    ('WY', 'Wyoming'),
])

author_roles = OrderedDict([
    ('author', 'Author'),
    ('writer', 'Written by'),
    ('graphics', 'Graphics by'),
    ('contact', 'Contact'),
])

record_page_categories = OrderedDict((x.lower(), x) for x in [
    "Advisory opinions",
    "Commission",
    "Compliance",
    "Litigation",
    "Outreach",
    "Public funding",
    "Regulations",
    "Reporting",
    "Statistics",
])

press_release_page_categories = OrderedDict((x.lower(), x) for x in [
    "Audit reports",
    "Campaign finance data summaries",
    "Commission appointments",
    "Disclosure initiatives",
    "Enforcement matters",
    "Hearings",
    "Litigation",
    "Non-filer publications",
    "Open meetings and related matters",
    "Presidential public funds",
    "Rulemakings",
    "Other agency actions",
    "",
])

update_types = OrderedDict([
    ("press-release", "Press release"),
    ("fec-record", "FEC Record"),
    ("weekly-digest", "Weekly Digest"),
    ("tips-for-treasurers", "Tips for Treasurers")
])

oig_reports = OrderedDict((x.lower(), x) for x in [
    "Audit report",
    "Inspection report",
    "Special review report",
    "Semiannual report"
])

strategy_budget_performance_reports = OrderedDict((x.lower(), x) for x in [
    "Strategic plan",
    "IT strategic plan",
    "Congressional budget justification",
    "Annual performance report",
    "Performance and accountability report"
])

foia_reports = OrderedDict((x.lower(), x) for x in [
    "Annual FOIA report"
])

privacy_reports = OrderedDict((x.lower(), x) for x in [
    "Privacy Act notices",
    "Privacy policy"
])

procurement_contracting_reports = OrderedDict((x.lower(), x) for x in [
    "Purchase inventory",
    "Annual report",
    "FAIR Act inventory report",
    "Request for proposal (RFP)"
])

annual_anniversary_reports = OrderedDict((x.lower(), x) for x in [
    "Anniversary report",
    "Annual report"
])

agency_operations_reports = OrderedDict((x.lower(), x) for x in [
    "Shutdown plan",
    "Operation plan",
    "Annual report"
])

report_category_groups = {
    'oig': oig_reports,
    'strategy_budget_performance': strategy_budget_performance_reports,
    'foia': foia_reports,
    'privacy': privacy_reports,
    'procurement_contracting_reports': procurement_contracting_reports,
    'annual_anniversary': annual_anniversary_reports,
    'agency_operations': agency_operations_reports
}

# Create an OrderedDict of all the categories
report_parent_categories = OrderedDict((x, x.replace('_', ' ')) for x in report_category_groups.keys())

# Combine all the above categories into a single dict
report_child_categories = {}
for category in report_category_groups.keys():
    report_child_categories.update(report_category_groups[category])
