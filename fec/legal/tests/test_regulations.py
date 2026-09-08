"""Regulation behavior at the HTML, navigation, and request boundaries."""
from urllib.parse import parse_qs, urlsplit
from unittest import mock

import pytest
import requests
from bs4 import BeautifulSoup
from django.http import Http404
from django.test import RequestFactory

from data import api_caller, ecfr_caller
from legal import regulation_text as text, regulations, views


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
    assert '<a ' not in section['heading']
    assert len(section['statutory_citations']) == 3


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


@pytest.mark.parametrize('citation', ['11 CFR 100.6', '11 C.F.R. §100.6', '§ 100.6', '100.6'])
def test_citation_input_formats(citation):
    assert regulations.normalize_regulatory_section_filter(citation) == '100.6'
    assert regulations.normalize_regulatory_citation_filter(citation) == '100'


@pytest.mark.parametrize('value', ['https://evil.test', '//evil.test', '/\\evil.test', 'javascript:alert(1)'])
def test_back_link_rejects_external_urls(value):
    request = RequestFactory().get('/', {'return_url': value})
    assert regulations.valid_return_url(request) == '/legal/search/regulations/'


def test_back_link_preserves_query_and_anchor():
    url = '/legal/search/regulations/?search=loans&page=2#results-regulations'
    request = RequestFactory().get('/', {'return_url': url})
    assert regulations.valid_return_url(request) == url


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
    assert len(soup.select('[data-regulation-related-url] > a[href]')) == 3
    legal_api.assert_not_called()
    rulemaking_api.assert_not_called()


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


@pytest.mark.parametrize('citation', ['', '11 C.F.R. 100'])
def test_browse_and_part_filter(ecfr, citation):
    response = views.legal_doc_search_regulations(RequestFactory().get(
        '/legal/search/regulations/', {'regulatory_citation': citation},
    ))
    assert response.status_code == 200
    assert b'Definitions' in response.content
    assert (b'Privacy Act' in response.content) == (not citation)


def test_section_redirect_and_hierarchy_back_link(ecfr):
    request = RequestFactory().get('/', {'regulatory_citation': '11 CFR 100.6'})
    assert views.legal_doc_search_regulations(request).url.startswith('/legal/regulations/100.6/')
    request = RequestFactory().get('/', {'return_url': '/legal/search/regulations/?page=2'})
    response = regulations.regulation_hierarchy_page(request, 'part', '100')
    assert b'/legal/search/regulations/?page=2' in response.content
    assert b'/legal/regulations/100.7/' in response.content


def test_pagination_retains_search_and_citation():
    request = RequestFactory().get('/', {'search': 'loans', 'regulatory_citation': '11 CFR 100'})
    url = regulations.regulation_search_page_url(request, 2)
    assert parse_qs(urlsplit(url).query) == {
        'search': ['loans'], 'regulatory_citation': ['11 CFR 100'], 'page': ['2'],
    }
    assert urlsplit(url).fragment == 'results-regulations'


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
