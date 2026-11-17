"""Focused reader/search integration checks; history business rules live in test_regulation_history.py."""
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
from legal.regulation_history import build_regulation_history_context


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
def test_statutes_expand_and_link_each_section(citation, sections):
    title = citation.split()[0]
    first = sections[0].split('(')[0]
    markup = f'<p><a href="https://www.govinfo.gov/link/uscode/{title}/{first}">{citation}</a></p>'
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
    assert [item['url'] for item in items[-2:]] == ['/legal/regulations/100.7/', '/legal/regulations/100.8/']
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
    assert b'52 U.S.C. 30101(6)' in response.content
    for category in ('rulemakings', 'advisory-opinions', 'murs'):
        assert f'/legal/regulations/100.6/related/{category}/'.encode() in response.content
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
    missing = soup.select_one('#historical-ej-100-6-b .legal-history-preview__heading')
    assert missing.find('a') is None


def test_unstarred_citation_change_links_to_earlier_history(ecfr, section_html):
    ecfr.return_value = {'text': section_html.replace('100.6', '100.89')}
    response = regulations.regulation_page(RequestFactory().get('/'), '100.89')
    record = BeautifulSoup(response.content, 'html.parser').find(id='historical-ej-100-89-f')
    note = record.select_one('.legal-history-preview__citation-note')
    assert note.select_one(
        'a[href="/legal/regulations/100.7/#historical-ej-100-7-b-17"]'
    ).get_text(' ', strip=True) == '§ 100.7(b)(17)(vi)'
    assert record.select_one(
        '.legal-history-preview__subject a[href="https://sers.fec.gov/fosers/showpdf.htm?docid=44678"]'
    ) is not None


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


# Representative rendering only; citation scope and grouping are tested in test_regulation_history.py.
@pytest.mark.parametrize('section', ['100.7', '100.82', '100.134'])
def test_history_renders_documents_and_citation_links(ecfr, section_html, section):
    ecfr.return_value = {'text': section_html.replace('100.6', section)}
    response = regulations.regulation_page(RequestFactory().get('/'), section)
    preview = BeautifulSoup(response.content, 'html.parser').select_one('[data-regulation-history]')
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
        note = record.select_one('.legal-history-preview__citation-note')
        for citation in group.get('citation_note', {}).get('previous_citations', []):
            if not citation.get('ej_unavailable'):
                assert note.find('a', href=citation['url']) is not None
        for change in group.get('citation_events', []):
            for citation in change['redesignated_as']:
                assert record.find('a', href=citation['url']) is not None
        assert record.select_one('details .legal-history-preview__citation-note') is None


@pytest.mark.parametrize(('section', 'anchor', 'subject_label', 'visible_years', 'collapsed_years'), [
    ('100.6', 'historical-ej-100-6', 'Election', ['1977'], ['1975']),
    ('100.7', 'historical-ej-100-7-b-11-i', None, [], ['1992', '1992']),
    ('100.111', 'historical-ej-100-111', None, ['2002'], []),
])
def test_history_keeps_active_documents_visible_and_collapses_reserved_history(
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


def test_reserved_history_prioritizes_reserved_status_over_later_removed_record(ecfr):
    response = regulations.regulation_page(RequestFactory().get('/'), '100.7')
    record = BeautifulSoup(response.content, 'html.parser').find(id='historical-ej-100-7-b-19')
    subject = record.select_one('.legal-history-preview__subject')
    visible = subject.select(':scope > ul > .legal-history-preview__status')
    assert len(visible) == 1
    assert '1992' in visible[0].get_text()
    assert 'Section removed and reserved' in visible[0].get_text()
    collapsed = subject.select('details .legal-history-preview__status')
    assert len(collapsed) == 1
    assert '2002' in collapsed[0].get_text()
    assert 'Removed' in collapsed[0].get_text()


def test_shared_removal_status_is_not_assigned_to_one_subject(ecfr):
    response = regulations.regulation_page(RequestFactory().get('/'), '100.7')
    record = BeautifulSoup(response.content, 'html.parser').find(id='historical-ej-100-7')
    assert len(record.select('.legal-history-preview__subject')) == 2
    assert record.select_one(':scope > .legal-history-preview__citation-status') is not None
    assert not record.select('.legal-history-preview__subject .legal-history-preview__status')


@pytest.mark.parametrize(('status', 'expected'), [(404, 200), (503, 502)])
def test_reserved_404_and_upstream_failure_are_distinct(ecfr, status, expected):
    ecfr.return_value = {'error': True, 'status_code': status, 'error_message': 'eCFR unavailable'}
    response = regulations.regulation_page(RequestFactory().get('/'), '100.7')
    assert response.status_code == expected
    if status == 404:
        assert b'[Reserved]' in response.content
        assert not BeautifulSoup(response.content, 'html.parser').select('.legal-history-preview__heading a')
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


def test_reserved_part_ranges_are_unlinked_and_direct_urls_explain_reserved_status(ecfr, structure):
    identifiers = ['9009-9011', '9040-9099']
    subchapter = regulations.find_ecfr_node(structure, 'subchapter', 'A')
    subchapter['children'].extend({
        'type': 'part', 'identifier': identifier, 'reserved': True,
        'label_description': f'Parts {identifier} [Reserved]',
    } for identifier in identifiers)
    request = RequestFactory().get('/', {'return_to': 'regulations-search', 'page': 2})
    responses = [
        views.legal_doc_search_regulations(request),
        regulations.regulation_hierarchy_page(request, 'subchapter', 'A'),
    ]
    for response in responses:
        assert response.status_code == 200
        soup = BeautifulSoup(response.content, 'html.parser')
        for identifier in identifiers:
            row = next(row for row in soup.select('[role="row"]') if identifier in row.get_text())
            assert '[Reserved]' in row.get_text()
            assert row.find('a') is None
    for identifier in identifiers:
        response = regulations.regulation_hierarchy_page(request, 'part', identifier)
        assert response.status_code == 200
        soup = BeautifulSoup(response.content, 'html.parser')
        assert 'reserved' in soup.select_one('.message--info').get_text()
        assert 'No regulations found.' not in soup.get_text()


def test_hierarchy_back_link(ecfr):
    request = RequestFactory().get('/', {'return_to': 'regulations-search', 'page': 2})
    response = regulations.regulation_hierarchy_page(request, 'part', '100')
    assert b'/legal/search/regulations/?page=2' in response.content
    assert b'/legal/regulations/100.7/?return_to=regulations-search&amp;page=2' in response.content
    current = BeautifulSoup(response.content, 'html.parser').select_one('.breadcrumbs--regulation [aria-current]')
    assert current.get_text(strip=True) == 'Part 100 — Definitions (52 U.S.C. 30101)'


def test_section_breadcrumbs_preserve_search_and_identify_current_page(ecfr):
    request = RequestFactory().get('/', {
        'return_to': 'regulations-search', 'search': 'connected organization', 'page': 2,
    })
    response = regulations.regulation_page(request, '100.6')
    trail = BeautifulSoup(response.content, 'html.parser').find('nav', attrs={'aria-label': 'Regulation breadcrumbs'})
    assert trail.select_one('li').find('a') is None
    links = trail.select('a')
    assert links[0].get_text(strip=True) == 'Chapter I'
    assert links[0]['href'] == '/legal/search/regulations/'
    assert [urlsplit(link['href']).path for link in links] == [
        '/legal/search/regulations/',
        '/legal/regulations/subchapter/A/', '/legal/regulations/part/100/',
        '/legal/regulations/part/100/subpart/A/',
    ]
    for link in links[1:]:
        assert parse_qs(urlsplit(link['href']).query) == {
            'return_to': ['regulations-search'], 'search': ['connected organization'], 'page': ['2'],
        }
    current = trail.select_one('[aria-current="page"]')
    assert current.get_text(strip=True) == 'Section 100.6'
    assert not current.find_parent('a')
    assert len(trail.select('.breadcrumbs__separator')) == len(trail.select('li')) - 1


def test_breadcrumbs_scope_repeated_subpart_identifiers_to_part(structure):
    structure['children'][0]['children'][0]['children'] = [{
        'type': 'subpart', 'identifier': 'A', 'children': [
            {'type': 'section', 'identifier': '1.1'},
        ],
    }]
    trail = regulations.format_ecfr_breadcrumbs(structure, 'subpart', 'A', part='100')
    assert trail[-2]['label'] == 'Part 100 — Definitions (52 U.S.C. 30101)'
    assert trail[-2]['url'] == '/legal/regulations/part/100/'
    assert trail[-1] == {'label': 'Subpart A', 'url': None}


def test_breadcrumbs_do_not_invent_missing_ancestors(ecfr):
    with mock.patch.object(ecfr_caller, 'fetch_ecfr_structure', return_value={'error': True}):
        response = regulations.regulation_page(RequestFactory().get('/'), '100.6')
    assert response.status_code == 200
    soup = BeautifulSoup(response.content, 'html.parser')
    trail = soup.select_one('.breadcrumbs--regulation')
    assert len(trail.select('li')) == 2
    assert trail.find('a') is None
    assert trail.select_one('[aria-current="page"]').get_text(strip=True) == 'Section 100.6'
    assert soup.find(id='regulation-100.6') is not None


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
    assert 'ao_number=AO+2024-01' in soup.select_one('.legal-search-result a')['href']
    api.assert_called_once_with(
        '', query_type='advisory_opinions', offset=0, limit=20,
        ao_no='2024-01', ao_doc_category_id='F',
    )


@pytest.mark.parametrize('field', ['ao_number', 'mur_number'])
def test_invalid_citation_number_does_not_call_api(field):
    with mock.patch.object(api_caller, 'load_legal_search_results') as api:
        response = views.legal_doc_search_regulations(RequestFactory().get(
            '/legal/search/regulations/', {field: 'not a number'},
        ))
    assert response.status_code == 400
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
    assert 'mur_number=MUR+%238253' in soup.select_one('.legal-search-result a')['href']
    api.assert_called_once_with('', query_type='murs', offset=0, limit=20, case_no='8253')


def test_keyword_search_passes_query_and_page_to_ecfr_and_preserves_return_context():
    ecfr_results = {
        'results': [{
            'hierarchy': {'section': '100.6'},
            'headings': {'section': 'Connected organization'},
            'full_text_excerpt': 'A connected organization...',
        }],
        'meta': {'current_page': 2, 'total_pages': 3, 'total_count': 41},
    }
    with mock.patch.object(
        ecfr_caller, 'fetch_ecfr_data', return_value=ecfr_results,
    ) as api:
        response = views.legal_doc_search_regulations(RequestFactory().get(
            '/legal/search/regulations/', {'search': 'connected + organization', 'page': 2},
        ))

    soup = BeautifulSoup(response.content, 'html.parser')
    link = soup.select_one('.legal-search-result a')
    assert urlsplit(link['href']).path == '/legal/regulations/100.6/'
    assert parse_qs(urlsplit(link['href']).query) == {
        'return_to': ['regulations-search'], 'search': ['connected + organization'], 'page': ['2'],
    }
    assert 'Connected organization' in soup.select_one('.legal-search-result__name').get_text()
    api.assert_called_once_with('connected organization', page='2')


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
    assert b'value="contribution"' in response.content
    assert b'value="2024-01"' in response.content
    assert b'value="8253"' in response.content
    legal_api.assert_not_called()
    ecfr_api.assert_not_called()


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
