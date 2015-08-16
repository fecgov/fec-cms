from django.db import models

from wagtail.wagtailcore.models import Page
from wagtail.wagtailcore.fields import StreamField
from wagtail.wagtailcore import blocks
from wagtail.wagtailadmin.edit_handlers import FieldPanel, StreamFieldPanel
from wagtail.wagtailimages.blocks import ImageChooserBlock

class ContentPage(Page):
    author = models.CharField(max_length=255)
    date = models.DateField('Post date')
    body = StreamField([
        ('heading', blocks.CharBlock(classname='full title')),
        ('paragraph', blocks.RichTextBlock()),
        ('image', ImageChooserBlock()),
    ])

ContentPage.content_panels = Page.content_panels + [
    FieldPanel('author'),
    FieldPanel('date'),
    StreamFieldPanel('body'),
]
