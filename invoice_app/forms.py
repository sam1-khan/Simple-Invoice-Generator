from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django import forms
from .models import Invoice, InvoiceOwner, InvoiceItem, Client

class InvoiceForm(forms.ModelForm):
    class Meta:
        model = Invoice
        fields = ['invoice_owner', 'tax_percentage', 'date', 'notes',]
        widgets = {
            'invoice_owner': forms.Select(attrs={
                'autofocus': 'autofocus', 
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
            })
        }

    tax_percentage = forms.DecimalField(
        required=False,
        initial=0,
        max_digits=5,
        decimal_places=2,
        widget=forms.NumberInput(attrs={
            'min': '0',
            'max': '99999',
            'step': '0.01',
            'placeholder': 'Enter tax percentage (without "%")',
        })
    )


class InvoiceOwnerCreationForm(UserCreationForm):
    class Meta:
        model = InvoiceOwner
        fields = ["email", "ntn_number", "name", 'phone', 'address', 'bank', 'iban', 'account_title',]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['name'].required = True
        self.fields['ntn_number'].required = True
        self.fields['phone'].required = True
  

class InvoiceOwnerChangeForm(UserChangeForm):
    class Meta:
        model = InvoiceOwner
        fields = ["email", "ntn_number", "name", 'phone', 'address',]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['name'].required = True
        self.fields['ntn_number'].required = True
        self.fields['phone'].required = True


class InvoiceItemForm(forms.ModelForm):
    class Meta:
        model = InvoiceItem
        fields = ['name', 'description', 'quantity', 'unit', 'unit_price',]
        widgets = {
            'quantity': forms.NumberInput(attrs={
                'min': '0',
                'max': '999999',
                'step': '1',
                'placeholder': 'Enter item quantity',
            }),
            'unit_price': forms.NumberInput(attrs={
                'min': '0',
                'step': '0.01',  # Use 0.01 for decimal precision
                'placeholder': 'Enter item price',
            }),
            'name': forms.TextInput(attrs={
                'placeholder': 'Enter item name',
                'autofocus': 'autofocus',  
            }),
            'description': forms.TextInput(attrs={
                'placeholder': 'Enter item description',
                'rows':2,
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
            }),
            'name': forms.TextInput(attrs={
                'placeholder': 'Enter client name',
                'autofocus': 'autofocus',
            }),
            'address': forms.TextInput(attrs={
                'placeholder': 'Enter client address',
                'rows': 2,
            }),
            'ntn_number': forms.TextInput(attrs={
                'placeholder': 'Enter client ntn number',
            })
        }


InvoiceItemFormSet = forms.inlineformset_factory(
    Invoice, InvoiceItem, form=InvoiceItemForm, extra=1, can_delete=False
)

ClientFormSet = forms.inlineformset_factory(
    Invoice, Client, form=ClientForm, extra=1, can_delete=False
)