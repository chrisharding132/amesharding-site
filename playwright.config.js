import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests',
  timeout: 20000,
  use: { baseURL: 'http://127.0.0.1:8787' },
  webServer: { command: 'python3 -m http.server 8787 --bind 127.0.0.1', url: 'http://127.0.0.1:8787/tests/harness.html', reuseExistingServer: true },
  projects: [
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'] } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
  ],
});
