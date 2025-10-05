#!/bin/bash

# Pre-push verification script for Censeo
# Runs all checks to ensure GitHub Actions will succeed

set -e  # Exit on first error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall success
ALL_PASSED=true

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}===================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
    ALL_PASSED=false
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    print_error "Must run from project root directory"
    exit 1
fi

print_section "Starting Pre-Push Verification"

# Check if Docker Compose is running
print_section "1. Docker Compose Status"
if docker-compose ps | grep -q "Up"; then
    print_success "Docker Compose services are running"
else
    print_error "Docker Compose services are not running. Run: docker-compose up -d"
    exit 1
fi

# Frontend checks
print_section "2. Frontend TypeScript Compilation"
cd frontend
if npx tsc --noEmit; then
    print_success "TypeScript compilation passed"
else
    print_error "TypeScript compilation failed"
fi

print_section "3. Frontend ESLint"
if npm run lint; then
    print_success "ESLint passed"
else
    print_error "ESLint failed"
fi

print_section "4. Frontend Formatting Check"
if npm run format -- --check; then
    print_success "Prettier formatting is correct"
else
    print_warning "Prettier formatting needs fixes. Run: npm run format"
    # Don't fail on formatting, just warn
fi

print_section "5. Frontend Tests & Coverage"
# Capture test output to extract coverage
FRONTEND_TEST_OUTPUT=$(npm test -- --watchAll=false --ci --coverage --coverageReporters=text 2>&1)
if echo "$FRONTEND_TEST_OUTPUT" | grep -q "Tests:.*passed"; then
    print_success "All frontend tests passed"

    # Extract coverage percentage from Jest text output (All files line)
    FRONTEND_COVERAGE=$(echo "$FRONTEND_TEST_OUTPUT" | grep "All files" | awk '{print $10}' | tr -d '%')
    if [ -n "$FRONTEND_COVERAGE" ]; then
        if (( $(echo "$FRONTEND_COVERAGE >= 80" | bc -l) )); then
            print_success "Frontend coverage: ${FRONTEND_COVERAGE}% (≥80%)"
        else
            print_error "Frontend coverage: ${FRONTEND_COVERAGE}% (must be ≥80%)"
        fi
    else
        print_warning "Could not extract frontend coverage percentage"
    fi
else
    print_error "Frontend tests failed"
    echo "$FRONTEND_TEST_OUTPUT" | tail -20
fi

print_section "6. Frontend Build"
if npm run build; then
    print_success "Frontend build successful"
else
    print_error "Frontend build failed"
fi

# Return to project root
cd ..

# Backend checks
print_section "7. Backend Linting"
if docker-compose exec -T backend ruff check .; then
    print_success "Backend linting passed"
else
    print_error "Backend linting failed"
fi

print_section "8. Backend Formatting Check"
if docker-compose exec -T backend ruff format --check .; then
    print_success "Backend formatting is correct"
else
    print_warning "Backend formatting needs fixes. Run: docker-compose exec backend ruff format ."
    # Don't fail on formatting, just warn
fi

print_section "9. Backend Tests"
# Capture pytest output to extract coverage
BACKEND_TEST_OUTPUT=$(docker-compose exec -T backend python -m pytest -xvs 2>&1)
if echo "$BACKEND_TEST_OUTPUT" | grep -q "passed"; then
    print_success "All backend tests passed"

    # Extract coverage percentage from pytest output
    BACKEND_COVERAGE=$(echo "$BACKEND_TEST_OUTPUT" | grep "TOTAL" | awk '{print $NF}' | tr -d '%')
    if [ -n "$BACKEND_COVERAGE" ]; then
        if (( $(echo "$BACKEND_COVERAGE >= 80" | bc -l) )); then
            print_success "Backend coverage: ${BACKEND_COVERAGE}% (≥80%)"
        else
            print_error "Backend coverage: ${BACKEND_COVERAGE}% (must be ≥80%)"
        fi
    else
        print_warning "Could not extract backend coverage percentage"
    fi
else
    print_error "Backend tests failed"
    echo "$BACKEND_TEST_OUTPUT" | tail -20
fi

print_section "10. Backend Health Check"
if curl -s http://localhost:8000/api/health/ | grep -q "healthy"; then
    print_success "Backend API is healthy"
else
    print_error "Backend API health check failed"
fi

# Integration tests (E2E)
print_section "11. Integration Tests (Playwright)"
if npm run test:e2e; then
    print_success "All integration tests passed"
else
    print_error "Integration tests failed"
fi

# Final summary
print_section "Pre-Push Verification Summary"

if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo -e "${GREEN}✓ Ready to commit and push${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ Some checks failed${NC}"
    echo -e "${RED}✗ Please fix the errors above before pushing${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
