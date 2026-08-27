import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: '/tmp/sochipark-playwright-results',
  timeout: 30_000,
  fullyParallel: false,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
