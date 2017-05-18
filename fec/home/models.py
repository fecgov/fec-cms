import datetime
import functools
import logging

from django.db import models
from django.core.exceptions import ValidationError

from django.dispatch import receiver
from django.db.models.signals import post_save, pre_delete
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model

from audit_log.models.fields import LastUserField
from audit_log.models.managers import AuditLog

from modelcluster.fields import ParentalKey
from modelcluster.contrib.taggit import ClusterTaggableManager
from taggit.models import TaggedItemBase
from wagtail.wagtailcore.models import Page, Orderable, PageRevision
from wagtail.wagtailcore.fields import StreamField
from wagtail.wagtailcore import blocks
from wagtail.wagtailadmin.edit_handlers import (FieldPanel, StreamFieldPanel,
                                                PageChooserPanel, InlinePanel, MultiFieldPanel)
from wagtail.wagtailimages.blocks import ImageChooserBlock
from wagtail.wagtailimages.edit_handlers import ImageChooserPanel

from wagtail.wagtaildocs.blocks import DocumentChooserBlock
from wagtail.wagtaildocs.edit_handlers import DocumentChooserPanel
from wagtail.wagtaildocs.models import Document

from django.db.models.signals import m2m_changed

from wagtail.contrib.table_block.blocks import TableBlock

from fec import constants

logger = logging.getLogger(__name__)

from home.blocks import (ThumbnailBlock, AsideLinkBlock,
                         ContactInfoBlock, CitationsBlock, ResourceBlock,
                         OptionBlock, CollectionBlock, DocumentFeedBlurb,
                         ExampleParagraph, ExampleForms, CustomTableBlock)


stream_factory = functools.partial(
    StreamField,
    [
        ('heading', blocks.CharBlock(classname='full title')),
        ('paragraph', blocks.RichTextBlock()),
        ('html', blocks.RawHTMLBlock()),
        ('image', ImageChooserBlock()),
        ('table', TableBlock()),
        ('custom_table', CustomTableBlock())
    ],
)

def get_content_section(page):
    """
    Find the top-level parent in order to highlight
    the main nav item and set social images.
    Takes a Page object and returns a string of either 'legal', 'help', or ''
    """
    slugs = {
        'help-candidates-and-committees': 'help',
        'legal-resources': 'legal'
    }
    ancestors = page.get_ancestors()
    content_sections = [
        slugs.get(ancestor.slug) for ancestor in ancestors
        if slugs.get(ancestor.slug) != None
    ]
    if len(content_sections):
        return content_sections[0]
    else:
        return ''

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
        return ''
'''
class Person(User):
    objects = User()

    def __init__(self):
        audit_log = AuditLog()
        print(audit_log)


@receiver(post_save, sender=Person)
@receiver(pre_delete, sender=Person)
def log_person(sender, **kwargs):
    print('TEST')
'''


@receiver(post_save, sender=User)
@receiver(pre_delete, sender=User)
def log_user_save(sender, **kwargs):
    '''
    Keeping these print statements here for reference for potential later use.
    print(kwargs.get('user'), '1')
    print(kwargs.get('user_id'), '2')
    print(kwargs.get('instance'), '3')
    print(kwargs.get('instance'), '4')
    print(kwargs.get('update_fields'), '5')
    print(kwargs.get('signal'), '6')
    print(kwargs.get('instance').get_username(), '8')
    print(kwargs.get('instance').groups, '9')
    # print(kwargs.get('instance').get_all_permissions())
    print(kwargs.get('instance').groups, '10')
    print(kwargs.get('instance').pagerevision_set, '11')
    print(kwargs.get('instance').user_permissions, '12')
    print(kwargs.get('instance').logentry_set, '12.5')
    print(sender.logentry_set, '13')
    # print(sender.__base__.id, '13')
    # print(sender.get('id'), '14')
    print(sender.id, '15')
    '''
    if kwargs.get('update_fields'):
        logger.info("User {0} logged in".format(kwargs.get('instance').get_username()))
    else:
        logger.info("User change: username {0} by instance {1}".format(kwargs.get('instance').get_username(),
                                                                       kwargs.get('instance')))
    audit_log = AuditLog() #currently not used, will attempt to use for future PR adding admin logging


@receiver(pre_delete, sender=PageRevision)
@receiver(post_save, sender=PageRevision)
def log_revisions(sender, **kwargs):
    try:
        user_id = int(kwargs.get('instance').user_id)
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.info("User not found")
    logger.info("page was modified: {0} by user {1}".format(kwargs.get('instance'), user.get_username()))


def user_groups_changed(sender, **kwargs):
    group_map = {1: 'Moderators', 2: 'Editors'}
    action_map = {'post_add': 'added', 'post_remove': 'removed'}
    if kwargs.get('action').split('_')[0] == 'post':
        for index in kwargs.get('pk_set'):
            action = 'to' if kwargs.get('action').split('_')[1] == 'add' else 'from'
            logger.info("User change: User {0} was {1} {2} group {3}".format(kwargs.get('instance').get_username(),
                                                                    action_map[kwargs.get('action')],
                                                                    action,
                                                                    group_map[index]))

m2m_changed.connect(user_groups_changed, sender=User.groups.through)


class HomePage(ContentPage, UniqueModel):
    """Unique home page."""
    @property
    def content_section(self):
        return ''


class Author(models.Model):
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
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
    homepage_pin_start = models.DateField(blank=True, null=True)
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
        FieldPanel('related_section_url')
    ]

    promote_panels = Page.promote_panels + [
        MultiFieldPanel([
            FieldPanel('homepage_pin'),
            FieldPanel('homepage_pin_start'),
            FieldPanel('homepage_pin_expiration'),
            FieldPanel('homepage_hide')
        ],
            heading="Home page feed"
        )
    ]

    @property
    def content_section(self):
        return ''

    @property
    def get_update_type(self):
        return constants.update_types['fec-record']

    @property
    def get_author_office(self):
        return 'Information Division'


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

    @property
    def get_author_office(self):
        return 'Press Office'


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
    homepage_pin_start = models.DateField(blank=True, null=True)
    homepage_hide = models.BooleanField(default=False)
    template = 'home/updates/press_release_page.html'

    content_panels = ContentPage.content_panels + [
        FieldPanel('formatted_title'),
        FieldPanel('date'),
        InlinePanel('authors', label="Authors"),
        FieldPanel('category'),
        PageChooserPanel('read_next'),
    ]

    promote_panels = Page.promote_panels + [
        MultiFieldPanel([
            FieldPanel('homepage_pin'),
            FieldPanel('homepage_pin_start'),
            FieldPanel('homepage_pin_expiration'),
            FieldPanel('homepage_hide')
        ],
            heading="Home page feed"
        )
    ]

    @property
    def content_section(self):
        return ''

    @property
    def get_update_type(self):
        return constants.update_types['press-release']

    @property
    def get_author_office(self):
        return 'Press Office'

    """
    Because we removed the boilerplate from all 2016 releases
    this flag is used to show it in the templates as a print-only element
    """
    @property
    def no_boilerplate(self):
        return self.date.year >= 2016


def get_previous_tips_page():
    next_tip = TipsForTreasurersPage.objects.order_by('-date', '-pk').first()
    return next_tip.pk if next_tip else None


class TipsForTreasurersPage(ContentPage):
    date = models.DateField(default=datetime.date.today)
    read_next = models.ForeignKey('TipsForTreasurersPage', blank=True, null=True,
                                  default=get_previous_tips_page,
                                  on_delete=models.SET_NULL)

    # These fields are messing up migrations so commenting out for now
    #
    # homepage_pin = models.BooleanField(default=False)
    # homepage_pin_start = models.DateField(blank=True, null=True)
    # homepage_pin_expiration = models.DateField(blank=True, null=True)
    # homepage_hide = models.BooleanField(default=False)
    #
    # promote_panels = Page.promote_panels + [
    #     MultiFieldPanel([
    #         FieldPanel('homepage_pin'),
    #         FieldPanel('homepage_pin_start'),
    #         FieldPanel('homepage_pin_expiration'),
    #         FieldPanel('homepage_hide')
    #     ],
    #     heading="Home page feed"
    #     )
    # ]

    template = 'home/updates/tips_for_treasurers.html'
    content_panels = ContentPage.content_panels + [
        FieldPanel('date'),
        PageChooserPanel('read_next')
        ]

    @property
    def get_update_type(self):
        return constants.update_types['tips-for-treasurers']

    @property
    def content_section(self):
        return ''

    @property
    def get_author_office(self):
        return 'Information Division'


class GenericUpdate(Page):
    # Generic update (pin) for Home Page - What's Happening section
    link = models.URLField(blank=True)
    homepage_expiration = models.DateField(blank=True, null=True)

    content_panels = Page.content_panels + [
        FieldPanel('link'),
        FieldPanel('homepage_expiration'),
    ]


class CustomPage(Page):
    """Flexible customizable page."""
    author = models.CharField(max_length=255)
    date = models.DateField('Post date')
    body = StreamField([
        ('heading', blocks.CharBlock(classname='full title')),
        ('paragraph', blocks.RichTextBlock()),
        ('html', blocks.RawHTMLBlock()),
        ('image', ImageChooserBlock()),
        ('table', TableBlock()),
        ('example_paragraph', ExampleParagraph()),
        ('example_forms', ExampleForms())
    ])
    sidebar = stream_factory(null=True, blank=True)
    citations = StreamField([('citations', blocks.ListBlock(CitationsBlock()))],
                    null=True)
    record_articles = StreamField([
        ('record_articles', blocks.ListBlock(
            blocks.PageChooserBlock(target_model=RecordPage)
        ))
    ], null=True)
    continue_learning = StreamField([
        ('continue_learning', blocks.ListBlock(ThumbnailBlock(), icon='doc-empty')),
    ], null=True)

    content_panels = Page.content_panels + [
        FieldPanel('author'),
        FieldPanel('date'),
        StreamFieldPanel('body'),
        StreamFieldPanel('citations'),
        StreamFieldPanel('continue_learning'),
        MultiFieldPanel([
                StreamFieldPanel('sidebar'),
                StreamFieldPanel('record_articles'),
            ],
            heading="Sidebar",
            classname="collapsible"
        )
    ]

    @property
    def content_section(self):
        return get_content_section(self)


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


class DocumentPage(ContentPage):
    date = models.DateField(default=datetime.date.today)
    year_only = models.BooleanField(default=False)
    file_url = models.URLField(blank=True)
    size = models.CharField(max_length=255, blank=True, null=True)
    category = models.CharField(max_length=255,
                                choices=constants.report_child_categories.items(), null=True)
    content_panels = Page.content_panels + [
        FieldPanel('date'),
        FieldPanel('year_only'),
        FieldPanel('file_url'),
        FieldPanel('size'),
        FieldPanel('category'),
        StreamFieldPanel('body')
    ]

    @property
    def display_date(self):
        # Some documents should only show the year, other show the month and year
        if self.year_only:
            return self.date.year
        else:
            return self.date.strftime('%B %Y')

    @property
    def extension(self):
        # Return the file extension of file_url
        return self.file_url.rsplit('.', 1)[1].upper()


class DocumentFeedPage(ContentPage):
    subpage_types = ['DocumentPage', 'ResourcePage']
    intro = StreamField([
        ('paragraph', blocks.RichTextBlock())
    ], null=True)
    category = models.CharField(max_length=255,
                                choices=constants.report_parent_categories.items(), null=True)
    content_panels = Page.content_panels + [
        StreamFieldPanel('intro'),
        FieldPanel('category')
    ]

    @property
    def content_section(self):
        return ''

    @property
    def category_filters(self):
        return constants.report_category_groups[self.category]


class ReportsLandingPage(ContentPage, UniqueModel):
    subpage_types = ['DocumentFeedPage']
    intro = StreamField([
        ('paragraph', blocks.RichTextBlock())
    ], null=True)

    document_feeds = StreamField([
        ('document_feed_blurb', DocumentFeedBlurb())
    ], null=True, blank=True)

    content_panels = Page.content_panels + [
        StreamFieldPanel('intro'),
        StreamFieldPanel('document_feeds')
    ]

    @property
    def content_section(self):
        return ''


class AboutLandingPage(Page):
    hero = stream_factory(null=True, blank=True)
    sections = StreamField([
        ('sections', OptionBlock())
    ], null=True)

    subpage_types = ['ResourcePage', 'DocumentFeedPage', 'ReportsLandingPage']

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
    content_panels = Page.content_panels + [
        StreamFieldPanel('body'),
        FieldPanel('sidebar_title'),
        FieldPanel('show_search'),
        StreamFieldPanel('related_pages'),
        StreamFieldPanel('sections'),
    ]

    @property
    def content_section(self):
        return get_content_section(self)

class ResourcePage(Page):
    # Class for pages that include a side nav, multiple sections and citations
    date = models.DateField(default=datetime.date.today)
    intro = StreamField([
        ('paragraph', blocks.RichTextBlock())
    ], null=True)
    sidebar_title = models.CharField(max_length=255, null=True, blank=True)
    related_pages = StreamField([
        ('related_pages', blocks.ListBlock(blocks.PageChooserBlock()))
    ], null=True, blank=True)
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
    category = models.CharField(max_length=255,
                                choices=constants.report_child_categories.items(),
                                help_text='If this is a report, add a category',
                                blank=True,
                                null=True)
    breadcrumb_style = models.CharField(max_length=255,
        choices=[('primary', 'Blue'), ('secondary', 'Red')],
        default='primary')

    content_panels = Page.content_panels + [
        StreamFieldPanel('intro'),
        FieldPanel('sidebar_title'),
        StreamFieldPanel('related_pages'),
        StreamFieldPanel('sections'),
        StreamFieldPanel('citations'),
        StreamFieldPanel('related_topics')
    ]

    promote_panels = Page.promote_panels + [
        FieldPanel('breadcrumb_style'),
        FieldPanel('category'),
        FieldPanel('date')
    ]

    @property
    def display_date(self):
        return self.date.strftime('%B %Y')

    @property
    def content_section(self):
        return get_content_section(self)


class LegalResourcesLandingPage(ContentPage, UniqueModel):
    subpage_types = ['ResourcePage']
    template = 'home/legal/legal_resources_landing.html'

    @property
    def content_section(self):
        return 'legal'


class ServicesLandingPage(ContentPage, UniqueModel):
    """
    Page model for the Help for Candidates and Committees landing page
    """

    subpage_types = ['CollectionPage', 'ResourcePage', 'CustomPage']
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
        return 'help'

    @property
    def hero_class(self):
        return 'services'


class MeetingPage(Page):
    OPEN = 'O'
    EXECUTIVE = 'E'
    MEETING_TYPE_CHOICES = (
        (OPEN, 'Open meeting'),
        (EXECUTIVE, 'Executive session'),
    )

    date = models.DateField(default=datetime.date.today)
    end_date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True, help_text='If no time is entered the time will be set to 10 a.m.')
    meeting_type = models.CharField(
        max_length=2,
        choices=MEETING_TYPE_CHOICES,
        default=OPEN
    )
    draft_minutes_links = models.TextField(
        blank=True, help_text='URLs separated by a newline')
    approved_minutes_date = models.DateField(null=True, blank=True)
    approved_minutes_link = models.URLField(blank=True)
    sunshine_act_links = models.TextField(
        blank=True, help_text='URLs separated by a newline')
    live_video_url = models.URLField(blank=True)
    live_video_captions = models.URLField(blank=True)

    imported_html = StreamField(
        [('html_block', blocks.RawHTMLBlock())],
        null=True,
        blank=True
    )

    full_video_url = models.URLField(blank=True)
    full_audio_url = models.URLField(blank=True)
    mtg_transcript_url = models.URLField(blank=True)

    agenda = StreamField([
        ('agenda_item', blocks.StructBlock([
            ('item_title', blocks.TextBlock()),
            ('item_text', blocks.RichTextBlock(required=False)),
            ('item_audio', DocumentChooserBlock(required=False)),
        ]))
    ])

    content_panels = Page.content_panels + [
        StreamFieldPanel('agenda'),
        MultiFieldPanel(
            [
                FieldPanel('date'),
                FieldPanel('end_date'),
                FieldPanel('time'),
                FieldPanel('meeting_type'),
            ],
            heading='Meeting details',
            classname='collapsible collapsed'
        ),
        MultiFieldPanel(
            [
                FieldPanel('sunshine_act_links'),
                FieldPanel('draft_minutes_links'),
                FieldPanel('approved_minutes_link'),
                FieldPanel('approved_minutes_date'),
            ],
            heading='Minutes and Sunshine notices',
            classname='collapsible collapsed'
        ),
        MultiFieldPanel(
            [
                FieldPanel('full_video_url'),
                FieldPanel('full_audio_url'),
                FieldPanel('mtg_transcript_url'),
                FieldPanel('live_video_url'),
                FieldPanel('live_video_captions')
            ],
            heading='Meeting media',
            classname='collapsible collapsed'
        ),
        MultiFieldPanel(
            [
                FieldPanel('imported_html'),
            ],
            heading='Imported meeting content',
            classname='collapsible collapsed'
        )
    ]

    @property
    def get_update_type(self):
        return constants.update_types['commission-meeting']
