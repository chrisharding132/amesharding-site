// Landing page → map flow, header, no scrolling back to page 1, hints, corner play button, map cue, ripple.
// LIVE=1 LOCAL=1 npx playwright test tests/live-landing.spec.js --project=desktop-chromium --project=desktop-webkit
import { test, expect } from './mute.js';
import { readFileSync } from 'node:fs';

async function local(page) {
  if (!process.env.LOCAL) return;
  await page.route(/chrisharding132\.github\.io\/amesharding-site\/src\/[^?]+\.(js|png)/, (route) => {
    const file = new URL(route.request().url()).pathname.split('/amesharding-site/')[1];
    route.fulfill({ body: readFileSync(new URL('../' + file, import.meta.url)), contentType: file.endsWith('js') ? 'application/javascript' : 'image/png', headers: { 'access-control-allow-origin': '*' } });
  });
}
const st = (page) => page.evaluate(() => {
  const head = document.getElementById('ames-head'), hr = head.getBoundingClientRect();
  const vis = (id) => { const e = document.getElementById(id); return !!e && !e.classList.contains('off') && getComputedStyle(e).opacity > 0.5; };
  const cue = document.querySelector('#ames-mb .ames-cue');
  return { rm: RM.viewerRouter.mag.currentPage.num, head: head.classList.contains('on'), headBox: [hr.left, hr.top, hr.width, hr.height].map(Math.round),
    down: vis('ames-hint'), up: vis('ames-hint-up'), mini: document.getElementById('ames-mini') && document.getElementById('ames-mini').classList.contains('on'),
    cue: cue ? getComputedStyle(cue).opacity : null, ripples: window.__amesMood && window.__amesMood.ripples || 0, start: document.querySelectorAll('#ames-mb .ames-start').length };
});
// page 1's group sits in the middle of the screen
const centred = (page) => page.evaluate(() => {
  const pg = document.querySelectorAll('.mag .page')[0];
  const ws = [...pg.querySelectorAll('.rmwidget')].filter((w) => !w.classList.contains('widget-background'));
  const k = (w) => { const c = w.closest('.page-content-container'), z = parseFloat(getComputedStyle(c).zoom) || 1, r = w.getBoundingClientRect(); return Math.abs(r.width - w.offsetWidth) < 2 ? z : 1; };
  const tops = ws.map((w) => w.getBoundingClientRect().top * k(w)), bots = ws.map((w) => w.getBoundingClientRect().bottom * k(w));
  const top = Math.min(...tops), bottom = Math.max(...bots);
  return { above: Math.round(top), below: Math.round(innerHeight - bottom) };
});

const PHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1';
async function swipe(page, cdp, from, to) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 180, y: from }] });
  for (let k = 1; k <= 10; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 180, y: from + (to - from) * k / 10 }] }); await page.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(1000);
}

for (const motion of ['no-preference', 'reduce']) {
  test.describe(`phone (${motion})`, () => {
    test.use({ viewport: { width: 402, height: 684 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, userAgent: PHONE_UA, reducedMotion: motion });
    test.beforeEach(({}, i) => { test.skip(i.project.name !== 'desktop-chromium'); });
    test(`phone flow (${motion})`, async ({ page }) => {
      test.setTimeout(90000);
      await local(page);
      await page.goto('https://amesharding.com/');
      await page.waitForTimeout(1500);
      const c = await centred(page);
      console.log('CENTRE phone', JSON.stringify(c));
      expect(Math.abs(c.above - c.below), 'page 1 centred').toBeLessThan(30);
      expect(await page.locator('#ames-listen').count(), 'no Listen button').toBe(0);
      await page.screenshot({ path: `audit-results/land-phone-${motion}-p1.png` });
      // moves on by itself
      await page.waitForFunction(() => RM.viewerRouter.mag.currentPage.num === 2, null, { timeout: 9000 });
      await page.waitForTimeout(1200);
      let s = await st(page);
      console.log('P2', JSON.stringify(s));
      expect(s.head, 'header on page 2').toBe(true);
      expect(s.down, 'swipe hint on page 2').toBe(true);
      expect(parseFloat(s.cue), 'tap-to-listen cue').toBeGreaterThan(0.9);
      expect(s.start).toBe(1);
      expect(s.ripples, 'ripple on arrival').toBeGreaterThan(0);
      await page.screenshot({ path: `audit-results/land-phone-${motion}-p2.png` });
      // can't scroll back to page 1
      const cdp = await page.context().newCDPSession(page);
      await swipe(page, cdp, 200, 560);
      expect((await st(page)).rm, 'page 2 is the top').toBe(2);
      // play, move on: corner button only
      await page.locator('#ames-mb .ames-light').nth(5).click({ force: true });
      await page.waitForTimeout(800);
      await swipe(page, cdp, 560, 180);
      s = await st(page);
      expect(s.rm).toBe(3); expect(s.mini, 'corner play button').toBe(true); expect(s.down).toBe(false);
      await page.screenshot({ path: `audit-results/land-phone-${motion}-p3.png` });
      await swipe(page, cdp, 560, 180); await swipe(page, cdp, 560, 180);
      s = await st(page);
      expect(s.rm).toBe(5); expect(s.up, 'up hint on the last page').toBe(true);
      await page.screenshot({ path: `audit-results/land-phone-${motion}-p5.png` });
      await page.screenshot({ path: `audit-results/land-phone-${motion}-p4tmp.png` });
      await swipe(page, cdp, 200, 560);
      expect((await st(page)).rm).toBe(4);
      await page.screenshot({ path: `audit-results/land-phone-${motion}-p4.png` });
      // the header goes home
      await page.locator('#ames-head').tap();
      await page.waitForTimeout(1400);
      s = await st(page);
      expect(s.rm, 'header goes home').toBe(1); expect(s.head).toBe(false);
      await page.waitForFunction(() => RM.viewerRouter.mag.currentPage.num === 2, null, { timeout: 9000 });
    });
  });
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.beforeEach(({}, i) => { test.skip(!i.project.name.startsWith('desktop')); });
  test('desktop flow', async ({ page, browserName }) => {
    test.setTimeout(90000);
    await local(page);
    await page.goto('https://amesharding.com/');
    await page.waitForTimeout(1500);
    const c = await centred(page);
    console.log('CENTRE desk', browserName, JSON.stringify(c));
    expect(Math.abs(c.above - c.below), 'page 1 centred').toBeLessThan(30);
    await page.screenshot({ path: `audit-results/land-desk-${browserName}-p1.png` });
    await page.waitForFunction(() => RM.viewerRouter.mag.currentPage.num === 2, null, { timeout: 9000 });
    await page.waitForTimeout(1500);
    let s = await st(page);
    console.log('P2 desk', browserName, JSON.stringify(s));
    expect(s.head).toBe(true); expect(s.down).toBe(true); expect(parseFloat(s.cue)).toBeGreaterThan(0.9); expect(s.ripples).toBeGreaterThan(0);
    await page.screenshot({ path: `audit-results/land-desk-${browserName}-p2.png` });
    await page.mouse.move(720, 450);
    for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, -40); await page.waitForTimeout(16); }
    await page.waitForTimeout(900);
    expect((await st(page)).rm, 'scrolling up stops at page 2').toBe(2);
    await page.keyboard.press('ArrowUp'); await page.waitForTimeout(900);
    expect((await st(page)).rm, 'up key stops at page 2').toBe(2);
    await page.locator('#ames-mb .ames-light').nth(5).click({ force: true });
    await page.waitForTimeout(700);
    for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, 40); await page.waitForTimeout(16); }
    await page.waitForTimeout(1200);
    s = await st(page);
    expect(s.rm).toBe(3); expect(s.mini).toBe(true);
    await page.screenshot({ path: `audit-results/land-desk-${browserName}-p3.png` });
    await page.locator('#ames-rail button').nth(3).click(); await page.waitForTimeout(1400);
    s = await st(page);
    expect(s.rm).toBe(5); expect(s.up).toBe(true);
    await page.screenshot({ path: `audit-results/land-desk-${browserName}-p5.png` });
    await page.locator('#ames-head').click(); await page.waitForTimeout(1400);
    expect((await st(page)).rm, 'header goes home').toBe(1);
  });
});
