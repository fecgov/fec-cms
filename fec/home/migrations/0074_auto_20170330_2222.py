# -*- coding: utf-8 -*-
# Generated by Django 1.10.5 on 2017-03-30 22:22
from __future__ import unicode_literals

from django.db import migrations
import home.blocks
import wagtail.contrib.table_block.blocks
import wagtail.blocks
import wagtail.fields
import wagtail.documents.blocks
import wagtail.images.blocks


class Migration(migrations.Migration):

    dependencies = [
        ('wagtailcore', '0032_add_bulk_delete_page_permission'),
        ('wagtailsearchpromotions', '0002_capitalizeverbose'),
        ('wagtailforms', '0003_capitalizeverbose'),
        ('wagtailredirects', '0005_capitalizeverbose'),
        ('home', '0073_auto_20170330_1840'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='enforcementpage',
            name='feed_image',
        ),
        migrations.RemoveField(
            model_name='enforcementpage',
            name='page_ptr',
        ),
        migrations.AlterField(
            model_name='resourcepage',
            name='sections',
            field=wagtail.fields.StreamField((('sections', wagtail.blocks.StructBlock((('title', wagtail.blocks.CharBlock(required=True)), ('hide_title', wagtail.blocks.BooleanBlock(help_text='Should the section title be displayed?', required=False)), ('content', wagtail.blocks.StreamBlock((('text', wagtail.blocks.RichTextBlock(blank=False, icon='pilcrow', null=False, required=False)), ('documents', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('image', wagtail.images.blocks.ImageChooserBlock(required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock()))), icon='doc-empty', template='blocks/section-documents.html')), ('contact_info', wagtail.blocks.StructBlock((('label', wagtail.blocks.CharBlock(icon='title', required=False)), ('contact_items', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('item_label', wagtail.blocks.CharBlock(required=False)), ('item_icon', wagtail.blocks.ChoiceBlock(choices=[('email', 'Email'), ('fax', 'Fax'), ('hand', 'Hand delivery'), ('phone', 'Phone'), ('mail', 'Mail')])), ('item_info', wagtail.blocks.RichTextBlock(required=True))))))))), ('internal_button', wagtail.blocks.StructBlock((('internal_page', wagtail.blocks.PageChooserBlock()), ('text', wagtail.blocks.CharBlock())))), ('external_button', wagtail.blocks.StructBlock((('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock())))), ('page', wagtail.blocks.PageChooserBlock(template='blocks/page-links.html')), ('disabled_page', wagtail.blocks.CharBlock(blank=False, help_text='Name of a disabled link', icon='placeholder', null=False, required=False, template='blocks/disabled-page-links.html')), ('document_list', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('title', wagtail.blocks.CharBlock()), ('document', wagtail.documents.blocks.DocumentChooserBlock()))), icon='doc-empty', template='blocks/document-list.html')), ('current_commissioners', home.blocks.CurrentCommissionersBlock()), ('fec_jobs', home.blocks.CareersBlock()), ('mur_search', home.blocks.MURSearchBlock()), ('table', wagtail.contrib.table_block.blocks.TableBlock())))), ('aside', wagtail.blocks.StreamBlock((('title', wagtail.blocks.CharBlock(icon='title', required=False)), ('document', wagtail.blocks.StructBlock((('image', wagtail.images.blocks.ImageChooserBlock(required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock())))), ('link', wagtail.blocks.StructBlock((('link_type', wagtail.blocks.ChoiceBlock(choices=[('search', 'Search'), ('calendar', 'Calendar'), ('record', 'Record')], help_text='Set an icon', icon='link', required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock(required=True)), ('coming_soon', wagtail.blocks.BooleanBlock(required=False)))))), icon='placeholder', template='blocks/section-aside.html'))))),), null=True),
        ),
        migrations.AlterField(
            model_name='serviceslandingpage',
            name='sections',
            field=wagtail.fields.StreamField((('sections', wagtail.blocks.StructBlock((('title', wagtail.blocks.CharBlock(required=True)), ('hide_title', wagtail.blocks.BooleanBlock(help_text='Should the section title be displayed?', required=False)), ('content', wagtail.blocks.StreamBlock((('text', wagtail.blocks.RichTextBlock(blank=False, icon='pilcrow', null=False, required=False)), ('documents', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('image', wagtail.images.blocks.ImageChooserBlock(required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock()))), icon='doc-empty', template='blocks/section-documents.html')), ('contact_info', wagtail.blocks.StructBlock((('label', wagtail.blocks.CharBlock(icon='title', required=False)), ('contact_items', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('item_label', wagtail.blocks.CharBlock(required=False)), ('item_icon', wagtail.blocks.ChoiceBlock(choices=[('email', 'Email'), ('fax', 'Fax'), ('hand', 'Hand delivery'), ('phone', 'Phone'), ('mail', 'Mail')])), ('item_info', wagtail.blocks.RichTextBlock(required=True))))))))), ('internal_button', wagtail.blocks.StructBlock((('internal_page', wagtail.blocks.PageChooserBlock()), ('text', wagtail.blocks.CharBlock())))), ('external_button', wagtail.blocks.StructBlock((('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock())))), ('page', wagtail.blocks.PageChooserBlock(template='blocks/page-links.html')), ('disabled_page', wagtail.blocks.CharBlock(blank=False, help_text='Name of a disabled link', icon='placeholder', null=False, required=False, template='blocks/disabled-page-links.html')), ('document_list', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('title', wagtail.blocks.CharBlock()), ('document', wagtail.documents.blocks.DocumentChooserBlock()))), icon='doc-empty', template='blocks/document-list.html')), ('current_commissioners', home.blocks.CurrentCommissionersBlock()), ('fec_jobs', home.blocks.CareersBlock()), ('mur_search', home.blocks.MURSearchBlock()), ('table', wagtail.contrib.table_block.blocks.TableBlock())))), ('aside', wagtail.blocks.StreamBlock((('title', wagtail.blocks.CharBlock(icon='title', required=False)), ('document', wagtail.blocks.StructBlock((('image', wagtail.images.blocks.ImageChooserBlock(required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock())))), ('link', wagtail.blocks.StructBlock((('link_type', wagtail.blocks.ChoiceBlock(choices=[('search', 'Search'), ('calendar', 'Calendar'), ('record', 'Record')], help_text='Set an icon', icon='link', required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock(required=True)), ('coming_soon', wagtail.blocks.BooleanBlock(required=False)))))), icon='placeholder', template='blocks/section-aside.html'))))),), null=True),
        ),
        migrations.DeleteModel(
            name='EnforcementPage',
        ),
    ]
