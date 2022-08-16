from wagtail.core import blocks
from wagtail.images.blocks import ImageChooserBlock
from wagtail.documents.blocks import DocumentChooserBlock
from wagtail.contrib.table_block.blocks import TableBlock
from wagtail.snippets.blocks import SnippetChooserBlock

"""options for wagtail default table_block """
core_table_options = {
    'renderer': 'html'
}


class ThumbnailBlock(blocks.StructBlock):
    """A block that combines a thumbnail and a caption,
        both of which link to a URL"""
    image = ImageChooserBlock(required=False)
    url = blocks.URLBlock()
    media_type = blocks.CharBlock()
    text = blocks.CharBlock()

    class Meta:
        icon = 'doc-empty'


class AsideLinkBlock(blocks.StructBlock):
    """Either a search or calendar link in a section aside"""
    link_type = blocks.ChoiceBlock(choices=[
        ('calculator', 'Calculator'),
        ('calendar', 'Calendar'),
        ('record', 'Record'),
        ('search', 'Search')
    ], icon='link', required=False, help_text='Set an icon')

    url = blocks.URLBlock()
    text = blocks.CharBlock(required=True)
    coming_soon = blocks.BooleanBlock(required=False)

    class Meta:
        icon = 'link'


class ContactItemBlock(blocks.StructBlock):
    """A lockup of an icon and blurb of contact info"""
    item_label = blocks.CharBlock(required=False)
    item_icon = blocks.ChoiceBlock(choices=[
        ('email', 'Email'),
        ('fax', 'Fax'),
        ('hand', 'Hand delivery'),
        ('phone', 'Phone'),
        ('mail', 'Mail'),
        ('github', 'Github'),
        ('question-bubble', 'Question')
    ], required=True)
    item_info = blocks.RichTextBlock(required=True)

    class Meta:
        icon = 'cog'


class ContactInfoBlock(blocks.StructBlock):
    """ A StructBlock that can contain multiple contact items """
    label = blocks.CharBlock(required=False, icon='title')
    contact_items = blocks.ListBlock(ContactItemBlock())

    class Meta:
        template = 'blocks/contact-info.html'
        icon = 'placeholder'


class CitationsBlock(blocks.StructBlock):
    """Block for a chunk of citations that includes a label and the citation (in content)"""
    label = blocks.CharBlock()
    content = blocks.RichTextBlock(help_text='Use Shift + Enter to add line breaks between citation and description')


class ExternalButtonBlock(blocks.StructBlock):
    """A block that makes a button to an external URl. Accepts a URL and text"""
    url = blocks.URLBlock()
    text = blocks.CharBlock()

    class Meta:
        template = 'blocks/button.html'
        icon = 'link'


class InternalButtonBlock(blocks.StructBlock):
    """A block that makes a button to an internal page"""
    internal_page = blocks.PageChooserBlock()
    text = blocks.CharBlock()

    class Meta:
        template = 'blocks/button.html'
        icon = 'link'


class FeedDocumentBlock(blocks.StructBlock):
    """A block that is used to construct a feed list of PDFs"""
    title = blocks.CharBlock()
    document = DocumentChooserBlock()

    class Meta:
        icon = 'doc-empty'


class CurrentCommissionersBlock(blocks.StaticBlock):
    """A block that displays the current 6 commissioners"""
    class Meta:
        icon = 'group'
        admin_text = 'Show current commissioners in a grid. No configuration needed.'
        template = 'blocks/commissioners.html'


class CareersBlock(blocks.StaticBlock):
    """A block that displays the open FEC jobs"""
    class Meta:
        icon = 'group'
        admin_text = 'Show open fec jobs from USAJobs.gov. No configuration needed.'
        template = 'blocks/careers.html'


class MURSearchBlock(blocks.StaticBlock):
    """A block that displays the MUR search box"""
    class Meta:
        icon = 'search'
        admin_text = 'Show the MUR search field. No configuration needed.'
        template = 'blocks/mur_search.html'


class AuditSearchBlock(blocks.StaticBlock):
    """A block that displays the Audit search box"""
    class Meta:
        icon = 'search'
        admin_text = 'Show the audit search field. No configuration needed.'
        template = 'blocks/audit.html'


class AFSearchBlock(blocks.StaticBlock):
    """A block that displays the AF search box"""
    class Meta:
        icon = 'search'
        admin_text = 'Show the AF search field. No configuration needed.'
        template = 'blocks/af_search.html'


class ReportingExampleCards(blocks.StructBlock):
    """Create links to reporting example pages that display as cards
    card_width is used in the template to set the grid class. On reporting example pages,
    the container is full width, so the cards should be a third of the full grid.
    On custom pages, the container is partial, and there should only be two cards per row.
    """
    card_width = blocks.ChoiceBlock(
        required=True, default=2, help_text='Control the width of the cards',
        choices=[
            (2, '1/2'),
            (3, '1/3')
        ])
    cards = blocks.ListBlock(blocks.PageChooserBlock(), icon='doc-empty')

    class Meta:
        template = 'blocks/reporting-example-cards.html'
        icon = 'doc-empty'


class CustomTableBlock(blocks.StructBlock):
    """A custom table, works well with finacial information
    Typicallyused for Statistical Press Release tables
    """
    custom_table_options = {
        'startRows': 7,
        'startCols': 6,
        'colHeaders': True,
        'rowHeaders': True,
        'height': 108,
        'language': 'en',
        'renderer': 'html'
    }

    custom_table = blocks.StreamBlock([
        ('title', blocks.CharBlock(required=False, icon='title')),
        ('table_intro', blocks.RichTextBlock(required=False)),
        ('table', TableBlock(table_options=custom_table_options)),
        ('footnote', blocks.CharBlock(required=False, icon='superscript'))
    ])

    class Meta:
        template = 'blocks/custom_table.html'
        icon = 'table'


class DataTableBlock(blocks.StructBlock):
    """A Datatable built with Wagtail TableBlock
    """
    datatable_options = {
        'startRows': 7,
        'startCols': 4,
        'colHeaders': True,
        'rowHeaders': False,
        'height': 108,
        'language': 'en',
        'renderer': 'html'
    }

    # TODO: MAKE SORT FIELDS REQUIRED, OR FIND WAY TO MAKE SURE AN EMPTY SORT FIELDS BLOCK DOES NOT BREAK AS IT DOES NOW
    data_table = blocks.StreamBlock([
        ('title', blocks.CharBlock(required=False, icon='title')),
        ('table', TableBlock(table_options=datatable_options)),
        ('sort_fields', blocks.ListBlock(blocks.StructBlock([  
            ('column', blocks.CharBlock(required=True, help_text="Put text exactly as it appears in the column head")),
            ('sort_format', blocks.ChoiceBlock(choices=[
                ('date', 'Date (mm/dd/yyyy)'),
                ('numeric', 'Numeric'),
                ('currency', 'Currency($1,2345.67, no spaces between commas)'),
                ('alphabetical', 'Alphabetical'),
            ], icon='cogs', required=True, help_text='Set custom sorting for a pecific column. If no sort fields are specified, \
                   table defaults to ordering by first column/alphabetically.')),
            ('order',  blocks.ChoiceBlock(choices=[
                ('asc', 'Ascending'),
                ('desc', 'Descending'),],)),
        ]), required=True, help_text='<ul><li>Sort fields is not reqired, but please remove this block if not using it</li> \
              <li>The table will be ordered initially by the first column you specify as a sort field below.</li> \
              <li>If no sort fields are specified, table defaults to order by first column/alphabetically.</li></ul>'))
    ], block_counts={
        'table': {'max_num': 1},
        'sort_fields': {'max_num': 1}}
    )

    class Meta:
        template = 'blocks/data-table-block.html'
        icon = 'table'


class ExampleImage(blocks.StructBlock):
    """Creates an example module with an image and a caption, side-by-side
    Typically used for showing reporting Examples
    """
    title = blocks.CharBlock(required=False)
    caption = blocks.RichTextBlock(required=True)
    image = ImageChooserBlock(required=True)

    class Meta:
        template = 'blocks/example-image.html'
        icon = 'doc-empty'


class ExampleParagraph(blocks.StructBlock):
    title = blocks.CharBlock(required=True)
    paragraph = blocks.RichTextBlock(required=True)

    class Meta:
        template = 'blocks/example-paragraph.html'
        icon = 'pilcrow'


class ResourceBlock(blocks.StructBlock):
    """A section of a ResourcePage"""
    title = blocks.CharBlock(required=True)
    hide_title = blocks.BooleanBlock(required=False, help_text='Should the section title be displayed?')
    content = blocks.StreamBlock([
        ('text', blocks.RichTextBlock(blank=False, null=False, required=False, icon='pilcrow')),
        ('documents', blocks.ListBlock(ThumbnailBlock(), template='blocks/section-documents.html', icon='doc-empty')),
        ('contact_info', ContactInfoBlock()),
        ('internal_button', InternalButtonBlock()),
        ('external_button', ExternalButtonBlock()),
        ('page', blocks.PageChooserBlock(template='blocks/page-links.html')),
        ('disabled_page', blocks.CharBlock(
            blank=False, null=False, required=False, template='blocks/disabled-page-links.html',
            icon='placeholder', help_text='Name of a disabled link')),
        ('document_list', blocks.ListBlock(
            FeedDocumentBlock(),
            template='blocks/document-list.html',
            icon='doc-empty')),
        ('simple_document_list', blocks.ListBlock(
            FeedDocumentBlock(),
            template='blocks/simple-document-list.html',
            icon='doc-empty')),
        ('current_commissioners', CurrentCommissionersBlock()),
        ('fec_jobs', CareersBlock()),
        ('mur_search', MURSearchBlock()),
        ('audit_search', AuditSearchBlock()),
        ('af_search', AFSearchBlock()),
        ('table', TableBlock(table_options=core_table_options)),
        ('custom_table', CustomTableBlock()),
        ('html', blocks.RawHTMLBlock()),
        ('reporting_example_cards', ReportingExampleCards()),
        ('contribution_limits_table', SnippetChooserBlock(
            'home.EmbedSnippet',
            template='blocks/embed-table.html', icon='table')),
        ('informational_message', SnippetChooserBlock(
            'home.EmbedSnippet',
            template='blocks/embed-info-message.html', icon='warning')),
        ('image', ImageChooserBlock()),
        ('example_image', ExampleImage()),
        ('example_paragraph', ExampleParagraph()),
        ('datatable_block', DataTableBlock()),
    ])

    aside = blocks.StreamBlock([
        ('title', blocks.CharBlock(required=False, icon='title')),
        ('document', ThumbnailBlock()),
        ('link', AsideLinkBlock()),
    ],
        template='blocks/section-aside.html',
        icon='placeholder',
        required=False)

    class Meta:
        template = 'blocks/section.html'


class OptionBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=True)
    intro = blocks.RichTextBlock(blank=False, null=False, required=False)
    button_text = blocks.CharBlock(required=False, null=False, blank=False)
    related_page = blocks.PageChooserBlock(required=False)


class CollectionBlock(blocks.StructBlock):
    CHECKLIST = 'check'
    BULLET = 'bullet'
    STYLE_CHOICES = ([
        (CHECKLIST, 'Checklist'),
        (BULLET, 'Bulleted list')
    ])
    title = blocks.CharBlock(required=True)
    style = blocks.ChoiceBlock(default=BULLET, choices=STYLE_CHOICES)
    intro = blocks.RichTextBlock(blank=False, null=False, required=False)
    items = blocks.ListBlock(blocks.RichTextBlock(form_classname="nothing"))


class DocumentFeedBlurb(blocks.StructBlock):
    """For generating a box with a description that links to a document feed page"""
    page = blocks.PageChooserBlock()
    description = blocks.CharBlock()


class ExampleForms(blocks.StructBlock):
    """For showing one or two example documents"""
    title = blocks.CharBlock(required=True)
    forms = blocks.ListBlock(ThumbnailBlock())

    class Meta:
        template = 'blocks/example-forms.html'
        icon = 'doc-empty'


class LinkBlock(blocks.StructBlock):
    """For links, with text and url"""
    text = blocks.CharBlock()
    url = blocks.URLBlock()

    class Meta:
        icon = 'link'
