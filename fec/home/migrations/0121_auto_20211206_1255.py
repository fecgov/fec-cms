# Generated by Django 3.1.13 on 2021-12-06 17:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0120_auto_20211201_1130'),
    ]

    operations = [
        migrations.AlterField(
            model_name='collectionpage',
            name='menu_title',
            field=models.CharField(blank=True, default='', max_length=255),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='custompage',
            name='menu_title',
            field=models.CharField(blank=True, default='', max_length=255),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='resourcepage',
            name='menu_title',
            field=models.CharField(blank=True, default='', max_length=255),
            preserve_default=False,
        ),
    ]