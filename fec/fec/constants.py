from collections import OrderedDict

election_types = OrderedDict([
    ('election-G', 'General election'),
    ('election-P', 'Primary election'),
    ('election-SG', 'Special election'),
])

deadline_types = OrderedDict([
    ('report-12G', 'Pre-election'),
    ('report-30G', 'Post-election'),
    ('report-Q1', 'April quarterly'),
    ('report-Q2', 'July quarterly'),
    ('report-Q3', 'October quarterly'),
    ('report-M2', 'February monthly'),
    ('report-M3', 'March monthly'),
    ('report-M4', 'April monthly'),
    ('report-M5', 'May monthly'),
    ('report-M6', 'June monthly'),
    ('report-M7', 'July monthly'),
    ('report-M8', 'August monthly'),
    ('report-M9', 'September monthly'),
    ('report-M10', 'October monthly'),
    ('report-M11', 'November monthly'),
    ('report-M12', 'December monthly'),
])

outreach_types = OrderedDict([
    ('Conferences', 'Conferences'),
    ('Roundtables', 'Round tables'),
])

meeting_types = OrderedDict([
    ('Open meetings', 'Open meeting'),
    ('Executive Sessions', 'Executive session'),
])

other_types = OrderedDict([
    ('Litigation', 'Litigation'),
    ('FEA Periods', 'FEA period'),
])
