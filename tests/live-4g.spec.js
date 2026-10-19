// Time-to-background on a throttled "fast 4G" phone. LIVE=1 npx playwright test tests/live-4g.spec.js --project=desktop-chromium
import { test, devices } from '@playwright/test';
const { defaultBrowserType, ...dev } = devices['iPhone 13'];
test.use(dev);
test('phone on 4G: time until page 1 background is painted', async ({ page }) => {
  test.setTimeout(90000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 170, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 });
  const t0 = Date.now();
  await page.goto('https://amesharding.com/', { waitUntil: 'commit' });
  const marks = {};
  await page.waitForFunction(() => document.querySelector('.rmwidget img, .rmwidget.text'), null, { timeout: 60000 }); marks.firstWidget = Date.now() - t0;
  await page.waitForFunction(() => {
    const bg = document.querySelector('.page.center-page .widget-background .picture-background');
    if (!bg) return false;
    const u = (/url\("?([^")]+)/.exec(getComputedStyle(bg).backgroundImage) || [])[1];
    return u && performance.getEntriesByName(u).some((e) => e.responseEnd > 0);
  }, null, { timeout: 60000, polling: 100 });
  marks.background = Date.now() - t0;
  marks.totalKB = await page.evaluate(() => Math.round(performance.getEntriesByType('resource').reduce((a, e) => a + (e.transferSize || 0), 0) / 1024));
  console.log('4G', JSON.stringify(marks));
});
