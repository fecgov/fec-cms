import datetime
import functools
import logging

from django.db import models
from django.core.exceptions import ValidationError
from django.dispatch import receiver
from django.db.models.signals import post_save, pre_delete
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.utils.text import slugify
from itertools import groupby
from modelcluster.fields import ParentalKey
from modelcluster.contrib.taggit import ClusterTaggableManager
from taggit.models import TaggedItemBase
from wagtail.models import Orderable, Page, Revision
from wagtail.fields import RichTextField, StreamField
from wagtail import blocks
from wagtail.admin.panels import (
    HelpPanel,
    InlinePanel,
    MultiFieldPanel,
    PageChooserPanel,
    FieldPanel,
    FieldRowPanel)
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


def extract_first_case_number(title):
    """
    Extract the first case number from a court case title for sorting.
    Case numbers appear in formats like (19-1021), (20-0588 / 21-5081), etc.
    Returns the first (year, number) tuple found, or None if no case number exists.
    """
    import re
    match = re.search(r'(\d{2})-(\d+)', title)
    if not match:
        return None
    return (int(match.group(1)), int(match.group(2)))


def get_sort_key_for_title(title):
    """
    Get the sort key for a title, converting leading numbers to words.
    This ensures proper alphabetical sorting where "21st Century" sorts under "T" not "2".

    Examples:
        "21st Century Fund" -> "twenty-one st Century Fund"
        "501(c)(4)" -> "five hundred one(c)(4)"
        "Adams v. FEC" -> "Adams v. FEC"
    """
    import re

    # Number to word mappings for 0-99
    ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
    teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
             'sixteen', 'seventeen', 'eighteen', 'nineteen']
    tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

    def num_to_words(n):
        """Convert a number 0-999 to words"""
        if n == 0:
            return 'zero'
        elif n < 10:
            return ones[n]
        elif n < 20:
            return teens[n - 10]
        elif n < 100:
            return tens[n // 10] + ('' if n % 10 == 0 else '-' + ones[n % 10])
        else:
            hundreds = ones[n // 100] + ' hundred'
            remainder = n % 100
            if remainder == 0:
                return hundreds
            return hundreds + ' ' + num_to_words(remainder)

    # Check if title starts with digits
    match = re.match(r'^(\d+)', title)
    if match:
        number = int(match.group(1))
        # Convert number to words
        number_words = num_to_words(number)
        # Replace the number with words in the title
        return re.sub(r'^\d+', number_words, title, count=1)

    return title


def court_case_sort_key(case, get_sort_key_func=None):
    """
    Generate a sort key for a court case.
    Sorts alphabetically by index_title (or title if no index_title),
    then by case numbers (higher first) for same titles.

    Args:
        case: A CourtCasePage instance
        get_sort_key_func: Optional function to transform title for alphabetical sorting.
                          Defaults to get_sort_key_for_title which converts leading numbers to words.
    """
    import re
    title = case.index_title if case.index_title else case.title

    # Use provided function or default to get_sort_key_for_title
    sort_key_func = get_sort_key_func or get_sort_key_for_title

    # Strip case numbers from title for alphabetical comparison
    # This ensures "Case v. FEC (25-4559)" and "Case v. FEC (25-4072)" compare as equal alphabetically
    alpha_title = re.sub(r'\s*\([^)]*\)\s*$', '', title).strip()
    alpha_key = sort_key_func(alpha_title).lower()

    # Sort by the first case number in the title, with higher numbers first (reverse chronological)
    first_case_num = extract_first_case_number(title)
    # Negate so higher numbers sort first; use (0, 0) if no case number
    num_key = (-first_case_num[0], -first_case_num[1]) if first_case_num else (0, 0)

    return (alpha_key, num_key)


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

    body = stream_factory(null=True, blank=True)

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
        logger.info('User {0} logged in'.format(kwargs.get('instance').get_username()))
    else:
        logger.info('User change: username {0} by instance {1}'.format(kwargs.get('instance').get_username(),
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
            logger.info('User change: User {0} was {1} {2} group {3}'.format(kwargs.get('instance').get_username(),
                        action_map[kwargs.get('action')],
                        action, group_map[kwarg]))


m2m_changed.connect(user_groups_changed, sender=User.groups.through)


class HomePage(ContentPage, UniqueModel):
    page_description = 'The Homepage'
    parent_page_types = []

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
        help_text='Not required: Only choose this if you want this author to show up as part an official author group')

    panels = [
        FieldPanel('name'),
        FieldPanel('title'),
        FieldPanel('email'),
        FieldPanel('photo'),
        FieldPanel('phone'),
        FieldPanel('bio'),
        MultiFieldPanel([
            FieldPanel('author_group')],
            heading='Author Groups - Not required (For admin use only)',
            classname='collapsible collapsed')
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
    page_description = 'Used to show the latest updates and information about the Commission and campaign finance law'
    formatted_title = models.CharField(
        max_length=255, null=True, blank=True, default='',
        help_text='Use if you need italics in the title. e.g. <em>Italicized words</em>')
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
            heading='Home page feed'
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
    page_description = 'Child page from Updates and displays what took place at the Agency for the week'
    date = models.DateField(default=datetime.date.today)
    read_next = models.ForeignKey('DigestPage', blank=True, null=True,
                                  default=get_previous_digest_page,
                                  on_delete=models.SET_NULL)

    content_panels = ContentPage.content_panels + [
        FieldPanel('date'),
        InlinePanel('authors', label='Authors'),
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
    page_description = 'Commission news and journalist resource'
    parent_page_types = ['CustomPage', 'HomePage', 'PressLandingPage']
    date = models.DateField(default=datetime.date.today)
    formatted_title = models.CharField(
        max_length=255, null=True, blank=True, default='',
        help_text='Use if you need italics in the title. e.g. <em>Italicized words</em>')
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
        InlinePanel('authors', label='Authors'),
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
            heading='Home page feed'
        )
    ]

    search_fields = ContentPage.search_fields + [
        index.FilterField('category'),
        index.FilterField('date'),
        index.FilterField('url_path')
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
    page_description = 'Weekly short paragraph of helpful information targeted to Treasurers - Child page from Updates'
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
    #     heading='Home page feed'
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
    page_description = 'Homepage announcement banners, to be used only on the ‘Home page: Banners’ page'
    parent_page_types = ['HomePage', 'CustomPage']
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
            heading='Home page banner announcement'
        )
    ]

    def get_sitemap_urls(self, request=None):
        return []


class AlertForEmergencyUseOnly(Page):
    page_description = 'Larger banner for emergency alerts on the home page'
    parent_page_types = ['HomePage', 'CustomPage']
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
            heading='This ‘alert for emergency use only’ feature \
            is used exclusively for an agency shutdown, or emergency \
            event in which the agency as a whole cannot assist the \
            regulated community or the public. The use of this feature \
            requires approval by Amy Kort or Wei Luo prior to deployment.'
        )
    ]

    def get_sitemap_urls(self, request=None):
        return []


class CustomPage(Page):
    page_description = 'Content pages that cover a single topic and do not need separate sections or \
        left-hand navigation'
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
    ], null=True)
    sidebar = stream_factory(null=True, blank=True)
    related_topics = StreamField([
        ('related_topics', blocks.ListBlock(
            blocks.PageChooserBlock(label='Related topic')
        ))],
        null=True, blank=True)
    citations = StreamField([
        ('citations', blocks.ListBlock(CitationsBlock()))],
        null=True, blank=True)
    record_articles = StreamField([
        ('record_articles', blocks.ListBlock(
            blocks.PageChooserBlock(target_model=RecordPage)
        ))],
        null=True, blank=True)
    continue_learning = StreamField([
            ('continue_learning', blocks.ListBlock(ThumbnailBlock(), icon='doc-empty')),
        ],
        null=True, blank=True)
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
            heading='Sidebar',
            classname='collapsible'
        )
    ]

# Adds a settings choice-field for conditionally adding a JS script to a CustomPage
    conditional_js = models.CharField(max_length=255,
                                      choices=constants.conditional_js.items(),
                                      blank=True,
                                      null=True,
                                      help_text='Choose a JS script to add only to this page')
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
    page_description = 'Unique landing page - Press'
    parent_page_types = ['HomePage']
    subpage_types = ['CollectionPage', 'DigestPage', 'PressReleasePage']
    hero = stream_factory(null=True, blank=True)
    release_intro = stream_factory(null=True, blank=True)
    digest_intro = stream_factory(null=True, blank=True)

    option_blocks = StreamField([
        ('option_blocks', OptionBlock())
    ])

    contact_intro = stream_factory(null=True, blank=True)

    content_panels = Page.content_panels + [
        FieldPanel('hero'),
        FieldPanel('release_intro'),
        FieldPanel('digest_intro'),
        FieldPanel('option_blocks'),
        FieldPanel('contact_intro'),
    ]


class DocumentPage(ContentPage):
    page_description = 'Page for linking a PDF to a document feed page'
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
    page_description = 'When users need to scan or browse a collection of documents in a single parent category'
    subpage_types = ['DocumentPage', 'ResourcePage']
    intro = StreamField([
        ('paragraph', blocks.RichTextBlock())
    ], null=True)
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
    page_description = 'Unique landing page - Reports'
    subpage_types = ['DocumentFeedPage']
    parent_page_types = ['AboutLandingPage']
    intro = StreamField([
        ('paragraph', blocks.RichTextBlock())
    ], null=True)

    document_feeds = StreamField([
        ('document_feed_blurb', DocumentFeedBlurb())
    ], null=True, blank=True)

    content_panels = Page.content_panels + [
        FieldPanel('intro'),
        FieldPanel('document_feeds')
    ]

    @property
    def content_section(self):
        return 'about'


class AboutLandingPage(Page):
    page_description = 'Unique landing page - About FEC'
    parent_page_types = ['HomePage']
    subpage_types = [
        'CustomPage', 'DocumentFeedPage', 'OfficePage', 'ReportsLandingPage', 'ResourcePage', 'FecTimelinePage'
    ]
    hero = stream_factory(null=True, blank=True)
    sections = StreamField([
        ('sections', OptionBlock())
    ], null=True)

    content_panels = Page.content_panels + [
        FieldPanel('hero'),
        FieldPanel('sections')
    ]

    @property
    def content_section(self):
        return 'about'


class CommissionerPage(Page):
    page_description = 'For every FEC commissioner’s bio page'
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
    picture_download = models.ForeignKey(
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

    commissioner_email = models.CharField(max_length=255, blank=True, verbose_name='Commissioner email address')
    commissioner_phone = models.CharField(max_length=255, null=True, blank=True,
                                          verbose_name='Commissioner phone number')
    commissioner_bluesky = models.CharField(max_length=255, null=True, blank=True,
                                            verbose_name='Commissioner Bluesky handle',
                                            help_text='The part after https://bsky.app/profile/')
    commissioner_twitter = models.CharField(max_length=255, null=True, blank=True,
                                            verbose_name='Commissioner X/Twitter handle',
                                            help_text='The part after https://x.com/')

    content_panels = Page.content_panels + [
        FieldPanel('first_name'),
        FieldPanel('middle_initial'),
        FieldPanel('last_name'),
        FieldPanel('picture'),
        FieldPanel('picture_download'),
        FieldPanel('sworn_in'),
        FieldPanel('term_expiration'),
        FieldPanel('reappointed_dates'),
        FieldPanel('party_affiliation'),
        FieldPanel('commissioner_title'),
        FieldPanel('commissioner_bio'),
        FieldPanel('commissioner_email'),
        FieldPanel('commissioner_phone'),
        FieldPanel('commissioner_bluesky'),
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
    page_description = 'Template used for each receipts/disbursement etc. section of H4CC'
    body = stream_factory(null=True, blank=True)
    sidebar_title = models.CharField(max_length=255, null=True, blank=True)
    related_pages = StreamField([
        ('related_pages', blocks.ListBlock(blocks.PageChooserBlock()))
    ], null=True, blank=True)
    sections = StreamField([
        ('section', CollectionBlock())
    ])

    reporting_examples = StreamField([
        ('reporting_examples', blocks.ListBlock(CitationsBlock()))
    ], null=True, blank=True)

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
        ]
    )
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
    page_description = 'Class for pages that include a side nav, multiple sections and citations'
    date = models.DateField(default=datetime.date.today)
    formatted_title = models.CharField(
        max_length=255, null=True, blank=True, default='',
        help_text='Use if you need italics in the title. e.g. <em>Italicized words</em>')
    intro = StreamField([
        ('paragraph', blocks.RichTextBlock()),
        ('informational_message', SnippetChooserBlock(
            'home.EmbedSnippet',
            template='blocks/embed-info-message.html',
            icon='warning',
            help_text='Use for an info or alert message banner')),
    ], null=True, blank=True)
    sidebar_title = models.CharField(max_length=255, null=True, blank=True)
    related_pages = StreamField([
        ('related_pages', blocks.ListBlock(blocks.PageChooserBlock())),
        ('external_page', blocks.RichTextBlock()),
    ], null=True, blank=True)
    sections = StreamField([
        ('sections', ResourceBlock())
    ], null=True, blank=True)
    citations = StreamField([
        ('citations', blocks.ListBlock(CitationsBlock()))
    ], null=True, blank=True)
    related_topics = StreamField([
        ('related_topics', blocks.ListBlock(
            blocks.PageChooserBlock(label='Related topic')
        ))
    ], null=True, blank=True)
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
    page_description = 'Unique landing page - Legal Resources'
    parent_page_types = ['HomePage']
    subpage_types = ['ResourcePage']
    template = 'home/legal/legal_resources_landing.html'

    @property
    def content_section(self):
        return 'legal'


class CourtCaseIndexPage(ContentPage):
    intro = RichTextField(blank=True)
    sidebar = stream_factory(null=True, blank=True)
    record_articles = RichTextField(blank=True)
    show_contact_link = models.BooleanField(default=False)
    continue_learning = StreamField([
        ('thumbnail_list', blocks.ListBlock(ThumbnailBlock()))
    ], null=True, blank=True)
    related_topics = StreamField([
        ('related_topics', blocks.ListBlock(
            blocks.PageChooserBlock(label='Related topic')
        ))
    ], null=True, blank=True)
    citations = StreamField([
        ('citations', blocks.ListBlock(CitationsBlock()))
    ], null=True, blank=True)
    conditional_js = models.CharField(
        max_length=255,
        choices=[
            ('', 'No conditional JavaScript'),
            ('glossary', 'Glossary'),
        ],
        default='',
        blank=True
    )

    subpage_types = ['CourtCasePage']

    content_panels = Page.content_panels + [
        FieldPanel('intro'),
        FieldPanel('body'),
        FieldPanel('sidebar'),
        FieldPanel('record_articles'),
        FieldPanel('show_contact_link'),
        FieldPanel('continue_learning'),
        FieldPanel('related_topics'),
        FieldPanel('citations'),
        FieldPanel('conditional_js'),
    ]

    def get_sort_key(self, title):
        """
        Get the sort key for a title, converting leading numbers to words.
        Delegates to the module-level get_sort_key_for_title function.
        """
        return get_sort_key_for_title(title)

    def get_context(self, request):
        from django.db.models import Case, When, F, CharField

        # Get the default context from the superclass
        context = super().get_context(request)

        # Get all live, published court cases site-wide
        # Sort by index_title if present, otherwise by title
        all_cases = CourtCasePage.objects.live().annotate(
            sort_title=Case(
                When(index_title='', then=F('title')),
                default=F('index_title'),
                output_field=CharField()
            )
        )

        # Convert to list and sort using custom sort key
        # Sorts alphabetically (by index_title or title), then by case numbers (higher first) for same titles
        cases_list = list(all_cases)
        cases_list.sort(key=lambda c: court_case_sort_key(c))

        total_cases_count = len(cases_list)

        # Optional search filter
        query = request.GET.get('q', '').strip()
        if query:
            cases_list = [
                case for case in cases_list
                if query.lower() in (case.title.lower()) or
                query.lower() in (case.index_title.lower() if case.index_title else '')
            ]

        # Group cases by first letter (use index_title if available, otherwise title)
        grouped_cases = {}
        for case in cases_list:
            display_title = case.index_title if case.index_title else case.title
            # Get the sort key to determine the letter
            sort_key = self.get_sort_key(display_title)
            letter = sort_key[0].upper() if sort_key else 'A'
            grouped_cases.setdefault(letter, []).append(case)

        cases = cases_list

        # Add variables to the context for the template
        context['cases'] = cases
        context['grouped_cases'] = dict(sorted(grouped_cases.items()))
        context['total_cases_count'] = total_cases_count
        context['filtered_count'] = len(cases)
        context['search_query'] = query if query else None

        return context

    def get_conditional_js_display(self):
        return self.conditional_js if self.conditional_js else ''

    @property
    def content_section(self):
        return 'legal'


class CourtCasePage(Page):
    index_title = models.CharField(
        max_length=255,
        blank=True,
        help_text=(
            'Title format for the alphabetical index page (e.g., "Adams: FEC v."). '
            'Leave blank to use the regular page title.'
        )
    )
    status = models.CharField(
        max_length=100,
        choices=[
            ('active', 'Active'),
            ('closed', 'Closed'),
        ],
        default='closed'
    )
    opinions = RichTextField(blank=True)
    see_also_cases = StreamField([
        ('case', blocks.PageChooserBlock(page_type='home.CourtCasePage', label='Related court case'))
    ], null=True, blank=True, help_text='Link to related court cases that should be referenced on the index page')
    case_numbers = StreamField([
        ('case_number', blocks.CharBlock(label='Case number', help_text='e.g., 06-1247'))
    ], null=True, blank=True, help_text='Add one or more case numbers associated with this court case')
    sidebar_title = models.CharField(max_length=255, null=True, blank=True)
    related_pages = StreamField([
        ('related_pages', blocks.ListBlock(blocks.PageChooserBlock())),
        ('external_page', blocks.RichTextBlock()),
    ], null=True, blank=True)
    sections = StreamField([
        ('sections', ResourceBlock())
    ], null=True, blank=True)
    citations = StreamField([
        ('citations', blocks.ListBlock(CitationsBlock()))
    ], null=True, blank=True)
    related_topics = StreamField([
        ('related_topics', blocks.ListBlock(
            blocks.PageChooserBlock(label='Related topic')
        ))
    ], null=True, blank=True)
    show_contact_card = models.BooleanField(
        default=False,
        choices=[
            (True, 'Show contact card'),
            (False, 'Do not show contact card')
        ])
    show_search = models.BooleanField(default=False)
    selected_court_case = models.BooleanField(
        default=False,
        help_text='Check this to include this case in the "Selected Court Cases" list'
    )

    content_panels = Page.content_panels + [
        FieldPanel('index_title'),
        FieldPanel('status'),
        FieldPanel('opinions'),
        FieldPanel('see_also_cases'),
        FieldPanel('case_numbers'),
        FieldPanel('sidebar_title'),
        FieldPanel('related_pages'),
        FieldPanel('sections'),
        FieldPanel('citations'),
        FieldPanel('related_topics'),
        FieldPanel('show_contact_card'),
        FieldPanel('show_search'),
        FieldPanel('selected_court_case'),
    ]

    search_fields = Page.search_fields + [
        index.SearchField('index_title'),
        index.AutocompleteField('index_title'),
        index.FilterField('status'),
    ]

    parent_page_types = ['CourtCaseIndexPage', 'ResourcePage']

    @property
    def content_section(self):
        return 'legal'


class ServicesLandingPage(ContentPage, UniqueModel):
    page_description = 'Unique landing page - Services / Help for Candidates and Committees main landing pages for \
        Candidates, SSF, Nonconnected and Party sections'
    parent_page_types = ['HomePage']
    subpage_types = ['CollectionPage', 'ResourcePage', 'CustomPage']
    template = 'home/candidate-and-committee-services/services_landing_page.html'

    hero = stream_factory(null=True, blank=True)

    intro = StreamField([
        ('paragraph', blocks.RichTextBlock())
    ], null=True)

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
    page_description = 'Open meeting pages; Public hearing pages; Executive session pages'
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
    additional_information = models.TextField(blank=True, help_text='This field accepts html')
    info_message = StreamField(
        [
            ('informational_message', SnippetChooserBlock(
                'home.EmbedSnippet', required=False, template='blocks/embed-info-message.html', icon='warning'
            )),
        ], null=True, blank=True
    )
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
        null=True, blank=True
    )

    sunshine_act_doc_upld = StreamField(
        [('sunshine_act_upld', DocumentChooserBlock(required=False))],
        null=True, blank=True
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
    ], blank=True, null=True)

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
    page_description = 'Page template for “how to report” and “example scenario” pages. Always within the Help section'
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
        ], null=True
    )

    related_media_title = models.CharField(blank=True, null=True, max_length=255)
    related_media = StreamField([
        ('continue_learning', blocks.ListBlock(ThumbnailBlock(),
         icon='doc-empty', template='blocks/related-media.html')),
    ], null=True, blank=True)

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
    page_description = 'Snippet inserted into a content page that normally contains a chart or html text'
    title = models.TextField()
    description = models.TextField()
    text = models.TextField()
    banner_icon = models.TextField(
        blank=True,
        default='info',
        help_text='This field applies to informational-message snippets only. \
            Input `info` or `alert`. Default is `info`')

    panels = [
        FieldPanel('title'),
        FieldPanel('description'),
        FieldPanel('text'),
        FieldPanel('banner_icon'),
    ]

    def __str__(self):
        return '{} ({})'.format(self.title, self.description)

    class Meta:
        ordering = ['-id']


class ContactPage(Page):
    page_description = 'Page template for the Contact page'
    parent_page_types = ['HomePage']
    contact_items = StreamField([
            ('contact_items', ContactInfoBlock())
        ]
    )
    info_message = StreamField([
        ('informational_message', SnippetChooserBlock(
            'home.EmbedSnippet',
            required=False, template='blocks/embed-info-message.html', icon='warning')),
        ], null=True, blank=True
    )
    services_title = models.TextField()
    services = StreamField([
            ('services', blocks.RichTextBlock())
        ]
    )

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
    page_description = 'Page template for special cases where we donʼt need a right column or left nav column'
    formatted_title = models.CharField(
        max_length=255, null=True, blank=True, default='',
        help_text='Use if you need italics in the title. e.g. <em>Italicized words</em>')
    citations = StreamField(
        [('citations', blocks.ListBlock(CitationsBlock()))],
        null=True, blank=True
    )

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
    page_description = 'Unique landing page - OIG'
    parent_page_types = ['HomePage']
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
        help_text='If this section is empty, the logo will be shown (for screens larger than phones)',
        null=True, blank=True
    )

    recent_reports_url = models.URLField(max_length=255, blank=True, verbose_name='All reports URL')
    resources = StreamField(
        [('html', blocks.RawHTMLBlock(label='OIG resources'))],
        null=True, blank=True
    )

    you_might_also_like = StreamField(
        blocks.StreamBlock(
            [('group', blocks.ListBlock(LinkBlock(), icon='list-ul', label='Group/column'))],
            max_num=3,
            required=False
        ),
        help_text='Expects three groups/columns but will accept fewer',
        null=True, blank=True
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

    class Meta:
        verbose_name = 'OIG landing page'

    @property
    def category_filters(self):
        return constants.report_category_groups['oig']


class OfficePage(Page):
    page_description = 'Describes to the user a particular office and its function'
    offices = StreamField([
        ('office', blocks.StructBlock([
            ('office_title', blocks.CharBlock(required=True, blank=True, null=True, help_text='Required')),
            ('hide_title', blocks.BooleanBlock(required=False, help_text='Should the office title be displayed?')),
            ('office_description', blocks.RichTextBlock(blank=True)),
            ('more_info', blocks.StreamBlock([
               ('html', blocks.RawHTMLBlock(blank=True)),
               ('internal_button', InternalButtonBlock(blank=True)),
               ('external_button', ExternalButtonBlock(blank=True)),
               ('document', FeedDocumentBlock(blank=True, template='blocks/simple-document.html')),
            ], blank=True, required=False, help_text='Use for internal/external btns or document-links')),
            ('employee', blocks.StructBlock([
                ('employee_name', blocks.CharBlock(blank=True, required=False)),
                ('employee_title', EmployeeTitle(
                    blank=True,
                    required=False,
                    help_text='<b style="color:green">For footnote on title, \
                        use html block with &lt;sup&gt;1&lt;/sup&gt;</b>')),
                ('employee_image', ImageChooserBlock(blank=True, required=False)),
                ('employee_bio', blocks.RichTextBlock(blank=True, required=False)),
            ], blank=True, required=False, null=True, default=[])),
            ('contact_info', ContactInfoBlock(blank=True)),
            ('extra_info', blocks.StreamBlock([
                ('html', blocks.RawHTMLBlock(
                    blank=True,
                    required=False,
                    help_text='<b style="color:green">For footnote, use &lt;sup&gt;1&lt;/sup&gt;</b>')),
                ('text', blocks.RichTextBlock(blank=True, required=False)),
             ], blank=True, required=False, null=True,
                    help_text='Use for sub-offices, staff-lists, footnotes or \
                    any extra info appearing at bottom of office section <br> \
                    <b style="color:green">For footnote, use html block with &lt;sup&gt;1&lt;/sup&gt;</b>')),
        ], null=True, blank=True)),
    ], null=True, blank=True)

    content_panels = Page.content_panels + [
        FieldPanel('offices'),
    ]

    @property
    def content_section(self):
        return 'about'


class ReportingDatesTable(Page):
    page_description = 'For coordinated communication, electioneering communication, federal election activity, \
        independent expenditure, and pre-election (prior notice) reporting pages'
    reporting_dates_table = StreamField([
        ('paragraph', blocks.RichTextBlock(blank=True)),
        ('html', blocks.RawHTMLBlock()),
        ('internal_button', InternalButtonBlock()),
        ('external_button', ExternalButtonBlock()),
        ('dates_table', ReportingTableBlock(blank=True, required=False, form_classname='title')),
    ], blank=True, null=True, collapsed=False)

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
    ], blank=True)
    citations = StreamField(
        [('citations', blocks.ListBlock(CitationsBlock()))],
        null=True, blank=True
    )

    content_panels = Page.content_panels + [
        FieldPanel('reporting_dates_table', help_text='Zebra-striping tip: To add additional row classes for more \
                   granular control over zebra stripes, wrap the election name text in first column/first cell with \
                   an <election> html tag. Put any footnote tildes at the very end. Example (including a footnote \
                   tilde): <election class="fl1">Florida 1st Congressional District Special Primary</election> ~*'),
        FieldPanel('footnotes'),
        FieldPanel('citations')
    ]


# The list of categories, builds the list of filtering options for the timeline page and timeline entries/items
def fec_timeline_categories():
    return [
        ('commission', 'Commission'),
        ('disclosure', 'Disclosure'),
        ('enforcement', 'Enforcement'),
        ('legislation', 'Legislation'),
        ('litigation', 'Litigation'),
        ('outreach', 'Outreach'),
        ('public_funding', 'Public funding'),
        ('regulations', 'Regulations'),
    ]


class FecTimelineItem(Page):
    page_description = 'Entries for the FECʼs historical timeline'
    parent_page_types = ['FecTimelinePage']
    subpage_types = []  # Don't allow child pages
    entry_date = models.DateField()
    summary = models.TextField()
    content = models.TextField()
    order_tiebreaker = models.IntegerField(default=0, null=True, blank=True)
    start_open = models.BooleanField(default=False)
    categories = StreamField(
        [('category_selections', blocks.MultipleChoiceBlock(
            required=False,
            choices=fec_timeline_categories(),
            search_index=False,
        ))],
        block_counts={
            'category_selections': {'max_num': 1},
        },
        null=True, blank=True,
    )

    content_panels = [
        FieldPanel('title', help_text='Strictly for Wagtail organization, never shown to site visitors'),
        FieldPanel('summary', icon='code', help_text='The (html) content thatʼs always visible',
                   heading='Entry title/summary', classname='timeline-summary', disable_comments=True),
        FieldRowPanel([
            FieldPanel('entry_date', help_text='Used while sorting', disable_comments=True),
            FieldPanel('order_tiebreaker', help_text='If there are date duplicates', classname='timeline-tie-breaker',
                       disable_comments=True),
            FieldPanel('start_open', help_text='Start in an open state?', classname='timeline-start-open',
                       disable_comments=True),
        ]),
        FieldPanel('content', icon='code', classname='timeline-content', disable_comments=True,
                   help_text='The (html) part that collapses. Will be wrapped inside a <div></div>'),
        FieldPanel('categories', help_text='Used for filtering (optional)', disable_comments=True),
        HelpPanel('<h2>Special notes for timeline entries</h2>\
            <h3>Wagtail</h3>\
            <ul>\
                <li><em>Summary</em> and <em>Content</em> are html fields</li>\
                <li>If <em>Start open</em> is checked, this entry will be open on page load</li>\
                <li><em>Order tiebreaker</em> comes into play when entries have the same entry date</li>\
                <li>FEC historical timeline entries will be included on the FEC Historical Timeline page only when\
                    published.</li>\
                <li>Timeline entries canʼt be viewed individually, but the preview panel is interactive with some\
                    visual context included.</li>\
            </ul>\
            <h3>HTML / formatting</h3>\
            <ul>\
                <li>Wrap dates in a <pre>&lt;time datetime="2025-12-31"&gt;&lt;/time&gt;</pre> where \
                    <pre>datetime</pre> is an ISO-8601 date. i.e. <pre>yyyy</pre> or <pre>yyyy-mm-dd</pre></li>\
                <li>To prevent the linebreak before the first <pre>&lt;time&gt;</pre> in a summary,<br>\
                    add <pre> class="inline"</pre> to the first <pre>&lt;time&gt;</pre></li>\
                <li>Photos inside the Content should be structured like<br>\
                    <pre>&lt;figure&gt;</pre><br>\
                    <pre>&nbsp;&nbsp;&lt;img src="" alt=""&gt;</pre><br>\
                    <pre>&nbsp;&nbsp;&lt;figcaption&gt;Caption content&lt;/figcaption&gt;</pre><br>\
                    <pre>&lt;/figure&gt;</pre></li>\
                <li>The default layout for content is for images to float to the right and text to flow around them \
                    on the left. To change that, add <pre> class="float-left"</pre> to the <pre>&lt;figure&gt;</pre>.\
                    (<pre>float-right</pre> is defined, too, but itʼs the default)</li>\
                <li>To launch YouTube links in the modal on this page, add <pre> data-media="url"</pre> to a link or \
                    other element. The <pre>href</pre> should be in a format like \
                  <pre>youtube.com/embed/[videoid]</pre> or <pre>youtu.be/[videoid]</pre>, \
                  or have <pre>v=[videoid]</pre></li>\
            </ul>', attrs={'data-timeline-help': True}),
    ]

    # No promote panels
    promote_panels = []

    @property
    def year(self):
        return self.entry_date.year

    @property
    def selected_cats_list(self):
        to_return = []
        for selected_cats in self.categories:
            for cat in selected_cats.value:
                to_return.append(cat)
        return ', '.join(to_return)

    # When saving, set the slug to `timeline-entry-` plus the title
    def save(self, *args, **kwargs):
        self.slug = slugify(f'timeline-entry-{self.year}-{self.title}')
        super().save(*args, **kwargs)

    # These should all redirect to their parent, the main timeline page
    def serve(self, request, *args, **kwargs):
        parent_page = self.get_parent()
        return redirect(parent_page.url, permanent=True)

    # Don't let these show up in sitemaps
    def get_sitemap_urls(self, request=None):
        return []

    class Meta:
        verbose_name = 'FEC historical timeline entry'
        verbose_name_plural = 'FEC historical timeline entries'


class FecTimelinePage(Page):
    page_description = 'Unique page - Timeline of FECʼs History'
    parent_page_types = ['AboutLandingPage']
    subpage_types = ['FecTimelineItem']
    body = stream_factory(null=True, blank=True)

    content_panels = Page.content_panels + [
        FieldPanel('body'),
        HelpPanel('<h2>Special notes for this timeline page and its\
            entries</h2>\
        <p>Entries must be published/live to be included in this list. (Drafts wonʼt be shown.)</p>\
        <p>To add a new entry, either create a child page here or</p>\
        <ol>\
            <li>go to “News and Updates” in the side panel</li>\
            <li>choose “FEC Timeline Items”</li>\
            <li>click “Add FEC historical timeline entry” at the top of the page</li>\
        </ol>', attrs={'data-timeline-help': True}),
    ]

    def get_timeline_categories(self):
        return fec_timeline_categories()

    # Group the (live) child pages by year
    # returns {
    #     1974: [FecTimelineItem],
    #     1975: [FecTimelineItem, FecTimelineItem],
    #  }
    def timeline_entries_by_year(self):
        entries = FecTimelineItem.objects.child_of(self).live().order_by('entry_date', 'order_tiebreaker')
        year_groups = {}
        for k, g in groupby(entries, key=lambda x: x.year):
            year_groups[k] = list(g)
        return year_groups

    class Meta:
        verbose_name = 'FEC historical timeline page'
