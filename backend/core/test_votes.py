"""Tests for voting functionality."""

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Session, SessionParticipant, Story, Vote

User = get_user_model()


class VoteModelTestCase(TestCase):
    """Test cases for Vote model."""

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

        # Add participants
        SessionParticipant.objects.create(
            session=self.session,
            user=self.facilitator,
        )
        SessionParticipant.objects.create(
            session=self.session,
            user=self.participant,
        )

        self.story = Story.objects.create(
            session=self.session,
            title="Implement user authentication",
            description="Add login functionality",
            story_order=1,
            status="voting",
        )

    def test_vote_creation(self):
        """Test vote creation with valid Fibonacci points."""
        vote = Vote.objects.create(
            story=self.story,
            user=self.participant,
            points="5",
        )

        self.assertEqual(vote.story, self.story)
        self.assertEqual(vote.user, self.participant)
        self.assertEqual(vote.points, "5")
        self.assertIsNotNone(vote.created_at)
        self.assertIsNotNone(vote.id)

    def test_vote_fibonacci_points_choices(self):
        """Test that all Fibonacci points are valid."""
        valid_points = ["1", "2", "3", "5", "8", "13", "21", "?"]

        for points in valid_points:
            vote = Vote.objects.create(
                story=self.story,
                user=User.objects.create_user(
                    email=f"user_{points}@example.com",
                    password="testpass123",  # nosec B106
                ),
                points=points,
            )
            self.assertEqual(vote.points, points)

    def test_vote_str_representation(self):
        """Test Vote string representation."""
        vote = Vote.objects.create(
            story=self.story,
            user=self.participant,
            points="8",
        )

        expected = f"{self.participant.email} voted 8 for '{self.story.title}'"
        self.assertEqual(str(vote), expected)

    def test_vote_unique_per_story_user(self):
        """Test that users can only vote once per story."""
        # Create first vote
        Vote.objects.create(
            story=self.story,
            user=self.participant,
            points="5",
        )

        # Attempt to create duplicate vote should raise IntegrityError
        with self.assertRaises(IntegrityError):
            Vote.objects.create(
                story=self.story,
                user=self.participant,
                points="8",
            )

    def test_vote_cascade_delete_with_story(self):
        """Test that votes are deleted when story is deleted."""
        vote = Vote.objects.create(
            story=self.story,
            user=self.participant,
            points="5",
        )
        vote_id = vote.id

        # Delete the story
        self.story.delete()

        # Vote should also be deleted
        self.assertFalse(Vote.objects.filter(id=vote_id).exists())

    def test_multiple_users_vote_same_story(self):
        """Test that multiple users can vote on the same story."""
        user2 = User.objects.create_user(
            email="user2@example.com",
            password="testpass123",  # nosec B106
        )
        user3 = User.objects.create_user(
            email="user3@example.com",
            password="testpass123",  # nosec B106
        )

        vote1 = Vote.objects.create(story=self.story, user=self.participant, points="3")
        vote2 = Vote.objects.create(story=self.story, user=user2, points="5")
        vote3 = Vote.objects.create(story=self.story, user=user3, points="8")

        self.assertEqual(Vote.objects.filter(story=self.story).count(), 3)
        self.assertEqual(vote1.points, "3")
        self.assertEqual(vote2.points, "5")
        self.assertEqual(vote3.points, "8")


class VoteAPITestCase(APITestCase):
    """Test cases for Vote API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.facilitator = User.objects.create_user(
            email="facilitator@example.com",
            first_name="John",
            last_name="Doe",
            password="testpass123",  # nosec B106
        )

        self.participant1 = User.objects.create_user(
            email="participant1@example.com",
            first_name="Jane",
            last_name="Smith",
            password="testpass123",  # nosec B106
        )

        self.participant2 = User.objects.create_user(
            email="participant2@example.com",
            first_name="Bob",
            last_name="Johnson",
            password="testpass123",  # nosec B106
        )

        self.session = Session.objects.create(
            name="Test Session",
            facilitator=self.facilitator,
        )

        # Add participants
        SessionParticipant.objects.create(
            session=self.session,
            user=self.facilitator,
        )
        SessionParticipant.objects.create(
            session=self.session,
            user=self.participant1,
        )
        SessionParticipant.objects.create(
            session=self.session,
            user=self.participant2,
        )

        self.story = Story.objects.create(
            session=self.session,
            title="Implement user authentication",
            description="Add login functionality",
            story_order=1,
            status="voting",
        )

    def test_submit_vote_as_participant(self):
        """Test submitting a vote as a participant."""
        # Mock authentication
        self.client.force_authenticate(user=self.participant1)

        url = f"/api/stories/{self.story.id}/votes/"
        data = {"points": "5"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["points"], "5")
        self.assertEqual(response.data["story"], str(self.story.id))
        self.assertEqual(Vote.objects.filter(story=self.story).count(), 1)

    def test_submit_vote_unauthenticated(self):
        """Test that unauthenticated users cannot vote."""
        url = f"/api/stories/{self.story.id}/votes/"
        data = {"points": "5"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Vote.objects.count(), 0)

    def test_submit_vote_invalid_points(self):
        """Test submitting a vote with invalid points value."""
        self.client.force_authenticate(user=self.participant1)

        url = f"/api/stories/{self.story.id}/votes/"
        data = {"points": "invalid"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("points", response.data)

    def test_submit_vote_nonexistent_story(self):
        """Test submitting a vote for a non-existent story."""
        self.client.force_authenticate(user=self.participant1)

        url = "/api/stories/99999999-9999-9999-9999-999999999999/votes/"
        data = {"points": "5"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_vote_before_reveal(self):
        """Test that users can update their vote before reveal."""
        self.client.force_authenticate(user=self.participant1)

        # Submit initial vote
        url = f"/api/stories/{self.story.id}/votes/"
        data = {"points": "5"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Update vote
        data = {"points": "8"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["points"], "8")

        # Should still be only one vote in database
        self.assertEqual(
            Vote.objects.filter(story=self.story, user=self.participant1).count(), 1
        )

    def test_get_voting_status_before_reveal(self):
        """Test getting voting status before votes are revealed."""
        self.client.force_authenticate(user=self.participant1)

        # Participant 1 votes
        Vote.objects.create(story=self.story, user=self.participant1, points="5")
        # Participant 2 votes
        Vote.objects.create(story=self.story, user=self.participant2, points="8")

        url = f"/api/stories/{self.story.id}/votes/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["votes_count"], 2)
        self.assertEqual(
            response.data["total_participants"], 3
        )  # facilitator + 2 participants
        self.assertEqual(response.data["votes"], [])  # Votes hidden before reveal
        self.assertFalse(response.data.get("revealed", False))

    def test_get_voting_status_after_reveal(self):
        """Test getting voting results after votes are revealed."""
        self.client.force_authenticate(user=self.participant1)

        # Create votes
        Vote.objects.create(story=self.story, user=self.participant1, points="5")
        Vote.objects.create(story=self.story, user=self.participant2, points="8")

        # Mark story as completed (votes revealed)
        self.story.status = "completed"
        self.story.save()

        url = f"/api/stories/{self.story.id}/votes/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["votes_count"], 2)
        self.assertEqual(len(response.data["votes"]), 2)
        self.assertTrue(response.data.get("revealed", False))

        # Check vote details are included
        votes = response.data["votes"]
        points = [vote["points"] for vote in votes]
        self.assertIn("5", points)
        self.assertIn("8", points)

    def test_vote_not_participant_forbidden(self):
        """Test that non-participants cannot vote."""
        non_participant = User.objects.create_user(
            email="outsider@example.com",
            password="testpass123",  # nosec B106
        )
        self.client.force_authenticate(user=non_participant)

        url = f"/api/stories/{self.story.id}/votes/"
        data = {"points": "5"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_all_fibonacci_points_accepted(self):
        """Test that all Fibonacci points are accepted via API."""
        valid_points = ["1", "2", "3", "5", "8", "13", "21", "?"]

        for idx, points in enumerate(valid_points):
            user = User.objects.create_user(
                email=f"user{idx}@example.com",
                password="testpass123",  # nosec B106
            )
            SessionParticipant.objects.create(
                session=self.session,
                user=user,
            )
            self.client.force_authenticate(user=user)

            url = f"/api/stories/{self.story.id}/votes/"
            data = {"points": points}

            response = self.client.post(url, data, format="json")

            self.assertEqual(
                response.status_code,
                status.HTTP_201_CREATED,
                f"Failed for points: {points}",
            )
            self.assertEqual(response.data["points"], points)

    def test_voting_status_shows_who_voted(self):
        """Test that voting status indicates which participants have voted."""
        self.client.force_authenticate(user=self.participant1)

        # Only participant1 votes
        Vote.objects.create(story=self.story, user=self.participant1, points="5")

        url = f"/api/stories/{self.story.id}/votes/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["votes_count"], 1)
        self.assertEqual(response.data["total_participants"], 3)

        # Should show who has voted (but not their vote values before reveal)
        if "voted_users" in response.data:
            self.assertEqual(len(response.data["voted_users"]), 1)

    def test_vote_on_pending_story(self):
        """Test that users cannot vote on stories not in voting status."""
        self.client.force_authenticate(user=self.participant1)

        # Set story to pending (not voting)
        self.story.status = "pending"
        self.story.save()

        url = f"/api/stories/{self.story.id}/votes/"
        data = {"points": "5"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", str(response.data).lower())

    def test_vote_on_completed_story(self):
        """Test that users cannot vote on completed stories."""
        self.client.force_authenticate(user=self.participant1)

        # Set story to completed
        self.story.status = "completed"
        self.story.save()

        url = f"/api/stories/{self.story.id}/votes/"
        data = {"points": "5"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
