# Generated by Django 4.2.7 on 2025-02-09 20:27

from django.db import migrations, models
import invoice_app.utils


class Migration(migrations.Migration):

    dependencies = [
        ('invoice_app', '0004_invoiceowner_logo_invoiceowner_signature'),
    ]

    operations = [
        migrations.AlterField(
            model_name='invoiceowner',
            name='logo',
            field=models.ImageField(blank=True, null=True, upload_to=invoice_app.utils.upload_logo),
        ),
        migrations.AlterField(
            model_name='invoiceowner',
            name='signature',
            field=models.ImageField(blank=True, null=True, upload_to=invoice_app.utils.upload_sign),
        ),
    ]
