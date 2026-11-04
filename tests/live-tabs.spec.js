// Tab icon + tab names on the published site, and the very first paint is purple, not white.
// LIVE=1 npx playwright test tests/live-tabs.spec.js --project=desktop-chromium
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

test('AH icon, a title per page, purple first frame', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('https://amesharding.com/', { waitUntil: 'commit' });
  await page.waitForSelector('body', { state: 'attached' });   // the <head> has been read: the first paint can happen now
  const first = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  await page.waitForFunction(() => window.RM && RM.viewerRouter && RM.viewerRouter.mag && document.getElementById('ames-h1'));
  await page.waitForTimeout(1000);
  const icons = await page.evaluate(async () => {
    const links = [...document.querySelectorAll('link[rel*="icon"]')];
    return Promise.all(links.map(async (l) => ({ rel: l.rel, href: l.href, ok: (await fetch(l.href)).ok })));
  });
  const titles = [await page.title()];
  for (let n = 2; n <= 5; n++) {
    await page.evaluate(() => RM.viewerRouter.mag.goNextPage());
    await page.waitForTimeout(900);
    titles.push(await page.title());
  }
  console.log('TABS', JSON.stringify({ first, icons, titles }));
  expect(first, 'first frame').toBe('rgb(122, 100, 133)');
  expect(icons.length, 'three AH icons, nothing else').toBe(3);
  for (const i of icons) { expect(i.href).toContain('/assets/icon-'); expect(i.ok).toBe(true); }
  expect(new Set(titles).size, 'each page has its own tab name').toBe(5);
  for (const t of titles) expect(t).toContain('Ames Harding');
});
