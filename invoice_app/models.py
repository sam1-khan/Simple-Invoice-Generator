from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.timezone import now
from django.contrib.auth.models import AbstractUser
import uuid
from .managers import CustomUserManager


class InvoiceOwner(AbstractUser):
    address = models.TextField(max_length=255)
    phone = models.CharField(max_length=12)
    ntn_number = models.CharField(max_length=13, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    username = None
    first_name = None
    last_name = None

    email = models.EmailField(_("email address"), unique=True)
    name = models.CharField(max_length=50, unique=True)

    USERNAME_FIELD = "email"
    FIRST_NAME_FIELD = "name"
    REQUIRED_FIELDS = ['name', 'address', 'ntn_number', 'phone']

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
#    client = models.ForeignKey(Client, related_name='invoices', on_delete=models.CASCADE)
    invoice_owner = models.ForeignKey(InvoiceOwner, on_delete=models.CASCADE)
    reference_number = models.CharField(max_length=14, editable=False, unique=True)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)])
    tax = models.DecimalField(max_digits=16, default=0, editable=False, decimal_places=2)
    total_price = models.DecimalField(max_digits=16, default=0, decimal_places=2, editable=False)
    grand_total = models.DecimalField(max_digits=16, default=0, decimal_places=2, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """Ensure tax percentage is within range."""
        if self.tax_percentage and not (0 <= self.tax_percentage <= 100):
            raise ValidationError(_("Tax percentage must be between 0 and 100."))

    def save(self, *args, **kwargs):
        # Calculate totals
        if self.pk:  # Make sure the Invoice is saved before accessing related items
            self.total_price = sum(item.total_price for item in self.items.all())
            self.tax = self.total_price * (self.tax_percentage / 100)
            self.grand_total = self.total_price + self.tax
        
        # Ensure reference number is generated
        if not self.reference_number:
            date_part = now().strftime("%Y%m")
            uuid_part = str(uuid.uuid4()).split('-')[0][:6]
            self.reference_number = f"{date_part}-{uuid_part}"

        # Call the parent class save method
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice {self.reference_number} - {self.client.name}"

    
class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(999999)])
    unit_price = models.DecimalField(max_digits=16, decimal_places=2, validators=[MinValueValidator(0)])
    total_price = models.DecimalField(max_digits=16, decimal_places=2, editable=False)

    def clean(self):
        if self.quantity and self.quantity > 0:
            if self.unit_price and self.unit_price > 0:
                self.total_price = self.quantity * self.unit_price
            else:
                raise ValidationError(_("Unit price must be positive number."))
        else:
            raise ValidationError(_("Quantity must be greater than zero."))

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} - {self.quantity} x {self.unit_price}"


class Client(models.Model):
    name = models.CharField(max_length=55)
    phone = models.CharField(max_length=12)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    invoice = models.ForeignKey(Invoice, related_name='clients', on_delete=models.CASCADE, null=True, blank=True)


    class Meta:
        ordering = ('-updated_at',)

    def clean(self):
        if self.phone and not self.phone.replace("-", "").isdigit():
            raise ValidationError(_("Phone number should contain only digits and dashes (-)."))

        if self.phone and not (11 <= len(self.phone) <= 12):
            raise ValidationError("Phone Number must be 11 to 12 characters long. Pattern: 0123-4567890")

    def __str__(self):
        return self.name
