// The phone map must keep its height + tall labels however you arrive at page 2 and when the browser bar hides.
// LIVE=1 [LOCAL=1] npx playwright test tests/live-viewport.spec.js --project=iphone-webkit
import { test, expect, devices } from '@playwright/test';
import { PHONE } from './phones.js';
import { readFileSync } from 'node:fs';
const { defaultBrowserType, ...dev } = PHONE;
test.use(dev);

test.beforeEach(async ({ page }) => {
  if (process.env.LOCAL) await page.route(/chrisharding132\.github\.io\/amesharding-site\/src\/[^?]+/, (route) => {
    const file = new URL(route.request().url()).pathname.split('/amesharding-site/')[1];
    route.fulfill({ body: readFileSync(new URL('../' + file, import.meta.url)), contentType: file.endsWith('.js') ? 'application/javascript' : 'image/png' });
  });
});

async function check(page, label) {
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => {
    const b = document.getElementById('ames-mb'), L = b._layout;
    const shown = [...b.querySelectorAll('.ames-labels')].find((i) => getComputedStyle(i).display !== 'none');
    return { H: L.H, HB: L.HB, labels: shown && shown.classList.contains('p') ? 'portrait' : 'landscape' };
  });
  await page.screenshot({ path: `audit-results/viewport-${label}.png` });
  const slivers = await page.evaluate(() => [...document.querySelectorAll('.mag .page:not(.center-page)')].filter((p) => {
    const r = p.getBoundingClientRect(); return getComputedStyle(p).visibility !== 'hidden' && r.bottom > 1 && r.top < innerHeight - 1; }).length);
  expect(slivers, label + ' neighbouring pages visible at rest').toBe(0);
  expect(r.labels, label).toBe('portrait');
  expect(r.H / r.HB, label + ' map height kept').toBeGreaterThan(0.8);
}
const go = (page, fn) => page.evaluate(fn);

test('arrive at page 2 from page 3', async ({ page }) => {
  await page.goto('https://amesharding.com/3');
  await page.waitForFunction(() => window.__amesPaging && window.__amesPaging.ready, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await go(page, () => RM.viewerRouter.mag.goPrevPage());
  await expect(page).toHaveURL(/\/2/);
  await page.locator('#ames-mb .ames-stage.on').waitFor({ timeout: 20000 });
  await check(page, 'from-p3');
});

test('arrive at page 2 from page 1', async ({ page }) => {
  await page.goto('https://amesharding.com/');
  await page.waitForFunction(() => window.__amesPaging && window.__amesPaging.ready, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await go(page, () => RM.viewerRouter.mag.goNextPage());
  await expect(page).toHaveURL(/\/2/);
  await check(page, 'from-p1');
});

test('browser bar hides and shows on page 2', async ({ page }) => {
  await page.goto('https://amesharding.com/2');
  await page.locator('#ames-mb .ames-stage.on').waitFor({ timeout: 20000 });
  await page.setViewportSize({ width: 390, height: 750 });   // bar hidden
  await check(page, 'bar-hidden');
  await page.setViewportSize({ width: 390, height: 664 });   // bar back
  await check(page, 'bar-shown');
});
