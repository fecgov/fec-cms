# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import wagtail.core.blocks
import wagtail.core.fields
import wagtail.images.blocks


class Migration(migrations.Migration):

    dependencies = [
        ('wagtailcore', '0001_squashed_0016_change_page_url_path_to_text_field'),
        ('home', '0005_auto_20150819_0517'),
    ]

    operations = [
        migrations.CreateModel(
            name='OptionsPage',
            fields=[
                ('page_ptr', models.OneToOneField(to='wagtailcore.Page', primary_key=True, auto_created=True, serialize=False, parent_link=True)),
                ('body', wagtail.core.fields.StreamField((('heading', wagtail.core.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.core.blocks.RichTextBlock()), ('image', wagtail.images.blocks.ImageChooserBlock())))),
            ],
            options={
                'abstract': False,
            },
            bases=('wagtailcore.page',),
        ),
        migrations.RemoveField(
            model_name='custompage',
            name='legal_resource',
        ),
        migrations.RemoveField(
            model_name='custompage',
            name='related_items',
        ),
    ]
