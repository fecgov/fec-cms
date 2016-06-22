import functools

from django.db import models
from django.core.exceptions import ValidationError

from wagtail.wagtailcore.models import Page
from wagtail.wagtailcore.fields import StreamField
from wagtail.wagtailcore import blocks
from wagtail.wagtailadmin.edit_handlers import FieldPanel, StreamFieldPanel
from wagtail.wagtailimages.blocks import ImageChooserBlock

stream_factory = functools.partial(
    StreamField,
    [
        ('heading', blocks.CharBlock(classname='full title')),
        ('paragraph', blocks.RichTextBlock()),
        ('html', blocks.RawHTMLBlock()),
        ('image', ImageChooserBlock()),
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
    is_abstract = True

    class Meta:
        abstract = True

    body = stream_factory(null=True, blank=True)

    content_panels = Page.content_panels + [
        StreamFieldPanel('body'),
    ]

    # Default content section for determining the active nav
    content_section = 'registration-and-reporting'

    def get_context(self, request):
        context = super(ContentPage, self).get_context(request)
        context['content_section'] = self.content_section
        return context


class HomePage(ContentPage, UniqueModel):
    """Unique home page."""
    content_section = ''

class LandingPage(ContentPage):
    pass

class ChecklistPage(ContentPage):
    pass

class SSFChecklistPage(ContentPage):
    pass

class PartyChecklistPage(ContentPage):
    pass

class ContactPage(ContentPage):
    content_section = 'contact'


class CalendarPage(ContentPage):
    content_section = 'calendar'


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
