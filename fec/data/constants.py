from collections import OrderedDict
import operator

from data import utils

START_YEAR = 1979
END_YEAR = 2024
DEFAULT_TIME_PERIOD = 2024  # Change after the April quarterly report (4/15/25)
DEFAULT_ELECTION_YEAR = 2024  # Change after election day (11/5/24)
DEFAULT_PRESIDENTIAL_YEAR = 2024  # Change after April quarterly after mid-terms (4/15/25)
DISTRICT_MAP_CUTOFF = 2024  # The year we show district maps for on election pages

states = OrderedDict([
    ('AL', 'Alabama'),
    ('AK', 'Alaska'),
    ('AS', 'American Samoa'),
    ('AZ', 'Arizona'),
    ('AR', 'Arkansas'),
    ('CA', 'California'),
    ('CO', 'Colorado'),
    ('CT', 'Connecticut'),
    ('DE', 'Delaware'),
    ('DC', 'District of Columbia'),
    ('FL', 'Florida'),
    ('GA', 'Georgia'),
    ('GU', 'Guam'),
    ('HI', 'Hawaii'),
    ('ID', 'Idaho'),
    ('IL', 'Illinois'),
    ('IN', 'Indiana'),
    ('IA', 'Iowa'),
    ('KS', 'Kansas'),
    ('KY', 'Kentucky'),
    ('LA', 'Louisiana'),
    ('ME', 'Maine'),
    ('MD', 'Maryland'),
    ('MA', 'Massachusetts'),
    ('MI', 'Michigan'),
    ('MN', 'Minnesota'),
    ('MS', 'Mississippi'),
    ('MO', 'Missouri'),
    ('MT', 'Montana'),
    ('NE', 'Nebraska'),
    ('NV', 'Nevada'),
    ('NH', 'New Hampshire'),
    ('NJ', 'New Jersey'),
    ('NM', 'New Mexico'),
    ('NY', 'New York'),
    ('NC', 'North Carolina'),
    ('ND', 'North Dakota'),
    ('MP', 'Northern Mariana Islands'),
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
    ('VI', 'U.S. Virgin Islands'),
    ('UT', 'Utah'),
    ('VT', 'Vermont'),
    ('VA', 'Virginia'),
    ('WA', 'Washington'),
    ('WV', 'West Virginia'),
    ('WI', 'Wisconsin'),
    ('WY', 'Wyoming'),
])

states_excl_territories = OrderedDict([
    ('AL', 'Alabama'),
    ('AK', 'Alaska'),
    ('AZ', 'Arizona'),
    ('AR', 'Arkansas'),
    ('CA', 'California'),
    ('CO', 'Colorado'),
    ('CT', 'Connecticut'),
    ('DE', 'Delaware'),
    ('DC', 'District of Columbia'),
    ('FL', 'Florida'),
    ('GA', 'Georgia'),
    ('HI', 'Hawaii'),
    ('ID', 'Idaho'),
    ('IL', 'Illinois'),
    ('IN', 'Indiana'),
    ('IA', 'Iowa'),
    ('KS', 'Kansas'),
    ('KY', 'Kentucky'),
    ('LA', 'Louisiana'),
    ('ME', 'Maine'),
    ('MD', 'Maryland'),
    ('MA', 'Massachusetts'),
    ('MI', 'Michigan'),
    ('MN', 'Minnesota'),
    ('MS', 'Mississippi'),
    ('MO', 'Missouri'),
    ('MT', 'Montana'),
    ('NE', 'Nebraska'),
    ('NV', 'Nevada'),
    ('NH', 'New Hampshire'),
    ('NJ', 'New Jersey'),
    ('NM', 'New Mexico'),
    ('NY', 'New York'),
    ('NC', 'North Carolina'),
    ('ND', 'North Dakota'),
    ('OH', 'Ohio'),
    ('OK', 'Oklahoma'),
    ('OR', 'Oregon'),
    ('PA', 'Pennsylvania'),
    ('RI', 'Rhode Island'),
    ('SC', 'South Carolina'),
    ('SD', 'South Dakota'),
    ('TN', 'Tennessee'),
    ('TX', 'Texas'),
    ('UT', 'Utah'),
    ('VT', 'Vermont'),
    ('VA', 'Virginia'),
    ('WA', 'Washington'),
    ('WV', 'West Virginia'),
    ('WI', 'Wisconsin'),
    ('WY', 'Wyoming'),
])

contributor_states = OrderedDict(sorted(utils.extend(states, {
    ('AA', 'Armed Forces Americas'),
    ('AE', 'Armed Forces Europe'),
    ('AP', 'Armed Forces Pacific'),
    ('ZZ', 'Foreign Countries'),
}).items(), key=operator.itemgetter(1)))

parties = OrderedDict([
    ('DEM', 'Democratic Party'),
    ('REP', 'Republican Party'),
])
parties_extended = OrderedDict([
    ('AIC', 'American Independent Conservative'),
    ('AIP', 'American Independent Party'),
    ('AMP', 'American Party'),
    ('APF', "American People's Freedom Party"),
    ('CIT', "Citizens' Party"),
    ('CMP', 'Commonwealth Party of the US'),
    ('COM', 'Communist Party'),
    ('CRV', 'Conservative Party'),
    ('CST', 'Constitutional'),
    ('DC', 'Democratic/Conservative'),
    ('DFL', 'Democratic-Farm-Labor'),
    ('FLP', 'Freedom Labor Party'),
    ('GRE', 'Green Party'),
    ('GWP', 'George Wallace Party'),
    ('HRP', 'Human Rights Party'),
    ('IAP', 'Independent American Party'),
    ('ICD', 'Independent Conserv. Democratic'),
    ('IGD', 'Industrial Government Party'),
    ('IND', 'Independent'),
    ('LAB', 'US Labor Party'),
    ('LBL', 'Liberal Party'),
    ('LBR', 'Labor Party'),
    ('LBU', 'Liberty Union Party'),
    ('LFT', 'Less Federal Taxes'),
    ('LIB', 'Libertarian'),
    ('LRU', 'La Raza Unida'),
    ('NAP', 'Prohibition Party'),
    ('NDP', 'National Democratic Party'),
    ('NLP', 'Natural Law Party'),
    ('PAF', 'Peace and Freedom'),
    ('PFD', 'Peace Freedom Party'),
    ('POP', 'People Over Politics'),
    ('PPD', 'Protest, Progress, Dignity'),
    ('PPY', "People's Party"),
    ('REF', 'Reform Party'),
    ('RTL', 'Right to Life'),
    ('SLP', 'Socialist Labor Party'),
    ('SUS', 'Socialist Party USA'),
    ('SWP', 'Socialist Workers Party'),
    ('THD', 'Theo-Dem'),
    ('TWR', 'Taxpayers Without Representation'),
    ('TX', 'Taxpayers'),
    ('USP', "US People's Party"),
])

monthly_reports = OrderedDict([
    ('M2', 'February monthly'),
    ('M3', 'March monthly'),
    ('M4', 'April monthly'),
    ('M5', 'May monthly'),
    ('M6', 'June monthly'),
    ('M7', 'July monthly'),
    ('M8', 'August monthly'),
    ('M9', 'September monthly'),
    ('M10', 'October monthly'),
    ('M11', 'November monthly'),
    ('M12', 'December monthly'),
])

quarterly_reports = OrderedDict([
    ('Q1', 'April quarterly'),
    ('Q2', 'July quarterly'),
    ('Q3', 'October quarterly'),
])

semiannual_reports = OrderedDict([
    ('MY', 'Mid-year report'),
])

election_sensitive_reports = OrderedDict([
    ('12P', 'Pre-primary'),
    ('12C', 'Pre-convention'),
    ('12G', 'Pre-general'),
    ('12R', 'Pre-runoff'),
    ('12S', 'Pre-special'),
    ('30G', 'Post-general'),
    ('30R', 'Post-runoff'),
    ('30S', 'Post-special'),
    ('30P', 'Post-primary'),
    ('60D', 'Post-convention'),
    ('10D', 'Pre-election (10D)'),
    ('30D', 'Post-election (30D)')
])

bundling_reports = OrderedDict([
    ('M7S', 'July monthly/semiannual'),
    ('MSA', 'Monthly semiannual mid year'),
    ('MSY', 'Monthly semiannual year end'),
    ('MYS', 'Monthly year end/semiannual'),
    ('Q2S', 'July quarterly/semiannual'),
    ('QSA', 'Quarterly semiannual (MY)'),
    ('QYE', 'Quarterly semiannual (YE)'),
    ('QYS', 'Quarterly year end/semiannual'),
    ('QMS', 'Quarterly mid year/semiannual'),
])

other_reports = OrderedDict([
    ('TER', 'Termination'),
    ('24', '24-Hour Notification'),
    ('48', '48-Hour Notification'),
    ('90D', 'Post inaugural'),
    ('90S', 'Post inaugural supplement'),
    ('CA', 'Comprehensive amendment'),
    ('ADJ', 'Comprehensive adjusted amendment'),
])

form_types = OrderedDict([
    ('F1', "Statements Of Organization (Form 1)"),
    ('F1M', "Multicandidate status (Form 1M)"),
    ('F2', "Statements Of Candidacy (Form 2)"),
    ('F3', "Congressional candidate financial reports (Form 3)"),
    ('F3P', "Presidential financial reports (Form 3P)"),
    ('F3X', "PAC and party financial reports (Form 3X)"),
    ('F3L', "Bundled contributions reports (Form 3L)"),
    ('F4', "Convention financial reports (Form 4)"),
    ('F5', "Independent expenditure reports and notices (by a person or group) (Form 5)"),
    ('F24', "Independent expenditure reports and notices (by a registered committee) (Form 24)"),
    ('F6', "Contributions and loans notices (Form 6)"),
    ('F7', "Communication cost reports (Form 7)"),
    ('F8', "Debt settlement plans (Form 8)"),
    ('F9', "Electioneering communications notices (Form 9)"),
    ('F13', "Inaugural committee donation reports (Form 13)"),
    ('F99', "Miscellaneous submission (Form 99)"),
    ('F10', "Expenditure of personal funds notices (Form 10)"),
    ('F11', "Opposition personal funds notices (Form 11)"),
    ('F12', "Suspension of increased limits notices (Form 12)"),
    ('RFAI', "Request For Additional Information (RFAI)"),
])

report_type_full = OrderedDict([
    ('10D', 'Pre-Election'),
    ('10G', 'Pre-General'),
    ('10P', 'Pre-Primary'),
    ('10R', 'Pre-Runoff'),
    ('10S', 'Pre-Special'),
    ('12C', 'Pre-Convention'),
    ('12CAU', 'Pre-Caucus'),
    ('12G', 'Pre-General'),
    ('12GR', 'Pre-General Runoff'),
    ('12P', 'Pre-Primary'),
    ('12PR', 'Pre-Primary Runoff'),
    ('12R', 'Pre-Runoff'),
    ('12S', 'Pre-Special'),
    ('12SC', 'Pre-Special Convention'),
    ('12SG', 'Pre-Special General'),
    ('12SGR', 'Pre-Special General Runoff'),
    ('12SP', 'Pre-Special Primary'),
    ('12SPR', 'Pre-Special Primary Runoff'),
    ('30D', 'Post-Election'),
    ('30G', 'Post-General'),
    ('30GR', 'Post-General Runoff'),
    ('30P', 'Post-Primary'),
    ('30R', 'Post-Runoff'),
    ('30S', 'Post-Special'),
    ('30SC', 'Post-Special Convention'),
    ('30SG', 'Post-Special General'),
    ('30SGR', 'Post-Special General Runoff'),
    ('60D', 'Post-Convention'),
    ('Q1', 'April Quarterly'),
    ('Q2', 'July Quarterly'),
    ('Q3', 'October Quarterly'),
    ('TER', 'Termination Report'),
    ('YE', 'Year-End'),
    ('ADJ', 'Comp Adjust Amend'),
    ('CA', 'Comprehensive Amend'),
    ('90S', 'Post-Inaugural Supplement'),
    ('90D', 'Post-Inaugural'),
    ('48H', '48-Hour Notification'),
    ('24H', '24-Hour Notification'),
    ('M10', 'October Monthly'),
    ('M11', 'November Monthly'),
    ('M12', 'December Monthly'),
    ('M1', 'January Monthly'),
    ('M2', 'February Monthly'),
    ('M3', 'March Monthly'),
    ('M4', 'April Monthly'),
    ('M5', 'May Monthly'),
    ('M6', 'June Monthly'),
    ('M7', 'July Monthly'),
    ('M8', 'August Monthly'),
    ('M9', 'September Monthly'),
    ('MY', 'Mid-Year'),
    ('YE', 'Year-End'),
    ('Q1', 'April Quarterly'),
    ('Q2', 'July Quarterly'),
    ('Q3', 'October Quarterly'),
    ('M7S', 'July Monthly/Semi-Annual'),
    ('MSA', 'Monthly Semi-Annual (MY)'),
    ('MYS', 'Monthly Year End/Semi-Annual'),
    ('Q2S', 'July Quarterly/Semi-Annual'),
    ('QSA', 'Quarterly Semi-Annual (MY)'),
    ('QYS', 'Quarterly Year End/Semi-Annual'),
    ('QYE', 'Quarterly Semi-Annual (YE)'),
    ('QMS', 'Quarterly Mid-Year/ Semi-Annual'),
])

amendment_indicators_extended = OrderedDict([
    ('T', 'Terminated'),
    ('C', 'Consolidated'),
    ('M', 'Multicandidate'),
    ('S', 'Secondary'),
])

candidate_status = OrderedDict([
    ('C', 'Statutory candidate'),
])
candidate_status_extended = OrderedDict([
    ('F', 'Future candidate'),
    ('N', 'Not yet a candidate'),
    ('P', 'Statutory candidate in prior cycle'),
])

pac_party = OrderedDict([
    ('PAC', 'PACs'),
    ('PAR', 'Political Party Committees'),
])
pac_party_types = OrderedDict([
    ('N', 'PAC - nonqualified'),
    ('Q', 'PAC - qualified'),
    ('V', 'Hybrid PAC - nonqualified'),
    ('W', 'Hybrid PAC - qualified'),
    ('P', 'Party - nonqualified'),
    ('Y', 'Party - qualified'),
    ('Z', 'National party nonfederal account'),
    ('U', 'Single candidate independent expenditure'),
    ('O', 'Super PAC (independent expenditure only'),
    ('I', 'Independent expenditure filer (not a committee)')
])

house_senate_types = OrderedDict([
    ('H', 'House'),
    ('S', 'Senate')
])


primary_category_keys = ['primary_category_id', 'primary_category_name']
sub_category_keys = ['sub_category_id', 'sub_category_name']

audit_primary_categories_options = OrderedDict([
    ('all', 'All'),
    ('2', 'Allocation Issues'),
    ('3', 'Disclosure'),
    ('5', 'Excessive Contributions'),
    ('1', 'Failure to File Reports/Schedules/Notices'),
    ('8', 'Loans'),
    ('7', 'Misstatement of Financial Activity'),
    ('14', 'Net Outstanding Campaign/Convention ' + 'Expenditures/Obligations'),
    ('16', 'No Findings or Issues/Not a Committee'),
    ('9', 'Other'),
    ('15', 'Payments/Disgorgements'),
    ('6', 'Prohibited Contributions'),
    ('4', 'Recordkeeping'),
    ('17', 'Referred Findings Not Listed'),
    ('13', 'Repayment to US Treasury')
])

audit_sub_categories_options = OrderedDict([
    ('all', 'All')
])


table_columns = OrderedDict([
    ('allocated-federal-nonfederal-disbursements',
        ['Spender', 'Recipient', 'Description', 'Federal share', 'Nonfederal share', 'Total amount', 'Date']),
    ('candidates', ['Name', 'Office', 'Election years', 'Party', 'State', 'District', 'First filing date']),
    ('candidates-office-president', ['Name', 'Party', 'Receipts', 'Disbursements']),
    ('candidates-office-senate', ['Name', 'Party', 'State', 'Receipts', 'Disbursements']),
    ('candidates-office-house', ['Name', 'Party', 'State', 'District', 'Receipts', 'Disbursements']),
    ('committees', ['Name', 'Committee ID', 'Treasurer', 'Type', 'Designation', 'Registration date']),
    ('pac-party', ['Name', 'Type', 'Receipts', 'Disbursements', 'Ending cash on hand']),
    ('communication-costs', ['Committee', 'Support/Oppose', 'Candidate', 'Amount', 'Date']),
    ('disbursements', ['Spender', 'Recipient', 'State', 'Description', 'Disbursement date', 'Amount']),
    ('electioneering-communications',
        ['Spender', 'Candidate mentioned', 'Number of candidates', 'Amount per candidate', 'Date',
            'Disbursement amount']),
    ('filings', ['Filer name', 'Document', 'Version', 'Receipt date', 'Beginning image number']),
    ('independent-expenditures',
        ['Spender', 'Support/Oppose', 'Candidate', 'Description', 'Payee', 'Expenditure date', 'Amount']),
    ('individual-contributions', ['Contributor name', 'Recipient', 'State', 'Employer', 'Receipt date', 'Amount']),
    ('loans', ['Committee Name', 'Loaner name', 'Incurred date', 'Payment to date', 'Original loan amount']),
    ('debts', ['Committee name', 'Creditor/Debtor name', 'Beginning balance', 'Ending balance', 'Coverage end date']),
    ('party-coordinated-expenditures', ['Spender', 'Candidate', 'Payee name', 'Expenditure date', 'Amount']),
    ('receipts', ['Source name', 'Recipient', 'Election', 'State', 'Receipt date', 'Amount']),
    ('reports-presidential',
        ['Committee', 'Report type', 'Version', 'Receipt date', 'Coverage end date', 'Total receipts',
            'Total disbursements']),
    ('reports-house-senate',
        ['Committee', 'Report type', 'Version', 'Receipt date', 'Coverage end date', 'Total receipts',
            'Total disbursements']),
    ('reports-pac-party',
        ['Committee', 'Report type', 'Version', 'Receipt date', 'Coverage end date', 'Total receipts',
            'Total disbursements', 'Total independent expenditures']),
    ('reports-ie-only',
        ['Filer', 'Report type', 'Version', 'Receipt date', 'Coverage end date', 'Total contributions',
            'Total independent expenditures']),
    ('audit', ['Committee name', 'Election cycle', 'Final report', 'Findings and issues', 'Candidate']),
    ('national-party-account-receipts',
        ['Recipient', 'Source', 'Party account', 'Date', 'Amount']),
    ('national-party-account-disbursements',
        ['Spender name', 'Recipient', 'Party account', 'Description', 'Date', 'Amount']),
    ('debts', ['Committee name', 'Creditor/Debtor name', 'Beginning balance', 'Ending balance', 'Coverage end date']),
])

line_numbers = {
    'receipts': {
        'House or Senate committees': OrderedDict([
            ('F3-11AI', 'Line 11ai: Contributions from individuals'),
            ('F3-11B', 'Line 11b: Contributions from political party committees'),
            ('F3-11C', 'Line 11c: Contributions from other political committees'),
            ('F3-11D', 'Line 11d: Contributions from the candidate'),
            ('F3-12', 'Line 12: Transfers from authorized committees'),
            ('F3-13A', 'Line 13a: Loans received from the candidate'),
            ('F3-13B', 'Line 13b: All other loans'),
            ('F3-14', 'Line 14: Offsets to operating expenditures'),
            ('F3-15', 'Line 15: Other receipts'),
        ]),
        'Presidential committees': OrderedDict([
            ('F3P-16', 'Line 16: Federal funds'),
            ('F3P-17A', 'Line 17ai: Contributions from individuals'),
            ('F3P-17B', 'Line 17b: Contributions from political party committees'),
            ('F3P-17C', 'Line 17c: Contributions from other political committees'),
            ('F3P-17D', 'Line 17d: Contributions from the candidate'),
            ('F3P-18', 'Line 18: Transfers from other authorized committees'),
            ('F3P-19A', 'Line 19a: Loans received from candidate'),
            ('F3P-19B', 'Line 19b: Other loans'),
            ('F3P-20A', 'Line 20a: Offsets to operating expenditures - operating'),
            ('F3P-20B', 'Line 20b: Offsets to operating expenditures - fundraising'),
            ('F3P-20C', 'Line 20c: Offsets to operating expenditures - legal and accounting'),
            ('F3P-21', 'Line 21: Other receipts'),
        ]),
        'PACs or Party committees': OrderedDict([
            ('F3X-11AI', 'Line 11ai: Contributions from individuals'),
            ('F3X-11B', 'Line 11b: Contributions from political party committees'),
            ('F3X-11C', 'Line 11c: Contributions from other political committees'),
            ('F3X-12', 'Line 12: Transfers from affiliated committees'),
            ('F3X-13', 'Line 13: Loans received'),
            ('F3X-14', 'Line 14: Loan repayments received'),
            ('F3X-15', 'Line 15: Offsets to operating expenditures'),
            ('F3X-16', 'Line 16: Refunds of contributions made to federal candidates and other political committees'),
            ('F3X-17', 'Line 17: Other federal receipts'),
        ])
    },
    'disbursements': {
        'House or Senate committees': OrderedDict([
            ('F3-17', 'Line 17: Operating expenditures'),
            ('F3-18', 'Line 18: Transfers to other authorized committees'),
            ('F3-19', 'Line 19: Loan repayments'),
            ('F3-19A', 'Line 19a: Loan repayments of loans made or guaranteed by the candidate'),
            ('F3-19B', 'Line 19b: Loan repayments of all other loans'),
            ('F3-20A', 'Line 20a: Refunds of contributions to individuals'),
            ('F3-20B', 'Line 20b: Refunds of contributions to political party committees'),
            ('F3-20C', 'Line 20c: Refunds of contributions to other political committees'),
            ('F3-21', 'Line 21: Other disbursements'),
        ]),
        'Presidential committees': OrderedDict([
            ('F3P-23', 'Line 23: Operating expenditures'),
            ('F3P-24', 'Line 24: Transfers to other authorized committees'),
            ('F3P-25', 'Line 25: Fundraising disbursements'),
            ('F3P-26', 'Line 26: Exempt legal and accounting disbursements'),
            ('F3P-27A', 'Line 27a: Repayments of loans made or guaranteed by candidate'),
            ('F3P-27B', 'Line 27b: Other loan repayments'),
            ('F3P-28A', 'Line 28a: Refunds of contributions to individuals'),
            ('F3P-28B', 'Line 28b: Refunds of contributions to political party committees'),
            ('F3P-28C', 'Line 28c: Refunds of contributions to other political committees'),
            ('F3P-29', 'Line 29: Other disbursements'),
        ]),
        'PACs or Party committees': OrderedDict([
            ('F3X-21B', 'Line 21b: Other federal operating expenditures'),
            ('F3X-22', 'Line 22: Transfers to affiliated/other party committees'),
            ('F3X-23', 'Line 23: Contributions to federal candidates/committees and other political committees'),
            ('F3X-26', 'Line 26: Loan repayments made'),
            ('F3X-27', 'Line 27: Loans made'),
            ('F3X-28A',
                'Line 28a: Refunds of contributions made to individuals/persons other than political committees'),
            ('F3X-28B', 'Line 28b: Refunds of contributions to political party committees'),
            ('F3X-28C', 'Line 28c: Refunds of contributions to other political committees'),
            ('F3X-28D', 'Line 28d: Total contributions refunds'),
            ('F3X-29', 'Line 29: Other disbursements'),
            ('F3X-30B', 'Line 30b: Party - Types 3 & 4 Federal Election Activity (FEA)'),
        ])
    },
    'debts': {
        'house_senate': OrderedDict([
            ('F3-9', 'Debts and obligations owed to the committee (Line 9)'),
            ('F3-10', 'Debts and obligations owed by the committee (Line 10)'),
        ]),
        'presidential': OrderedDict([
            ('F3P-11', 'Debts and obligations owed to the committee (Line 11)'),
            ('F3P-12', 'Debts and obligations owed by the committee (Line 12)'),
        ]),
        'pac_party': OrderedDict([
            ('F3X-9', 'Debts and obligations owed to the committee (Line 9)'),
            ('F3X-10', 'Debts and obligations owed by the committee (Line 10)'),
        ]),
    },
}

national_party_account_dropdowns = {
    'account_types': OrderedDict([
        ('CONVENTION', 'Convention'),
        ('HEADQUARTERS', 'Headquarters'),
        ('RECOUNT', 'Recount'),
    ]),
    'disbursements_types': {
        'Headquarters account': OrderedDict([
            ('41', 'Disbursement'),
            ('41Y', 'Refund to an individual, partnership or limited liability company'),
            ('41T', 'Refund to Native American tribe'),
            ('41Z', 'Refund to registered filer'),
        ]),
        'Recount account': OrderedDict([
            ('42', 'Disbursement'),
            ('42Y', 'Refund to an individual, partnership or limited liability company'),
            ('42T', 'Refund to Native American tribe'),
            ('42Z', 'Refund to registered filer'),
        ]),
        'Convention account': OrderedDict([
            ('40', 'Disbursement'),
            ('40Y', 'Refund to an individual, partnership or limited liability company'),
            ('40T', 'Refund to Native American tribe'),
            ('40Z', 'Refund to registered filer'),
        ])
    },
    'receipt_types': {
        'Headquarters account': OrderedDict([
            ('31', 'Individual, partnership, limited liability company'),
            ('31E', 'Earmarked receipt'),
            ('31J', 'Joint fundraising receipt from individual'),
            ('31F', 'Joint fundraising receipt from registered filer'),
            ('31G', 'Transfer'),
            ('31K', 'Registered filer'),
            ('31T', 'Native American tribe'),
        ]),
        'Recount account': OrderedDict([
            ('32', 'Individual, partnership, limited liability company'),
            ('32E', 'Earmarked receipt'),
            ('32J', 'Joint fundraising receipt from individual'),
            ('32F', 'Joint fundraising receipt from registered filer'),
            ('32G', 'Transfer'),
            ('32K', 'Registered filer'),
            ('32T', 'Native American tribe'),
        ]),
        'Convention account': OrderedDict([
            ('30', 'Individual, partnership, limited liability company'),
            ('30E', 'Earmarked receipt'),
            ('30J', 'Joint fundraising receipt from individual'),
            ('30F', 'Joint fundraising receipt from registered filer'),
            ('30G', 'Transfer'),
            ('30K', 'Registered filer'),
            ('30T', 'Native American tribe'),
        ]),
    },
}


# RAISING_FORMATTER, SPENDING_FORMATTER, CASH_FORMATTER, IE_FORMATTER
# These are used to format the display of financial summary data on committee pages
# They map key values from a response to a tuple which contains a label and a level of hierarchy
# Levels: 1 = Top-level total; 2 = sub-total, 3 = sub-sub-total; 4 = sub-sub-sub-total
# Type: used to piece together a link to line number filtered view
# The comments next to each refer to the type of report / committee that they show up on
# F3 = house and senate; F3P = presidential; F3X = pac and party

RAISING_FORMATTER = OrderedDict([
    ('receipts',  # F3, F3P, F3X
        {'label': 'Total receipts', 'level': '1', 'term': 'total receipts'}),
    ('contributions',  # F3, F3P, F3X
        {'label': 'Total contributions', 'level': '2'}),
    ('individual_contributions',  # F3, F3P, F3X
        {'label': 'Total individual contributions', 'level': '3'}),
    ('individual_itemized_contributions',  # F3, F3P, F3X
        {'label': 'Itemized individual contributions', 'level': '4', 'type': {
            'link': 'receipts', 'P': 'F3P-17A', 'H': 'F3-11AI', 'S': 'F3-11AI', 'O': 'F3X-11AI'
        }}),
    ('individual_unitemized_contributions',  # F3, F3P, F3X
        {'label': 'Unitemized individual contributions', 'level': '4'}),
    ('political_party_committee_contributions',
        {'label': 'Party committee contributions', 'level': '3', 'type': {
            'link': 'receipts',
                  'P': 'F3P-17B', 'H': 'F3-11B', 'S': 'F3-11B', 'O': 'F3X-11B'
        }}),
    ('other_political_committee_contributions',  # F3, F3P, F3X
        {'label': 'Other committee contributions', 'level': '3', 'type': {
            'link': 'receipts',
                  'P': 'F3P-17C', 'H': 'F3-11C', 'S': 'F3-11C', 'O': 'F3X-11C'
        }}),
    ('federal_funds',  # F3P
        {'label': 'Presidential public funds', 'level': '3'}),
    ('candidate_contribution',  # F3, F3P
        {'label': 'Candidate contributions', 'level': '3', 'type': {
            'link': 'receipts',
                  'P': 'F3P-17D', 'H': 'F3-11D', 'S': 'F3-11D'
        }}),
    ('transfers_from_affiliated_party',  # F3X
        {'label': 'Transfers from affiliated committees', 'level': '2',
            'type': {'link': 'receipts', 'O': 'F3X-12'}}),
    ('transfers_from_affiliated_committee',  # F3P
        {'label': 'Transfers from other authorized committees', 'level': '2',
            'type': {'link': 'receipts', 'P': 'F3P-18'}}),
    ('transfers_from_other_authorized_committee',  # F3
        {'label': 'Transfers from other authorized committees', 'level': '2',
            'type': {'link': 'receipts', 'H': 'F3-12', 'S': 'F3-12'}}),
    ('all_loans_received',  # F3X
        {'label': 'All loans received', 'level': '2', 'type': {
            'link': 'receipts', 'O': 'F3X-13'
        }}),
    ('loan_repayments_received',  # F3X
        {'label': 'Loan repayments received', 'level': '2', 'type': {
            'link': 'receipts', 'O': 'F3X-14'
        }}),
    ('loans',  # F3
        {'label': 'Total loans received', 'level': '2'}),
    ('loans_received',  # F3P
        {'label': 'Total loans received', 'level': '2'}),
    ('loans_received_from_candidate',  # F3P
        {'label': 'Loans made by candidate', 'level': '3', 'type': {
            'link': 'receipts', 'P': 'F3P-19A'
        }}),
    ('loans_made_by_candidate',  # F3
        {'label': 'Loans made by candidate', 'level': '3', 'type': {
            'link': 'receipts', 'H': 'F3-13A', 'S': 'F3-13A'
        }}),
    ('other_loans_received',  # F3P
        {'label': 'Other loans', 'level': '3', 'type': {
            'link': 'receipts', 'P': 'F3P-19B'
        }}),
    ('all_other_loans',  # F3
        {'label': 'Other loans', 'level': '3', 'type': {
            'link': 'receipts', 'H': 'F3-13B', 'S': 'F3-13B'
        }}),
    ('total_offsets_to_operating_expenditures',  # F3P
        {'label': 'Total offsets to expenditures', 'level': '2'}),
    ('subtotal_offsets_to_operating_expenditures',  # F3P
        {'label': 'Offsets to operating expenditures', 'level': '3', 'type': {
            'link': 'receipts', 'P': 'F3P-20A'
        }}),
    ('offsets_to_operating_expenditures',  # F3, F3X
        {'label': 'Offsets to operating expenditures', 'level': '2', 'type': {
            'link': 'receipts', 'H': 'F3-14', 'S': 'F3-14', 'O': 'F3X-15'
        }}),
    ('offsets_to_fundraising_expenditures',  # F3P
        {'label': 'Fundraising offsets', 'level': '3', 'type': {
            'link': 'receipts', 'P': 'F3P-20B'
        }}),
    ('offsets_to_legal_accounting',  # F3P
        {'label': 'Legal and accounting offsets', 'level': '3', 'type': {
            'link': 'receipts', 'P': 'F3P-20C'
        }}),
    ('other_receipts',  # F3, F3P
        {'label': 'Other receipts', 'level': '2', 'type': {
            'link': 'receipts', 'P': 'F3P-21', 'H': 'F3-15', 'S': 'F3-15'
        }}),
    ('fed_candidate_contribution_refunds',  # F3X
        {'label': 'Candidate refunds', 'level': '2', 'type': {
            'link': 'receipts', 'O': 'F3X-16'
        }}),
    ('other_fed_receipts',  # F3X
        {'label': 'Other Receipts', 'level': '2', 'type': {
            'link': 'receipts', 'O': 'F3X-17'
        }}),
    ('total_transfers',  # F3X
        {'label': 'Total transfers', 'level': '2'}),
    ('transfers_from_nonfed_account',  # F3X
        {'label': 'Nonfederal transfers', 'level': '3'}),
    ('transfers_from_nonfed_levin',  # F3X
        {'label': 'Levin funds', 'level': '3'}),
    ('fed_receipts',  # F3X
        {'label': 'Total federal receipts', 'level': '2'}),
])

SPENDING_FORMATTER = OrderedDict([
    ('disbursements',  # F3, F3P, F3X
        {'label': 'Total disbursements', 'level': '1',
            'term': 'total disbursements'}),
    ('operating_expenditures',  # F3, F3P
        {'label': 'Operating expenditures', 'term': 'operating expenditures',
            'level': '2', 'type': {'link': 'disbursements', 'P': 'F3P-23', 'H': 'F3-17', 'S': 'F3-17'}}),
    ('total_operating_expenditures',  # F3X - renamed app-side
        {'label': 'Operating expenditures', 'term': 'operating expenditures',
            'level': '2'}),
    ('shared_fed_operating_expenditures',  # F3X, H4
        {
            'label': 'Allocated operating expenditures - federal share',
            'level': '3',
            'type': {'link': 'allocated-federal-nonfederal-disbursements'},
        }),
    ('shared_nonfed_operating_expenditures',  # F3X, H4
        {
            'label': 'Allocated operating expenditures - nonfederal share',
            'level': '3',
            'type': {'link': 'allocated-federal-nonfederal-disbursements'},
        }),
    ('other_fed_operating_expenditures',  # F3X
        {'label': 'Other federal operating expenditures', 'level': '3',
            'type': {'link': 'disbursements', 'O': 'F3X-21B'}}),
    ('transfers_to_other_authorized_committee',  # F3, F3P
        {'label': 'Transfers to other authorized committees', 'level': '2', 'type': {
            'link': 'disbursements', 'H': 'F3-18', 'S': 'F3-18', 'P': 'F3P-24'
        }}),
    ('fundraising_disbursements',  # F3P
        {'label': 'Fundraising', 'level': '2', 'type': {
            'link': 'disbursements', 'P': 'F3P-25'
        }}),
    ('exempt_legal_accounting_disbursement',  # F3P
        {'label': 'Exempt legal and accounting', 'level': '2', 'type': {
            'link': 'disbursements', 'P': 'F3P-26'
        }}),
    ('transfers_to_affiliated_committee',  # F3X
        {'label': 'Transfers to affiliated committees', 'level': '2', 'type': {
            'link': 'disbursements', 'O': 'F3X-22'
        }}),
    ('fed_candidate_committee_contributions',  # F3X
        {'label': 'Contributions to other committees', 'level': '2', 'type': {
            'link': 'disbursements', 'O': 'F3X-23'
        }}),
    ('independent_expenditures',  # F3X
        {'label': 'Independent expenditures', 'level': '2',
            'link': 'independent-expenditures'}),
    ('coordinated_expenditures_by_party_committee',  # F3X
        {'label': 'Party coordinated expenditures', 'level': '2',
            'link': 'party-coordinated-expenditures'}),
    ('loans_made',  # F3X
        {'label': 'Loans made', 'level': '2', 'type': {
            'link': 'disbursements', 'O': 'F3X-27'
        }}),
    ('loan_repayments_made',  # F3X
        {'label': 'Loan repayments made', 'level': '2', 'type': {
            'link': 'disbursements', 'O': 'F3X-26'
        }}),
    ('total_loan_repayments_made',  # F3P, F3X
        {'label': 'Total loan repayments made', 'level': '2'}),
    ('repayments_loans_made_by_candidate',  # F3P
        {'label': 'Candidate loan repayments', 'level': '3', 'type': {
            'link': 'disbursements', 'P': 'F3P-27A'
        }}),
    ('repayments_other_loans',  # F3P
        {'label': 'Other loan repayments', 'level': '3', 'type': {
            'link': 'disbursements', 'P': 'F3P-27B'
        }}),
    ('contribution_refunds',  # F3, F3P, F3X
        {'label': 'Total contribution refunds', 'level': '2'}),
    ('refunded_individual_contributions',  # F3, F3P, F3X
        {'label': 'Individual refunds', 'level': '3', 'type': {
            'link': 'disbursements', 'P': 'F3P-28A', 'H': 'F3-20A', 'S': 'F3-20A', 'O': 'F3X-28A'
        }}),
    ('refunded_political_party_committee_contributions',  # F3, F3P, F3X
        {'label': 'Political party refunds', 'level': '3', 'type': {
            'link': 'disbursements', 'P': 'F3P-28B', 'H': 'F3-20B', 'S': 'F3-20B', 'O': 'F3X-28B'
        }}),
    ('refunded_other_political_committee_contributions',  # F3, F3P, F3X
        {'label': 'Other committee refunds', 'level': '3', 'type': {
            'link': 'disbursements', 'P': 'F3P-28C', 'H': 'F3-20C', 'S': 'F3-20C', 'O': 'F3X-28C'
        }}),
    ('loan_repayments',  # F3
        {'label': 'Total loan repayments', 'level': '2'}),
    ('loan_repayments_candidate_loans',  # F3
        {'label': 'Candidate loan repayments', 'level': '3', 'type': {
            'link': 'disbursements', 'H': 'F3-19A', 'S': 'F3-19A'
        }}),
    ('loan_repayments_other_loans',  # F3
        {'label': 'Other loan repayments', 'level': '3', 'type': {
            'link': 'disbursements', 'H': 'F3-19B', 'S': 'F3-19B'
        }}),
    ('other_disbursements',  # F3, F3P, F3X
        {'label': 'Other disbursements', 'level': '2', 'type': {
            'link': 'disbursements', 'P': 'F3P-29', 'H': 'F3-21', 'S': 'F3-21', 'O': 'F3X-29'
        }}),
    ('fed_election_activity',  # F3X
        {'label': 'Total federal election activity', 'level': '2'}),
    ('shared_fed_activity',  # F3X
        {'label': 'Allocated federal election activity - federal share',
            'level': '3'}),
    ('allocated_federal_election_levin_share',  # F3X
        {'label': 'Allocated federal election activity - Levin share',
            'level': '3'}),
    ('non_allocated_fed_election_activity',  # F3X
        {'label': 'Federal election activity - federal only', 'level': '3'}),
    ('fed_disbursements',  # F3X
        {'label': 'Total federal disbursements', 'level': '2'}),
])

HOST_RAISING_FORMATTER = OrderedDict([
    ('receipts',  # Line 20
        {'label': 'Total receipts', 'level': '1', 'term': 'total receipts'}),
    ('federal_funds',  # Line 13
        {'label': 'Federal funds', 'level': '2'}),
    ('contributions',  # Line 14
        {'label': 'Total Contributions to Defray Convention Expenses', 'level': '2'}),
    ('individual_contributions',  # Line 14a
        {'label': 'Itemized Contributions to Defray Convention Expenses', 'level': '3'}),
    ('individual_unitemized_contributions',  # Line 14b
        {'label': 'Unitemized Contributions to Defray Convention Expenses', 'level': '3'}),
    ('transfers_from_affiliated_party',  # Line 15
        {'label': 'Transfers from affiliated committees', 'level': '2'}),
    ('loans_and_loan_repayments',  # Line 16
        {'label': 'Loans and Loan Repayments Received', 'level': '2'}),
    ('all_loans_received',  # Line 16a
        {'label': 'Loans Received', 'level': '3'}),
    ('loan_repayments_received',  # Line 16b
        {'label': 'Loan Repayments Received', 'level': '3'}),
    ('refunds_relating_convention_exp',  # Line 17
        {'label': 'Refunds, Rebates, Returns of Deposits Relating to Convention Expenditures', 'level': '2'}),
    ('itemized_refunds_relating_convention_exp',  # Line 17a
        {'label': ' Itemized Refunds, Rebates, Returns of Deposits Relating to Convention', 'level': '3'}),
    ('unitemized_refunds_relating_convention_exp',  # Line 17b
        {'label': 'Unitemized Refunds, Rebates, Returns of Deposits Relating to Convention', 'level': '3'}),
    ('refunds_relating_convention_exp',  # Line 18
        {'label': 'Other Refunds, Rebates, Returns of Deposits', 'level': '2'}),
    ('itemized_refunds_relating_convention_exp',  # Line 18a
        {'label': ' Itemized Other Refunds, Rebates, Returns of Deposits', 'level': '3'}),
    ('unitemized_refunds_relating_convention_exp',  # Line 18b
        {'label': 'Unitemized Other Refunds, Rebates, Returns of Deposits', 'level': '3'}),
    ('other_fed_receipts',  # Line 19
        {'label': ' Other Income', 'level': '2'}),
    ('itemized_other_income',  # Line 19a
        {'label': 'Itemized Other Income', 'level': '3'}),
    ('unitemized_other_income',  # Line 19b
        {'label': 'Unitemized Other Income', 'level': '3'}),
])

HOST_SPENDING_FORMATTER = OrderedDict([
    ('disbursements',
        {'label': 'Total disbursements', 'level': '1',
            'term': 'total disbursements'}),
    ('convention_exp',  # Line 21
        {'label': 'Convention Expenditures',
            'level': '2'}),
    ('itemized_convention_exp',  # Line 21a
        {'label': 'Itemized Convention Expenditures',
            'level': '3'}),
    ('unitemized_convention_exp',  # Line 21a
        {'label': 'Unitemized Convention Expenditures',
            'level': '3'}),
    ('transfers_to_affiliated_committee',  # Line 22
        {'label': 'Transfers to Affiliated Committees',
            'level': '2'}),
    ('loans_and_loan_repayments_made',  # Line 23
        {'label': 'Loans and Loan Repayments Made',
            'level': '2'}),
    ('loans_made',  # Line 23a
        {'label': 'Loans Made',
            'level': '3'}),
    ('loan_repayments_made',  # Line 23a
        {'label': 'Loan Repayments Made',
            'level': '3'}),
    ('other_disbursements',  # Line 24
        {'label': 'Other Disbursements',
            'level': '2'}),
    ('itemized_other_disb',  # Line 24a
        {'label': 'Itemized Other Disbursements',
            'level': '3'}),
    ('unitemized_other_disb',  # Line 24a
        {'label': 'Unitemized Other Disbursements',
            'level': '3'}),

])

CASH_FORMATTER = OrderedDict([
    ('cash_on_hand_beginning_period',
        {'label': 'Beginning cash on hand', 'level': '2'}),  # F3, F3P, #F3X
    ('last_cash_on_hand_end_period',
        {'label': 'Ending cash on hand', 'term': 'ending cash on hand', 'level': '2'}),  # F3, F3P, #F3X
    ('last_debts_owed_to_committee',
        {'label': 'Debts/loans owed to committee', 'level': '2', 'type': {'link': 'debts_to'}}),  # F3, F3P, F3X
    ('last_debts_owed_by_committee',
        {'label': 'Debts/loans owed by committee', 'level': '2', 'type': {'link': 'debts_by'}}),  # F3, F3P, F3X
    # Commenting out net numbers because the underlying logic is incorrect
    # ('net_contributions', {'label': 'Net contributions', 'level': '2'}), #F3, F3X
    # ('contributions', {'label': 'Total contributions', 'level': '3'}), #F3, #F3P, F3X
    # ('contribution_refunds', {'label': '(Total contribution refunds)', 'level': '3'}), #F3, F3P, F3X
    # ('net_operating_expenditures', {'label': 'Net operating expenditures', 'level': '2'}), #F3, F3X
    # ('operating_expenditures', {'label': 'Operating expenditures', 'level': '3'}), #F3, F3P, F3X
    # ('offsets_to_operating_expenditures', {'label': '(Offsets to operating expenditures)', 'level': '3'}), #F3, F3P, F3X  # noqa: E501
    # ('subtotal_offsets_to_operating_expenditures', {'label': 'Offsets to operating expenditures', 'level': '3'}), #F3P
])


IE_FORMATTER = OrderedDict([
    ('total_independent_contributions', {'label': 'Contributions received', 'level': '1'}),
    ('total_independent_expenditures', {'label': 'Independent expenditures', 'level': '1'})
])

INAUGURAL_FORMATTER = OrderedDict([
    ('receipts', {'label': 'Total Donations Accepted', 'level': '1'}),
    ('contribution_refunds', {'label': 'Total Donations Refunded', 'level': '1'})
])


SENATE_CLASSES = {
    '1':
        ['AZ', 'CA', 'CT', 'DE', 'FL', 'HI', 'IN', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NJ',
            'NM', 'NY', 'ND', 'OH', 'PA', 'RI', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    '2':
        ['AL', 'AK', 'AR', 'CO', 'DE', 'GA', 'ID', 'IL', 'IA', 'KS', 'KY', 'LA', 'ME', 'MA', 'MI', 'MN', 'MS', 'MT',
            'NE', 'NH', 'NJ', 'NM', 'NC', 'OK', 'OR', 'RI', 'SC', 'SD', 'TN', 'TX', 'VA', 'WV', 'WY'],
    '3':
        ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'MD',
            'MO', 'NV', 'NH', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'SC', 'SD', 'UT', 'VT', 'WA', 'WI']
}

mur_disposition_category_ids = OrderedDict([
    ('8', 'Dismiss and Remind'),
    ('9', 'Dismissed'),
    ('11', 'Dismissed-Low Rated'),
    ('12', 'Dismissed-Other'),
    ('13', 'Dismissed-Stale'),
    ('14', 'Dismiss pursuant to prosecutorial discretion'),
    ('15', 'Dismiss pursuant to prosecutorial discretion, and caution'),
    ('16', 'Enforcement - Disposition - Dismissed "Dismiss" - Dismiss and Caution'),
    ('23', 'No PCTB'),
    ('24', 'No RTB'),
    ('30', 'PCTB Finding'),
    ('41', 'RTB Finding'),
    ('42', 'RTB/NFA'),
    ('45', 'Take no action'),
    ('46', 'Take No Further Action'),
])

suggested_mur_disposition_category_ids = OrderedDict([
    ('29', 'Probable Cause/NFA'),
    ('7', 'Conciliation: Pre Probable Cause'),
    ('6', 'Conciliation: Probable Cause'),
])

primary_subject_ids = {
    "": "All",
    "1": "Allocation",
    "2": "Committees",
    "3": "Contributions",
    "4": "Disclaimer",
    "5": "Disbursements",
    "6": "Electioneering",
    "7": "Expenditures",
    "8": "Express Advocacy",
    "9": "Foreign Nationals",
    "10": "Fraudulent Misrepresentation",
    "11": "Issue Advocacy",
    "12": "Knowing and Willful",
    "13": "Loans",
    "14": "Non-federal",
    "15": "Other",
    "16": "Personal Use",
    "17": "Presidential",
    "18": "Reporting",
    "19": "Soft Money",
    "20": "Solicitation",
}

secondary_subject_placeholder = {
   "": "All",
}

secondary_subject_ids = {
  "2": {
    "1": "Candidate",
    "2": "Multi-candidate",
    "3": "Non-Party",
    "4": "PAC",
    "5": "Party",
    "6": "Political",
    "7": "Presidential",
  },
  "3": {
    "8": "Corporations",
    "9": "Excessive",
    "10": "Exemptions",
    "11": "In the Name of Another",
    "12": "Labor Unions",
    "13": "Limitations",
    "14": "National Bank",
    "15": "Prohibited",
  },
  "7": {
    "10": "Exemptions",
    "16": "Coordinated",
    "17": "Limits",
    "18": "Prohibitions",
  }
}
