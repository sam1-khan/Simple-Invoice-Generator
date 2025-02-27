# Generated by Django 4.2.7 on 2024-12-11 16:53

from django.conf import settings
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='InvoiceOwner',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('address', models.TextField(max_length=255)),
                ('phone', models.CharField(max_length=12)),
                ('phone_2', models.CharField(blank=True, max_length=12, null=True)),
                ('ntn_number', models.CharField(max_length=13, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('bank', models.CharField(max_length=55)),
                ('account_title', models.CharField(max_length=24)),
                ('iban', models.CharField(max_length=34)),
                ('email', models.EmailField(max_length=254, unique=True, verbose_name='email address')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'Invoice Owner',
            },
        ),
        migrations.CreateModel(
            name='Client',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('address', models.TextField(blank=True, max_length=255, null=True)),
                ('ntn_number', models.CharField(blank=True, max_length=13, null=True)),
                ('phone', models.CharField(blank=True, max_length=12, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ('-updated_at',),
            },
        ),
        migrations.CreateModel(
            name='Invoice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reference_number', models.CharField(editable=False, max_length=14)),
                ('tax_percentage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True, validators=[django.core.validators.MinValueValidator(0)])),
                ('total_price', models.DecimalField(decimal_places=2, default=0, editable=False, max_digits=16)),
                ('tax', models.DecimalField(decimal_places=2, default=0, editable=False, max_digits=16)),
                ('grand_total', models.DecimalField(decimal_places=2, default=0, editable=False, max_digits=16)),
                ('date', models.DateField(blank=True, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_taxed', models.BooleanField(default=False)),
                ('is_quotation', models.BooleanField(default=False)),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invoices', to='invoice_app.client')),
                ('invoice_owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='InvoiceItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('unit', models.CharField(max_length=55)),
                ('description', models.TextField(blank=True, null=True)),
                ('name', models.CharField(max_length=255)),
                ('quantity', models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=16, validators=[django.core.validators.MinValueValidator(0)])),
                ('total_price', models.DecimalField(decimal_places=2, editable=False, max_digits=16)),
                ('invoice', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='invoice_app.invoice')),
            ],
        ),
    ]
