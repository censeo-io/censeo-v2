"""API views for session management.
Handles session creation, joining, and retrieval operations.
"""

from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Session, SessionParticipant, Story
from .serializers import (
    SessionCreateSerializer,
    SessionParticipantSerializer,
    SessionSerializer,
    StoryCreateSerializer,
    StorySerializer,
)

# Error message constants
INVALID_SESSION_ID_ERROR = "Invalid session ID format."

User = get_user_model()


class SessionListCreateView(generics.ListCreateAPIView):
    """List user's sessions or create a new session.
    GET: List sessions where user is a participant
    POST: Create a new session with current user as facilitator
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SessionCreateSerializer
        return SessionSerializer

    def get_queryset(self):
        """Return sessions where the user is a participant."""
        user = self.request.user
        return (
            Session.objects.filter(participants=user).distinct().order_by("-created_at")
        )

    def list(self, request, *args, **kwargs):
        """List sessions for the authenticated user."""
        queryset = self.get_queryset()
        serializer = SessionSerializer(queryset, many=True)
        return Response({"sessions": serializer.data, "count": len(serializer.data)})

    def create(self, request, *args, **kwargs):
        """Create a new session."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            session = serializer.save()

        response_serializer = SessionSerializer(session)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class SessionDetailView(generics.RetrieveAPIView):
    """Retrieve session details.
    GET: Get session information including participants
    """

    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        """Return sessions where the user is a participant."""
        user = self.request.user
        return Session.objects.filter(participants=user).distinct()

    def retrieve(self, request, *args, **kwargs):
        """Retrieve session details."""
        try:
            session = self.get_object()
            serializer = self.get_serializer(session)
            return Response(serializer.data)
        except Session.DoesNotExist:
            return Response(
                {"error": "Session not found or you do not have access to it."},
                status=status.HTTP_404_NOT_FOUND,
            )


class SessionJoinView(APIView):
    """Join a session.
    POST: Add current user as participant to the session
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        """Join a session."""
        try:
            session = get_object_or_404(Session, id=session_id)
        except ValueError:
            return Response(
                {"error": INVALID_SESSION_ID_ERROR},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        # Check if session is still active
        if session.status == "completed":
            return Response(
                {"error": "Cannot join a completed session."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Check if user is already a participant
            participant, created = SessionParticipant.objects.get_or_create(
                session=session, user=user, defaults={"is_active": True}
            )

            if not created:
                if participant.is_active:
                    message = "You have already joined this session."
                else:
                    # Reactivate inactive participant
                    participant.is_active = True
                    participant.save()
                    message = "Welcome back! You have rejoined the session."
            else:
                message = f"Successfully joined session '{session.name}'."

        # Return session details with updated participant list
        session_serializer = SessionSerializer(session)
        user_serializer = SessionParticipantSerializer(participant)

        return Response(
            {
                "message": message,
                "session": session_serializer.data,
                "user": user_serializer.data,
            }
        )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def session_participants(request, session_id):
    """Get list of session participants."""
    try:
        session = get_object_or_404(Session, id=session_id)
    except ValueError:
        return Response(
            {"error": INVALID_SESSION_ID_ERROR}, status=status.HTTP_400_BAD_REQUEST
        )

    # Check if user has access to this session
    if not session.participants.filter(id=request.user.id).exists():
        return Response(
            {"error": "You do not have access to this session."},
            status=status.HTTP_403_FORBIDDEN,
        )

    participants = (
        SessionParticipant.objects.filter(session=session, is_active=True)
        .select_related("user")
        .order_by("joined_at")
    )

    serializer = SessionParticipantSerializer(participants, many=True)

    return Response(
        {
            "session_id": str(session.id),
            "session_name": session.name,
            "participants": serializer.data,
            "count": len(serializer.data),
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def leave_session(request, session_id):
    """Leave a session (mark participant as inactive)."""
    try:
        session = get_object_or_404(Session, id=session_id)
    except ValueError:
        return Response(
            {"error": INVALID_SESSION_ID_ERROR}, status=status.HTTP_400_BAD_REQUEST
        )

    user = request.user

    # Check if user is a participant
    try:
        participant = SessionParticipant.objects.get(session=session, user=user)
    except SessionParticipant.DoesNotExist:
        return Response(
            {"error": "You are not a participant in this session."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Don't allow facilitator to leave their own session
    if session.facilitator == user:
        return Response(
            {"error": "Facilitators cannot leave their own sessions."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Mark participant as inactive
    participant.is_active = False
    participant.save()

    return Response(
        {
            "message": f"You have left the session '{session.name}'.",
            "session_id": str(session.id),
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def update_session_status(request, session_id):
    """Update session status (facilitator only)."""
    try:
        session = get_object_or_404(Session, id=session_id)
    except ValueError:
        return Response(
            {"error": INVALID_SESSION_ID_ERROR}, status=status.HTTP_400_BAD_REQUEST
        )

    user = request.user

    # Only facilitator can update session status
    if session.facilitator != user:
        return Response(
            {"error": "Only the session facilitator can update session status."},
            status=status.HTTP_403_FORBIDDEN,
        )

    new_status = request.data.get("status")
    if new_status not in dict(Session.STATUS_CHOICES):
        return Response(
            {"error": "Invalid status. Valid options: active, completed, paused"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    session.status = new_status
    session.save()

    serializer = SessionSerializer(session)
    return Response(
        {
            "message": f"Session status updated to '{new_status}'.",
            "session": serializer.data,
        }
    )


class StoryListCreateView(generics.ListCreateAPIView):
    """List stories in a session or create a new story.
    GET: List stories for session participants
    POST: Create a new story (facilitator only)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return StoryCreateSerializer
        return StorySerializer

    def get_session(self):
        """Get the session and check user permissions."""
        try:
            session = get_object_or_404(Session, id=self.kwargs["session_id"])
        except ValueError:
            return None
        return session

    def get_queryset(self):
        """Return stories for the session if user is a participant."""
        session = self.get_session()
        if not session:
            return Story.objects.none()

        # Check if user is a participant
        if not session.participants.filter(id=self.request.user.id).exists():
            return Story.objects.none()

        return Story.objects.filter(session=session).order_by("story_order", "created_at")

    def list(self, request, *args, **kwargs):
        """List stories in a session."""
        session = self.get_session()
        if not session:
            return Response(
                {"error": INVALID_SESSION_ID_ERROR},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user has access to this session
        if not session.participants.filter(id=request.user.id).exists():
            return Response(
                {"error": "You do not have access to this session."},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create a new story (facilitator only)."""
        session = self.get_session()
        if not session:
            return Response(
                {"error": INVALID_SESSION_ID_ERROR},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Only facilitator can create stories
        if session.facilitator != request.user:
            return Response(
                {"error": "Only the session facilitator can create stories."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            story = serializer.save(session=session)

        response_serializer = StorySerializer(story)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class StoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific story.
    GET: Get story details (participants)
    PUT: Update story (facilitator only)
    DELETE: Delete story (facilitator only)
    """

    serializer_class = StorySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_session(self):
        """Get the session and check user permissions."""
        try:
            session = get_object_or_404(Session, id=self.kwargs["session_id"])
        except ValueError:
            return None
        return session

    def get_queryset(self):
        """Return stories for the session if user is a participant."""
        session = self.get_session()
        if not session:
            return Story.objects.none()

        # Check if user is a participant
        if not session.participants.filter(id=self.request.user.id).exists():
            return Story.objects.none()

        return Story.objects.filter(session=session)

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return StoryCreateSerializer
        return StorySerializer

    def retrieve(self, request, *args, **kwargs):
        """Retrieve story details."""
        session = self.get_session()
        if not session:
            return Response(
                {"error": INVALID_SESSION_ID_ERROR},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user has access to this session
        if not session.participants.filter(id=request.user.id).exists():
            return Response(
                {"error": "You do not have access to this session."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            story = self.get_object()
            serializer = self.get_serializer(story)
            return Response(serializer.data)
        except Story.DoesNotExist:
            return Response(
                {"error": "Story not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

    def update(self, request, *args, **kwargs):
        """Update a story (facilitator only)."""
        session = self.get_session()
        if not session:
            return Response(
                {"error": INVALID_SESSION_ID_ERROR},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Only facilitator can update stories
        if session.facilitator != request.user:
            return Response(
                {"error": "Only the session facilitator can update stories."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            story = self.get_object()
        except Story.DoesNotExist:
            return Response(
                {"error": "Story not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(story, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response_serializer = StorySerializer(story)
        return Response(response_serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Delete a story (facilitator only)."""
        session = self.get_session()
        if not session:
            return Response(
                {"error": INVALID_SESSION_ID_ERROR},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Only facilitator can delete stories
        if session.facilitator != request.user:
            return Response(
                {"error": "Only the session facilitator can delete stories."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            story = self.get_object()
            story.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Story.DoesNotExist:
            return Response(
                {"error": "Story not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
