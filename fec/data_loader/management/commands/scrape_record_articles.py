#!/usr/bin/env python

import json
import os

from collections import namedtuple
from datetime import datetime
from itertools import dropwhile
from operator import attrgetter
from urllib.parse import urljoin, urlparse

import requests

from lxml.etree import Comment
from lxml.html import fromstring, tostring, Element


Article = namedtuple(
    "Article",
    [
        "posted_date",  # ISO 8601 str, like "2016-12-13"
        "title_text",  # str
        "title_url",  # str (absolute URL)
        "monthly_issue_text",  # str
        "monthly_issue_url",  # str (absolute URL)
        "research_categories",  # List<str>
        "authors",  # List<str>
        "keywords",  # List<str>
        "body"  # str (HTML)
    ])


def cli_main(args: list=None) -> None:
    list_url = "http://www.fec.gov/pages/fecrecord_redesign/fecrecord.shtml"
    list_rows, encoding = extract_article_list(list_url)
    articles = [create_article(row, encoding, list_url) for row in list_rows]
    write_articles(articles)


def extract_article_list(list_url: str):  # No typing module until Python 3.5.
    """
    Gets the content from list_url and extracts a list of table row lxml
    Element objects from it.

    :arg str list_url: The URL for the list page.

    :rtype: Tuple (list, str)
    :returns: The list of rows and the ecoding of the page.

    Impure
        Pulls content from a URL.
    """
    list_response = requests.get(list_url)
    list_content = list_response.text
    list_html = fromstring(list_content)
    list_table = list_html.xpath("//table[@id='fecrecord_articles']/tbody")[0]
    list_rows = list_table.xpath("tr")
    encoding = list_response.encoding if list_response.encoding else "utf-8"
    return (list_rows, encoding)


def create_article(row: Element, encoding: str, list_url: str) -> Article:
    """
    Creates an Article object by pulling the metadata from the row, then
    populating the body of the article by calling extract_article_body() on the
    URL for the article.

    :arg Element row: tr Element containing cells with article metadata.
    :arg str encoding: The encoding for the list page.
    :arg str list_url: The URL for the list page.

    :rtype: Article (namedtuple).
    :returns: A populated Article object.

    Assumes the cells are in this order:

    #.  Date.
    #.  Title.
    #.  Monthly issue.
    #.  Research categories.
    #.  Authors.
    #.  Keywords.

    Impure
        Pulls article content from a URL via extract_article_body().
    """
    cells = row.xpath("td")
    br_expr = "br//preceding-sibling::text()|br//following-sibling::text()"

    date_raw = cells[0].text_content().strip()
    posted_date = datetime.strptime(date_raw, "%m/%d/%Y").strftime("%Y-%m-%d")

    title_text = cells[1].text_content().strip()

    title_a_els = cells[1].xpath("a")
    if len(title_a_els):
        title_url_raw = title_a_els[0].attrib.get("href", "")
        title_url = urljoin(list_url, title_url_raw)
    else:
        title_url = ""

    monthly_issue_text = cells[2].text_content().strip()

    monthly_issue_a_els = cells[2].xpath("a")
    if len(monthly_issue_a_els):
        monthly_issue_url_raw = monthly_issue_a_els[0].attrib.get("href", "")
        monthly_issue_url = urljoin(list_url, monthly_issue_url_raw)
    else:
        monthly_issue_url = ""

    cat_br_els = cells[3].xpath("br")
    if len(cat_br_els):
        research_categories = [_.strip() for _ in cells[3].xpath(br_expr)]
    else:
        research_categories = cells[3].text_content().strip()

    auth_raw = cells[4].text_content().strip()
    if "and" in auth_raw:
        authors = auth_raw.split(" and ")
    else:
        authors = [auth_raw]

    keyword_br_els = cells[5].xpath("br")
    if len(keyword_br_els):
        keywords = [_.strip() for _ in cells[5].xpath(br_expr)]
    else:
        keywords = cells[5].text_content().strip()

    if title_url:
        body = extract_article_body(title_url, title_text, encoding)
    else:
        body = ""

    return Article(posted_date, title_text, title_url, monthly_issue_text,
                   monthly_issue_url, research_categories, authors, keywords,
                   body)


def extract_article_body(url: str, title: str, encoding: str) -> str:
    """
    Given a URL, returns relevant stripped HTML content from that URL.
    Very specific to FEC Record article pages.

    If the URL is for a PDF, instead returns simple HTML with a link to that
    PDF.

    :arg str url: The URL for the article.
    :arg str title: The title for the article.
    :arg str encoding: The encoding for the list page.

    :rtype: str (HTML).
    :returns: The HTML content of the article.

    Quite hacky, partly because the article HTML isn't entirely consistent.

    Impure
        Pulls article content from a URL.
    """
    # Handle PDFs:
    parsed_url = urlparse(url)
    if parsed_url.path.endswith("pdf"):
        return """
            <h2>%s</h2>
            <p><a href="%s">PDF</a></p>
            """ % (title, url)

    # Get the HTML:
    article_response = requests.get(url)
    article_content = article_response.text
    article_html = fromstring(article_content)

    # Almost all of the articles have a div#fec_mainContent element.
    main_divs = article_html.xpath("//div[@id='fec_mainContent']")
    if len(main_divs):
        main_div = main_divs[0]
        # Here we have to search for a td element that contains the title
        # string or (because the index page title and the title on this page
        # are not always exact matches) contains at least one h2 element.
        possible_tds = main_div.xpath("//td")
        title_matches = [_ for _ in possible_tds if
                         title.lower() in _.text_content().lower()]
        main_el = []
        if len(title_matches):
            main_el = title_matches[0]
        else:
            for td_el in possible_tds:
                if len([el for el in td_el.iterchildren() if el.tag == "h2"]):
                    main_el = td_el
    else:
        # But some pages have div#fec_mainContentWide instead.
        main_divs = article_html.xpath("//div[@id='fec_mainContentWide']")
        if not len(main_divs) or len(main_divs) > 1:
            import ipdb
            ipdb.set_trace()
        main_el = main_divs[0]

    # More hackiness: we want the innerHTML of the element, and to strip out
    # extraneous elements.
    # We deal with the extraneous elements first:
    def pred(el):
        if el.tag is Comment:  # Having to do this is nuts, but there you go.
            return False
        if el.tag.lower(
                ) == "h2" and el.text_content().strip(
                ) == "" and not len(el.xpath(".//img")):
            # Empty h2, seems to signify start of extraneous content.
            return True
        """
        Turns out there's at least one case where there's one of these in the
        middle of the content.
        Leaving this here and commented-out just in case someone is fooled into
        thinking p with &nbsp; might work.
        if el.tag.lower() == "p" and el.text_content() == "\xa0":
            # p with &nbsp;, seems to signify start of extraneous content.
            return True
        """
        if el.text_content().strip().lower() == "return to fec record home":
            # The presence of this link also seems to signify the start of
            # extraneous content.
            return True
        return False

    if len([el for el in main_el.iterchildren() if pred(el)]):
        # Make a list containing all the elements after the first that matches:
        extra_children = [_ for _ in dropwhile(lambda x: not pred(x),
                                               main_el.iterchildren())]
        for el in extra_children:
            main_el.remove(el)

    # Handle trailing empty p elements:
    def empty(el):
        return el.tag == "p" and el.text_content().strip() == ""

    while empty([_ for _ in main_el.iterchildren()][-1]):
        main_el.remove([_ for _ in main_el.iterchildren()][-1])

    # We need to make any links fully-qualified:
    for a_el in main_el.xpath(".//a"):
        if "href" in a_el.attrib:
            a_el.attrib["href"] = urljoin(url, a_el.attrib["href"])
    # And any image sources:
    for i_el in main_el.xpath(".//img"):
        if "src" in i_el.attrib:
            i_el.attrib["src"] = urljoin(url, i_el.attrib["src"])

    # Having removed the extraneous elements, now do the hacky equivalent of
    # innerHTML, where we move the subelements to a known new element and then
    # delete the known opening and closing tags from the resulting string:
    new_td = fromstring("<td></td>")

    for index, child in enumerate(main_el.iterchildren()):
        # If the very first element is an H2 element, it is probably the title,
        # so skip adding it to our new article body.
        if index == 0 and child.tag == 'h2':
            continue

        new_td.append(child)

    raw_html = tostring(new_td).decode(encoding)
    html = raw_html[4:][:-5].strip()
    return html


def write_articles(articles: list) -> None:
    """
    Given a list of article objects, sorts them by date, converts them to JSON,
    and writes them to a file.

    :arg list articles: The list of Article objects.

    :rtype: None
    :returns: None

    Side effects
        Writes to the filesystem.
    """
    by_date = sorted(articles, key=attrgetter("posted_date"))
    out_lines = ",\n".join([json.dumps(a._asdict()) for a in by_date])
    out_string = "[\n%s\n]" % out_lines
    fname = os.path.join('..', '..', 'data', 'record_json',
                         datetime.now().strftime('%Y-%m-%d-%H%M%S.json'))
    with open(fname, "w+") as f:
        f.write(out_string)


if __name__ == '__main__':
    cli_main()
