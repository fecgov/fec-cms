from collections import OrderedDict

# Calendar page filter categories
election_types = OrderedDict([
    ('36', 'All elections'),
])

deadline_types = OrderedDict([
    ('25', 'Quarterly reports'),
    ('26', 'Monthly reports'),
    ('27', 'Pre- and post-election'),
])

reporting_periods = OrderedDict([
    ('29', 'Independent expenditures'),
    ('28', 'Electioneering communications'),
    ('38', 'Federal election activity periods')
])

outreach_types = OrderedDict([
    ('33', 'Conferences'),
    ('34', 'Webinars'),
])

meeting_types = OrderedDict([
    ('32', 'Open meeting'),
    ('39', 'Executive session'),
    ('40', 'Public hearing'),
])

rule_types = OrderedDict([
    ('23', 'Advisory opinions and rulemakings'),
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

author_groups = OrderedDict([
    ('Press Office', 'Press authors'),
    ('Information Division', 'Information Division authors'),
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
    ("tips-for-treasurers", "Tips for Treasurers"),
    ("commission-meeting", "Commission Meetings"),
])

# These are each a group of categories relevant to a particular type of report
# They're broken up by parent category so that only these ones will be shown
# on that type of report page
oig_reports = OrderedDict((x.lower(), x) for x in [
    "Audit report",
    "Inspection or special review report",
    "Semiannual report",
    "Strategic plan",
    "Work plan",
])

strategy_budget_performance_reports = OrderedDict((x.lower(), x) for x in [
    "Agency Financial Report",
    "Congressional submission",
    "Performance and accountability report",
    "Strategic plan",
    "Summary of performance and financial information"
])

foia_reports = OrderedDict((x.lower(), x) for x in [
    "Annual report",
    "Summary report"
])

privacy_reports = OrderedDict((x.lower(), x) for x in [
    "Privacy Act notice",
    "Privacy policy"
])

procurement_contracting_reports = OrderedDict((x.lower(), x) for x in [
    "Buy America report",
    "FAIR Act",
    "Public procurement report"
])

annual_anniversary_reports = OrderedDict((x.lower(), x) for x in [
    "Anniversary report",
    "Annual report"
])

agency_operations_reports = OrderedDict((x.lower(), x) for x in [
    "Gift report",
    "Shutdown plan",
    "Study"
])

# This maps each group to a key for reference later on
report_category_groups = OrderedDict([
    ('oig', oig_reports),
    ('strategy_budget_performance', strategy_budget_performance_reports),
    ('foia', foia_reports),
    ('privacy', privacy_reports),
    ('procurement_contracting_reports', procurement_contracting_reports),
    ('annual_anniversary', annual_anniversary_reports),
    ('agency_operations', agency_operations_reports)
])

# Create a dict of all of the category group names to populate the choices
# on the DocumentFeedPage
report_parent_categories = OrderedDict((x, x.replace('_', ' ')) for x in report_category_groups.keys())

# Combine all of the dicts into a single one to be shared by all DocumentPages
# This allows us to have a single DocumentPage class that works regardless of
# the parent page
report_child_categories = OrderedDict()
for category in report_category_groups.keys():
    report_child_categories.update(report_category_groups[category])


# Search index constants
# These are the parent pages for which we want *all* descendants of, not just direct children
SEARCH_DESCENDANTS_OF = [
    '/home/legal-resources/',
    '/home/help-candidates-and-committees/',
    '/home/press/'
]

# These are the parent pages for which we want *only* direct children
SEARCH_CHILDREN_OF = [
    '/home/',
    '/home/about/',
    '/home/about/leadership-and-structure/'
]


# a copy of USAJOBS code list for hard caching
USAJOBS_CODE_LIST = """
{
  "CodeList": [
    {
      "ValidValue": [
        {
          "Code": "DISABILITY",
          "Value": "Individuals with disabilities",
          "LastModified": "2017-06-30T08:16:59.55",
          "IsDisabled": "No"
        },
        {
          "Code": "FED",
          "Value": "Federal employees",
          "LastModified": "2018-04-18T06:07:55.647",
          "IsDisabled": "Yes"
        },
        {
          "Code": "FED-COMPETITIVE",
          "Value": "Federal employees - Competitive service",
          "LastModified": "2018-02-23T06:04:26.54",
          "IsDisabled": "No"
        },
        {
          "Code": "FED-EXCEPTED",
          "Value": "Federal employees - Excepted service",
          "LastModified": "2018-02-23T06:04:26.54",
          "IsDisabled": "No"
        },
        {
          "Code": "FED-INTERNAL-NOSEARCH",
          "Value": "Internal to an agency - does not appear on USAJOBS",
          "LastModified": "2017-06-30T08:16:59.547",
          "IsDisabled": "No"
        },
        {
          "Code": "FED-INTERNAL-SEARCH",
          "Value": "Internal to an agency - appears on USAJOBS",
          "LastModified": "2017-06-30T08:16:59.547",
          "IsDisabled": "No"
        },
        {
          "Code": "FED-TRANSITION",
          "Value": "Career transition (CTAP, ICTAP, RPL)",
          "LastModified": "2018-02-23T06:04:26.54",
          "IsDisabled": "No"
        },
        {
          "Code": "GRADUATES",
          "Value": "Recent graduates",
          "LastModified": "2018-02-23T06:04:26.53",
          "IsDisabled": "No"
        },
        {
          "Code": "LAND",
          "Value": "Land & base management",
          "LastModified": "2018-02-23T06:04:26.537",
          "IsDisabled": "No"
        },
        {
          "Code": "MSPOUSE",
          "Value": "Military spouses",
          "LastModified": "2017-06-30T08:16:59.55",
          "IsDisabled": "No"
        },
        {
          "Code": "NATIVE",
          "Value": "Native Americans",
          "LastModified": "2017-06-30T08:16:59.55",
          "IsDisabled": "No"
        },
        {
          "Code": "NGUARD",
          "Value": "National Guard & Reserves",
          "LastModified": "2017-06-30T08:16:59.55",
          "IsDisabled": "No"
        },
        {
          "Code": "NOPUBLIC",
          "Value": "Exclusive posting",
          "LastModified": "2017-06-30T08:16:59.553",
          "IsDisabled": "No"
        },
        {
          "Code": "OVERSEAS",
          "Value": "Family of overseas employees",
          "LastModified": "2017-06-30T08:16:59.55",
          "IsDisabled": "No"
        },
        {
          "Code": "PEACE",
          "Value": "Peace Corps & AmeriCorps Vista",
          "LastModified": "2017-06-30T08:16:59.553",
          "IsDisabled": "No"
        },
        {
          "Code": "PUBLIC",
          "Value": "The public",
          "LastModified": "2017-06-30T08:16:59.547",
          "IsDisabled": "No"
        },
        {
          "Code": "SE-OTHER",
          "Value": "Senior executives - Other",
          "LastModified": "2018-06-01T06:02:36.58",
          "IsDisabled": "Yes"
        },
        {
          "Code": "SES",
          "Value": "Senior executives",
          "LastModified": "2018-06-01T06:02:36.58",
          "IsDisabled": "No"
        },
        {
          "Code": "SPECIAL-AUTHORITIES",
          "Value": "Special authorities",
          "LastModified": "2018-02-23T06:04:26.537",
          "IsDisabled": "No"
        },
        {
          "Code": "STUDENT",
          "Value": "Students",
          "LastModified": "2018-02-23T06:04:26.53",
          "IsDisabled": "No"
        },
        {
          "Code": "VET",
          "Value": "Veterans",
          "LastModified": "2017-06-30T08:16:59.547",
          "IsDisabled": "No"
        }
      ],
      "id": "HiringPath"
    }
  ],
  "DateGenerated": "2018-10-24T14:45:06.2321547-04:00"
}
"""
