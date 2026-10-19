// Time-to-background on a throttled "fast 4G" phone. LIVE=1 npx playwright test tests/live-4g.spec.js --project=desktop-chromium
import { test, devices } from '@playwright/test';
const { defaultBrowserType, ...dev } = devices['iPhone 13'];
test.use(dev);
test('phone on 4G: time until page 1 background is painted', async ({ page }) => {
  test.setTimeout(90000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 170, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 });
  // SWAP_BG=<jpg> simulates the optimized background being uploaded
  if (process.env.SWAP_BG) await page.route(/image-02b4c83d-3e14-4d02-bacb-acb0fd6c588c/, (r) => r.fulfill({ path: process.env.SWAP_BG, contentType: 'image/jpeg' }));
  const t0 = Date.now();
  await page.goto('https://amesharding.com/', { waitUntil: 'commit' });
  const marks = {};
  await page.waitForFunction(() => document.querySelector('.rmwidget img, .rmwidget.text'), null, { timeout: 60000 }); marks.firstWidget = Date.now() - t0;
  // background painted = the shared background image (set by the <HEAD> snippet) has finished downloading
  await page.waitForFunction(() => performance.getEntriesByType('resource').some((e) => /bg-(portrait|landscape)\.jpg/.test(e.name) && e.responseEnd > 0),
    null, { timeout: 60000, polling: 100 });
  marks.background = Date.now() - t0;
  marks.totalKB = await page.evaluate(() => Math.round(performance.getEntriesByType('resource').reduce((a, e) => a + (e.transferSize || 0), 0) / 1024));
  console.log('4G', JSON.stringify(marks));
});
