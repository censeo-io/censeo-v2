"""URL patterns for the core application."""

from django.urls import path

from . import api_views, views

app_name = "core"

urlpatterns = [
    # Authentication endpoints
    path("auth/login/", views.mock_login, name="mock_login"),
    path("auth/logout/", views.mock_logout, name="mock_logout"),
    path("auth/status/", views.auth_status, name="auth_status"),
    # Session management endpoints
    path(
        "sessions/",
        api_views.SessionListCreateView.as_view(),
        name="session_list_create",
    ),
    path(
        "sessions/<uuid:id>/",
        api_views.SessionDetailView.as_view(),
        name="session_detail",
    ),
    path(
        "sessions/<uuid:session_id>/join/",
        api_views.SessionJoinView.as_view(),
        name="session_join",
    ),
    path(
        "sessions/<uuid:session_id>/leave/",
        api_views.leave_session,
        name="session_leave",
    ),
    path(
        "sessions/<uuid:session_id>/participants/",
        api_views.session_participants,
        name="session_participants",
    ),
    path(
        "sessions/<uuid:session_id>/status/",
        api_views.update_session_status,
        name="session_status",
    ),
    # Story management endpoints
    path(
        "sessions/<uuid:session_id>/stories/",
        api_views.StoryListCreateView.as_view(),
        name="story_list_create",
    ),
    path(
        "sessions/<uuid:session_id>/stories/<uuid:id>/",
        api_views.StoryDetailView.as_view(),
        name="story_detail",
    ),
    # Health check
    path("health/", views.health_check, name="health_check"),
    # API root
    path("", views.api_root, name="api_root"),
]
