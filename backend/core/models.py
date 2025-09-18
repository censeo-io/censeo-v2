"""Core models for the Censeo story pointing application."""

import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom User model for temporary authentication.
    Extends Django's AbstractUser to add story pointing specific fields.
    """

    # Remove username requirement and use email as the primary identifier
    username = None
    email = models.EmailField(unique=True)

    # Story pointing specific fields
    created_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return (
            f"{self.first_name} {self.last_name} ({self.email})"
            if self.first_name
            else self.email
        )


class Session(models.Model):
    """Story pointing session model.
    Represents a planning poker session where teams estimate stories.
    """

    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("paused", "Paused"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    facilitator = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="facilitated_sessions"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Participants many-to-many relationship
    participants = models.ManyToManyField(
        User, through="SessionParticipant", related_name="joined_sessions"
    )

    class Meta:
        db_table = "sessions"
        verbose_name = "Session"
        verbose_name_plural = "Sessions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} (Facilitator: {self.facilitator.email})"


class SessionParticipant(models.Model):
    """Through model for Session-User many-to-many relationship.
    Tracks when users join sessions and their participation status.
    """

    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)  # For handling disconnections

    class Meta:
        db_table = "session_participants"
        unique_together = ["session", "user"]
        verbose_name = "Session Participant"
        verbose_name_plural = "Session Participants"

    def __str__(self):
        return f"{self.user.email} in {self.session.name}"


class Story(models.Model):
    """User story model for estimation.
    Represents individual stories that teams estimate in pointing sessions.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("voting", "Voting"),
        ("completed", "Completed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        Session, on_delete=models.CASCADE, related_name="stories"
    )
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    story_order = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "stories"
        verbose_name = "Story"
        verbose_name_plural = "Stories"
        ordering = ["story_order", "created_at"]
        unique_together = ["session", "story_order"]

    def __str__(self):
        return f"{self.title} (Session: {self.session.name})"


class Vote(models.Model):
    """Vote model for story point estimations.
    Represents individual votes cast by users for specific stories.
    """

    # Fibonacci scale points for story estimation
    POINTS_CHOICES = [
        ("1", "1"),
        ("2", "2"),
        ("3", "3"),
        ("5", "5"),
        ("8", "8"),
        ("13", "13"),
        ("21", "21"),
        ("?", "? (Unknown)"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="votes")
    points = models.CharField(max_length=10, choices=POINTS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "votes"
        verbose_name = "Vote"
        verbose_name_plural = "Votes"
        unique_together = ["story", "user"]  # One vote per user per story
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} voted {self.points} for '{self.story.title}'"
