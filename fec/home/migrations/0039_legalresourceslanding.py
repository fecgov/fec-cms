# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2016-12-28 23:35
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import wagtail.contrib.table_block.blocks
import wagtail.wagtailcore.blocks
import wagtail.wagtailcore.fields
import wagtail.wagtailimages.blocks


class Migration(migrations.Migration):

    dependencies = [
        ('wagtailcore', '0029_unicode_slugfield_dj19'),
        ('wagtailimages', '0013_make_rendition_upload_callable'),
        ('home', '0038_resourcepage'),
    ]

    operations = [
        migrations.CreateModel(
            name='LegalResourcesLanding',
            fields=[
                ('page_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='wagtailcore.Page')),
                ('body', wagtail.wagtailcore.fields.StreamField((('heading', wagtail.wagtailcore.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.wagtailcore.blocks.RichTextBlock()), ('html', wagtail.wagtailcore.blocks.RawHTMLBlock()), ('image', wagtail.wagtailimages.blocks.ImageChooserBlock()), ('table', wagtail.contrib.table_block.blocks.TableBlock())), blank=True, null=True)),
                ('feed_image', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to='wagtailimages.Image')),
            ],
            options={
                'abstract': False,
            },
            bases=('wagtailcore.page', models.Model),
        ),
    ]
