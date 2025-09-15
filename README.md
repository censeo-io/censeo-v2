# Censeo - Story Pointing Application

A story pointing application that helps agile development teams collaboratively estimate work through blind voting sessions.

## Project Structure

```
censeo/
├── backend/           # Django REST API
├── frontend/          # React TypeScript application
├── database/          # PostgreSQL initialization scripts
├── docker-compose.yml # Development environment
└── test_docker_setup.py # Docker configuration tests
```

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for running tests locally)

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

Run Docker configuration tests:
```bash
python test_docker_setup.py
```

Run integration tests (requires containers to be running):
```bash
pytest test_docker_setup.py -m integration
```

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

## Next Steps

This is the foundation setup. Future development will include:
1. Django project initialization with models
2. React app with Material-UI components
3. REST API endpoints for story pointing
4. Authentication system
5. Real-time updates with Socket.IO