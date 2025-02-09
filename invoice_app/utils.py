from django.db import connection
import os

# https://stackoverflow.com/questions/1074212/how-can-i-see-the-raw-sql-queries-django-is-running
def dump_queries() :
    qs = connection.queries
    for q in qs:
        print(q)

def upload_logo(instance, filename):
    ext = filename.split('.')[-1]
    return os.path.join('invoice_app', 'static', 'media', f'logo.{ext}')

def upload_sign(instance, filename):
    ext = filename.split('.')[-1]
    return os.path.join('invoice_app', 'static', 'media', f'sign.{ext}')