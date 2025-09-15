"""
URL patterns for the core application.
"""

from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.mock_login, name='mock_login'),
    path('auth/logout/', views.mock_logout, name='mock_logout'),
    path('auth/status/', views.auth_status, name='auth_status'),

    # Health check
    path('health/', views.health_check, name='health_check'),

    # API root
    path('', views.api_root, name='api_root'),
]