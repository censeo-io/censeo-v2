import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Censeo integration tests
 *
 * These tests verify the full stack (frontend + backend + database) working together.
 * Tests run against Docker containers, so ensure `docker-compose up` is running first.
 */
export default defineConfig({
  testDir: './e2e',

  // Global setup runs once before all tests
  globalSetup: require.resolve('./e2e/global-setup.ts'),

  // Test timeout
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests for now (can enable later)
  workers: process.env.CI ? 1 : 1,

  // Reporter to use
  reporter: process.env.CI ? 'github' : 'list',

  // Shared settings for all the projects below
  use: {
    // Base URL for the app
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Optionally test on other browsers (disabled for now to speed up tests)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Web server configuration - assumes Docker Compose is already running
  // If you want Playwright to start services, uncomment and configure this:
  // webServer: {
  //   command: 'docker-compose up',
  //   url: 'http://localhost:3000',
  //   timeout: 120 * 1000,
  //   reuseExistingServer: !process.env.CI,
  // },
});
