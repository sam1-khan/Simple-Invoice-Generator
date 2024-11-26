from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from .managers import CustomUserManager


class InvoiceOwner(AbstractUser):
    address = models.TextField(max_length=255)
    phone = models.CharField(max_length=12)
    ntn_number = models.CharField(max_length=13, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    bank = models.CharField(max_length=55)
    account_title = models.CharField(max_length=24)
    iban = models.CharField(max_length=34)

    username = None
    first_name = None
    last_name = None

    email = models.EmailField(_("email address"), unique=True)
    name = models.CharField(max_length=255, unique=True)

    USERNAME_FIELD = "email"
    FIRST_NAME_FIELD = "name"
    REQUIRED_FIELDS = ['name', 'address', 'ntn_number', 'phone', 'iban', 'bank', 'account_title']

    objects = CustomUserManager()

    class Meta:
        verbose_name = "Invoice Owner"

    def clean(self):
        if self.phone and not self.phone.replace("-", "").isdigit():
            raise ValidationError(_("Phone number should contain only digits and dashes (-)."))

        if self.phone and not (11 <= len(self.phone) <= 12):
            raise ValidationError("Phone Number must be 11 to 12 characters long. Pattern: 0123-4567890")

        if self.ntn_number and not (7 <= len(self.ntn_number) <= 13):
            raise ValidationError("NTN number must be 7 to 13 characters long. Pattern: 01234-5678901 or 0123456-78901")

    def __str__(self):
        return self.name

class Invoice(models.Model):
    invoice_owner = models.ForeignKey('InvoiceOwner', on_delete=models.CASCADE)
    reference_number = models.CharField(max_length=14, editable=False, unique=True)
    tax_percentage = models.DecimalField(
        max_digits=5, blank=True, null=True, decimal_places=2, validators=[MinValueValidator(0)]
    )
    total_price = models.DecimalField(max_digits=16, default=0, decimal_places=2, editable=False)
    tax = models.DecimalField(max_digits=16, default=0, decimal_places=2, editable=False)
    grand_total = models.DecimalField(max_digits=16, default=0, decimal_places=2, editable=False)
    date = models.DateField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """Validate tax_percentage and ensure exclusive use of invoice tax or item tax."""
        if self.tax_percentage and not (0 <= self.tax_percentage <= 100):
            raise ValidationError(_("Tax percentage must be between 0 and 100."))

        if self.pk and self.items.filter(item_tax_percentage__gt=0).exists() and self.tax_percentage:
            raise ValidationError(_("You can't set both item-level tax and invoice-level tax."))

    def calculate_totals(self):
        """Calculate total_price, tax, and grand_total."""
        # Recalculate total price from all items
        self.total_price = sum(item.total_price for item in self.items.all())

        # Check if item-level taxes exist
        has_item_tax = self.items.filter(item_tax_percentage__gt=0).exists()

        if has_item_tax:
            # Use item-level taxes
            self.tax = 0  # No invoice-level tax
            self.tax_percentage = None
            self.grand_total = sum(item.after_tax for item in self.items.all())
        else:
            # Use invoice-level tax if defined
            self.tax = self.total_price * (self.tax_percentage / 100) if self.tax_percentage else 0
            self.grand_total = self.total_price + self.tax

    def save(self, *args, **kwargs):
        """Override save to ensure totals are calculated before saving."""
        if self.pk:  # Ensure the Invoice instance exists before accessing items
            self.calculate_totals()

        # Generate a reference number if not already set
        if not self.reference_number and self.pk:
            self.reference_number = f"INV-{self.pk:06d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice {self.reference_number}"


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    unit = models.CharField(max_length=55)
    description = models.TextField(null=True, blank=True)
    name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=16, decimal_places=2, validators=[MinValueValidator(0)])
    item_tax_percentage = models.DecimalField(
        max_digits=5, default=0, decimal_places=2, validators=[MinValueValidator(0)]
    )
    total_price = models.DecimalField(max_digits=16, decimal_places=2, editable=False)
    after_tax = models.DecimalField(max_digits=16, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        """Calculate total_price and after_tax."""
        self.total_price = self.quantity * self.unit_price
        item_tax = self.total_price * (self.item_tax_percentage / 100) if self.item_tax_percentage else 0
        self.after_tax = self.total_price + item_tax
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.quantity} x {self.unit_price}"


class Client(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(max_length=255, null=True, blank=True)
    ntn_number = models.CharField(max_length=13, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=12, blank=True, null=True)
    invoice = models.ForeignKey(Invoice, related_name='clients', on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-updated_at',)

    def clean(self):
        if self.phone and not self.phone.replace("-", "").isdigit():
            raise ValidationError(_("Phone number should contain only digits and dashes (-)."))

        if self.phone and not (11 <= len(self.phone) <= 12):
            raise ValidationError("Phone Number must be 11 to 12 characters long. Pattern: 0123-4567890")

        if self.ntn_number and not (7 <= len(self.ntn_number) <= 13):
            raise ValidationError("NTN number must be 7 to 13 characters long. Pattern: 01234-5678901 or 0123456-78901")

    def __str__(self):
        return self.name