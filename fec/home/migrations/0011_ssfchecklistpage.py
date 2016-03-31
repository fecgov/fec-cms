# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import wagtail.wagtailcore.fields
import wagtail.wagtailcore.blocks
import wagtail.wagtailimages.blocks


class Migration(migrations.Migration):

    dependencies = [
        ('wagtailcore', '0001_squashed_0016_change_page_url_path_to_text_field'),
        ('home', '0010_calendarpage'),
    ]

    operations = [
        migrations.CreateModel(
            name='SSFChecklistPage',
            fields=[
                ('page_ptr', models.OneToOneField(primary_key=True, auto_created=True, to='wagtailcore.Page', serialize=False, parent_link=True)),
                ('body', wagtail.wagtailcore.fields.StreamField((('heading', wagtail.wagtailcore.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.wagtailcore.blocks.RichTextBlock()), ('html', wagtail.wagtailcore.blocks.RawHTMLBlock()), ('image', wagtail.wagtailimages.blocks.ImageChooserBlock())), blank=True, null=True)),
            ],
            options={
                'abstract': False,
            },
            bases=('wagtailcore.page',),
        ),
    ]
