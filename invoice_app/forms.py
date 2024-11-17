from django import forms
from .models import Invoice

class InvoiceForm(forms.ModelForm):
    class Meta:
        model = Invoice
        fields = ['description', 'quantity', 'unit_price', 'company', 'client', 'tax_percentage']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3, 'autofocus': 'autofocus'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make auto-calculated fields readonly
        self.fields['tax_percentage'].initial = 10.50  # Set a default value

    def clean_quantity(self):
        quantity = self.cleaned_data.get('quantity')
        if quantity <= 0:
            raise forms.ValidationError("Quantity must be greater than zero.")
        return quantity
