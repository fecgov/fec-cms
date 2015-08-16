# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0003_auto_20150816_1907'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='homepage',
            name='author',
        ),
        migrations.RemoveField(
            model_name='homepage',
            name='date',
        ),
    ]
