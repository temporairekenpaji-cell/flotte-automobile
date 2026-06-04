import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

# Load .env with explicit UTF-8 encoding to avoid Windows locale issues
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path, encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default')
DEBUG = os.getenv('DEBUG', 'True') == 'True'

# Fix psycopg2 UnicodeDecodeError on Windows (French locale)
if sys.platform == 'win32':
    import os
    os.environ.setdefault('PGCLIENTENCODING', 'UTF8')

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',
    'django_filters',
    
    # Local apps
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'flotte_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'flotte_backend.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'flotte_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'OPTIONS': {
            'client_encoding': 'UTF8',
        },
    }
}

import urllib.parse

def clean_database_url(url):
    if not url:
        return url
    try:
        prefix = ""
        if url.startswith("postgresql://"):
            prefix = "postgresql://"
            url_to_parse = url[len("postgresql://"):]
        elif url.startswith("postgres://"):
            prefix = "postgres://"
            url_to_parse = url[len("postgres://"):]
        else:
            return url
        
        if "@" not in url_to_parse:
            return url
            
        parts = url_to_parse.rsplit("@", 1)
        credentials = parts[0]
        host_and_db = parts[1]
        
        if ":" in credentials:
            cred_parts = credentials.split(":", 1)
            username = cred_parts[0]
            password = cred_parts[1]
            quoted_password = urllib.parse.quote(password, safe='')
            return f"{prefix}{username}:{quoted_password}@{host_and_db}"
    except Exception:
        pass
    return url

if os.getenv('DATABASE_URL'):
    cleaned_db_url = clean_database_url(os.getenv('DATABASE_URL'))
    DATABASES['default'] = dj_database_url.config(
        default=cleaned_db_url,
        conn_max_age=600,
        conn_health_checks=True,
        ssl_require=True
    )

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Europe/Paris'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'core.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,
}

CORS_ALLOW_ALL_ORIGINS = True # Allow React to connect

MEDIA_URL = 'media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

