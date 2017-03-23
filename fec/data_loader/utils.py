import re

from home.models import Author

CONTENT_SPECIFIC_REPLACEMENTS = [
    # deletions - these are from the header and we don't need them as part of the content
    ('<body bgcolor="#FFFFFF">', ''),
    ('<a href="http://www.fec.gov"><img src="../jpg/topfec.jpg" border="0" width="81" height="81" alt="FEC Home Page"/></a> </p>', ''),
    ("""width="100%""""", ''),
    ('width="57"', ''),
    ("""width="187""""", ''),
    ('<h1><a name="content"/> Weekly Digest </h1>', ''),
    ("<h1 class=\"style1\">Weekly Digest </h1>", ''),
    ('<h1>FEC Digest </h1>', ''),
    ('<p><a href="/">HOME</a> / <a href="/press/press.shtml">PRESS OFFICE</a><br/>', ''),
    ('News Releases, Media Advisories<br/>', ''),
    # replacements to make things render better in the new context
    ("""<p align="right"><b>Contact:</b></p>""", """<p><b>Contact:</b></p>"""),
    ('Contact:', 'Contact:  '),
    # neutering font for now
    ('face="Book Antiqua"', ''),
    # old heading photo
    ('<a href="http://www.fec.gov"><img src="../jpg/topfec.jpg" border="0" width="81" height="81"/></a>', ''),
    ('<td width="3%" valign="top"><div align="center"><img width="16" vspace="0" hspace="0" height="16" align="default" alt="PDF" src="../../../images/filetype-pdf.gif"/> </div></td>', ''),
    ('<img width="16" vspace="0" hspace="0" height="16" align="default" alt="PDF" src="../../../images/filetype-pdf.gif"/>', ''),
    ('<img src="../../../images/filetype-pdf.gif" alt="PDF" width="16" height="16" hspace="0" vspace="0" align="default"/>', ''),
    ('<a href="http://www.fec.gov"><img src="../jpg/topfec.jpg" border="0" width="81" height="81" alt="FEC Seal Linking to FEC.GOV"/></a>', ''),
    ('<img src="../../jpg/topfec.jpg" border="0" alt="FEC Home Page" width="81" height="81"/></a>', ''),
    ('<a href="http://www.fec.gov"><font><img src="../jpg/topfec.jpg" border="0"/></font></a>', ''),
    ('<a href="http://www.fec.gov"><img src="../jpg/topfec.jpg" border="0"/>', ''),
    ('<img src="../jpg/topfec.jpg" border="0" width="81" height="81"/>', ''),
    ('<img src="/jpg/topfec.jpg" ismap="ismap" border="0"/>', ''),
    # we got an ok to not have redundant content
    ('<a href="\.\./pdf/[0-9]+digest.pdf">.pdf version of this Weekly Digest...a>', ''),
    ('.pdf version of this Weekly Digest', ''),
    # In the 80s, they used pre to get spacing, but that kills the font in a bad way, I am adding some inline styling to preserve the spaces. It isn't perfect, but it is better.
    ('<pre>', '<div style="white-space: pre-wrap;">'),
    ('</pre>', '</div>'),
    ('<p><u/></p>', ''),
    ('<p><strong><u/></strong></p>', ''),
    ('\r\n', ''),
    ('<h2 align="left">', '<h2>'),
    ('<p align="left">', '<p>'),
]

CONTENT_REGEX_REPLACEMENTS = [
    ('height="[0-9]+"', ''),
    ('border="[0-9]+"', ''),
    # remove colors
    ('bgcolor="#[A-Z0-9]+"', ''),
    ('color="#[A-Z0-9]+"', ''),
    ('text="#[A-Z0-9]+"', ''),
    ('link="#[A-Z0-9]+"', ''),
    ('vlink="#[A-Z0-9]+"', ''),
    ('alink="#[A-Z0-9]+"', ''),
    ('bordercolor="#[A-Z0-9]+"', ''),
    ('size="[0-9]+"', ''),
    ('size="-[0-9]+"', ''),
    # we got an ok to not have redundant content
    ('<a href="http://www.fec.gov/press/press2016/pdf/20160909digest.pdf">pdf version of this Weekly Digest</a>', ''),
    ('<a href="\.\.\/pdf\/[0-9]+release.pdf">\.pdf version of this Weekly Digest...a>', ''),
    ('<a href="\.\.\/pdf\/[0-9]+release.pdf">\.pdf version of this Weekly Digest..a>', ''),
    ('<a href="\.\.\/pdf\/[0-9]+release.pdf">\.pdf version of this Weekly Digest<a>', ''),
    ('<a href="\.\.\/pdf\/[0-9]+release.pdf">\.pdf version...a>', ''),
    ('\.pdf version of this Weekly Digest', ''),
]

KEYWORD_REGEX_CLEANER = '\s?\r\n\s+'
KEYWORD_SPLIT_CHARACTER = '|'
KEYWORD_REPLACE_CHARACTER = ' '


class ImporterMixin(object):
    """
    A mixin object to provide a base set of common methods for all of the
    various types of content imports we need to provide.
    """

    def delete_existing_records(self, model, **options):
        """
        Deletes existing records prior to performing an import.

        NOTE:  This should only be used for testing purposes during local
               development.
        """

        for record in model.objects.iterator():
            try:
                record_id = record.id
                record.delete()

                if options['verbosity'] > 1:
                    self.stdout.write(
                        'Deleted record {0} successfully.'.format(record_id)
                    )
            except:
                self.stdout.write(self.style.WARNING(
                    'Could not delete record with ID of {0}'.format(record.id)
                ))

        self.stdout.write(
            self.style.SUCCESS('Completed deleting existing {0}'.format(model.__name__))
        )

    def clean_content(self, content_block, **options):
        """
        Replaces or strips out unwanted and invalid pieces from the given
        block of content.
        """

        for old, new in CONTENT_SPECIFIC_REPLACEMENTS:
            content_block = str.replace(content_block, old, new)

        for old, new in CONTENT_REGEX_REPLACEMENTS:
            content_block = re.sub(old, new, content_block)

        # Flag
        if """You have performed a blocked operation""" in content_block:
            self.stdout.write(self.style.NOTICE('-----BLOCKED PAGE------'))

        return content_block

    def escape_quotes(self, content_block, **options):
        """
        Escapes single quotes to ensure content goes into a database correctly.
        """

        return content_block.replace("'", "&#39;")

    def wrap_with_paragraph(self, content_block, **options):
        """
        Wraps a content block in <p></p>
        """

        return '{}{}{}'.format('<p>', content_block, '</p>')

    def clean_category(self, category, invalid_categories, **options):
        """
        Makes sure that a category is in the proper format before validating
        it.
        """

        # Check to see if we are dealing with more than one category - Wagtail
        # only supports one, so grab the first one in the case of multiple.
        if type(category) == list:
            category = category[0]

        # Look to see if the category is incorrect and retrieve the correct
        # value in its place, otherwise just use it as it.
        category = invalid_categories.get(category, category)

        return category

    def validate_category(self, category, default, valid_categories, **options):
        """
        Validates the chosen category based on the page type and if no valid
        category is found, returns a suitable substitute.
        """

        if category.lower() in list(valid_categories.keys()):
            return category.lower()

        if options['verbosity'] > 1:
            self.stdout.write(self.style.WARNING(
                'Unknown category found: {0}'.format(category)
            ))

        return default

    def clean_keywords(self, keywords, **options):
        """
        Cleans keywords so that they are always handled as a list of values.
        """

        # If the keywords aren't already a list, strip out unnecessary
        # characters and convert it to a list.
        if type(keywords) != list:
            keywords = re.sub(
                KEYWORD_REGEX_CLEANER,
                KEYWORD_SPLIT_CHARACTER,
                keywords
            ).split(KEYWORD_SPLIT_CHARACTER)

        # Check each keyword in the list to strip out any unwanted characters.
        keywords = [
            re.sub(KEYWORD_REGEX_CLEANER, KEYWORD_REPLACE_CHARACTER, keyword)
            for keyword in keywords
        ]

        return keywords

    def clean_authors(self, authors, default_email, default_title, **options):
        """
        Cleans author information and returns a list of author objects.

        Assumes that authors is a list of one or more strings representing
        author names only.
        """

        author_objects = []

        for author in authors:
            # If the author is just 'n/a' or an empty list, skip it.
            if author in ['n/a', '']:
                continue

            # The Author object requires the following fields:
            #   name
            #   email
            #   title
            # However, these values do not have to be unique, so we must
            # account for the possibility of more than one author object
            # sharing some of the same information.  The best we can do is
            # assume that we should just match on the first author returned if
            # any matches are found.
            existing_authors = Author.objects.filter(name=author)
            existing_authors_count = existing_authors.count()

            if existing_authors_count > 0:
                author_objects.append(existing_authors[0])

                if existing_authors_count > 1:
                    self.stdout.write(self.style.WARNING(
                        'Multiple authors found for name "{0}" ({1} total)'.format(
                            author,
                            existing_authors_count
                        )
                    ))
            else:
                author_objects.append(
                    Author.objects.create(
                        name=author,
                        email=default_email,
                        title=default_title
                    )
                )

                if options['verbosity'] > 1:
                    self.stdout.write(self.style.SUCCESS(
                        'Successfully created author object for {0}'.format(
                            author
                        )
                    ))

        return author_objects
