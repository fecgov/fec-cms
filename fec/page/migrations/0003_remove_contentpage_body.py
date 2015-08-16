# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('page', '0002_auto_20150813_2117'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='contentpage',
            name='body',
        ),
    ]
