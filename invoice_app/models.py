from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.contrib.auth.models import AbstractUser
from .managers import CustomUserManager
from .utils import upload_logo, upload_sign
from imagekit.models import ProcessedImageField
from imagekit.processors import ResizeToFill
from .storage import OverwriteStorage


class InvoiceOwner(AbstractUser):
    is_onboarded = models.BooleanField(default=False)
    address = models.TextField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=12)
    phone_2 = models.CharField(max_length=12, blank=True, null=True)
    ntn_number = models.CharField(max_length=13, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    bank = models.CharField(max_length=55, blank=True, null=True)
    account_title = models.CharField(max_length=24, blank=True, null=True)
    iban = models.CharField(max_length=34, blank=True, null=True)
    logo = ProcessedImageField(
        upload_to=upload_logo,
        storage=OverwriteStorage(),
        processors=[ResizeToFill(500, 500)],
        format='PNG',
        options={'quality': 90},
        null=True,
        blank=True,
    )
    signature = ProcessedImageField(
        upload_to=upload_sign,
        storage=OverwriteStorage(),
        processors=[ResizeToFill(577, 432)],
        format='PNG',
        options={'quality': 90},
        null=True,
        blank=True,
    )

    username = None
    first_name = None
    last_name = None

    email = models.EmailField(_("email address"), unique=True)
    name = models.CharField(max_length=255)

    USERNAME_FIELD = "email"
    FIRST_NAME_FIELD = "name"
    REQUIRED_FIELDS = ['name', 'address', 'phone']

    objects = CustomUserManager()

    class Meta:
        verbose_name = "Invoice Owner"

    def clean(self):
        super().clean()

        if self.phone and not self.phone.replace("-", "").isdigit():
            raise ValidationError(_("Phone number should contain only digits and dashes (-)."))

        if self.phone and not (11 <= len(self.phone) <= 12):
            raise ValidationError(_("Phone Number must be 11 to 12 characters long. Pattern: 0123-4567890"))

        if self.phone_2 and not self.phone_2.replace("-", "").isdigit():
            raise ValidationError(_("Alternate phone number should contain only digits and dashes (-)."))

        if self.phone_2 and not (11 <= len(self.phone_2) <= 12):
            raise ValidationError(_("Alternate Phone Number must be 11 to 12 characters long. Pattern: 0123-4567890"))

        if self.ntn_number and not (7 <= len(self.ntn_number) <= 13):
            print("DEBUG: Invalid NTN number length")
            raise ValidationError(_("NTN number must be 7 to 13 characters long. Pattern: 01234-5678901 or 0123456-78901"))
    
    def __str__(self):
        return self.name


class Client(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(max_length=255, null=True, blank=True)
    ntn_number = models.CharField(max_length=13, null=True, blank=True)
    phone = models.CharField(max_length=12, blank=True, null=True)
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


class Invoice(models.Model):
    invoice_owner = models.ForeignKey(InvoiceOwner, on_delete=models.CASCADE)
    client = models.ForeignKey(Client, related_name='invoices', on_delete=models.CASCADE)
    reference_number = models.CharField(max_length=14, editable=False)
    tax_percentage = models.DecimalField(
        max_digits=5, blank=True, null=True, decimal_places=3, validators=[MinValueValidator(0)]
    )
    total_price = models.DecimalField(max_digits=16, default=0, decimal_places=3, editable=False)
    tax = models.DecimalField(max_digits=16, default=0, decimal_places=3, editable=False)
    grand_total = models.DecimalField(max_digits=16, default=0, decimal_places=3, editable=False)
    date = models.DateField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_taxed = models.BooleanField(default=False)
    is_quotation = models.BooleanField(default=False)
    is_paid = models.BooleanField(default=False)
    transit_charges = models.DecimalField(max_digits=16, default=0, decimal_places=3, null=True, blank=True)

    def clean(self):
        """Validate tax_percentage."""
        if self.tax_percentage and not (0 <= self.tax_percentage <= 100):
            raise ValidationError(_("Tax percentage must be between 0 and 100."))

    def calculate_totals(self):
        """Calculate total_price, tax, and grand_total."""
        self.total_price = sum(item.total_price for item in self.items.all())
        
        if self.transit_charges:
            self.total_price += self.transit_charges
 
        self.tax = self.total_price * (self.tax_percentage / 100) if self.tax_percentage else 0
        self.grand_total = self.total_price + self.tax

    @staticmethod
    def get_next_reference_number(last_invoice=None, is_quotation=False):
        """Generate the next reference number in sequence."""
        
        if last_invoice:
            last_number = int(last_invoice.reference_number.split('-')[1])
            next_number = last_number + 1
        else:
            next_number = 1
        
        if is_quotation:
            return f"Q_SAE-{next_number:04d}"  # Quotation reference number (Q_SAE-xxxx)
        else:
            return f"I_SAE-{next_number:04d}"  # Invoice reference number (I_SAE-xxxx)

    def save(self, *args, **kwargs):
        """Override save to set the reference number before saving, and handle is_quotation changes."""
        
        is_quotation_changed = False
        
        if self.pk:
            old_invoice = Invoice.objects.get(pk=self.pk)
            is_quotation_changed = old_invoice.is_quotation != self.is_quotation

        if not self.reference_number or is_quotation_changed:
            if self.is_quotation:
                last_quotation = Invoice.objects.filter(is_quotation=True).order_by('-id').first()
                self.reference_number = Invoice.get_next_reference_number(last_quotation, is_quotation=True)
            else:
                last_invoice = Invoice.objects.filter(is_quotation=False).order_by('-id').first()
                self.reference_number = Invoice.get_next_reference_number(last_invoice, is_quotation=False)
        
        super().save(*args, **kwargs)
        self.calculate_totals()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice {self.reference_number}"


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    unit = models.CharField(max_length=55)
    description = models.TextField(null=True, blank=True)
    name = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=16, decimal_places=3, validators=[MinValueValidator(0)])
    unit_price = models.DecimalField(max_digits=16, decimal_places=3, validators=[MinValueValidator(0)])
    total_price = models.DecimalField(max_digits=16, decimal_places=3, editable=False)

    def save(self, *args, **kwargs):
        """Calculate total_price based on quantity and unit_price."""
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.quantity} x {self.unit_price}"