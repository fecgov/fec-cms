# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import wagtail.fields
import wagtail.blocks
import wagtail.images.blocks
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('wagtailcore', '0001_squashed_0016_change_page_url_path_to_text_field'),
        ('home', '0013_auto_20160427_2133'),
    ]

    operations = [
        migrations.CreateModel(
            name='NonconnectedChecklistPage',
            fields=[
                ('page_ptr', models.OneToOneField(auto_created=True, parent_link=True, primary_key=True, to='wagtailcore.Page', serialize=False, on_delete=django.db.models.deletion.SET_NULL)),
                ('body', wagtail.fields.StreamField((('heading', wagtail.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.blocks.RichTextBlock()), ('html', wagtail.blocks.RawHTMLBlock()), ('image', wagtail.images.blocks.ImageChooserBlock())), blank=True, null=True)),
            ],
            options={
                'abstract': False,
            },
            bases=('wagtailcore.page',),
        ),
    ]
