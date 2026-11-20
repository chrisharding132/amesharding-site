// Every page at many window sizes, checked by measurement and photographed for a look:
//  - nothing overlaps the header (the small name at the top), nothing runs off the bottom
//  - pages are not shrunk when the window has room (the About page once dropped to half size)
//  - the scroll/swipe hint covers no text, no map light
//  - the background is never blown up past its pixels (blurry), at Retina density
//  - left alone for 5s, a page stays put (it once moved on from 3 to 4 by itself)
// LIVE=1 [LOCAL=1] npx playwright test tests/live-sizes.spec.js --project=desktop-chromium   (and iphone-webkit for PHONES)
import { test, expect } from './mute.js';
import { readFileSync } from 'node:fs';

async function local(page) {
  if (!process.env.LOCAL) return;
  await page.route(/chrisharding132\.github\.io\/amesharding-site\/src\/[^?]+\.(js|png|jpg)/, (route) => {
    const file = new URL(route.request().url()).pathname.split('/amesharding-site/')[1];
    route.fulfill({ body: readFileSync(new URL('../' + file, import.meta.url)), contentType: /js$/.test(file) ? 'application/javascript' : /jpg$/.test(file) ? 'image/jpeg' : 'image/png', headers: { 'access-control-allow-origin': '*' } });
  });
}

const DESKTOP = [[1920, 1080], [1440, 900], [1280, 720], [1024, 768], [995, 745], [1440, 560], [1100, 440], [900, 900], [700, 800], [560, 800], [420, 820]];
const PHONES = [[375, 667], [390, 664], [402, 684], [430, 932], [440, 782]];

const measure = (page) => page.evaluate(() => {
  const n = window.__amesPaging.cur ? (document.documentElement.classList.contains('isphone') ? window.__amesPaging.cur() : RM.viewerRouter.mag.currentPage.num) : RM.viewerRouter.mag.currentPage.num;
  const pg = document.querySelectorAll('.mag .page')[n - 1];
  // screen pixels: under Readymag's desktop zoom a box can come back in unzoomed units (also when the page is scaled to fit)
  const scr = (el) => { const r = el.getBoundingClientRect(), c = el.closest('.page-content-container'); const z = c ? parseFloat(getComputedStyle(c).zoom) || 1 : 1; const cbx = el.closest('.content-bounds'), fs = cbx && cbx.dataset.fit ? +cbx.dataset.fit.split(',')[0] || 1 : 1; const k = Math.abs(r.width / fs - el.offsetWidth) < 2 || Math.abs(r.width - el.offsetWidth) < 2 ? z : 1; return { l: r.left * k, t: r.top * k, r: r.right * k, b: r.bottom * k, w: r.width * k, h: r.height * k }; };
  const pr = pg.getBoundingClientRect();
  const head = document.getElementById('ames-head'), hb = head && head.classList.contains('on') ? head.getBoundingClientRect().bottom : 0;
  // content: what a visitor reads or taps (not the background, not the moving photo strips that run off the page)
  const items = [...pg.querySelectorAll('.rmwidget')].filter((w) => {
    if (w.classList.contains('widget-background') || w.closest('.page-fixed-bg-container') || w.querySelector('#ames-mb, #ames-player')) return false;   // the map and the player fit themselves: checked by their lights below
    const m = w.closest('.animation-container'); if (m) { const mr = scr(m); if (mr.h > pr.height * 0.8 || mr.t < pr.top - 4 || mr.b > pr.bottom + 4) return false; }
    const s = scr(w); return s.w > 2 && s.h > 2 && getComputedStyle(w).visibility !== 'hidden' && +getComputedStyle(w).opacity !== 0;
  }).map((w) => ({ cls: w.className.split(' ').slice(1, 2).join(''), text: w.classList.contains('widget-text-v3'), ...scr(w) }));
  const cb = pg.querySelector('.content-bounds'), fit = cb && cb.dataset.fit ? +cb.dataset.fit.split(',')[0] : 1;
  const lights = [...pg.querySelectorAll('#ames-mb .ames-light')].map(scr).map((r) => ({ left: r.l, top: r.t, right: r.r, bottom: r.b, width: r.w })).filter((r) => r.width && r.top < innerHeight && r.bottom > 0);
  const pl = document.getElementById('ames-player'), plr = pl && scr(pl);
  const floor = plr && plr.h && plr.t > innerHeight * 0.3 ? Math.min(innerHeight, plr.t) : innerHeight;
  const cueEl = pg.querySelector('#ames-mb .ames-cue.on span'), cr = cueEl && scr(cueEl);
  const cue = cr && cr.w ? { l: cr.l, t: cr.t, r: cr.r, b: cr.b } : null;   // (screen pixels: Readymag zooms the desktop page)
  const played = !!document.querySelector('#ames-mb .ames-light.playing');
  const hints = ['ames-hint', 'ames-hint-up'].map((id) => document.getElementById(id)).filter((h) => h && !h.classList.contains('off')).map((h) => { const r = h.querySelector('span').getBoundingClientRect(), a = h.getBoundingClientRect(); return { id: h.id, l: a.left, t: a.top, r: a.right, b: a.bottom, tl: r.left, tt: r.top, tr: r.right, tb: r.bottom }; });
  // background sharpness: how far the image is blown up on screen (1 = one image pixel per screen pixel)
  let blow = 0;
  for (const el of [document.getElementById('ames-sky'), pg, pg.querySelector('.page-fixed-bg-container')]) {
    if (!el) continue; const m = /url\(["']?([^"')]+)/.exec(getComputedStyle(el).backgroundImage); if (!m) continue;
    const im = [...document.images].find((i) => i.src === m[1]); const nat = window.__bgSizes && window.__bgSizes[m[1]];
    const r = el.getBoundingClientRect(); if (!nat || !r.width) continue;
    blow = Math.max(blow, Math.max(r.width / nat[0], r.height / nat[1]) * devicePixelRatio);
  }
  return { n, floor: Math.round(floor), cue, played, onMap: !!pg.querySelector('#ames-mb'), hb: Math.round(hb), vh: innerHeight, vw: innerWidth, items, fit, lights: lights.map((r) => ({ l: r.left, t: r.top, r: r.right, b: r.bottom })), hints, blow: +blow.toFixed(2), urls: [document.getElementById('ames-sky'), pg].filter(Boolean).map((e) => (/url\(["']?([^"')]+)/.exec(getComputedStyle(e).backgroundImage) || [])[1]).filter(Boolean) };
});

const hit = (a, b, pad = 0) => a.l < b.r - pad && a.r > b.l + pad && a.t < b.b - pad && a.b > b.t + pad;

async function bgSizes(page, urls) {
  await page.evaluate(async (urls) => {
    window.__bgSizes = window.__bgSizes || {};
    for (const u of urls) { if (window.__bgSizes[u]) continue; const im = new Image(); im.src = u; await im.decode().catch(() => {}); window.__bgSizes[u] = [im.naturalWidth, im.naturalHeight]; }
  }, urls);
}

function checks(m, label, phone) {
  const bad = [];
  for (const it of m.items) {
    if (m.hb && it.t < m.hb - 1) bad.push(`${label}: ${it.cls} top ${Math.round(it.t)} is under the header (ends ${m.hb})`);
    if (it.b > m.vh + 1 && !phone) bad.push(`${label}: ${it.cls} bottom ${Math.round(it.b)} runs off the window (${m.vh})`);
  }
  // a page shrunk although the window is tall enough for it at full size
  if (!phone && m.vh >= 700 && m.fit < 0.8) bad.push(`${label}: page shrunk to ${m.fit} in a ${m.vw}x${m.vh} window`);
  for (const h of m.hints) {
    const word = { l: h.tl, t: h.tt, r: h.tr, b: h.tb };
    for (const it of m.items) if (it.text && hit(word, it, 1)) bad.push(`${label}: ${h.id} covers text ${it.cls}`);
    for (const l of m.lights) if (hit(h, l, 2)) bad.push(`${label}: ${h.id} covers a map light`);
    if (h.r > m.vw + 1 || h.l < -1 || h.t < m.hb - 1 || h.b > m.vh + 1) bad.push(`${label}: ${h.id} off screen or under the header ${JSON.stringify(h)}`);
  }
  // the map: every light between the header and the player; "tap to listen" showing, on screen, clear of the header
  for (const l of m.lights) if ((l.t + l.b) / 2 < m.hb || (l.t + l.b) / 2 > m.floor) { bad.push(`${label}: a map light at ${Math.round(l.t)}-${Math.round(l.b)} is outside ${m.hb}-${m.floor}`); break; }
  if (m.onMap && !m.played) {
    if (!m.cue) bad.push(`${label}: "tap to listen" not showing`);
    else if (m.cue.t < m.hb || m.cue.b > m.floor || m.cue.l < 0 || m.cue.r > m.vw) bad.push(`${label}: "tap to listen" cut off ${JSON.stringify(m.cue)}`);
  }
  // (the photo is 2564x1605: on a phone, or a Retina screen wider than ~1700px, it is necessarily stretched a little;
  //  on phones the grain overlay hides that)
  // (2560px-wide photo: on a Retina screen wider than ~1700px it is necessarily stretched a little)
  if (m.blow > (phone ? 1.8 : m.vw > 1700 ? 1.55 : 1.35)) bad.push(`${label}: background blown up ${m.blow}x (blurry) ${m.urls.join(' ')}`);
  return bad;
}

for (const [w, h] of [...DESKTOP, ...PHONES]) {
  const isPhoneSize = PHONES.some(([a, b]) => a === w && b === h);
  test(`${w}x${h} every page`, async ({ browser }, info) => {
    const phoneProject = /iphone|ios/.test(info.project.name);
    test.skip(phoneProject !== isPhoneSize, 'phone sizes run in the phone projects, window sizes in the desktop ones');
    test.setTimeout(150000);
    const ctx = await browser.newContext({ ...info.project.use, viewport: { width: w, height: h }, ...(phoneProject ? {} : { deviceScaleFactor: 2 }) });
    const page = await ctx.newPage();
    await local(page);
    await page.goto('https://amesharding.com/2/');
    await page.waitForFunction(() => window.__amesPaging && window.__amesPaging.ready, null, { timeout: 30000 });
    await page.waitForTimeout(2500);
    const bad = [];
    for (const n of [2, 3, 4, 5, 3, 2]) {
      await page.evaluate((n) => window.__amesPaging.goTo(n), n);
      await page.waitForTimeout(2600);
      let m = await measure(page);
      await bgSizes(page, m.urls); m = await measure(page);
      await page.screenshot({ path: info.outputPath(`${w}x${h}-p${n}.png`) });
      if (m.n !== n) { bad.push(`${w}x${h}: asked for page ${n}, showing ${m.n}`); continue; }
      bad.push(...checks(m, `${w}x${h} p${n}`, phoneProject));
      // left alone, the page stays put
      await page.waitForTimeout(n === 3 ? 5000 : 800);
      const still = await measure(page);
      if (still.n !== n) bad.push(`${w}x${h}: page ${n} moved on to ${still.n} by itself`);
    }
    // the map with a song open: the player grows; the hint and the map still keep clear
    await page.evaluate(() => window.__amesPaging.goTo(2)); await page.waitForTimeout(1500);
    await page.locator('#ames-mb .ames-light').first().click({ force: true });
    await page.waitForTimeout(1800);
    const mp = await measure(page);
    await page.screenshot({ path: info.outputPath(`${w}x${h}-p2-player.png`) });
    bad.push(...checks(mp, `${w}x${h} p2+player`, phoneProject));
    console.log(`${w}x${h}`, bad.length ? 'PROBLEMS' : 'ok');
    await ctx.close();
    expect(bad).toEqual([]);
  });
}
