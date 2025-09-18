"""Views for the Censeo core application.
Includes mock authentication and basic API endpoints.
"""

from django.contrib.auth import login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import User


@api_view(["POST"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def mock_login(request):
    """Mock login endpoint for development.
    Creates a temporary user session with name and email.
    """
    name = request.data.get("name", "").strip()
    email = request.data.get("email", "").strip()

    if not name or not email:
        return Response(
            {"error": "Name and email are required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Try to get existing user or create new one
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": name.split(" ")[0],
                "last_name": " ".join(name.split(" ")[1:]) if " " in name else "",
                "is_active": True,
            },
        )

        # Update name if user exists
        if not created:
            user.first_name = name.split(" ")[0]
            user.last_name = " ".join(name.split(" ")[1:]) if " " in name else ""
            user.save()

        # Log the user in (creates session)
        login(request, user)

        return Response(
            {
                "user_id": str(user.id),
                "name": f"{user.first_name} {user.last_name}".strip(),
                "email": user.email,
                "session_token": request.session.session_key,
                "message": "Login successful",
            },
            status=status.HTTP_200_OK,
        )

    except Exception:
        return Response(
            {"error": "Login failed due to an internal error. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def mock_logout(request):
    """Mock logout endpoint.
    Clears the user session.
    """
    logout(request)
    return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)


@api_view(["GET"])
@ensure_csrf_cookie
def auth_status(request):
    """Check authentication status.
    Returns current user info if authenticated.
    """
    if request.user.is_authenticated:
        return Response(
            {
                "authenticated": True,
                "user_id": str(request.user.id),
                "name": f"{request.user.first_name} {request.user.last_name}".strip(),
                "email": request.user.email,
            },
            status=status.HTTP_200_OK,
        )
    else:
        return Response({"authenticated": False}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint for monitoring."""
    return Response(
        {"status": "healthy", "service": "censeo-backend", "version": "1.0.0"},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    """API root endpoint.
    Returns available endpoints for development.
    """
    return Response(
        {
            "message": "Censeo Story Pointing API",
            "version": "1.0.0",
            "endpoints": {
                "auth": {
                    "login": "/api/auth/login/",
                    "logout": "/api/auth/logout/",
                    "status": "/api/auth/status/",
                },
                "health": "/api/health/",
            },
        },
        status=status.HTTP_200_OK,
    )
