# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wagtailforms', '0002_add_verbose_names'),
        ('wagtailredirects', '0002_add_verbose_names'),
        ('wagtailsearch', '0002_add_verbose_names'),
        ('wagtailcore', '0001_squashed_0016_change_page_url_path_to_text_field'),
        ('home', '0011_ssfchecklistpage'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='optionspage',
            name='page_ptr',
        ),
        migrations.DeleteModel(
            name='OptionsPage',
        ),
    ]
