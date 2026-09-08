"""Title 11 navigation, section views, and deferred legal citations."""

import logging
import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlencode

import requests
from django.http import Http404
from django.shortcuts import render
from django.utils.http import url_has_allowed_host_and_scheme

from data import api_caller, ecfr_caller
from legal.regulation_history import build_regulation_history_context
from legal.regulation_text import format_ecfr_html_section, format_ecfr_timeline

logger = logging.getLogger(__name__)
ECFR_REGULATION_SECTION_PATTERN = re.compile(r'^\d+\.\d+[A-Za-z0-9-]*$')


def transform_ecfr_query_string(query_string):
    """Remove the legal search's space-plus operator from eCFR queries."""
    return re.sub(r' \+', '', query_string)


def format_ecfr_regulation_results(ecfr_results, include_part_highlight=False):
    regulations = []
    for obj in ecfr_results.get('results', []):
        hierarchy = obj.get('hierarchy', {})
        headings = obj.get('headings', {})
        section = hierarchy.get('section')

        highlights = [obj.get('full_text_excerpt')]
        if include_part_highlight:
            highlights.insert(0, headings.get('part'))

        regulations.append({
            'doc_id': None,
            'document_highlights': {},
            'highlights': highlights,
            'name': headings.get('section'),
            'no': section,
            'type': None,
            'url': f"/legal/regulations/{section}/" if section else '/legal/search/regulations/',
        })

    return regulations


def ecfr_section_url(section):
    return f"/legal/regulations/{section}/"


def append_return_url(url, return_url):
    if not return_url:
        return url
    separator = '&' if '?' in url else '?'
    return f"{url}{separator}{urlencode({'return_url': return_url})}"


def valid_return_url(request, default='/legal/search/regulations/'):
    candidate = request.GET.get('return_url', '')
    if candidate.startswith('/') and url_has_allowed_host_and_scheme(candidate, allowed_hosts=set()):
        return candidate
    return default


def regulation_search_page_url(request, page):
    params = request.GET.copy()
    params['page'] = page
    return '/legal/search/regulations/?{}#results-regulations'.format(
        params.urlencode()
    )


def ecfr_hierarchy_url(node_type, identifier, part=None):
    if node_type == 'subchapter':
        return f"/legal/regulations/subchapter/{identifier}/"
    if node_type == 'part':
        return f"/legal/regulations/part/{identifier}/"
    if node_type == 'subpart' and part:
        return f"/legal/regulations/part/{part}/subpart/{identifier}/"
    return '/legal/search/regulations/'


def ecfr_description(node):
    description = node.get('label_description') or ''
    description = re.sub(r'\s*\(52\s+U\.S\.C\..*\)\s*$', '', description)
    return re.sub(r'\s*\[Reserved\]\s*$', '', description, flags=re.IGNORECASE).strip()


def find_ecfr_node(node, node_type, identifier=None):
    if node.get('type') == node_type and (identifier is None or node.get('identifier') == identifier):
        return node

    for child in node.get('children', []):
        result = find_ecfr_node(child, node_type, identifier)
        if result:
            return result

    return None


def find_reserved_ecfr_section(structure, section):
    """Return the eCFR reserved label containing a section, if present."""
    chapter = find_ecfr_node(structure, 'chapter', 'I')
    if not chapter:
        return None

    def walk(node):
        if node.get('type') == 'section' and node.get('reserved'):
            identifier = node.get('identifier', '')
            if section in ecfr_section_identifiers(identifier):
                return node.get('label_description') or identifier

        for child in node.get('children', []):
            result = walk(child)
            if result:
                return result
        return None

    return walk(chapter)


def normalize_regulatory_citation_filter(citation):
    return normalize_regulatory_section_filter(citation).split('.', 1)[0]


def normalize_regulatory_section_filter(citation):
    citation = (citation or '').strip().lower().replace('§', '')
    citation = re.sub(r'^(11\s*)?c\.?f\.?r\.?\s*', '', citation)
    match = re.fullmatch(r'\s*(\d+(?:\.\d+[a-z0-9-]*)?)(?:\([^)]+\))*\s*', citation)
    return match.group(1) if match else ''


def format_ecfr_regulation_parts(structure, regulatory_citation=''):
    """Return the browsable Title 11 hierarchy for the regulations table."""
    # Title 11 contains one FEC chapter; ignore other agencies if added later.
    chapter = find_ecfr_node(structure, 'chapter', 'I')
    if not chapter:
        return []

    citation_part = normalize_regulatory_citation_filter(regulatory_citation)
    rows = []

    def hierarchy_sort_key(node):
        value = node.get('descendant_range') or node.get('identifier') or ''
        match = re.search(r'(\d+)(?:\.(\d+))?', value)
        if not match:
            for child in node.get('children', []):
                child_key = hierarchy_sort_key(child)
                if child_key[0] != float('inf'):
                    return child_key
        if not match:
            return (float('inf'), float('inf'))
        return (int(match.group(1)), int(match.group(2) or -1))

    def collect(node, part=None, include=True, level=0):
        node_type = node.get('type')
        identifier = node.get('identifier') or ''
        if node_type == 'part':
            part = identifier
            include = not citation_part or identifier == citation_part

        if node_type in ('subchapter', 'part', 'subpart') and include:
            rows.append({
                'type': node_type,
                'part': part,
                'identifier': identifier,
                'citation': f"{node_type.title()} {identifier}",
                'description': ecfr_description(node),
                'section_range': node.get('descendant_range'),
                'reserved': node.get('reserved', False),
                'url': ecfr_hierarchy_url(node_type, identifier, part=part),
                'level': level,
            })

        for child in sorted(node.get('children', []), key=hierarchy_sort_key):
            collect(child, part=part, include=include, level=level + 1)

    collect(chapter, level=-1)
    return rows


def find_ecfr_hierarchy_node(structure, node_type, identifier, part=None):
    """Find a part, subpart, or subchapter in the Title 11 structure."""
    chapter = find_ecfr_node(structure, 'chapter', 'I')
    if not chapter:
        return None

    root = find_ecfr_node(chapter, 'part', part) if part else chapter
    return find_ecfr_node(root, node_type, identifier) if root else None


def format_ecfr_hierarchy_contents(node):
    """Return nested headings and sections for a part or subchapter page."""
    contents = []

    def collect(current, part=None):
        for child in current.get('children', []):
            child_type = child.get('type')
            if child_type in ('part', 'subpart'):
                child_part = child.get('identifier') if child_type == 'part' else part
                contents.append({
                    'type': child_type,
                    'identifier': child.get('identifier'),
                    'description': ecfr_description(child),
                    'url': ecfr_hierarchy_url(
                        child_type,
                        child.get('identifier'),
                        part=child_part,
                    ),
                })
                collect(child, part=child_part)
            elif child_type == 'section':
                identifier = child.get('identifier') or ''
                for section in ecfr_section_identifiers(identifier):
                    contents.append({
                        'type': 'section',
                        'identifier': section,
                        'description': ecfr_description(child),
                        'reserved': child.get('reserved', False),
                        'url': ecfr_section_url(section),
                    })
            else:
                collect(child, part=part)

    collect(node, part=node.get('identifier') if node.get('type') == 'part' else None)
    return contents


def ecfr_section_identifiers(identifier):
    """Expand an eCFR reserved range into individual section citations."""
    match = re.fullmatch(r'(\d+\.)(\d+)-(\d+\.)(\d+)', identifier)
    if not match or match.group(1) != match.group(3):
        return [identifier]
    return [
        f"{match.group(1)}{number}"
        for number in range(int(match.group(2)), int(match.group(4)) + 1)
    ]


def format_ecfr_section_nav(structure, current_section):
    # The structure tree is already in CFR order, so preserve traversal order.
    chapter = find_ecfr_node(structure, 'chapter', 'I')
    if not chapter:
        return {}

    sections = []

    def collect_sections(node, part=None):
        if node.get('type') == 'part':
            part = {
                'no': node.get('identifier'),
                'description': ecfr_description(node),
            }
        if node.get('type') == 'section':
            for section_number in ecfr_section_identifiers(node.get('identifier', '')):
                sections.append({
                    'no': section_number,
                    'description': (
                        '[Reserved]'
                        if node.get('reserved')
                        else node.get('label_description')
                    ),
                    'url': ecfr_section_url(section_number),
                    'part': part,
                })
            return

        for child in node.get('children', []):
            collect_sections(child, part)

    collect_sections(chapter)

    section_numbers = [section.get('no') for section in sections]
    try:
        current_index = section_numbers.index(current_section)
    except ValueError:
        return {}

    return {
        'previous': sections[current_index - 1] if current_index > 0 else None,
        'next': sections[current_index + 1] if current_index < len(sections) - 1 else None,
        'part': sections[current_index].get('part'),
    }


def format_fec_regulation_history(rulemakings_response, citation_query=None):
    """List each cited rulemaking once, newest rulemaking number first."""
    rulemakings = {}
    for item in rulemakings_response.get('rulemakings', []):
        number = item.get('rm_no') or ''
        if not re.fullmatch(r'\d{4}-\d+', number):
            continue
        url = f'/legal/rulemakings/{number}/'
        if citation_query:
            url = '/legal/search/rulemakings/?' + urlencode({'q': citation_query, 'rm_no': number})
        rulemakings.setdefault(number, {
            'rm_no': number, 'rm_name': item.get('rm_name'), 'url': url,
        })
    numbers = sorted(rulemakings, key=lambda number: tuple(map(int, number.split('-'))), reverse=True)
    return {'explanations': [rulemakings[number] for number in numbers]}


def regulation_hierarchy_page(request, hierarchy_type, identifier, part=None):
    structure = ecfr_caller.fetch_ecfr_structure()
    error = structure.get('error')
    hierarchy = None
    if not error:
        node = find_ecfr_hierarchy_node(structure, hierarchy_type, identifier, part=part)
        if not node:
            raise Http404
        hierarchy = {
            'type': hierarchy_type,
            'identifier': identifier,
            'description': ecfr_description(node),
            'contents': format_ecfr_hierarchy_contents(node),
        }
        for item in hierarchy['contents']:
            item['url'] = append_return_url(item['url'], request.get_full_path())
    return render(request, 'legal-regulation-hierarchy.jinja', {
        'hierarchy': hierarchy,
        'hierarchy_error': structure.get('error_message') if error else None,
        'results': {'total_all': int(bool(hierarchy))},
        'result_type': 'regulations',
        'query': '',
        'regulatory_citation': '',
        'is_browse': False,
        'return_url': valid_return_url(request),
    }, status=502 if error else 200)


def regulation_related_content(request, section, related_type):
    """Render one FEC API-backed section after the regulation page loads."""
    if not ECFR_REGULATION_SECTION_PATTERN.match(section):
        raise Http404

    context = {'section': section}
    try:
        if related_type == 'rulemakings':
            response = api_caller.load_legal_rulemakings_for_regulation(section)
            context['fec_history'] = format_fec_regulation_history(
                response or {},
                api_caller.build_rulemaking_citation_query(section),
            )
        elif related_type == 'advisory-opinions':
            response = api_caller.load_legal_search_results(
                '',
                query_type='advisory_opinions',
                offset=0,
                sort='-issue_date',
                doc_type='advisory_opinions',
                ao_doc_category_id='F',
                ao_citation_require_all='false',
                ao_regulatory_citation=f'11 CFR §{section}',
            )
            context['advisory_opinions'] = response.get(
                'advisory_opinions', []
            )
        elif related_type == 'murs':
            response = api_caller.load_legal_search_results(
                '',
                query_type='murs',
                offset=0,
                sort='-issue_date',
                doc_type='murs',
                case_regulatory_citation=f'11 CFR §{section}',
            )
            context['murs'] = response.get('murs', [])
        else:
            raise Http404
    except requests.RequestException:
        logger.exception(
            "Unable to retrieve %s for regulation %s",
            related_type,
            section,
        )
        context['error_message'] = (
            'This information is temporarily unavailable. Please try again.'
        )

    return render(
        request,
        f'partials/legal-regulation-{related_type}.jinja',
        context,
    )


def fetch_ecfr_section_context(section, issue_date=None):
    """Fetch independent navigation and timeline data concurrently."""
    request_date = issue_date or 'current'
    with ThreadPoolExecutor(max_workers=3) as executor:
        structure_future = executor.submit(
            ecfr_caller.fetch_ecfr_structure,
            date=request_date,
        )
        versions_future = executor.submit(
            ecfr_caller.fetch_ecfr_versions,
            section,
            date=issue_date,
        )
        ancestry_future = executor.submit(
            ecfr_caller.fetch_ecfr_ancestry,
            section,
            date=issue_date,
        )
        return (
            structure_future.result(),
            versions_future.result(),
            ancestry_future.result(),
        )


def regulation_page(request, section):
    if not ECFR_REGULATION_SECTION_PATTERN.match(section):
        raise Http404

    section_response = ecfr_caller.fetch_ecfr_section_html(section)
    regulation = format_ecfr_html_section(
        section_response.get('text', ''),
        section=section,
    )
    regulation_history = build_regulation_history_context(section)
    reserved_label = None
    section_nav = {}
    section_not_found = section_response.get('status_code') == 404
    if not regulation and (not section_response.get('error') or section_not_found):
        structure_response = ecfr_caller.fetch_ecfr_structure()
        reserved_label = find_reserved_ecfr_section(structure_response, section)
        if reserved_label:
            section_nav = format_ecfr_section_nav(structure_response, section)
    # A confirmed 404 may still have useful historical records. A timeout or
    # other eCFR failure cannot establish that the current regulation is gone.
    historical_only = not regulation and bool(
        reserved_label
        or (section_not_found and regulation_history['events'])
    )
    regulations_api_error = (
        section_response.get('error_message')
        if section_response.get('error') and not historical_only
        else None
    )
    timeline = []
    timeline_api_error = None
    if regulation:
        (
            structure_response,
            versions_response,
            ancestry_response,
        ) = fetch_ecfr_section_context(
            section,
            issue_date=regulation.get('issue_date'),
        )

        section_nav = format_ecfr_section_nav(structure_response, section)
        timeline = format_ecfr_timeline(versions_response, ancestry_response, section)
        if versions_response.get('error') or ancestry_response.get('error'):
            timeline_api_error = ecfr_caller.ECFR_VERSIONS_ERROR_MESSAGE
    if not regulation and not regulations_api_error and not historical_only:
        raise Http404

    return_url = valid_return_url(request)
    if section_nav:
        for direction in ('previous', 'next'):
            if section_nav.get(direction):
                section_nav[direction]['url'] = append_return_url(
                    section_nav[direction]['url'],
                    return_url,
                )

    return render(request, 'legal-regulation.jinja', {
        'results': {
            'regulations': [regulation] if regulation else [],
            'total_all': 1 if regulation or historical_only else 0,
        },
        'current_page': 1,
        'total_pages': 1,
        'total_count': 1 if regulation else 0,
        'limit': 20,
        'result_type': 'regulations',
        'query': '',
        'regulatory_citation': section,
        'is_browse': False,
        'legal_search_error': None,
        'legal_search_error_fields': [],
        'section': section,
        'regulation': regulation,
        'historical_only': historical_only,
        'reserved_label': reserved_label,
        'regulations_api_error': regulations_api_error,
        'section_nav': section_nav,
        'return_url': return_url,
        'timeline': timeline,
        'timeline_api_error': timeline_api_error,
        'historical_regulation_event_groups': regulation_history['event_groups'],
        'historical_redesignation_events': regulation_history['redesignation_events'],
        'social_image_identifier': 'legal',
    }, status=502 if regulations_api_error else 200)
