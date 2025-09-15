# Spec Requirements Document

> Spec: MVP Development Environment
> Created: 2025-09-14
> Status: Planning

## Overview

Set up local development environment for Censeo story pointing application and implement three incremental, testable chunks of core functionality. Each chunk builds upon the previous while maintaining simplicity and clear separation of concerns.

The development environment will be fully containerized using Docker with Django backend, React frontend, and PostgreSQL database in separate containers. The implementation follows a phased approach with three distinct, testable milestones that progressively build the core voting workflow.

## User Stories

### Development Environment Setup
As a developer, I want a containerized local development environment so that I can work consistently across different machines and easily onboard new team members.

The environment should include Django backend, React frontend, and PostgreSQL database in separate containers with hot-reload capabilities and clear directory structure.

### Basic Session Management
As a facilitator, I want to create and manage voting sessions so that my team can join and participate in story pointing.

Users can create sessions with temporary identifiers, join existing sessions, and see who is currently in the session.

### Story Voting System
As a team member, I want to submit votes for stories so that we can estimate work collaboratively.

Team members can view stories, submit point estimates using standard scales (Fibonacci), and see voting progress without revealing individual votes.

### Vote Reveal and Management
As a facilitator, I want to control when votes are revealed so that I can ensure all participants vote independently.

Facilitators can reveal votes for completed stories, see voting results, and manage the session flow.

## Spec Scope

1. **Docker Development Environment** - Complete containerized setup with Django, React, PostgreSQL and development tooling
2. **Project Structure** - Clear separation of frontend, backend, and database components in distinct directories
3. **Basic Session Management** - Create, join, and manage voting sessions with temporary mock authentication
4. **Story Management** - Add stories to sessions and display them to participants
5. **Voting System** - Submit and track votes using REST APIs with Fibonacci pointing scale
6. **Vote Reveal Controls** - Facilitator-controlled vote revelation and results display
7. **Unit Testing Framework** - Testing setup for both frontend and backend components

## Out of Scope

- Real magic link authentication (mock auth only for now)
- Real-time Socket.IO updates (REST polling acceptable initially)
- Integration and end-to-end tests (unit tests only)
- Production deployment configuration
- Advanced session features (reconnection handling, etc.)
- Multiple pointing scales (Fibonacci only)

## Expected Deliverable

1. **Working Development Environment** - Docker Compose setup that starts all services with one command and supports hot-reload
2. **Complete Voting Workflow** - Users can create sessions, add stories, vote, and reveal results through a web interface
3. **Comprehensive Unit Tests** - Test coverage for core business logic in both frontend and backend components

## Spec Documentation

- Tasks: @.agent-os/specs/2025-09-14-mvp-dev-environment/tasks.md
- Technical Specification: @.agent-os/specs/2025-09-14-mvp-dev-environment/sub-specs/technical-spec.md
- Database Schema: @.agent-os/specs/2025-09-14-mvp-dev-environment/sub-specs/database-schema.md
- API Specification: @.agent-os/specs/2025-09-14-mvp-dev-environment/sub-specs/api-spec.md
- Tests Specification: @.agent-os/specs/2025-09-14-mvp-dev-environment/sub-specs/tests.md