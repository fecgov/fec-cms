# -*- coding: utf-8 -*-
# Generated by Django 1.10.5 on 2017-03-18 00:05
from __future__ import unicode_literals

from django.db import migrations, models
import home.blocks
import wagtail.contrib.table_block.blocks
import wagtail.blocks
import wagtail.fields
import wagtail.documents.blocks
import wagtail.images.blocks


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0068_merge_20170310_0002'),
    ]

    operations = [
        migrations.AddField(
            model_name='custompage',
            name='citations',
            field=wagtail.fields.StreamField((('citations', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('label', wagtail.blocks.CharBlock()), ('content', wagtail.blocks.RichTextBlock(help_text='Use Shift + Enter to add line breaks between citation and description')))))),), null=True),
        ),
        migrations.AddField(
            model_name='custompage',
            name='continue_learning',
            field=wagtail.fields.StreamField((('continue_learning', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('image', wagtail.images.blocks.ImageChooserBlock(required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock()))), icon='doc-empty')),), null=True),
        ),
        migrations.AddField(
            model_name='custompage',
            name='record_articles',
            field=wagtail.fields.StreamField((('record_articles', wagtail.blocks.ListBlock(wagtail.blocks.PageChooserBlock(target_model='home.RecordPage'))),), null=True),
        ),
        migrations.AlterField(
            model_name='custompage',
            name='body',
            field=wagtail.fields.StreamField((('heading', wagtail.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.blocks.RichTextBlock()), ('html', wagtail.blocks.RawHTMLBlock()), ('image', wagtail.images.blocks.ImageChooserBlock()), ('table', wagtail.contrib.table_block.blocks.TableBlock()), ('example_paragraph', wagtail.blocks.StructBlock((('title', wagtail.blocks.CharBlock(required=True)), ('paragraph', wagtail.blocks.RichTextBlock(required=True))))), ('example_forms', wagtail.blocks.StructBlock((('title', wagtail.blocks.CharBlock(required=True)), ('forms', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('image', wagtail.images.blocks.ImageChooserBlock(required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock())))))))))),
        ),
        migrations.AlterField(
            model_name='documentpage',
            name='category',
            field=models.CharField(choices=[('audit report', 'Audit report'), ('work plan', 'Work plan'), ('inspection or special review report', 'Inspection or special review report'), ('strategic plan', 'Strategic plan'), ('semiannual report', 'Semiannual report'), ('it strategic plan', 'IT strategic plan'), ('congressional submission', 'Congressional submission'), ('annual performance report', 'Annual performance report'), ('annual financial report', 'Annual financial report'), ('performance and accountability report', 'Performance and accountability report'), ('annual report', 'Annual report'), ('summary report', 'Summary report'), ('privacy act notices', 'Privacy Act notices'), ('privacy policy', 'Privacy policy'), ('inventory', 'Inventory'), ('memo', 'Memo'), ('request for proposal', 'Request for proposal'), ('anniversary report', 'Anniversary report'), ('shutdown plan', 'Shutdown plan'), ('operation plan', 'Operation plan')], max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='resourcepage',
            name='sections',
            field=wagtail.fields.StreamField((('sections', wagtail.blocks.StructBlock((('title', wagtail.blocks.CharBlock(required=True)), ('hide_title', wagtail.blocks.BooleanBlock(help_text='Should the section title be displayed?', required=False)), ('content', wagtail.blocks.StreamBlock((('text', wagtail.blocks.RichTextBlock(blank=False, icon='pilcrow', null=False, required=False)), ('documents', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('image', wagtail.images.blocks.ImageChooserBlock(required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock()))), icon='doc-empty', template='blocks/section-documents.html')), ('contact_info', wagtail.blocks.StructBlock((('label', wagtail.blocks.CharBlock(icon='title', required=False)), ('contact_items', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('item_label', wagtail.blocks.CharBlock(required=False)), ('item_icon', wagtail.blocks.ChoiceBlock(choices=[('email', 'Email'), ('fax', 'Fax'), ('hand', 'Hand delivery'), ('phone', 'Phone'), ('mail', 'Mail')])), ('item_info', wagtail.blocks.RichTextBlock(required=True))))))))), ('internal_button', wagtail.blocks.StructBlock((('internal_page', wagtail.blocks.PageChooserBlock()), ('text', wagtail.blocks.CharBlock())))), ('external_button', wagtail.blocks.StructBlock((('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock())))), ('page', wagtail.blocks.PageChooserBlock(template='blocks/page-links.html')), ('disabled_page', wagtail.blocks.CharBlock(blank=False, help_text='Name of a disabled link', icon='placeholder', null=False, required=False, template='blocks/disabled-page-links.html')), ('document_list', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('title', wagtail.blocks.CharBlock()), ('document', wagtail.documents.blocks.DocumentChooserBlock()))), icon='doc-empty', template='blocks/document-list.html')), ('current_commissioners', home.blocks.CurrentCommissionersBlock()), ('fec_jobs', home.blocks.CareersBlock()), ('table', wagtail.contrib.table_block.blocks.TableBlock())))), ('aside', wagtail.blocks.StreamBlock((('title', wagtail.blocks.CharBlock(icon='title', required=False)), ('document', wagtail.blocks.StructBlock((('image', wagtail.images.blocks.ImageChooserBlock(required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock())))), ('link', wagtail.blocks.StructBlock((('link_type', wagtail.blocks.ChoiceBlock(choices=[('search', 'Search'), ('calendar', 'Calendar'), ('record', 'Record')], help_text='Set an icon', icon='link', required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock(required=True)), ('coming_soon', wagtail.blocks.BooleanBlock(required=False)))))), icon='placeholder', template='blocks/section-aside.html'))))),), null=True),
        ),
        migrations.AlterField(
            model_name='serviceslandingpage',
            name='sections',
            field=wagtail.fields.StreamField((('sections', wagtail.blocks.StructBlock((('title', wagtail.blocks.CharBlock(required=True)), ('hide_title', wagtail.blocks.BooleanBlock(help_text='Should the section title be displayed?', required=False)), ('content', wagtail.blocks.StreamBlock((('text', wagtail.blocks.RichTextBlock(blank=False, icon='pilcrow', null=False, required=False)), ('documents', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('image', wagtail.images.blocks.ImageChooserBlock(required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock()))), icon='doc-empty', template='blocks/section-documents.html')), ('contact_info', wagtail.blocks.StructBlock((('label', wagtail.blocks.CharBlock(icon='title', required=False)), ('contact_items', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('item_label', wagtail.blocks.CharBlock(required=False)), ('item_icon', wagtail.blocks.ChoiceBlock(choices=[('email', 'Email'), ('fax', 'Fax'), ('hand', 'Hand delivery'), ('phone', 'Phone'), ('mail', 'Mail')])), ('item_info', wagtail.blocks.RichTextBlock(required=True))))))))), ('internal_button', wagtail.blocks.StructBlock((('internal_page', wagtail.blocks.PageChooserBlock()), ('text', wagtail.blocks.CharBlock())))), ('external_button', wagtail.blocks.StructBlock((('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock())))), ('page', wagtail.blocks.PageChooserBlock(template='blocks/page-links.html')), ('disabled_page', wagtail.blocks.CharBlock(blank=False, help_text='Name of a disabled link', icon='placeholder', null=False, required=False, template='blocks/disabled-page-links.html')), ('document_list', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock((('title', wagtail.blocks.CharBlock()), ('document', wagtail.documents.blocks.DocumentChooserBlock()))), icon='doc-empty', template='blocks/document-list.html')), ('current_commissioners', home.blocks.CurrentCommissionersBlock()), ('fec_jobs', home.blocks.CareersBlock()), ('table', wagtail.contrib.table_block.blocks.TableBlock())))), ('aside', wagtail.blocks.StreamBlock((('title', wagtail.blocks.CharBlock(icon='title', required=False)), ('document', wagtail.blocks.StructBlock((('image', wagtail.images.blocks.ImageChooserBlock(required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock())))), ('link', wagtail.blocks.StructBlock((('link_type', wagtail.blocks.ChoiceBlock(choices=[('search', 'Search'), ('calendar', 'Calendar'), ('record', 'Record')], help_text='Set an icon', icon='link', required=False)), ('url', wagtail.blocks.URLBlock()), ('text', wagtail.blocks.CharBlock(required=True)), ('coming_soon', wagtail.blocks.BooleanBlock(required=False)))))), icon='placeholder', template='blocks/section-aside.html'))))),), null=True),
        ),
    ]
