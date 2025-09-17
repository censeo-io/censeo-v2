"""Tests for core views (authentication and utility endpoints)."""

import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class MockAuthenticationTestCase(APITestCase):
    """Test cases for mock authentication endpoints."""

    def setUp(self):
        """Set up test data."""
        self.client = Client()

    def test_mock_login_success(self):
        """Test successful mock login with new user."""
        login_data = {
            "name": "John Doe",
            "email": "john.doe@example.com",
        }

        response = self.client.post(
            "/api/auth/login/",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertIn("user_id", data)
        self.assertIn("name", data)
        self.assertIn("email", data)
        self.assertIn("session_token", data)
        self.assertIn("message", data)

        self.assertEqual(data["name"], "John Doe")
        self.assertEqual(data["email"], "john.doe@example.com")
        self.assertEqual(data["message"], "Login successful")

        # Verify user was created
        user = User.objects.get(email="john.doe@example.com")
        self.assertEqual(user.first_name, "John")
        self.assertEqual(user.last_name, "Doe")
        self.assertTrue(user.is_active)

    def test_mock_login_existing_user(self):
        """Test mock login with existing user updates name."""
        # Create existing user
        existing_user = User.objects.create_user(
            email="jane.smith@example.com",
            first_name="Jane",
            last_name="Smith",
        )

        login_data = {
            "name": "Jane Updated Smith",
            "email": "jane.smith@example.com",
        }

        response = self.client.post(
            "/api/auth/login/",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data["name"], "Jane Updated Smith")
        self.assertEqual(data["email"], "jane.smith@example.com")

        # Verify user name was updated
        existing_user.refresh_from_db()
        self.assertEqual(existing_user.first_name, "Jane")
        self.assertEqual(existing_user.last_name, "Updated Smith")

    def test_mock_login_single_name(self):
        """Test mock login with single name (no last name)."""
        login_data = {
            "name": "Madonna",
            "email": "madonna@example.com",
        }

        response = self.client.post(
            "/api/auth/login/",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify user was created with empty last name
        user = User.objects.get(email="madonna@example.com")
        self.assertEqual(user.first_name, "Madonna")
        self.assertEqual(user.last_name, "")

    def test_mock_login_missing_name(self):
        """Test mock login fails with missing name."""
        login_data = {
            "email": "test@example.com",
        }

        response = self.client.post(
            "/api/auth/login/",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("error", data)
        self.assertIn("Name and email are required", data["error"])

    def test_mock_login_missing_email(self):
        """Test mock login fails with missing email."""
        login_data = {
            "name": "John Doe",
        }

        response = self.client.post(
            "/api/auth/login/",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("error", data)
        self.assertIn("Name and email are required", data["error"])

    def test_mock_login_empty_name(self):
        """Test mock login fails with empty name."""
        login_data = {
            "name": "   ",  # Whitespace only
            "email": "test@example.com",
        }

        response = self.client.post(
            "/api/auth/login/",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("error", data)
        self.assertIn("Name and email are required", data["error"])

    def test_mock_login_empty_email(self):
        """Test mock login fails with empty email."""
        login_data = {
            "name": "John Doe",
            "email": "   ",  # Whitespace only
        }

        response = self.client.post(
            "/api/auth/login/",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("error", data)
        self.assertIn("Name and email are required", data["error"])

    def test_mock_logout_success(self):
        """Test successful logout."""
        # Create and login user first
        user = User.objects.create_user(
            email="test@example.com",
            first_name="Test",
            last_name="User",
        )
        self.client.force_login(user)

        response = self.client.post("/api/auth/logout/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("message", data)
        self.assertEqual(data["message"], "Logout successful")

    def test_mock_logout_unauthenticated(self):
        """Test logout when not authenticated."""
        response = self.client.post("/api/auth/logout/")

        # Should require authentication (returns 403)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_auth_status_authenticated(self):
        """Test auth status check for authenticated user."""
        user = User.objects.create_user(
            email="test@example.com",
            first_name="Test",
            last_name="User",
        )
        self.client.force_login(user)

        response = self.client.get("/api/auth/status/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertTrue(data["authenticated"])
        self.assertEqual(data["user_id"], str(user.id))
        self.assertEqual(data["name"], "Test User")
        self.assertEqual(data["email"], "test@example.com")

    def test_auth_status_unauthenticated(self):
        """Test auth status check for unauthenticated user."""
        response = self.client.get("/api/auth/status/")

        # Should require authentication (returns 403)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class UtilityEndpointsTestCase(APITestCase):
    """Test cases for utility endpoints."""

    def setUp(self):
        """Set up test data."""
        self.client = Client()

    def test_health_check(self):
        """Test health check endpoint."""
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "censeo-backend")
        self.assertEqual(data["version"], "1.0.0")

    def test_api_root(self):
        """Test API root endpoint."""
        response = self.client.get("/api/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertIn("message", data)
        self.assertIn("version", data)
        self.assertIn("endpoints", data)

        self.assertEqual(data["message"], "Censeo Story Pointing API")
        self.assertEqual(data["version"], "1.0.0")

        # Check endpoints structure
        endpoints = data["endpoints"]
        self.assertIn("auth", endpoints)
        self.assertIn("health", endpoints)

        # Check auth endpoints
        auth_endpoints = endpoints["auth"]
        self.assertIn("login", auth_endpoints)
        self.assertIn("logout", auth_endpoints)
        self.assertIn("status", auth_endpoints)

        self.assertEqual(auth_endpoints["login"], "/api/auth/login/")
        self.assertEqual(auth_endpoints["logout"], "/api/auth/logout/")
        self.assertEqual(auth_endpoints["status"], "/api/auth/status/")
        self.assertEqual(endpoints["health"], "/api/health/")