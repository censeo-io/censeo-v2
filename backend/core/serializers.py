"""Serializers for the Censeo core application.
Handles serialization of models for API responses.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Session, SessionParticipant, Story, Vote

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""

    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "name",
            "first_name",
            "last_name",
            "created_at",
            "last_active",
        ]
        read_only_fields = ["id", "created_at", "last_active"]

    def get_name(self, obj):
        """Get full name of user."""
        return f"{obj.first_name} {obj.last_name}".strip()


class SessionParticipantSerializer(serializers.ModelSerializer):
    """Serializer for SessionParticipant model."""

    name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = SessionParticipant
        fields = ["name", "email", "joined_at", "is_active"]


class SessionSerializer(serializers.ModelSerializer):
    """Serializer for Session model."""

    session_id = serializers.UUIDField(source="id", read_only=True)
    facilitator = UserSerializer(read_only=True)
    participants = SessionParticipantSerializer(
        source="sessionparticipant_set", many=True, read_only=True
    )
    participant_count = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            "session_id",
            "name",
            "facilitator",
            "status",
            "participants",
            "participant_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["session_id", "facilitator", "created_at", "updated_at"]

    def get_participant_count(self, obj):
        """Get count of active participants."""
        return obj.sessionparticipant_set.filter(is_active=True).count()

    def validate_name(self, value):
        """Validate session name."""
        if not value or not value.strip():
            raise serializers.ValidationError("Session name cannot be empty.")

        if len(value.strip()) > 200:
            raise serializers.ValidationError(
                "Session name cannot exceed 200 characters."
            )

        return value.strip()


class SessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new sessions."""

    class Meta:
        model = Session
        fields = ["name"]

    def validate_name(self, value):
        """Validate session name."""
        if not value or not value.strip():
            raise serializers.ValidationError("Session name cannot be empty.")

        if len(value.strip()) > 200:
            raise serializers.ValidationError(
                "Session name cannot exceed 200 characters."
            )

        return value.strip()

    def create(self, validated_data):
        """Create a new session with the current user as facilitator."""
        user = self.context["request"].user
        session = Session.objects.create(facilitator=user, **validated_data)

        # Automatically add facilitator as participant
        SessionParticipant.objects.create(session=session, user=user, is_active=True)

        return session


class StorySerializer(serializers.ModelSerializer):
    """Serializer for Story model."""

    story_id = serializers.UUIDField(source="id", read_only=True)

    class Meta:
        model = Story
        fields = [
            "story_id",
            "title",
            "description",
            "story_order",
            "status",
            "created_at",
        ]
        read_only_fields = ["story_id", "created_at"]


class VoteSerializer(serializers.ModelSerializer):
    """Serializer for Vote model."""

    vote_id = serializers.UUIDField(source="id", read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Vote
        fields = ["vote_id", "user", "points", "created_at"]
        read_only_fields = ["vote_id", "user", "created_at"]
