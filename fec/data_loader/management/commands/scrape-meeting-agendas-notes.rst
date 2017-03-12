Rough notes from developing a meetings scraper
==============================================
Examples
--------
Some examples of link HTML, problematic and otherwise, follow.

There's a ``(2:00 PM)`` parenthetical outside the links themselves, and the ``b`` at the end of the URL might not get captured::

    <td><a href="http://www.fec.gov/agenda/2010/agenda20100304b.shtml">March 4, 2010<br>\r\n       </a>(2:00 PM) <a href="http://www.fec.gov/sunshine/2010/notice20100302pdf.pdf">Canceled </a></td>\r\n       

The second link element here contains a ``br`` element, two kinds of linebreaks, and no other content, and the URLs are identical, but in other instances there have been relevant URLs grouped together like this::

    <td><a href="http://www.fec.gov/agenda/2006/agenda20060309.shtml">March 9, 2006</a><a href="http://www.fec.gov/agenda/2006/agenda20060309.shtml"><br>\r\n         </a></td>\r\n       

The posted date and the URL date contradict each other here::

    <td>October 20, 2005<a href="http://www.fec.gov/sunshine/2005/notice2005-10-13.pdf"><br>\r\n        </a>(Hearing)<a href="http://www.fec.gov/sunshine/2005/notice2005-10-13.pdf"><br>\r\n        </a></td>\r\n       

Here we have duplicate links again, plus the information that the meeting was cancelled in parentheses but outside either link element::

    <td><a href="http://www.fec.gov/agenda/2004/agenda20041104.shtml">November 4, 2004<br>\r\n           </a>(Cancelled)<a href="http://www.fec.gov/agenda/2004/agenda20041104.shtml"><br>\r\n       </a></td>\r\n       

This public hearing link was an anomaly::

    <tr>\r\n       <td>April 15, 2004<br>\r\n      (Public Hearing)</td>\r\n       <td><a href="http://www.fec.gov/pdf/nprm/political_comm_status/trans_04_15_04.pdf">Transcript Available</a></td>\r\n       <td align="center"><a href="http://www.fec.gov/sunshine/2004/04-8429.pdf">Notice</a></td>\r\n     </tr>\r\n     

Meeting titles
--------------
Possible sources of truth for the “title” of the meeting:

+   The entire text of the cell.
+   The text of the link itself only (if there's a link).
+   The text of the cell once it's been stripped of other links.
+   The title property of the link (if there's a link and it has a title property).
+   The URL for the meeting page (that is, extracting the date from it) (if there's a page for the meeting).
+   The title tag of the meeting's page (if there's a page for the meeting).
+   A title-like element on the meeting's page (if there's a page for the meeting).

I ended up not trying to factor in the details from the meeting pages themselves, and I think that just having the date of the meeting ended up being enough for titles.
