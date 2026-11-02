"""Regulation behavior at the HTML, navigation, and request boundaries."""
from collections import Counter
from urllib.parse import parse_qs, urlsplit
from unittest import mock

import pytest
import requests
from bs4 import BeautifulSoup
from django.http import Http404
from django.test import RequestFactory

from data import api_caller, ecfr_caller
from legal import regulation_text as text, regulations, views
from legal.regulation_history import build_regulation_history_context, load_regulation_history_index


@pytest.fixture
def structure():
    return {'type': 'title', 'identifier': '11', 'children': [{
        'type': 'chapter', 'identifier': 'I', 'label_description': 'Federal Election Commission',
        'children': [
            {'type': 'part', 'identifier': '1', 'label_description': 'Privacy Act'},
            {'type': 'subchapter', 'identifier': 'A', 'label_description': 'General', 'children': [{
                'type': 'part', 'identifier': '100', 'label_description': 'Definitions (52 U.S.C. 30101)',
                'descendant_range': '100.1 - 100.8', 'children': [{
                    'type': 'subpart', 'identifier': 'A', 'children': [
                        {'type': 'section', 'identifier': '100.6', 'label_description': 'Connected organization'},
                        {'type': 'section', 'identifier': '100.7-100.8',
                         'label_description': '[Reserved]', 'reserved': True},
                    ],
                }],
            }]},
        ],
    }]}


@pytest.fixture
def section_html():
    return '''
        <p>eCFR Content up to date as of 6/08/2026.</p>
        <div class="section" id="100.6">
          <h4>§ 100.6 Connected organization
            (<a href="https://www.govinfo.gov/link/uscode/52/30101">52 U.S.C. 30101(4), (5), and (6)</a>).
          </h4>
          <div id="p-100.6(a)"><p class="indent-1">(a) <em>Definition.</em>
            See <a href="/current/title-11/section-100.80#p-100.80(a)">11 CFR 100.80(a)</a>.
          </p>
            <div id="p-100.6(a)(1)"><p class="indent-2">(1) Conditions.</p></div>
          </div>
          <div id="p-100.6(c)"><p class="indent-1">(c) Other conditions.</p></div>
          <p class="source-note">[41 FR 43064, Sept. 29, 1976, as amended at
            79 FR 77843, Dec. 29, 2014].</p>
        </div>
    '''


def test_reader_preserves_text_hierarchy_and_links(section_html):
    section = text.format_ecfr_html_section(section_html, '100.6')
    body = BeautifulSoup(''.join(section['body']), 'html.parser')
    assert section['issue_date'] == '2026-06-08'
    assert body.find('em').text == 'Definition.'
    assert [(p['id'], p['class'][-1]) for p in body.find_all('p')] == [
        ('p-100.6(a)', 'legal-regulation__paragraph--level-1'),
        ('p-100.6(a)(1)', 'legal-regulation__paragraph--level-2'),
        ('p-100.6(c)', 'legal-regulation__paragraph--level-1'),
    ]
    assert body.find('a')['href'] == '/legal/regulations/100.80/#p-100.80(a)'
    assert '41 FR 43064' not in body.get_text(' ', strip=True)
    assert '<a ' not in section['heading']
    assert len(section['statutory_citations']) == 3


def test_reader_keeps_substantive_federal_register_references():
    markup = '''
        <div id="1.1">
          <h4>§ 1.1 Example.</h4>
          <p>This rule was published at 41 FR 43064.</p>
        </div>
    '''
    section = text.format_ecfr_html_section(markup, '1.1')
    assert '41 FR 43064' in ''.join(section['body'])


@pytest.mark.parametrize(('citation', 'sections'), [
    ('52 U.S.C. 30104(b), (d), and (g)', ['30104(b)', '30104(d)', '30104(g)']),
    ('52 U.S.C. 30102(g), 30104(g)', ['30102(g)', '30104(g)']),
    ('52 U.S.C. 30109(a)(4)(C) and 30111(a)(4)', ['30109(a)(4)(C)', '30111(a)(4)']),
    ('52 U.S.C. 30102(g), 30104(b), (d)(1)', ['30102(g)', '30104(b)', '30104(d)(1)']),
    ('5 U.S.C. 552a', ['552a']),
])
@pytest.mark.parametrize('location', ['h4', 'p'])
def test_statutes_expand_and_link_each_section(citation, sections, location):
    title = citation.split()[0]
    first = sections[0].split('(')[0]
    markup = f'<{location}><a href="https://www.govinfo.gov/link/uscode/{title}/{first}">{citation}</a></{location}>'
    element = BeautifulSoup(markup, 'html.parser')
    assert text.extract_statutory_citations([element]) == [
        {'label': f'{title} U.S.C. {section}',
         'url': f"https://www.govinfo.gov/link/uscode/{title}/{section.split('(')[0]}"}
        for section in sections
    ]


def test_statutes_keep_distinct_titles_and_do_not_consume_cfr_citations():
    element = BeautifulSoup('''
        <p><a href="https://www.govinfo.gov/link/uscode/5/552">5 U.S.C. 552</a> and
        <a href="https://www.govinfo.gov/link/uscode/52/30104">52 U.S.C. 30104</a>
        and 11 CFR 104.4.</p>''', 'html.parser')
    assert [item['label'] for item in text.extract_statutory_citations([element])] == [
        '5 U.S.C. 552', '52 U.S.C. 30104',
    ]


def test_statute_pdf_url_rewrites_section_without_corrupting_suffix():
    url = ('https://www.govinfo.gov/content/pkg/USCODE-2024-title5/pdf/'
           'USCODE-2024-title5-partI-chap5-subchapII-sec552a.pdf')
    element = BeautifulSoup(f'<p><a href="{url}">5 U.S.C. 552a and 552</a></p>', 'html.parser')
    assert [item['url'] for item in text.extract_statutory_citations([element])] == [
        url, url.replace('sec552a.pdf', 'sec552.pdf'),
    ]


@pytest.mark.parametrize('href', ['javascript:alert(1)', 'data:text/html,bad', '//evil.test', '/\\evil.test'])
def test_unsafe_statute_and_body_links_are_unlinked(href):
    markup = f'<div id="1.1"><h4>§ 1.1 Definitions.</h4><p><a href="{href}">5 U.S.C. 552</a></p></div>'
    section = text.format_ecfr_html_section(markup, '1.1')
    assert section['statutory_citations'] == [{'label': '5 U.S.C. 552', 'url': None}]
    assert '<a ' not in ''.join(section['body'])


@pytest.mark.parametrize(('href', 'expected'), [
    ('/current/title-11/part-109/', '/legal/regulations/part/109/'),
    ('/current/title-11/part-109/subpart-C/', '/legal/regulations/part/109/subpart/C/'),
    ('https://ecfr.gov/current/title-11/chapter-I/subchapter-A/', '/legal/regulations/subchapter/A/'),
    ('https://www.ecfr.gov/current/title-11/section-2.7#p-2.7(a)', '/legal/regulations/2.7/#p-2.7(a)'),
    ('/current/title-31/part-900/', 'https://ecfr.gov/current/title-31/part-900/'),
    ('https://example.test/current/title-11/section-2.7', 'https://example.test/current/title-11/section-2.7'),
])
def test_regulation_link_destinations(href, expected):
    assert text.regulation_link(href) == expected


def test_reader_drops_non_content_markup():
    element = BeautifulSoup(
        '<p>Text<script>alert(1)</script><!-- hidden --><strong>important</strong></p>', 'html.parser',
    )
    assert text.ecfr_html_inner_html(element.p) == 'Text<strong>important</strong>'


def test_timeline_uses_only_substantive_versions():
    timeline = text.format_ecfr_timeline({'content_versions': [
        {'issue_date': '2016-12-23', 'substantive': True},
        {'issue_date': '2018-01-01', 'substantive': True},
        {'issue_date': '2020-01-01', 'substantive': False},
        {'issue_date': '2024-01-01', 'substantive': True},
    ]}, {}, '114.5')
    assert [item['action'] for item in timeline] == ['Current version', 'Amended', 'Earliest available version']
    assert timeline[0]['compare_url'] is None
    assert '/compare/current/to/2018-01-01/' in timeline[1]['compare_url']
    assert timeline[2]['compare_url'] is None
    assert '/on/2016-12-23/' in timeline[2]['historical_url']
    only = text.format_ecfr_timeline({'content_versions': [
        {'issue_date': '2016-12-23', 'substantive': True},
    ]}, {}, '113.2')
    assert only[0]['action'] == 'Current version'
    assert only[0]['historical_url'] is None


def test_hierarchy_reserved_ranges_and_navigation(structure):
    rows = regulations.format_ecfr_regulation_parts(structure)
    assert [row['type'] for row in rows] == ['part', 'subchapter', 'part', 'subpart']
    part = regulations.find_ecfr_hierarchy_node(structure, 'part', '100')
    items = regulations.format_ecfr_hierarchy_contents(part)
    assert [item['identifier'] for item in items] == ['A', '100.6', '100.7', '100.8']
    assert all(item['reserved'] for item in items[-2:])
    nav = regulations.format_ecfr_section_nav(structure, '100.7')
    assert nav['previous']['no'] == '100.6'
    assert nav['next']['no'] == '100.8'
    assert nav['part']['description'] == 'Definitions'
    assert regulations.find_reserved_ecfr_section(structure, '100.8') == '[Reserved]'


def test_back_link_rejects_unknown_return_context():
    request = RequestFactory().get('/', {'return_to': 'https://evil.test', 'search': 'loans'})
    assert regulations.regulation_return_url(request) == '/legal/search/regulations/'


def test_named_return_context_avoids_nested_url():
    request = RequestFactory().get('/', {'search': 'loans', 'page': 2})
    context = regulations.regulation_return_context(request, from_search=True)
    url = regulations.append_return_context(
        '/legal/regulations/100.6/',
        context,
    )
    assert url == (
        '/legal/regulations/100.6/'
        '?return_to=regulations-search&search=loans&page=2'
    )
    assert 'return_url' not in url


def test_return_context_precedes_paragraph_anchor():
    context = {'return_to': 'regulations-search', 'mur_number': '7382'}
    url = regulations.append_return_context(
        '/legal/regulations/110.20/#p-110.20(i)',
        context,
    )
    assert url == (
        '/legal/regulations/110.20/'
        '?return_to=regulations-search&mur_number=7382#p-110.20(i)'
    )


def test_named_back_link_preserves_query_and_adds_results_anchor():
    request = RequestFactory().get('/', {
        'return_to': 'regulations-search', 'search': 'loans', 'page': 2,
    })
    assert regulations.regulation_return_url(request) == (
        '/legal/search/regulations/?search=loans&page=2#results-regulations'
    )


def test_rulemaking_list_needs_no_document_and_sorts_numbers():
    result = regulations.format_fec_regulation_history({'rulemakings': [
        {'rm_no': '2024-04', 'rm_name': 'First'},
        {'rm_no': '2024-10', 'rm_name': 'Second', 'key_documents': []},
        {'rm_no': '2024-04', 'rm_name': 'Duplicate'}, {'rm_no': 'invalid'},
    ]}, '11 CFR 104.4')
    assert [item['rm_no'] for item in result['explanations']] == ['2024-10', '2024-04']
    assert parse_qs(urlsplit(result['explanations'][0]['url']).query) == {
        'rm_no': ['2024-10'], 'q': ['11 CFR 104.4'],
    }


@pytest.fixture
def ecfr(structure, section_html):
    with (
        mock.patch.object(ecfr_caller, 'fetch_ecfr_section_html', return_value={'text': section_html}) as reader,
        mock.patch.object(ecfr_caller, 'fetch_ecfr_structure', return_value=structure),
        mock.patch.object(ecfr_caller, 'fetch_ecfr_versions', return_value={'content_versions': []}),
        mock.patch.object(ecfr_caller, 'fetch_ecfr_ancestry', return_value={}),
    ):
        yield reader


def test_section_renders_before_related_api_requests(ecfr):
    with mock.patch.object(api_caller, 'load_legal_search_results') as legal_api, \
            mock.patch.object(api_caller, 'load_legal_rulemakings_for_regulation') as rulemaking_api:
        response = regulations.regulation_page(RequestFactory().get('/'), '100.6')
    assert response.status_code == 200
    assert b'Connected organization' in response.content
    for category in ('rulemakings', 'advisory-opinions', 'murs'):
        assert f'/legal/regulations/100.6/related/{category}/'.encode() in response.content
    assert b'52 U.S.C. 30101(6)' in response.content
    assert b'eCFR issue date' not in response.content
    soup = BeautifulSoup(response.content, 'html.parser')
    assert soup.select_one('[data-regulation-history]') is not None
    assert len(soup.select('[data-regulation-related-url] > a[href]')) == 3
    assert 'Regulation text history' in soup.get_text(' ', strip=True)
    parent_history = soup.select_one('#historical-ej-100-6')
    election_history = next(
        item for item in parent_history.select('.legal-history-preview__subject')
        if item.select_one('h4').get_text(strip=True) == 'Election'
    )
    assert [link.get_text(strip=True) for link in election_history.select('a')] == [
        '1977 E&J (PDF)', '1975 E&J (PDF)',
    ]
    previous_citation = soup.select_one('#historical-ej-100-6-a .legal-history-preview__citation-note')
    assert 'Previously § 100.15' in previous_citation.get_text(' ', strip=True)
    assert previous_citation.select_one(
        'a[href="/legal/regulations/100.15/#historical-ej-100-15"]'
    ).get_text(' ', strip=True) == '§ 100.15'
    assert previous_citation.select_one('a[href$=".pdf#page=7"]') is None
    legal_api.assert_not_called()
    rulemaking_api.assert_not_called()


def test_history_citations_jump_to_existing_regulation_text(ecfr):
    response = regulations.regulation_page(RequestFactory().get('/'), '100.6')
    soup = BeautifulSoup(response.content, 'html.parser')
    parent = soup.select_one('#historical-ej-100-6 .legal-history-preview__heading a')
    paragraph = soup.select_one('#historical-ej-100-6-a .legal-history-preview__heading a')
    assert parent['href'] == '#regulation-100.6'
    assert paragraph['href'] == '#p-100.6(a)'
    assert paragraph.get_text(strip=True) == '100.6(a)'
    for link in (parent, paragraph):
        target = soup.find(id=link['href'][1:])
        assert target is not None
        assert target['tabindex'] == '-1'


def test_history_does_not_link_missing_or_reserved_text(ecfr):
    # The fixture has (a) and (c), but no (b), even though (b) has historical E&Js.
    response = regulations.regulation_page(RequestFactory().get('/'), '100.6')
    soup = BeautifulSoup(response.content, 'html.parser')
    heading = soup.select_one('#historical-ej-100-6-b .legal-history-preview__heading')
    assert heading is not None
    assert heading.find('a') is None
    ecfr.return_value = {'error': True, 'status_code': 404}
    response = regulations.regulation_page(RequestFactory().get('/'), '100.7')
    soup = BeautifulSoup(response.content, 'html.parser')
    assert soup.select('.legal-history-preview__heading')
    assert not soup.select('.legal-history-preview__heading a')


@pytest.mark.parametrize(('section', 'suffix', 'earlier'), [
    ('100.82', '-a-d', '§ 100.7(b)(11)'),
    ('100.8', '-b-4-v-vii', '§ 100.7(b)(5)(v) (vii)'),
    ('100.8', '-b-4-iii-a-1-2', '§ 100.7(b)(5)(iii)(A)(1)-(2)'),
    ('100.8', '-b-4-iii-b-1-4', '§ 100.7(b)(5)(iii)(B)(1)-(4)'),
    ('100.134', '-d-1-i', '§ 100.8(b)(4)(iii)(A)(1)'),
    ('100.134', '-d-1-ii', '§ 100.8(b)(4)(iii)(A)(2)'),
    ('100.134', '-d-2-i', '§ 100.8(b)(4)(iii)(B)(1)'),
    ('100.134', '-d-2-ii', '§ 100.8(b)(4)(iii)(B)(2)'),
    ('100.134', '-d-2-iii', '§ 100.8(b)(4)(iii)(B)(3)'),
    ('100.134', '-d-2-iv', '§ 100.8(b)(4)(iii)(B)(4)'),
    ('100.152', '-c', '§ 100.8(b)(21)(iii)'),
    ('100.152', '-c-1', '§ 100.8(b)(21)(iii)(A)'),
    ('100.152', '-c-2', '§ 100.8(b)(21)(iii)(B)'),
    ('100.132', '', '§ 100.8(b)(2)'),
    ('100.132', '-a-b', '§ 100.8(b)(2)(i)-(ii)'),
])
def test_citation_changes_stay_with_their_exact_citation(ecfr, section_html, section, suffix, earlier):
    ecfr.return_value = {'text': section_html.replace('100.6', section)}
    response = regulations.regulation_page(RequestFactory().get('/'), section)
    soup = BeautifulSoup(response.content, 'html.parser')
    record = soup.find(id=f'historical-ej-{section.replace(".", "-")}{suffix}')
    note = record.select_one(':scope > .legal-history-preview__citation-note')
    assert earlier in note.get_text(' ', strip=True)
    assert record.select_one('h3') is not None
    assert not record.select('details .legal-history-preview__citation-note')
    assert note.select_one('a[href*="conversion-tables"]') is not None


def test_citation_change_precedes_subject_documents(ecfr, section_html):
    ecfr.return_value = {'text': section_html.replace('100.6', '100.8')}
    response = regulations.regulation_page(RequestFactory().get('/'), '100.8')
    record = BeautifulSoup(response.content, 'html.parser').find(id='historical-ej-100-8-b-24')
    children = [child for child in record.children if child.name]
    assert children[0].get_text(' ', strip=True) == '100.8(b)(24) - Brokerage loans and lines of credit'
    assert 'Later citation' in children[1].get_text(' ', strip=True)
    assert 'legal-history-preview__subject' in children[2]['class']
    assert children[2].find('a').get_text(strip=True) == '2002 E&J (PDF)'


def test_unstarred_citation_change_links_to_earlier_history(ecfr, section_html):
    ecfr.return_value = {'text': section_html.replace('100.6', '100.89')}
    response = regulations.regulation_page(RequestFactory().get('/'), '100.89')
    record = BeautifulSoup(response.content, 'html.parser').find(id='historical-ej-100-89-f')
    note = record.select_one('.legal-history-preview__citation-note')
    assert 'Previously' in note.get_text()
    assert note.select_one(
        'a[href="/legal/regulations/100.7/#historical-ej-100-7-b-17"]'
    ).get_text(' ', strip=True) == '§ 100.7(b)(17)(vi)'
    assert note.select_one('a[href*="notice1980-8-030780.pdf"]') is None
    assert record.select_one(
        '.legal-history-preview__subject a[href="https://sers.fec.gov/fosers/showpdf.htm?docid=44678"]'
    ).get_text(strip=True) == '2002 E&J (PDF)'
    assert record.find('h3').get_text(strip=True) == '100.89(f) - Reporting of payments'


def test_unavailable_earlier_ej_is_not_linked(ecfr, section_html):
    ecfr.return_value = {'text': section_html.replace('100.6', '2.5')}
    response = regulations.regulation_page(RequestFactory().get('/'), '2.5')
    citation = BeautifulSoup(response.content, 'html.parser').select_one(
        '#historical-ej-2-5-a .legal-history-preview__citation-note'
    )
    assert 'Previously § 3.2(b)(2)' in citation.get_text(' ', strip=True)
    assert 'No E&J is available for the earlier citations shown without links.' in citation.get_text(' ', strip=True)
    assert citation.select_one('a[href*="citation-index-parts-1-8"]') is None
    assert citation.select_one('a[href*="conversion-tables-appendix-parts-1-8"]') is not None


def test_earlier_citation_never_guesses_a_pdf(ecfr, section_html):
    for section, earlier_section in [('100.4', '100.8'), ('100.7', '100.4')]:
        ecfr.return_value = {'text': section_html.replace('100.6', section)}
        response = regulations.regulation_page(RequestFactory().get('/'), section)
        soup = BeautifulSoup(response.content, 'html.parser')
        earlier_citation = soup.select_one(
            f'#historical-ej-{section.replace(".", "-")} '
            '.legal-regulation__previous-citation, '
            f'#historical-ej-{section.replace(".", "-")} '
            '.legal-regulation__citation-history-box, '
            f'#historical-ej-{section.replace(".", "-")} '
            '.legal-history-preview__citation-note'
        )

        assert earlier_citation.select_one(
            f'a[href="/legal/regulations/{earlier_section}/'
            f'#historical-ej-{earlier_section.replace(".", "-")}"]'
        ).get_text(' ', strip=True) == f'§ {earlier_section}'
        assert earlier_citation.select_one('a[href$=".pdf"]') is None
        assert 'View the full history' not in earlier_citation.get_text(' ', strip=True)


def test_multiple_conversions_with_ej_share_one_citation_note(ecfr, section_html):
    ecfr.return_value = {'text': section_html.replace('100.6', '2.8')}
    response = regulations.regulation_page(RequestFactory().get('/'), '2.8')
    history = BeautifulSoup(response.content, 'html.parser').find(id='historical-ej-2-8')
    notes = history.select('.legal-history-preview__citation-note')
    assert len(notes) == 1
    assert history.select_one('a[href*="notice1985-11-100185.pdf"]') is not None
    assert '§ 3.5' in notes[0].get_text(' ', strip=True)
    assert '§ 3.6' in notes[0].get_text(' ', strip=True)
    assert 'No E&J is available for the earlier citations shown without links.' in notes[0].get_text(' ', strip=True)
    assert len(notes[0].select('a[href*="conversion-tables-appendix-parts-1-8"]')) == 1


def test_former_100_7_citation_links_to_100_82_redesignation(ecfr):
    response = regulations.regulation_page(RequestFactory().get('/'), '100.7')
    soup = BeautifulSoup(response.content, 'html.parser')
    record = soup.select_one('#historical-ej-100-7-b-11')
    event = record.select_one('.legal-history-preview__subject')
    note = record.select_one('.legal-history-preview__citation-note')

    assert '* Loans made in ordinary course of business' not in event.get_text(
        ' ', strip=True
    )
    assert event.select_one(
        'a[href="https://www.fec.gov/resources/cms-content/documents/notice1980-8-030780.pdf#page=2"]'
    ).get_text(' ', strip=True) == '1980 E&J (PDF)'
    assert record.select_one(
        '.legal-history-preview__heading'
    ).get_text(' ', strip=True) == '100.7(b)(11) - Loans made in ordinary course of business'
    assert note.select_one(
        'a[href="/legal/regulations/100.82/#historical-ej-100-82-a-d"]'
    ).get_text(' ', strip=True) == '§ 100.82(a)–(d)'
    assert 'Later citation:' in note.get_text(' ', strip=True)
    assert event.select_one('.legal-history-preview__citation-note') is None
    assert note.select_one(
        'a[href*="explanations-and-justifications-conversion-tables-appendix-part-100"]'
    ).get_text(' ', strip=True) == 'Conversion table'


def test_former_citation_does_not_include_child_redesignations(ecfr):
    response = regulations.regulation_page(RequestFactory().get('/'), '100.7')
    soup = BeautifulSoup(response.content, 'html.parser')
    note = soup.select_one(
        '#historical-ej-100-7-b .legal-history-preview__citation-note'
    )

    assert note.select_one(
        'a[href="/legal/regulations/100.71/#historical-ej-100-71-a"]'
    ).get_text(' ', strip=True) == '§ 100.71(a)'
    assert '§ 100.77' not in note.get_text(' ', strip=True)
    assert '§ 100.8(b)(5), (6) & (7)' not in note.get_text(' ', strip=True)
    assert 'Redesignated in part as:' not in note.get_text(' ', strip=True)


# The index also contains part-wide records for 111 and 113, which have no section reader route.
@pytest.mark.parametrize('section', [section for section in sorted(load_regulation_history_index()) if '.' in section])
def test_history_preserves_every_document_and_citation_anchor(ecfr, section_html, section):
    ecfr.return_value = {'text': section_html.replace('100.6', section)}
    response = regulations.regulation_page(RequestFactory().get('/'), section)
    soup = BeautifulSoup(response.content, 'html.parser')
    preview = soup.select_one('[data-regulation-history]')
    groups = build_regulation_history_context(section)['event_groups']
    assert [record['id'] for record in preview.select('.legal-history-preview__record')] == [
        group['anchor_id'] for group in groups
    ]
    for group in groups:
        record = preview.find(id=group['anchor_id'])
        assert Counter(link['href'] for link in record.select(
            '.legal-history-preview__documents a, .legal-history-preview__status a'
        )) == Counter(
            event['source_url'] for subject in group.get('subject_groups', [])
            for event in subject['events'] if event.get('source_url')
        )
        if any(subject['label'] == 'Section removed and reserved' for subject in group.get('subject_groups', [])):
            visible_documents = [
                link for link in record.select('.legal-history-preview__documents a')
                if not link.find_parent('details')
            ]
            assert visible_documents
            assert all('Section removed and reserved' in link.parent.get_text() for link in visible_documents)
            for subject in record.select('.legal-history-preview__subject'):
                assert not subject.select(':scope > ul > li:not(.legal-history-preview__status)')
                assert subject.select_one('details') is not None
        # Citation context is always visible, never inside a collapsed document list.
        assert record.select_one('details .legal-history-preview__citation-note') is None
        source_urls = set(group.get('citation_note', {}).get('source_urls', []))
        source_urls.update(
            citation['source_url'] for event in group.get('citation_events', [])
            for citation in event['redesignated_as'] if citation.get('source_url')
        )
        conversion_links = [
            link for link in record.select('.legal-history-preview__citation-note a')
            if link.get_text(strip=True) == 'Conversion table'
        ]
        assert Counter(link['href'] for link in conversion_links) == Counter(source_urls)
        if group.get('citation_events') and group.get('citation_note'):
            later_note = record.select('.legal-history-preview__citation-note')[-1]
            for url in source_urls.intersection(
                citation['source_url'] for event in group['citation_events']
                for citation in event['redesignated_as']
            ):
                assert later_note.find('a', href=url) is not None
    if section == '100.111':
        assert not preview.select('details')
        assert not preview.select('.legal-history-preview__sources a')
    elif section == '100.7':
        contribution = next(subject for subject in preview.select(
            '#historical-ej-100-7 .legal-history-preview__subject'
        ) if subject.select_one('h4').get_text(strip=True) == 'Contribution')
        # Both 1996 records remain available inside the subject's accordion.
        latest = [link for link in contribution.select('details a') if '1996' in link.get_text()]
        assert len(latest) == 2
        assert contribution.select_one('details') is not None
        # The unenhanced page keeps all records open for readers without JavaScript.
        assert all(detail.has_attr('open') for detail in preview.select('details'))


@pytest.mark.parametrize(('section', 'anchor', 'subject_label', 'visible_years', 'collapsed_years'), [
    ('100.6', 'historical-ej-100-6', 'Election', ['1977'], ['1975']),
    ('100.7', 'historical-ej-100-7', 'Expenditure', [], ['1977', '1975']),
    ('100.7', 'historical-ej-100-7-b-11-i', None, [], ['1992', '1992']),
    ('100.7', 'historical-ej-100-7-a-1-i-a', None, [], ['1980']),
    ('100.7', 'historical-ej-100-7-b-22', None, [], ['2002']),
    ('100.23', 'historical-ej-100-23', None, [], ['2001']),
    ('100.111', 'historical-ej-100-111', None, ['2002'], []),
])
def test_history_collapses_older_years_even_with_two_documents(
    ecfr, section_html, section, anchor, subject_label, visible_years, collapsed_years
):
    ecfr.return_value = {'text': section_html.replace('100.6', section)}
    response = regulations.regulation_page(RequestFactory().get('/'), section)
    record = BeautifulSoup(response.content, 'html.parser').find(id=anchor)
    subjects = record.select('.legal-history-preview__subject')
    subject = next(
        item for item in subjects
        if not subject_label or item.find('h4').get_text(strip=True) == subject_label
    )
    visible = subject.select(':scope > ul > li:not(.legal-history-preview__status) a')
    collapsed = subject.select('details ul a')
    assert [link.get_text(strip=True)[:4] for link in visible] == visible_years
    assert [link.get_text(strip=True)[:4] for link in collapsed] == collapsed_years
    assert bool(subject.find('details')) == bool(collapsed_years)


@pytest.mark.parametrize(('section', 'anchor', 'statuses', 'collapsed_statuses'), [
    ('100.7', 'historical-ej-100-7-a-1', [('Section removed and reserved', '2002')], []),
    ('100.7', 'historical-ej-100-7-b-19', [('Section removed and reserved', '1992')], [('Removed', '2002')]),
    ('100.19', 'historical-ej-100-19-g', [('Deleted', '2009')], []),
])
def test_history_removal_status_stays_with_single_subject(
    ecfr, section_html, section, anchor, statuses, collapsed_statuses
):
    ecfr.return_value = {'text': section_html.replace('100.6', section)}
    response = regulations.regulation_page(RequestFactory().get('/'), section)
    record = BeautifulSoup(response.content, 'html.parser').find(id=anchor)
    subject = record.select_one('.legal-history-preview__subject')
    assert len(record.select('.legal-history-preview__subject')) == 1
    notes = subject.select(':scope > ul > .legal-history-preview__status')
    assert len(notes) == len(statuses)
    for note, (label, year) in zip(notes, statuses):
        assert note.get_text(' ', strip=True) == f'{year} E&J (PDF) | {label}'
        assert note.find('a')['href'].startswith('https://')
        assert note.name == 'li'
        assert 'legal-history-preview__documents--timeline' in note.parent['class']
    assert [note.get_text(' ', strip=True) for note in subject.select('details .legal-history-preview__status')] == [
        f'{year} E&J (PDF) | {label}' for label, year in collapsed_statuses
    ]
    timeline = subject.select_one('.legal-history-preview__documents--timeline')
    assert timeline.find(recursive=False) == notes[0]
    if statuses[0][0] == 'Section removed and reserved':
        assert notes[-1].find_next_sibling('li') is None
        assert subject.select_one('details') is not None
    else:
        assert notes[-1].find_next_sibling('li') is not None


@pytest.mark.parametrize('anchor', ['historical-ej-100-7', 'historical-ej-100-7-b-18'])
def test_history_removal_status_does_not_guess_between_multiple_subjects(ecfr, anchor):
    response = regulations.regulation_page(RequestFactory().get('/'), '100.7')
    record = BeautifulSoup(response.content, 'html.parser').find(id=anchor)
    assert len(record.select('.legal-history-preview__subject')) == 2
    status = record.select_one(':scope > .legal-history-preview__citation-status .legal-history-preview__status')
    assert status.get_text(' ', strip=True) == '2002 E&J (PDF) | Section removed and reserved'
    assert not record.select('.legal-history-preview__subject .legal-history-preview__status')
    for subject in record.select('.legal-history-preview__subject'):
        assert not subject.select(':scope > ul')
        assert len(subject.select('details')) == 1


@pytest.mark.parametrize(('status', 'expected'), [(404, 200), (503, 502)])
def test_reserved_404_and_upstream_failure_are_distinct(ecfr, status, expected):
    ecfr.return_value = {'error': True, 'status_code': status, 'error_message': 'eCFR unavailable'}
    response = regulations.regulation_page(RequestFactory().get('/'), '100.7')
    assert response.status_code == expected
    if status == 404:
        assert b'[Reserved]' in response.content
        assert b'Previous section' in response.content
        assert b'Next section' in response.content
    else:
        assert b'eCFR unavailable' in response.content


def test_unknown_regulation_is_404(ecfr):
    ecfr.return_value = {'error': True, 'status_code': 404}
    with pytest.raises(Http404):
        regulations.regulation_page(RequestFactory().get('/'), '9999.999')


def test_browse_shows_regulation_parts(ecfr):
    response = views.legal_doc_search_regulations(RequestFactory().get(
        '/legal/search/regulations/',
    ))
    assert response.status_code == 200
    assert b'Definitions' in response.content
    assert b'Privacy Act' in response.content
    assert b'class="tag__item"' not in response.content


def test_hierarchy_back_link(ecfr):
    request = RequestFactory().get('/', {'return_to': 'regulations-search', 'page': 2})
    response = regulations.regulation_hierarchy_page(request, 'part', '100')
    assert b'/legal/search/regulations/?page=2' in response.content
    assert b'/legal/regulations/100.7/?return_to=regulations-search&amp;page=2' in response.content


def test_pagination_retains_search():
    request = RequestFactory().get('/', {
        'search': 'loans', 'show_results': 'true',
    })
    url = regulations.regulation_search_page_url(request, 2)
    assert parse_qs(urlsplit(url).query) == {
        'search': ['loans'], 'page': ['2'],
    }
    assert urlsplit(url).fragment == 'results-regulations'


def test_mur_regulation_results_preserve_unique_subsection_citations():
    results = regulations.format_mur_regulation_results([{
        'dispositions': [
            {'citations': [
                {'type': 'statute', 'title': '52', 'text': '30101(17)'},
                {'type': 'regulation', 'title': '11', 'text': '100.22(a)'},
                {'type': 'regulation', 'title': '11', 'text': '100.22(b)'},
                {'type': 'regulation', 'title': '11', 'text': '110.11(a)-(c)'},
                {'type': 'regulation', 'title': '11', 'text': '111.1<script>'},
            ]},
        ],
    }], {
        '100.22': 'Express advocacy',
        '110.11': 'Communications; advertising; disclaimers',
        '111.1': 'Definitions',
    })
    assert [
        (result['citation'], result['name'], result['url']) for result in results
    ] == [
        ('11 CFR §100.22(a)', 'Express advocacy', '/legal/regulations/100.22/#p-100.22(a)'),
        ('11 CFR §100.22(b)', 'Express advocacy', '/legal/regulations/100.22/#p-100.22(b)'),
        ('11 CFR §110.11(a)-(c)', 'Communications; advertising; disclaimers',
         '/legal/regulations/110.11/#p-110.11(a)'),
        ('11 CFR §111.1', 'Definitions', '/legal/regulations/111.1/'),
    ]


def test_ao_regulation_results_are_unique_title_11_sections():
    results = regulations.format_ao_regulation_results([{
        'regulatory_citations': [
            {'title': 52, 'part': 301, 'section': 1},
            {'title': 11, 'part': 100, 'section': 22},
            {'title': 11, 'part': 100, 'section': 22},
            {'title': 11, 'part': 109, 'section': 21},
        ],
    }], {'100.22': 'Express advocacy', '109.21': 'Coordinated communications'})
    assert [(result['citation'], result['name']) for result in results] == [
        ('11 CFR §100.22', 'Express advocacy'),
        ('11 CFR §109.21', 'Coordinated communications'),
    ]


def test_ao_number_filter_returns_cited_regulations():
    advisory_opinion = {
        'ao_no': '2024-01',
        'name': 'Texas Majority PAC',
        'regulatory_citations': [
            {'title': 11, 'part': 100, 'section': 26},
            {'title': 11, 'part': 109, 'section': 21},
        ],
    }
    citation_structure = {'children': [
        {'type': 'section', 'identifier': '100.26', 'label_description': 'Expenditures'},
        {'type': 'section', 'identifier': '109.21', 'label_description': 'Coordinated communications'},
    ]}
    with mock.patch.object(
        api_caller, 'load_legal_search_results',
        return_value={'advisory_opinions': [advisory_opinion]},
    ) as api, mock.patch.object(
        ecfr_caller, 'fetch_ecfr_structure', return_value=citation_structure,
    ):
        response = views.legal_doc_search_regulations(RequestFactory().get(
            '/legal/search/regulations/', {'ao_number': 'AO 2024-01'},
        ))
    soup = BeautifulSoup(response.content, 'html.parser')
    assert [
        link.get_text(' ', strip=True)
        for link in soup.select('.legal-search-result > div:first-child a')
    ] == ['11 CFR §100.26', '11 CFR §109.21']
    assert [
        item.get_text(' ', strip=True)
        for item in soup.select('.legal-search-result__name')
    ] == ['Expenditures', 'Coordinated communications']
    message = soup.select_one('.message--info')
    assert message.select_one('a').get_text(strip=True) == 'AO 2024-01'
    assert 'Texas Majority PAC' in message.get_text(' ', strip=True)
    assert soup.select_one('#ao-number-input')['value'] == 'AO 2024-01'
    assert soup.select_one('#ao-number-input').find_parent('form')['id'] == 'regulation-ao-search'
    assert 'ao_number=AO+2024-01' in soup.select_one('.legal-search-result a')['href']
    tag = soup.select_one('[data-tag-category="ao_number"] .tag__item')
    assert tag.get_text(' ', strip=True) == (
        'AO 2024-01 Remove AO 2024-01 filter'
    )
    assert tag.select_one('.regulation-filter-tag__remove')['href'] == (
        '/legal/search/regulations/'
        '?search_type=regulations#results-regulations'
    )
    assert soup.select_one('.tags__count').get_text(strip=True) == '2'
    api.assert_called_once_with(
        '', query_type='advisory_opinions', offset=0, limit=20,
        ao_no='2024-01', ao_doc_category_id='F',
    )


def test_invalid_ao_number_does_not_call_api():
    with mock.patch.object(api_caller, 'load_legal_search_results') as api:
        response = views.legal_doc_search_regulations(RequestFactory().get(
            '/legal/search/regulations/', {'ao_number': 'not a number'},
        ))
    assert response.status_code == 400
    assert b'Enter an AO number in YYYY-NN format.' in response.content
    assert b'class="tag__item"' not in response.content
    api.assert_not_called()


def test_mur_number_filter_returns_cited_regulations():
    mur = {
        'no': '8253',
        'name': 'Turn AZ Blue PAC',
        'dispositions': [{'citations': [
            {'type': 'regulation', 'title': '11', 'text': '100.5'},
            {'type': 'regulation', 'title': '11', 'text': '100.22'},
        ]}],
    }
    citation_structure = {'children': [
        {'type': 'section', 'identifier': '100.5', 'label_description': 'Political committee'},
        {'type': 'section', 'identifier': '100.22', 'label_description': 'Express advocacy'},
    ]}
    with mock.patch.object(
        api_caller, 'load_legal_search_results', return_value={'murs': [mur]},
    ) as api, mock.patch.object(
        ecfr_caller, 'fetch_ecfr_structure', return_value=citation_structure,
    ):
        response = views.legal_doc_search_regulations(RequestFactory().get(
            '/legal/search/regulations/', {'mur_number': 'MUR #8253'},
        ))
    soup = BeautifulSoup(response.content, 'html.parser')
    assert [link.get_text(' ', strip=True) for link in soup.select('.legal-search-result > div:first-child a')] == [
        '11 CFR §100.5', '11 CFR §100.22',
    ]
    assert [
        item.get_text(' ', strip=True)
        for item in soup.select('.legal-search-result__name')
    ] == ['Political committee', 'Express advocacy']
    message = soup.select_one('.message--info')
    assert message.select_one('a').get_text(strip=True) == 'MUR #8253'
    assert 'Turn AZ Blue PAC' in message.get_text(' ', strip=True)
    assert soup.select_one('#mur-number-input')['value'] == 'MUR #8253'
    assert soup.select_one('#mur-number-input').find_parent('form')['id'] == 'regulation-mur-search'
    assert soup.select_one('#search-input').find_parent('form')['id'] == 'regulation-keyword-search'
    assert 'mur_number=MUR+%238253' in soup.select_one('.legal-search-result a')['href']
    tag = soup.select_one('[data-tag-category="mur_number"] .tag__item')
    assert tag.get_text(' ', strip=True) == 'MUR #8253 Remove MUR #8253 filter'
    assert tag.select_one('.regulation-filter-tag__remove')['href'] == (
        '/legal/search/regulations/'
        '?search_type=regulations#results-regulations'
    )
    assert soup.select_one('.tags__count').get_text(strip=True) == '2'
    api.assert_called_once_with('', query_type='murs', offset=0, limit=20, case_no='8253')


def test_keyword_filter_renders_removable_tag():
    ecfr_results = {
        'results': [{
            'hierarchy': {'section': '100.6'},
            'headings': {'section': 'Connected organization'},
            'full_text_excerpt': 'A connected organization...',
        }],
        'meta': {'current_page': 1, 'total_pages': 1, 'total_count': 1},
    }
    with mock.patch.object(
        ecfr_caller, 'fetch_ecfr_data', return_value=ecfr_results,
    ):
        response = views.legal_doc_search_regulations(RequestFactory().get(
            '/legal/search/regulations/', {'search': 'connected organization'},
        ))

    soup = BeautifulSoup(response.content, 'html.parser')
    tag = soup.select_one('[data-tag-category="search"] .tag__item')
    assert tag.get_text(' ', strip=True) == (
        'connected organization Remove connected organization filter'
    )
    assert tag.select_one('.regulation-filter-tag__remove')['href'] == (
        '/legal/search/regulations/'
        '?search_type=regulations#results-regulations'
    )
    assert soup.select_one('.tags__count').get_text(strip=True) == '1'


def test_mur_regulation_subsection_links_to_reader_paragraph():
    mur = {
        'no': '7382',
        'name': 'Thom Tillis Committee, et al.',
        'dispositions': [{'citations': [
            {'type': 'regulation', 'title': '11', 'text': '110.20(i)'},
        ]}],
    }
    structure = {'children': [{
        'type': 'section',
        'identifier': '110.20',
        'label_description': (
            'Prohibition on contributions, donations, expenditures, independent '
            'expenditures, and disbursements by foreign nationals'
        ),
    }]}
    with mock.patch.object(
        api_caller, 'load_legal_search_results', return_value={'murs': [mur]},
    ), mock.patch.object(
        ecfr_caller, 'fetch_ecfr_structure', return_value=structure,
    ):
        response = views.legal_doc_search_regulations(RequestFactory().get(
            '/legal/search/regulations/', {'mur_number': '7382'},
        ))

    soup = BeautifulSoup(response.content, 'html.parser')
    result = soup.select_one('.legal-search-result')
    link = result.select_one('a')
    assert link.get_text(' ', strip=True) == '11 CFR §110.20(i)'
    assert link['href'] == (
        '/legal/regulations/110.20/'
        '?return_to=regulations-search&mur_number=7382#p-110.20(i)'
    )
    assert 'Prohibition on contributions' in result.select_one(
        '.legal-search-result__name'
    ).get_text(' ', strip=True)


def test_invalid_mur_number_does_not_call_api():
    with mock.patch.object(api_caller, 'load_legal_search_results') as api:
        response = views.legal_doc_search_regulations(RequestFactory().get(
            '/legal/search/regulations/', {'mur_number': 'not a number'},
        ))
    assert response.status_code == 400
    assert b'Enter a MUR number using numbers only.' in response.content
    api.assert_not_called()


def test_regulation_search_methods_cannot_be_combined():
    with mock.patch.object(api_caller, 'load_legal_search_results') as legal_api, \
            mock.patch.object(ecfr_caller, 'fetch_ecfr_data') as ecfr_api:
        response = views.legal_doc_search_regulations(RequestFactory().get(
            '/legal/search/regulations/', {
                'search': 'contribution',
                'ao_number': '2024-01',
                'mur_number': '8253',
            },
        ))
    assert response.status_code == 400
    assert b'Search by regulation keyword, AO number, or MUR number.' in response.content
    assert b'value="contribution"' in response.content
    assert b'value="2024-01"' in response.content
    assert b'value="8253"' in response.content
    legal_api.assert_not_called()
    ecfr_api.assert_not_called()


@pytest.mark.parametrize(('params', 'selected', 'status'), [
    ({}, 'search', 200),
    ({'search': 'loans'}, 'search', 200),
    ({'ao_number': '2024-01'}, 'ao_number', 200),
    ({'mur_number': '8253'}, 'mur_number', 200),
    ({'ao_number': 'invalid'}, 'ao_number', 400),
    ({'mur_number': 'invalid'}, 'mur_number', 400),
])
def test_regulation_search_method_selector_matches_request(params, selected, status):
    with mock.patch.object(ecfr_caller, 'fetch_ecfr_structure', return_value={}), \
            mock.patch.object(ecfr_caller, 'fetch_ecfr_data', return_value={}), \
            mock.patch.object(api_caller, 'load_legal_search_results', return_value={
                'advisory_opinions': [], 'murs': [],
            }):
        response = views.legal_doc_search_regulations(RequestFactory().get(
            '/legal/search/regulations/', params,
        ))
    assert response.status_code == status
    soup = BeautifulSoup(response.content, 'html.parser')
    controls = soup.select('[data-search-method-selector] input:checked')
    assert len(controls) == 1
    assert controls[0]['value'] == selected
    hint = soup.find(id='regulation-search-hint')
    assert hint.get_text(strip=True) == 'Use one search method at a time.'
    assert hint.find_parent('form') is None
    assert response.content.count(b'Use one search method at a time.') == 1
    for form in soup.select('form[data-search-method]'):
        # Each independent form remains usable without JavaScript and submits one method.
        assert not form.has_attr('hidden')
        assert {field['name'] for field in form.select('input[name]')} == {
            'search_type', form['data-search-method'],
        }
    modal = soup.select_one('[data-regulation-keyword-form]')
    assert modal['action'] == '/data/legal/search/regulations/'


@pytest.mark.parametrize(('category', 'result_key', 'filters', 'record', 'label'), [
    ('advisory-opinions', 'advisory_opinions',
     {'ao_doc_category_id': 'F', 'ao_citation_require_all': 'false', 'ao_regulatory_citation': '11 CFR §100.6'},
     {'ao_no': '2024-01', 'name': 'Example opinion'}, b'AO 2024-01'),
    ('murs', 'murs', {'case_regulatory_citation': '11 CFR §100.6'},
     {'no': '1234', 'name': 'Example matter'}, b'MUR #1234'),
])
def test_related_citation_filters(category, result_key, filters, record, label):
    with mock.patch.object(api_caller, 'load_legal_search_results', return_value={result_key: [record]}) as api:
        response = regulations.regulation_related_content(RequestFactory().get('/'), '100.6', category)
    assert label in response.content
    api.assert_called_once_with(
        '', query_type=result_key, doc_type=result_key, offset=0, sort='-issue_date', **filters,
    )


@pytest.mark.parametrize('category', ['rulemakings', 'advisory-opinions', 'murs'])
def test_related_failure_is_local_to_partial(category):
    with mock.patch.object(api_caller, 'load_legal_search_results', side_effect=requests.Timeout), \
            mock.patch.object(api_caller, 'load_legal_rulemakings_for_regulation', side_effect=requests.Timeout):
        response = regulations.regulation_related_content(RequestFactory().get('/'), '100.6', category)
    assert b'temporarily unavailable' in response.content


@pytest.mark.parametrize('category', ['rulemakings', 'advisory-opinions', 'murs'])
def test_related_empty_state(category):
    with mock.patch.object(api_caller, 'load_legal_search_results', return_value={}), \
            mock.patch.object(api_caller, 'load_legal_rulemakings_for_regulation', return_value={}):
        response = regulations.regulation_related_content(RequestFactory().get('/'), '100.6', category)
    assert b'No ' in response.content
