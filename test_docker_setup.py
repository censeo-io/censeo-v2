#!/usr/bin/env python3
"""
Tests for Docker Compose configuration and container setup.
These tests verify that our development environment is properly configured.
"""

import os
import subprocess
import yaml
import pytest
import time
import requests
from pathlib import Path

class TestDockerComposeConfiguration:
    """Test Docker Compose file structure and configuration."""

    def test_docker_compose_file_exists(self):
        """Test that docker-compose.yml exists in project root."""
        compose_file = Path("docker-compose.yml")
        assert compose_file.exists(), "docker-compose.yml should exist in project root"

    def test_docker_compose_file_valid_yaml(self):
        """Test that docker-compose.yml is valid YAML."""
        with open("docker-compose.yml", "r") as f:
            try:
                yaml.safe_load(f)
            except yaml.YAMLError as e:
                pytest.fail(f"docker-compose.yml is not valid YAML: {e}")

    def test_required_services_defined(self):
        """Test that all required services are defined in docker-compose.yml."""
        with open("docker-compose.yml", "r") as f:
            compose_config = yaml.safe_load(f)

        required_services = ["backend", "frontend", "database"]
        services = compose_config.get("services", {})

        for service in required_services:
            assert service in services, f"Service '{service}' should be defined in docker-compose.yml"

    def test_backend_service_configuration(self):
        """Test backend service configuration."""
        with open("docker-compose.yml", "r") as f:
            compose_config = yaml.safe_load(f)

        backend = compose_config["services"]["backend"]

        # Check port mapping for Django (8000)
        assert "ports" in backend, "Backend service should have port mapping"
        ports = backend["ports"]
        assert any("8000" in str(port) for port in ports), "Backend should expose port 8000"

        # Check volume mount for hot reload
        assert "volumes" in backend, "Backend service should have volume mounts for hot reload"

        # Check environment variables
        assert "environment" in backend or "env_file" in backend, "Backend should have environment configuration"

    def test_frontend_service_configuration(self):
        """Test frontend service configuration."""
        with open("docker-compose.yml", "r") as f:
            compose_config = yaml.safe_load(f)

        frontend = compose_config["services"]["frontend"]

        # Check port mapping for React (3000)
        assert "ports" in frontend, "Frontend service should have port mapping"
        ports = frontend["ports"]
        assert any("3000" in str(port) for port in ports), "Frontend should expose port 3000"

        # Check volume mount for hot reload
        assert "volumes" in frontend, "Frontend service should have volume mounts for hot reload"

    def test_database_service_configuration(self):
        """Test database service configuration."""
        with open("docker-compose.yml", "r") as f:
            compose_config = yaml.safe_load(f)

        database = compose_config["services"]["database"]

        # Check PostgreSQL image
        assert "image" in database, "Database service should specify an image"
        assert "postgres" in database["image"].lower(), "Database should use PostgreSQL image"

        # Check port mapping for PostgreSQL (5432)
        assert "ports" in database, "Database service should have port mapping"
        ports = database["ports"]
        assert any("5432" in str(port) for port in ports), "Database should expose port 5432"

        # Check environment variables for database setup
        assert "environment" in database, "Database service should have environment variables"
        env = database["environment"]
        required_env_vars = ["POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD"]
        for var in required_env_vars:
            assert any(var in str(env_var) for env_var in env), f"Database should have {var} environment variable"

class TestProjectStructure:
    """Test project directory structure."""

    def test_required_directories_exist(self):
        """Test that required project directories exist."""
        required_dirs = ["frontend", "backend", "database"]

        for directory in required_dirs:
            dir_path = Path(directory)
            assert dir_path.exists(), f"Directory '{directory}' should exist"
            assert dir_path.is_dir(), f"'{directory}' should be a directory"

class TestContainerHealth:
    """Test container health and communication."""

    @pytest.mark.integration
    def test_containers_start_successfully(self):
        """Test that all containers can start without errors."""
        # This test requires Docker to be running
        try:
            result = subprocess.run(
                ["docker-compose", "up", "-d", "--build"],
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout for initial build
            )
            assert result.returncode == 0, f"Docker compose failed to start: {result.stderr}"
        except subprocess.TimeoutExpired:
            pytest.fail("Docker compose startup timed out after 5 minutes")

    @pytest.mark.integration
    def test_backend_health_check(self):
        """Test that backend service is accessible."""
        # Wait for services to be ready
        time.sleep(10)

        try:
            response = requests.get("http://localhost:8000/", timeout=5)
            # Django default page or API response is acceptable
            assert response.status_code in [200, 404], "Backend should be responding on port 8000"
        except requests.ConnectionError:
            pytest.fail("Cannot connect to backend on port 8000")

    @pytest.mark.integration
    def test_frontend_health_check(self):
        """Test that frontend service is accessible."""
        # Wait for services to be ready
        time.sleep(10)

        try:
            response = requests.get("http://localhost:3000/", timeout=5)
            # React dev server or built app response is acceptable
            assert response.status_code in [200, 404], "Frontend should be responding on port 3000"
        except requests.ConnectionError:
            pytest.fail("Cannot connect to frontend on port 3000")

    @pytest.mark.integration
    def test_database_connection(self):
        """Test that database is accessible from backend."""
        # This will be tested once Django backend is set up with database connection
        pass

if __name__ == "__main__":
    # Run basic configuration tests
    pytest.main([__file__, "-v", "-k", "not integration"])