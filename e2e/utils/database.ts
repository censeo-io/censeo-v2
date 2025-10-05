/**
 * Database utilities for test setup and cleanup
 *
 * These utilities help ensure each test starts with a clean database state.
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

/**
 * Reset the database to a clean state
 *
 * This calls a Django management command to flush the database.
 * Requires the backend container to be running.
 */
export async function resetDatabase(): Promise<void> {
  try {
    // Note: This assumes you have a custom management command or API endpoint
    // for database reset. You may need to implement this in your backend.
    //
    // Example Django management command:
    // python manage.py flush --no-input
    //
    // For now, this is a placeholder that you'll need to implement based on
    // your backend setup.

    console.log('Database reset requested - implement backend endpoint or use Docker exec');

    // Option 1: Call a custom API endpoint (if you implement one)
    // const response = await fetch(`${API_BASE_URL}/api/test/reset-database/`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    // });
    // if (!response.ok) {
    //   throw new Error('Database reset failed');
    // }

    // Option 2: Use Docker exec (shown in fixtures below)
    // This is handled in the test setup via global-setup.ts
  } catch (error) {
    console.error('Database reset failed:', error);
    throw error;
  }
}

/**
 * Create a test user via API
 */
export async function createTestUser(name: string, email: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create test user: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Delete all sessions (cleanup)
 */
export async function cleanupSessions(): Promise<void> {
  try {
    // This would call a cleanup endpoint if you implement one
    console.log('Session cleanup - implement if needed');
  } catch (error) {
    console.error('Session cleanup failed:', error);
  }
}
