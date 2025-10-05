# Censeo Integration Tests

This directory contains end-to-end integration tests for the Censeo application using Playwright.

## Test Structure

```
e2e/
├── tests/              # Test files
│   ├── smoke.spec.ts   # Critical path smoke tests (run first)
│   └── README.md       # This file
├── utils/              # Test utilities and helpers
│   ├── test-helpers.ts # Common test functions (login, createSession, etc.)
│   └── database.ts     # Database setup/cleanup utilities
├── fixtures/           # Custom Playwright fixtures (if needed)
└── global-setup.ts     # Runs once before all tests (database reset, service checks)
```

## Running Tests

### Prerequisites

1. **Start Docker services:**
   ```bash
   docker-compose up -d
   ```

2. **Verify services are running:**
   ```bash
   docker-compose ps
   # Should show backend, frontend, and database as "Up"
   ```

### Run All Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/tests/smoke.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests with debugging
npx playwright test --debug
```

### CI/CD

Tests run automatically on GitHub Actions for PRs to `dev`, `staging`, and `prod` branches.

The workflow:
1. Starts Docker services
2. Runs unit tests (frontend + backend)
3. **If unit tests pass**, runs Playwright integration tests
4. Uploads test artifacts (screenshots, videos, traces) on failure

## Test Categories

### Smoke Tests (`smoke.spec.ts`)

Critical user paths that must work for the app to be functional:
- ✅ Home page loads
- ✅ Login form validation
- ✅ Login flow
- ✅ Session creation
- ✅ Session validation
- ✅ Empty states
- ✅ Copy session ID

**When to run:** Before every deployment, on every PR

### Story Management Tests (TODO)

Testing story CRUD operations:
- Add story
- Edit story
- Delete story
- Story validation
- Multiple stories

### Voting Flow Tests (TODO)

Testing the voting mechanism:
- Vote submission
- Vote reveal
- Multiple voters
- Vote counting
- Round management

## Writing New Tests

### 1. Use Test Helpers

Import and use helpers from `utils/test-helpers.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { login, createSession, generateTestUser } from '../utils/test-helpers';

test('my new test', async ({ page }) => {
  const user = generateTestUser();
  await login(page, user);

  const session = await createSession(page, 'My Test Session');
  // ... rest of test
});
```

### 2. Follow Naming Conventions

- **File names:** `feature-name.spec.ts`
- **Test descriptions:** Clear, action-oriented (e.g., "should login successfully")
- **Use `test.describe`** to group related tests

### 3. Best Practices

**DO:**
- ✅ Use `page.getByRole()` for accessibility-based selectors
- ✅ Use `getByText()` for visible text
- ✅ Use `getByTestId()` only when role/text selectors aren't possible
- ✅ Generate unique test data (`generateTestUser()`, `generateSessionName()`)
- ✅ Wait for expectations (`await expect(...).toBeVisible()`)
- ✅ Test both happy path and edge cases

**DON'T:**
- ❌ Use CSS selectors or XPath (fragile)
- ❌ Use hardcoded user data (will conflict across test runs)
- ❌ Use arbitrary `page.waitForTimeout()` (use expectations instead)
- ❌ Chain too many actions in one test (keep tests focused)
- ❌ Forget to verify the outcome of actions

### 4. Test Template

```typescript
import { test, expect } from '@playwright/test';
import { login, generateTestUser } from '../utils/test-helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something specific', async ({ page }) => {
    // Arrange
    const user = generateTestUser();
    await login(page, user);

    // Act
    await page.getByRole('button', { name: 'Action' }).click();

    // Assert
    await expect(page.getByText('Expected Result')).toBeVisible();
  });
});
```

## Debugging Tests

### View Test Results

```bash
# Show last test report
npx playwright show-report
```

### Debugging Failed Tests

When tests fail, Playwright automatically captures:
- **Screenshots** (`test-results/` directory)
- **Videos** (`test-results/` directory)
- **Traces** (open with `npx playwright show-trace <file>`)

### Interactive Debugging

```bash
# Run test with debugger
npx playwright test --debug

# Run specific test in debug mode
npx playwright test smoke.spec.ts --debug

# Use Playwright Inspector
npx playwright test --ui
```

## Database State

Tests start with a **fresh database** on each run. The `global-setup.ts` file:
1. Verifies Docker services are running
2. Flushes the database using `docker-compose exec backend python manage.py flush`
3. Verifies frontend and backend are responsive

If you need custom database state:
1. Add fixtures to `e2e/fixtures/`
2. Load them in `global-setup.ts` or individual tests

## Troubleshooting

### Tests timing out

- Verify Docker services are running: `docker-compose ps`
- Check service logs: `docker-compose logs backend frontend`
- Increase timeout in `playwright.config.ts`

### Database flush fails

- Check backend container is running: `docker-compose ps backend`
- Manually verify: `docker-compose exec backend python manage.py check`
- Check migrations: `docker-compose exec backend python manage.py migrate`

### Browser not found

```bash
npx playwright install chromium
```

### Tests pass locally but fail in CI

- Check Docker Compose logs in CI
- Review GitHub Actions artifacts (screenshots/videos)
- Verify timing differences (CI may be slower)

## Adding New Test Helpers

When you find yourself repeating code, add a helper to `utils/test-helpers.ts`:

```typescript
export async function myNewHelper(page: Page, param: string): Promise<void> {
  // Reusable test logic
}
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
