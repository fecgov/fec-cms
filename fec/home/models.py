import datetime
import functools

from django.db import models
from django.core.exceptions import ValidationError

from modelcluster.fields import ParentalKey
from modelcluster.contrib.taggit import ClusterTaggableManager
from taggit.models import TaggedItemBase
from wagtail.wagtailcore.models import Page, Orderable
from wagtail.wagtailcore.fields import StreamField
from wagtail.wagtailcore import blocks
from wagtail.wagtailadmin.edit_handlers import (FieldPanel, StreamFieldPanel,
                                                PageChooserPanel, InlinePanel)
from wagtail.wagtailimages.blocks import ImageChooserBlock
from wagtail.wagtailimages.edit_handlers import ImageChooserPanel

from wagtail.contrib.table_block.blocks import TableBlock

from fec import constants
from home.blocks import (ThumbnailBlock, AsideLinkBlock, ContactInfoBlock,
                        ContactInfoBlock, CitationsBlock, ResourceBlock,
                        OptionBlock, CollectionBlock)

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


def get_previous_record_page():
    return RecordPage.objects.order_by('-date', '-pk').first()


class RecordPageAuthors(Orderable, PageAuthors):
    page = ParentalKey('RecordPage', related_name='authors')


class RecordPageTag(TaggedItemBase):
    content_object = ParentalKey(
        'home.RecordPage',
        related_name='tagged_items'
    )


class RecordPage(ContentPage):
    date = models.DateField(default=datetime.date.today)
    category = models.CharField(
        max_length=255,
        choices=constants.record_page_categories.items()
    )
    read_next = models.ForeignKey(
        'RecordPage',
        blank=True,
        null=True,
        default=get_previous_record_page,
        on_delete=models.SET_NULL
    )
    related_section_title = models.CharField(
        max_length=255,
        blank=True,
        default='Explore campaign finance data'
    )
    related_section_url = models.CharField(
        max_length=255,
        blank=True,
        default='/data/'
    )
    monthly_issue = models.CharField(
        max_length=255,
        blank=True,
        default=''
    )
    monthly_issue_url = models.CharField(
        max_length=255,
        blank=True,
        default=''
    )

    keywords = ClusterTaggableManager(through=RecordPageTag, blank=True)

    homepage_pin = models.BooleanField(default=False)
    homepage_pin_expiration = models.DateField(blank=True, null=True)
    homepage_hide = models.BooleanField(default=False)
    template = 'home/updates/record_page.html'
    content_panels = ContentPage.content_panels + [
        FieldPanel('date'),
        FieldPanel('monthly_issue'),
        FieldPanel('category'),
        FieldPanel('keywords'),
        InlinePanel('authors', label='Authors'),
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

class AboutLandingPage(Page):
    hero = stream_factory(null=True, blank=True)
    sections = StreamField([
        ('sections', OptionBlock())
    ], null=True)

    subpage_types = ['ResourcePage']

    content_panels = Page.content_panels + [
        StreamFieldPanel('hero'),
        StreamFieldPanel('sections')
    ]

class CommissionerPage(Page):
    first_name = models.CharField(max_length=255, default='', blank=False)
    middle_initial = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, default='', blank=False)
    picture = models.ForeignKey(
        'wagtailimages.Image',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+'
    )
    sworn_in = models.DateField(null=True, blank=True)
    term_expiration = models.DateField(null=True, blank=True)
    reappointed_dates = models.CharField(max_length=255, blank=True)
    party_affiliation = models.CharField(
        max_length=2,
        choices=(
            ('D', 'Democrat'),
            ('R', 'Republican'),
            ('I', 'Independent'),
        )
    )
    commissioner_title = models.CharField(max_length=255, blank=True)

    commissioner_bio = StreamField([
        ('paragraph', blocks.RichTextBlock())
    ], null=True, blank=True)

    commissioner_email = models.CharField(max_length=255, blank=True)
    commissioner_phone = models.CharField(max_length=255, null=True, blank=True)
    commissioner_twitter = models.CharField(max_length=255, null=True, blank=True)

    content_panels = Page.content_panels + [
        FieldPanel('first_name'),
        FieldPanel('middle_initial'),
        FieldPanel('last_name'),
        ImageChooserPanel('picture'),
        FieldPanel('sworn_in'),
        FieldPanel('term_expiration'),
        FieldPanel('reappointed_dates'),
        FieldPanel('party_affiliation'),
        FieldPanel('commissioner_title'),
        StreamFieldPanel('commissioner_bio'),
        FieldPanel('commissioner_email'),
        FieldPanel('commissioner_phone'),
        FieldPanel('commissioner_twitter'),
    ]

    def get_context(self, request):
        context = super(CommissionerPage, self).get_context(request)

        # Breadcrumbs for Commissioner pages
        context['ancestors'] = [
            {
                'title': 'About the FEC',
                'url': '/about/',
            },
            {
                'title': 'Leadership and Structure',
                'url': '/about/leadership-and-structure',
            },
            {
                'title': 'All Commissioners',
                'url': '/about/leadership-and-structure/commissioners',
            }
        ]

        return context

class CollectionPage(Page):
    body = stream_factory(null=True, blank=True)
    sidebar_title = models.CharField(max_length=255, null=True, blank=True)

    related_pages = StreamField([
        ('related_pages', blocks.ListBlock(blocks.PageChooserBlock()))
    ], null=True, blank=True)
    sections = StreamField([
        ('section', CollectionBlock())
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

class ResourcePage(Page):
    """Class for pages that include a side nav, multiple sections and citations"""
    intro = StreamField([
        ('paragraph', blocks.RichTextBlock())
    ], null=True)
    sections = StreamField([
        ('sections', ResourceBlock())
    ], null=True)
    citations = StreamField([
        ('citations', blocks.ListBlock(CitationsBlock()))
    ], null=True)
    related_topics = StreamField([
        ('related_topics', blocks.ListBlock(
            blocks.PageChooserBlock(label="Related topic")
        ))
    ], null=True)

    breadcrumb_style = models.CharField(max_length=255,
        choices=[('primary', 'Blue'), ('secondary', 'Red')],
        default='primary')

    content_panels = Page.content_panels + [
        StreamFieldPanel('intro'),
        StreamFieldPanel('sections'),
        StreamFieldPanel('citations'),
        StreamFieldPanel('related_topics')
    ]

    promote_panels = Page.promote_panels + [
        FieldPanel('breadcrumb_style'),
    ]

class LegalResourcesLandingPage(ContentPage, UniqueModel):
    subpage_types = ['ResourcePage', 'EnforcementPage']
    template = 'home/legal/legal_resources_landing.html'
    @property
    def content_section(self):
        return 'legal-resources'

class EnforcementPage(ContentPage, UniqueModel):
    parent_page_types = ['LegalResourcesLandingPage']
    subpage_types = ['ResourcePage']
    template = 'home/legal/enforcement.html'
    @property
    def content_section(self):
        return 'legal-resources'

class ServicesLandingPage(ContentPage, UniqueModel):
    subpage_types = ['CollectionPage']
    template = 'home/candidate-and-committee-services/services_landing_page.html'

    hero = stream_factory(null=True, blank=True)

    intro = StreamField([
        ('paragraph', blocks.RichTextBlock())
    ], null=True)

    sections = StreamField([
        ('sections', ResourceBlock())
    ], null=True)

    content_panels = Page.content_panels + [
        StreamFieldPanel('hero'),
        StreamFieldPanel('intro'),
        StreamFieldPanel('sections'),
    ]

    @property
    def content_section(self):
        return 'candidate-and-committee-services'

    @property
    def hero_class(self):
        return 'services'


