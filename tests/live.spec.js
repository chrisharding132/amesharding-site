// Smoke test against the published site. Run with: npx playwright test tests/live.spec.js --project=iphone-webkit
// LOCAL=1 serves src/ from this checkout in place of GitHub Pages: try a change on the real site before pushing.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.beforeEach(async ({ page }) => {
  if (!process.env.LOCAL) return;
  await page.route(/chrisharding132\.github\.io\/amesharding-site\/src\/[^?]+/, (route) => {
    const file = new URL(route.request().url()).pathname.split('/amesharding-site/')[1];
    route.fulfill({ body: readFileSync(new URL('../' + file, import.meta.url)),
      contentType: file.endsWith('.js') ? 'application/javascript' : 'image/png' });
  });
});

async function swipe(page, dy) {
  await page.evaluate((dy) => {
    const x = innerWidth / 2, y0 = innerHeight / 2, t = document.elementFromPoint(x, y0) || document.body;
    const mk = (y) => ({ identifier: 1, target: t, clientX: x, clientY: y, pageX: x, pageY: y });
    // WebKit forbids new Touch() from page script; paging.js only reads coordinates, so touch-shaped events suffice.
    const fire = (type, y) => {
      const e = new Event(type, { bubbles: true, cancelable: true });
      const list = type === 'touchend' ? [] : [mk(y)];
      Object.defineProperties(e, { touches: { value: list }, targetTouches: { value: list }, changedTouches: { value: [mk(y)] } });
      t.dispatchEvent(e);
    };
    fire('touchstart', y0); fire('touchmove', y0 + dy / 2); fire('touchmove', y0 + dy); fire('touchend', y0 + dy);
  }, dy);
}

test('live amesharding.com: paging, mood browser and player', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const hosted = [];
  page.on('response', (r) => { if (r.url().includes('github.io/amesharding-site')) hosted.push(r.status() + ' ' + r.url().split('/src/')[1]); });

  await page.goto('https://amesharding.com/', { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => !!(window.__amesPaging && window.__amesPaging.ready)), { timeout: 15000 }).toBe(true);
  const isPhone = await page.evaluate(() => document.documentElement.classList.contains('isphone'));
  await page.waitForTimeout(1500);
  await swipe(page, -300);
  const swipeInfo = await page.evaluate(() => JSON.stringify(window.__amesPaging.last));
  await expect(page, 'swipe: ' + swipeInfo).toHaveURL(/amesharding\.com\/2/, { timeout: 5000 });

  await expect(page.locator('#ames-mb .ames-light')).toHaveCount(28, { timeout: 15000 });
  await expect(page.locator('#ames-player .ames-group')).toHaveCount(2);
  await page.screenshot({ path: 'test-results/live-page2-' + test.info().project.name + '.png' });
  await page.locator('#ames-player .ames-fbtn', { hasText: /^Slow$/ }).click();
  await expect(page.locator('#ames-mb .ames-light:not(.hid)')).toHaveCount(5);
  await page.locator('#ames-player .ames-fbtn', { hasText: /^Slow$/ }).click();
  await page.locator('#ames-mb .ames-light').first().dispatchEvent('click');
  await expect(page.locator('#ames-player')).toHaveClass(/active/);
  const title = await page.locator('#ames-player .ames-title').textContent();
  await page.screenshot({ path: 'test-results/live-playing-' + test.info().project.name + '.png' });

  await swipe(page, 300);
  await expect(page).not.toHaveURL(/\/2/, { timeout: 5000 });
  console.log(JSON.stringify({ isPhone, title, hosted, errors }, null, 1));
});
