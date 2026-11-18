// Exhaustive navigation check of the published site (LOCAL=1: with the local code).
// Desktop: Chrome + Safari engines, 5 window sizes, trackpad / mouse wheel / keys / rail / links.
// Phones: Chrome's touch emulation at 6 sizes (swipes, flicks, double swipes, links, address bar), plus WebKit.
//   LIVE=1 npx playwright test tests/live-exhaustive.spec.js --project=desktop-chromium --project=desktop-webkit
//   LIVE=1 CHROME_IOS=1 npx playwright test tests/live-exhaustive.spec.js --project=iphone-webkit --project=chrome-ios-webkit
import { test, expect } from './mute.js';
import { readFileSync } from 'node:fs';

const SITE = 'https://amesharding.com/';
async function local(page) {
  if (!process.env.LOCAL) return;
  await page.route(/chrisharding132\.github\.io\/amesharding-site\/src\/[^?]+\.(js|png)/, (route) => {
    const file = new URL(route.request().url()).pathname.split('/amesharding-site/')[1];
    route.fulfill({ body: readFileSync(new URL('../' + file, import.meta.url)), contentType: file.endsWith('js') ? 'application/javascript' : 'image/png', headers: { 'access-control-allow-origin': '*' } });
  });
}
function errors(page) {
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource|ERR_BLOCKED|google|facebook|tracking|minimal-ui/i.test(m.text())) errs.push(m.text().slice(0, 160)); });
  return errs;
}

// What is actually on screen: which pages can be seen, and whether the current one shows its content.
const screenState = (page) => page.evaluate(() => {
  const ps = [...document.querySelectorAll('.mag .page')];
  const rm = RM.viewerRouter.mag.currentPage.num;
  const cur = window.__amesPaging.cur ? window.__amesPaging.cur() : rm;
  const visible = ps.map((p, i) => {
    const r = p.getBoundingClientRect();
    const onScreen = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    return getComputedStyle(p).visibility !== 'hidden' && onScreen > innerWidth * innerHeight * 0.02 ? i + 1 : 0;
  }).filter(Boolean);
  const p = ps[rm - 1], c = p && p.querySelector('.page-content-container');
  const widgets = p ? [...p.querySelectorAll('.rmwidget')].filter((w) => {
    if (w.classList.contains('widget-background')) return false;
    const r = w.getBoundingClientRect();
    return r.width > 4 && r.height > 4 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight && getComputedStyle(w).visibility !== 'hidden';
  }).length : 0;
  const pr = p ? p.getBoundingClientRect() : { top: NaN, left: NaN };
  return { phone: document.documentElement.classList.contains('isphone'), rm, cur, visible, widgets, opacity: c ? +getComputedStyle(c).opacity : -1, translate: c ? getComputedStyle(c).translate : '', top: Math.round(pr.top), left: Math.round(pr.left), title: document.title };
});
// the current page is fully in place and showing its content, and no other page is on screen
async function expectShowing(page, n, label) {
  let s;
  await page.waitForFunction(() => window.__amesPaging && window.__amesPaging.ready && window.RM && RM.viewerRouter && RM.viewerRouter.mag, null, { timeout: 15000 });
  for (let k = 0; k < 20; k++) {        // up to 2s for the arrival animation to finish
    s = await screenState(page);
    if (s.rm === n && (!s.phone || s.cur === n) && s.opacity > 0.99 && s.widgets > 0 && s.visible.length === 1 && s.visible[0] === n && Math.abs(s.top) <= 1 && Math.abs(s.left) <= 1) break;
    await page.waitForTimeout(100);
  }
  // phones also keep their own page count (desktop doesn't use it)
  const ok = s.rm === n && (!s.phone || s.cur === n) && s.opacity > 0.99 && s.widgets > 0 && s.visible.length === 1 && s.visible[0] === n && Math.abs(s.top) <= 1 && Math.abs(s.left) <= 1;
  if (!ok) console.log('BAD', label, JSON.stringify(s));
  expect.soft(ok, `${label}: page ${n} fully showing (got ${JSON.stringify(s)})`).toBe(true);
  return s;
}

// ---------------- desktop ----------------
const DESKTOP = [[1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440]];
// a macOS trackpad flick: a push that builds, then a long coast that fades; frames can arrive merged (Chrome coalesces)
async function trackpad(page, dir, { strength = 45, merge = false } = {}) {
  const deltas = [6, 14, 26, 38, strength, strength * 0.9];
  let d = strength * 0.9;
  while (d > 0.6) { d *= 0.93; deltas.push(d); }
  for (let i = 0; i < deltas.length; i++) {
    let v = deltas[i];
    if (merge && i % 7 === 3 && i + 1 < deltas.length) { v += deltas[i + 1]; i++; }   // two frames in one event
    await page.mouse.wheel(0, dir * Math.max(1, Math.round(v)));
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(450);
}
async function notch(page, dir, n = 1) {
  for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dir * 100); await page.waitForTimeout(40); }
  await page.waitForTimeout(700);
}

test.describe('desktop', () => {
  test.beforeEach(({}, i) => { test.skip(!i.project.name.startsWith('desktop')); });
  for (const [w, h] of DESKTOP) {
    test(`desktop ${w}x${h}`, async ({ page, browserName }) => {
      test.setTimeout(240000);
      await page.setViewportSize({ width: w, height: h });
      await local(page);
      const errs = errors(page);
      // every page by its link
      for (let n = 1; n <= 5; n++) {
        await page.goto(SITE + (n > 1 ? n + '/' : ''));
        await page.waitForTimeout(2500);
        await expectShowing(page, n, `${browserName} ${w}x${h} link /${n}/`);
        await page.screenshot({ path: `audit-results/ex-desk-${browserName}-${w}-p${n}.png` });
      }
      // page 1 moves on to the map by itself
      await page.goto(SITE);
      await page.waitForFunction(() => window.RM && RM.viewerRouter.mag.currentPage.num === 2, null, { timeout: 12000 });
      await expectShowing(page, 2, `${browserName} ${w}x${h} landing moves on`);
      await page.mouse.move(w / 2, h / 2);
      // trackpad, clean and with merged frames: exactly one page per flick, down and back up (up stops at page 2)
      for (const merge of [false, true]) {
        for (let n = 3; n <= 5; n++) { await trackpad(page, 1, { merge }); await expectShowing(page, n, `${browserName} ${w}x${h} trackpad${merge ? '+merged' : ''} down to ${n}`); }
        await trackpad(page, 1, { merge }); await expectShowing(page, 5, `${browserName} ${w}x${h} trackpad past the end`);
        for (let n = 4; n >= 2; n--) { await trackpad(page, -1, { merge }); await expectShowing(page, n, `${browserName} ${w}x${h} trackpad${merge ? '+merged' : ''} up to ${n}`); }
        await trackpad(page, -1, { merge }); await expectShowing(page, 2, `${browserName} ${w}x${h} trackpad stops at page 2`);
      }
      // a hard flick, then a second flick straight after
      await trackpad(page, 1, { strength: 120 }); await expectShowing(page, 3, `${browserName} ${w}x${h} hard flick`);
      await trackpad(page, 1); await trackpad(page, 1);
      await expectShowing(page, 5, `${browserName} ${w}x${h} two flicks in a row`);
      // mouse wheel: one notch = one page; a quick spin of 3 notches = one page
      await notch(page, -1); await expectShowing(page, 4, `${browserName} ${w}x${h} mouse notch up`);
      await notch(page, 1); await expectShowing(page, 5, `${browserName} ${w}x${h} mouse notch down`);
      await notch(page, -1, 3); await expectShowing(page, 4, `${browserName} ${w}x${h} mouse spin`);
      // keys (up stops at page 2 too)
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(900); await expectShowing(page, 5, `${browserName} ${w}x${h} arrow down`);
      await page.keyboard.press('ArrowUp'); await page.waitForTimeout(900); await expectShowing(page, 4, `${browserName} ${w}x${h} arrow up`);
      // rail (pages 2 to 5)
      for (const n of [5, 2, 4, 3]) {
        await page.locator('#ames-rail button').nth(n - 2).click();
        await page.waitForTimeout(1600);
        await expectShowing(page, n, `${browserName} ${w}x${h} rail to ${n}`);
      }
      await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(1400);
      await expectShowing(page, 2, `${browserName} ${w}x${h} up key stops at page 2`);
      // the header goes home
      await page.locator('#ames-head').click(); await page.waitForTimeout(1600);
      await expectShowing(page, 1, `${browserName} ${w}x${h} header home`);
      console.log('ERRS', browserName, w, JSON.stringify(errs));
      expect.soft(errs, 'no script errors').toEqual([]);
    });
  }
});

// ---------------- phones: Chrome touch emulation ----------------
const PHONES = [[375, 667, 2], [360, 740, 3], [390, 844, 3], [393, 852, 3], [402, 684, 3], [430, 932, 3], [402, 684, 3, 'reduce'], [390, 844, 3, 'reduce']];
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1';
async function swipe(page, cdp, from, to, ms = 200, release = true) {
  const steps = Math.max(4, Math.round(ms / 16));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 180, y: from }] });
  for (let k = 1; k <= steps; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 180, y: from + (to - from) * k / steps }] }); await page.waitForTimeout(ms / steps); }
  if (release) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const watchOne = (page) => page.evaluate(() => {
  window.__most = 0;
  (function f() {
    const n = [...document.querySelectorAll('.mag .page')].filter((p) => { const r = p.getBoundingClientRect(); return getComputedStyle(p).visibility !== 'hidden' && r.bottom > 2 && r.top < innerHeight - 2 && r.height > 0; }).length;
    window.__most = Math.max(window.__most, n);
    requestAnimationFrame(f);
  })();
});

for (const [w, h, dpr, motion] of PHONES) {
  test.describe(`phone ${w}x${h}${motion ? ' reduce motion' : ''}`, () => {
    test.use({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: dpr, userAgent: UA, reducedMotion: motion || 'no-preference' });
    test.beforeEach(({}, i) => { test.skip(i.project.name !== 'desktop-chromium'); });
    test(`phone ${w}x${h}${motion ? ' reduce motion' : ''}`, async ({ page }) => {
      test.setTimeout(240000);
      await local(page);
      const errs = errors(page);
      for (let n = 1; n <= 5; n++) {
        await page.goto(SITE + (n > 1 ? n + '/' : ''));
        await page.waitForTimeout(2500);
        await expectShowing(page, n, `phone ${w}x${h} link /${n}/`);
        await page.screenshot({ path: `audit-results/ex-phone-${w}x${h}-p${n}.png` });
      }
      await page.goto(SITE);
      await page.waitForTimeout(1200);
      const cdp = await page.context().newCDPSession(page);
      await watchOne(page);
      const lo = Math.round(h * 0.78), hi = Math.round(h * 0.25);
      // a swipe on the landing page goes at once
      await swipe(page, cdp, lo, hi, 200); await page.waitForTimeout(700); await expectShowing(page, 2, `phone ${w}x${h} swipe off the landing page`);
      // slow drags and quick flicks, down and back (back stops at page 2)
      for (const ms of [380, 90]) {
        for (let n = 3; n <= 5; n++) { await swipe(page, cdp, lo, hi, ms); await page.waitForTimeout(700); await expectShowing(page, n, `phone ${w}x${h} swipe(${ms}ms) to ${n}`); }
        await swipe(page, cdp, lo, hi, ms); await page.waitForTimeout(700); await expectShowing(page, 5, `phone ${w}x${h} past the end`);
        for (let n = 4; n >= 2; n--) { await swipe(page, cdp, hi, lo, ms); await page.waitForTimeout(700); await expectShowing(page, n, `phone ${w}x${h} swipe(${ms}ms) back to ${n}`); }
        await swipe(page, cdp, hi, lo, ms); await page.waitForTimeout(700); await expectShowing(page, 2, `phone ${w}x${h} stops at page 2`);
      }
      // holding and moving without letting go, then releasing a short distance away: stays
      await swipe(page, cdp, lo, lo - 40, 500); await page.waitForTimeout(600); await expectShowing(page, 2, `phone ${w}x${h} short hold`);
      // two quick swipes in a row (the second during the fade)
      await swipe(page, cdp, lo, hi, 80); await page.waitForTimeout(90); await swipe(page, cdp, lo, hi, 80);
      await page.waitForTimeout(1200);
      const s = await screenState(page);
      await expectShowing(page, s.rm, `phone ${w}x${h} double swipe (ended on ${s.rm})`);
      // four quick swipes as fast as possible
      for (let k = 0; k < 4; k++) { await swipe(page, cdp, lo, hi, 60); await page.waitForTimeout(40); }
      await page.waitForTimeout(1500);
      const s2 = await screenState(page);
      await expectShowing(page, s2.rm, `phone ${w}x${h} rapid swipes (ended on ${s2.rm})`);
      // the browser bar hiding/showing (the visible height changes) keeps the page in place
      await page.setViewportSize({ width: w, height: h - 70 }); await page.waitForTimeout(700);
      await expectShowing(page, s2.rm, `phone ${w}x${h} bar shows`);
      await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(700);
      await expectShowing(page, s2.rm, `phone ${w}x${h} bar hides`);
      const most = await page.evaluate(() => window.__most);
      // the header goes home, and home moves on again by itself
      await page.locator('#ames-head').tap(); await page.waitForTimeout(1200);
      await expectShowing(page, 1, `phone ${w}x${h} header home`);
      await page.waitForFunction(() => RM.viewerRouter.mag.currentPage.num === 2, null, { timeout: 9000 });
      await expectShowing(page, 2, `phone ${w}x${h} landing moves on`);
      console.log('MOST', w, h, most, 'ERRS', JSON.stringify(errs));
      expect.soft(most, 'never two pages on screen during swipes').toBe(1);
      expect.soft(errs, 'no script errors').toEqual([]);
    });
  });
}

// ---------------- phones: WebKit (iPhone Safari engine; no touch events from the test, so links, hints, rail code paths) ----------------
test.describe('webkit phone', () => {
  test.beforeEach(({}, i) => { test.skip(!/iphone-webkit|chrome-ios-webkit/.test(i.project.name)); });
  test('webkit phone pages', async ({ page }, i) => {
    test.setTimeout(120000);
    await local(page);
    const errs = errors(page);
    for (let n = 1; n <= 5; n++) {
      await page.goto(SITE + (n > 1 ? n + '/' : ''));
      await page.waitForTimeout(2500);
      await expectShowing(page, n, `${i.project.name} link /${n}/`);
      await page.screenshot({ path: `audit-results/ex-${i.project.name}-p${n}.png` });
    }
    await page.goto(SITE); await page.waitForTimeout(2500);
    for (let n = 2; n <= 5; n++) { await page.evaluate((n) => window.__amesPaging.goTo(n), n); await page.waitForTimeout(900); await expectShowing(page, n, `${i.project.name} next to ${n}`); }
    await page.locator('#ames-hint-up').click(); await page.waitForTimeout(900); await expectShowing(page, 4, `${i.project.name} up arrow`);
    for (const n of [3, 5, 2]) { await page.evaluate((n) => window.__amesPaging.goTo(n), n); await page.waitForTimeout(900); await expectShowing(page, n, `${i.project.name} jump to ${n}`); }
    await page.locator('#ames-head').click(); await page.waitForTimeout(1200); await expectShowing(page, 1, `${i.project.name} header home`);
    console.log('ERRS', i.project.name, JSON.stringify(errs));
    expect.soft(errs, 'no script errors').toEqual([]);
  });
});
