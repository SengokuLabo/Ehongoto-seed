import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ['SECRET_KEY']
DEBUG = False
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

INSTALLED_APPS = [
  'django.contrib.contenttypes',
  'django.contrib.auth',
  'django.contrib.admin',
  'django.contrib.sessions',
  'django.contrib.messages',
  'django.contrib.staticfiles',
  'rest_framework',
  'corsheaders',
  'apps.ehon',
  'apps.common',
]

MIDDLEWARE = [
  'corsheaders.middleware.CorsMiddleware',
  'django.middleware.security.SecurityMiddleware',
  'django.middleware.common.CommonMiddleware',
  'django.contrib.sessions.middleware.SessionMiddleware',
  'django.contrib.auth.middleware.AuthenticationMiddleware',
  'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
  'default': {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': os.environ['DB_NAME'],
    'USER': os.environ['DB_USER'],
    'PASSWORD': os.environ['DB_PASSWORD'],
    'HOST': os.environ['DB_HOST'],
    'PORT': os.environ.get('DB_PORT', '5432'),
  }
}

LANGUAGE_CODE = 'ja'
TIME_ZONE = 'Asia/Tokyo'
USE_I18N = True
USE_TZ = True

MEDIA_ROOT = os.environ.get('MEDIA_ROOT', BASE_DIR / 'media')
MEDIA_URL = '/media/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
  'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
  'DEFAULT_AUTHENTICATION_CLASSES': ['apps.common.auth.SessionAuth',],
  'DEFAULT_PERMISSION_CLASSES': [],
}

TEMPLATES = [{
  'BACKEND': 'django.template.backends.django.DjangoTemplates',
  'DIRS': [],
  'APP_DIRS': True,
  'OPTIONS': {
    'context_processors': [
      'django.template.context_processors.request',
      'django.contrib.auth.context_processors.auth',
      'django.contrib.messages.context_processors.messages',
    ],
  },
}]

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'static'

CORS_ALLOW_CREDENTIALS = True

# セッション有効期限は、最終操作から3日間
SESSION_COOKIE_AGE = 60 * 60 * 24 * 3
SESSION_SAVE_EVERY_REQUEST = True
