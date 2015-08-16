# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('page', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='contentpage',
            name='author',
            field=models.CharField(max_length=255, default=None),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='contentpage',
            name='date',
            field=models.DateField(verbose_name='Post date', default=None),
            preserve_default=False,
        ),
    ]
