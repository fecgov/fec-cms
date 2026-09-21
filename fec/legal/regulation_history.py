"""Group the bundled E&J index and resolve previous-citation history."""

import json
import logging
import os
import re
from collections import Counter
from functools import lru_cache

logger = logging.getLogger(__name__)

REGULATION_CITATION_PATTERN = re.compile(r'^(\d+\.\d+)((?:\([^)]+\))*)')
REGULATION_SUBSECTION_PATTERN = re.compile(r'\([^)]+\)')
REGULATION_HISTORY_PATH = os.path.join(
    os.path.dirname(__file__), 'data', 'regulation-history.json'
)
HISTORICAL_EJ_INDEX_FALLBACKS = {
    '3': (
        'https://www.fec.gov/legal-resources/regulations-and-rulemakings/'
        'explanations-and-justifications/citation-index-parts-1-8/'
    ),
    '8': (
        'https://www.fec.gov/legal-resources/regulations-and-rulemakings/'
        'explanations-and-justifications/citation-index-parts-1-8/'
    ),
    '142': (
        'https://www.fec.gov/legal-resources/regulations-and-rulemakings/'
        'explanations-and-justifications/citation-index-parts-140-146/'
    ),
}


@lru_cache(maxsize=1)
def load_regulation_history_index():
    try:
        with open(REGULATION_HISTORY_PATH, encoding='utf-8') as history_file:
            return json.load(history_file)
    except (OSError, ValueError):
        logger.exception("Unable to load regulation history")
        return {}


def load_regulation_history(section):
    """Load bundled E&J index records without fetching source documents."""
    return load_regulation_history_index().get(
        section,
        {'events': [], 'conversions': []},
    )


def regulation_history_sort_key(event):
    """Group E&Js by CFR citation, then order each group oldest first."""
    section_parts = tuple(
        (0, int(part)) if part.isdigit() else (1, part.lower())
        for part in re.split(r'(\d+)', event.get('section', ''))
        if part
    )
    subsection_parts = []
    roman_values = {
        'i': 1, 'v': 5, 'x': 10, 'l': 50,
        'c': 100, 'd': 500, 'm': 1000,
    }
    subsection = event.get('subsection', '')
    for depth, part in enumerate(re.findall(r'\(([^)]+)\)', subsection)):
        if part.isdigit():
            subsection_parts.append((0, int(part)))
        elif depth in (2, 5) and re.fullmatch(r'[ivxlcdm]+', part):
            total = 0
            previous = 0
            for character in reversed(part):
                value = roman_values[character]
                total += -value if value < previous else value
                previous = max(previous, value)
            subsection_parts.append((1, total))
        else:
            subsection_parts.append((2, part.lower()))

    date = event.get('date', '')
    return (
        section_parts,
        tuple(subsection_parts),
        int(date) if date.isdigit() else 9999,
    )


def historical_ej_anchor(section, subsection=''):
    citation = f'{section}{subsection}'
    slug = re.sub(r'[^a-zA-Z0-9]+', '-', citation).strip('-').lower()
    return f'historical-ej-{slug}'


def normalize_history_subject(subject):
    """Return a subject suitable for comparison across citation-index rows."""
    return re.sub(r'^[*\s]+', '', subject or '').strip().lower()


def closest_historical_ej_subsection(section, subsection):
    available = {
        event.get('subsection', '')
        for event in load_regulation_history_index().get(section, {}).get('events', [])
    }
    candidate = subsection
    while candidate and candidate not in available:
        candidate = re.sub(r'\([^)]+\)$', '', candidate)
    if candidate in available:
        return candidate
    return None


def previous_citation_links(related_section):
    """Turn a conversion-table citation string into ordered history links."""
    parts = re.split(r'\s*(;|&|\band\b)\s*', related_section.replace('*', ''))
    links = []
    transition = None
    previous_section = None
    previous_subsection = ''
    for part in parts:
        if part in (';', '&', 'and'):
            transition = 'then' if part == ';' else 'and'
            continue

        citation = part.strip()
        if not citation:
            continue
        match = REGULATION_CITATION_PATTERN.match(citation)
        if not match and previous_section and citation.startswith('('):
            # Conversion tables abbreviate sibling citations, for example
            # "100.7(b)(6) & (7)". Restore the shared parent before linking.
            parent = re.sub(r'\([^)]+\)$', '', previous_subsection)
            citation = f'{previous_section}{parent}{citation}'
            match = REGULATION_CITATION_PATTERN.match(citation)
        if not match:
            continue
        section, subsection = match.groups()
        previous_section = section
        previous_subsection = subsection

        remainder = citation[match.end():].strip()
        target_subsection = subsection
        if remainder:
            target_subsection = re.sub(r'\([^)]+\)$', '', subsection)
        target_subsection = closest_historical_ej_subsection(
            section,
            target_subsection,
        )
        if target_subsection is None:
            # Keep the citation navigable with a fallback.
            url = HISTORICAL_EJ_INDEX_FALLBACKS.get(
                section.split('.', 1)[0],
                f'/legal/regulations/{section}/',
            )
            external = url.startswith('https://')
        else:
            url = (
                f'/legal/regulations/{section}/'
                f'#{historical_ej_anchor(section, target_subsection)}'
            )
            external = False
        links.append({
            'citation': citation,
            'external': external,
            'transition': transition,
            'url': url,
        })
        transition = None
    return links


def expand_current_subsection_targets(subsection, available_subsections=()):
    """Expand conversion-table subsection lists and ranges into E&J groups."""
    subsection = (subsection or '').strip()
    if not subsection:
        return ['']

    available = set(available_subsections)
    range_match = re.fullmatch(
        r'((?:\([^)]+\))+)[ ]*-[ ]*((?:\([^)]+\))+)',
        subsection,
    )
    if range_match:
        start, abbreviated_end = range_match.groups()
        start_parts = REGULATION_SUBSECTION_PATTERN.findall(start)
        end_parts = REGULATION_SUBSECTION_PATTERN.findall(abbreviated_end)
        if len(end_parts) < len(start_parts):
            end_parts = start_parts[:-len(end_parts)] + end_parts
        end = ''.join(end_parts)
        candidates = [
            candidate for candidate in available
            if len(REGULATION_SUBSECTION_PATTERN.findall(candidate)) == len(start_parts)
            and REGULATION_SUBSECTION_PATTERN.findall(candidate)[:-1] == start_parts[:-1]
        ]
        candidates.extend([start, end])
        ordered = sorted(
            set(candidates),
            key=lambda candidate: regulation_history_sort_key({
                'section': '0.0',
                'subsection': candidate,
            }),
        )
        start_index = ordered.index(start)
        end_index = ordered.index(end)
        lower, upper = sorted((start_index, end_index))
        return ordered[lower:upper + 1]

    parts = re.split(r'\s*(?:,|&|\band\b)\s*', subsection)
    targets = []
    previous_parts = []
    for part in parts:
        part_parts = REGULATION_SUBSECTION_PATTERN.findall(part)
        if not part_parts:
            continue
        if previous_parts and len(part_parts) < len(previous_parts):
            part_parts = previous_parts[:-len(part_parts)] + part_parts
        target = ''.join(part_parts)
        if target not in targets:
            targets.append(target)
        previous_parts = part_parts
    return targets or [subsection]


def group_historical_regulation_events(events):
    groups = []
    for event in events:
        citation = (event.get('section', ''), event.get('subsection', ''))
        if not groups or groups[-1]['citation'] != citation:
            groups.append({
                'citation': citation,
                'section': citation[0],
                'subsection': citation[1],
                'anchor_id': historical_ej_anchor(*citation),
                'redesignation': event.get('redesignation'),
                'events': [],
            })
        elif not groups[-1]['redesignation'] and event.get('redesignation'):
            groups[-1]['redesignation'] = event['redesignation']
        groups[-1]['events'].append(event)
    return groups


def format_historical_regulation_events(section):
    history = load_regulation_history(section)
    conversions = [dict(item) for item in history.get('conversions', [])]

    # Each conversion table row maps a current citation to its earlier citation(s).
    for conversion in conversions:
        conversion['previous_citations'] = previous_citation_links(
            conversion.get('related_section', '')
        )
        if conversion.get('previous_ej_unavailable'):
            for citation in conversion['previous_citations']:
                citation['ej_unavailable'] = True

    events = []
    seen_events = set()
    indexed_events = history.get('events', [])
    # Keep a multi-subsection conversion together instead of repeating it
    # beside every E&J in the range.
    available_subsections = {
        event.get('subsection', '') for event in indexed_events
    }
    redesignations_by_subsection = {}
    for conversion in conversions:
        conversion['current_subsections'] = expand_current_subsection_targets(
            conversion.get('current_subsection', ''),
            available_subsections,
        )
        if len(conversion['current_subsections']) > 1:
            continue
        for current_subsection in conversion['current_subsections']:
            redesignations_by_subsection[current_subsection] = conversion

    for event in indexed_events:
        subject = event.get('subject') or 'Explanation and Justification'
        event_identity = (
            event.get('action', 'E&J'),
            event.get('year'),
            event.get('subsection', ''),
            event.get('source_url') or history.get('source_url'),
            normalize_history_subject(event.get('subject')),
        )
        if event_identity in seen_events:
            continue
        seen_events.add(event_identity)
        events.append({
            'action': event.get('action', 'E&J'),
            'date': str(event['year']) if event.get('year') else '',
            'section': section,
            'subsection': event.get('subsection', ''),
            'label': subject,
            'has_previous_citation': subject.lstrip().startswith('*'),
            'redesignation': redesignations_by_subsection.get(
                event.get('subsection', '')
            ),
            'source_url': event.get('source_url') or history.get('source_url'),
        })

    for conversion in conversions:
        description = conversion.get('description') or ''
        events.append({
            'action': conversion.get('action', 'Citation change'),
            'date': str(conversion['year']) if conversion.get('year') else '',
            'section': section,
            'subsection': conversion.get('current_subsection', ''),
            'label': description,
            'previous_citations': conversion.get('previous_citations', []),
            'source_url': conversion.get('source_url'),
        })

    # Match the citation index: parent cite, nested subsections, then oldest E&J.
    return sorted(events, key=regulation_history_sort_key)


def previous_history_targets(previous_section, citation):
    """Resolve a former citation to the group displayed on its history page."""
    match = REGULATION_CITATION_PATTERN.match(citation)
    if not match:
        return None

    _, cited_subsection = match.groups()
    history_subsection = cited_subsection
    if citation[match.end():].strip():
        # Descriptive text after a citation refers to its parent provision.
        history_subsection = re.sub(r'\([^)]+\)$', '', history_subsection)
    history_subsection = closest_historical_ej_subsection(
        previous_section,
        history_subsection,
    )
    return cited_subsection, history_subsection


@lru_cache(maxsize=1)
def reverse_citation_changes():
    """Find newer citations to display on each former citation's E&J page."""
    changes = {}
    for current_section, history in load_regulation_history_index().items():
        for conversion in history.get('conversions', []):
            current_subsection = conversion.get('current_subsection', '')
            destination = {
                'citation': f'{current_section}{current_subsection}',
                'display_citation': re.sub(
                    r'(?<=\))\s*-\s*(?=\()',
                    '–',
                    f'{current_section}{current_subsection}',
                ),
                'source_url': conversion.get('source_url'),
                'url': (
                    f'/legal/regulations/{current_section}/'
                    f'#{historical_ej_anchor(current_section, current_subsection)}'
                ),
            }
            for previous_citation in previous_citation_links(
                conversion.get('related_section', '')
            ):
                match = REGULATION_CITATION_PATTERN.match(
                    previous_citation['citation']
                )
                if not match:
                    continue
                previous_section = match.group(1)
                target = previous_history_targets(
                    previous_section,
                    previous_citation['citation'],
                )
                # §100.7(b)(17)(vi) may link to its parent E&J at §100.7(b)(17),
                # but only the exact former citation gets a "Later citation" label.
                if not target or target[1] != target[0]:
                    continue
                key = (previous_section, target[1])
                destinations = changes.setdefault(key, [])
                if destination not in destinations:
                    destinations.append(destination)
    return changes


def build_regulation_history_context(section):
    """Group E&Js and citation changes under the citations they describe."""
    events = format_historical_regulation_events(section)
    ej_groups = group_historical_regulation_events([
        event for event in events if event.get('action') == 'E&J'
    ])
    redesignations = [
        event for event in events if event.get('action') == 'Redesignated'
    ]
    reverse_changes = reverse_citation_changes()
    for group in ej_groups:
        # The index asterisk marks an affected E&J; the conversion table
        # supplies the actual earlier/later citation relationship.
        group['show_event_citation_changes'] = any(
            event.get('has_previous_citation') and event.get('redesignation')
            for event in group['events']
        )
        for event in group['events']:
            if event.get('has_previous_citation'):
                event['label'] = re.sub(r'^\s*\*\s*', '', event['label'])
        destinations = reverse_changes.get(group['citation'], [])
        if destinations:
            for event in group['events']:
                if event.get('has_previous_citation') and not event.get('redesignation'):
                    event['redesignated_as'] = destinations

    section_group = next(
        (group for group in ej_groups if not group.get('subsection')),
        None,
    )
    top_level_mappings = [
        {
            'current_citation': f"{section}{event['subsection']}",
            'current_subsection': event['subsection'],
            'previous_citations': event.get('previous_citations', []),
        }
        for event in redesignations
        if event.get('subsection')
        and (
            '-' in event['subsection']
            or len(REGULATION_SUBSECTION_PATTERN.findall(event['subsection'])) == 1
        )
    ]
    referenced_event = next((
        event for event in section_group.get('events', [])
        if event.get('has_previous_citation') and not event.get('redesignation')
    ), None) if section_group else None
    if referenced_event and top_level_mappings:
        # The section-level E&J summarizes changes that are detailed on its
        # subsection records, so avoid repeating those earlier citations.
        referenced_event['label'] = re.sub(r'^\s*\*\s*', '', referenced_event['label'])
        referenced_event['citation_change_summary'] = {
            'mappings': top_level_mappings,
            'source_url': redesignations[0].get('source_url'),
        }

        for mapping in top_level_mappings:
            mapping['anchor_id'] = historical_ej_anchor(
                section, mapping['current_subsection']
            )
        referenced_event['citation_change_summary']['links_to_subsections'] = True

    # When several conversions name one citation, list them together instead
    # of attaching only the last one to its E&J record.
    conversion_counts = Counter(event['subsection'] for event in redesignations)
    for group in ej_groups:
        if conversion_counts[group['subsection']] > 1:
            group['redesignation'] = None
            for event in group['events']:
                event['redesignation'] = None

    displayed_conversions = {
        (
            group['redesignation'].get('current_subsection', ''),
            group['redesignation'].get('description'),
        )
        for group in ej_groups if group.get('redesignation')
    }
    # Keep conversion rows visible when no E&J group displays them.
    unmatched_redesignations = [
        event for event in redesignations
        if (event.get('subsection', ''), event.get('label'))
        not in displayed_conversions
    ]

    groups_by_subsection = {group['subsection']: group for group in ej_groups}
    for event in unmatched_redesignations:
        subsection = event.get('subsection', '')
        group = groups_by_subsection.get(subsection)
        if group is None:
            group = {
                'citation': (section, subsection),
                'section': section,
                'subsection': subsection,
                'anchor_id': historical_ej_anchor(section, subsection),
                'redesignation': None,
                'events': [],
            }
            groups_by_subsection[subsection] = group
            ej_groups.append(group)
        group.setdefault('additional_redesignations', []).append(event)

    ej_groups.sort(key=lambda group: regulation_history_sort_key(group))

    return {
        'events': events,
        'event_groups': ej_groups,
    }
