// Filmstrip of the first 4s on throttled 4G. HEAD_BG=1 injects the proposed <head> background style.
import { test, devices } from '@playwright/test';
const { defaultBrowserType, ...dev } = devices['iPhone 13'];
test.use(dev);
// stands in for changing each page's background colour in Readymag from white to the image's purple
const STYLE = '<style>.widget-background,.widget-background>div:not(.picture-background){background-color:#7a6485!important}</style>';
test('4G filmstrip', async ({ page }) => {
  test.setTimeout(60000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 170, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 });
  if (process.env.HEAD_BG) await page.route('https://amesharding.com/', async (route) => {
    const res = await route.fetch(); const html = await res.text();
    route.fulfill({ response: res, body: html.replace('<head>', '<head>' + STYLE) });
  });
  if (process.env.SWAP_BG) await page.route(/image-02b4c83d-3e14-4d02-bacb-acb0fd6c588c/, (r) => r.fulfill({ path: process.env.SWAP_BG, contentType: 'image/jpeg' }));
  const tag = (process.env.HEAD_BG ? 'purple' : 'now') + (process.env.SWAP_BG ? '+jpg' : '');
  const t0 = Date.now();
  await page.goto('https://amesharding.com/', { waitUntil: 'commit' });
  for (const ms of [600, 1200, 2000, 2800, 3600, 4500]) {
    const wait = ms - (Date.now() - t0); if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: `audit-results/film-${tag}-${ms}.png` });
  }
});
