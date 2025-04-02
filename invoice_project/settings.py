import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment
load_dotenv(os.path.join(BASE_DIR, '.env'))

# Security
SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"  # Set DEBUG=True in .env for development

# Domain settings
ALLOWED_HOSTS = [
    'simpleinvoice.pythonanywhere.com',          # Production
    'simpleinvoicegenerator.vercel.app',         # Frontend
    'localhost', '127.0.0.1',                    # Development
]

# HTTPS Settings (disabled in development)
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = not DEBUG

# CORS
CORS_ALLOWED_ORIGINS = [
    "https://simpleinvoicegenerator.vercel.app",  # Production frontend
    "http://localhost:3000",                      # Development frontend
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True

# CSRF
CSRF_TRUSTED_ORIGINS = [
    "https://simpleinvoice.pythonanywhere.com",
    "https://simpleinvoicegenerator.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'ninja_jwt',
    'invoice_app',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

# Database
if DEBUG:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': 'simpleinvoice$generator',
            'USER': 'simpleinvoice',
            'PASSWORD': os.getenv('MYSQL_PASSWORD'),
            'HOST': 'simpleinvoice.mysql.pythonanywhere-services.com',
            'OPTIONS': {'sql_mode': 'STRICT_TRANS_TABLES'},
        }
    }

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Django Ninja JWT
NINJA_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Email (development uses console backend)
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = 'smtp.gmail.com'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.getenv("EMAIL")
    EMAIL_HOST_PASSWORD = os.getenv('PASSWORD')

# Development-specific settings
if DEBUG:
    # Allow all hosts in development
    ALLOWED_HOSTS = ['*']
    
    # Disable SSL redirect for local testing
    SECURE_SSL_REDIRECT = False
    
    # Print emails to console
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'