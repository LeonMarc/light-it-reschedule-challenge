import { defineConfig, devices } from '@playwright/test';
import { env, STORAGE_STATE } from './src/config/env';

/**
 * The patient's real context: Spanish (Argentina) locale and Buenos Aires
 * time zone (UTC-3). The time zone matters: the app shows dates one day early
 * west of UTC (BUG-02), and the `chromium-utc` project proves it.
 */
export default defineConfig({
  testDir: './tests',
  // All tests act on the same patient account: run them one at a time.
  fullyParallel: false,
  workers: 1,
  // The backend runs on serverless functions; one retry on CI absorbs cold starts.
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: env.baseUrl,
    locale: 'es-AR',
    timezoneId: 'America/Buenos_Aires',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      // Re-runs only the date display test in UTC, where it is expected to pass.
      name: 'chromium-utc',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE, timezoneId: 'UTC' },
      dependencies: ['setup'],
      grep: /@timezone/,
    },
  ],
});
