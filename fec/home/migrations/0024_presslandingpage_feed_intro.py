# -*- coding: utf-8 -*-
# Generated by Django 1.9.9 on 2016-09-29 22:21
from __future__ import unicode_literals

from django.db import migrations
import wagtail.contrib.table_block.blocks
import wagtail.blocks
import wagtail.fields
import wagtail.images.blocks


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0023_remove_presslandingpage_feed_intro'),
    ]

    operations = [
        migrations.AddField(
            model_name='presslandingpage',
            name='feed_intro',
            field=wagtail.fields.StreamField((('heading', wagtail.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.blocks.RichTextBlock()), ('html', wagtail.blocks.RawHTMLBlock()), ('image', wagtail.images.blocks.ImageChooserBlock()), ('table', wagtail.contrib.table_block.blocks.TableBlock())), blank=True, null=True),
        ),
    ]
