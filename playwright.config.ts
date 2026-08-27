import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: '/tmp/sochipark-playwright-results',
  timeout: 30_000,
  fullyParallel: false,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      testIgnore: /mobile-webkit\.spec\.ts/,
      use: { channel: 'chrome' },
    },
    {
      name: 'mobile-webkit',
      testMatch: /mobile-webkit\.spec\.ts/,
      use: {
        browserName: 'webkit',
        viewport: { width: 440, height: 956 },
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
