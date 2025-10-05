import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for Censeo integration tests
 */

export interface LoginCredentials {
  name: string;
  email: string;
}

export interface SessionInfo {
  sessionId: string;
  sessionName: string;
}

/**
 * Login to the application
 */
export async function login(page: Page, credentials: LoginCredentials): Promise<void> {
  await page.goto('/');

  // Fill in login form
  await page.getByRole('textbox', { name: 'Name' }).fill(credentials.name);
  await page.getByRole('textbox', { name: 'Email' }).fill(credentials.email);

  // Submit form
  await page.getByTestId('login-form').getByRole('button', { name: 'Login' }).click();

  // Wait for login to complete
  await expect(page.getByText(`Welcome, ${credentials.name}`)).toBeVisible();
}

/**
 * Create a new session and return session info
 */
export async function createSession(page: Page, sessionName: string): Promise<SessionInfo> {
  // Navigate to create session page
  await page.getByRole('button', { name: 'Create Session' }).click();

  // Fill in session name
  await page.getByRole('textbox', { name: 'Session Name' }).fill(sessionName);

  // Submit form
  await page.getByRole('button', { name: 'Create Session' }).click();

  // Wait for redirect to session page
  await page.waitForURL(/\/session\/.+/);

  // Extract session ID from URL
  const url = page.url();
  const sessionId = url.split('/session/')[1];

  // Verify session was created
  await expect(page.getByRole('heading', { name: sessionName })).toBeVisible();

  return {
    sessionId,
    sessionName
  };
}

/**
 * Add a story to the current session
 */
export async function addStory(page: Page, storyTitle: string, description?: string): Promise<void> {
  // Click Add Story button
  await page.getByRole('button', { name: 'Add Story' }).click();

  // Fill in story details
  await page.getByRole('textbox', { name: 'Title' }).fill(storyTitle);

  if (description) {
    await page.getByRole('textbox', { name: 'Description' }).fill(description);
  }

  // Submit form
  await page.getByRole('button', { name: 'Create Story' }).click();

  // Wait for story to appear in the list
  await expect(page.getByText(storyTitle)).toBeVisible();
}

/**
 * Vote on the current story
 */
export async function vote(page: Page, points: number | string): Promise<void> {
  // Click the vote button with the specified points
  const voteButton = page.getByRole('button', { name: String(points), exact: true });
  await voteButton.click();

  // Verify vote was recorded (implementation depends on your UI)
  // This might need to be adjusted based on how your app shows vote confirmation
  await page.waitForTimeout(500); // Brief wait for vote to register
}

/**
 * Reveal votes (facilitator only)
 */
export async function revealVotes(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Reveal Votes' }).click();

  // Wait for votes to be revealed
  await expect(page.getByText(/votes revealed/i)).toBeVisible();
}

/**
 * Generate a random test user
 */
export function generateTestUser(): LoginCredentials {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`
  };
}

/**
 * Generate a random session name
 */
export function generateSessionName(): string {
  const timestamp = Date.now();
  return `Test Session ${timestamp}`;
}

/**
 * Wait for element to be visible with custom timeout
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}
