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
            change_group['citation_note']['previous_citations'][0]['citation'],
            '102.7(d)',
        )

    def test_context_keeps_redesignations_without_matching_ej_groups(self):
        context = regulation_history.build_regulation_history_context('9428.1')

        self.assertEqual(len(context['event_groups']), 1)
        group = context['event_groups'][0]
        self.assertEqual(group['citation'], ('9428.1', ''))
        self.assertEqual(group['events'], [])
        self.assertEqual(group['citation_note']['previous_citations'][0]['citation'], '8.1')

    def test_multiple_group_citation_changes_share_one_note(self):
        context = regulation_history.build_regulation_history_context('2.8')
        group = context['event_groups'][0]
        note = group['citation_note']

        self.assertEqual(
            [
                citation['citation']
                for citation in note['previous_citations']
            ],
            ['3.5', '3.6'],
        )
        self.assertEqual(len(note['source_urls']), 1)
        self.assertEqual(note['descriptions'], [])

    def test_100_82_keeps_range_conversion_at_its_citation(self):
        context = regulation_history.build_regulation_history_context('100.82')
        section_group = next(
            group for group in context['event_groups']
            if group['subsection'] == ''
        )
        changed_event = next(
            event for event in section_group['events']
            if event['date'] == '2002'
        )
        subject_group = section_group['subject_groups'][0]

        self.assertTrue(changed_event['has_previous_citation'])
        self.assertNotIn('citation_events', subject_group)
        self.assertEqual(
            [event['date'] for event in subject_group['events']],
            ['2024', '2014', '2002'],
        )
        range_group = next(
            group for group in context['event_groups']
            if group['subsection'] == '(a)-(d)'
        )
        self.assertEqual(range_group['events'], [])
        self.assertEqual(
            range_group['citation_note']['previous_citations'][0]['citation'],
            '100.7(b)(11)',
        )
        for subsection in ('(a)', '(b)', '(c)', '(d)'):
            subject_group = next(
                group for group in context['event_groups']
                if group['subsection'] == subsection
            )['subject_groups'][0]
            self.assertNotIn('citation_notes', subject_group)
        self.assertTrue(all(
            not event['label'].startswith('*')
            for group in context['event_groups']
            for event in group['events']
        ))
        basis_group = next(
            group for group in context['event_groups']
            if group['subsection'] == '(e)(2)(i)'
        )
        self.assertIn('citation_note', basis_group)
        self.assertNotIn('citation_notes', basis_group['subject_groups'][0])
        self.assertEqual(
            basis_group['citation_note']['previous_citations'][0]['citation'],
            '100.7(b)(11)(i)(B)(1)',
        )

    def test_100_132_keeps_section_and_range_conversions_separate(self):
        groups = regulation_history.build_regulation_history_context('100.132')['event_groups']
        self.assertEqual([group['subsection'] for group in groups], ['', '(a)-(b)'])

        subject = groups[0]['subject_groups'][0]
        self.assertEqual(groups[0]['citation_note']['previous_citations'][0]['citation'], '100.8(b)(2)')
        self.assertEqual(groups[1]['citation_note']['previous_citations'][0]['citation'],
                         '100.8(b)(2)(i)-(ii)')
        self.assertEqual(groups[1]['events'], [])
        self.assertNotIn('citation_events', subject)
        self.assertEqual([event['document_label'] for event in subject['events']], [
            '2024', '2006', '2002',
        ])

    def test_100_8_range_note_stays_at_its_own_citation(self):
        groups = {
            group['subsection']: group
            for group in regulation_history.build_regulation_history_context('100.8')['event_groups']
        }

        range_group = groups['(b)(4)(v)-(vii)']
        self.assertEqual(
            range_group['citation_note']['previous_citations'][0]['citation'],
            '100.7(b)(5)(v) (vii)',
        )
        for subsection, label in (
            ('(b)(4)(v)', 'Election'),
            ('(b)(4)(vi)', 'Corporation'),
            ('(b)(4)(vii)', 'Aggregate costs of communication reported'),
        ):
            subjects = groups[subsection]['subject_groups']
            marked = next(subject for subject in subjects if subject['label'] == label)
            unmarked = next(subject for subject in subjects if subject['label'] != label)
            self.assertNotIn('citation_notes', groups[subsection])
            self.assertNotIn('citation_notes', marked)
            self.assertNotIn('citation_notes', unmarked)

    def test_100_8_child_ranges_keep_their_own_citations(self):
        groups = {
            group['subsection']: group
            for group in regulation_history.build_regulation_history_context('100.8')['event_groups']
        }
        for parent, suffix, previous_prefix in (
            ('(b)(4)(iii)(A)', '(1)-(2)', '100.7(b)(5)(iii)(A)'),
            ('(b)(4)(iii)(B)', '(1)-(4)', '100.7(b)(5)(iii)(B)'),
        ):
            child = groups[f'{parent}{suffix}']
            self.assertEqual(child['events'], [])
            subjects = groups[parent]['subject_groups']
            self.assertTrue(any(regulation_history.subject_has_citation_marker(s) for s in subjects))
            self.assertEqual(
                child['citation_note']['previous_citations'][0]['citation'],
                f'{previous_prefix}{suffix}',
            )
            self.assertTrue(all('citation_events' not in subject for subject in subjects))

    def test_100_134_child_conversions_have_exact_citation_rows(self):
        groups = {
            group['subsection']: group
            for group in regulation_history.build_regulation_history_context('100.134')['event_groups']
        }
        for parent, expected_previous in (
            ('(d)(1)', [
                '100.8(b)(4)(iii)(A)(1)',
                '100.8(b)(4)(iii)(A)(2)',
            ]),
            ('(d)(2)', [
                '100.8(b)(4)(iii)(B)(1)',
                '100.8(b)(4)(iii)(B)(2)',
                '100.8(b)(4)(iii)(B)(3)',
                '100.8(b)(4)(iii)(B)(4)',
            ]),
        ):
            self.assertNotIn('citation_note', groups[parent])
            self.assertTrue(regulation_history.subject_has_citation_marker(
                groups[parent]['subject_groups'][0]
            ))
            suffixes = ('(i)', '(ii)') if parent == '(d)(1)' else ('(i)', '(ii)', '(iii)', '(iv)')
            for suffix, earlier in zip(suffixes, expected_previous):
                child = groups[f'{parent}{suffix}']
                self.assertEqual(
                    child['citation_note']['previous_citations'][0]['citation'],
                    earlier,
                )
                self.assertTrue(child['citation_note']['source_urls'])

        unmarked = groups['(d)(2)(iv)']
        self.assertEqual(unmarked['events'][0]['date'], '2014')
        self.assertIn('citation_note', unmarked)
        self.assertNotIn('citation_events', unmarked['subject_groups'][0])

    def test_100_152_keeps_parent_and_child_citations_separate(self):
        groups = {
            group['subsection']: group
            for group in regulation_history.build_regulation_history_context('100.152')['event_groups']
        }
        self.assertIn('(c)(1)', groups)
        self.assertIn('(c)(2)', groups)

        subject = groups['(c)']['subject_groups'][0]
        self.assertTrue(regulation_history.subject_has_citation_marker(subject))
        self.assertEqual(
            groups['(c)']['citation_note']['previous_citations'][0]['citation'],
            '100.8(b)(21)(iii)',
        )
        self.assertEqual(
            [groups[f'(c)({number})']['citation_note']['previous_citations'][0]['citation']
             for number in (1, 2)],
            ['100.8(b)(21)(iii)(A)', '100.8(b)(21)(iii)(B)'],
        )
        self.assertNotIn('citation_events', subject)

    def test_multiple_unmarked_subjects_do_not_inherit_citation_note(self):
        group = regulation_history.build_regulation_history_context('109.36')['event_groups'][0]

        self.assertIn('citation_note', group)
        self.assertEqual(len(group['subject_groups']), 2)
        self.assertTrue(all(
            'citation_notes' not in subject
            for subject in group['subject_groups']
        ))

    def test_citation_notes_across_index_are_independent_of_subjects(self):
        for section, history in regulation_history.load_regulation_history_index().items():
            groups = regulation_history.build_regulation_history_context(section)['event_groups']
            groups_by_subsection = {group['subsection']: group for group in groups}
            for conversion in history.get('conversions', []):
                subsection = conversion.get('current_subsection', '')
                self.assertIn('citation_note', groups_by_subsection[subsection],
                              (section, subsection))
            for group in groups:
                for subject in group.get('subject_groups', []):
                    self.assertNotIn('citation_notes', subject)
                    self.assertNotIn('citation_events', subject)

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
        parent_group = context['event_groups'][0]
        self.assertNotIn('citation_note', parent_group)
        conversion_group = next(
            group for group in context['event_groups']
            if group['subsection'] == '(a)-(b)'
        )
        self.assertEqual(
            conversion_group['anchor_id'],
            'historical-ej-100-88-a-b',
        )
        self.assertTrue(conversion_group['citation_note']['previous_citations'])

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

        self.assertIsNone(marked_event['redesignation'])
        self.assertEqual(
            marked_event['label'],
            'Loans made in ordinary course of business',
        )
        self.assertNotIn('previous_citation_preview', marked_event)
        destinations = bank_loan_group['citation_events'][0]['redesignated_as']
        self.assertEqual(
            destinations[0]['citation'],
            '100.82(a)-(d)',
        )
        self.assertEqual(
            destinations[0]['display_citation'],
            '100.82(a)–(d)',
        )
        self.assertEqual(
            destinations[0]['url'],
            '/legal/regulations/100.82/#historical-ej-100-82-a-d',
        )

    def test_reverse_citation_changes_do_not_roll_children_into_parent(self):
        context = regulation_history.build_regulation_history_context('100.7')
        exemptions_group = next(
            group for group in context['event_groups']
            if group['subsection'] == '(b)'
        )
        self.assertEqual(
            [item['citation'] for item in exemptions_group['citation_events'][0]['redesignated_as']],
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
