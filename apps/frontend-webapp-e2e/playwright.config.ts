import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  /* Shared settings for all the projects below. */
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  /* Retries for CI environments */
  retries: process.env['CI'] ? 2 : 0,
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npx nx serve frontend-webapp',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    cwd: workspaceRoot,
    timeout: 300 * 1000, // 5 minutes for startup
  },
  /* Only run chromium for faster tests */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /* Increase test timeout */
  timeout: 60 * 1000,
  expect: {
    timeout: 15 * 1000,
  },
});
