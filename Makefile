# Makefile for Censeo development environment
# Provides convenient commands for common development tasks

.PHONY: help build up down restart logs test clean setup

# Default target
help:
	@echo "Censeo Development Environment"
	@echo "=============================="
	@echo ""
	@echo "Available commands:"
	@echo "  setup     - Initial setup: build and start all services"
	@echo "  build     - Build all Docker images"
	@echo "  up        - Start all services"
	@echo "  down      - Stop all services"
	@echo "  restart   - Restart all services"
	@echo "  logs      - Show logs from all services"
	@echo "  test      - Run Docker configuration tests"
	@echo "  clean     - Remove all containers, volumes, and images"
	@echo "  backend   - Open shell in backend container"
	@echo "  frontend  - Open shell in frontend container"
	@echo "  db        - Connect to database"

# Initial setup
setup: build up
	@echo "Waiting for services to start..."
	@sleep 10
	@echo "Setup complete! Services available at:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  Database: localhost:5432"

# Build all images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Restart all services
restart: down up

# Show logs
logs:
	docker-compose logs -f

# Run tests in Docker container
test:
	docker build -f test.Dockerfile -t censeo-test .
	docker run --rm censeo-test

# Run integration tests (requires running containers)
test-integration:
	docker build -f test.Dockerfile -t censeo-test .
	docker run --rm --network censeo_censeo_network censeo-test pytest test_docker_setup.py -m integration -v

# Clean up everything
clean:
	docker-compose down -v --rmi all --remove-orphans
	docker system prune -f

# Backend shell
backend:
	docker-compose exec backend bash

# Frontend shell
frontend:
	docker-compose exec frontend sh

# Database connection
db:
	docker-compose exec database psql -U censeo_user -d censeo_dev

# Backend Django commands
migrate:
	docker-compose exec backend python manage.py migrate

makemigrations:
	docker-compose exec backend python manage.py makemigrations

createsuperuser:
	docker-compose exec backend python manage.py createsuperuser

# Frontend commands
npm-install:
	docker-compose exec frontend npm install

npm-test:
	docker-compose exec frontend npm test