# Generated by Django 4.2.18 on 2025-07-22 17:43

from django.db import migrations, models
import django.db.models.deletion
import wagtail.fields


class Migration(migrations.Migration):

    dependencies = [
        ('wagtailcore', '0094_alter_page_locale'),
        ('home', '0140_alter_embedsnippet_banner_icon_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='FecTimelinePage',
            fields=[
                ('page_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='wagtailcore.page')),  # noqa: E501
                ('body', wagtail.fields.StreamField([('heading', 0), ('paragraph', 1), ('html', 2), ('image', 3), ('table', 4), ('custom_table', 10), ('contact', 16), ('internal_button', 19), ('external_button', 21)], blank=True, block_lookup={0: ('wagtail.blocks.CharBlock', (), {'form_classname': 'full title', 'icon': 'title'}), 1: ('wagtail.blocks.RichTextBlock', (), {}), 2: ('wagtail.blocks.RawHTMLBlock', (), {}), 3: ('wagtail.images.blocks.ImageChooserBlock', (), {}), 4: ('wagtail.contrib.table_block.blocks.TableBlock', (), {'table_options': {'renderer': 'html'}}), 5: ('wagtail.blocks.CharBlock', (), {'icon': 'title', 'required': False}), 6: ('wagtail.blocks.RichTextBlock', (), {'required': False}), 7: ('wagtail.contrib.table_block.blocks.TableBlock', (), {'table_options': {'colHeaders': True, 'height': 108, 'language': 'en', 'renderAllRows': True, 'renderer': 'html', 'rowHeaders': True, 'startCols': 6, 'startRows': 7}}), 8: ('wagtail.blocks.CharBlock', (), {'icon': 'superscript', 'required': False}), 9: ('wagtail.blocks.StreamBlock', [[('title', 5), ('table_intro', 6), ('table', 7), ('footnote', 8)]], {}), 10: ('wagtail.blocks.StructBlock', [[('custom_table', 9)]], {}), 11: ('wagtail.blocks.CharBlock', (), {'required': False}), 12: ('wagtail.blocks.ChoiceBlock', [], {'choices': [('email', 'Email'), ('fax', 'Fax'), ('hand', 'Hand delivery'), ('phone', 'Phone'), ('mail', 'Mail'), ('map-pin', 'Map pin'), ('github', 'Github'), ('question-bubble', 'Question')]}), 13: ('wagtail.blocks.RichTextBlock', (), {'required': True}), 14: ('wagtail.blocks.StructBlock', [[('item_label', 11), ('item_icon', 12), ('item_info', 13)]], {}), 15: ('wagtail.blocks.ListBlock', (14,), {}), 16: ('wagtail.blocks.StructBlock', [[('label', 5), ('contact_items', 15)]], {}), 17: ('wagtail.blocks.PageChooserBlock', (), {}), 18: ('wagtail.blocks.CharBlock', (), {}), 19: ('wagtail.blocks.StructBlock', [[('internal_page', 17), ('text', 18)]], {}), 20: ('wagtail.blocks.URLBlock', (), {}), 21: ('wagtail.blocks.StructBlock', [[('url', 20), ('text', 18)]], {})}, null=True)),  # noqa: E501
                ('timeline_entries', wagtail.fields.StreamField([('year', 8)], blank=True, block_lookup={0: ('wagtail.blocks.IntegerBlock', (), {'disable_comments': True, 'max_value': 2050, 'min_value': 1960}), 1: ('wagtail.blocks.DateBlock', (), {'disable_comments': True, 'format': '%Y-%m-%d'}), 2: ('wagtail.blocks.RawHTMLBlock', (), {'form_classname': 'timeline-summary', 'label': 'Summary'}), 3: ('wagtail.blocks.RawHTMLBlock', (), {'label': 'Content'}), 4: ('wagtail.blocks.MultipleChoiceBlock', [], {'choices': [('commission', 'Commission'), ('disclosure', 'Disclosure'), ('enforcement', 'Enforcement'), ('legislation', 'Legislation'), ('litigation', 'Litigation'), ('outreach', 'Outreach'), ('public_funding', 'Public funding'), ('regulations', 'Regulations'), ('', 'none')], 'required': False}), 5: ('wagtail.blocks.BooleanBlock', (), {'disable_comments': True, 'form_classname': 'single-line-checkbox', 'required': False}), 6: ('wagtail.blocks.StructBlock', [[('entry_date', 1), ('summary', 2), ('content', 3), ('categories', 4), ('start_open', 5)]], {}), 7: ('wagtail.blocks.StreamBlock', [[('entry', 6)]], {'collapsed': True}), 8: ('wagtail.blocks.StructBlock', [[('year_number', 0), ('entries', 7)]], {})}, null=True)),  # noqa: E501
            ],
            options={
                'abstract': False,
            },
            bases=('wagtailcore.page',),
        ),
    ]
