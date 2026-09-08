import unittest

from home.management.commands.import_regulation_history import (
    parse_citation_index,
    parse_conversion_table,
)


class TestImportRegulationHistory(unittest.TestCase):
    def test_same_pdf_does_not_collapse_distinct_subjects(self):
        events = parse_citation_index('''<table>
            <tr><td>102.7</td><td>(a)</td><td>Treasurer</td>
                <td><a href="/notice.pdf">1980</a></td></tr>
            <tr><td>102.7</td><td>(a)</td><td>Records</td>
                <td><a href="/notice.pdf">1980</a></td></tr>
            </table>''', 'https://www.fec.gov/index/')
        self.assertEqual([event['subject'] for event in events], ['Treasurer', 'Records'])

    def test_no_ej_annotation_preserves_subsection_case(self):
        conversions = parse_conversion_table('''<table>
            <tr><td>100.82</td><td>(e)(2)(i)</td>
                <td>100.7(b)(11)(i)(B)(1), No E&amp;J</td></tr>
            </table>''', 'https://www.fec.gov/conversions/')
        self.assertEqual(conversions['100.82'][0]['related_section'], '100.7(b)(11)(i)(B)(1)')

    def test_parse_citation_index_keeps_section_and_year_rows(self):
        events = parse_citation_index(
            """
            <table>
              <tr><th>Citation</th><th>Subsection</th><th>Subject</th><th>Year</th></tr>
              <tr><td>114.5</td><td>-</td><td>Separate segregated funds</td>
                  <td><a href="/legal-resources/e-and-j/">1977</a></td></tr>
              <tr><td>-</td><td>-</td><td>-</td><td>1980</td></tr>
            </table>
            """,
            'https://www.fec.gov/legal-resources/index/',
        )

        self.assertEqual([event['section'] for event in events], ['114.5', '114.5'])
        self.assertEqual([event['year'] for event in events], [1977, 1980])
        self.assertEqual(events[0]['subject'], 'Separate segregated funds')
        self.assertEqual(events[0]['subsection'], '')
        self.assertEqual(events[0]['source_url'], 'https://www.fec.gov/legal-resources/e-and-j/')
        self.assertEqual(events[1]['source_url'], 'https://www.fec.gov/legal-resources/index/')

    def test_parse_citation_index_keeps_subsection_rows(self):
        events = parse_citation_index(
            """
            <table>
              <tr><th>Citation</th><th>Subsection</th><th>Subject</th><th>Year</th></tr>
              <tr><td>102.7</td><td>-</td><td>Organization of political committees</td>
                  <td>1977</td></tr>
              <tr><td>-</td><td>(a)</td><td>Treasurer requirement</td><td>1980</td></tr>
              <tr><td>-</td><td>-</td><td>-</td><td>2002</td></tr>
            </table>
            """,
            'https://www.fec.gov/legal-resources/index/',
        )

        self.assertEqual(
            [(event['year'], event['subsection']) for event in events],
            [(1977, ''), (1980, '(a)'), (2002, '(a)')],
        )

    def test_parse_citation_index_does_not_inherit_asterisk(self):
        events = parse_citation_index(
            """
            <table>
              <tr><th>Citation</th><th>Subsection</th><th>Subject</th><th>Year</th></tr>
              <tr><td>107.2</td><td>-</td><td>* Reports by host committees</td>
                  <td>1994</td></tr>
              <tr><td>-</td><td>-</td><td>-</td><td>2003</td></tr>
            </table>
            """,
            'https://www.fec.gov/legal-resources/index/',
        )

        self.assertEqual(
            [event['subject'] for event in events],
            ['* Reports by host committees', 'Reports by host committees'],
        )

    def test_parse_conversion_table_creates_redesignation_records(self):
        conversions = parse_conversion_table(
            """
            <table>
              <tr><th>Current Regulation</th><th></th><th>Previously Cited at:</th></tr>
              <tr><td>100.2</td><td>-</td><td>100.6</td></tr>
              <tr><td>100.3</td><td>(a)(3)</td><td>100.2</td></tr>
            </table>
            """,
            'https://www.fec.gov/legal-resources/conversions/',
        )

        self.assertEqual(conversions['100.2'][0]['action'], 'Redesignated')
        self.assertEqual(conversions['100.2'][0]['current_subsection'], '')
        self.assertEqual(conversions['100.2'][0]['related_section'], '100.6')
        self.assertEqual(conversions['100.3'][0]['description'], 'Previously cited at § 100.2')

    def test_parse_conversion_table_formats_multiple_previous_citations(self):
        conversions = parse_conversion_table(
            """
            <table>
              <tr><th>Current Regulation</th><th></th><th>Previously Cited at:</th></tr>
              <tr><td>104.5</td><td>-</td><td>105.4* ; 104.4</td></tr>
            </table>
            """,
            'https://www.fec.gov/legal-resources/conversions/',
        )

        self.assertEqual(
            conversions['104.5'][0]['description'],
            'Previously cited at § 105.4, then § 104.4',
        )

    def test_parse_conversion_table_corrects_dropped_zero_sequences(self):
        conversions = parse_conversion_table(
            """
            <table>
              <tr><th>Current Regulation</th><th></th><th>Previously Cited at:</th></tr>
              <tr><td>100.79</td><td>-</td><td>100.7(b)(8)</td></tr>
              <tr><td>100.8</td><td>-</td><td>100.7(b)(9)</td></tr>
              <tr><td>100.81</td><td>-</td><td>100.7(b)(10)</td></tr>
              <tr><td>100.89</td><td>-</td><td>100.7(b)(17)</td></tr>
              <tr><td>100.9</td><td>-</td><td>100.7(b)(18)</td></tr>
              <tr><td>100.91</td><td>-</td><td>100.7(b)(20)</td></tr>
              <tr><td>100.139</td><td>-</td><td>100.8(b)(9)</td></tr>
              <tr><td>100.14</td><td>-</td><td>100.8(b)(10)</td></tr>
              <tr><td>100.141</td><td>-</td><td>100.8(b)(11)</td></tr>
              <tr><td>100.149</td><td>-</td><td>100.8(b)(18)</td></tr>
              <tr><td>100.15</td><td>-</td><td>100.8(b)(19)</td></tr>
              <tr><td>100.151</td><td>-</td><td>100.8(b)(20)</td></tr>
            </table>
            """,
            'https://www.fec.gov/legal-resources/conversion-tables-appendix-part-100/',
        )

        self.assertNotIn(
            '100.7(b)(9)',
            [item['related_section'] for item in conversions.get('100.8', [])],
        )
        self.assertEqual(
            conversions['100.80'][0]['related_section'],
            '100.7(b)(9)',
        )
        self.assertEqual(
            conversions['100.90'][0]['related_section'],
            '100.7(b)(18)',
        )
        self.assertEqual(
            conversions['100.140'][0]['related_section'],
            '100.8(b)(10)',
        )
        self.assertEqual(
            conversions['100.150'][0]['related_section'],
            '100.8(b)(19)',
        )

    def test_parse_conversion_table_preserves_valid_short_citations(self):
        conversions = parse_conversion_table(
            """
            <table>
              <tr><th>Current Regulation</th><th></th><th>Previously Cited at:</th></tr>
              <tr><td>100.13</td><td>-</td><td>100.1</td></tr>
              <tr><td>100.14</td><td>-</td><td>100.2</td></tr>
              <tr><td>100.15</td><td>-</td><td>100.3</td></tr>
            </table>
            """,
            'https://www.fec.gov/legal-resources/conversions/',
        )

        self.assertIn('100.14', conversions)
        self.assertNotIn('100.140', conversions)

    def test_parse_conversion_table_ignores_non_regulation_columns(self):
        conversions = parse_conversion_table(
            """
            <table>
              <tr><th>1980 U.S. Code Cites 2 U.S.C Section</th>
                  <th>1980 Regulations</th><th>Topic</th></tr>
              <tr><td>431(1)</td><td>100.2</td><td>Election</td></tr>
            </table>
            """,
            'https://www.fec.gov/legal-resources/conversion-index/',
        )

        self.assertEqual(conversions, {})
