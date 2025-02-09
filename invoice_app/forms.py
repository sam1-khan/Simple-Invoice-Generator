from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django import forms
from .widgets import NoTrailingZeroNumberInput
from .models import Invoice, InvoiceOwner, InvoiceItem, Client

class InvoiceForm(forms.ModelForm):
    class Meta:
        model = Invoice
        fields = ['invoice_owner', 'client', 'is_quotation', 'is_taxed', 'tax_percentage', 'transit_charges', 'date', 'notes',]
        widgets = {
            'invoice_owner': forms.Select(attrs={
                'autofocus': 'autofocus', 
            }),
            'transit_charges': NoTrailingZeroNumberInput(attrs={
                'min': '0',
                'step': '0.001',  # Use 0.01 for decimal precision
                'placeholder': 'Enter transit charges (if any)',
            }),
            'date': forms.DateInput(
                format=('%Y-%m-%d'),
                attrs={
                    'placeholder': 'Select a date',
                    'type': 'date'
            }),
            'notes': forms.Textarea(attrs={
                'rows': 3,
                'placeholder': 'Enter additional notes',
            }),
        }
    is_taxed = forms.BooleanField(label='Tax Included', required=False)
    is_quotation = forms.BooleanField(label='Quotation', required=False)
    tax_percentage = forms.DecimalField(
        required=False,
        initial=0,
        max_digits=5,
        decimal_places=2,
        widget=NoTrailingZeroNumberInput(attrs={
            'min': '0',
            'max': '99999',
            'step': '0.001',
            'placeholder': 'Enter tax percentage (without "%")',
        })
    )
    client = forms.ModelChoiceField(queryset=Client.objects.all(), empty_label="Select Client or Create New", required=True)


class InvoiceOwnerCreationForm(UserCreationForm):
    class Meta:
        model = InvoiceOwner
        fields = ["email", "ntn_number", "name", 'phone', 'phone_2', 'address', 'bank', 'iban', 'account_title', 'logo', 'signature',]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['name'].required = True
        self.fields['ntn_number'].required = True
        self.fields['phone'].required = True
        self.fields['bank'].required = True
        self.fields['address'].required = True
        self.fields['iban'].required = True
        self.fields['account_title'].required = True
        self.fields['logo'].required = True
        self.fields['signature'].required = True
  

class InvoiceOwnerChangeForm(UserChangeForm):
    class Meta:
        model = InvoiceOwner
        fields = ["email", "ntn_number", "name", 'phone', 'phone_2', 'address', 'bank', 'iban', 'account_title', 'logo', 'signature',]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['name'].required = True
        self.fields['ntn_number'].required = True
        self.fields['phone'].required = True
        self.fields['bank'].required = True
        self.fields['address'].required = True
        self.fields['iban'].required = True
        self.fields['account_title'].required = True
        self.fields['logo'].required = True
        self.fields['signature'].required = True


class InvoiceItemForm(forms.ModelForm):
    class Meta:
        model = InvoiceItem
        fields = ['name', 'description', 'quantity', 'unit', 'unit_price',]
        widgets = {
            'quantity': NoTrailingZeroNumberInput(attrs={
                'min': '0',
                'max': '999999',
                'step': '0.001',
                'placeholder': 'Enter item quantity',
            }),
            'unit_price': NoTrailingZeroNumberInput(attrs={
                'min': '0',
                'step': '0.001',  # Use 0.01 for decimal precision
                'placeholder': 'Enter item price',
            }),
            'name': forms.TextInput(attrs={
                'placeholder': 'Enter item name',
                'autofocus': 'autofocus',
                'autocomplete': 'off',
            }),
            'description': forms.Textarea(attrs={
                'placeholder': 'Enter item description',
                'rows': 3,
            }),
                'unit': forms.TextInput(attrs={
                'placeholder': 'Enter quantity unit i.e pc(s), box(es), unit(s)',
            })
        }


class ClientForm(forms.ModelForm):
    class Meta:
        model = Client
        fields = ['name', 'phone', 'address', 'ntn_number',]
        widgets = {
            'phone': forms.TextInput(attrs={
                'placeholder': 'Enter client phone number',
                'autocomplete': 'off',
            }),
            'name': forms.TextInput(attrs={
                'placeholder': 'Enter client name',
                'autofocus': 'autofocus',
                'autocomplete': 'off',
            }),
            'address': forms.TextInput(attrs={
                'placeholder': 'Enter client address',
                'rows': 2,
                'autocomplete': 'off',
            }),
            'ntn_number': forms.TextInput(attrs={
                'placeholder': 'Enter client ntn number',
                'autocomplete': 'off',
            })
        }


InvoiceItemFormSet = forms.inlineformset_factory(
    Invoice, InvoiceItem, form=InvoiceItemForm, extra=1, can_delete=True
)