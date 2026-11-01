import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  // Timing flakes happen when several tests share one dev server; retry on CI only.
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  use: { baseURL: 'http://localhost:5173', headless: true },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
