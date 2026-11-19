// Live navigation feel. LIVE=1 [LOCAL=1] npx playwright test tests/live-nav.spec.js
import { test, expect, devices } from './mute.js';
import { PHONE } from './phones.js';
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
  const { defaultBrowserType, ...dev } = PHONE;
  test.use(dev);
  test('one page at a time: holding stays put, flicks and drags turn the page', async ({ page }) => {
    test.setTimeout(60000);
    await local(page);
    // from page 2 (page 1 is the landing page: it moves on by itself and can't be scrolled back to)
    await page.goto('https://amesharding.com/2/');
    await page.waitForFunction(() => window.__amesPaging && window.__amesPaging.ready && window.__amesPaging.goTo, null, { timeout: 20000 });
    await page.waitForTimeout(1500);
    const top = () => page.evaluate(() => Math.round(document.querySelectorAll('.mag .page')[window.__amesPaging.cur() - 1].getBoundingClientRect().top));
    const at = () => page.evaluate(() => window.__amesPaging.cur());
    // mid-drag: the page stays where it is (only its content leans a little); no other page comes into view
    const s0 = await page.evaluate(() => scrollY);
    const midScroll = await drag(page, -200, 240, false);
    expect(Math.abs(midScroll - s0), 'page stays put while the finger is down').toBeLessThan(2);
    await page.evaluate(() => window.dispatchEvent(Object.assign(new Event('touchend'), {})) );
    await page.waitForTimeout(500);
    // short slow drag: stays on page 2
    await drag(page, -50, 600);
    await page.waitForTimeout(700);
    expect(await at(), 'short slow drag stays').toBe(2);
    expect(Math.abs(await top()), 'still exactly in place').toBeLessThan(3);
    // quick short flick: next page
    await drag(page, -70, 60);
    await expect(page).toHaveURL(/\/3\/?$/, { timeout: 3000 });
    await page.waitForTimeout(600);
    expect(Math.abs(await top()), 'lands exactly on page 3').toBeLessThan(3);
    // long drag down: back to 2, and no further (page 2 is the top)
    await drag(page, 300, 400);
    await page.waitForTimeout(900);
    await expect(page).toHaveURL(/\/2\/?$/);
    await drag(page, 300, 400);
    await page.waitForTimeout(900);
    await expect(page).toHaveURL(/\/2\/?$/);
  });
});

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.skip(({ browserName }) => browserName === 'webkit', 'mobile WebKit has no mouse wheel');
  test('one page per wheel / trackpad gesture, content glides in', async ({ page }) => {
    test.setTimeout(60000);
    await local(page);
    await page.goto('https://amesharding.com/2/');
    await page.waitForFunction(() => window.__amesPaging && window.__amesPaging.ready && window.__amesPaging.goTo, null, { timeout: 20000 });
    await page.waitForTimeout(1500);
    const cur = () => page.evaluate(() => RM.viewerRouter.mag.currentPage.num);
    await page.mouse.move(720, 450);
    // trackpad gesture with a long coasting tail: exactly one page
    for (let i = 0; i < 45; i++) { await page.mouse.wheel(0, i < 8 ? 28 : Math.max(1, 28 - i)); await page.waitForTimeout(16); }
    const anims = await page.evaluate(() => window.__amesPaging.arrivals || 0);
    await page.waitForTimeout(400);
    expect(await cur(), 'one trackpad gesture = one page').toBe(3);
    // a second gesture after a pause: one more page
    await page.waitForTimeout(300);
    for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, 24); await page.waitForTimeout(16); }
    await page.waitForTimeout(500);
    expect(await cur()).toBe(4);
    // one mouse-wheel notch back
    await page.waitForTimeout(300);
    await page.mouse.wheel(0, -100); await page.waitForTimeout(500);
    expect(await cur()).toBe(3);
    expect(anims, 'content glide-in ran on page arrival').toBeGreaterThanOrEqual(1);
    console.log('NAV desktop arrivals animated:', await page.evaluate(() => window.__amesPaging.arrivals));
  });
});
