"""Build the regulation history index from FEC CMS HTML pages.

Read citation indexes and conversion tables, without downloading their PDFs.

Usage:
    python manage.py import_regulation_history --dry-run
    python manage.py import_regulation_history
"""

import json
import re
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand


FEC_BASE_URL = 'https://www.fec.gov'
OUTPUT_PATH = 'legal/data/regulation-history.json'
HISTORY_PAGE_PATH = (
    '/legal-resources/regulations-and-rulemakings/'
    'explanations-and-justifications/'
)

# These pages are the FEC's maintained HTML citation indexes for Title 11.
CITATION_INDEX_URLS = [
    f'{HISTORY_PAGE_PATH}citation-index-parts-1-8/',
    f'{HISTORY_PAGE_PATH}citation-index-part-100/',
    f'{HISTORY_PAGE_PATH}citation-index-parts-101-102/',
    f'{HISTORY_PAGE_PATH}citation-index-parts-103-104/',
    f'{HISTORY_PAGE_PATH}citation-index-parts-105-106-108/',
    f'{HISTORY_PAGE_PATH}citation-index-part-109/',
    f'{HISTORY_PAGE_PATH}citation-index-part-110/',
    f'{HISTORY_PAGE_PATH}citation-index-part-111/',
    f'{HISTORY_PAGE_PATH}citation-index-parts-112-113/',
    f'{HISTORY_PAGE_PATH}citation-index-parts-114-115-116/',
    f'{HISTORY_PAGE_PATH}citation-index-parts-200-201/',
    f'{HISTORY_PAGE_PATH}citation-index-part-300/',
    f'{HISTORY_PAGE_PATH}citation-index-part-400/',
    f'{HISTORY_PAGE_PATH}citation-index-parts-140-146/',
    f'{HISTORY_PAGE_PATH}citation-index-parts-9001-9004/',
    f'{HISTORY_PAGE_PATH}citation-index-parts-9005-9007-9012/',
    f'{HISTORY_PAGE_PATH}citation-index-parts-107-120-125/',
    f'{HISTORY_PAGE_PATH}citation-index-part-9008/',
    f'{HISTORY_PAGE_PATH}citation-index-parts-130-134/',
    f'{HISTORY_PAGE_PATH}citation-index-parts-9031-9039/',
]

CONVERSION_TABLE_URLS = [
    f'{HISTORY_PAGE_PATH}explanations-and-justifications-conversion-tables-appendix-parts-1-8/',
    f'{HISTORY_PAGE_PATH}explanations-and-justifications-conversion-tables-appendix-part-100/',
    f'{HISTORY_PAGE_PATH}explanations-and-justifications-conversion-tables-appendix-parts-102-109/',
    f'{HISTORY_PAGE_PATH}explanations-and-justifications-conversion-tables-appendix-parts-110-300/',
    f'{HISTORY_PAGE_PATH}explanations-and-justifications-conversion-tables-appendix-parts-9002-9008/',
    f'{HISTORY_PAGE_PATH}explanations-and-justifications-conversion-tables-appendix-parts-9032-9038/',
]


def table_rows(table, column_count):
    """Return normalized text for rows with the expected number of columns."""
    rows = []
    for row in table.select('tr'):
        cells = row.find_all(['td', 'th'])
        if len(cells) < column_count:
            continue
        rows.append([
            cell.get_text(' ', strip=True)
            for cell in cells[:column_count]
        ])
    return rows


def parse_citation_index(html, source_url):
    """Return section history records from one FEC citation-index page."""
    soup = BeautifulSoup(html, 'html.parser')
    records = {}
    current_section = None
    current_subject = ''
    current_subsection = ''

    for row in soup.select('table tr'):
        cells = row.find_all(['td', 'th'])
        if len(cells) < 4:
            continue

        citation = cells[0].get_text(' ', strip=True)
        subsection = cells[1].get_text(' ', strip=True)
        subject = cells[2].get_text(' ', strip=True)
        year = cells[3].get_text(' ', strip=True)

        if re.fullmatch(r'\d+(?:\.\d+)?[A-Za-z0-9-]*', citation):
            current_section = citation
            current_subject = subject if subject != '-' else ''
            current_subsection = subsection if subsection != '-' else ''
        elif citation not in ('', '-'):
            continue

        if not current_section or not re.fullmatch(r'\d{4}', year):
            continue

        if subject not in ('', '-'):
            current_subject = subject
        if subsection not in ('', '-'):
            current_subsection = subsection

        # Inherit a blank subject, but keep the asterisk on its original row.
        record_subject = current_subject
        if subject in ('', '-'):
            record_subject = re.sub(r'^\*\s*', '', record_subject)

        year_link = cells[3].find('a', href=True)
        record_url = urljoin(source_url, year_link['href']) if year_link else source_url
        record_key = (current_section, current_subsection, year, record_url, record_subject)
        records[record_key] = {
            'section': current_section,
            'subsection': current_subsection,
            'year': int(year),
            'action': 'E&J',
            'subject': record_subject,
            'source_url': record_url,
        }

    return list(records.values())


def correct_dropped_trailing_zero(current, previous_current, next_current):
    """Restore a trailing zero when adjacent rows establish the sequence."""
    citations = [
        re.fullmatch(r'(\d+)\.(\d+)', citation or '')
        for citation in (previous_current, current, next_current)
    ]
    if not all(citations):
        return current

    previous_match, current_match, next_match = citations
    parts = {
        previous_match.group(1),
        current_match.group(1),
        next_match.group(1),
    }
    candidate = int(f'{current_match.group(2)}0')
    if (
        len(parts) == 1
        and int(previous_match.group(2)) == candidate - 1
        and int(next_match.group(2)) == candidate + 1
    ):
        return f'{current_match.group(1)}.{candidate}'
    return current


def parse_conversion_table(html, source_url):
    """Return current-to-previous citation relationships from HTML tables."""
    soup = BeautifulSoup(html, 'html.parser')
    conversions = {}

    for table in soup.select('table'):
        current_section = None
        rows = table_rows(table, 3)

        next_citations = [None] * len(rows)
        next_citation = None
        for index in range(len(rows) - 1, -1, -1):
            next_citations[index] = next_citation
            if re.fullmatch(r'\d+\.\d+', rows[index][0]):
                next_citation = rows[index][0]

        previous_citation = None
        for index, (current, subsection, previous) in enumerate(rows):
            if current not in ('', '-'):
                if not re.fullmatch(r'\d+\.\d+', current):
                    current_section = None
                    continue
                current = correct_dropped_trailing_zero(
                    current,
                    previous_citation,
                    next_citations[index],
                )
                previous_citation = current

            if current and current != '-':
                current_section = current
            if not current_section or not previous or previous == '-':
                continue
            if 'no e&j' in previous.lower():
                previous = re.split('no e&j', previous, flags=re.IGNORECASE)[0].strip(' ,;')
            if not previous or previous == '-':
                continue

            current_citation = current_section
            if subsection and subsection != '-':
                current_citation = f'{current_citation}{subsection}'
            if current_citation == previous:
                continue

            conversions.setdefault(current_section, []).append({
                'action': 'Redesignated',
                'current_subsection': subsection if subsection != '-' else '',
                'related_section': previous,
                'description': format_previous_citations(previous),
                'source_url': source_url,
            })

    return conversions


def format_previous_citations(previous):
    """Present multiple former citations as a chronological sequence."""
    citations = [
        citation.strip().rstrip('*')
        for citation in previous.split(';')
        if citation.strip()
    ]
    return 'Previously cited at § ' + ', then § '.join(citations)


def merge_history(records, conversions=None):
    """Group records by section and keep events in chronological order."""
    history = {}
    for section, events in records.items():
        history[section] = {
            'events': sorted(events, key=lambda event: (event['year'], event['source_url'])),
            'conversions': (conversions or {}).get(section, []),
        }
    for section, section_conversions in (conversions or {}).items():
        history.setdefault(section, {'events': [], 'conversions': section_conversions})
    return dict(sorted(history.items()))


class Command(BaseCommand):
    help = 'Build regulation history from FEC citation-index HTML pages'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')
        parser.add_argument('--output', default=OUTPUT_PATH)
        parser.add_argument('--timeout', type=int, default=30)

    def handle(self, *args, **options):
        output_path = options['output']
        timeout = options['timeout']
        session = requests.Session()
        session.headers.update({'User-Agent': 'FEC CMS regulation history importer'})
        records = {}
        conversions = {}

        for url_path in CITATION_INDEX_URLS:
            source_url = urljoin(FEC_BASE_URL, url_path)
            self.stdout.write(f'Fetching {source_url}')
            response = session.get(source_url, timeout=timeout)
            response.raise_for_status()
            for event in parse_citation_index(response.text, source_url):
                section = event.pop('section')
                records.setdefault(section, []).append(event)

        for url_path in CONVERSION_TABLE_URLS:
            source_url = urljoin(FEC_BASE_URL, url_path)
            self.stdout.write(f'Fetching {source_url}')
            response = session.get(source_url, timeout=timeout)
            response.raise_for_status()
            for section, section_conversions in parse_conversion_table(
                response.text, source_url
            ).items():
                conversions.setdefault(section, []).extend(section_conversions)

        history = merge_history(records, conversions)
        event_count = sum(len(value['events']) for value in history.values())
        conversion_count = sum(len(value['conversions']) for value in history.values())
        self.stdout.write(
            f'Found {len(history)} sections, {event_count} E&J events, '
            f'and {conversion_count} redesignations'
        )

        if options['dry_run']:
            self.stdout.write(self.style.WARNING('Dry run: no file written'))
            return

        with open(output_path, 'w', encoding='utf-8') as history_file:
            json.dump(history, history_file, indent=2)
            history_file.write('\n')
        self.stdout.write(self.style.SUCCESS(f'Wrote {output_path}'))
