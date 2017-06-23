from collections import OrderedDict

from django.db import models
from modelcluster.fields import ParentalKey
from wagtail.wagtailadmin.edit_handlers import FieldPanel, MultiFieldPanel
from fec import constants

EVENT_CATEGORIES = OrderedDict()
for category in constants.event_category_groups.keys():
    EVENT_CATEGORIES.update(constants.event_category_groups[category])

class State(models.Model):
    value = models.CharField(primary_key=True, max_length=32)
    label = models.CharField(max_length=32)

    def __str__(self):
        return self.label


class Event(models.Model):
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    all_day = models.BooleanField(default=False)
    category = models.CharField(
        max_length=255,
        choices=EVENT_CATEGORIES.items()
    )
    description = models.TextField()
    summary = models.TextField()
    location = models.TextField(null=True, blank=True)
    state = models.ManyToManyField('State', blank=True)

    panels = [
        FieldPanel('description'),
        MultiFieldPanel(
            [
                FieldPanel('start_date'),
                FieldPanel('end_date'),
                FieldPanel('all_day'),
            ]
        ),
        FieldPanel('category'),
        FieldPanel('summary'),
        FieldPanel('location'),
        FieldPanel('state'),
    ]

    def __str__(self):
        return self.description
