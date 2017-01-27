import json
from datetime import datetime
from operator import attrgetter
from typing import Callable, List, NamedTuple, Tuple
from urllib.parse import urljoin, urlparse

import requests
from django.core.management import BaseCommand  # type: ignore
from lxml.html import fromstring, tostring, Element  # type: ignore

"""
This script scrapes <www.fec.gov>'s Tips for Treasurers content and outputs a
JSON array containing one object literal per individual tip.

Steps:

#.  From a starting URL, follows appropriate links to find more links to pages
    containing tips.
#.  Given a list of pages containing tips:

    #.  Parses HTML from those pages to find tip content.
    #.  Alters the content of ``a`` element ``href`` attributes to turn
        relative URLs into fully-qualified URLs.
        Also removes known broken URLs and replaces them with working ones.
    #.  Can optionally check URLs in order to build a list of broken ones.
    #.  Extracts tip dates, titles, URLs, and content from the parsed HTML.
    #.  Creates ``Tip`` objects from that data.
    #.  Returns a list of ``Tip`` objects.
#.  Serializes the list of ``Tip`` objects to JSON.
    Optionally also seriliazes the list of broken URLs to JSON.
"""

Tip = NamedTuple(
    "Tip",
    [
        ("body", str),  # HTML
        ("previous_url", str),  # URL
        ("posted_date", str),  # ISO 8601 date, such as "2016-12-13"
        ("title_text", str),  # HTML
    ])
Tips = List[Tip]

"""
The following are URLs I identified as broken in the first pass and found
working equivalents of, so during the "write fully-qualified URLs" stage the
script replaces the broken ones with the working equivalents.
"""
urls_to_change = {
    "http://www.fec.gov/aos/2006/ao2006-24final.pdf":
    "http://saos.fec.gov/saos/aonum.jsp?AONUM=2006-24",

    "https://webforms.fec.gov/form6/":
    "https://webforms.fec.gov/onlinefiling/form6/login.htm",

    "https://webforms.fec.gov/form24/":
    "https://webforms.fec.gov/onlinefiling/form24/login.htm",

    "http://www.fec.gov/aos/2006/ao2006-26final.pdf":
    "http://saos.fec.gov/saos/aonum.jsp?AONUM=2006-26",

    "".join([
        "http://a257.g.akamaitech.net/7/257/2422/01jan20061800/",
        "edocket.access.gpo.gov/2006/pdf/06-7297.pdf"]):
    "https://www.gpo.gov/fdsys/pkg/FR-2006-08-31/pdf/06-7297.pdf",

    "".join(["http://a257.g.akamaitech.net/7/257/2422/01jan20061800/",
             "edocket.access.gpo.gov/2006/pdf/E6-14183.pdf"]):
    "https://www.gpo.gov/fdsys/pkg/FR-2006-08-28/pdf/E6-14183.pdf",

    "https://webforms.fec.gov/wfja/form6":
    "https://webforms.fec.gov/onlinefiling/form6/login.htm"
}


class Command(BaseCommand):
    help = "Scrapes Tips for Treasusers pages from fec.gov into JSON"
    requires_system_checks = True

    def handle(self, *args: list, **options: dict) -> None:
        cli_main()


def cli_main() -> None:
    base_url = "http://www.fec.gov/info/TipsforTreasurers.shtml"
    _, archive_urls = extract_archive_urls(base_url)
    tips, broken_links = extract_tips(archive_urls, urls_to_change)
    write_tips(tips, broken_links)


def extract_archive_urls(base_url: str, archive_urls: List[str]=[],
                         visited: List[str]=[]) -> Tuple[List[str], List[str]]:
    """
    Identifies the list on the base_url page, then follows the links from that,
    looking for more links.

    (The full list of URLs isn't available on any one page and has to be
    collated from several sources.)

    Each of the URLs can itself contain more links to more URLs, which is why
    we need both ``archive_urls`` and ``visited``.

    Recursively calls itself, removing from the ``archive_urls`` list and
    adding to the ``visited`` list, while each pass adds to ``archive_urls``,
    until each URL has been added.

    :arg str base_url: The URL for the starting point.
    :arg list[str] archive_urls: List of URLs of "archive" pages, i.e. pages
        containing Tips for Treasurers and/or links to Tips for Treasurers
        pages.
    :arg list[str] visited: List of URLs that the script has acquired from the
        various pages. When done, this holds the full list of unique URLs to
        read Tips for Treasurers from.

    :rtype: tuple[list, list]
    :returns: A pair of lists, the first of which should be empty when the last
        iteration of the function is done.

    Impure
        Requests content from the URLs.
    Side effects
        Makes HTTP requests.
    """
    base_response = requests.get(base_url)
    base_content = base_response.content
    base_html = fromstring(base_content)

    # Check for ``li`` elements containing ``a`` elements whose ``href``
    # properties, lower-cased, contain "tipsarchive":
    links = base_html.xpath("//li/a")
    tip_links = [link for link in links if "tipsarchive" in
                 link.attrib["href"].lower()]
    tip_urls = [urljoin(base_url, link.attrib["href"]) for link in tip_links]

    # Add the URLs from the first page:
    for tip_url in tip_urls:
        # Since we're grabbing the entire page, we strip fragments.
        parsed = urlparse(tip_url)
        bare = "%s://%s%s" % (parsed.scheme, parsed.netloc, parsed.path)
        if bare not in archive_urls:
            archive_urls.append(bare)

    # Recursively go through the other pages:
    while archive_urls:
        next_url = archive_urls.pop()
        if next_url not in visited:
            visited.append(next_url)
            archive_urls, visited = extract_archive_urls(next_url,
                                                         archive_urls, visited)

    return (archive_urls, visited)


def extract_tips(tip_urls: list, urls_to_change: dict) -> Tuple[Tips,
                                                                List[str]]:
    """
    Pass each URL to ``parse_tips_from_page()``, accumulating lists of parsed
    tips and of URLs from the pages that don't appear to work.

    :arg list[str] tip_urls: The URLs for pages containing the tips.
    :arg dict[str, str] urls_to_change: Known broken URLs and their
        replacements.

    :rtype: tuple[list, list]
    :returns: A tuple containing a list of ``tip`` objects and a list of URLs
        that are apparently broken.
    """
    tips, broken_urls = [], []  # type: List[Tip], List[str]
    for tip_url in tip_urls:
        tips, broken_urls = parse_tips_from_page(tip_url, tips, broken_urls,
                                                 urls_to_change)
    return (tips, broken_urls)


def parse_tips_from_page(tip_url: str, tips: list, broken_urls: list,
                         urls_to_change: dict) -> Tuple[Tips, List[str]]:
    """
    Parse the list of tips from the page. Note that some URLs (such as
    <http://www.fec.gov/info/TimelyTipsArchive.shtml>) don't have any actual
    tips on them.

    :arg str tip_url: The URL for the page supposedly containing tips.
    :arg list[Tip] tips: The list of ``Tip`` objects, which this adds to.
    :arg list[str] broken_urls: The list of broken URLs, which this adds to.
    :arg dict[str, str] urls_to_change: The list of known broken URLs and
        replacements.

    :rtype: tuple[list, list]
    :returns: A tuple containing a list of ``tip`` objects and a list of URLs
        that are apparently broken.

    Impure
        Reads content from the page.
    Side effects
        Makes HTTP requests.
    """
    response = requests.get(tip_url)
    encoding = response.encoding if response.encoding else "utf-8"
    html = fromstring(response.content)
    rows = html.xpath("//div[@id='fec_mainContent']/table//tr")

    for row in rows:
        if len(row.xpath("./td")) == 2:
            # All the rows we want have exactly two cells.
            date_cell, body_cell = row.xpath("./td")
            datestamp = None
            try:
                date_text = date_cell.text_content().strip()
                # At least one date has a period instead of a comma...
                if "." in date_text:
                    datestamp = datetime.strptime(date_text, "%B %d. %Y")
                else:
                    datestamp = datetime.strptime(date_text, "%B %d, %Y")
                # ISO 8601:
                datestr = datestamp.strftime("%Y-%m-%d")
            except ValueError as err:
                print(err)
            # If cell one has a date we can parse, cell two is the tip content.
            if datestamp:
                # Fix the URLs before parsing the HTML:
                tip_cell, broken_urls = fix_urls(body_cell, tip_url,
                                                 broken_urls, urls_to_change)
                tips.append(parse_tip(tip_url, datestr, tip_cell, encoding))

    return (tips, broken_urls)


def parse_tip(url: str, datestamp: str, cell: Element, encoding: str) -> Tip:
    """
    Create a ``Tip`` object out of the information we have and the HTML element
    for the table cell.

    The majority of the cells open with a ``strong`` element whose content is
    the title, but the HTML isn't completely consistent.

    If that element is there, we want its contents (as HTML) and then the
    remaining contents of the cell (also as HTML), but we want the contents as
    a string, stripped of the opening and closing tags.

    :arg str url: The URL for the page.
    :arg str datestamp: ISO 8601 date for the tip.
    :arg Element cell: ``lxml.html.Element`` object, HTML for the table cell.
    :arg str encoding: The encoding for the page.

    :rtype: Tip
    :returns: The parsed tip as a ``Tip`` object.
    """
    children = [_ for _ in cell.iterchildren()]
    first = children[0]
    # The ``strong`` element is often the first child:
    if first.tag == "strong":
        tail = "%s " % first.tail.strip() if first.tail else ""
        title = innerhtml(first)
        new_children = children[1:]
    # But sometimes there's an enclosing ``p`` element:
    elif first.tag == "p":
        strong = first.xpath("./strong")[0]
        title = innerhtml(strong)
        tail = "%s " % strong.tail.strip() if strong.tail else ""
        # Note: none of the ``p`` elements have trailing content, so we don't
        # have to worry about first.tail.
        new_children = [_ for _ in first.iterchildren()][1:]
    # And sometimes there's no ``strong`` element at all:
    elif "strong" not in [_.tag for _ in children]:
        # Some of the early tips don't have titles.
        title_date = datetime.strptime(datestamp,
                                       "%Y-%m-%d").strftime("%B %d, %Y")
        title = "Timely Tip for %s" % title_date
        tail = ""
        new_children = children
    # We don't know what to do if none of those conditions are met.
    else:
        raise

    # Now we want the rest of the HTML (not quite the same as ``innerhtml()``)
    body = "%s%s" % (tail, "".join([tostring(c).decode(encoding) for
                                    c in new_children]))

    return Tip(body=body.strip(), posted_date=datestamp, previous_url=url,
               title_text=title.strip())


def innerhtml(el: Element, encoding: str="utf-8") -> str:
    """
    Returns the HTML of an element as a ``str``, with the opening and closing
    tags removed.

    :arg Element el: ``lxml.html.Element`` object.
    :arg str encoding: The character encoding for the HTML.

    :rtype: str
    :returns: A string of HTML without the opening and closing tags.
    """
    children = [_ for _ in el.iterchildren()]
    if not len(children):
        return el.text_content()
    text = "%s" % el.text if el.text else ""
    return "%s%s" % (text, "".join([tostring(c).decode(encoding) for
                                    c in el.iterchildren()]))


def fix_urls(el: Element, base_url: str, broken_urls: List[str],
             urls_to_change: dict) -> Tuple[Callable, List[str]]:
    """
    Given an HTML element, turns all ``href`` parameters of ``a`` elements
    inside it into fully-qualified absolute URLs instead of the relative paths
    that are common in the tips content.

    :arg Element el: ``lxml.html.Element`` object, the content to change.
    :arg str base_url: The URL for the page, which serves as the absolute
        point with which to calculate the absolute paths.
    :arg list broken_urls: The list of broken URLs to add to as we find them.
    :arg dict[str, str] urls_to_change: Known broken URLs and their
        replacements.

    :rtype: tuple[Element, list]
    :returns: The Element with its ``a`` elements altered, and the list of
        broken URLs.
    """
    tested_urls = []  # type: List[str]
    for desc in el.iterdescendants():
        if desc.tag == "a" and "href" in desc.attrib:
            fixed_url, tested_urls, broken_urls = fix_url(
                base_url, desc.attrib["href"], tested_urls, broken_urls,
                urls_to_change)
            desc.attrib["href"] = fixed_url
    return (el, broken_urls)


def fix_url(base_url: str, url: str, tested_urls: list, broken_urls: list,
            urls_to_change: dict) -> Tuple[str, List[str], List[str]]:
    """
    Given an HTML element, turns all ``href`` parameters of ``a`` elements
    inside it into fully-qualified absolute URLs instead of the relative paths
    that are common in the tips content.

    Checks URLs against ``urls_to_change``, and substitutes the
    replacement URL if applicable.

    The line calling ``check_url()`` is commented out but left in because it's
    vaguely possible that re-scraping might be necessary at some point in the
    future when enough content has been added to warrant checking for broken
    links again.

    :arg str base_url: The URL for the page, which serves as the absolute
        point with which to calculate the absolute paths.
    :arg str url: The URL passed in, to be made absolute.
        If this is already a fully-qualified URL, it won't be altered.
    :arg list tested_urls: The list of URLs we've already tested.
    :arg list broken_urls: The list of broken URLs to add to as we find them.
    :arg dict[str, str] urls_to_change: Known broken URLs and their
        replacements.

    :rtype: tuple[str, list, list]
    :returns: The fixed and fully-qualified absolute URL, the list of tested
        URLs, and the list of broken URLs.

    Impure
        Via ``verify_url()``, reads from URLs to check whether or not they're
        working.
    Side effects
        Via ``verify_url()``, makes HTTP requests.
    """
    fixed_url = urljoin(base_url, url)
    if fixed_url in urls_to_change:
        fixed_url = urls_to_change[fixed_url]
    # Uncomment the following two lines to re-enable checking for broken URLs:
    # tested_urls, broken_urls = check_url(base_url, fixed_url,
    #                                      tested_urls, broken_urls)
    return (fixed_url, tested_urls, broken_urls)


def check_url(base_url: str, url: str, tested_urls: list,
              broken_urls: list) -> Tuple[List[str], List[str]]:
    """
    Add the URL to ``tested_urls``, attempts to GET it, and if unsuccessful
    adds it to ``broken_urls``.

    :arg str base_url: The URL for the page that the URL to be checked was on.
    :arg str url: The URL to verify (should be a fully-qualified URL).
    :arg list tested_urls: The list of URLs we've already tested.
    :arg list broken_urls: The list of broken URLs to add to as we find them.

    :rtype: tuple[list, list]
    :returns: The the list of tested URLs and the list of broken URLs.

    Impure
        Reads from URLs to check whether or not they're working.
    Side effects
        Makes HTTP requests.
    """
    if url not in tested_urls:
        tested_urls.append(url)
        parsed_url = urlparse(url)
        if parsed_url.scheme in ("http", "https"):
            try:
                response = requests.get(url)
                if response.status_code != 200:
                    broken_urls.append((base_url, url))
            except requests.exceptions.ConnectionError:
                broken_urls.append((base_url, url))

    return (tested_urls, broken_urls)


def write_tips(tips: list, broken_links: list) -> None:
    """
    Given a list of Tip objects, sorts them by date, converts them to JSON,
    and writes them to a file.

    If there are broken links, writes them to a file as well.

    :arg list articles: The list of Article objects.

    :rtype: None
    :returns: None

    Side effects
        Writes to the filesystem.
    """
    by_date = sorted(tips, key=attrgetter("posted_date"))
    out_lines = ",\n".join([json.dumps(t._asdict()) for t in by_date])
    out_string = "[\n%s\n]" % out_lines
    fname = datetime.now().strftime("tips--%Y-%m-%d-%H%M%S.json")
    with open(fname, "w+") as f:
        f.write(out_string)

    if len(broken_links) > 0:
        fname = datetime.now().strftime("tips--bad-urls--%Y-%m-%d-%H%M%S.json")
        with open(fname, "w+") as f:
            f.write(json.dumps(broken_links))


if __name__ == '__main__':
    cli_main()
