"""
Tests for session creation and join functionality.
Following TDD principles - these tests define the expected API behavior.
"""

from django.test import TestCase, Client
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import Session, SessionParticipant
import json
import uuid

User = get_user_model()


class SessionCreationTestCase(APITestCase):
    """Test cases for session creation functionality."""

    def setUp(self):
        """Set up test data."""
        self.client = Client()

        # Create test users
        self.facilitator = User.objects.create_user(
            email='facilitator@example.com',
            first_name='John',
            last_name='Doe',
            password='testpass123'
        )

        self.participant = User.objects.create_user(
            email='participant@example.com',
            first_name='Jane',
            last_name='Smith',
            password='testpass123'
        )

    def test_create_session_success(self):
        """Test successful session creation."""
        # Login as facilitator
        self.client.force_login(self.facilitator)

        session_data = {
            'name': 'Sprint Planning Session',
        }

        response = self.client.post(
            '/api/sessions/',
            data=json.dumps(session_data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('session_id', response.json())
        self.assertIn('name', response.json())
        self.assertIn('facilitator', response.json())
        self.assertIn('status', response.json())
        self.assertIn('created_at', response.json())

        # Verify session was created in database
        session_id = response.json()['session_id']
        session = Session.objects.get(id=session_id)
        self.assertEqual(session.name, 'Sprint Planning Session')
        self.assertEqual(session.facilitator, self.facilitator)
        self.assertEqual(session.status, 'active')

    def test_create_session_unauthenticated(self):
        """Test session creation without authentication fails."""
        session_data = {
            'name': 'Sprint Planning Session',
        }

        response = self.client.post(
            '/api/sessions/',
            data=json.dumps(session_data),
            content_type='application/json'
        )

        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_create_session_missing_name(self):
        """Test session creation with missing name fails."""
        self.client.force_login(self.facilitator)

        session_data = {}

        response = self.client.post(
            '/api/sessions/',
            data=json.dumps(session_data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Check for validation error (DRF format) or custom error message
        response_data = response.json()
        self.assertTrue('name' in response_data or 'error' in response_data)

    def test_create_session_empty_name(self):
        """Test session creation with empty name fails."""
        self.client.force_login(self.facilitator)

        session_data = {
            'name': '',
        }

        response = self.client.post(
            '/api/sessions/',
            data=json.dumps(session_data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Check for validation error (DRF format) or custom error message
        response_data = response.json()
        self.assertTrue('name' in response_data or 'error' in response_data)

    def test_create_session_long_name(self):
        """Test session creation with very long name."""
        self.client.force_login(self.facilitator)

        session_data = {
            'name': 'x' * 250,  # Longer than 200 char limit
        }

        response = self.client.post(
            '/api/sessions/',
            data=json.dumps(session_data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_facilitator_auto_joins_session(self):
        """Test that facilitator automatically joins their created session."""
        self.client.force_login(self.facilitator)

        session_data = {
            'name': 'Sprint Planning Session',
        }

        response = self.client.post(
            '/api/sessions/',
            data=json.dumps(session_data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify facilitator is automatically a participant
        session_id = response.json()['session_id']
        session = Session.objects.get(id=session_id)
        self.assertTrue(session.participants.filter(id=self.facilitator.id).exists())

        # Check SessionParticipant record
        participant_record = SessionParticipant.objects.get(
            session=session,
            user=self.facilitator
        )
        self.assertTrue(participant_record.is_active)


class SessionJoinTestCase(APITestCase):
    """Test cases for session join functionality."""

    def setUp(self):
        """Set up test data."""
        self.client = Client()

        # Create test users
        self.facilitator = User.objects.create_user(
            email='facilitator@example.com',
            first_name='John',
            last_name='Doe',
            password='testpass123'
        )

        self.participant1 = User.objects.create_user(
            email='participant1@example.com',
            first_name='Jane',
            last_name='Smith',
            password='testpass123'
        )

        self.participant2 = User.objects.create_user(
            email='participant2@example.com',
            first_name='Bob',
            last_name='Johnson',
            password='testpass123'
        )

        # Create test session
        self.session = Session.objects.create(
            name='Test Session',
            facilitator=self.facilitator
        )

        # Add facilitator as participant
        SessionParticipant.objects.create(
            session=self.session,
            user=self.facilitator
        )

    def test_join_session_success(self):
        """Test successful session join."""
        self.client.force_login(self.participant1)

        response = self.client.post(
            f'/api/sessions/{self.session.id}/join/',
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.json())
        self.assertIn('session', response.json())
        self.assertIn('user', response.json())

        # Verify user was added to session
        self.assertTrue(self.session.participants.filter(id=self.participant1.id).exists())

        # Check SessionParticipant record
        participant_record = SessionParticipant.objects.get(
            session=self.session,
            user=self.participant1
        )
        self.assertTrue(participant_record.is_active)

    def test_join_session_unauthenticated(self):
        """Test session join without authentication fails."""
        response = self.client.post(
            f'/api/sessions/{self.session.id}/join/',
            content_type='application/json'
        )

        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_join_nonexistent_session(self):
        """Test joining a session that doesn't exist."""
        self.client.force_login(self.participant1)

        fake_session_id = uuid.uuid4()
        response = self.client.post(
            f'/api/sessions/{fake_session_id}/join/',
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_join_session_twice(self):
        """Test that joining the same session twice is handled gracefully."""
        self.client.force_login(self.participant1)

        # Join session first time
        response1 = self.client.post(
            f'/api/sessions/{self.session.id}/join/',
            content_type='application/json'
        )
        self.assertEqual(response1.status_code, status.HTTP_200_OK)

        # Join session second time
        response2 = self.client.post(
            f'/api/sessions/{self.session.id}/join/',
            content_type='application/json'
        )
        # Should still succeed but indicate already joined
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertIn('already joined', response2.json()['message'].lower())

    def test_rejoin_inactive_participant(self):
        """Test rejoining a session where user was previously inactive."""
        # Create inactive participant record
        SessionParticipant.objects.create(
            session=self.session,
            user=self.participant1,
            is_active=False
        )

        self.client.force_login(self.participant1)

        response = self.client.post(
            f'/api/sessions/{self.session.id}/join/',
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify participant is now active
        participant_record = SessionParticipant.objects.get(
            session=self.session,
            user=self.participant1
        )
        self.assertTrue(participant_record.is_active)

    def test_join_completed_session(self):
        """Test that joining a completed session fails."""
        self.session.status = 'completed'
        self.session.save()

        self.client.force_login(self.participant1)

        response = self.client.post(
            f'/api/sessions/{self.session.id}/join/',
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('completed', response.json()['error'].lower())


class SessionRetrievalTestCase(APITestCase):
    """Test cases for session retrieval and listing."""

    def setUp(self):
        """Set up test data."""
        self.client = Client()

        self.facilitator = User.objects.create_user(
            email='facilitator@example.com',
            first_name='John',
            last_name='Doe',
            password='testpass123'
        )

        self.participant = User.objects.create_user(
            email='participant@example.com',
            first_name='Jane',
            last_name='Smith',
            password='testpass123'
        )

        # Create test sessions
        self.session1 = Session.objects.create(
            name='Session 1',
            facilitator=self.facilitator
        )

        self.session2 = Session.objects.create(
            name='Session 2',
            facilitator=self.facilitator,
            status='completed'
        )

        # Add facilitator as participant to sessions
        SessionParticipant.objects.create(
            session=self.session1,
            user=self.facilitator
        )
        SessionParticipant.objects.create(
            session=self.session2,
            user=self.facilitator
        )

    def test_get_session_details(self):
        """Test retrieving session details."""
        self.client.force_login(self.facilitator)

        response = self.client.get(f'/api/sessions/{self.session1.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['session_id'], str(self.session1.id))
        self.assertEqual(data['name'], 'Session 1')
        self.assertEqual(data['status'], 'active')
        self.assertIn('facilitator', data)
        self.assertIn('participants', data)
        self.assertIn('created_at', data)

    def test_get_session_unauthenticated(self):
        """Test retrieving session details without authentication."""
        response = self.client.get(f'/api/sessions/{self.session1.id}/')

        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_get_nonexistent_session(self):
        """Test retrieving a session that doesn't exist."""
        self.client.force_login(self.facilitator)

        fake_session_id = uuid.uuid4()
        response = self.client.get(f'/api/sessions/{fake_session_id}/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_user_sessions(self):
        """Test listing sessions for a user."""
        # Add participant to session1
        SessionParticipant.objects.create(
            session=self.session1,
            user=self.participant
        )

        self.client.force_login(self.participant)

        response = self.client.get('/api/sessions/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('sessions', data)

        # Should only see sessions the user participates in
        session_ids = [session['session_id'] for session in data['sessions']]
        self.assertIn(str(self.session1.id), session_ids)
        self.assertNotIn(str(self.session2.id), session_ids)

    def test_session_participants_list(self):
        """Test that session details include participant information."""
        # Add additional participant (facilitator already added in setUp)
        SessionParticipant.objects.create(session=self.session1, user=self.participant)

        self.client.force_login(self.facilitator)

        response = self.client.get(f'/api/sessions/{self.session1.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertIn('participants', data)
        self.assertEqual(len(data['participants']), 2)

        # Check participant data structure
        participant_emails = [p['email'] for p in data['participants']]
        self.assertIn('facilitator@example.com', participant_emails)
        self.assertIn('participant@example.com', participant_emails)

        # Check participant fields
        for participant in data['participants']:
            self.assertIn('name', participant)
            self.assertIn('email', participant)
            self.assertIn('joined_at', participant)
            self.assertIn('is_active', participant)


class SessionModelTestCase(TestCase):
    """Test cases for Session model functionality."""

    def setUp(self):
        """Set up test data."""
        self.facilitator = User.objects.create_user(
            email='facilitator@example.com',
            first_name='John',
            last_name='Doe',
            password='testpass123'
        )

    def test_session_creation(self):
        """Test basic session model creation."""
        session = Session.objects.create(
            name='Test Session',
            facilitator=self.facilitator
        )

        self.assertTrue(isinstance(session.id, uuid.UUID))
        self.assertEqual(session.name, 'Test Session')
        self.assertEqual(session.facilitator, self.facilitator)
        self.assertEqual(session.status, 'active')
        self.assertIsNotNone(session.created_at)
        self.assertIsNotNone(session.updated_at)

    def test_session_str_representation(self):
        """Test session string representation."""
        session = Session.objects.create(
            name='Test Session',
            facilitator=self.facilitator
        )

        expected = f"Test Session (Facilitator: {self.facilitator.email})"
        self.assertEqual(str(session), expected)

    def test_session_participant_relationship(self):
        """Test session-participant many-to-many relationship."""
        session = Session.objects.create(
            name='Test Session',
            facilitator=self.facilitator
        )

        participant = User.objects.create_user(
            email='participant@example.com',
            first_name='Jane',
            last_name='Smith',
            password='testpass123'
        )

        # Add participant through the through model
        SessionParticipant.objects.create(
            session=session,
            user=participant
        )

        self.assertTrue(session.participants.filter(id=participant.id).exists())
        self.assertTrue(participant.joined_sessions.filter(id=session.id).exists())

    def test_session_participant_unique_constraint(self):
        """Test that a user can't be added to the same session twice."""
        session = Session.objects.create(
            name='Test Session',
            facilitator=self.facilitator
        )

        participant = User.objects.create_user(
            email='participant@example.com',
            first_name='Jane',
            last_name='Smith',
            password='testpass123'
        )

        # Add participant first time
        SessionParticipant.objects.create(
            session=session,
            user=participant
        )

        # Try to add same participant again - should raise IntegrityError
        with self.assertRaises(Exception):
            SessionParticipant.objects.create(
                session=session,
                user=participant
            )