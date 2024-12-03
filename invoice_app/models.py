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
    invoice_owner = models.ForeignKey(InvoiceOwner, on_delete=models.CASCADE)
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
    is_taxed = models.BooleanField(default=False)

    def clean(self):
        """Validate tax_percentage."""
        if self.tax_percentage and not (0 <= self.tax_percentage <= 100):
            raise ValidationError(_("Tax percentage must be between 0 and 100."))

    def calculate_totals(self):
        """Calculate total_price, tax, and grand_total."""
        # Recalculate total price from all items
        self.total_price = sum(item.total_price for item in self.items.all())

        # Calculate tax and grand total based on the invoice tax_percentage
        self.tax = self.total_price * (self.tax_percentage / 100) if self.tax_percentage else 0
        self.grand_total = self.total_price + self.tax

    @staticmethod
    def get_next_reference_number():
        """Generate the next reference number in sequence."""
        last_invoice = Invoice.objects.all().order_by('-id').first()
        if last_invoice:
            last_number = int(last_invoice.reference_number.split('-')[1])
            next_number = last_number + 1
        else:
            next_number = 1  # Starting at 1 if no invoices exist yet
        
        return f"SAE-{next_number:04d}"

    def save(self, *args, **kwargs):
        """Override save to set the reference number before saving."""
        if not self.reference_number:
            self.reference_number = Invoice.get_next_reference_number()

        # Save first to ensure primary key is set before calculating totals
        super().save(*args, **kwargs)
        
        # Now calculate totals after the instance is saved
        self.calculate_totals()

        # Save again with updated totals
        super().save(*args, **kwargs)


    def __str__(self):
        return f"Invoice {self.reference_number}"


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    unit = models.CharField(max_length=55)  # Added back 'unit' field
    description = models.TextField(null=True, blank=True)  # Added back 'description' field
    name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=16, decimal_places=2, validators=[MinValueValidator(0)])
    total_price = models.DecimalField(max_digits=16, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        """Calculate total_price based on quantity and unit_price."""
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.quantity} x {self.unit_price}"


class Client(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(max_length=255, null=True, blank=True)
    ntn_number = models.CharField(max_length=13, null=True, blank=True)
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