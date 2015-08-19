# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import wagtail.wagtailcore.blocks
import wagtail.wagtailcore.fields


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0004_checklistpage'),
    ]

    operations = [
        migrations.AddField(
            model_name='custompage',
            name='legal_resource',
            field=wagtail.wagtailcore.fields.StreamField((('paragraph', wagtail.wagtailcore.blocks.RichTextBlock()),), default=None),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='custompage',
            name='related_items',
            field=wagtail.wagtailcore.fields.StreamField((('paragraph', wagtail.wagtailcore.blocks.RichTextBlock()),), default=None),
            preserve_default=False,
        ),
    ]
