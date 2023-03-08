# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2016-12-28 23:05
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import wagtail.contrib.table_block.blocks
import wagtail.blocks
import wagtail.fields
import wagtail.images.blocks


class Migration(migrations.Migration):

    dependencies = [
        ('wagtailcore', '0029_unicode_slugfield_dj19'),
        ('home', '0037_auto_20161216_0222'),
    ]

    operations = [
        migrations.CreateModel(
            name='ResourcePage',
            fields=[
                ('page_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='wagtailcore.Page')),
                ('intro', wagtail.fields.StreamField((('heading', wagtail.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.blocks.RichTextBlock()), ('html', wagtail.blocks.RawHTMLBlock()), ('image', wagtail.images.blocks.ImageChooserBlock()), ('table', wagtail.contrib.table_block.blocks.TableBlock())), blank=True, null=True)),
                ('sections', wagtail.fields.StreamField((('sections', wagtail.blocks.StructBlock((('title', wagtail.blocks.CharBlock(required=True)), ('hide_title', wagtail.blocks.BooleanBlock(help_text='Should the section title be displayed?', required=False)), ('content', wagtail.blocks.StreamBlock((('text', wagtail.blocks.RichTextBlock(blank=False, icon='pilcrow', null=False, required=False)), ('documents', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('image', wagtail.images.blocks.ImageChooserBlock()), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock()))), icon='doc-empty', template='blocks/section-documents.html')), ('contact_info', wagtail.blocks.StructBlock((('label', wagtail.blocks.CharBlock(icon='title', required=False)), ('contact_items', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('item_label', wagtail.blocks.CharBlock(required=True)), ('item_icon', wagtail.blocks.ChoiceBlock(choices=[('email', 'Email'), ('fax', 'Fax'), ('hand', 'Hand delivery'), ('phone', 'Phone')])), ('item_info', wagtail.blocks.RichTextBlock(required=True)))))))))))), ('aside', wagtail.blocks.StreamBlock((('title', wagtail.blocks.CharBlock(icon='title', required=False)), ('document', wagtail.blocks.StructBlock((('image', wagtail.images.blocks.ImageChooserBlock()), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock())))), ('link', wagtail.blocks.StructBlock((('link_type', wagtail.blocks.ChoiceBlock(choices=[('search', 'Search'), ('calendar', 'Calendar')], help_text='Set an icon', icon='link', required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock(required=True)), ('coming_soon', wagtail.blocks.BooleanBlock(required=False)))))), icon='placeholder', template='blocks/section-aside.html'))))),), null=True)),
                ('citations', wagtail.fields.StreamField((('citations', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('label', wagtail.blocks.CharBlock()), ('content', wagtail.blocks.RichTextBlock()))))),), null=True)),
                ('related_topics', wagtail.fields.StreamField((('related_topics', wagtail.blocks.ListBlock(wagtail.blocks.PageChooserBlock(label='Related topic'))),), null=True)),
            ],
            options={
                'abstract': False,
            },
            bases=('wagtailcore.page',),
        ),
    ]
