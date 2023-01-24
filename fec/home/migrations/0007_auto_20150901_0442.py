# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import wagtail.fields
import wagtail.images.blocks
import wagtail.blocks


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0006_auto_20150819_0546'),
    ]

    operations = [
        migrations.AddField(
            model_name='custompage',
            name='sidebar',
            field=wagtail.fields.StreamField((('heading', wagtail.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.blocks.RichTextBlock()), ('image', wagtail.images.blocks.ImageChooserBlock())), null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='checklistpage',
            name='body',
            field=wagtail.fields.StreamField((('heading', wagtail.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.blocks.RichTextBlock()), ('image', wagtail.images.blocks.ImageChooserBlock())), null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='homepage',
            name='body',
            field=wagtail.fields.StreamField((('heading', wagtail.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.blocks.RichTextBlock()), ('image', wagtail.images.blocks.ImageChooserBlock())), null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='landingpage',
            name='body',
            field=wagtail.fields.StreamField((('heading', wagtail.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.blocks.RichTextBlock()), ('image', wagtail.images.blocks.ImageChooserBlock())), null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='optionspage',
            name='body',
            field=wagtail.fields.StreamField((('heading', wagtail.blocks.CharBlock(classname='full title')), ('paragraph', wagtail.blocks.RichTextBlock()), ('image', wagtail.images.blocks.ImageChooserBlock())), null=True, blank=True),
        ),
    ]
