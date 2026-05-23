import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration. See ADR-015 and docs/testing.md.
 *
 * webServer launches the same static-serve command contributors run locally
 * (python3 -m http.server --directory source) so local and CI behavior match.
 * Specs live in e2e/ so the Playwright glob never overlaps the Jasmine glob
 * (source/tests/**\/*.test.js).
 *
 * All three browser projects are declared so contributors can run them
 * locally; CI currently runs Chromium only (npx playwright test --project=chromium).
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.js',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github'], ['list']]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'python3 -m http.server --directory source 8000',
    url: 'http://localhost:8000/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
