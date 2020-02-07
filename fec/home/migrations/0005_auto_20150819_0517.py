# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import wagtail.core.blocks
import wagtail.core.fields


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0004_checklistpage'),
    ]

    operations = [
        migrations.AddField(
            model_name='custompage',
            name='legal_resource',
            field=wagtail.core.fields.StreamField((('paragraph', wagtail.core.blocks.RichTextBlock()),), default=None),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='custompage',
            name='related_items',
            field=wagtail.core.fields.StreamField((('paragraph', wagtail.core.blocks.RichTextBlock()),), default=None),
            preserve_default=False,
        ),
    ]
