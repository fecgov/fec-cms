# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import wagtail.blocks
import wagtail.fields


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0004_checklistpage'),
    ]

    operations = [
        migrations.AddField(
            model_name='custompage',
            name='legal_resource',
            field=wagtail.fields.StreamField((('paragraph', wagtail.blocks.RichTextBlock()),), default=None),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='custompage',
            name='related_items',
            field=wagtail.fields.StreamField((('paragraph', wagtail.blocks.RichTextBlock()),), default=None),
            preserve_default=False,
        ),
    ]
