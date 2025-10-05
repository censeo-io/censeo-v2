# Contributing to Censeo

Thank you for your interest in contributing to Censeo! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Quality Standards](#code-quality-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [CI/CD Automation](#cicd-automation)
- [Code Style Guidelines](#code-style-guidelines)

## Development Setup

### Prerequisites

- **Docker & Docker Compose** - For running the full stack
- **Node.js 18.x or 20.x** - For frontend development
- **Python 3.10+** - For backend development
- **Git** - For version control
- **GitHub CLI (`gh`)** - For PR automation scripts
- **jq** - For JSON processing in scripts (`brew install jq`)

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/censeo-io/censeo-v2.git
   cd censeo-v2
   ```

2. **Start the development environment:**
   ```bash
   docker-compose up --build
   ```

3. **Verify services are running:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Backend Admin: http://localhost:8000/admin
   - Database: localhost:5432

### Environment Configuration

The backend requires a `.env` file. Copy from the example:

```bash
cp backend/.env.example backend/.env
```

Key environment variables:
- `DJANGO_SETTINGS_MODULE=censeo.settings.development` - Django settings module
- `DEBUG=1` - Enable debug mode
- `SECRET_KEY` - Django secret key (auto-generated for dev)
- `DATABASE_*` - Database connection settings (configured in docker-compose.yml)

## Development Workflow

### Branch Strategy

- `dev` - Main development branch (default)
- `staging` - Pre-production testing
- `prod` - Production releases
- Feature branches: `feature/<description>` or `<your-name>/<description>`
- Bug fixes: `fix/<description>`

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our code style guidelines

3. **Run tests locally** (see [Testing Requirements](#testing-requirements))

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a PR:**
   ```bash
   git push origin feature/your-feature-name
   gh pr create --base dev
   ```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
feat: add story voting feature
fix: resolve race condition in vote counting
docs: update API documentation
test: add integration tests for story creation
```

## Code Quality Standards

All code must pass the following checks before merging:

### Frontend

- **TypeScript compilation** - No type errors
- **ESLint** - No linting errors or warnings
- **Prettier** - Code properly formatted
- **Tests** - All tests passing
- **Build** - Production build succeeds

Run locally:
```bash
cd frontend

# TypeScript check
npx tsc --noEmit

# Linting
npm run lint

# Format code
npm run format

# Run tests
npm test -- --watchAll=false

# Build
npm run build
```

### Backend

- **Ruff linting** - No linting errors
- **Ruff formatting** - Code properly formatted
- **Tests** - All tests passing
- **Django check** - No system check errors

Run locally:
```bash
# All backend commands must run in Docker
docker-compose exec backend <command>

# Linting
docker-compose exec backend ruff check .

# Format code
docker-compose exec backend ruff format .

# Run tests
docker-compose exec backend python -m pytest -xvs

# Django system check
docker-compose exec backend python manage.py check
```

### SonarCloud Analysis

All PRs are analyzed by SonarCloud for:
- Code smells
- Security vulnerabilities
- Code coverage
- Duplications
- Maintainability issues

**Quality Gate:** Must pass to merge (some issues may be acceptable if quality gate passes)

## Testing Requirements

### Test Coverage Requirements

**CRITICAL:** SonarCloud Quality Gate will fail PRs that don't meet coverage requirements.

- **Frontend:** Minimum 80% coverage for new code
- **Backend:** Minimum 80% coverage for new code

All new code must include comprehensive tests. PRs with insufficient coverage will be blocked from merging.

### Running Tests

**Frontend Unit Tests (local):**
```bash
cd frontend
npm test -- --watchAll=false --ci
```

**Backend Unit Tests (Docker):**
```bash
docker-compose exec backend python -m pytest -xvs
```

**Integration Tests (Playwright):**
```bash
# Prerequisites: Docker services must be running
docker-compose up -d

# Run all integration tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Test Requirements

- **All tests must pass** before creating a PR
  - Unit tests (frontend + backend)
  - Integration tests (Playwright)
- Write tests for new features
- Update tests when modifying existing features
- Use React Testing Library best practices for frontend tests
- Use pytest fixtures for backend tests
- **Write integration tests for user-facing features**

### Integration Testing Guidelines

**When to Write Integration Tests:**

✅ **Always write integration tests for:**
- New user-facing features (forms, workflows, interactions)
- Authentication and authorization flows
- Critical user paths (login, create session, vote, etc.)
- Features that span frontend + backend + database
- Bug fixes that affect user workflows

❌ **Skip integration tests for:**
- Internal utilities or helpers
- Styling-only changes
- Configuration changes
- Documentation updates

**How to Write Integration Tests:**

1. **Use the test helpers** in `e2e/utils/test-helpers.ts`:
   ```typescript
   import { login, createSession, generateTestUser } from '../utils/test-helpers';

   test('my feature works', async ({ page }) => {
     const user = generateTestUser();
     await login(page, user);
     // ... test your feature
   });
   ```

2. **Follow the Arrange-Act-Assert pattern:**
   ```typescript
   test('should create a story', async ({ page }) => {
     // Arrange: Set up test data and login
     const user = generateTestUser();
     await login(page, user);
     await createSession(page, 'Test Session');

     // Act: Perform the action
     await page.getByRole('button', { name: 'Add Story' }).click();
     await page.getByRole('textbox', { name: 'Title' }).fill('My Story');
     await page.getByRole('button', { name: 'Create' }).click();

     // Assert: Verify the outcome
     await expect(page.getByText('My Story')).toBeVisible();
   });
   ```

3. **Test both happy path and edge cases:**
   ```typescript
   test.describe('Story Creation', () => {
     test('should create story with valid data', async ({ page }) => {
       // Happy path
     });

     test('should show error for empty title', async ({ page }) => {
       // Edge case: validation
     });

     test('should enforce character limits', async ({ page }) => {
       // Edge case: boundaries
     });
   });
   ```

4. **Use descriptive test names:**
   - ✅ Good: `should prevent voting before session starts`
   - ❌ Bad: `test voting`

5. **Keep tests independent:**
   - Each test should work in isolation
   - Don't rely on previous test state
   - Use `generateTestUser()` and `generateSessionName()` for unique data

**Where to Add Tests:**
- Smoke tests: `e2e/tests/smoke.spec.ts` (critical paths only)
- Feature tests: `e2e/tests/feature-name.spec.ts` (dedicated file per major feature)

**Example Test File:**
```typescript
import { test, expect } from '@playwright/test';
import { login, createSession, generateTestUser, generateSessionName } from '../utils/test-helpers';

test.describe('Story Management', () => {
  test.beforeEach(async ({ page }) => {
    const user = generateTestUser();
    await login(page, user);
    await createSession(page, generateSessionName());
  });

  test('should add a new story', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Story' }).click();
    await page.getByRole('textbox', { name: 'Title' }).fill('User Login');
    await page.getByRole('textbox', { name: 'Description' }).fill('As a user, I want to login');
    await page.getByRole('button', { name: 'Create Story' }).click();

    await expect(page.getByText('User Login')).toBeVisible();
  });

  test('should edit an existing story', async ({ page }) => {
    // Add story first
    // ... edit logic
  });

  test('should delete a story', async ({ page }) => {
    // Add story first
    // ... delete logic
  });
});
```

**Debugging Integration Tests:**

When tests fail:
1. Check `test-results/` for screenshots and videos
2. Run with `--headed` to see the browser
3. Use `--debug` to step through the test
4. Check Docker logs: `docker-compose logs backend frontend`

See `e2e/tests/README.md` for complete integration testing documentation.

## Pull Request Process

### Before Creating a PR

**Automated Pre-Push Verification (Recommended):**

Run the comprehensive pre-push script that verifies all checks will pass on GitHub Actions:

```bash
./scripts/pre-push-check.sh
```

This script runs:
- Frontend: TypeScript compilation, ESLint, Prettier, unit tests, build
- Backend: Ruff linting/formatting, unit tests, health check
- Integration Tests: Playwright E2E tests
- Docker Compose: Service status verification

**Manual Verification (Alternative):**

If you prefer to run checks individually:

1. **Run all tests locally:**
   ```bash
   # Frontend
   cd frontend && npm test -- --watchAll=false

   # Backend
   docker-compose exec backend python -m pytest -xvs
   ```

2. **Run code quality checks:**
   ```bash
   # Frontend
   cd frontend
   npm run lint
   npm run format
   npx tsc --noEmit

   # Backend
   docker-compose exec backend ruff check .
   docker-compose exec backend ruff format .
   ```

3. **Verify Docker Compose setup:**
   ```bash
   docker-compose down
   docker-compose up --build -d
   # Verify all services are healthy
   docker-compose ps
   ```

### Creating a PR

1. **Push your branch:**
   ```bash
   git push origin your-branch-name
   ```

2. **Create the PR:**
   ```bash
   gh pr create --base dev --fill
   ```

3. **Fill out the PR template** with:
   - Description of changes
   - Testing performed
   - Screenshots (if UI changes)
   - Related issues

### PR Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts with base branch

### CI Checks

All PRs must pass these automated checks:

**Frontend:**
- Code Quality (Node 18.x, 20.x)
- ESLint
- Prettier
- Tests
- Build

**Backend:**
- Code Quality (Python 3.10, 3.11, 3.12)
- Ruff linting
- Tests
- Django system check

**Security:**
- CodeQL analysis (JavaScript, Python)
- Dependency scanning
- Secrets scanning
- Trivy vulnerability scanning

**Docker:**
- Docker build (frontend, backend)
- Docker Compose integration test

**Code Quality:**
- SonarCloud analysis
- Lighthouse performance audit

## CI/CD Automation

We provide automation scripts to help monitor and fix CI/SonarCloud issues. See [.github/scripts/README.md](.github/scripts/README.md) for details.

### Quick Start with Automation

1. **Set up SonarCloud token:**
   ```bash
   # Get token from: https://sonarcloud.io/account/security/
   echo 'export SONARCLOUD_TOKEN="your-token"' >> ~/.zshrc
   source ~/.zshrc
   ```

2. **Check PR status:**
   ```bash
   .github/scripts/check-pr-status.sh <pr-number>
   ```

3. **Automated monitoring:**
   ```bash
   .github/scripts/ci-workflow-automation.sh <pr-number>
   ```

### What the Automation Does

- Waits for all GitHub Actions to complete
- Checks for failures and downloads logs
- Verifies SonarCloud quality gate
- Fetches and displays code quality issues
- Guides you through fixing issues
- Monitors up to 5 fix/test/verify cycles

See [CI/SonarCloud Automation Scripts](.github/scripts/README.md) for full documentation.

## Code Style Guidelines

### Frontend (TypeScript/React)

**General:**
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use explicit types, avoid `any`
- Follow React Testing Library best practices

**Naming:**
- Components: PascalCase (`StoryCard.tsx`)
- Files: PascalCase for components, kebab-case for utilities
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Interfaces: Prefix with `I` (e.g., `IStory`)

**Imports:**
```typescript
// React imports first
import React, { useState, useEffect } from 'react';

// Third-party imports
import { Box, Button } from '@mui/material';

// Local imports
import { StoryCard } from './components/StoryCard';
import { useStories } from './hooks/useStories';
```

**Testing:**
- Use `screen` queries from React Testing Library
- Prefer `getByRole` over `getByTestId`
- Use `userEvent` over `fireEvent` for interactions
- Wrap state updates in `act()` when needed

### Backend (Python/Django)

**General:**
- Follow PEP 8
- Use type hints
- Write docstrings for classes and public methods
- Keep functions small and focused

**Naming:**
- Classes: PascalCase
- Functions/methods: snake_case
- Constants: UPPER_SNAKE_CASE
- Private methods: prefix with `_`

**Django-specific:**
- Use class-based views for complex views
- Use viewsets for REST API endpoints
- Keep business logic in models or services
- Use Django ORM, avoid raw SQL

**Imports:**
```python
# Standard library
import os
from typing import Optional

# Third-party
from django.db import models
from rest_framework import serializers

# Local
from core.models import Story
from core.services import VotingService
```

**Testing:**
- Use pytest
- Use fixtures for common setup
- Test edge cases and error handling
- Mock external dependencies

### Common Standards

**File Organization:**
```
frontend/
├── src/
│   ├── components/       # Reusable components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom hooks
│   ├── services/        # API services
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions

backend/
├── core/                # Main app
│   ├── models.py       # Database models
│   ├── views.py        # API views
│   ├── serializers.py  # DRF serializers
│   ├── services.py     # Business logic
│   └── tests/          # Tests
```

**Code Comments:**
- Write self-documenting code
- Add comments for complex logic
- Document "why", not "what"
- Keep comments up to date

## Getting Help

- **Documentation:** Check our [main README](README.md) and [automation scripts README](.github/scripts/README.md)
- **Issues:** Search existing issues before creating new ones
- **Discussions:** Use GitHub Discussions for questions
- **Discord:** Join our community Discord (link in main README)

## License

By contributing to Censeo, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to Censeo! 🎉
