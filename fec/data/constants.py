from collections import OrderedDict

START_YEAR = 1979
END_YEAR = 2018
DEFAULT_TIME_PERIOD = 2018
DEFAULT_PRESIDENTIAL_YEAR = 2016
DISTRICT_MAP_CUTOFF = 2018 # The year we show district maps for on election pages

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

election_states = OrderedDict([
    ('AK', 'Alaska'),
    ('AL', 'Alabama'),
    ('AR', 'Arkansas'),
    ('AZ', 'Arizona'),
    ('CA', 'California'),
    ('CO', 'Colorado'),
    ('CT', 'Connecticut'),
    ('DC', 'District of Columbia'),
    ('DE', 'Delaware'),
    ('FL', 'Florida'),
    ('GA', 'Georgia'),
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
    ('RI', 'Rhode Island'),
    ('SC', 'South Carolina'),
    ('SD', 'South Dakota'),
    ('TN', 'Tennessee'),
    ('TX', 'Texas'),
    ('UT', 'Utah'),
    ('VA', 'Virginia'),
    ('VT', 'Vermont'),
    ('WA', 'Washington'),
    ('WI', 'Wisconsin'),
    ('WV', 'West Virginia'),
    ('WY', 'Wyoming'),
])

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

pac_party_types = OrderedDict([
    ('N', 'PAC - nonqualified'),
    ('Q', 'PAC - qualified'),
    ('V', 'PAC with non-contribution account - nonqualified'),
    ('W', 'PAC with non-contribution account - qualified'),
    ('P', 'Party - nonqualified'),
    ('Y', 'Party - qualified'),
    ('Z', 'National party nonfederal account'),
    ('U', 'Single candidate independent expenditure'),
    ('O', 'Super PAC (independent expenditure only'),
    ('I', 'Independent expenditor (person or group)')
])

house_senate_types = OrderedDict([
    ('H', 'House'),
    ('S', 'Senate')
])

table_columns = OrderedDict([
    ('candidates', ['Name', 'Office', 'Election years', 'Party', 'State', 'District', 'First filing date']),
    ('candidates-office-president', ['Name', 'Party', 'Receipts', 'Disbursements']),
    ('candidates-office-senate', ['Name', 'Party', 'State', 'Receipts', 'Disbursements']),
    ('candidates-office-house', ['Name', 'Party', 'State', 'District', 'Receipts', 'Disbursements']),
    ('committees', ['Name', 'Treasurer', 'Type', 'Designation', 'First filing date']),
    ('communication-costs', ['Committee', 'Support/Oppose', 'Candidate', 'Amount', 'Date']),
    ('disbursements', ['Spender', 'Recipient', 'State', 'Description', 'Disbursement date', 'Amount']),
    ('electioneering-communications', ['Spender', 'Candidate mentioned','Number of candidates', 'Amount per candidate', 'Date', 'Disbursement amount' ]),
    ('filings', ['Filer name', 'Document', 'Version', 'Receipt date', 'Beginning image number']),
    ('independent-expenditures', ['Spender', 'Support/Oppose', 'Candidate', 'Description', 'Payee', 'Expenditure date', 'Amount']),
    ('individual-contributions', ['Contributor name', 'Recipient', 'State', 'Employer', 'Receipt date', 'Amount']),
    ('loans', ['Committee Name', 'Loaner name', 'Incurred date', 'Payment to date', 'Original loan amount']),
    ('party-coordinated-expenditures', ['Spender', 'Candidate', 'Payee name', 'Expenditure date', 'Amount']),
    ('receipts', ['Contributor name', 'Recipient', 'Election', 'State', 'Receipt date', 'Amount']),
    ('reports-presidential', ['Committee', 'Report type', 'Version', 'Receipt date', 'Coverage end date', 'Total receipts', 'Total disbursements']),
    ('reports-house-senate', ['Committee', 'Report type', 'Version', 'Receipt date', 'Coverage end date', 'Total receipts', 'Total disbursements']),
    ('reports-pac-party', ['Committee', 'Report type', 'Version', 'Receipt date', 'Coverage end date', 'Total receipts', 'Total disbursements', 'Total independent expenditures']),
    ('reports-ie-only', ['Filer', 'Report type', 'Version', 'Receipt date', 'Coverage end date', 'Total contributions', 'Total independent expenditures'])
])

line_numbers = {
    'receipts': {
        'house_senate': OrderedDict([
            ('F3-11AI', 'Contributions from individuals (Line 11ai)'),
            ('F3-11B', 'Contributions from political party committees (Line 11b)'),
            ('F3-11C', 'Contributions from other political committees (Line 11c)'),
            ('F3-11D', 'Contributions from the candidate (Line 11d)'),
            ('F3-12', ' Transfers from authorized committees (Line 12)'),
            ('F3-13A', 'Loans received from the candidate (Line 13a)'),
            ('F3-13B', 'All other loans (Line 13b)'),
            ('F3-14', ' Offsets to operating expenditures (Line 14)'),
            ('F3-15', ' Other receipts (Line 15)'),
        ]),
        'presidential': OrderedDict([
            ('F3P-16', 'Federal funds (Line 16)'),
            ('F3P-17A', 'Contributions from individuals (Line 17ai)'),
            ('F3P-17B', 'Contributions from political party committees (Line 17b)'),
            ('F3P-17C', 'Contributions from other political committees (Line 17c)'),
            ('F3P-17D', 'Contributions from the candidate (Line 17d)'),
            ('F3P-18', 'Transfers from other authorized committees (Line 18)'),
            ('F3P-19A', 'Loans received from candidate (Line 19a)'),
            ('F3P-19B', 'Other loans (Line 19b)'),
            ('F3P-20A', 'Offsets to operating expenditures - operating (Line 20a)'),
            ('F3P-20B', 'Offsets to operating expenditures - fundraising (Line 20b)'),
            ('F3P-20C', 'Offsets to operating expenditures - legal and accounting (Line 20c)'),
            ('F3P-21', 'Other receipts (Line 21)'),
        ]),
        'pac_party': OrderedDict([
            ('F3X-11AI', 'Contributions from individuals (Line 11ai)'),
            ('F3X-11B', 'Contributions from political party committees (Line 11b)'),
            ('F3X-11C', 'Contributions from other political committees (Line 11c)'),
            ('F3X-12', 'Transfers from affiliated committees (Line 12)'),
            ('F3X-13', 'Loans received (Line 13)'),
            ('F3X-14', 'Loan repayments received (Line 14)'),
            ('F3X-15', 'Offets to operating expenditures (Line 15)'),
            ('F3X-16', 'Refunds of contributions made to federal candidates and other political committees (Line 16)'),
            ('F3X-17', 'Other federal receipts (Line 17)'),
        ])
    },
    'disbursements': {
        'house_senate': OrderedDict([
            ('F3-17', 'Operating expenditures (Line 17)'),
            ('F3-18', 'Transfers to other authorized committees (Line 18)'),
            ('F3-19', 'Loan repayments (Line 19)'),
            ('F3-19A', 'Loan repayments of loans made or guaranteed by the candidate (Line 19a'),
            ('F3-19B', 'Loan repayments of all other loans (Line 19b)'),
            ('F3-20A', 'Refunds of contributions to individuals (Line 20a)'),
            ('F3-20B', 'Refunds of contributions to political party committees (Line 20b)'),
            ('F3-20C', 'Refunds of contributions to other political committees (Line 20c)'),
            ('F3-21', 'Other disbursements (Line 21)'),
        ]),
        'presidential': OrderedDict([
            ('F3P-23', 'Operating expenditures (Line 23)'),
            ('F3P-24', 'Transfers to other authorized committees (Line 24)'),
            ('F3P-25', 'Fundraising disbursements (Line 25)'),
            ('F3P-26', 'Exempt legal and accounting disbursements (Line 26)'),
            ('F3P-27A', 'Repayments of loans made or guaranteed by candidate (Line 27a)'),
            ('F3P-27B', 'Other loan repayments (Line 27b)'),
            ('F3P-28A', 'Refunds of contributions to individuals (Line 28a)'),
            ('F3P-28B', 'Refunds of contributions to political party committees (Line 28b)'),
            ('F3P-28C', 'Refunds of contributions to other political committees (Line 28c)'),
            ('F3P-29', 'Other disbursements (Line 29)'),
        ]),
        'pac_party': OrderedDict([
            ('F3X-21B', 'Other federal operating expenditures (Line 21b)'),
            ('F3X-22', 'Transfers to affiliated/other party committees (Line 22)'),
            ('F3X-23', 'Contributions to federal candidates/committees and other political committees (Line 23)'),
            ('F3X-24', 'Independent expenditures (Line 24)'),
            ('F3X-26', 'Loan repayments made (Line 26)'),
            ('F3X-27', 'Loans made (Line 27)'),
            ('F3X-28A', 'Refunds of Contributions Made to Individuals/Persons Other Than Political Committees (Line 28a)'),
            ('F3X-28B', 'Refunds of contributions to political party committees (Line 28b)'),
            ('F3X-28C', 'Refunds of contributions to other political committees (Line 28c)'),
            ('F3X-28D', 'Total contributions refunds (Line 28d)'),
            ('F3X-29', 'Other disbursements (Line 29)'),
        ])
    }
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
        {'label': 'Non-federal transfers', 'level': '3'}),
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
            'level': '2', 'type': {'link': 'disbursements',
                'P': 'F3P-23', 'H': 'F3-17', 'S': 'F3-17'}}),
    ('total_operating_expenditures',  # F3X - renamed app-side
        {'label': 'Operating expenditures', 'term': 'operating expenditures',
            'level': '2'}),
    ('shared_fed_operating_expenditures',  # F3X
        {'label': 'Allocated operating expenditures - federal', 'level': '3'}),
    ('shared_nonfed_operating_expenditures',  # F3X
        {'label': 'Allocated operating expenditures - non-federal',
            'level': '3'}),
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
            'link': 'independent_expenditures'}),
    ('coordinated_expenditures_by_party_committee',  # F3X
        {'label': 'Coordinated party expenditures', 'level': '2', 'type': {
            'link': 'party_coordinated_expenditures',
        }}),
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

CASH_FORMATTER = OrderedDict([
    ('cash_on_hand_beginning_period', {'label': 'Beginning cash on hand', 'level': '2'}), #F3, F3P, #F3X
    ('last_cash_on_hand_end_period', {'label': 'Ending cash on hand', 'term': 'ending cash on hand', 'level': '2'}), #F3, F3P, #F3X
    ('last_debts_owed_to_committee', {'label': 'Debts/loans owed to committee', 'level': '2'}), #F3, F3P, F3X
    ('last_debts_owed_by_committee', {'label': 'Debts/loans owed by committee', 'level': '2'}), #F3, F3P, F3X
    # Commenting out net numbers because the underlying logic is incorrect
    # ('net_contributions', {'label': 'Net contributions', 'level': '2'}), #F3, F3X
    # ('contributions', {'label': 'Total contributions', 'level': '3'}), #F3, #F3P, F3X
    # ('contribution_refunds', {'label': '(Total contribution refunds)', 'level': '3'}), #F3, F3P, F3X
    # ('net_operating_expenditures', {'label': 'Net operating expenditures', 'level': '2'}), #F3, F3X
    # ('operating_expenditures', {'label': 'Operating expenditures', 'level': '3'}), #F3, F3P, F3X
    # ('offsets_to_operating_expenditures', {'label': '(Offsets to operating expenditures)', 'level': '3'}), #F3, F3P, F3X
    # ('subtotal_offsets_to_operating_expenditures', {'label': 'Offsets to operating expenditures', 'level': '3'}), #F3P
])

IE_FORMATTER = OrderedDict([
    ('total_independent_contributions', {'label': 'Contributions received', 'level': '1'}),
    ('total_independent_expenditures', {'label': 'Independent expenditures', 'level': '1'})
])

SENATE_CLASSES = {
    '1': ['AZ', 'CA', 'CT', 'DE', 'FL', 'HI', 'IN', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NJ', 'NM', 'NY', 'ND', 'OH', 'PA', 'RI', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    '2': ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'MD', 'MO', 'NV', 'NH', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'SC', 'SD', 'UT', 'VT', 'WA', 'WI'],
    '3': ['AL', 'AK', 'AR', 'CO', 'DE', 'GA', 'ID', 'IL', 'IA', 'KS', 'KY', 'LA', 'ME', 'MA', 'MI', 'MN', 'MS', 'MT', 'NE', 'NH', 'NJ', 'NM', 'NC', 'OK', 'OR', 'RI', 'SC', 'SD', 'TN', 'TX', 'VA', 'WV', 'WY'],
    'special': ['AL']
}

NEXT_SENATE_ELECTIONS = {
    '1': 2018,
    '2': 2022,
    '3': 2020,
    'special': 2018
}
