from django.db import models
from django.core.exceptions import ValidationError

from wagtail.wagtailcore.models import Page
from wagtail.wagtailcore.fields import StreamField
from wagtail.wagtailcore import blocks
from wagtail.wagtailadmin.edit_handlers import FieldPanel, StreamFieldPanel
from wagtail.wagtailimages.blocks import ImageChooserBlock

class UniqueModel(models.Model):
    """Abstract base class for unique pages."""
    class Meta:
        abstract = True

    def clean(self):
        if self.objects.count() > 0 and self.id != self.objects.get().id:
            raise ValidationError('Only one {0} allowed'.format(self.__name__))

class ContentPage(Page):
    """Abstract base class for simple content pages."""
    is_abstract = True

    class Meta:
        abstract = True

    body = StreamField([
        ('heading', blocks.CharBlock(classname='full title')),
        ('paragraph', blocks.RichTextBlock()),
        ('image', ImageChooserBlock()),
    ])

    content_panels = Page.content_panels + [
        StreamFieldPanel('body'),
    ]

class HomePage(ContentPage, UniqueModel):
    """Unique home page."""
    pass

class LandingPage(ContentPage, UniqueModel):
    """Unique landing page."""
    pass

class CustomPage(Page):
    """Flexible customizable page."""
    author = models.CharField(max_length=255)
    date = models.DateField('Post date')
    body = StreamField([
        ('heading', blocks.CharBlock(classname='full title')),
        ('paragraph', blocks.RichTextBlock()),
        ('image', ImageChooserBlock()),
    ])

    content_panels = Page.content_panels + [
        FieldPanel('author'),
        FieldPanel('date'),
        StreamFieldPanel('body'),
    ]
