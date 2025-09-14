# Development Best Practices

## Context

Global development guidelines for Agent OS projects.

<conditional-block context-check="core-principles">
IF this Core Principles section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Core Principles already in context"
ELSE:
  READ: The following principles

## Core Principles

### Security First
- All user input must be validated and sanitized
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization checks
- Store sensitive data in Google Secret Manager, never in code
- Apply rate limiting to prevent abuse and DoS attacks
- Log security events (failed auth, rate limit violations)

### Keep It Simple
- Implement code in the fewest lines possible
- Avoid over-engineering solutions
- Choose straightforward approaches over clever ones
- Favor explicit code over clever abstractions

### Optimize for Readability
- Prioritize code clarity over micro-optimizations
- Write self-documenting code with clear variable names
- Add comments for "why" not "what"
- Use TypeScript strict mode for better type safety

### DRY (Don't Repeat Yourself)
- Extract repeated business logic to private methods
- Extract repeated UI markup to reusable components
- Create utility functions for common operations
- Share validation logic between frontend and backend

### File Structure
- Keep files focused on a single responsibility
- Group related functionality together
- Use consistent naming conventions
- Separate concerns: routes, services, models, utilities
</conditional-block>

## Testing Standards

### Test Coverage Requirements
- Minimum 80% code coverage for unit tests
- 100% coverage for security-critical functions (auth, permissions, rate limiting)
- All API endpoints must have integration tests
- All user flows must have E2E tests

### Test Types
- **Unit Tests** (Jest/Vitest): Test business logic in isolation
- **Component Tests** (React Testing Library): Test UI components
- **Integration Tests**: Test API + database interactions, Socket.IO flows
- **End-to-End Tests** (Playwright): Test complete user journeys
- **Load Tests** (Artillery/k6): Verify rate limits and performance

### Test Data Management
- Use isolated test databases for integration tests
- Create test data factories for consistent data generation
- Clean up test data to prevent pollution between tests
- Mock external services (email sending, etc.)

### Test Organization
- Group tests by feature/module
- Use descriptive test names that explain the scenario
- Follow AAA pattern: Arrange, Act, Assert
- Test both success and error scenarios

<conditional-block context-check="dependencies" task-condition="choosing-external-library">
IF current task involves choosing an external library:
  IF Dependencies section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Dependencies guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Dependencies section not relevant to current task

## Dependencies

### Choose Libraries Wisely
When adding third-party dependencies:
- Select the most popular and actively maintained option
- Check the library's GitHub repository for:
  - Recent commits (within last 6 months)
  - Active issue resolution
  - Number of stars/downloads
  - Clear documentation
</conditional-block>
