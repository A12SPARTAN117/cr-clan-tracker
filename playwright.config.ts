import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/**
 * UI tests in a real browser against the dev server (reused if one is already running).
 * Uses the installed Chrome (per-user install on Windows) or Edge, so no browser download.
 * Override with E2E_BASE_URL or PW_BROWSER_PATH.
 */
const local = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe') : '';
const executablePath = process.env.PW_BROWSER_PATH || (local && fs.existsSync(local) ? local : undefined);
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 2,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : undefined,
    channel: executablePath ? undefined : 'msedge',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1366, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' }, testMatch: /smoke\.spec\.ts/ },
  ],
  webServer: { command: 'npm run dev', url: baseURL, reuseExistingServer: true, timeout: 180_000 },
});
