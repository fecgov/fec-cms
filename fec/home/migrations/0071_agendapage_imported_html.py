# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-03-23 00:59
from __future__ import unicode_literals

from django.db import migrations
import wagtail.blocks
import wagtail.fields


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0070_merge_20170322_1940'),
    ]

    operations = [
        migrations.AddField(
            model_name='agendapage',
            name='imported_html',
            field=wagtail.fields.StreamField((('html_block', wagtail.blocks.RawHTMLBlock()),), blank=True, null=True),
        ),
    ]
