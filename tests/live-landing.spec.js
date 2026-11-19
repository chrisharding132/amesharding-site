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

// the name is never on screen twice: page 1's own copy and the header's words are not both visible in any frame
const watchName = (page) => page.evaluate(() => {
  window.__twice = 0;
  (function f() {
    const head = document.getElementById('ames-head'), p1 = document.querySelectorAll('.mag .page')[0];
    const headOn = head && head.classList.contains('on') && +getComputedStyle(head).opacity > 0.05;
    const logoOn = p1 && [...p1.querySelectorAll('.rmwidget.widget-picture')].some((w) => { const r = w.getBoundingClientRect(); return getComputedStyle(w).visibility !== 'hidden' && getComputedStyle(p1).visibility !== 'hidden' && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight && +getComputedStyle(p1.querySelector('.page-content-container')).opacity > 0.05; });
    if (headOn && logoOn) { window.__twice++; if ((window.__twiceLog = window.__twiceLog || []).length < 4) window.__twiceLog.push([JSON.stringify(window.__amesPaging.lastFly), document.documentElement.className.includes('ames-name-flying'), Math.round(performance.now()), RM.viewerRouter.mag.currentPage.num, window.__amesPaging.cur && window.__amesPaging.cur(), getComputedStyle(head).opacity, getComputedStyle(p1).visibility, getComputedStyle(p1.querySelector('.page-content-container')).opacity, [...p1.querySelectorAll('.rmwidget.widget-picture')].map((w) => w.style.visibility).join('/')]); }
    requestAnimationFrame(f);
  })();
});
const headWords = (page) => page.evaluate(() => [...document.querySelectorAll('#ames-head img')].map((i) => { const r = i.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }));
const cueFont = (page) => page.evaluate(() => { const sp = document.querySelector('#ames-mb .ames-cue span'); return sp ? [sp.textContent, sp.style.fontFamily] : null; });
const formCentre = (page) => page.evaluate(() => {
  const pg = document.querySelector('.widget-form').closest('.page'), hd = [...pg.querySelectorAll('.widget-text-v3')].find((w) => /MAKE/i.test(w.textContent));
  const k = (w) => { const c = w.closest('.page-content-container'), z = parseFloat(getComputedStyle(c).zoom) || 1, r = w.getBoundingClientRect(); return Math.abs(r.width - w.offsetWidth) < 2 ? z : 1; };
  const top = hd.getBoundingClientRect().top * k(hd), b = document.querySelector('.widget-form .button'), bottom = b.getBoundingClientRect().bottom * k(b);
  // centred in the space left between the header + its swipe hint, and the bottom (phones keep the corner clear)
  const room = (window.__amesHeadBottom || 0) + 48, bottomRoom = document.documentElement.classList.contains('isphone') ? 72 : 24;
  return { above: Math.round(top - room), below: Math.round(innerHeight - bottom - bottomRoom) };
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
      await page.waitForFunction(() => window.__amesPaging && window.__amesPaging.ready, null, { timeout: 15000 });
      await page.waitForTimeout(900);
      const c = await centred(page);
      console.log('CENTRE phone', JSON.stringify(c));
      // (the tagline's space is kept while its font loads, so the group is centred with it)
      expect(Math.abs(c.above - c.below), 'page 1 centred').toBeLessThan(60);
      expect(await page.locator('#ames-listen').count(), 'no Listen button').toBe(0);
      expect((await st(page)).down, 'swipe hint on page 1').toBe(true);
      await watchName(page);
      await page.screenshot({ path: `audit-results/land-phone-${motion}-p1.png` });
      // moves on by itself
      await page.waitForFunction(() => RM.viewerRouter.mag.currentPage.num === 2, null, { timeout: 9000 });
      await page.waitForFunction(() => (window.__amesMood && window.__amesMood.ripples) > 0, null, { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(800);
      let s = await st(page);
      console.log('P2', JSON.stringify(s));
      expect(s.head, 'header on page 2').toBe(true);
      expect(s.down, 'swipe hint on page 2').toBe(true);
      expect(parseFloat(s.cue), 'tap-to-listen cue').toBeGreaterThan(0.9);
      expect(s.start).toBe(1);
      expect(s.ripples, 'ripple on arrival').toBeGreaterThan(0);
      const hw = await headWords(page);
      console.log('HEAD', JSON.stringify(hw), 'CUE', JSON.stringify(await cueFont(page)));
      expect(hw.length).toBe(2);
      expect(Math.abs(hw[0][1] - hw[1][1]), 'words side by side').toBeLessThan(2);
      expect(Math.abs(hw[0][3] - hw[1][3]), 'equal heights').toBeLessThan(2);
      expect((await cueFont(page))[1], "the site's own handwriting").toMatch(/custom_|Nanum/);
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
      const fc = await formCentre(page);
      console.log('FORM first arrival', JSON.stringify(fc));
      expect(Math.abs(fc.above - fc.below), 'form centred on first arrival').toBeLessThan(40);
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
      console.log('TWICE', JSON.stringify(await page.evaluate(() => window.__twiceLog)));
      expect(await page.evaluate(() => window.__twice), 'the name never on screen twice ' + JSON.stringify(await page.evaluate(() => window.__twiceLog))).toBe(0);
      // back on the map: the arrow and rings are there again until a light is tapped... this visit has tapped one
      expect((await st(page)).start, 'start rings gone once a light was tapped this visit').toBe(0);
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
    await page.waitForFunction(() => window.__amesPaging && window.__amesPaging.ready, null, { timeout: 15000 });
    await page.waitForTimeout(700);
    const c = await centred(page);
    console.log('CENTRE desk', browserName, JSON.stringify(c));
    expect(Math.abs(c.above - c.below), 'page 1 centred').toBeLessThan(30);
    expect((await st(page)).down, 'scroll hint on page 1').toBe(true);
    await watchName(page);
    await page.screenshot({ path: `audit-results/land-desk-${browserName}-p1.png` });
    await page.waitForFunction(() => RM.viewerRouter.mag.currentPage.num === 2, null, { timeout: 9000 });
    await page.waitForTimeout(1500);
    let s = await st(page);
    console.log('P2 desk', browserName, JSON.stringify(s));
    expect(s.head).toBe(true); expect(s.down).toBe(true); expect(parseFloat(s.cue)).toBeGreaterThan(0.9); expect(s.ripples, 'ripple after the landing page moves on').toBeGreaterThan(0);
    const hw = await headWords(page);
    console.log('HEAD desk', JSON.stringify(hw), 'CUE', JSON.stringify(await cueFont(page)));
    expect(hw[0][1], 'room above the header').toBeGreaterThanOrEqual(26);
    // Safari's older scroll events never turn a page by themselves
    await page.evaluate(() => { for (let k = 0; k < 12; k++) { const e = new Event('mousewheel', { bubbles: true, cancelable: true }); e.wheelDelta = -120; e.wheelDeltaY = -120; document.querySelector('.mag').dispatchEvent(e); } });
    await page.waitForTimeout(900);
    expect((await st(page)).rm, 'old-style scroll events alone do nothing').toBe(2);
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
    const fc = await formCentre(page);
    console.log('FORM desk', browserName, JSON.stringify(fc));
    expect(Math.abs(fc.above - fc.below), 'form centred').toBeLessThan(40);
    await page.locator('#ames-head').click(); await page.waitForTimeout(1400);
    expect((await st(page)).rm, 'header goes home').toBe(1);
    expect(await page.evaluate(() => window.__twice), 'the name never on screen twice ' + JSON.stringify(await page.evaluate(() => window.__twiceLog))).toBe(0);
  });
});
