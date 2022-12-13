# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import wagtail.fields
import wagtail.images.blocks
import wagtail.blocks
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('wagtailcore', '0001_squashed_0016_change_page_url_path_to_text_field'),
        ('home', '0008_auto_20150917_1906'),
    ]

    operations = [
        migrations.CreateModel(
            name='ContactPage',
            fields=[
                ('page_ptr', models.OneToOneField(to='wagtailcore.Page', auto_created=True, primary_key=True, parent_link=True, serialize=False, on_delete=django.db.models.deletion.SET_NULL)),
                ('body', wagtail.fields.StreamField((('heading', wagtail.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.blocks.RichTextBlock()), ('html', wagtail.blocks.RawHTMLBlock()), ('image', wagtail.images.blocks.ImageChooserBlock())), blank=True, null=True)),
            ],
            options={
                'abstract': False,
            },
            bases=('wagtailcore.page',),
        ),
    ]
