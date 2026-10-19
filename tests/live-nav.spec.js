// Live navigation feel. LIVE=1 [LOCAL=1] npx playwright test tests/live-nav.spec.js
import { test, expect, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function local(page) {
  if (!process.env.LOCAL) return;
  await page.route(/chrisharding132\.github\.io\/amesharding-site\/src\/[^?]+\.js/, (route) => {
    const file = new URL(route.request().url()).pathname.split('/amesharding-site/')[1];
    route.fulfill({ body: readFileSync(new URL('../' + file, import.meta.url)), contentType: 'application/javascript' });
  });
}
// touch-shaped events with real time between them (WebKit forbids new Touch() from page script)
async function drag(page, dy, ms, release = true) {
  return page.evaluate(async ({ dy, ms, release }) => {
    const x = innerWidth / 2, y0 = innerHeight / 2, t = document.elementFromPoint(x, y0) || document.body, steps = 8;
    const fire = (type, y) => { const e = new Event(type, { bubbles: true, cancelable: true }); const pt = { identifier: 1, target: t, clientX: x, clientY: y };
      const l = type === 'touchend' ? [] : [pt]; Object.defineProperties(e, { touches: { value: l }, targetTouches: { value: l }, changedTouches: { value: [pt] } }); t.dispatchEvent(e); };
    fire('touchstart', y0);
    for (let i = 1; i <= steps; i++) { await new Promise((r) => setTimeout(r, ms / steps)); fire('touchmove', y0 + (dy * i) / steps); }
    if (release) fire('touchend', y0 + dy);
    return scrollY;
  }, { dy, ms, release });
}

test.describe('phone', () => {
  const { defaultBrowserType, ...dev } = devices['iPhone 13'];
  test.use(dev);
  test('page follows the finger, springs back, flicks and drags turn the page', async ({ page }) => {
    test.setTimeout(60000);
    await local(page);
    await page.goto('https://amesharding.com/');
    await page.waitForFunction(() => window.__amesPaging && window.__amesPaging.ready && window.__amesPaging.goTo, null, { timeout: 20000 });
    await page.waitForTimeout(1200);
    const H = await page.evaluate(() => document.querySelector('.mag .page').offsetHeight);
    // mid-drag: the page has moved with the finger
    const midScroll = await drag(page, -200, 240, false);
    expect(midScroll, 'page follows finger').toBeGreaterThan(150);
    await page.evaluate(() => window.dispatchEvent(Object.assign(new Event('touchend'), {})) );
    // short slow drag: springs back to page 1
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
    await drag(page, -60, 600);
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => scrollY), 'short slow drag springs back').toBeLessThan(5);
    // quick short flick: next page
    await drag(page, -70, 60);
    await expect(page).toHaveURL(/\/2\/?$/, { timeout: 3000 });
    await page.waitForTimeout(600);
    expect(Math.abs((await page.evaluate(() => scrollY)) - H), 'lands exactly on page 2').toBeLessThan(3);
    // long drag down: back to page 1
    await drag(page, 300, 400);
    await expect(page).toHaveURL(/amesharding\.com\/?$/, { timeout: 3000 });
  });
});

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.skip(({ browserName }) => browserName === 'webkit', 'mobile WebKit has no mouse wheel');
  test('one page per wheel / trackpad gesture, content glides in', async ({ page }) => {
    test.setTimeout(60000);
    await local(page);
    await page.goto('https://amesharding.com/');
    await page.waitForFunction(() => window.__amesPaging && window.__amesPaging.ready && window.__amesPaging.goTo, null, { timeout: 20000 });
    await page.waitForTimeout(1500);
    const cur = () => page.evaluate(() => RM.viewerRouter.mag.currentPage.num);
    await page.mouse.move(720, 450);
    // trackpad gesture with a long coasting tail: exactly one page
    for (let i = 0; i < 45; i++) { await page.mouse.wheel(0, i < 8 ? 28 : Math.max(1, 28 - i)); await page.waitForTimeout(16); }
    const anims = await page.evaluate(() => window.__amesPaging.arrivals || 0);
    await page.waitForTimeout(400);
    expect(await cur(), 'one trackpad gesture = one page').toBe(2);
    // a second gesture after a pause: one more page
    await page.waitForTimeout(300);
    for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, 24); await page.waitForTimeout(16); }
    await page.waitForTimeout(500);
    expect(await cur()).toBe(3);
    // one mouse-wheel notch back
    await page.waitForTimeout(300);
    await page.mouse.wheel(0, -100); await page.waitForTimeout(500);
    expect(await cur()).toBe(2);
    expect(anims, 'content glide-in ran on page arrival').toBeGreaterThanOrEqual(1);
    console.log('NAV desktop arrivals animated:', await page.evaluate(() => window.__amesPaging.arrivals));
  });
});
