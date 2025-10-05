# Censeo - Story Pointing Application

A story pointing application that helps agile development teams collaboratively estimate work through blind voting sessions.

## Project Structure

```
censeo/
├── backend/           # Django REST API
├── frontend/          # React TypeScript application
├── database/          # PostgreSQL initialization scripts
├── e2e/              # Playwright integration tests
├── .github/          # GitHub Actions workflows and automation scripts
├── scripts/          # Development and CI scripts
├── docker-compose.yml # Development environment
└── playwright.config.ts # Playwright test configuration
```

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18.x or 20.x (for frontend and integration tests)
- Python 3.11+ (for backend development)

### Quick Start

1. Clone the repository
2. Start the development environment:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Database: localhost:5432

### Running Tests

**Frontend Unit Tests:**
```bash
cd frontend
npm test -- --watchAll=false
```

**Backend Unit Tests:**
```bash
docker-compose exec backend python -m pytest -xvs
```

**Integration Tests (E2E):**
```bash
# Ensure Docker services are running
docker-compose up -d

# Run Playwright integration tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

**Pre-Push Verification:**
```bash
# Run all checks (unit tests + integration tests + linting + build)
./scripts/pre-push-check.sh
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed testing guidelines.

## Development Workflow

### Hot Reload

Both frontend and backend support hot reload:
- **Frontend**: React development server automatically reloads on file changes
- **Backend**: Django development server reloads on Python file changes
- **Database**: Persistent data stored in Docker volumes

### Services

- **Database**: PostgreSQL 15 with development database `censeo_dev`
- **Backend**: Django 4.2 with DRF on port 8000
- **Frontend**: React 18 with TypeScript on port 3000

## Environment Configuration

Development environment variables are configured in `docker-compose.yml`. The setup uses:
- Development database credentials
- Hot reload configurations
- Debug mode enabled

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup and workflow
- Code quality standards and testing requirements
- Pull request process and CI/CD checks
- Code style guidelines for frontend and backend
- **[CI/SonarCloud Automation Scripts](.github/scripts/README.md)** - Tools to monitor PR status and fix issues

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and ensure all tests pass
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
5. Push and create a pull request to the `dev` branch

See [CONTRIBUTING.md](CONTRIBUTING.md) for full details.

## Features

✅ **Implemented:**
- User authentication and session management
- Session creation and management
- Story pointing interface with Material-UI
- Real-time session updates
- Comprehensive test coverage (unit + integration)
- CI/CD with GitHub Actions
- Code quality monitoring with SonarCloud

🚧 **In Development:**
- Real-time voting with WebSockets
- Multi-user session participation
- Story estimation history and analytics
- Export session results