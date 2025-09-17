"""Tests for core models."""

import uuid

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from .models import Session, SessionParticipant, Story, Vote

User = get_user_model()


class UserManagerTestCase(TestCase):
    """Test cases for custom UserManager."""

    def test_create_user_success(self):
        """Test successful user creation."""
        user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )

        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.first_name, "Test")
        self.assertEqual(user.last_name, "User")
        self.assertTrue(user.check_password("testpass123"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_no_email(self):
        """Test that creating user without email raises error."""
        with self.assertRaises(ValueError) as cm:
            User.objects.create_user(email="", password="testpass123")

        self.assertIn("The Email field must be set", str(cm.exception))

    def test_create_user_none_email(self):
        """Test that creating user with None email raises error."""
        with self.assertRaises(ValueError) as cm:
            User.objects.create_user(email=None, password="testpass123")

        self.assertIn("The Email field must be set", str(cm.exception))

    def test_create_superuser_success(self):
        """Test successful superuser creation."""
        superuser = User.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123",
        )

        self.assertEqual(superuser.email, "admin@example.com")
        self.assertTrue(superuser.check_password("adminpass123"))
        self.assertTrue(superuser.is_active)
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)

    def test_create_superuser_invalid_is_staff(self):
        """Test that superuser creation fails if is_staff=False."""
        with self.assertRaises(ValueError) as cm:
            User.objects.create_superuser(
                email="admin@example.com",
                password="adminpass123",
                is_staff=False,
            )

        self.assertIn("Superuser must have is_staff=True", str(cm.exception))

    def test_create_superuser_invalid_is_superuser(self):
        """Test that superuser creation fails if is_superuser=False."""
        with self.assertRaises(ValueError) as cm:
            User.objects.create_superuser(
                email="admin@example.com",
                password="adminpass123",
                is_superuser=False,
            )

        self.assertIn("Superuser must have is_superuser=True", str(cm.exception))


class UserModelTestCase(TestCase):
    """Test cases for User model."""

    def test_user_str_with_full_name(self):
        """Test User string representation with first and last name."""
        user = User.objects.create_user(
            email="john.doe@example.com",
            first_name="John",
            last_name="Doe",
        )

        expected = "John Doe (john.doe@example.com)"
        self.assertEqual(str(user), expected)

    def test_user_str_with_first_name_only(self):
        """Test User string representation with first name only."""
        user = User.objects.create_user(
            email="john@example.com",
            first_name="John",
            last_name="",
        )

        expected = "John  (john@example.com)"
        self.assertEqual(str(user), expected)

    def test_user_str_email_only(self):
        """Test User string representation with email only."""
        user = User.objects.create_user(
            email="user@example.com",
            first_name="",
            last_name="",
        )

        expected = "user@example.com"
        self.assertEqual(str(user), expected)

    def test_user_str_no_first_name(self):
        """Test User string representation when first_name is None/empty."""
        user = User.objects.create_user(email="test@example.com")
        # first_name defaults to empty string

        expected = "test@example.com"
        self.assertEqual(str(user), expected)


class SessionParticipantModelTestCase(TestCase):
    """Test cases for SessionParticipant model."""

    def setUp(self):
        """Set up test data."""
        self.facilitator = User.objects.create_user(
            email="facilitator@example.com",
            first_name="John",
            last_name="Doe",
        )

        self.participant = User.objects.create_user(
            email="participant@example.com",
            first_name="Jane",
            last_name="Smith",
        )

        self.session = Session.objects.create(
            name="Test Session",
            facilitator=self.facilitator,
        )

    def test_session_participant_str(self):
        """Test SessionParticipant string representation."""
        participant_record = SessionParticipant.objects.create(
            session=self.session,
            user=self.participant,
        )

        expected = "participant@example.com in Test Session"
        self.assertEqual(str(participant_record), expected)

    def test_session_participant_unique_constraint(self):
        """Test that SessionParticipant enforces unique constraint."""
        # Create first participant record
        SessionParticipant.objects.create(
            session=self.session,
            user=self.participant,
        )

        # Try to create duplicate - should raise IntegrityError
        with self.assertRaises(IntegrityError):
            SessionParticipant.objects.create(
                session=self.session,
                user=self.participant,
            )


class StoryModelTestCase(TestCase):
    """Test cases for Story model."""

    def setUp(self):
        """Set up test data."""
        self.facilitator = User.objects.create_user(
            email="facilitator@example.com",
            first_name="John",
            last_name="Doe",
        )

        self.session = Session.objects.create(
            name="Test Session",
            facilitator=self.facilitator,
        )

    def test_story_str(self):
        """Test Story string representation."""
        story = Story.objects.create(
            session=self.session,
            title="As a user, I want to login",
            description="Login functionality for the application",
            story_order=1,
        )

        expected = "As a user, I want to login (Session: Test Session)"
        self.assertEqual(str(story), expected)

    def test_story_unique_order_per_session(self):
        """Test that stories have unique order within a session."""
        # Create first story
        Story.objects.create(
            session=self.session,
            title="Story 1",
            story_order=1,
        )

        # Try to create another story with same order - should raise IntegrityError
        with self.assertRaises(IntegrityError):
            Story.objects.create(
                session=self.session,
                title="Story 2",
                story_order=1,
            )


class VoteModelTestCase(TestCase):
    """Test cases for Vote model."""

    def setUp(self):
        """Set up test data."""
        self.facilitator = User.objects.create_user(
            email="facilitator@example.com",
            first_name="John",
            last_name="Doe",
        )

        self.voter = User.objects.create_user(
            email="voter@example.com",
            first_name="Jane",
            last_name="Smith",
        )

        self.session = Session.objects.create(
            name="Test Session",
            facilitator=self.facilitator,
        )

        self.story = Story.objects.create(
            session=self.session,
            title="User Login Story",
            story_order=1,
        )

    def test_vote_str(self):
        """Test Vote string representation."""
        vote = Vote.objects.create(
            story=self.story,
            user=self.voter,
            points="5",
        )

        expected = "voter@example.com voted 5 for 'User Login Story'"
        self.assertEqual(str(vote), expected)

    def test_vote_unique_per_story_user(self):
        """Test that each user can only vote once per story."""
        # Create first vote
        Vote.objects.create(
            story=self.story,
            user=self.voter,
            points="3",
        )

        # Try to create another vote from same user for same story
        with self.assertRaises(IntegrityError):
            Vote.objects.create(
                story=self.story,
                user=self.voter,
                points="5",
            )

    def test_vote_fibonacci_points_choices(self):
        """Test that all Fibonacci point choices work."""
        valid_choices = ["1", "2", "3", "5", "8", "13", "21", "?"]

        for i, points in enumerate(valid_choices):
            # Create a new story for each vote to avoid unique constraint
            # Start from story_order=1 since the setUp creates a story with order=1
            story = Story.objects.create(
                session=self.session,
                title=f"Story {i+2}",
                story_order=i + 2,  # Start from 2 to avoid conflict with setUp
            )

            vote = Vote.objects.create(
                story=story,
                user=self.voter,
                points=points,
            )

            self.assertEqual(vote.points, points)