from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django import forms
from .models import Invoice, Company

class InvoiceForm(forms.ModelForm):
    class Meta:
        model = Invoice
        fields = ['client', 'company', 'tax_percentage']
        widgets = {
            'tax_percentage': forms.NumberInput(attrs={'min': '0', 'max': '100', 'step': '1.00'}),
        }

class CompanyCreationForm(UserCreationForm):
    class Meta:
        model = Company
        fields = ("email", "ntn_number", "name", 'phone', 'address',)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['name'].required = True
        self.fields['ntn_number'].required = True
        self.fields['phone'].required = True
  

class CompanyChangeForm(UserChangeForm):
    class Meta:
        model = Company
        fields = ("email", "ntn_number", "name", 'phone', 'address',)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['name'].required = True
        self.fields['ntn_number'].required = True
        self.fields['phone'].required = True