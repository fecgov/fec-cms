# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import wagtail.wagtailcore.fields
import wagtail.wagtailimages.blocks
import wagtail.wagtailcore.blocks


class Migration(migrations.Migration):

    dependencies = [
        ('page', '0003_remove_contentpage_body'),
    ]

    operations = [
        migrations.AddField(
            model_name='contentpage',
            name='body',
            field=wagtail.wagtailcore.fields.StreamField((('heading', wagtail.wagtailcore.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.wagtailcore.blocks.RichTextBlock()), ('image', wagtail.wagtailimages.blocks.ImageChooserBlock())), default=None),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='contentpage',
            name='author',
            field=models.CharField(max_length=255, blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='contentpage',
            name='date',
            field=models.DateField(blank=True, verbose_name='Post date', null=True),
        ),
    ]
