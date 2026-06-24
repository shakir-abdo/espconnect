import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --config vite.e2e.config.js --port 4173 --strictPort --host localhost',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_E2E: '1',
    },
  },
});
