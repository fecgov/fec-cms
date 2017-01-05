from wagtail.wagtailcore import blocks
from wagtail.wagtailimages.blocks import ImageChooserBlock
from wagtail.wagtaildocs.blocks import DocumentChooserBlock


class ThumbnailBlock(blocks.StructBlock):
    """A block that combines a thumbnail and a caption,
        both of which link to a URL"""
    image = ImageChooserBlock()
    url = blocks.URLBlock()
    text = blocks.CharBlock()

    class Meta:
        icon = 'doc-empty'

class AsideLinkBlock(blocks.StructBlock):
    """Either a search or calendar link in a section aside"""
    link_type = blocks.ChoiceBlock(choices=[
        ('search', 'Search'),
        ('calendar', 'Calendar')
    ], icon='link', required=False, help_text='Set an icon')

    url = blocks.URLBlock()
    text = blocks.CharBlock(required=True)
    coming_soon = blocks.BooleanBlock(required=False)

    class Meta:
        icon = 'link'

class ContactItemBlock(blocks.StructBlock):
    """A lockup of an icon and blurb of contact info"""
    item_label = blocks.CharBlock(required=True)
    item_icon = blocks.ChoiceBlock(choices=[
        ('email', 'Email'),
        ('fax', 'Fax'),
        ('hand', 'Hand delivery'),
        ('phone', 'Phone'),
        ('mail', 'Mail')
    ], required=True)
    item_info = blocks.RichTextBlock(required=True)

    class Meta:
        icon = 'cog'

class ContactInfoBlock(blocks.StructBlock):
    """ A StructBlock that can contain multiple contact items """
    label = blocks.CharBlock(required=False, icon='title')
    contact_items = blocks.ListBlock(ContactItemBlock())

    class Meta:
        template='blocks/contact-info.html'
        icon='placeholder'

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
        ('document_list', blocks.ListBlock(FeedDocumentBlock(), template='blocks/document-list.html', icon='doc-empty'))
    ])

    aside = blocks.StreamBlock([
        ('title', blocks.CharBlock(required=False, icon='title')),
        ('document', ThumbnailBlock()),
        ('link', AsideLinkBlock())
    ],
    template='blocks/section-aside.html',
    icon='placeholder')

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
