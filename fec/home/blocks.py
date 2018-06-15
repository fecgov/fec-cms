from django.db import models
from wagtail.core import blocks
from wagtail.images.blocks import ImageChooserBlock
from wagtail.documents.blocks import DocumentChooserBlock
from wagtail.contrib.table_block.blocks import TableBlock
from wagtail.snippets.blocks import SnippetChooserBlock

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
        ('github','Github'),
        ('question-bubble','Question')
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

class ReportingExampleCards(blocks.StructBlock):
    """Create links to reporting example pages that display as cards
    card_width is used in the template to set the grid class. On reporting example pages,
    the container is full width, so the cards should be a third of the full grid.
    On custom pages, the container is partial, and there should only be two cards per row.
    """
    card_width = blocks.ChoiceBlock(required=True, default=2,
        help_text='Control the width of the cards',
        choices=[
            (2, '1/2'),
            (3, '1/3')
        ])
    cards = blocks.ListBlock(blocks.PageChooserBlock(), icon='doc-empty')

    class Meta:
        template = 'blocks/reporting-example-cards.html'
        icon = 'doc-empty'

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
        ('disabled_page', blocks.CharBlock(blank=False, null=False, required=False, template='blocks/disabled-page-links.html', icon='placeholder', help_text='Name of a disabled link')),
        ('document_list', blocks.ListBlock(FeedDocumentBlock(), template='blocks/document-list.html', icon='doc-empty')),
        ('current_commissioners', CurrentCommissionersBlock()),
        ('fec_jobs', CareersBlock()),
        ('mur_search', MURSearchBlock()),
        ('table', TableBlock()),
        ('html', blocks.RawHTMLBlock()),
        ('reporting_example_cards', ReportingExampleCards()),
        ('contribution_limits_table', SnippetChooserBlock('home.EmbedTableSnippet', template = 'blocks/embed-table.html', icon='table')),
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
    STYLE_CHOICES =([
        (CHECKLIST, 'Checklist'),
        (BULLET, 'Bulleted list')
    ])
    title = blocks.CharBlock(required=True)
    style = blocks.ChoiceBlock(default=BULLET, choices=STYLE_CHOICES)
    intro = blocks.RichTextBlock(blank=False, null=False, required=False)
    items = blocks.ListBlock(blocks.RichTextBlock(classname="nothing"))

class DocumentFeedBlurb(blocks.StructBlock):
    """For generating a box with a description that links to a document feed page"""
    page = blocks.PageChooserBlock()
    description = blocks.CharBlock()

class ExampleParagraph(blocks.StructBlock):
    title = blocks.CharBlock(required=True)
    paragraph = blocks.RichTextBlock(required=True)

    class Meta:
        template = 'blocks/example-paragraph.html'
        icon = 'pilcrow'

class ExampleForms(blocks.StructBlock):
    """For showing one or two example documents"""
    title = blocks.CharBlock(required=True);
    forms = blocks.ListBlock(ThumbnailBlock())

    class Meta:
        template = 'blocks/example-forms.html'
        icon = 'doc-empty'

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

class CustomTableBlock(blocks.StructBlock):
    """A custom table"""
    custom_table_options = {
    'startRows': 7,
    'startCols': 6,
    'colHeaders': True,
    'rowHeaders': True,
    'height': 108,
    'language': 'en',
    }

    custom_table = blocks.StreamBlock([
        ('title', blocks.CharBlock(required=False)),
        ('table_intro', blocks.RichTextBlock(required=False)),
        ('table', TableBlock(table_options=custom_table_options)),
        ('footnote', blocks.CharBlock(required=False))
    ])

    class Meta:
        template = 'blocks/custom_table.html'
