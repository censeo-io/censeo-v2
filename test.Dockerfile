FROM python:3.11-slim

WORKDIR /app

# Install test dependencies
RUN pip install pyyaml requests pytest

# Copy test files and directory structure
COPY test_docker_setup.py .
COPY docker-compose.yml .
COPY frontend/ frontend/
COPY backend/ backend/
COPY database/ database/

# Default command runs the tests
CMD ["python", "test_docker_setup.py"]