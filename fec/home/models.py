import functools

from django.db import models
from django.core.exceptions import ValidationError

from wagtail.wagtailcore.models import Page
from wagtail.wagtailcore.fields import StreamField
from wagtail.wagtailcore import blocks
from wagtail.wagtailadmin.edit_handlers import FieldPanel, MultiFieldPanel, StreamFieldPanel
from wagtail.wagtailimages.blocks import ImageChooserBlock
from wagtail.wagtailsnippets.models import register_snippet

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

class HomePage(ContentPage, UniqueModel):
    """Unique home page."""
    pass

class LandingPage(ContentPage):
    """Landing page."""
    pass

class ChecklistPage(ContentPage):
    """Checklist page."""
    pass

class OptionsPage(ContentPage):
    """Options page."""
    pass

class ContactPage(ContentPage):
    """Contact page."""
    pass

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

@register_snippet
class Event(models.Model):

    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    category = models.CharField(
        max_length=255,
        choices=[
            ('election', 'Election'),
            ('report', 'Reporting deadline'),
        ]
    )
    description = models.TextField()
    summary = models.TextField()
    location = models.TextField(null=True, blank=True)
    states = models.ManyToManyField('State', blank=True)

    panels = [
        MultiFieldPanel(
            [
                FieldPanel('start_date'),
                FieldPanel('end_date'),
            ]
        ),
        FieldPanel('category'),
        FieldPanel('description'),
        FieldPanel('summary'),
        FieldPanel('location'),
        FieldPanel('states'),
    ]

    def __str__(self):
        return self.description

class State(models.Model):
    value = models.CharField(primary_key=True, max_length=32)
    label = models.CharField(max_length=32)

    def __str__(self):
        return self.label
