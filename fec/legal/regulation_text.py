"""Transform eCFR section HTML and version metadata for the regulation reader."""

import datetime
import html
import re
from urllib.parse import urlsplit, urlunsplit

from bs4 import BeautifulSoup, Comment, NavigableString

ECFR_COMPARE_START_DATE = '2017-01-03'


def ecfr_compare_path(ancestry, section):
    # eCFR compare URLs require the full hierarchy path, not just the section.
    path_parts = []
    for ancestor in ancestry.get('ancestors', []):
        node_type = ancestor.get('type')
        identifier = ancestor.get('identifier')
        if not node_type or not identifier:
            continue
        path_parts.append(f"{node_type}-{identifier}")

    if not path_parts:
        return f"title-11/section-{section}"

    return '/'.join(path_parts)


def is_safe_ecfr_link(href):
    """Reject executable schemes and browser-ambiguous relative URLs."""
    if not href or re.search(r'[\\\x00-\x20]', href):
        return False
    try:
        url = urlsplit(href)
        return (
            url.scheme in ('http', 'https') and bool(url.hostname)
            or not url.scheme and not url.netloc and href.startswith(('/', '#'))
            and not href.startswith('//')
        )
    except ValueError:
        return False


def regulation_link(href):
    """Keep Title 11 links local; other CFR links stay on eCFR."""
    if not is_safe_ecfr_link(href):
        return None
    url = urlsplit(href)
    if url.hostname not in (None, 'ecfr.gov', 'www.ecfr.gov'):
        return href
    if not url.path.startswith('/current/title-'):
        return href
    nodes = dict(re.findall(r'/([a-z]+)-([\w.]+)(?=/|$)', url.path))
    path = None
    if nodes.get('title') == '11':
        if 'section' in nodes:
            path = f"/legal/regulations/{nodes['section']}/"
        elif 'part' in nodes:
            path = f"/legal/regulations/part/{nodes['part']}/"
            if 'subpart' in nodes:
                path += f"subpart/{nodes['subpart']}/"
        elif 'subchapter' in nodes:
            path = f"/legal/regulations/subchapter/{nodes['subchapter']}/"
    return urlunsplit(('', '', path, url.query, url.fragment)) if path else urlunsplit(
        ('https', 'ecfr.gov', url.path, url.query, url.fragment)
    )


def ecfr_html_inner_html(element, preserve_links=False):
    """Keep the inline formatting used by eCFR and escape everything else."""
    pieces = []
    for child in element.children:
        if isinstance(child, Comment) or child.name in ('script', 'style', 'svg'):
            continue
        if isinstance(child, NavigableString):
            pieces.append(html.escape(str(child)))
            continue

        child_html = ecfr_html_inner_html(child, preserve_links=preserve_links)
        tag = {'i': 'em', 'b': 'strong'}.get(child.name, child.name)
        if tag in ('em', 'strong', 'sup', 'sub'):
            pieces.append(f'<{tag}>{child_html}</{tag}>')
        elif child.name == 'a' and preserve_links and child.get('href'):
            href = regulation_link(child['href'])
            if not href:
                pieces.append(child_html)
                continue
            href = html.escape(str(href), quote=True)
            pieces.append(f'<a href="{href}">{child_html}</a>')
        else:
            pieces.append(child_html)
    return ''.join(pieces).strip()


def ecfr_paragraph_level(text, previous_level=0):
    """Map eCFR paragraph markers to their visual nesting level."""
    markers = re.match(r'^\s*((?:\([^)]*\)\s*)+)', text or '')
    if not markers:
        return 0

    level = 0
    for marker in re.findall(r'\(([^)]*)\)', markers.group(1)):
        marker = marker.strip().lower()
        if marker.isdigit():
            level = max(level, 2)
        elif (
            len(marker) > 1 and re.fullmatch(r'[ivxlcdm]+', marker)
        ) or (marker == 'i' and previous_level == 2):
            level = max(level, 3)
        else:
            level = max(level, 1)
    return level


def extract_statutory_citations(elements):
    """Expand grouped U.S. Code cites and retain their source section links."""
    provision = r'\d+[A-Za-z-]*(?:\([^)]+\))*(?![\w-]|\s+(?:C\.?F\.?R|U\.?S\.?C))'
    token = rf'(?:{provision}|(?:\([^)]+\))+)'
    separator = r'(?:,\s*(?:and\s+)?|\s+and\s+)'
    pattern = re.compile(rf'(\d+)\s+U\.S\.C\.\s+§?\s*({provision}(?:\s*{separator}{token})*)')
    citations = {}
    for element in elements:
        text = re.sub(r'\s+', ' ', element.get_text(' ', strip=True))
        for group in pattern.finditer(text):
            title, provisions = group.groups()
            tokens = re.findall(token, provisions)
            first_section = re.match(r'\d+[A-Za-z-]*', tokens[0]).group()
            anchor = next((
                link for link in element.find_all('a', href=True)
                if re.search(
                    rf'\b{title}\s+U\.S\.C\.\s+§?\s*{re.escape(first_section)}\b',
                    link.get_text(' ', strip=True),
                )
            ), None)
            source_url = anchor.get('href') if anchor else None
            if not is_safe_ecfr_link(source_url):
                source_url = None
            section = first_section
            for value in tokens:
                if value.startswith('('):
                    value = section + value
                else:
                    section = re.match(r'\d+[A-Za-z-]*', value).group()
                label = f'{title} U.S.C. {value}'
                url = source_url
                if url:
                    # govinfo supports both PDF paths and stable section links.
                    url = re.sub(r'(sec)\d+[A-Za-z-]*(?=\.pdf)', rf'\g<1>{section}', url)
                    url = re.sub(
                        r'(/uscode/\d+/)\d+[A-Za-z-]*(?=[?#]|$)',
                        rf'\g<1>{section}', url, flags=re.IGNORECASE,
                    )
                if label not in citations or (url and not citations[label]['url']):
                    citations[label] = {'label': label, 'url': url}
    return list(citations.values())


def format_ecfr_html_section(section_html, section):
    """Extract one section from the canonical eCFR HTML reader page."""
    if not section_html:
        return None

    soup = BeautifulSoup(section_html, 'html.parser')

    # The reader page contains metadata in addition to the section text.
    issue_date = None
    issue_date_match = re.search(
        r'up to date as of\s+(\d{1,2}/\d{1,2}/\d{4})',
        soup.get_text(' ', strip=True),
        re.IGNORECASE,
    )
    if issue_date_match:
        issue_date = datetime.datetime.strptime(
            issue_date_match.group(1), '%m/%d/%Y'
        ).date().isoformat()

    section_container = soup.find(id=section) or soup.find(id=f'section-{section}')
    heading = section_container
    if heading is not None and heading.name not in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
        heading = section_container.find(
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            string=re.compile(rf'§\s*{re.escape(section)}'),
        )
    if heading is None:
        heading = soup.find(
            lambda tag: tag.name in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6')
            and re.search(
                rf'§\s*{re.escape(section)}(?:\s|$)',
                tag.get_text(' ', strip=True),
            )
        )
    if heading is None:
        return None

    container = section_container or heading.find_parent(
        lambda tag: tag.name in ('div', 'section', 'article')
        and any('section' in name.lower() for name in (tag.get('class') or []))
    ) or heading.parent
    statutory_citations = extract_statutory_citations([heading, *container.find_all(['p', 'li'])])
    # Preserve eCFR paragraph IDs and indentation so anchors remain usable locally.
    body = []
    previous_paragraph_level = 0
    for paragraph in container.find_all('p'):
        paragraph_html = ecfr_html_inner_html(paragraph, preserve_links=True)
        if paragraph_html:
            marker_match = re.match(
                r'^\s*((?:\(\s*[^)]+\s*\)\s*)+)',
                paragraph.get_text(' ', strip=True),
            )
            subsection_marker = (
                re.sub(r'\s+', '', marker_match.group(1))
                if marker_match else None
            )
            paragraph_wrapper = paragraph.find_parent(
                'div', id=re.compile(rf'^p-{re.escape(section)}')
            )
            paragraph_id = paragraph_wrapper.get('id') if paragraph_wrapper else (
                f'p-{section}{subsection_marker}'
                if subsection_marker else None
            )
            indent_class = next(
                (
                    class_name for class_name in paragraph.get('class', [])
                    if re.fullmatch(r'indent-\d+', class_name)
                ),
                None,
            )
            paragraph_level = (
                int(indent_class.split('-', 1)[1])
                if indent_class else ecfr_paragraph_level(
                    paragraph.get_text(' ', strip=True),
                    previous_level=previous_paragraph_level,
                )
            )
            previous_paragraph_level = paragraph_level
            paragraph_class = (
                f' class="legal-regulation__paragraph '
                f'legal-regulation__paragraph--level-{paragraph_level}"'
                if paragraph_level else ' class="legal-regulation__paragraph"'
            )
            id_attribute = (
                f' id="{html.escape(paragraph_id, quote=True)}"'
                if paragraph_id else ''
            )
            body.append(f'<p{paragraph_class}{id_attribute}>{paragraph_html}</p>')

    if not body:
        return None

    return {
        'no': section,
        'heading': ecfr_html_inner_html(heading),
        'heading_text': heading.get_text(' ', strip=True),
        'body': body,
        'issue_date': issue_date,
        'ecfr_url': f"https://www.ecfr.gov/current/title-11/section-{section}",
        'statutory_citations': statutory_citations,
    }


def format_ecfr_timeline(versions_response, ancestry, section):
    # Non-substantive eCFR versions do not represent a regulatory change.
    versions = [
        version for version in versions_response.get('content_versions', [])
        if version.get('substantive')
    ]
    # eCFR only exposes version metadata; derive display labels from its flags.
    sorted_versions = sorted(versions, key=lambda version: version.get('issue_date') or '')
    latest_issue_date = next(
        (
            version.get('issue_date')
            for version in reversed(sorted_versions)
            if version.get('issue_date')
        ),
        None,
    )
    earliest_issue_date = next(
        (
            version.get('issue_date')
            for version in sorted_versions
            if version.get('issue_date')
        ),
        None,
    )
    compare_path = ecfr_compare_path(ancestry, section)
    timeline = []

    for version in sorted_versions:
        issue_date = version.get('issue_date')
        if issue_date == latest_issue_date:
            action = 'Current version'
        elif issue_date == earliest_issue_date:
            action = 'Earliest available version'
        elif version.get('removed'):
            action = 'Removed'
        elif version.get('substantive'):
            action = 'Amended'
        else:
            action = 'Technical update'

        timeline.append({
            'action': action,
            'amendment_date': version.get('amendment_date'),
            'compare_url': (
                f"https://www.ecfr.gov/compare/current/to/{issue_date}/{compare_path}"
                if (
                    issue_date
                    and issue_date >= ECFR_COMPARE_START_DATE
                    and issue_date != latest_issue_date
                ) else None
            ),
            'historical_url': (
                f"https://www.ecfr.gov/on/{issue_date}/{compare_path}"
                if (
                    issue_date == earliest_issue_date
                    and earliest_issue_date != latest_issue_date
                ) else None
            ),
            'issue_date': issue_date,
            'name': version.get('name'),
            'removed': version.get('removed'),
            'substantive': version.get('substantive'),
        })

    return list(reversed(timeline))
