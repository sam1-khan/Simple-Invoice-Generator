import os
from pathlib import Path
from datetime import timedelta

from dotenv import load_dotenv
load_dotenv()

# Build paths (using pathlib.Path for consistency)
BASE_DIR = Path(__file__).resolve().parent.parent
# Application name
APP_NAME = 'Simple Invoice Generator'

# Security
SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = eval(os.getenv("DEBUG"))

# Domain settings
ALLOWED_HOSTS = [
    'simpleinvoice.pythonanywhere.com',
    'simpleinvoicegenerator.vercel.app',
    'localhost',
    '127.0.0.1',
]

# Use our custom user model
AUTH_USER_MODEL = "invoice_app.InvoiceOwner"

# HTTPS Settings
SESSION_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = not DEBUG

# CORS
CORS_ALLOWED_ORIGINS = [
    "https://simpleinvoicegenerator.vercel.app",
    "http://localhost:3000",
    "https://simpleinvoice.pythonanywhere.com",
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

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',

    # Third-party apps
    'django_extensions',
    'crispy_forms',
    'crispy_bootstrap5',
    'corsheaders',
    'imagekit',
    'ninja_jwt',
    'invoice_app',

    # Django cleanup should be in last
    'django_cleanup.apps.CleanupConfig',
]

# Crispy forms configuration
CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"
CRISPY_TEMPLATE_PACK = "bootstrap5"

# Optional: if you're using taggit or similar packages
TAGGIT_CASE_INSENSITIVE = True

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Key Fix: ROOT_URLCONF
ROOT_URLCONF = 'invoice_project.urls'  # Replace 'simpleinvoice' with your project name

# WSGI Application
WSGI_APPLICATION = 'invoice_project.wsgi.application'  # Replace 'simpleinvoice' with your project name

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

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization settings
LANGUAGE_CODE = 'en-us'
DEFAULT_PHONE_REGION = 'PK'
TIME_ZONE = 'Asia/Karachi'
USE_I18N = True
USE_L10N = True
USE_THOUSAND_SEPARATOR = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'static'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Django Ninja JWT
NINJA_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Authentication backends
AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
)

# Redirect URLs after login/logout
LOGOUT_REDIRECT_URL = '/'
LOGIN_REDIRECT_URL = '/'

# Default primary key field type for Django 3.2+
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

# Caching Configuration
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique-snowflake",
    }
}

# Email
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL")
EMAIL_HOST_PASSWORD = os.getenv('PASSWORD')

PASSWORD_RESET_TIMEOUT = 300  # 300 seconds = 5 minutes
# Frontend URL for Reset Link

FRONTEND_URL = os.getenv("FRONTEND_URL")

# Templates (required for admin and error pages)
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.template.context_processors.media',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'invoice_app.context_processors.settings',  # Your custom context processor
            ],
        },
    },
]

# Development overrides
if DEBUG:
    ALLOWED_HOSTS = ['*']
    SECURE_SSL_REDIRECT = False