// No black between or past pages; lights drift even with Reduce Motion.
// LIVE=1 [LOCAL=1] [CHROME_IOS=1] npx playwright test tests/live-pages.spec.js --project=iphone-webkit
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { PHONE } from './phones.js';
const { defaultBrowserType, ...dev } = PHONE;
test.use({ ...dev, reducedMotion: 'reduce' });

async function local(page) {
  if (!process.env.LOCAL) return;
  await page.route(/chrisharding132\.github\.io\/amesharding-site\/src\/[^?]+\.js/, (route) => {
    const file = new URL(route.request().url()).pathname.split('/amesharding-site/')[1];
    route.fulfill({ body: readFileSync(new URL('../' + file, import.meta.url)), contentType: 'application/javascript' });
  });
}
// flick, then sample screen coverage by visible pages every ~16ms for 1.2s
async function flickAndWatch(page, dy) {
  return page.evaluate(async (dy) => {
    const x = innerWidth / 2, y0 = innerHeight / 2, t = document.elementFromPoint(x, y0) || document.body;
    const fire = (type, y) => { const e = new Event(type, { bubbles: true, cancelable: true }); const pt = { identifier: 1, target: t, clientX: x, clientY: y };
      const l = type === 'touchend' ? [] : [pt]; Object.defineProperties(e, { touches: { value: l }, targetTouches: { value: l }, changedTouches: { value: [pt] } }); t.dispatchEvent(e); };
    const coverage = () => { let c = 0; document.querySelectorAll('.mag .page').forEach((p) => { if (getComputedStyle(p).visibility === 'hidden') return;
      const r = p.getBoundingClientRect(); c += Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)); }); return c / innerHeight; };
    fire('touchstart', y0); for (let i = 1; i <= 6; i++) { await new Promise((r) => setTimeout(r, 25)); fire('touchmove', y0 + dy * i / 6); } fire('touchend', y0 + dy);
    let worst = 1; for (let i = 0; i < 75; i++) { await new Promise((r) => requestAnimationFrame(r)); worst = Math.min(worst, coverage()); }
    return { worst: +worst.toFixed(3), y: Math.round(scrollY), page: RM.viewerRouter.mag.currentPage.num };
  }, dy);
}

test('flicking through every page and past the ends never shows black', async ({ page }) => {
  test.setTimeout(90000);
  await local(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('https://amesharding.com/');
  await page.waitForFunction(() => window.__amesPaging && window.__amesPaging.goTo, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  const top5 = () => page.evaluate(() => Math.round(document.querySelectorAll('.mag .page')[4].getBoundingClientRect().top));
  const log = [];
  for (let i = 0; i < 4; i++) log.push(['down', await flickAndWatch(page, -260)]);
  log.push(['past 5', await flickAndWatch(page, -260)]);
  log.push(['past 5 again', await flickAndWatch(page, -400)]);
  const atEnd = log[log.length - 1][1];
  expect(Math.abs(await top5()), 'page 5 sits exactly in view after pushing past it').toBeLessThan(3);
  for (let i = 0; i < 4; i++) log.push(['up', await flickAndWatch(page, 260)]);
  console.log('PAGES', JSON.stringify(log));
  for (const [what, r] of log) expect(r.worst, `${what} -> page ${r.page}: lowest screen coverage`).toBeGreaterThanOrEqual(0.98);
  expect(atEnd.page).toBe(5);
  // (checked right after the 'past 5 again' flick above; re-check now we're back at page 1 is meaningless)
  expect(log[log.length - 1][1].page).toBe(1);
});

test('lights still drift with Reduce Motion on', async ({ page }) => {
  await local(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('https://amesharding.com/2');
  await expect(page.locator('#ames-mb .ames-stage.on')).toBeVisible({ timeout: 20000 });
  const r = await page.evaluate(() => ({ reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    names: getComputedStyle(document.querySelector('#ames-mb .ames-light')).animationName,
    offsets: [...document.querySelectorAll('#ames-mb .ames-light')].map((e) => { const [x, y] = getComputedStyle(e).translate.split(' ').map(parseFloat); return Math.hypot(x || 0, y || 0); }) }));
  expect(r.reduce).toBe(true);
  expect(r.names).toContain('ames-float-soft');
  expect(Math.max(...r.offsets), 'some lights away from home').toBeGreaterThan(1.5);
});
