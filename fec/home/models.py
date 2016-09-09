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
    pass

class ChecklistPage(ContentPage):
    pass

class SSFChecklistPage(ContentPage):
    pass

class PartyChecklistPage(ContentPage):
    pass

class NonconnectedChecklistPage(ContentPage):
    pass

class ContactPage(ContentPage):
    @property
    def content_section(self):
        return 'contact'


class CalendarPage(ContentPage):
    @property
    def content_section(self):
        return 'calendar'


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

    content_panels = ContentPage.content_panels + [
        FieldPanel('date'),
        FieldPanel('category'),
        InlinePanel('authors', label="Authors"),
        PageChooserPanel('read_next'),
        FieldPanel('related_section_title'),
        FieldPanel('related_section_url'),
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
    category = models.CharField(max_length=255,
                                choices=constants.press_release_page_categories.items())
    read_next = models.ForeignKey('PressReleasePage', blank=True, null=True,
                                  default=get_previous_press_release_page,
                                  on_delete=models.SET_NULL)

    content_panels = ContentPage.content_panels + [
        FieldPanel('date'),
        InlinePanel('authors', label="Authors"),
        FieldPanel('category'),
        PageChooserPanel('read_next'),
    ]

    @property
    def content_section(self):
        return ''

    @property
    def get_update_type(self):
        return constants.update_types['press-release']


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
    option_blocks = StreamField([
        ('option_blocks', OptionBlock())
    ])

    feed_intro = stream_factory(null=True, blank=True)
    contact_intro = stream_factory(null=True, blank=True)

    content_panels = Page.content_panels + [
        StreamFieldPanel('hero'),
        StreamFieldPanel('feed_intro'),
        StreamFieldPanel('contact_intro'),
        StreamFieldPanel('option_blocks'),
    ]

