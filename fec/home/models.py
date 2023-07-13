import datetime
import functools
import logging

from django.db import models
from django.core.exceptions import ValidationError
from django.dispatch import receiver
from django.db.models.signals import post_save, pre_delete
from django.contrib.auth.models import User
from modelcluster.fields import ParentalKey
from modelcluster.contrib.taggit import ClusterTaggableManager
from taggit.models import TaggedItemBase
from wagtail.models import Orderable, Page, Revision
from wagtail.fields import RichTextField, StreamField
from wagtail import blocks
from wagtail.admin.panels import (
    InlinePanel,
    MultiFieldPanel,
    PageChooserPanel,
    FieldPanel)
from wagtail.images.blocks import ImageChooserBlock
from wagtail.documents.blocks import DocumentChooserBlock
from wagtail.snippets.models import register_snippet
from wagtail.search import index
from django.db.models.signals import m2m_changed
from wagtail.contrib.table_block.blocks import TableBlock
from fec import constants

from home.blocks import (
    CitationsBlock, CollectionBlock, ContactInfoBlock, CustomTableBlock,
    DocumentFeedBlurb, ExampleForms, ExampleImage, ExampleParagraph,
    ExternalButtonBlock, InternalButtonBlock, LinkBlock, OptionBlock,
    ReportingExampleCards, ResourceBlock, SnippetChooserBlock,
    ThumbnailBlock, FeedDocumentBlock, EmployeeTitle, ReportingTableBlock
)

logger = logging.getLogger(__name__)

"""options for wagtail default table_block """
core_table_options = {

    'renderer': 'html',
}

stream_factory = functools.partial(
    StreamField,
    [
        ('heading', blocks.CharBlock(form_classname='full title', icon='title')),
        ('paragraph', blocks.RichTextBlock()),
        ('html', blocks.RawHTMLBlock()),
        ('image', ImageChooserBlock()),
        ('table', TableBlock(table_options=core_table_options)),
        ('custom_table', CustomTableBlock()),
        ('contact', ContactInfoBlock()),
        ('internal_button', InternalButtonBlock()),
        ('external_button', ExternalButtonBlock()),
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
        'legal-resources': 'legal',
        'about': 'about',
        'campaign-finance-data': 'data',
        'data': 'data',
    }

    ancestors = page.get_ancestors()
    content_sections = [
        slugs.get(ancestor.slug) for ancestor in ancestors
        if slugs.get(ancestor.slug) is not None
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

    body = stream_factory(null=True, blank=True, use_json_field=True)

    feed_image = models.ForeignKey('wagtailimages.Image', blank=True, null=True,
                                   on_delete=models.SET_NULL, related_name='+')

    content_panels = Page.content_panels + [
        FieldPanel('body'),
    ]

    promote_panels = Page.promote_panels + [
        FieldPanel('feed_image'),
    ]

    search_fields = Page.search_fields + [
        index.SearchField('body')
    ]

    """Returns no content section so the active nav can be set in the page-type \
    that extends the ContentPage model """
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
    print(kwargs.get('instance').revision_set, '11')
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


@receiver(pre_delete, sender=Revision)
@receiver(post_save, sender=Revision)
def log_revisions(sender, **kwargs):
    username = '(user not found)'
    user = kwargs.get('instance').user

    if user:
        username = user.get_username()

    logger.info('Page modified: {0} by user {1}'.format(
        kwargs.get('instance'),
        username
    ))


def user_groups_changed(sender, **kwargs):
    group_map = {1: 'Moderators', 2: 'Editors'}
    action_map = {'post_add': 'added', 'post_remove': 'removed'}
    if kwargs.get('action').split('_')[0] == 'post':
        for kwarg in kwargs.get('pk_set'):
            action = 'to' if kwargs.get('action').split('_')[1] == 'add' else 'from'
            logger.info("User change: User {0} was {1} {2} group {3}".format(kwargs.get('instance').get_username(),
                        action_map[kwargs.get('action')],
                        action, group_map[kwarg]))


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
    author_group = models.CharField(
        max_length=255,
        choices=constants.author_groups.items(),
        blank=True,
        help_text="Not required: Only choose this if you want this author to show up as part an official author group")

    panels = [
        FieldPanel('name'),
        FieldPanel('title'),
        FieldPanel('email'),
        FieldPanel('photo'),
        FieldPanel('phone'),
        FieldPanel('bio'),
        MultiFieldPanel([
            FieldPanel('author_group')],
            heading="Author Groups - Not required (For admin use only)",
            classname="collapsible collapsed")
    ]

    def __str__(self):
        return self.name


class PageAuthors(models.Model):
    """
    Abstract model for the relationship between pages and authors.
    This is made concrete by mixing into a model with a ParentalKey, see
    RecordPageAuthors below.
    """
    author = models.ForeignKey(Author, related_name='+', null=True, on_delete=models.SET_NULL)
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
    formatted_title = models.CharField(
        max_length=255, null=True, blank=True, default='',
        help_text="Use if you need italics in the title. e.g. <em>Italicized words</em>")
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
        FieldPanel('formatted_title'),
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

    search_fields = ContentPage.search_fields + [
        index.FilterField('category'),
        index.FilterField('date')
    ]

    @property
    def content_section(self):
        return get_content_section(self)

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

    search_fields = ContentPage.search_fields + [
        index.FilterField('date')
    ]

    @property
    def content_section(self):
        return 'about'

    @property
    def get_update_type(self):
        return constants.update_types['weekly-digest']

    @property
    def get_author_office(self):
        return 'Press Office'

    @property
    def social_image_identifier(self):
        return 'weekly-digest'


class PressReleasePageAuthors(Orderable, PageAuthors):
    page = ParentalKey('PressReleasePage', related_name='authors')


def get_previous_press_release_page():
    return PressReleasePage.objects.order_by('-date', '-pk').first()


class PressReleasePage(ContentPage):
    date = models.DateField(default=datetime.date.today)
    formatted_title = models.CharField(
        max_length=255, null=True, blank=True, default='',
        help_text="Use if you need italics in the title. e.g. <em>Italicized words</em>")
    category = models.CharField(
        max_length=255, choices=constants.press_release_page_categories.items())
    read_next = models.ForeignKey(
        'PressReleasePage', blank=True, null=True,
        default=get_previous_press_release_page, on_delete=models.SET_NULL)

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

    search_fields = ContentPage.search_fields + [
        index.FilterField('category'),
        index.FilterField('date')
    ]

    @property
    def content_section(self):
        return 'about'

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

    @property
    def social_image_identifier(self):
        return 'press-release'


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

    search_fields = ContentPage.search_fields + [
        index.FilterField('date')
    ]

    @property
    def get_update_type(self):
        return constants.update_types['tips-for-treasurers']

    @property
    def content_section(self):
        return 'about'

    @property
    def get_author_office(self):
        return 'Information Division'


class HomePageBannerAnnouncement(Page):
    # Home page banner announcement
    description = models.CharField(max_length=255, blank=True)
    link_title = models.CharField(max_length=255, blank=True)
    link_url = models.URLField(max_length=255, blank=True)
    link_title_2 = models.CharField(max_length=255, blank=True)
    link_url_2 = models.URLField(max_length=255, blank=True)
    date_active = models.DateTimeField(blank=False, help_text='Set active date-active here and \
        leave Go-Live and Expiry fields blank in the Settings-Tab above.')
    date_inactive = models.DateTimeField(null=True, blank=False, help_text='Set date-inactive here and \
        leave Go-Live and Expiry fields blank in the Settings-Tab above.')
    active = models.BooleanField(default=True)

    content_panels = Page.content_panels + [
        MultiFieldPanel([
            FieldPanel('description'),
            FieldPanel('link_title'),
            FieldPanel('link_url'),
            FieldPanel('link_title_2'),
            FieldPanel('link_url_2'),
            FieldPanel('date_active'),
            FieldPanel('date_inactive'),
            FieldPanel('active'),
        ],
            heading="Home page banner announcement"
        )
    ]


class AlertForEmergencyUseOnly(Page):
    # Home page banner alert
    alert_description = models.CharField(max_length=255, blank=True)
    alert_link_title = models.CharField(max_length=255, blank=True)
    alert_link_url = models.URLField(max_length=255, blank=True)
    alert_date_active = models.DateTimeField(blank=False, help_text='Set active date-active here and \
        leave Go-Live and Expiry fields blank in the Settings-Tab above.')
    alert_date_inactive = models.DateTimeField(null=True, blank=False, help_text='Set date-inactive here and \
        leave Go-Live and Expiry fields blank in the Settings-Tab above.')
    alert_active = models.BooleanField(
        default=False,
        help_text='Requires approval by Amy Kort or Wei Luo prior to deployment.')

    content_panels = Page.content_panels + [
        MultiFieldPanel([
            FieldPanel('alert_description'),
            FieldPanel('alert_link_title'),
            FieldPanel('alert_link_url'),
            FieldPanel('alert_date_active'),
            FieldPanel('alert_date_inactive'),
            FieldPanel('alert_active'),
        ],
            heading="This 'alert for emergency use only' feature \
            is used exclusively for an agency shutdown, or emergency \
            event in which the agency as a whole cannot assist the \
            regulated community or the public. The use of this feature \
            requires approval by Amy Kort or Wei Luo prior to deployment."
        )
    ]


class CustomPage(Page):
    """Flexible customizable page."""
    author = models.CharField(max_length=255)
    date = models.DateField('Creation date')
    body = StreamField([
        ('heading', blocks.CharBlock(form_classname='full title', icon='title')),
        ('paragraph', blocks.RichTextBlock()),
        ('html', blocks.RawHTMLBlock()),
        ('example_image', ExampleImage()),
        ('image', ImageChooserBlock()),
        ('table', TableBlock(table_options=core_table_options)),
        ('example_paragraph', ExampleParagraph()),
        ('example_forms', ExampleForms()),
        ('reporting_example_cards', ReportingExampleCards()),
        ('contact_info', ContactInfoBlock()),
        ('internal_button', InternalButtonBlock()),
        ('external_button', ExternalButtonBlock()),
        ('contribution_limits_table', SnippetChooserBlock(
            'home.EmbedSnippet',
            template='blocks/embed-table.html', icon='table')),
        ('informational_message', SnippetChooserBlock(
            'home.EmbedSnippet',
            template='blocks/embed-info-message.html', icon='warning')),
        ('document_list', blocks.ListBlock(
            FeedDocumentBlock(),
            template='blocks/document-list.html',
            icon='doc-empty')),
        ('simple_document_list', blocks.ListBlock(
            FeedDocumentBlock(),
            template='blocks/simple-document-list.html',
            icon='doc-empty')),
    ], null=True, use_json_field=True)
    sidebar = stream_factory(null=True, blank=True, use_json_field=True)
    related_topics = StreamField([
        ('related_topics', blocks.ListBlock(
            blocks.PageChooserBlock(label="Related topic")
        ))
    ], null=True, blank=True, use_json_field=True)
    citations = StreamField([
        ('citations', blocks.ListBlock(CitationsBlock()))],
        null=True, blank=True, use_json_field=True)
    record_articles = StreamField([
        ('record_articles', blocks.ListBlock(
            blocks.PageChooserBlock(target_model=RecordPage)
        ))
    ], null=True, blank=True, use_json_field=True)
    continue_learning = StreamField([
        ('continue_learning', blocks.ListBlock(ThumbnailBlock(), icon='doc-empty')),
    ], null=True, blank=True, use_json_field=True)
    show_contact_link = models.BooleanField(
        max_length=255, default=True, null=False, blank=False,
        choices=[
            (True, 'Show contact link'),
            (False, 'Do not show contact link')
        ])

    content_panels = Page.content_panels + [
        FieldPanel('author'),
        FieldPanel('date'),
        FieldPanel('body'),
        FieldPanel('related_topics'),
        FieldPanel('citations'),
        FieldPanel('continue_learning'),
        MultiFieldPanel([
            FieldPanel('sidebar'),
            FieldPanel('record_articles'),
            FieldPanel('show_contact_link'),
        ],
            heading="Sidebar",
            classname="collapsible"
        )
    ]

# Adds a settings choice-field for conditionally adding a JS script to a CustomPage
    conditional_js = models.CharField(max_length=255, choices=constants.conditional_js.items(), blank=True, null=True, help_text='Choose a JS script to add only to this page')
    # Adds a settings field for making a custom title that displays in the Wagtail page explorer
    menu_title = models.CharField(max_length=255, blank=True)
    settings_panels = Page.settings_panels + [
        FieldPanel('menu_title'),
        FieldPanel('conditional_js')
    ]

    def get_admin_display_title(self):
        return self.menu_title if self.menu_title else self.title

    @property
    def content_section(self):
        return get_content_section(self)


class PressLandingPage(Page):
    hero = stream_factory(null=True, blank=True, use_json_field=True)
    release_intro = stream_factory(null=True, blank=True, use_json_field=True)
    digest_intro = stream_factory(null=True, blank=True, use_json_field=True)

    option_blocks = StreamField([
        ('option_blocks', OptionBlock())
    ], use_json_field=True)

    contact_intro = stream_factory(null=True, blank=True, use_json_field=True)

    content_panels = Page.content_panels + [
        FieldPanel('hero'),
        FieldPanel('release_intro'),
        FieldPanel('digest_intro'),
        FieldPanel('option_blocks'),
        FieldPanel('contact_intro'),
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
        FieldPanel('body')
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
    ], null=True, use_json_field=True)
    category = models.CharField(max_length=255,
                                choices=constants.report_parent_categories.items(), null=True)
    content_panels = Page.content_panels + [
        FieldPanel('intro'),
        FieldPanel('category')
    ]

    @property
    def content_section(self):
        return get_content_section(self)

    @property
    def category_filters(self):
        return constants.report_category_groups[self.category]


class ReportsLandingPage(ContentPage, UniqueModel):
    subpage_types = ['DocumentFeedPage']
    intro = StreamField([
        ('paragraph', blocks.RichTextBlock())
    ], null=True, use_json_field=True)

    document_feeds = StreamField([
        ('document_feed_blurb', DocumentFeedBlurb())
    ], null=True, blank=True, use_json_field=True)

    content_panels = Page.content_panels + [
        FieldPanel('intro'),
        FieldPanel('document_feeds')
    ]

    @property
    def content_section(self):
        return 'about'


class AboutLandingPage(Page):
    hero = stream_factory(null=True, blank=True, use_json_field=True)
    sections = StreamField([
        ('sections', OptionBlock())
    ], null=True, use_json_field=True)

    subpage_types = ['ResourcePage', 'DocumentFeedPage', 'ReportsLandingPage', 'OfficePage']

    content_panels = Page.content_panels + [
        FieldPanel('hero'),
        FieldPanel('sections')
    ]

    @property
    def content_section(self):
        return 'about'


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
    ], null=True, blank=True, use_json_field=True)

    commissioner_email = models.CharField(max_length=255, blank=True)
    commissioner_phone = models.CharField(max_length=255, null=True, blank=True)
    commissioner_twitter = models.CharField(max_length=255, null=True, blank=True)

    content_panels = Page.content_panels + [
        FieldPanel('first_name'),
        FieldPanel('middle_initial'),
        FieldPanel('last_name'),
        FieldPanel('picture'),
        FieldPanel('sworn_in'),
        FieldPanel('term_expiration'),
        FieldPanel('reappointed_dates'),
        FieldPanel('party_affiliation'),
        FieldPanel('commissioner_title'),
        FieldPanel('commissioner_bio'),
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
    body = stream_factory(null=True, blank=True, use_json_field=True)
    sidebar_title = models.CharField(max_length=255, null=True, blank=True)

    related_pages = StreamField([
        ('related_pages', blocks.ListBlock(blocks.PageChooserBlock()))
    ], null=True, blank=True, use_json_field=True)
    sections = StreamField([
        ('section', CollectionBlock())
    ], use_json_field=True)

    reporting_examples = StreamField([
        ('reporting_examples', blocks.ListBlock(CitationsBlock()))
    ], null=True, blank=True, use_json_field=True)

    show_search = models.BooleanField(
        max_length=255, default=False, null=False, blank=False,
        choices=[
            (True, 'Show committee search box'),
            (False, 'Do not show committee search box')
        ])
    show_contact_card = models.BooleanField(
        max_length=255, default=True, null=False, blank=False,
        choices=[
            (True, 'Show contact card'),
            (False, 'Do not show contact card')
        ])
    content_panels = Page.content_panels + [
        FieldPanel('body'),
        FieldPanel('sidebar_title'),
        FieldPanel('show_search'),
        FieldPanel('show_contact_card'),
        FieldPanel('related_pages'),
        FieldPanel('sections'),
        FieldPanel('reporting_examples')
    ]

    # Adds a settings field for making a custom title that displays in the Wagtail page explorer
    menu_title = models.CharField(max_length=255, blank=True)
    settings_panels = Page.settings_panels + [
        FieldPanel('menu_title')
    ]

    def get_admin_display_title(self):
        return self.menu_title if self.menu_title else self.title

    @property
    def content_section(self):
        return get_content_section(self)


class ResourcePage(Page):
    # Class for pages that include a side nav, multiple sections and citations
    date = models.DateField(default=datetime.date.today)
    formatted_title = models.CharField(
        max_length=255, null=True, blank=True, default='',
        help_text="Use if you need italics in the title. e.g. <em>Italicized words</em>")
    intro = StreamField([
        ('paragraph', blocks.RichTextBlock())
    ], null=True, blank=True, use_json_field=True)
    sidebar_title = models.CharField(max_length=255, null=True, blank=True)
    related_pages = StreamField([
        ('related_pages', blocks.ListBlock(blocks.PageChooserBlock())),
        ('external_page', blocks.RichTextBlock()),
    ], null=True, blank=True, use_json_field=True)
    sections = StreamField([
        ('sections', ResourceBlock())
    ], null=True, blank=True)
    citations = StreamField([
        ('citations', blocks.ListBlock(CitationsBlock()))
    ], null=True, blank=True, use_json_field=True)
    related_topics = StreamField([
        ('related_topics', blocks.ListBlock(
            blocks.PageChooserBlock(label="Related topic")
        ))
    ], null=True, blank=True, use_json_field=True)
    category = models.CharField(
        max_length=255, choices=constants.report_child_categories.items(),
        help_text='If this is a report, add a category', blank=True, null=True)
    # breadcrumb_style removed from promote-panel in favor of controlling breadcrumbs by parent section
    breadcrumb_style = models.CharField(
        max_length=255, choices=[('primary', 'Blue'), ('secondary', 'Red')], default='primary')
    show_contact_card = models.BooleanField(
        max_length=255, default=False, null=False, blank=False,
        choices=[
            (True, 'Show contact card'),
            (False, 'Do not show contact card')
        ])

    content_panels = Page.content_panels + [
        FieldPanel('formatted_title'),
        FieldPanel('intro'),
        FieldPanel('sidebar_title'),
        FieldPanel('related_pages'),
        FieldPanel('sections'),
        FieldPanel('citations'),
        FieldPanel('related_topics'),
        FieldPanel('show_contact_card')
    ]

    promote_panels = Page.promote_panels + [
        FieldPanel('category'),
        FieldPanel('date')
    ]

    # Adds a settings field for making a custom title that displays in the Wagtail page explorer
    menu_title = models.CharField(max_length=255, blank=True)
    settings_panels = Page.settings_panels + [
        FieldPanel('menu_title')
    ]

    def get_admin_display_title(self):
        return self.menu_title if self.menu_title else self.title

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

    hero = stream_factory(null=True, blank=True, use_json_field=True)

    intro = StreamField([
        ('paragraph', blocks.RichTextBlock())
    ], null=True, use_json_field=True)

    content_panels = Page.content_panels + [
        FieldPanel('hero'),
        FieldPanel('intro'),
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
    HEARING = 'H'
    MEETING_TYPE_CHOICES = (
        (OPEN, 'Open meeting'),
        (EXECUTIVE, 'Executive session'),
        (HEARING, 'Hearing'),
    )

    date = models.DateField(default=datetime.date.today)
    end_date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True, help_text='If no time is entered,\
     the time will be set to 10 a.m.')
    meeting_type = models.CharField(
        max_length=2,
        choices=MEETING_TYPE_CHOICES,
        default=OPEN
    )
    additional_information = models.TextField(blank=True, help_text='This field\
        accepts html')
    info_message = StreamField([
        ('informational_message', SnippetChooserBlock(
            'home.EmbedSnippet',
            required=False, template='blocks/embed-info-message.html', icon='warning')),
    ], null=True, blank=True, use_json_field=True)
    draft_minutes_links = models.TextField(
        blank=True, help_text='URLs separated by a newline')
    approved_minutes_date = models.DateField(null=True, blank=True)
    approved_minutes_link = models.URLField(blank=True)
    sunshine_act_links = models.TextField(
        blank=True, help_text='URLs separated by a newline')
    live_video_embed = models.CharField(
        blank=True, max_length=255, help_text='Youtube video ID of the live-stream of the meeting')

    imported_html = StreamField(
        [('html_block', blocks.RawHTMLBlock())],
        null=True,
        blank=True,
        use_json_field=True
    )

    sunshine_act_doc_upld = StreamField(
        [('sunshine_act_upld', DocumentChooserBlock(required=False))],
        null=True,
        blank=True,
        use_json_field=True
    )

    full_video_url = models.URLField(blank=True)
    full_audio_url = models.URLField(blank=True)
    mtg_transcript_url = models.URLField(blank=True)

    homepage_hide = models.BooleanField(default=False)

    agenda = StreamField([
        ('agenda_item', blocks.StructBlock([
            ('item_title', blocks.TextBlock(required=True)),
            ('item_text', blocks.RichTextBlock(required=False)),
            ('item_audio', DocumentChooserBlock(required=False)),
            ('item_video', blocks.URLBlock(required=False, help_text='Add a YouTube URL to a specific\
                time in a video for this agenda item')),

        ]))
    ], blank=True, null=True, use_json_field=True)

    content_panels = Page.content_panels + [
        FieldPanel('info_message', heading='Informational message'),
        FieldPanel('additional_information'),
        FieldPanel('agenda'),
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
                # FieldPanel('sunshine_act_links'),
                FieldPanel('sunshine_act_doc_upld'),
            ],
            heading='Sunshine notices',
            classname='collapsible collapsed'
        ),
        MultiFieldPanel(
            [
                FieldPanel('draft_minutes_links'),
                FieldPanel('approved_minutes_link'),
                FieldPanel('approved_minutes_date'),
            ],
            heading='Minutes',
            classname='collapsible collapsed'
        ),
        MultiFieldPanel(
            [
                FieldPanel('full_video_url'),
                FieldPanel('full_audio_url'),
                FieldPanel('mtg_transcript_url'),
                FieldPanel('live_video_embed')
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

    promote_panels = Page.promote_panels + [
        FieldPanel('homepage_hide')
    ]

    search_fields = Page.search_fields + [
        index.FilterField('title'),
        index.FilterField('meeting_type'),
        index.FilterField('date'),
        index.SearchField('imported_html'),
        index.SearchField('agenda')
    ]

    @property
    def get_update_type(self):
        return constants.update_types['commission-meeting']

    @property
    def content_section(self):
        return 'about'

    @property
    def social_image_identifier(self):
        return 'meeting-page'


class ExamplePage(Page):
    """Page template for "how to report" and "example scenario" pages
    Always within the Help section"""
    featured_image = models.ForeignKey(
        'wagtailimages.Image', blank=True, null=True, on_delete=models.SET_NULL, related_name='+')

    pre_title = models.CharField(blank=True, null=True, max_length=255, choices=[
        ('how', 'How to report'),
        ('scenario', 'Example scenario'),
        ('example', 'Example')
    ])

    body = StreamField([
        ('paragraph', blocks.RichTextBlock()),
        ('example_image', ExampleImage()),
        ('reporting_example_cards', ReportingExampleCards()),
        ('internal_button', InternalButtonBlock()),
        ('external_button', ExternalButtonBlock()),
        ('image', ImageChooserBlock()),
        ('html', blocks.RawHTMLBlock()),
    ], null=True, use_json_field=True)

    related_media_title = models.CharField(blank=True, null=True, max_length=255)
    related_media = StreamField([
        ('continue_learning', blocks.ListBlock(ThumbnailBlock(),
         icon='doc-empty', template='blocks/related-media.html')),
    ], null=True, blank=True, use_json_field=True)

    content_panels = Page.content_panels + [
        FieldPanel('pre_title'),
        FieldPanel('featured_image'),
        FieldPanel('body'),
        FieldPanel('related_media_title'),
        FieldPanel('related_media')
    ]

    @property
    def content_section(self):
        return 'help'


@register_snippet
class EmbedSnippet(models.Model):
    title = models.TextField()
    description = models.TextField()
    text = models.TextField()

    panels = [
        FieldPanel('title'),
        FieldPanel('description'),
        FieldPanel('text'),
    ]

    def __str__(self):
        return '{} ({})'.format(self.title, self.description)

    class Meta:
        ordering = ['-id']


class ContactPage(Page):
    contact_items = StreamField([
        ('contact_items', ContactInfoBlock())
    ], use_json_field=True)
    info_message = StreamField([
        ('informational_message', SnippetChooserBlock(
            'home.EmbedSnippet',
            required=False, template='blocks/embed-info-message.html', icon='warning')),
    ], null=True, blank=True, use_json_field=True)
    services_title = models.TextField()
    services = StreamField([
        ('services', blocks.RichTextBlock())
    ], use_json_field=True)

    content_panels = Page.content_panels + [
        FieldPanel('contact_items'),
        FieldPanel('info_message', heading='Informational message'),
        FieldPanel('services_title'),
        FieldPanel('services'),
    ]

    @property
    def content_section(self):
        return 'about'


class FullWidthPage(ContentPage):
    formatted_title = models.CharField(
        max_length=255, null=True, blank=True, default='',
        help_text="Use if you need italics in the title. e.g. <em>Italicized words</em>")
    citations = StreamField([('citations', blocks.ListBlock(CitationsBlock()))],
                            null=True, blank=True, use_json_field=True)

    template = 'home/full_width_page.html'
    content_panels = ContentPage.content_panels + [
        FieldPanel('citations')
    ]

    promote_panels = Page.promote_panels

    search_fields = ContentPage.search_fields

    @property
    def content_section(self):
        return ''


class OigLandingPage(Page):
    """OIG's landing page"""
    intro_message = RichTextField(features=['bold', 'italic', 'link'], null=True)
    complaint_url = models.URLField(max_length=255, blank=True, verbose_name='Complaint URL')
    show_info_message = models.BooleanField(help_text='☑︎ display informational message | ☐ hide message')
    info_message = RichTextField(features=['bold', 'italic', 'link'], null=True, blank=True)
    stats_content = StreamField(
        [
            ('heading', blocks.CharBlock(form_classname='full title', icon='title')),
            ('paragraph', blocks.RichTextBlock()),
            ('html', blocks.RawHTMLBlock(label='HTML')),
            ('image', ImageChooserBlock()),
            ('table', TableBlock(table_options=core_table_options)),
            ('custom_table', CustomTableBlock()),
        ],
        null=True, blank=True, use_json_field=True,
        help_text='If this section is empty, the logo will be shown (for screens larger than phones)'
    )

    recent_reports_url = models.URLField(max_length=255, blank=True, verbose_name='All reports URL')
    resources = StreamField(
        [('html', blocks.RawHTMLBlock(label='OIG resources'))],
        null=True,
        blank=True,
        use_json_field=True
    )
    you_might_also_like = StreamField(
        blocks.StreamBlock([
            ('group', blocks.ListBlock(LinkBlock(), icon='list-ul', label='Group/column'))
        ],
            max_num=3,
            required=False
        ),
        null=True,
        blank=True,
        use_json_field=True,
        help_text='Expects three groups/columns but will accept fewer'
    )

    content_panels = Page.content_panels + [
        MultiFieldPanel([
            FieldPanel('intro_message'),
            FieldPanel('complaint_url', help_text='Where should the button in the header link?'),
        ],
            heading='Header'
        ),
        MultiFieldPanel([
            FieldPanel('show_info_message'),
            FieldPanel('info_message'),
        ],
            heading='Alert / informational message'
        ),
        FieldPanel('recent_reports_url'),
        FieldPanel('stats_content'),
        FieldPanel('resources', heading='OIG resources'),
        FieldPanel('you_might_also_like'),
    ]

    @property
    def category_filters(self):
        return constants.report_category_groups['oig']


class OfficePage(Page):
    offices = StreamField([
        ('office', blocks.StructBlock([
            ('office_title', blocks.CharBlock(required=True, blank=True, null=True, help_text='Required')),
            ('hide_title', blocks.BooleanBlock(required=False, help_text='Should the offfice title be displayed?')),
            ('office_description', blocks.RichTextBlock(blank=True)),
            ('more_info', blocks.StreamBlock([
               ('html', blocks.RawHTMLBlock(blank=True)),
               ('internal_button', InternalButtonBlock(blank=True)),
               ('external_button', ExternalButtonBlock(blank=True)),
               ('document', FeedDocumentBlock(blank=True, template='blocks/simple-document.html')),
            ], blank=True, required=False, help_text='Use for internal/external btns or document-links')),
            ('employee', blocks.StructBlock([
                ('employee_name', blocks.CharBlock(blank=True, required=False)),
                ('employee_title', EmployeeTitle(blank=True,  required=False,
                                                 help_text='<b style="color:green">For footnote on title, use html block with &lt;sup&gt;1&lt;/sup&gt;</b>')),
                ('employee_image', ImageChooserBlock(blank=True, required=False)),
                ('employee_bio', blocks.RichTextBlock(blank=True, required=False)),
            ], blank=True, required=False, null=True, default=[])),
            ('contact_info', ContactInfoBlock(blank=True)),
            ('extra_info', blocks.StreamBlock([
                ('html', blocks.RawHTMLBlock(blank=True, required=False, help_text='<b style="color:green">For footnote, use &lt;sup&gt;1&lt;/sup&gt;</b>')),
                ('text', blocks.RichTextBlock(blank=True, required=False)),
             ], blank=True, required=False, null=True,
                    help_text='Use for sub-offices, staff-lists, footnotes or \
                    any extra info appearing at bottom of office section <br> \
                    <b style="color:green">For footnote, use html block with &lt;sup&gt;1&lt;/sup&gt;</b>')),
        ], null=True, blank=True)),
    ], null=True, blank=True, use_json_field=True)

    content_panels = Page.content_panels + [
        FieldPanel('offices'),
    ]

    @property
    def content_section(self):
        return 'about'


class ReportingDatesTable(Page):
    reporting_dates_table = StreamField([
        ('paragraph', blocks.RichTextBlock(blank=True)),
        ('html', blocks.RawHTMLBlock()),
        ('internal_button', InternalButtonBlock()),
        ('external_button', ExternalButtonBlock()),
        ('dates_table', ReportingTableBlock(blank=True, required=False,form_classname='title')),
    ], blank=True, null=True, required=False, use_json_field=True, collapsed=False)

    footnotes = StreamField([
        ('footnote_section', blocks.StructBlock([
            ('title', blocks.ChoiceBlock(choices=[
                ('Footnotes', 'Footnotes'),
                ('Header notes', 'Header notes'),
            ], required=True, help_text='Choose either Footnotes or Header notes', blank=True, Null=True)),
            ('footnote', blocks.ListBlock(blocks.StructBlock([
                ('footnote_number', blocks.CharBlock(blank='true', icon='tag', form_classname='title')),
                ('footnote_text', blocks.RichTextBlock(blank='true', icon='pilcrow', help_text='')),
            ])))
        ], blank=True))
    ], blank=True, use_json_field=True)
    citations = StreamField([('citations', blocks.ListBlock(CitationsBlock()))], null=True, blank=True)

    content_panels = Page.content_panels + [
        FieldPanel('reporting_dates_table'),
        FieldPanel('footnotes'),
        FieldPanel('citations')
    ]
