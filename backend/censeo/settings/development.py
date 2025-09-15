"""
Development settings for censeo project.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DATABASE_NAME', default='censeo_dev'),
        'USER': config('DATABASE_USER', default='censeo_user'),
        'PASSWORD': config('DATABASE_PASSWORD', default='censeo_dev_password'),
        'HOST': config('DATABASE_HOST', default='database'),  # Docker service name
        'PORT': config('DATABASE_PORT', default='5432'),
    }
}

# CORS settings for development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Session settings for development
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_SAMESITE = 'Lax'