"""Tests for story management functionality."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Session, SessionParticipant, Story

User = get_user_model()


class StoryModelTestCase(TestCase):
    """Test cases for Story model."""

    def setUp(self):
        """Set up test data."""
        self.facilitator = User.objects.create_user(
            email="facilitator@example.com",
            first_name="John",
            last_name="Doe",
            password="testpass123",  # nosec B106
        )

        self.session = Session.objects.create(
            name="Test Session",
            facilitator=self.facilitator,
        )

    def test_story_creation(self):
        """Test story creation with all fields."""
        story = Story.objects.create(
            session=self.session,
            title="As a user, I want to login",
            description="Implement user authentication functionality",
            story_order=1,
            status="pending",
        )

        self.assertEqual(story.session, self.session)
        self.assertEqual(story.title, "As a user, I want to login")
        self.assertEqual(story.description, "Implement user authentication functionality")
        self.assertEqual(story.story_order, 1)
        self.assertEqual(story.status, "pending")
        self.assertIsNotNone(story.created_at)
        self.assertIsNotNone(story.id)

    def test_story_creation_minimal_fields(self):
        """Test story creation with minimal required fields."""
        story = Story.objects.create(
            session=self.session,
            title="Simple story",
        )

        self.assertEqual(story.session, self.session)
        self.assertEqual(story.title, "Simple story")
        self.assertEqual(story.description, "")  # Default empty
        self.assertEqual(story.story_order, 0)  # Default value
        self.assertEqual(story.status, "pending")  # Default value

    def test_story_str_representation(self):
        """Test Story string representation."""
        story = Story.objects.create(
            session=self.session,
            title="User login story",
        )

        expected = "User login story (Session: Test Session)"
        self.assertEqual(str(story), expected)

    def test_story_ordering(self):
        """Test that stories are ordered by story_order then created_at."""
        story1 = Story.objects.create(
            session=self.session,
            title="Story 1",
            story_order=3,
        )
        story2 = Story.objects.create(
            session=self.session,
            title="Story 2",
            story_order=1,
        )
        story3 = Story.objects.create(
            session=self.session,
            title="Story 3",
            story_order=2,
        )

        stories = list(Story.objects.all())
        # Should be ordered by story_order first, then created_at
        self.assertEqual(stories[0], story2)  # story_order=1
        self.assertEqual(stories[1], story3)  # story_order=2
        self.assertEqual(stories[2], story1)  # story_order=3

    def test_story_unique_order_per_session(self):
        """Test that story_order is unique per session."""
        # Create first story
        Story.objects.create(
            session=self.session,
            title="Story 1",
            story_order=1,
        )

        # Create another session
        other_session = Session.objects.create(
            name="Other Session",
            facilitator=self.facilitator,
        )

        # Same story_order in different session should be allowed
        story_other = Story.objects.create(
            session=other_session,
            title="Story in other session",
            story_order=1,
        )
        self.assertEqual(story_other.story_order, 1)

    def test_story_status_choices(self):
        """Test all valid status choices."""
        valid_statuses = ["pending", "voting", "completed"]

        for i, status_value in enumerate(valid_statuses):
            story = Story.objects.create(
                session=self.session,
                title=f"Story with {status_value} status",
                status=status_value,
                story_order=i + 1,  # Ensure unique story_order
            )
            self.assertEqual(story.status, status_value)

    def test_story_cascade_delete_with_session(self):
        """Test that stories are deleted when session is deleted."""
        story = Story.objects.create(
            session=self.session,
            title="Test story",
        )
        story_id = story.id

        # Delete session
        self.session.delete()

        # Story should be deleted too
        self.assertFalse(Story.objects.filter(id=story_id).exists())


class StoryAPITestCase(APITestCase):
    """Test cases for Story API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.facilitator = User.objects.create_user(
            email="facilitator@example.com",
            first_name="John",
            last_name="Doe",
            password="testpass123",  # nosec B106
        )

        self.participant = User.objects.create_user(
            email="participant@example.com",
            first_name="Jane",
            last_name="Smith",
            password="testpass123",  # nosec B106
        )

        self.session = Session.objects.create(
            name="Test Session",
            facilitator=self.facilitator,
        )

        # Add facilitator as participant
        SessionParticipant.objects.create(
            session=self.session,
            user=self.facilitator,
        )

    def test_create_story_as_facilitator(self):
        """Test creating a story as session facilitator."""
        self.client.force_login(self.facilitator)

        story_data = {
            "title": "As a user, I want to login",
            "description": "Implement authentication system",
            "story_order": 1,
        }

        response = self.client.post(
            f"/api/sessions/{self.session.id}/stories/",
            data=story_data,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()

        self.assertEqual(data["title"], story_data["title"])
        self.assertEqual(data["description"], story_data["description"])
        self.assertEqual(data["story_order"], story_data["story_order"])
        self.assertEqual(data["status"], "pending")  # Default status
        self.assertEqual(data["session"], str(self.session.id))

        # Verify story was created in database
        story = Story.objects.get(id=data["id"])
        self.assertEqual(story.title, story_data["title"])
        self.assertEqual(story.session, self.session)

    def test_create_story_as_participant_forbidden(self):
        """Test that participants cannot create stories."""
        # Add participant to session
        SessionParticipant.objects.create(
            session=self.session,
            user=self.participant,
        )
        self.client.force_login(self.participant)

        story_data = {
            "title": "As a user, I want to login",
            "description": "Implement authentication system",
            "story_order": 1,
        }

        response = self.client.post(
            f"/api/sessions/{self.session.id}/stories/",
            data=story_data,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_story_unauthenticated(self):
        """Test that unauthenticated users cannot create stories."""
        story_data = {
            "title": "As a user, I want to login",
            "description": "Implement authentication system",
            "story_order": 1,
        }

        response = self.client.post(
            f"/api/sessions/{self.session.id}/stories/",
            data=story_data,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_stories_in_session(self):
        """Test listing stories in a session."""
        # Create some stories
        story1 = Story.objects.create(
            session=self.session,
            title="Story 1",
            story_order=1,
        )
        story2 = Story.objects.create(
            session=self.session,
            title="Story 2",
            story_order=2,
        )

        # Add participant to session
        SessionParticipant.objects.create(
            session=self.session,
            user=self.participant,
        )
        self.client.force_login(self.participant)

        response = self.client.get(f"/api/sessions/{self.session.id}/stories/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data), 2)
        # Stories should be ordered by story_order
        self.assertEqual(data[0]["title"], "Story 1")
        self.assertEqual(data[1]["title"], "Story 2")
        self.assertEqual(data[0]["id"], str(story1.id))
        self.assertEqual(data[1]["id"], str(story2.id))

    def test_list_stories_not_participant(self):
        """Test that non-participants cannot list stories."""
        Story.objects.create(
            session=self.session,
            title="Story 1",
            story_order=1,
        )

        self.client.force_login(self.participant)

        response = self.client.get(f"/api/sessions/{self.session.id}/stories/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_story_detail(self):
        """Test retrieving a specific story."""
        story = Story.objects.create(
            session=self.session,
            title="Test story",
            description="Test description",
            story_order=1,
            status="voting",
        )

        # Add participant to session
        SessionParticipant.objects.create(
            session=self.session,
            user=self.participant,
        )
        self.client.force_login(self.participant)

        response = self.client.get(f"/api/sessions/{self.session.id}/stories/{story.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data["id"], str(story.id))
        self.assertEqual(data["title"], "Test story")
        self.assertEqual(data["description"], "Test description")
        self.assertEqual(data["story_order"], 1)
        self.assertEqual(data["status"], "voting")

    def test_update_story_as_facilitator(self):
        """Test updating a story as facilitator."""
        story = Story.objects.create(
            session=self.session,
            title="Original title",
            description="Original description",
            story_order=1,
        )

        self.client.force_login(self.facilitator)

        update_data = {
            "title": "Updated title",
            "description": "Updated description",
            "story_order": 2,
            "status": "voting",
        }

        response = self.client.put(
            f"/api/sessions/{self.session.id}/stories/{story.id}/",
            data=update_data,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data["title"], "Updated title")
        self.assertEqual(data["description"], "Updated description")
        self.assertEqual(data["story_order"], 2)
        self.assertEqual(data["status"], "voting")

        # Verify update in database
        story.refresh_from_db()
        self.assertEqual(story.title, "Updated title")
        self.assertEqual(story.status, "voting")

    def test_update_story_as_participant_forbidden(self):
        """Test that participants cannot update stories."""
        story = Story.objects.create(
            session=self.session,
            title="Original title",
            story_order=1,
        )

        # Add participant to session
        SessionParticipant.objects.create(
            session=self.session,
            user=self.participant,
        )
        self.client.force_login(self.participant)

        update_data = {
            "title": "Updated title",
            "status": "voting",
        }

        response = self.client.put(
            f"/api/sessions/{self.session.id}/stories/{story.id}/",
            data=update_data,
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_story_as_facilitator(self):
        """Test deleting a story as facilitator."""
        story = Story.objects.create(
            session=self.session,
            title="Story to delete",
            story_order=1,
        )
        story_id = story.id

        self.client.force_login(self.facilitator)

        response = self.client.delete(f"/api/sessions/{self.session.id}/stories/{story.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify story was deleted
        self.assertFalse(Story.objects.filter(id=story_id).exists())

    def test_delete_story_as_participant_forbidden(self):
        """Test that participants cannot delete stories."""
        story = Story.objects.create(
            session=self.session,
            title="Story to delete",
            story_order=1,
        )

        # Add participant to session
        SessionParticipant.objects.create(
            session=self.session,
            user=self.participant,
        )
        self.client.force_login(self.participant)

        response = self.client.delete(f"/api/sessions/{self.session.id}/stories/{story.id}/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Verify story still exists
        self.assertTrue(Story.objects.filter(id=story.id).exists())

    def test_story_validation_errors(self):
        """Test story creation with invalid data."""
        self.client.force_login(self.facilitator)

        # Test missing title
        response = self.client.post(
            f"/api/sessions/{self.session.id}/stories/",
            data={"description": "Missing title"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test title too long
        response = self.client.post(
            f"/api/sessions/{self.session.id}/stories/",
            data={"title": "x" * 501},  # Exceeds 500 char limit
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test invalid status
        response = self.client.post(
            f"/api/sessions/{self.session.id}/stories/",
            data={"title": "Valid title", "status": "invalid_status"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_story_operations_invalid_session(self):
        """Test story operations with invalid session ID."""
        self.client.force_login(self.facilitator)

        # Test with invalid UUID format
        response = self.client.get("/api/sessions/invalid-uuid/stories/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Test with non-existent session
        response = self.client.get("/api/sessions/00000000-0000-0000-0000-000000000000/stories/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)