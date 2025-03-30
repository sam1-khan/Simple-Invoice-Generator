from django.db import connection
import os
import phonenumbers
from django.core.exceptions import ValidationError
from django.conf import settings
from django.utils.translation import get_language

def validate_phone_number(phone_number):
    """Validate phone number and return an error message with a valid example if invalid."""
    try:
        region = (
            get_language().split('-')[1] 
            if '-' in get_language() 
            else getattr(settings, "DEFAULT_PHONE_REGION", "US")
        )

        # Parse the phone number
        parsed_phone = phonenumbers.parse(phone_number, region)

        if not phonenumbers.is_valid_number(parsed_phone):
            # Provide a valid example for the region
            valid_example = phonenumbers.format_number(
                phonenumbers.example_number_for_type(region, phonenumbers.PhoneNumberType.MOBILE),
                phonenumbers.PhoneNumberFormat.INTERNATIONAL
            )
            
            # Raise a validation error with a valid example
            raise ValidationError(
                f"Invalid phone number. Example of a valid number for this region: {valid_example}"
            )

    except phonenumbers.phonenumberutil.NumberParseException:
        raise ValidationError("Invalid phone number format. Ensure you include the correct country code.")

# https://stackoverflow.com/questions/1074212/how-can-i-see-the-raw-sql-queries-django-is-running
def dump_queries() :
    qs = connection.queries
    for q in qs:
        print(q)

def upload_logo(instance, filename):
    ext = filename.split('.')[-1]
    account_folder = str(instance.pk) if instance.pk else "temp"
    return os.path.join('invoice_app', 'static', 'media', account_folder, f'logo.{ext}')

def upload_sign(instance, filename):
    ext = filename.split('.')[-1]
    account_folder = str(instance.pk) if instance.pk else "temp"
    return os.path.join('invoice_app', 'static', 'media', account_folder, f'sign.{ext}')