# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import wagtail.images.blocks
import wagtail.fields
import wagtail.blocks
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('wagtailcore', '0001_squashed_0016_change_page_url_path_to_text_field'),
        ('home', '0002_create_homepage'),
    ]

    operations = [
        migrations.CreateModel(
            name='CustomPage',
            fields=[
                ('page_ptr', models.OneToOneField(serialize=False, primary_key=True, auto_created=True, parent_link=True, to='wagtailcore.Page', on_delete=django.db.models.deletion.SET_NULL)),
                ('author', models.CharField(max_length=255)),
                ('date', models.DateField(verbose_name='Post date')),
                ('body', wagtail.fields.StreamField((('heading', wagtail.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.blocks.RichTextBlock()), ('image', wagtail.images.blocks.ImageChooserBlock())))),
            ],
            options={
                'abstract': False,
            },
            bases=('wagtailcore.page',),
        ),
        migrations.CreateModel(
            name='LandingPage',
            fields=[
                ('page_ptr', models.OneToOneField(serialize=False, primary_key=True, auto_created=True, parent_link=True, to='wagtailcore.Page', on_delete=django.db.models.deletion.SET_NULL)),
                ('body', wagtail.fields.StreamField((('heading', wagtail.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.blocks.RichTextBlock()), ('image', wagtail.images.blocks.ImageChooserBlock())))),
            ],
            options={
                'abstract': False,
            },
            bases=('wagtailcore.page', models.Model),
        ),
        migrations.AddField(
            model_name='homepage',
            name='body',
            field=wagtail.fields.StreamField((('heading', wagtail.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.blocks.RichTextBlock()), ('image', wagtail.images.blocks.ImageChooserBlock())), default=None, null=True, blank=True),
            preserve_default=False,
        ),
    ]
