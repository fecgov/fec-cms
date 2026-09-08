"""Group the bundled E&J index and resolve previous-citation history."""

import json
import logging
import os
import re
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

    for conversion in conversions:
        conversion['previous_citations'] = previous_citation_links(
            conversion.get('related_section', '')
        )

    events = []
    seen_events = set()
    indexed_events = history.get('events', [])
    # Attach compound conversion targets to each actual subsection group.
    available_subsections = {
        event.get('subsection', '') for event in indexed_events
    }
    redesignations_by_subsection = {}
    for conversion in conversions:
        conversion['current_subsections'] = expand_current_subsection_targets(
            conversion.get('current_subsection', ''),
            available_subsections,
        )
        for current_subsection in conversion['current_subsections']:
            redesignations_by_subsection[current_subsection] = conversion

    for event in indexed_events:
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
            'label': event.get('subject') or 'Explanation and Justification',
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


def reciprocal_conversion_subject(
    section,
    history,
    current_subsections,
    previous_section,
    cited_subsection,
):
    """Use the starred subject to limit previews for reciprocal citation swaps."""
    if previous_section == section:
        return None

    previous_history = load_regulation_history(previous_section)
    previous_subsections = {
        event.get('subsection', '')
        for event in previous_history.get('events', [])
    }
    is_reciprocal = False
    for conversion in previous_history.get('conversions', []):
        targets = expand_current_subsection_targets(
            conversion.get('current_subsection', ''),
            previous_subsections,
        )
        if cited_subsection not in targets:
            continue
        cited_sections = {
            link['citation'].split('(', 1)[0]
            for link in previous_citation_links(
                conversion.get('related_section', '')
            )
        }
        if section in cited_sections:
            is_reciprocal = True
            break

    if not is_reciprocal:
        return None

    for event in history.get('events', []):
        subject = event.get('subject', '')
        if (
            event.get('subsection', '') in current_subsections
            and subject.lstrip().startswith('*')
        ):
            return normalize_history_subject(subject)
    return None


def earlier_citation_links(section, preview_targets):
    """Return link-only citations that precede a one-level history preview."""
    links = []
    seen_sections = set()
    for previous_section, cited_subsection, _ in preview_targets:
        previous_history = load_regulation_history(previous_section)
        available_subsections = {
            event.get('subsection', '')
            for event in previous_history.get('events', [])
        }
        for conversion in previous_history.get('conversions', []):
            targets = expand_current_subsection_targets(
                conversion.get('current_subsection', ''),
                available_subsections,
            )
            if cited_subsection not in targets:
                continue
            for citation in previous_citation_links(
                conversion.get('related_section', '')
            ):
                citation_section = citation['citation'].split('(', 1)[0]
                # Avoid following reciprocal citation swaps back to this page.
                if citation_section == section or citation_section in seen_sections:
                    continue
                seen_sections.add(citation_section)
                links.append({**citation, 'citation': citation_section})
    return links


def format_previous_citation_previews(section):
    """Preview immediate predecessors; still-earlier citations remain links."""
    previews = []
    history = load_regulation_history(section)
    available_subsections = {
        event.get('subsection', '') for event in history.get('events', [])
    }
    formatted_history = {}
    for conversion in history.get('conversions', []):
        current_subsections = expand_current_subsection_targets(
            conversion.get('current_subsection', ''),
            available_subsections,
        )
        preview_events = []
        preview_sections = []
        preview_targets = []
        history_citations = []
        seen_events = set()
        for citation in previous_citation_links(
            conversion.get('related_section', '')
        ):
            citation_match = REGULATION_CITATION_PATTERN.match(citation['citation'])
            if not citation_match:
                continue
            previous_section, previous_subsection = citation_match.groups()
            history_citations.append(citation)
            if previous_section not in preview_sections:
                preview_sections.append(previous_section)

            target = previous_history_targets(
                previous_section,
                citation['citation'],
            )
            if not target:
                continue
            cited_subsection, target_subsection = target
            preview_targets.append((
                previous_section,
                cited_subsection,
                target_subsection,
            ))

            subject_filter = reciprocal_conversion_subject(
                section,
                history,
                current_subsections,
                previous_section,
                cited_subsection,
            )
            # Match the destination page's group, including parent fallback.
            if previous_section not in formatted_history:
                formatted_history[previous_section] = (
                    format_historical_regulation_events(previous_section)
                )
            for event in formatted_history[previous_section]:
                if event.get('action') != 'E&J':
                    continue
                event_subsection = event.get('subsection', '')
                if event_subsection != target_subsection:
                    continue
                if (
                    subject_filter
                    and normalize_history_subject(event.get('label')) != subject_filter
                ):
                    continue
                event_identity = (
                    previous_section,
                    event_subsection,
                    event.get('date'),
                    event.get('label'),
                    event.get('source_url'),
                )
                if event_identity in seen_events:
                    continue
                seen_events.add(event_identity)
                preview_events.append({
                    'section': previous_section,
                    'date': event.get('date', ''),
                    'label': event.get('label') or 'Explanation and Justification',
                    'source_url': event.get('source_url'),
                    'subsection': event_subsection,
                })

        preview_events.sort(key=regulation_history_sort_key)

        earlier_citations = earlier_citation_links(section, preview_targets)

        # Keep a link when there is no history to expand.
        if not preview_events:
            continue

        previews.append({
            'current_subsection': conversion.get('current_subsection', ''),
            'current_subsections': current_subsections,
            'label': conversion.get('description') or 'Previous citation',
            'sections': preview_sections,
            'history_citations': history_citations,
            'events': preview_events,
            'earlier_citations': earlier_citations,
        })

    return previews


def attach_previous_citation_previews(groups, redesignation_events, previews):
    """Attach previews to E&J groups and return only unmatched redesignations."""
    previews_by_target = {
        (target, preview['label']): preview
        for preview in previews
        for target in preview.get(
            'current_subsections',
            [preview.get('current_subsection', '')],
        )
    }
    previews_by_conversion = {
        (preview.get('current_subsection', ''), preview['label']): preview
        for preview in previews
    }
    displayed_conversion_keys = set()
    for group in groups:
        redesignation = group.get('redesignation') or {}
        if not redesignation:
            continue
        conversion_identity = (
            redesignation.get('current_subsection', ''),
            redesignation.get('description'),
        )
        displayed_conversion_keys.add(conversion_identity)
        group['previous_citation_preview'] = previews_by_target.get((
            group.get('subsection', ''),
            redesignation.get('description'),
        ))

    unmatched_redesignations = []
    for event in redesignation_events:
        conversion_identity = (event.get('subsection', ''), event.get('label'))
        if conversion_identity in displayed_conversion_keys:
            continue
        event['previous_citation_preview'] = previews_by_conversion.get(
            conversion_identity
        )
        unmatched_redesignations.append(event)
    return groups, unmatched_redesignations


def build_regulation_history_context(section):
    """Prepare E&J groups and unattached redesignations for the page sidebar."""
    events = format_historical_regulation_events(section)
    ej_groups = group_historical_regulation_events([
        event for event in events if event.get('action') == 'E&J'
    ])
    redesignations = [
        event for event in events if event.get('action') == 'Redesignated'
    ]
    previews = format_previous_citation_previews(section)
    ej_groups, redesignations = attach_previous_citation_previews(
        ej_groups,
        redesignations,
        previews,
    )
    return {
        'events': events,
        'event_groups': ej_groups,
        'redesignation_events': redesignations,
    }
