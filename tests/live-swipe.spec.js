// Phone navigation on the published page (LOCAL=1: with the local code): one page at a time, hints, Listen, map guidance.
// LIVE=1 LOCAL=1 npx playwright test tests/live-swipe.spec.js --project=desktop-chromium
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function local(page) {
  if (!process.env.LOCAL) return;
  await page.route(/chrisharding132\.github\.io\/amesharding-site\/src\/[^?]+\.(js|png)/, (route) => {
    const file = new URL(route.request().url()).pathname.split('/amesharding-site/')[1];
    route.fulfill({ body: readFileSync(new URL('../' + file, import.meta.url)), contentType: file.endsWith('js') ? 'application/javascript' : 'image/png', headers: { 'access-control-allow-origin': '*' } });
  });
}

// Chrome's phone emulation, so real touch events can be sent (Chrome on iPhone's size and user agent)
test.use({ viewport: { width: 402, height: 684 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1' });
test.beforeEach(({}, i) => { test.skip(i.project.name !== 'desktop-chromium'); });

// every frame: how many pages can be seen on screen
const watch = (page) => page.evaluate(() => {
  window.__seen = 0;
  (function f() {
    const n = [...document.querySelectorAll('.mag .page')].filter((p) => { const r = p.getBoundingClientRect(); return getComputedStyle(p).visibility !== 'hidden' && r.bottom > 1 && r.top < innerHeight - 1 && r.height > 0; }).length;
    window.__seen = Math.max(window.__seen, n);
    requestAnimationFrame(f);
  })();
});
async function swipe(page, cdp, from, to, steps = 12) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: from }] });
  for (let k = 1; k <= steps; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: from + (to - from) * k / steps }] }); await page.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(900);
}
const state = (page) => page.evaluate(() => ({ cur: window.__amesPaging.cur(), rm: RM.viewerRouter.mag.currentPage.num, seen: window.__seen,
  offSlot: (() => { const p = document.querySelectorAll('.mag .page')[window.__amesPaging.cur() - 1]; return Math.round(p.getBoundingClientRect().top); })(),
  hint: !document.getElementById('ames-hint').classList.contains('off'), up: !document.getElementById('ames-hint-up').classList.contains('off') }));

test('one page at a time, hints, no jump from the last page', async ({ page }) => {
  test.setTimeout(90000);
  await local(page);
  await page.goto('https://amesharding.com/');
  await page.waitForTimeout(3500);
  const cdp = await page.context().newCDPSession(page);
  await watch(page);
  let s = await state(page);
  expect(s.hint, 'down arrow on page 1').toBe(true);
  await page.screenshot({ path: 'audit-results/nav-p1-phone.png' });

  // holding and sliding without letting go far enough: stays, nothing else shows
  await swipe(page, cdp, 400, 360);
  s = await state(page);
  console.log('SMALL', JSON.stringify(s));
  expect(s.cur).toBe(1); expect(s.seen).toBe(1); expect(s.offSlot).toBe(0);

  // pulling down on the first page: nothing moves, nothing else shows
  await swipe(page, cdp, 200, 520);
  s = await state(page);
  expect(s.cur).toBe(1); expect(s.seen).toBe(1);

  for (let n = 2; n <= 5; n++) {
    await swipe(page, cdp, 520, 200);
    s = await state(page);
    console.log('PAGE', n, JSON.stringify(s));
    expect(s.cur, 'landed on the next page').toBe(n);
    expect(s.rm, 'Readymag agrees').toBe(n);
    expect(s.offSlot, 'exactly in place').toBe(0);
    expect(s.seen, 'never more than one page on screen').toBe(1);
  }
  expect(s.hint, 'down arrow gone after moving on').toBe(false);
  expect(s.up, 'up arrow on the last page').toBe(true);
  await page.screenshot({ path: 'audit-results/nav-p5-phone.png' });

  // pushing on past the last page (the old jump to page 2), several times
  for (let k = 0; k < 3; k++) await swipe(page, cdp, 520, 160, 8);
  s = await state(page);
  console.log('PASTEND', JSON.stringify(s));
  expect(s.cur, 'still on the last page').toBe(5);
  expect(s.offSlot).toBe(0);
  expect(s.seen).toBe(1);

  await swipe(page, cdp, 200, 520);
  s = await state(page);
  expect(s.cur).toBe(4);
  await swipe(page, cdp, 520, 200);
  s = await state(page);
  expect(s.cur).toBe(5);
  expect(s.up, 'up arrow gone once someone has gone back up').toBe(false);
});

test('Listen plays Groovin’ (Chorus); map guidance until the first play', async ({ page }) => {
  test.setTimeout(60000);
  await local(page);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await page.goto('https://amesharding.com/2/');
  await page.waitForTimeout(5000);
  console.log('DBG', JSON.stringify({ errs, n: await page.evaluate(() => ({ stage: document.querySelector('#ames-mb .ames-stage') && document.querySelector('#ames-mb .ames-stage').className, lights: document.querySelectorAll('#ames-mb .ames-light').length, cur: window.__amesPaging.cur && window.__amesPaging.cur(), vis: [...document.querySelectorAll('.mag .page')].map((p) => getComputedStyle(p).visibility[0]).join(''), sy: scrollY, rm: RM.viewerRouter.mag.currentPage.num })) }));
  await page.waitForSelector('#ames-mb .ames-stage.on', { timeout: 5000 });
  await page.waitForTimeout(1500);
  const g = await page.evaluate(() => ({ prompt: getComputedStyle(document.querySelector('#ames-mb .ames-prompt')).opacity, start: [...document.querySelectorAll('#ames-mb .ames-start')].map((e) => e.getAttribute('aria-label')), idle: getComputedStyle(document.querySelector('#ames-player .ames-idle')).visibility }));
  console.log('GUIDE', JSON.stringify(g));
  expect(parseFloat(g.prompt)).toBeGreaterThan(0.9);
  expect(g.start).toEqual(['Play Groovin\' (Chorus) 130 BPM']);
  expect(g.idle, 'no second prompt in the player').toBe('hidden');
  await page.screenshot({ path: 'audit-results/nav-map-phone.png' });
  // the prompt never sits on a light
  const clash = await page.evaluate(() => { const r = document.querySelector('#ames-mb .ames-prompt').getBoundingClientRect(); return [...document.querySelectorAll('#ames-mb .ames-light')].filter((l) => { const b = l.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2; return cx > r.left - 8 && cx < r.right + 8 && cy > r.top - 8 && cy < r.bottom + 8; }).length; });
  console.log('CLASH', clash);

  // Listen from page 1
  await page.goto('https://amesharding.com/');
  await page.waitForTimeout(3000);
  console.log('READY', JSON.stringify(await page.evaluate(() => ({ player: !!window.__amesPlayer, tracks: !!(window.__amesMood && window.__amesMood.tracks), scripts: [...document.scripts].map((x) => x.src).filter((x) => /amesharding-site/.test(x)).map((x) => x.split('/src/')[1]) }))));
  await page.locator('#ames-listen').tap();
  await page.waitForTimeout(1500);
  const l = await page.evaluate(() => ({ cur: window.__amesPaging.cur(), title: window.__amesPlayer.track && window.__amesPlayer.track.title, st: window.__amesPlayer.state, tip: document.querySelector('#ames-mb .ames-tip.on') && document.querySelector('#ames-mb .ames-tip').textContent, prompt: document.querySelector('#ames-mb .ames-prompt').classList.contains('on'), start: document.querySelectorAll('#ames-mb .ames-start').length }));
  console.log('LISTEN', JSON.stringify(l));
  expect(l.cur).toBe(2);
  expect(l.title).toMatch(/^Groovin' \(Chorus\)/);
  expect(['loading', 'playing']).toContain(l.st);
  expect(l.prompt, 'prompt gone after the first play').toBe(false);
  expect(l.start).toBe(0);
  await page.screenshot({ path: 'audit-results/nav-listen-phone.png' });
});
