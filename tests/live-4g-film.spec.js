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
  // FIXHEAD=1: serve the published page with readymag/head-code.html in place of the published head snippet
  if (process.env.FIXHEAD) {
    const HEAD = (await import('node:fs')).readFileSync(new URL('../readymag/head-code.html', import.meta.url), 'utf8');
    await page.route('https://amesharding.com/', async (route) => {
      const res = await route.fetch(); const html = await res.text();
      route.fulfill({ response: res, body: html.replace(/<!-- AMES HARDING \u2014 SHARED BACKGROUND[\s\S]*?<\/style>\s*/, '').replace('<head>', '<head>' + HEAD) });
    });
  }
  if (process.env.SWAP_BG) await page.route(/image-02b4c83d-3e14-4d02-bacb-acb0fd6c588c/, (r) => r.fulfill({ path: process.env.SWAP_BG, contentType: 'image/jpeg' }));
  const t0 = Date.now();
  const reqs = [];
  page.on('requestfinished', (rq) => { if (/bg-(portrait|landscape)/.test(rq.url())) reqs.push(['done', Date.now() - t0]); });
  page.on('request', (rq) => { if (/bg-(portrait|landscape)/.test(rq.url())) reqs.push(['start', Date.now() - t0, rq.url().split('/').pop()]); });
  const tag = (process.env.HEAD_BG ? 'purple' : process.env.FIXHEAD ? 'fixed' : 'now') + (process.env.SWAP_BG ? '+jpg' : '');
  await page.goto('https://amesharding.com/', { waitUntil: 'commit' });
  for (const ms of (process.env.LONG ? [1200, 3000, 4500, 6000, 8000, 10000] : [600, 1200, 2000, 2800, 3600, 4500])) {
    const wait = ms - (Date.now() - t0); if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: `audit-results/film-${tag}-${ms}.png` });
  }
  console.log('REQS', JSON.stringify(reqs));
});
