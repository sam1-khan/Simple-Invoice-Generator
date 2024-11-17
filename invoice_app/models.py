from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.utils.timezone import now
import uuid


class Company(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=12)
    ntn_number = models.CharField(max_length=13)

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


class Client(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=12)

    def clean(self):
        if self.phone and not self.phone.replace("-", "").isdigit():
            raise ValidationError(_("Phone number should contain only digits and dashes (-)."))

        if self.phone and not (11 <= len(self.phone) <= 12):
            raise ValidationError("Phone Number must be 11 to 12 characters long. Pattern: 0123-4567890")

    def __str__(self):
        return self.name


class Invoice(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    reference_number = models.CharField(max_length=20, editable=False, unique=True)
    description = models.TextField()
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)])
    total_price = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_tax(self):
        """Calculate the tax based on the total price."""
        if self.total_price is None:
            raise ValueError("Total price must be calculated before calculating tax.")
        return self.total_price * (self.tax_percentage / 100)

    def clean(self):
        if self.quantity and self.quantity <= 0:
            raise ValidationError(_("Quantity must be greater than zero."))

        if self.unit_price and self.unit_price < 0:
            raise ValidationError(_("Unit price cannot be negative."))

        if self.tax_percentage and not (0 <= self.tax_percentage <= 100):
            raise ValidationError(_("Tax percentage must be between 0 and 100."))

        self.total_price = self.quantity * self.unit_price
        self.grand_total = self.total_price + self.calculate_tax()

    def save(self, *args, **kwargs):
        if not self.reference_number:
            date_part = now().strftime("%Y%m")
            uuid_part = str(uuid.uuid4()).split('-')[0][:6]
            self.reference_number = f"{date_part}-{uuid_part}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice {self.reference_number} - {self.client.name}"