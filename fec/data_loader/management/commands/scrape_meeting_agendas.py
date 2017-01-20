from collections import defaultdict, Counter
from datetime import datetime
from dateutil import parser as dparser
from typing import (
    List,
    NamedTuple,
    Tuple
)
from operator import attrgetter
from urllib.parse import urljoin, urlparse
import json
import re

from lxml.html import (
    fromstring,
    tostring,
    HtmlElement
)
import requests
from ipdb import set_trace as st  # type: ignore


"""
This script scrapes <www.fec.gov>'s Commission Meetings content and outputs a
JSON array containing one object literal per individual meeting agenda.

Steps:

#.  From a starting URL, follows appropriate links to find all of the links to
    individual meetings.

    (Note that http://www.fec.gov/agenda/2016/agendas2016.shtml has a number of
    broken links on it, and incomplete content.)
#.  From each list of links to meetings, acquire:

    +   The date of the meeting.
    +   The current URL for the meeting documents.
    +   The URL for the draft minutes of the meeting.
    +   The date of the approved minutes of the meeting.
    +   The URL for the approved minutes of the meeting.
    +   Any URLs (and their titles) for associated Sunshine Act Notices.

    All URLs will need to be cleaned and/or verified.
#.  Given the above data for each meeting, get the HTML for its meeting
    documents page and from it acquire:

    +   The URL for its full audio, if available.
    +   The URL for the full video, if available.
    +   The URL for the closed captioning text, if available.
    +   The main body of HTML for the page.
    +   The PDF disclaimer as a separate property?
    +   A list of links (text and URL) of documents from the meeting.

    All URLs will need to be cleaned and/or verified.
#.  Turn each instance of that data into a Meeting object.
#.  Serialize the list of Meeting objects to JSON.
    Optionally also serialize the list of broken URLs to JSON.
"""

Date = NamedTuple(
    "Date",
    [
        ("datetime", datetime),  # Python datetime.datetime object
        ("iso8601", str),  # ISO 8601 date, e.g.  ("2016-12-13")
        ("original", str),  # The original form of the date string
        ("source", str)  # Where we actually got the date info from
    ])

Link = NamedTuple(
    "Link",
    [
        ("text", str),  # The text of the link
        ("title", str),  # The value of the link's title attribute, if any
        ("url", str)  # URL
    ])
Links = List[Link]

Meeting = NamedTuple(
    "Meeting",
    [
        ("agenda_documents_linked", Links),  # list (Links)
        ("approved_minutes_date", Date),  # Date
        ("approved_minutes_link", Link),  # Link
        ("audio_url", Link),  # URL
        ("body", str),  # HTML,
        ("closed_captioning_url", Link),  # URL
        ("draft_minutes_links", Links),  # list (Links)
        ("link_title_text", str),  # Plain text
        ("meeting_type", str),  # "open" or "executive"
        ("pdf_disclaimer", str),  # HTML ?? Not sure about this one.
        ("posted_date", Date),  # Date
        ("old_meeting_url", str),  # URL
        ("sunshine_act_links", Links),  # list (Links)
        ("title_text", str),  # str (TODO: do we need the HTML?)
        ("video_url", Link)  # URL
    ])
"""
Possible sources of truth for the “title” of the meeting:

+   The entire text of the cell.
+   The text of the link itself only (if there's a link).
+   The text of the cell once it's been stripped of other links.
+   The title property of the link (if there's a link and it has a title
    property).
+   The URL for the meeting page (that is, extracting the date from it) (if
    there's a page for the meeting).
+   The title tag of the meeting's page (if there's a page for the meeting).
+   A title-like element on the meeting's page (if there's a page for the
    meeting).
"""
Meetings = List[Meeting]

"""
The following are URLs I identified as broken in the first pass and found
working equivalents of, so during the "write fully-qualified URLs" stage the
script replaces the broken ones with the working equivalents.
"""
urls_to_change = {

    "http://www.fec.gov/agenda/2014/approved_14-2-a.pdf":
    None,

    "http://www.fec.gov/agenda/2014/approved_14-1-a.pdf":
    None,

    "http://www.fec.gov/agenda/2010/2011/mtgdoc1101.pdf":
    "http://www.fec.gov/agenda/2011/mtgdoc1101.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20091210.pdf":
    "http://www.fec.gov/sunshine/2009/notice20091210.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20091202.pdf":
    "http://www.fec.gov/sunshine/2009/notice20091202.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20091117.pdf":
    "http://www.fec.gov/sunshine/2009/notice20091117.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20091103.pdf":
    "http://www.fec.gov/sunshine/2009/notice20091103.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20091027.pdf":
    "http://www.fec.gov/sunshine/2009/notice20091027.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20091001.pdf":
    "http://www.fec.gov/sunshine/2009/notice20091001.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090917.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090917.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090820.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090820.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090722.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090722.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090709.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090709.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090617.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090617.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090610.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090610.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090512.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090512.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090501.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090501.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090428.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090428.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090417.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090417.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090409.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090409.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090313.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090313.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090306.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090306.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090227.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090227.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090205.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090205.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090122.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090122.pdf",

    "http://www.fec.gov/agenda/sunshine/2009/notice20090107.pdf":
    "http://www.fec.gov/sunshine/2009/notice20090107.pdf",

    "http://www.fec.gov/agenda/sunshine/2008/notice20081231.pdf":
    "http://www.fec.gov/sunshine/2008/notice20081231.pdf"

}


def cli_main(args: list=None) -> None:
    base_url = "http://www.fec.gov/agenda/agendas.shtml"
    annual_urls = [base_url] + extract_annual_urls(base_url)
    meetings = []
    broken_links = []  # type: List[str]
    for url in annual_urls:
        _meetings, _broken_links = extract_meeting_metadata(url, broken_links)
        meetings.extend([_ for _ in _meetings if _ is not None])
        broken_links.extend(_broken_links)

    fulldates = []
    strdates = []
    badmeetings = []
    goodmeetings = []
    agendameetings = []
    noticemeetings = []
    sunshines = []

    for meeting in meetings:
        if type(meeting) == Meeting:
            date = meeting.posted_date
            if type(date) == Date:
                fulldates.append((date.original, date.source, date.iso8601))
                goodmeetings.append(meeting)
                print(len(goodmeetings))
            else:
                st()
                strdates.append(date)
                badmeetings.append(meeting)
        else:
            st()
            badmeetings.append(meeting)

    def is_notice_meeting(m):
        no_url = m.old_meeting_url in (None, "")
        no_minutes = m.approved_minutes_link in (None, "")
        sunshine_links = len(m.sunshine_act_links) > 0
        return no_url and no_minutes and sunshine_links

    for meeting in goodmeetings:
        if is_notice_meeting(meeting):
            noticemeetings.append(meeting)
        else:
            agendameetings.append(meeting)

    for meeting in goodmeetings:
        for slink in meeting.sunshine_act_links:
            sunshines.append(slink.url)
    usunshines = set(sunshines)
    dupes = [x for x in sunshines if sunshines.count(x) > 1]
    dates = [x.posted_date.iso8601 for x in goodmeetings]

    dcount = Counter(dates)

    broken = set([l[1] for l in broken_links])

    for meeting in meetings:
        meeting = parse_meeting_page(meeting)

    st()
    print(
        usunshines,
        dupes,
        dcount,
        broken
    )


def extract_annual_urls(url: str) -> List[str]:
    html = fromstr(requests.get(url).content)
    # links = html.xpath("//ul/li/a[text()[contains(.,'Open Meetings')]]")
    links = xpath(html, "//ul/li/a[text()[contains(.,'Open Meetings')]]")
    urls = [urljoin(url, hattr(link, "href")) for link in links]
    return urls


def parse_meeting_row(row: HtmlElement) -> Meeting:
    """
    Given an ``lxml.html.Element`` object for the table row for a meeting,
    returns a ``Meeting`` object.

    There should be four columns:

    #.  Link to documents.
    #.  Link to draft minutes.
    #.  Link to approved minutes.
    #.  Link(s) to Sunshine Act notices.

    They're not completely independent, as sometimes that data belonging on one
    shows up in another.

    We start with a ``Meeting`` object that has default values, and then
    replace it with an updated version as we process each of the cells.

    Impure
        Via ``parse_meeting_docs_cell``, alters the row HTML (which is a kind
        of singleton).
    """
    cells = xpath(row, "./td")

    # We know that these are not meeting metadata:
    if len(cells) == 1 and "adobe reader" in htext(row).lower():
        return None
    elif len(cells) == 2 and "approved minutes" in htext(row).lower():
        return None

    if len(cells) == 4:
        docs, draft, approved, sunshine = cells
    elif len(cells) == 3:
        docs, approved, sunshine = cells
        draft = None
    elif len(cells) == 2:
        docs, approved = cells
        draft = None
        sunshine = None
    else:
        # We're not expecting this
        raise

    # Create a default meeting:
    meeting = make_meeting()

    # Currently we can assume it's an open meeting:
    meeting = meeting._replace(meeting_type="open")

    meeting = parse_meeting_docs_cell(row, docs, meeting)

    if draft is not None:
        d_links = [parse_a_element(e) for e in xpath(draft, ".//a")]
        meeting = meeting._replace(draft_minutes_links=d_links)

    meeting = parse_meeting_approved_cell(row, approved, meeting)

    meeting = parse_meeting_sunshine_cell(row, sunshine, meeting)

    meeting = parse_meeting_page(meeting)

    return meeting


def parse_meeting_docs_cell(row: HtmlElement, cell: HtmlElement,
                            mtg: Meeting) -> Meeting:
    """

    """
    docs_links = xpath(cell, ".//a")
    if len(docs_links) > 1:
        """
        There are four cases where there are two ``a`` elements in the cell.
        We capture the elements that link to sunshine act notices, add their
        info to the ``sunshine_act_links`` property, and then remove them from
        the HtmlElement; if the links are repeats, we remove the second one.

        See the "Multiple document links" section at the bottom of the file for
        more information.
        """
        a_el = docs_links[1]
        if "sunshine" in hattr(a_el, "href"):
            text = ("%s%s" % (a_el.text_content(),
                              a_el.tail if a_el.tail else "")).strip()
            url = hattr(a_el, "href")
            title = hattr(a_el, "title", "")
            s_link = Link(text=text, title=title, url=url)
            s_links = mtg.sunshine_act_links + [s_link]
            mtg = mtg._replace(sunshine_act_links=s_links)
            cell.remove(a_el)
        else:
            assert hattr(docs_links[0], "href") == hattr(a_el, "href")
            cell.remove(a_el)
        docs_links = xpath(cell, ".//a")

    if len(docs_links) == 1:
        a_el = docs_links[0]
        href = hattr(a_el, "href")
        if "notice" in href:
            """
            These are rows with Sunshine Act notices in the first cell.

            I think in this case the best thing to do is to treat the cell as
            containing the title, and to add the link to the list of notices.

            See "Sunshine Notice links in docs cell" at the bottom of the file
            for more information on these cases.
            """
            n_text = htext(cell).strip()
            mtg = mtg._replace(title_text=n_text)
            datematch = re.match(r"[a-zA-Z]+ [0-9]{1,2}, [0-9]{4}",
                                 mtg.title_text)
            if datematch:
                datestring = datematch.group(0)
                mtg = mtg._replace(posted_date=s_to_date(datestring))
            else:
                # We don't know what's going on.
                raise

            url = hattr(a_el, "href")
            sunshine_title = hattr(a_el, "title", "")
            s_link = Link(text=mtg.title_text, title=sunshine_title, url=url)
            s_links = mtg.sunshine_act_links + [s_link]
            mtg = mtg._replace(sunshine_act_links=s_links)
        elif "agenda" in href:
            l_title = hattr(a_el, "title", "")
            mtg = mtg._replace(
                link_title_text=l_title,
                old_meeting_url=hattr(a_el, "href"),
                posted_date=extract_date(a_el),
                title_text=cell.text_content().strip()
            )
        else:
            # We don't know what's going on.
            raise
    elif len(docs_links) == 0:
        title_text = htext(cell).strip().replace(" ,", ",")
        mtg = mtg._replace(title_text=title_text)
        datematch = re.match(r"[a-zA-Z]+ [0-9]{1,2}, [0-9]{4}",
                             mtg.title_text)
        if datematch:
            datestring = datematch.group(0)
            mtg = mtg._replace(posted_date=s_to_date(datestring))
        else:
            # We don't know what's going on.
            raise
    else:
        # We don't know what's going on.
        raise

    return mtg


def parse_meeting_approved_cell(row: HtmlElement, cell: HtmlElement,
                                mtg: Meeting) -> Meeting:

    approved_links = xpath(cell, ".//a")
    approved_text = htext(cell).strip().lower()
    na_text = ("", "n/a", "na", "meeting was cancelled", "-")
    if len(approved_links) != 1 and approved_text not in na_text:
        # We're not expecting this.
        raise

    if len(xpath(cell, ".//a")) == 1:
        # In all other cases there is no approved link.
        approved_link = xpath(cell, ".//a")[0]
        atitle_text = htext(cell)
        if cell.tail and cell.tail.strip() != "":
            st()
        datematch = re.match(r"[a-zA-Z]+ [0-9]{1,2}, [0-9]{4}", atitle_text)
        if datematch:
            datestring = datematch.group(0)
            mtg = mtg._replace(approved_minutes_date=s_to_date(datestring))
        else:
            if "Transcript" in atitle_text:
                # In these edge cases we can use the posted date.
                mtg = mtg._replace(approved_minutes_date=mtg.posted_date)
            else:
                l_text = htext(approved_link)
                if approved_link.tail and approved_link.tail.strip() != "":
                    st()
                mtg = mtg._replace(approved_minutes_date=s_to_date(l_text))

        link_obj = parse_a_element(approved_link)
        mtg = mtg._replace(approved_minutes_link=link_obj)

    return mtg


def parse_meeting_sunshine_cell(row: HtmlElement, cell: HtmlElement,
                                mtg: Meeting) -> Meeting:
    if cell is not None and len(xpath(cell, ".//a")) > 0:
        for sunshine_link in xpath(cell, ".//a"):
            text = htext(sunshine_link)
            url = hattr(sunshine_link, "href")
            title = hattr(sunshine_link, "title", "")
            s_link = Link(text=text, title=title, url=url)
            s_links = mtg.sunshine_act_links + [s_link]
            mtg = mtg._replace(sunshine_act_links=s_links)

    deduped = set([_.url for _ in mtg.sunshine_act_links])

    if len(mtg.sunshine_act_links) > len(deduped):
        # We have more than one link to the same thing for the Sunshine Act
        # notices.
        # We group the links by URL and then from each group select the one
        # with the most text associated with it, as our best guess.
        by_links = defaultdict(list)  # type: Dict[str, list]
        for link in mtg.sunshine_act_links:
            by_links[link.url].append(link)
        unique_links = []
        for url in by_links:
            links = by_links[url]
            # Assume the longest text is the best:
            best = max(links, key=lambda _: len(_.text.strip()))
            unique_links.append(best)
        mtg = mtg._replace(sunshine_act_links=unique_links)

    return mtg


def extract_meeting_metadata(url: str,
                             broken_links: List) -> Tuple[Meetings, List]:
    """
    This will get as much of the metadata as possible about meetings from the
    annual pages.
    """
    exprs = [
        "//table[@class='agenda_table'][@summary='Data table']",
        "//table[@summary='Data table']",
        "//table[@border='0'][@width='60%']"
    ]

    html = fromstr(requests.get(url).content)
    tables, count = [], 0  # type: List[HtmlElement], int
    while len(tables) != 1 and count < len(exprs):
        tables = xpath(html, exprs[count])
        count = count + 1
    if not len(tables):     # Work around this URL going down randomly
                            # http://www.fec.gov/agenda/2010/agendas2010.shtml
        print("%s not working" % url)
        return ([], broken_links)
    if not len(tables) == 1:
        import ipdb
        ipdb.set_trace()
    table, broken_links = fix_urls(tables[0], url, broken_links,
                                   urls_to_change)

    all_rows = xpath(table, ".//tr")
    # We don't want header rows:
    rows = [r for r in all_rows if "th" not in
            [e.tag for e in r.iterchildren()]]
    meetings = []
    for row in rows:
        if row is not None and htext(row).strip():
            meetings.append(parse_meeting_row(row))
    return (meetings, broken_links)


"""
html.xpath("//table[@class='agenda_table'][@summary='Data table']")
"""


def extract_archive_urls(base_url: str, archive_urls: list=[],
                         visited: list=[]):
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
    base_html = fromstr(base_content)

    # Check for ``li`` elements containing ``a`` elements whose ``href``
    # properties, lower-cased, contain "tipsarchive":
    links = xpath(base_html, "//li/a")
    tip_links = [link for link in links if "tipsarchive" in
                 hattr(link, "href").lower()]
    tip_urls = [urljoin(base_url, hattr(link, "href")) for link in tip_links]

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


def parse_meeting_page(mtg: Meeting) -> Meeting:
    if mtg.old_meeting_url in ("", None):
        return mtg
    print("Meeting:", mtg.old_meeting_url)
    html = fromstr(requests.get(mtg.old_meeting_url).content)
    div = xpath(html, "//div[@id='fec_mainContent']")
    """
    Find the links to the video, audio, and captioning.
    We'll need to distinguish between the easily-identified links to these and
    the links that are denoted by text that precedes them.

    Find links to the agenda documents.
    Can we assume that all links to PDFs are “agenda documents”? I think so.
    This means watching out for other types of link that aren't covered here.

    """
    if len(div) == 1:
        # Handle modern page
        main, _ = fix_urls(div[0], mtg.old_meeting_url, [], {})
    else:
        # Handle older page types
        print("lacks fec_mainContent")
        st()

    a_els = xpath(main, ".//a")
    links = [parse_a_element(a_el) for a_el in a_els]

    asset_pairs = (
        ("audio_url", "audio file of entire meeting"),
        ("closed_captioning_url", "archived captions of entire meeting"),
        ("video_url", "video of entire meeting")
    )

    for key, text in asset_pairs:
        candidates = [l for l in links if text in l.text.lower()]
        if len(candidates) == 1:
            # Is there really no mypy-compatible way to pass these keys in as
            # variables instead of using the multiple if statements?
            if key == "audio_url":
                mtg = mtg._replace(audio_url=candidates[0])
            if key == "closed_captioning_url":
                mtg = mtg._replace(closed_captioning_url=candidates[0])
            if key == "video_url":
                mtg = mtg._replace(video_url=candidates[0])

    '''
    vidtxt = "video of entire meeting"
    vid_els = [a for a in a_els if vidtxt in htext(a).lower()]
    if len(vid_els) == 1:
        vid_link = parse_a_element(vid_els[0])
    elif len(vid_els) == 0:
        vid_link = None
    else:
        vid_link = None
        st()

    """
    One problem here is distinguishing between pages that just don't have
    audio (like really recent meetings) and those whose audio we're not
    finding.
    """

    mtg = mtg._replace(video_url=vid_link)

    audiotxt = "audio file of entire meeting"
    audio_els = [a for a in a_els if audiotxt in htext(a).lower()]
    if len(audio_els) == 1:
        audio_link = parse_a_element(audio_els[0])
    elif len(audio_els) == 0:
        audio_link = None
    else:
        audio_link = None
        st()

    mtg = mtg._replace(audio_url=audio_link)

    captxt = "archived captions of entire meeting"
    cap_els = [a for a in a_els if captxt in htext(a).lower()]
    if len(cap_els) == 1:
        cap_link = parse_a_element(cap_els[0])
    elif len(cap_els) == 0:
        cap_link = None
    else:
        cap_link = None
        st()

    mtg = mtg._replace(closed_captioning_url=cap_link)
    '''

    st()
    return mtg


def parse_a_element(a_el: HtmlElement) -> Link:
    """
    Take an ``a`` HTML element and turn it into a ``Link`` object.
    Note: does not capture the tail of the element.
    """
    text = htext(a_el)
    url = hattr(a_el, "href")
    title = hattr(a_el, "title", "")
    return Link(text=text, title=title, url=url)


def s_to_date(d: str, original: str=None) -> Date:
    """
    Make Date object from FEC date string.
    """
    if original is None:
        original = d
    d = d.strip()
    d = d.replace("Ocober", "October")

    try:
        dt = datetime.strptime(d, "%B %d, %Y")
    except:
        try:
            dt = dparser.parse(d)
        except:
            # st()
            print(d)
            return Date(datetime=None, iso8601=None, original=original,
                        source=original)

    return Date(datetime=dt, iso8601=dt.strftime("%Y-%m-%d"),
                original=original, source=original)


def extract_date(a_el: HtmlElement) -> Date:
    """
    While most of the links are just "<month> <day>, <year>", some of them have
    other content, which we want to ignore.

    :arg HtmlElement a_el: An ``a`` element (hopefully) containing date
        information.

    :rtype: Date
    :returns: A ``Date`` object.
    """
    # Get the content and the tail:
    text = ("%s%s" % (a_el.text_content(),
                      a_el.tail if a_el.tail else "")).strip()
    # Match against the common patterns for dates for these elements:
    datematch = re.match(r"[a-zA-Z]+[ ]+[0-9]{1,2},? ?[0-9]{4}", text)
    if datematch:
        datestring = datematch.group(0)
        return s_to_date(datestring, original=text)
    else:
        # It has non-standard content, so we'll instead look at the URL.
        url = hattr(a_el, "href")
        path = urlparse(url).path
        name = path.split("/")[-1]
        name_base = name.split(".")[0]
        if "agenda" in name_base:
            date = name_base[6:]
            dt = datetime.strptime(date, "%Y%m%d")
            return Date(datetime=dt, iso8601=dt.strftime("%Y-%m-%d"),
                        original=text, source=name)
        elif "oral_hearing" in name_base:
            date = name_base[12:]
            dt = datetime.strptime(date, "%Y%m%d")
            return Date(datetime=dt, iso8601=dt.strftime("%Y-%m-%d"),
                        original=text, source=name)
        elif "notice" in name_base:
            date = name_base[6:]
            dt = datetime.strptime(date, "%Y-%m-%d")
            return Date(datetime=dt, iso8601=dt.strftime("%Y-%m-%d"),
                        original=text, source=name)
        else:
            # We don't know what's going on.
            print(tostr(a_el))
            raise


def innerhtml(el: HtmlElement, encoding: str="utf-8"):
    st()
    """
    Returns the HTML of an element as a ``str``, with the opening and closing
    tags removed.

    :arg HtmlElement el: ``lxml`` ``HtmlElement`` object.
    :arg str encoding: The character encoding for the HTML.

    :rtype: str
    :returns: A string of HTML without the opening and closing tags.
    """
    children = [_ for _ in el.iterchildren()]
    if not len(children):
        return htext(el)
    text = "%s" % el.text if el.text else ""
    return "%s%s" % (text, "".join([tostr(c).decode(encoding) for
                                    c in el.iterchildren()]))


def fix_urls(el: HtmlElement, base_url: str, broken_urls: list,
             urls_to_change: dict) -> Tuple[HtmlElement, List]:
    """
    Given an HTML element, turns all ``href`` parameters of ``a`` elements
    inside it into fully-qualified absolute URLs instead of the relative paths
    that are common in the tips content.

    :arg HtmlElement el: The content to change.
    :arg str base_url: The URL for the page, which serves as the absolute
        point with which to calculate the absolute paths.
    :arg list broken_urls: The list of broken URLs to add to as we find them.
    :arg dict[str, str] urls_to_change: Known broken URLs and their
        replacements.

    :rtype: tuple[HtmlElement, list]
    :returns: The HtmlElement with its ``a`` elements altered, and the list of
        broken URLs.
    """
    tested_urls = []  # type: List[str]
    for desc in el.iterdescendants():
        if desc.tag == "a" and "href" in desc.attrib:
            # Some of the links had line breaks in them:
            url = hattr(desc, "href").strip()
            fixed_url, tested_urls, broken_urls = fix_url(
                base_url, url, tested_urls, broken_urls,
                urls_to_change)
            desc.attrib["href"] = fixed_url
        elif desc.tag == "img" and "src" in desc.attrib:
            # Some of the links had line breaks in them:
            url = hattr(desc, "src").strip()
            fixed_url, tested_urls, broken_urls = fix_url(
                base_url, url, tested_urls, broken_urls,
                urls_to_change)
            desc.attrib["src"] = fixed_url
    return (el, broken_urls)


def fix_url(base_url: str, url: str, tested_urls: list, broken_urls: list,
            urls_to_change: dict):
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
    if fixed_url in urls_to_change and urls_to_change[fixed_url] is not None:
        fixed_url = urls_to_change[fixed_url]
        tested_urls.append(fixed_url)
        return (fixed_url, tested_urls, broken_urls)
    if fixed_url in urls_to_change and urls_to_change[fixed_url] is None:
        tested_urls.append(fixed_url)
        broken_urls.append((base_url, fixed_url))
        return (fixed_url, tested_urls, broken_urls)
    # Uncomment the following two lines to re-enable checking for broken URLs:
    tested_urls, broken_urls = check_url(base_url, fixed_url,
                                         tested_urls, broken_urls)
    return (fixed_url, tested_urls, broken_urls)


def check_url(base_url: str, url: str, tested_urls: list, broken_urls: list):
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
                print("checking", base_url, url)
                response = requests.head(url)
                if response.status_code != 200:
                    if url not in ("http://www.usa.gov/"):
                        print(url, response.status_code)
                        broken_urls.append((base_url, url))
            except requests.exceptions.ConnectionError:
                print(url)
                broken_urls.append((base_url, url))

    return (tested_urls, broken_urls)


def make_meeting() -> Meeting:
    """
    Return a meeting with default values.
    """
    return Meeting(
        agenda_documents_linked=[],
        approved_minutes_date=None,
        approved_minutes_link=None,
        audio_url=None,
        body="",
        closed_captioning_url=None,
        draft_minutes_links=[],
        link_title_text="",
        meeting_type="",
        pdf_disclaimer="",
        posted_date=None,
        old_meeting_url="",
        sunshine_act_links=[],
        title_text="",
        video_url=None
    )


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


def xpath(el: HtmlElement, expr: str) -> List[HtmlElement]:
    """
    Convenience function that lets us assert the type for this for mypy.
    """
    return el.xpath(expr)


def fromstr(raw: bytes) -> HtmlElement:
    """
    Convenience function that lets us assert the type for this for mypy.
    """
    return fromstring(raw)


def tostr(el: HtmlElement) -> bytes:
    """
    Convenience function that lets us assert the type for this for mypy.
    """
    return tostring(el)


def hattr(el: HtmlElement, attr: str, default: str=None) -> str:
    """
    Convenience function that lets us assert the type for this for mypy.
    """
    if default is not None:
        return el.attrib.get(attr, default)
    else:
        return el.attrib[attr]


def htext(el: HtmlElement) -> str:
    """
    Convenience function that lets us assert the type for this for mypy.
    """
    return el.text_content()


if __name__ == '__main__':
    cli_main()


"""
Multiple document links
-----------------------
Additional info for ``parse_meeting_docs_cell()``.

The first involves as Sunshine Act notice link that's somehow strayed
into the cell and needs to be counted as a Sunshine Act notice link.

The second involves a second link that has the same URL as the first
but has no content.

The third has two empty ``a`` elements with URLs pointing to Sunshine
Act notices that have to be extracted as in the second case.

The fourth is almost the same as the second.

In each case, we can determine how the second ``a`` element should be
dealt with and then remove it from the parent ``td`` element.

Formatted-for-space versions of the four cases::

    <td>
    <a href="http://www.fec.gov/agenda/2010/agenda20100304b.shtml">
        March 4, 2010<br>\r\n
    </a>
    (2:00 PM)
    <a href="http://www.fec.gov/sunshine/2010/notice20100302pdf.pdf">
        Canceled
    </a>
    </td>\r\n

    <td>
    <a href="http://www.fec.gov/agenda/2006/agenda20060309.shtml">
        March 9, 2006
    </a>
    <a href="http://www.fec.gov/agenda/2006/agenda20060309.shtml">
        <br>\r\n
    </a>
    </td>\r\n

    <td>
    October 20, 2005
    <a href="http://www.fec.gov/sunshine/2005/notice2005-10-13.pdf">
        <br>\r\n
    </a>
    (Hearing)
    <a href="http://www.fec.gov/sunshine/2005/notice2005-10-13.pdf">
        <br>\r\n
    </a>
    </td>\r\n

    <td>
    <a href="http://www.fec.gov/agenda/2004/agenda20041104.shtml">
        November 4, 2004<br>
        \r\n
    </a>
    (Cancelled)
    <a href="http://www.fec.gov/agenda/2004/agenda20041104.shtml">
        <br>\r\n
    </a>
    </td>\r\n


Sunshine Notice links in docs cell
---------------------------------
Additional info for ``parse_meeting_docs_cell()``.

Formatted-for-space versions of the four cases::

    <tr>\r\n
    <td>
    <a href="http://www.fec.gov/sunshine/2010/notice20100408pdf.pdf">
        April 14, 2010 Canceled
    /a>
    </td>\r\n
    <td align="center">&#160;</td>\r\n
    <td>&#160;</td>\r\n
    <td align="center">
    <a href="http://www.fec.gov/sunshine/2010/notice20100406pdf.pdf">
        Notice</a>
    </td>\r\n
    </tr>\r\n

    <tr>\r\n
    <td>
    <a href="http://www.fec.gov/sunshine/2009/notice20090428.pdf">
        April 30, 2009 (Cancelation)</a>
    </td>\r\n
    <td align="center">&#160;</td>\r\n
    <td>&#160;</td>\r\n
    <td align="center">
    <a href="http://www.fec.gov/sunshine/2009/notice20090428.pdf">
        Notice</a>
    </td>\r\n
    </tr>\r\n

    <tr>\r\n
    <td>
    October 20, 2005
    <a href="http://www.fec.gov/sunshine/2005/notice2005-10-13.pdf">
        <br>\r\n
    </a>
    (Hearing)</td>\r\n
    <td>NA</td>\r\n
    <td align="center">
    <a href="http://www.fec.gov/sunshine/2005/notice2005-10-13.pdf">
        Notice
    </a></td>\r\n
    </tr>\r\n

    <tr>\r\n
    <td>
    October 6, 2005
    <a href="http://www.fec.gov/sunshine/2005/notice2005-10-06.pdf">
        <br>\r\n
    </a>
    (Cancelled)<br>
    </td>\r\n
    <td>NA</td>\r\n
    <td align="center">
    <p>
    <a href="http://www.fec.gov/sunshine/2005/notice2005-10-06.pdf">
        Notice
    </a>
    <br>\r\n
    <a href="http://www.fec.gov/sunshine/2005/notice2005-09-30.pdf">
        Notice</a>
    </p>\r\n
    </td>\r\n
    </tr>\r\n


"""
