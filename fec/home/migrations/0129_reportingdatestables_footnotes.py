# Generated by Django 3.2.16 on 2023-03-10 02:24

from django.db import migrations
import wagtail.blocks
import wagtail.fields


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0128_alter_reportingdatestables_states'),
    ]

    operations = [
        migrations.AddField(
            model_name='reportingdatestables',
            name='footnotes',
            field=wagtail.fields.StreamField([('title', wagtail.blocks.CharBlock(blank='true', icon='title')), ('footnotes', wagtail.blocks.ListBlock(wagtail.blocks.StructBlock([('footnote_number', wagtail.blocks.CharBlock(blank='true', icon='tag')), ('footnote_text', wagtail.blocks.RichTextBlock(blank='true', help_text='', icon='pilcrow'))])))], blank=True, null=True, use_json_field=None),
        ),
    ]
