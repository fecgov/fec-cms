import unittest
from unittest import mock

from legal import regulation_history


class TestRegulationHistory(unittest.TestCase):
    @mock.patch.object(regulation_history, 'load_regulation_history')
    def test_format_historical_regulation_events_maps_events_and_conversions(self, load_history):
        load_history.return_value = {
            'events': [{
                'year': 1977,
                'action': 'E&J',
                'subject': 'Separate segregated funds',
                'source_url': 'https://www.fec.gov/e-and-j/',
            }],
            'conversions': [{
                'year': 1980,
                'action': 'Redesignated',
                'description': 'Previously cited at § 114.4',
                'source_url': 'https://www.fec.gov/conversions/',
            }],
        }

        events = regulation_history.format_historical_regulation_events('114.5')

        self.assertEqual(
            [event['action'] for event in events],
            ['E&J', 'Redesignated'],
        )
        self.assertEqual(events[1]['label'], 'Previously cited at § 114.4')
        self.assertEqual(events[0]['section'], '114.5')

    def test_part_114_history_has_reviewed_coverage(self):
        for section in [f'114.{number}' for number in range(1, 16)]:
            with self.subTest(section=section):
                events = regulation_history.format_historical_regulation_events(section)
                self.assertTrue(events)
                self.assertTrue(all(
                    event['action'] in ('E&J', 'Redesignated')
                    for event in events
                ))

                if section == '114.6':
                    self.assertEqual(
                        sorted({event['date'] for event in events}),
                        ['1977', '1996', '2014', '2019', '2024'],
                    )
                    self.assertGreater(len(events), 7)
                    self.assertTrue(all(event['source_url'] for event in events))

    def test_format_historical_regulation_events_preserves_distinct_subsection_records(self):
        events = regulation_history.format_historical_regulation_events('102.7')

        self.assertEqual(
            [event['source_url'] for event in events].count(
                'https://sers.fec.gov/fosers/showpdf.htm?docid=44681#page=2'
            ),
            2,
        )
        self.assertEqual(
            [event['subsection'] for event in events if event['date'] == '2002'],
            ['', '(d)'],
        )

    @mock.patch.object(regulation_history, 'load_regulation_history')
    def test_removed_and_reserved_subject_names_the_section(self, load_history):
        load_history.return_value = {
            'events': [
                {'year': 2002, 'subject': 'Removed and reserved'},
                {'year': 2003, 'subject': 'Interim; removed and reserved'},
            ],
            'conversions': [],
        }

        events = regulation_history.format_historical_regulation_events('100.23')

        self.assertEqual(
            [event['label'] for event in events],
            [
                'Interim; removed and reserved',
                'Section removed and reserved',
            ],
        )

    @mock.patch.object(regulation_history, 'load_regulation_history')
    def test_format_historical_events_groups_citations_then_years(
        self,
        load_history,
    ):
        load_history.return_value = {
            'events': [
                {'subsection': '(b)', 'year': 1980, 'subject': 'B 1980'},
                {'subsection': '(a)(10)', 'year': 2002, 'subject': 'A 10'},
                {'subsection': '', 'year': 2003, 'subject': 'Parent 2003'},
                {'subsection': '(a)', 'year': 2002, 'subject': 'A 2002'},
                {'subsection': '(b)', 'year': 1977, 'subject': 'B 1977'},
                {'subsection': '(a)(2)', 'year': 2002, 'subject': 'A 2'},
                {'subsection': '', 'year': 1975, 'subject': 'Parent 1975'},
                {'subsection': '(a)', 'year': 1977, 'subject': 'A 1977'},
            ],
            'conversions': [],
        }

        events = regulation_history.format_historical_regulation_events('104.4')
        groups = regulation_history.group_historical_regulation_events(events)

        self.assertEqual(
            [(event['subsection'], event['date']) for event in events],
            [
                ('', '2003'),
                ('', '1975'),
                ('(a)', '2002'),
                ('(a)', '1977'),
                ('(a)(2)', '2002'),
                ('(a)(10)', '2002'),
                ('(b)', '1980'),
                ('(b)', '1977'),
            ],
        )
        self.assertEqual(
            [
                (
                    group['subsection'],
                    [event['date'] for event in group['events']],
                )
                for group in groups
            ],
            [
                ('', ['2003', '1975']),
                ('(a)', ['2002', '1977']),
                ('(a)(2)', ['2002']),
                ('(a)(10)', ['2002']),
                ('(b)', ['1980', '1977']),
            ],
        )

    def test_section_104_5_links_to_predecessor_history(self):
        events = regulation_history.format_historical_regulation_events('104.5')
        redesignation = next(
            event for event in events
            if event['action'] == 'Redesignated'
            and event['subsection'] == ''
        )

        self.assertEqual(
            redesignation['previous_citations'],
            [
                {
                    'citation': '105.4',
                    'external': False,
                    'transition': None,
                    'url': '/legal/regulations/105.4/#historical-ej-105-4',
                },
                {
                    'citation': '104.4',
                    'external': False,
                    'transition': 'then',
                    'url': '/legal/regulations/104.4/#historical-ej-104-4',
                },
            ],
        )

        other_events = regulation_history.format_historical_regulation_events('104.4')
        redesignation = next(
            event for event in other_events
            if event['action'] == 'Redesignated'
            and event['subsection'] == ''
        )
        self.assertEqual(
            redesignation['previous_citations'][0]['url'],
            '/legal/regulations/109.2/#historical-ej-109-2-a',
        )

    @mock.patch.object(regulation_history, 'load_regulation_history_index')
    def test_previous_citation_links_expand_compound_citations(self, load_index):
        load_index.return_value = {
            '100.7': {
                'events': [
                    {'subsection': '(b)(6)'},
                    {'subsection': '(b)(7)'},
                ],
            },
        }

        links = regulation_history.previous_citation_links('100.7(b)(6) & (7)')

        self.assertEqual(
            [(link['citation'], link['transition']) for link in links],
            [
                ('100.7(b)(6)', None),
                ('100.7(b)(7)', 'and'),
            ],
        )
        self.assertEqual(
            links[1]['url'],
            '/legal/regulations/100.7/#historical-ej-100-7-b-7',
        )

    @mock.patch.object(regulation_history, 'load_regulation_history_index')
    def test_previous_citation_links_fall_back_to_fec_index(self, load_index):
        load_index.return_value = {}

        links = regulation_history.previous_citation_links('3.1')

        self.assertTrue(links[0]['external'])
        self.assertEqual(
            links[0]['url'],
            regulation_history.HISTORICAL_EJ_INDEX_FALLBACKS['3'],
        )

    def test_section_redesignation_does_not_apply_to_nested_history(self):
        context = regulation_history.build_regulation_history_context('100.7')
        groups = context['event_groups']
        contribution_group = next(
            group for group in groups if group['subsection'] == '(a)(1)'
        )
        section_group = next(
            group for group in groups if group['subsection'] == ''
        )

        self.assertIsNone(contribution_group['redesignation'])
        self.assertNotIn('previous_citation_preview', contribution_group)
        self.assertEqual(
            section_group['redesignation']['description'],
            'Previously cited at § 100.4',
        )

    def test_expand_current_subsection_targets_supports_lists_and_ranges(self):
        self.assertEqual(
            regulation_history.expand_current_subsection_targets('(b) & (c)'),
            ['(b)', '(c)'],
        )
        self.assertEqual(
            regulation_history.expand_current_subsection_targets('(b)(5), (6) & (7)'),
            ['(b)(5)', '(b)(6)', '(b)(7)'],
        )
        self.assertEqual(
            regulation_history.expand_current_subsection_targets(
                '(a)-(d)',
                {'(a)', '(b)', '(c)', '(d)', '(e)'},
            ),
            ['(a)', '(b)', '(c)', '(d)'],
        )

    def test_compound_redesignation_has_one_citation_row(self):
        context = regulation_history.build_regulation_history_context('102.7')
        groups = context['event_groups']
        groups_by_subsection = {
            group['subsection']: group for group in groups
        }
        for subsection in ('(b)', '(c)'):
            with self.subTest(subsection=subsection):
                self.assertIsNone(groups_by_subsection[subsection]['redesignation'])
        change_group = groups_by_subsection['(b) & (c)']
        self.assertEqual(change_group['events'], [])
        self.assertEqual(
            change_group['additional_redesignations'][0]['previous_citations'][0]['citation'],
            '102.7(d)',
        )

    def test_context_keeps_redesignations_without_matching_ej_groups(self):
        context = regulation_history.build_regulation_history_context('9428.1')

        self.assertEqual(len(context['event_groups']), 1)
        group = context['event_groups'][0]
        self.assertEqual(group['citation'], ('9428.1', ''))
        self.assertEqual(group['events'], [])
        redesignation = group['additional_redesignations'][0]
        self.assertEqual(redesignation['label'], 'Previously cited at § 8.1')
        self.assertEqual(redesignation['previous_citations'][0]['citation'], '8.1')

    def test_multiple_group_citation_changes_share_one_note(self):
        context = regulation_history.build_regulation_history_context('2.8')
        group = context['event_groups'][0]

        self.assertEqual(
            [
                citation['citation']
                for citation in group['citation_note']['previous_citations']
            ],
            ['3.5', '3.6'],
        )
        self.assertEqual(len(group['citation_note']['source_urls']), 1)
        self.assertEqual(group['citation_note']['descriptions'], [])

    def test_100_82_explains_section_level_citation_changes(self):
        context = regulation_history.build_regulation_history_context('100.82')
        section_group = next(
            group for group in context['event_groups']
            if group['subsection'] == ''
        )
        changed_event = next(
            event for event in section_group['events']
            if event['date'] == '2002'
        )

        self.assertTrue(changed_event['has_previous_citation'])
        self.assertEqual(
            [mapping['current_citation'] for mapping in changed_event['citation_change_summary']['mappings']],
            ['100.82(a)-(d)', '100.82(e)'],
        )
        self.assertTrue(
            changed_event['citation_change_summary']['links_to_subsections']
        )
        self.assertEqual(
            [mapping['anchor_id'] for mapping in changed_event['citation_change_summary']['mappings']],
            ['historical-ej-100-82-a-d', 'historical-ej-100-82-e'],
        )
        self.assertEqual(
            [
                mapping['previous_citations'][0]['citation']
                for mapping in changed_event['citation_change_summary']['mappings']
            ],
            ['100.7(b)(11)', '100.7(b)(11)(i)'],
        )
        self.assertTrue(all(
            'citation_change_summary' not in event
            for event in section_group['events']
            if event['date'] != '2002'
        ))
        subsection_group = next(
            group for group in context['event_groups']
            if group['subsection'] == '(a)-(d)'
        )
        self.assertEqual(subsection_group['events'], [])
        subsection_change = subsection_group['additional_redesignations'][0]
        self.assertEqual(
            subsection_change['previous_citations'][0]['citation'],
            '100.7(b)(11)',
        )
        self.assertEqual(
            subsection_change['previous_citations'][0]['url'],
            '/legal/regulations/100.7/#historical-ej-100-7-b-11',
        )
        self.assertTrue(all(
            not event['label'].startswith('*')
            for group in context['event_groups']
            for event in group['events']
        ))

    def test_groups_matching_subjects_and_labels_duplicate_years(self):
        context = regulation_history.build_regulation_history_context('100.82')
        groups = {
            group['subsection']: group for group in context['event_groups']
        }

        self.assertEqual(
            groups['']['subject_groups'][0]['label'],
            'Bank loans',
        )
        self.assertEqual(
            [
                event['document_label']
                for event in groups['']['subject_groups'][0]['events']
            ],
            ['2024', '2014', '2002'],
        )
        self.assertEqual(
            [
                event['document_label']
                for event in groups['(e)(1)(ii)']['subject_groups'][0]['events']
            ],
            ['2024', '2002 (document 1)', '2002 (document 2)'],
        )

        other_context = regulation_history.build_regulation_history_context(
            '100.54'
        )
        self.assertTrue(all(
            bool(group.get('subject_groups')) == bool(group.get('events'))
            for group in other_context['event_groups']
        ))

    def test_parent_without_subsection_records_links_to_conversion_row(self):
        context = regulation_history.build_regulation_history_context('100.88')
        parent_event = context['event_groups'][0]['events'][0]

        self.assertTrue(
            parent_event['citation_change_summary']['links_to_subsections']
        )
        self.assertEqual(
            parent_event['citation_change_summary']['mappings'][0]['anchor_id'],
            'historical-ej-100-88-a-b',
        )

    def test_former_citation_links_to_its_redesignated_destination(self):
        context = regulation_history.build_regulation_history_context('100.7')
        bank_loan_group = next(
            group for group in context['event_groups']
            if group['subsection'] == '(b)(11)'
        )
        marked_event = next(
            event for event in bank_loan_group['events']
            if event['date'] == '1980' and event['has_previous_citation']
        )

        self.assertFalse(bank_loan_group['show_event_citation_changes'])
        self.assertIsNone(marked_event['redesignation'])
        self.assertEqual(
            marked_event['label'],
            'Loans made in ordinary course of business',
        )
        self.assertNotIn('previous_citation_preview', marked_event)
        self.assertEqual(
            marked_event['redesignated_as'][0]['citation'],
            '100.82(a)-(d)',
        )
        self.assertEqual(
            marked_event['redesignated_as'][0]['display_citation'],
            '100.82(a)–(d)',
        )
        self.assertEqual(
            marked_event['redesignated_as'][0]['url'],
            '/legal/regulations/100.82/#historical-ej-100-82-a-d',
        )

    def test_reverse_citation_changes_do_not_roll_children_into_parent(self):
        context = regulation_history.build_regulation_history_context('100.7')
        exemptions_group = next(
            group for group in context['event_groups']
            if group['subsection'] == '(b)'
        )
        marked_event = next(
            event for event in exemptions_group['events']
            if event['date'] == '1980' and event['has_previous_citation']
        )

        self.assertEqual(
            [item['citation'] for item in marked_event['redesignated_as']],
            ['100.71(a)'],
        )

    def test_part_100_dropped_zero_conversions_belong_to_full_sections(self):
        cases = [
            ('100.8', '100.80', 'Previously cited at § 100.7(b)(9)'),
            ('100.9', '100.90', 'Previously cited at § 100.7(b)(18)'),
            ('100.14', '100.140', 'Previously cited at § 100.8(b)(10)'),
            ('100.15', '100.150', 'Previously cited at § 100.8(b)(19)'),
        ]

        for shortened, full, prior_citation in cases:
            with self.subTest(section=full):
                shortened_events = regulation_history.format_historical_regulation_events(shortened)
                full_events = regulation_history.format_historical_regulation_events(full)

                self.assertNotIn(
                    prior_citation,
                    [event['label'] for event in shortened_events],
                )
                self.assertIn(
                    prior_citation,
                    [event['label'] for event in full_events],
                )

    def test_format_historical_regulation_events_keeps_predecessor_out_of_current_cite(self):
        events = regulation_history.format_historical_regulation_events('100.16')
        limitation_events = [
            event for event in events
            if event['action'] == 'E&J'
            and event['label'].lstrip('* ') == 'Limitation on independent expenditures'
        ]

        self.assertEqual(
            [event['date'] for event in limitation_events],
            ['2003'],
        )
        self.assertTrue(all(
            event['section'] == '100.16' and event['subsection'] == '(b)'
            for event in limitation_events
        ))
        self.assertTrue(all(
            event['redesignation']['description'] == 'Previously cited at § 109.1(e)'
            for event in limitation_events
        ))
