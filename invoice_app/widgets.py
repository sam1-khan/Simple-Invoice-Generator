from django import forms
from decimal import Decimal

class NoTrailingZeroNumberInput(forms.NumberInput):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def format_value(self, value):
        if value is not None and isinstance(value, Decimal):
            #Strip trailing 0s, leaving a minimum of 0 decimal places
            while (abs(value.as_tuple().exponent) > 0 and value.as_tuple().digits[-1] == 0):
                value = Decimal(str(value)[:-1])
            return value