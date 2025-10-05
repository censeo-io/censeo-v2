# Playwright Integration Test Setup - Complete! ✅

## What Was Created

### 1. Project Structure
```
/Users/cjflory/Code/censeo/
├── playwright.config.ts           # Playwright configuration
├── package.json                   # Updated with test scripts
├── e2e/                          # Test directory (root level)
│   ├── global-setup.ts           # Database reset, service verification
│   ├── tests/
│   │   ├── smoke.spec.ts         # Smoke test suite (9 tests)
│   │   └── README.md             # Test documentation
│   ├── utils/
│   │   ├── test-helpers.ts       # Reusable test functions
│   │   └── database.ts           # Database utilities
│   └── fixtures/                 # Custom fixtures (for future use)
└── .github/workflows/
    └── integration-tests.yml     # GitHub Actions workflow
```

### 2. Test Coverage (9 passing tests)

**Smoke Tests:**
- ✅ Home page loads
- ✅ Login form validation
- ✅ Login flow
- ✅ Session creation
- ✅ Session validation
- ✅ Empty states
- ✅ Copy session ID
- ✅ Refresh buttons
- ✅ Character limits

### 3. Documentation Updates

**CONTRIBUTING.md:**
- ✅ Integration testing guidelines added
- ✅ When to write integration tests
- ✅ How to write integration tests
- ✅ Example test patterns
- ✅ Debugging guide

**Pre-Push Script:**
- ✅ Updated to run E2E tests automatically
- ✅ Now runs: Unit tests → Integration tests → Verification

### 4. CI/CD Integration

**GitHub Actions Workflow:**
- ✅ Runs on PRs to dev, staging, prod
- ✅ Starts Docker services
- ✅ Resets database
- ✅ Runs tests in headless Chromium
- ✅ Uploads artifacts (screenshots, videos) on failure
- ✅ Runs AFTER unit tests pass (no wasted resources)

## Quick Start Guide

### Running Tests Locally

```bash
# Ensure Docker is running
docker-compose up -d

# Run all tests
npm run test:e2e

# Interactive mode (UI)
npm run test:e2e:ui

# See browser (headed mode)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

### Pre-Push Verification

```bash
# Run ALL checks (unit + integration + linting + build)
./scripts/pre-push-check.sh
```

## Two Testing Tools Available

### 1. Playwright MCP Server (Already Installed)
**For:** Interactive testing with Claude during development

**Usage:**
- Ask Claude: "Test the login flow with edge cases"
- Claude uses MCP tools to drive browser and show results
- Great for: Debugging, exploratory testing, quick feedback

### 2. Playwright Test Framework (Just Installed)
**For:** Automated regression testing in CI/CD

**Usage:**
- Developers write `.spec.ts` test files
- Tests run via `npm run test:e2e`
- Runs automatically in GitHub Actions
- Great for: Regression protection, pre-merge validation

**Both tools work together!** Use MCP for development, automated tests for CI.

## Writing New Tests

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import { login, createSession, generateTestUser, generateSessionName } from '../utils/test-helpers';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    // Arrange: Set up test data
    const user = generateTestUser();
    await login(page, user);

    // Act: Perform action
    await page.getByRole('button', { name: 'My Button' }).click();

    // Assert: Verify outcome
    await expect(page.getByText('Expected Result')).toBeVisible();
  });
});
```

### Where to Add Tests

- **Smoke tests** (critical paths): `e2e/tests/smoke.spec.ts`
- **Feature tests**: Create new file `e2e/tests/feature-name.spec.ts`

See `e2e/tests/README.md` for full documentation.

## GitHub Actions Integration

Tests run automatically on every PR to `dev`, `staging`, or `prod`:

1. **Unit tests run first** (frontend + backend)
2. **If unit tests pass**, integration tests run
3. **If integration tests fail**, artifacts uploaded:
   - Screenshots
   - Videos
   - Traces (open with `npx playwright show-trace <file>`)

## Debugging Failed Tests

### Locally
```bash
# Run with browser visible
npm run test:e2e:headed

# Run with debugger
npm run test:e2e:debug

# Check artifacts
ls test-results/
```

### In CI
1. Check GitHub Actions → Failed workflow
2. Download artifacts (screenshots/videos)
3. Review Docker logs in workflow output

## Test Helpers Available

Import from `e2e/utils/test-helpers.ts`:

- `login(page, { name, email })` - Login a user
- `createSession(page, sessionName)` - Create session
- `generateTestUser()` - Random test user
- `generateSessionName()` - Random session name
- `addStory(page, title, description)` - Add story (implement when feature exists)
- `vote(page, points)` - Vote on story (implement when feature exists)
- `revealVotes(page)` - Reveal votes (implement when feature exists)

## Next Steps

### Add More Tests

Recommended next test files:
1. `e2e/tests/story-management.spec.ts` - Add/edit/delete stories
2. `e2e/tests/voting.spec.ts` - Voting flow
3. `e2e/tests/multi-user.spec.ts` - Concurrent users

### Extend Test Helpers

When you add new features, add helpers to `e2e/utils/test-helpers.ts`:

```typescript
export async function addStory(page: Page, title: string, description?: string) {
  // Your implementation
}
```

### Database Cleanup (Optional)

If you need custom test data, implement:
- Custom fixtures in `e2e/fixtures/`
- Backend test endpoint for data seeding
- Load fixtures in `global-setup.ts`

## Troubleshooting

### Tests timeout
- Check Docker: `docker-compose ps`
- Check logs: `docker-compose logs backend frontend`
- Increase timeout in `playwright.config.ts`

### Database flush fails
- Verify backend running: `docker-compose exec backend python manage.py check`
- Check migrations: `docker-compose exec backend python manage.py migrate`

### Browser not found
```bash
npx playwright install chromium
```

## Test Results

**Initial test run: ✅ 9/9 tests passing**

```
Running 9 tests using 1 worker

  ✓  should load the home page (638ms)
  ✓  should show login form on home page (392ms)
  ✓  should validate login form inputs (396ms)
  ✓  should login successfully with valid credentials (494ms)
  ✓  should create a new session (647ms)
  ✓  should validate session name input (531ms)
  ✓  should show empty state when no stories exist (662ms)
  ✓  should display session refresh button (712ms)
  ✓  should copy session ID to clipboard (713ms)

  9 passed (7.9s)
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- Project docs: `e2e/tests/README.md`
- Contributing: `CONTRIBUTING.md` (Integration Testing Guidelines section)

---

**Setup complete!** Integration tests are now part of your development workflow.
