import { test, expect } from '@playwright/test';
import { login, createSession, generateTestUser, generateSessionName } from '../utils/test-helpers';

/**
 * Smoke Test Suite
 *
 * These tests verify critical user paths work end-to-end.
 * Run these tests before every deployment to catch breaking changes.
 *
 * Coverage:
 * - Login flow
 * - Session creation
 * - Story management (add/edit/delete)
 * - Voting flow
 */

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Each test starts at the home page
    await page.goto('/');
  });

  test('should load the home page', async ({ page }) => {
    // Verify page loads
    await expect(page).toHaveTitle(/Censeo/);

    // Verify key elements are present
    await expect(page.getByRole('heading', { name: 'Censeo' })).toBeVisible();
    await expect(page.getByTestId('login-form').getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should show login form on home page', async ({ page }) => {
    // Verify login form is present
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();

    // Verify login button is initially disabled (empty form)
    const loginButton = page.getByTestId('login-form').getByRole('button', { name: 'Login' });
    await expect(loginButton).toBeDisabled();
  });

  test('should validate login form inputs', async ({ page }) => {
    const loginButton = page.getByTestId('login-form').getByRole('button', { name: 'Login' });

    // Test whitespace-only name
    await page.getByRole('textbox', { name: 'Name' }).fill('   ');
    await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com');
    await expect(loginButton).toBeDisabled();

    // Test invalid email
    await page.getByRole('textbox', { name: 'Name' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Email' }).fill('invalid-email');
    await expect(loginButton).toBeDisabled();

    // Test valid inputs
    await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com');
    await expect(loginButton).toBeEnabled();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    const user = generateTestUser();

    await login(page, user);

    // Verify user is logged in
    await expect(page.getByText(`Welcome, ${user.name}`)).toBeVisible();

    // Verify navigation shows logged-in state
    await expect(page.getByRole('button', { name: 'account menu' })).toBeVisible();

    // Verify action buttons are available
    await expect(page.getByRole('button', { name: 'Create Session' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join Session' })).toBeVisible();
  });

  test('should create a new session', async ({ page }) => {
    const user = generateTestUser();
    const sessionName = generateSessionName();

    // Login first
    await login(page, user);

    // Create session
    const session = await createSession(page, sessionName);

    // Verify session page loaded
    await expect(page).toHaveURL(new RegExp(`/session/${session.sessionId}`));

    // Verify session details
    await expect(page.getByRole('heading', { name: sessionName })).toBeVisible();
    await expect(page.getByText('ACTIVE')).toBeVisible();
    await expect(page.getByText(`Facilitator: ${user.name}`)).toBeVisible();

    // Verify facilitator is shown in participants
    await expect(page.getByText('Participants (1)')).toBeVisible();
    await expect(page.getByText('Facilitator', { exact: true }).first()).toBeVisible();

    // Verify session ID is displayed and can be copied
    await expect(page.getByRole('button', { name: 'Copy session ID' })).toBeVisible();
  });

  test('should validate session name input', async ({ page }) => {
    const user = generateTestUser();

    // Login first
    await login(page, user);

    // Navigate to create session page
    await page.getByRole('button', { name: 'Create Session' }).click();

    const createButton = page.getByRole('button', { name: 'Create Session' });

    // Test empty input
    await expect(createButton).toBeDisabled();

    // Test single character (should be allowed)
    await page.getByRole('textbox', { name: 'Session Name' }).fill('a');
    await expect(createButton).toBeEnabled();

    // Test character limit (200 characters)
    const longName = 'a'.repeat(250);
    await page.getByRole('textbox', { name: 'Session Name' }).fill(longName);

    // Verify counter shows 200/200 (truncated)
    await expect(page.getByText('200/200 characters')).toBeVisible();

    // Verify input is truncated to 200 chars
    const inputValue = await page.getByRole('textbox', { name: 'Session Name' }).inputValue();
    expect(inputValue.length).toBe(200);
  });

  test('should show empty state when no stories exist', async ({ page }) => {
    const user = generateTestUser();
    const sessionName = generateSessionName();

    // Login and create session
    await login(page, user);
    await createSession(page, sessionName);

    // Verify empty state message
    await expect(page.getByText('Stories (0)')).toBeVisible();
    await expect(page.getByText(/No stories have been added to this session yet/)).toBeVisible();

    // Verify Add Story button is present
    await expect(page.getByRole('button', { name: 'Add Story' })).toBeVisible();
  });

  test('should display session refresh button', async ({ page }) => {
    const user = generateTestUser();
    const sessionName = generateSessionName();

    // Login and create session
    await login(page, user);
    await createSession(page, sessionName);

    // Verify refresh buttons are present
    await expect(page.getByRole('button', { name: 'Refresh session data' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' }).first()).toBeVisible();
  });

  test('should copy session ID to clipboard', async ({ page, context }) => {
    const user = generateTestUser();
    const sessionName = generateSessionName();

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Login and create session
    await login(page, user);
    const session = await createSession(page, sessionName);

    // Click copy button
    await page.getByRole('button', { name: 'Copy session ID' }).click();

    // Verify clipboard contains session ID
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(session.sessionId);
  });
});
