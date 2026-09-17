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
                ('', '1975'),
                ('', '2003'),
                ('(a)', '1977'),
                ('(a)', '2002'),
                ('(a)(2)', '2002'),
                ('(a)(10)', '2002'),
                ('(b)', '1977'),
                ('(b)', '1980'),
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
                ('', ['1975', '2003']),
                ('(a)', ['1977', '2002']),
                ('(a)(2)', ['2002']),
                ('(a)(10)', ['2002']),
                ('(b)', ['1977', '1980']),
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

    def test_previous_citation_preview_is_one_level_and_preserves_anchors(self):
        previews = regulation_history.format_previous_citation_previews('100.51')

        self.assertEqual(len(previews), 2)
        self.assertEqual(previews[0]['current_subsection'], '(a)')
        self.assertEqual(previews[0]['sections'], ['100.7'])
        self.assertTrue(previews[0]['events'])
        self.assertTrue(all(
            event['subsection'] == ''
            for event in previews[0]['events']
        ))
        self.assertEqual(
            [citation['citation'] for citation in previews[0]['earlier_citations']],
            ['100.4'],
        )
        self.assertEqual(
            previews[0]['history_citations'][0]['url'],
            '/legal/regulations/100.7/#historical-ej-100-7',
        )
        self.assertEqual(previews[1]['current_subsection'], '(b)')
        self.assertEqual(
            previews[1]['history_citations'][0]['citation'],
            '100.7(c)',
        )
        self.assertEqual(
            previews[1]['history_citations'][0]['url'],
            '/legal/regulations/100.7/#historical-ej-100-7-c',
        )
        self.assertTrue(all(
            event['subsection'] == '(c)'
            for event in previews[1]['events']
        ))
        self.assertEqual(
            regulation_history.format_previous_citation_previews('102.1'),
            [],
        )

    def test_previous_citation_preview_matches_destination_history_group(self):
        preview = next(
            preview
            for preview in regulation_history.format_previous_citation_previews('100.7')
            if preview['current_subsection'] == ''
        )
        destination_events = [
            event
            for event in regulation_history.format_historical_regulation_events('100.4')
            if event.get('action') == 'E&J'
            and event.get('subsection', '') == ''
        ]

        self.assertEqual(
            [
                (event['label'], event['date'], event['source_url'])
                for event in preview['events']
            ],
            [
                (event['label'], event['date'], event['source_url'])
                for event in destination_events
            ],
        )
        self.assertEqual(
            [(event['label'], event['date']) for event in destination_events],
            [
                ('Contribution', '1975'),
                ('Contribution', '1977'),
                ('* Federal office', '1980'),
            ],
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
        self.assertEqual(context['redesignation_events'], [])

    def test_previous_citation_preview_suppresses_reciprocal_conversion(self):
        preview_107_1 = regulation_history.format_previous_citation_previews('107.1')[0]
        preview_107_2 = regulation_history.format_previous_citation_previews('107.2')[0]

        self.assertEqual(preview_107_1['earlier_citations'], [])
        self.assertEqual(preview_107_2['earlier_citations'], [])
        self.assertEqual(
            [(event['label'], event['date']) for event in preview_107_1['events']],
            [('Reports by political parties', '1977')],
        )
        self.assertEqual(
            [(event['label'], event['date']) for event in preview_107_2['events']],
            [('Reports by host committees', '1977')],
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

    def test_compound_redesignation_attaches_to_each_current_subsection(self):
        context = regulation_history.build_regulation_history_context('102.7')
        groups = context['event_groups']
        groups_by_subsection = {
            group['subsection']: group for group in groups
        }
        preview = groups_by_subsection['(b)']['previous_citation_preview']

        self.assertEqual(preview['current_subsections'], ['(b)', '(c)'])
        self.assertEqual(preview['earlier_citations'], [])
        for subsection in ('(b)', '(c)'):
            with self.subTest(subsection=subsection):
                self.assertEqual(
                    groups_by_subsection[subsection]['redesignation']['description'],
                    'Previously cited at § 102.7(d)',
                )
                self.assertEqual(
                    groups_by_subsection[subsection]
                    ['previous_citation_preview']['history_citations'][0]['citation'],
                    '102.7(d)',
                )
        self.assertEqual(context['redesignation_events'], [])

    def test_context_keeps_redesignations_without_matching_ej_groups(self):
        context = regulation_history.build_regulation_history_context('9428.1')

        self.assertEqual(context['event_groups'], [])
        self.assertEqual(len(context['redesignation_events']), 1)
        redesignation = context['redesignation_events'][0]
        self.assertEqual(redesignation['label'], 'Previously cited at § 8.1')
        self.assertEqual(
            redesignation['previous_citation_preview']['history_citations'][0]['citation'],
            '8.1',
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
