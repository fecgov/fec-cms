import datetime
import functools

from django.db import models
from django.core.exceptions import ValidationError

from modelcluster.fields import ParentalKey
from wagtail.wagtailcore.models import Page, Orderable
from wagtail.wagtailcore.fields import StreamField
from wagtail.wagtailcore import blocks
from wagtail.wagtailadmin.edit_handlers import (FieldPanel, StreamFieldPanel,
                                                PageChooserPanel, InlinePanel)
from wagtail.wagtailimages.blocks import ImageChooserBlock
from wagtail.wagtailimages.edit_handlers import ImageChooserPanel

from wagtail.contrib.table_block.blocks import TableBlock

from fec import constants

stream_factory = functools.partial(
    StreamField,
    [
        ('heading', blocks.CharBlock(classname='full title')),
        ('paragraph', blocks.RichTextBlock()),
        ('html', blocks.RawHTMLBlock()),
        ('image', ImageChooserBlock()),
        ('table', TableBlock()),
    ],
)

class UniqueModel(models.Model):
    """Abstract base class for unique pages."""
    class Meta:
        abstract = True

    def clean(self):
        model = self.__class__
        if model.objects.count() > 0 and self.id != model.objects.get().id:
            raise ValidationError('Only one {0} allowed'.format(self.__name__))

class ContentPage(Page):
    """Abstract base class for simple content pages."""
    is_creatable = True

    class Meta:
        abstract = True

    body = stream_factory(null=True, blank=True)
    feed_image = models.ForeignKey('wagtailimages.Image', blank=True, null=True,
                                   on_delete=models.SET_NULL, related_name='+')

    content_panels = Page.content_panels + [
        StreamFieldPanel('body'),
    ]

    promote_panels = Page.promote_panels + [
        ImageChooserPanel('feed_image'),
    ]

    # Default content section for determining the active nav
    @property
    def content_section(self):
        return 'registration-and-reporting'


class HomePage(ContentPage, UniqueModel):
    """Unique home page."""
    @property
    def content_section(self):
        return ''

class LandingPage(ContentPage):
    template = 'home/registration-and-reporting/landing_page.html'

class ChecklistPage(ContentPage):
    template = 'home/registration-and-reporting/checklist_page.html'

class SSFChecklistPage(ContentPage):
    template = 'home/registration-and-reporting/ssf_checklist_page.html'

class PartyChecklistPage(ContentPage):
    template = 'home/registration-and-reporting/party_checklist_page.html'

class NonconnectedChecklistPage(ContentPage):
    template = 'home/registration-and-reporting/nonconnected_checklist_page.html'

class Author(models.Model):
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    email = models.EmailField()
    photo = models.ForeignKey('wagtailimages.Image', blank=True, null=True,
                              on_delete=models.SET_NULL, related_name='+')
    phone = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)

    panels = [
        FieldPanel('name'),
        FieldPanel('title'),
        FieldPanel('email'),
        ImageChooserPanel('photo'),
        FieldPanel('phone'),
        FieldPanel('bio'),
    ]

    def __str__(self):
        return self.name


class PageAuthors(models.Model):
    """
    Abstract model for the relationship between pages and authors.
    This is made concrete by mixing into a model with a ParentalKey, see
    RecordPageAuthors below.
    """
    author = models.ForeignKey(Author, related_name='+')
    role = models.CharField(max_length=255,
                            choices=constants.author_roles.items(),
                            default='author')

    panels = [
        FieldPanel('author'),
        FieldPanel('role'),
    ]

    class Meta:
        abstract = True


class RecordPageAuthors(Orderable, PageAuthors):
    page = ParentalKey('RecordPage', related_name='authors')

def get_previous_record_page():
    return RecordPage.objects.order_by('-date', '-pk').first()


class RecordPage(ContentPage):
    date = models.DateField(default=datetime.date.today)
    category = models.CharField(max_length=255,
                                choices=constants.record_page_categories.items())
    read_next = models.ForeignKey('RecordPage', blank=True, null=True,
                                  default=get_previous_record_page,
                                  on_delete=models.SET_NULL)
    related_section_title = models.CharField(max_length=255, blank=True,
                                             default="Explore campaign finance data")
    related_section_url = models.CharField(max_length=255, blank=True,
                                           default="/data/")

    homepage_pin = models.BooleanField(default=False)
    homepage_pin_expiration = models.DateField(blank=True, null=True)
    homepage_hide = models.BooleanField(default=False)
    template = 'home/updates/record_page.html'
    content_panels = ContentPage.content_panels + [
        FieldPanel('date'),
        FieldPanel('category'),
        InlinePanel('authors', label="Authors"),
        PageChooserPanel('read_next'),
        FieldPanel('related_section_title'),
        FieldPanel('related_section_url'),
        FieldPanel('homepage_pin'),
        FieldPanel('homepage_pin_expiration'),
        FieldPanel('homepage_hide')
    ]

    @property
    def content_section(self):
        return ''

    @property
    def get_update_type(self):
        return constants.update_types['fec-record']


class DigestPageAuthors(Orderable, PageAuthors):
    page = ParentalKey('DigestPage', related_name='authors')


def get_previous_digest_page():
    return DigestPage.objects.order_by('-date', '-pk').first()


class DigestPage(ContentPage):
    date = models.DateField(default=datetime.date.today)
    read_next = models.ForeignKey('DigestPage', blank=True, null=True,
                                  default=get_previous_digest_page,
                                  on_delete=models.SET_NULL)

    content_panels = ContentPage.content_panels + [
        FieldPanel('date'),
        InlinePanel('authors', label="Authors"),
        PageChooserPanel('read_next'),
    ]

    template = 'home/updates/digest_page.html'

    @property
    def content_section(self):
        return ''

    @property
    def get_update_type(self):
        return constants.update_types['weekly-digest']


class PressReleasePageAuthors(Orderable, PageAuthors):
    page = ParentalKey('PressReleasePage', related_name='authors')


def get_previous_press_release_page():
    return PressReleasePage.objects.order_by('-date', '-pk').first()


class PressReleasePage(ContentPage):
    date = models.DateField(default=datetime.date.today)
    formatted_title = models.CharField(max_length=255, null=True, blank=True, default='',
                                        help_text="Use if you need italics in the title. e.g. <em>Italicized words</em>")
    category = models.CharField(max_length=255,
                                choices=constants.press_release_page_categories.items())
    read_next = models.ForeignKey('PressReleasePage', blank=True, null=True,
                                  default=get_previous_press_release_page,
                                  on_delete=models.SET_NULL)

    homepage_pin = models.BooleanField(default=False)
    homepage_pin_expiration = models.DateField(blank=True, null=True)
    homepage_hide = models.BooleanField(default=False)
    template = 'home/updates/press_release_page.html'

    content_panels = ContentPage.content_panels + [
        FieldPanel('formatted_title'),
        FieldPanel('date'),
        InlinePanel('authors', label="Authors"),
        FieldPanel('category'),
        PageChooserPanel('read_next'),
        FieldPanel('homepage_pin'),
        FieldPanel('homepage_pin_expiration'),
        FieldPanel('homepage_hide'),
    ]

    @property
    def content_section(self):
        return ''

    @property
    def get_update_type(self):
        return constants.update_types['press-release']

    """
    Because we removed the boilerplate from all 2016 releases
    this flag is used to show it in the templates as a print-only element
    """
    @property
    def no_boilerplate(self):
        return self.date.year >= 2016

class CustomPage(Page):
    """Flexible customizable page."""
    author = models.CharField(max_length=255)
    date = models.DateField('Post date')
    body = stream_factory()
    sidebar = stream_factory(null=True, blank=True)

    content_panels = Page.content_panels + [
        FieldPanel('author'),
        FieldPanel('date'),
        StreamFieldPanel('body'),
        StreamFieldPanel('sidebar'),
    ]

class OptionBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=True)
    intro = blocks.RichTextBlock(blank=False, null=False, required=False)
    button_text = blocks.CharBlock(required=True, null=False, blank=False)
    related_page = blocks.PageChooserBlock()

class PressLandingPage(Page):
    hero = stream_factory(null=True, blank=True)
    release_intro = stream_factory(null=True, blank=True)
    digest_intro = stream_factory(null=True, blank=True)

    option_blocks = StreamField([
        ('option_blocks', OptionBlock())
    ])

    contact_intro = stream_factory(null=True, blank=True)

    content_panels = Page.content_panels + [
        StreamFieldPanel('hero'),
        StreamFieldPanel('release_intro'),
        StreamFieldPanel('digest_intro'),
        StreamFieldPanel('option_blocks'),
        StreamFieldPanel('contact_intro'),
    ]

class CollectionList(blocks.StructBlock):
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


class CollectionPage(Page):
    body = stream_factory(null=True, blank=True)
    sidebar_title = models.CharField(max_length=255, null=True, blank=True)

    related_pages = StreamField([
        ('related_pages', blocks.ListBlock(blocks.PageChooserBlock()))
    ], null=True, blank=True)
    sections = StreamField([
        ('section', CollectionList())
    ])
    show_search = models.BooleanField(max_length=255, default=False,
                                    null=False, blank=False,
                                    choices=[
                                        (True, 'Show committee search box'),
                                        (False, 'Do not show committee search box')
                                    ])
    content_panels =  Page.content_panels + [
        StreamFieldPanel('body'),
        FieldPanel('sidebar_title'),
        FieldPanel('show_search'),
        StreamFieldPanel('related_pages'),
        StreamFieldPanel('sections'),
    ]

class DocumentBlock(blocks.StructBlock):
    """A document thumbnail in an aside or the main section"""
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

class ResourceSection(blocks.StructBlock):
    """A section of a ResourcePage"""
    title = blocks.CharBlock(required=True)
    hide_title = blocks.BooleanBlock(required=False, help_text='Should the section title be displayed?')
    content = blocks.StreamBlock([
        ('text', blocks.RichTextBlock(blank=False, null=False, required=False, icon='pilcrow')),
        ('documents', blocks.ListBlock(DocumentBlock(), template='blocks/section-documents.html', icon='doc-empty')),
        ('contact_info', ContactInfoBlock())
    ])

    aside = blocks.StreamBlock([
        ('title', blocks.CharBlock(required=False, icon='title')),
        ('document', DocumentBlock()),
        ('link', AsideLinkBlock())
    ],
    template='blocks/section-aside.html',
    icon='placeholder')

class CitationsBlock(blocks.StructBlock):
    """Block for a chunk of citations that includes a label and the citation (in content)"""
    label = blocks.CharBlock()
    content = blocks.RichTextBlock()

class ResourcePage(Page):
    """Class for pages that include a side nav, multiple sections and citations"""
    intro = stream_factory(null=True, blank=True)
    sections = StreamField([
        ('sections', ResourceSection())
    ], null=True)
    citations = StreamField([
        ('citations', blocks.ListBlock(CitationsBlock()))
    ], null=True)
    related_topics = StreamField([
        ('related_topics', blocks.ListBlock(
            blocks.PageChooserBlock(label="Related topic")
        ))
    ], null=True)
    content_panels = Page.content_panels + [
        StreamFieldPanel('intro'),
        StreamFieldPanel('sections'),
        StreamFieldPanel('citations'),
        StreamFieldPanel('related_topics')
    ]

class LegalResourcesLanding(ContentPage, UniqueModel):
    subpage_types = ['ResourcePage', 'EnforcementPage']
    template = 'home/legal/legal_resources_landing.html'
    @property
    def content_section(self):
        return 'legal-resources'

class EnforcementPage(ContentPage, UniqueModel):
    parent_page_types = ['LegalResourcesLanding']
    subpage_types = ['ResourcePage']
    template = 'home/legal/enforcement.html'
    @property
    def content_section(self):
        return 'legal-resources'
