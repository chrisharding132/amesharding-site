import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests',
  // tests/live.spec.js hits the published site: run it with  LIVE=1 npx playwright test tests/live.spec.js --project=iphone-webkit
  testIgnore: process.env.LIVE ? [] : ['**/live*.spec.js'],
  timeout: 20000,
  use: { baseURL: 'http://127.0.0.1:8787' },
  webServer: { command: 'python3 -m http.server 8787 --bind 127.0.0.1', url: 'http://127.0.0.1:8787/tests/harness.html', reuseExistingServer: true },
  projects: [
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'] } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    // Chrome on iPhone: WebKit with Chrome's user agent and smaller visible area
    { name: 'chrome-ios-webkit', use: { ...devices['iPhone 13'], viewport: { width: 402, height: 684 }, reducedMotion: 'reduce',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1' } },
  ],
});
