"""Development settings for censeo project."""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Database configuration
# Override only if we need PostgreSQL specifically for development
# Allow environment variables to switch to SQLite for testing
if config("DATABASE_ENGINE", default="") != "django.db.backends.sqlite3":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DATABASE_NAME", default="censeo_dev"),
            "USER": config("DATABASE_USER", default="censeo_user"),
            "PASSWORD": config("DATABASE_PASSWORD", default="censeo_dev_password"),
            "HOST": config("DATABASE_HOST", default="database"),  # Docker service name
            "PORT": config("DATABASE_PORT", default="5432"),
        }
    }

# CORS settings for development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# CSRF settings for development
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default="https://localhost:3000",
    cast=lambda v: [s.strip() for s in v.split(",")],
)

# Logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

# Email backend for development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Session settings for development
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_SAMESITE = "Lax"

# CSRF cookie settings for development
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript access to read token
CSRF_USE_SESSIONS = True  # Use session-based CSRF tokens
CSRF_COOKIE_AGE = None  # Use session age
