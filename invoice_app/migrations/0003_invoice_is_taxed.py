# Generated by Django 4.2.7 on 2024-11-28 14:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoice_app', '0002_alter_client_ntn_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='is_taxed',
            field=models.BooleanField(blank=True, null=True),
        ),
    ]
