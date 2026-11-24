import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e',
  timeout: 45000,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:8017',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'python3 -m bld.server 8017',
    cwd: '..',
    url: 'http://127.0.0.1:8017',
    reuseExistingServer: false,
  },
  reporter: 'list',
});
