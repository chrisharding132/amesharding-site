// The published pages with the local code (LOCAL=1) or as deployed: seek, map spread, filters, form, wheel, photos, first swipe.
// LIVE=1 LOCAL=1 npx playwright test tests/live-batch.spec.js --project=desktop-chromium --project=desktop-webkit --project=chrome-ios-webkit
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

async function local(page) {
  if (!process.env.LOCAL) return;
  await page.route(/chrisharding132\.github\.io\/amesharding-site\/src\/[^?]+\.(js|png)/, (route) => {
    const file = new URL(route.request().url()).pathname.split('/amesharding-site/')[1];
    route.fulfill({ body: readFileSync(new URL('../' + file, import.meta.url)), contentType: file.endsWith('js') ? 'application/javascript' : 'image/png', headers: { 'access-control-allow-origin': '*' } });
  });
}
const lightsOf = (page) => page.evaluate(() => [...document.querySelectorAll('#ames-mb .ames-light')].map((e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }));

const isDesktop = (i) => i.project.name.startsWith('desktop');
{
  test.describe('desktop', () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test.beforeEach(({}, i) => { test.skip(!isDesktop(i)); });

    test('seek stays in the song', async ({ page, browserName }) => {
      test.setTimeout(40000);
      await local(page);
      await page.goto('https://amesharding.com/2/');
      await page.waitForSelector('#ames-mb .ames-stage.on');
      await page.locator('#ames-mb .ames-light').nth(4).click({ force: true });
      await page.waitForFunction(() => window.__amesPlayer.state === 'playing' || window.__amesPlayer.state === 'paused', null, { timeout: 15000 });
      const title = await page.locator('.ames-title').textContent();
      const bar = await page.locator('.ames-prog').boundingBox();
      await page.waitForFunction(() => parseFloat(document.querySelector('.ames-fill').style.width) > 0 || window.__amesPlayer.state === 'paused', null, { timeout: 8000 });
      await page.mouse.click(bar.x + bar.width * 0.5, bar.y + bar.height / 2);
      await page.waitForTimeout(500);
      const r = await page.evaluate(() => ({ title: document.querySelector('.ames-title').textContent, fill: parseFloat(document.querySelector('.ames-fill').style.width), st: window.__amesPlayer.state }));
      console.log('SEEK', browserName, JSON.stringify(r));
      expect(r.title, 'same song').toBe(title);
      expect(Math.abs(r.fill - 50), 'landed near the click').toBeLessThan(6);
    });

    test('map, filters, room for more songs', async ({ page, browserName }) => {
      test.setTimeout(50000);
      await local(page);
      await page.goto('https://amesharding.com/2/');
      await page.waitForSelector('#ames-mb .ames-stage.on');
      await page.waitForTimeout(800);
      const z = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#ames-mb').closest('.page-content-container')).zoom) || 1);
      const ls = await lightsOf(page), ys = ls.map((p) => p.y * z);
      const player = await page.locator('#ames-player').boundingBox();
      console.log('SPREAD', browserName, Math.round(Math.min(...ys)), Math.round(Math.max(...ys)), 'player', Math.round(player.y));
      expect(Math.max(...ys) - Math.min(...ys), 'uses the height of the screen').toBeGreaterThan(520);
      await page.screenshot({ path: `audit-results/batch-map-${browserName}.png` });

      // a filter greys the others out: all still there, still visible
      await page.locator('.ames-fbtn', { hasText: 'Slow' }).click();
      await page.waitForTimeout(500);
      const grey = await page.evaluate(() => { const h = [...document.querySelectorAll('#ames-mb .ames-light.hid')]; return { n: h.length, all: document.querySelectorAll('#ames-mb .ames-light').length, op: getComputedStyle(h[0]).opacity, f: getComputedStyle(h[0]).filter, anim: getComputedStyle(h[0]).animationName }; });
      console.log('GREY', JSON.stringify(grey));
      expect(grey.n).toBeGreaterThan(0);
      expect(parseFloat(grey.op), 'faint but still there').toBeGreaterThan(0.12);
      expect(parseFloat(grey.op)).toBeLessThan(0.3);
      await page.screenshot({ path: `audit-results/batch-grey-${browserName}.png` });

      // nothing matches: the message clears the ORGANIC / ELECTRONIC line
      await page.locator('.ames-fbtn', { hasText: 'Vox (no lyrics)' }).click();
      await page.waitForTimeout(300);
      const em = await page.evaluate(() => { const r = document.querySelector('#ames-mb .ames-empty').getBoundingClientRect(), s = document.querySelector('#ames-mb .ames-stage').getBoundingClientRect(); return { top: r.top, mid: s.top + s.height / 2 }; });
      expect(em.top, 'below the side labels').toBeGreaterThan(em.mid + 20);
      await page.screenshot({ path: `audit-results/batch-empty-${browserName}.png` });
      await page.locator('#ames-mb .ames-empty button').click();

      // three times the songs: every light inside the margins and clear of the words
      await page.evaluate(() => {
        const S = window.__amesMood, base = S.tracks;
        S.tracks = [].concat(base, base.map((t, i) => ({ ...t, src: t.src + 'b', x: (t.x + 0.37 * i) % 1, y: (t.y + 0.21 * i) % 1 })), base.map((t, i) => ({ ...t, src: t.src + 'c', x: (t.x + 0.61 * i) % 1, y: (t.y + 0.43 * i) % 1 })));
        const t0 = performance.now();
        S.boxes.forEach((b) => { b._stage && b._stage.querySelectorAll('.ames-light').length; });
        window.postMessage({ amesPlayerSize: true }, '*');
        window.__t = performance.now() - t0;
      });
      await page.evaluate(() => new Promise((r) => { const S = window.__amesMood; window.dispatchEvent(new Event('resize')); setTimeout(r, 100); }));
      const many = await page.evaluate(async () => {
        const S = window.__amesMood, box = S.boxes[0], stage = box._stage;
        // same clean rebuild the page does when Airtable brings new songs
        window.__amesRender && window.__amesRender(box);
        await new Promise((r) => setTimeout(r, 900));
        const L = box._layout, ls = [...stage.querySelectorAll('.ames-light')].map((e) => ({ x: parseFloat(e.style.left) / 100 * L.W, y: parseFloat(e.style.top) / 100 * L.H }));
        let min = 1e9; ls.forEach((a, i) => ls.forEach((b, j) => { if (j > i) min = Math.min(min, Math.hypot(a.x - b.x, a.y - b.y)); }));
        return { n: ls.length, L, minX: Math.min(...ls.map((p) => p.x)), maxX: Math.max(...ls.map((p) => p.x)), minY: Math.min(...ls.map((p) => p.y)), maxY: Math.max(...ls.map((p) => p.y)), min };
      });
      console.log('MANY', browserName, JSON.stringify(many));
      expect(many.n).toBe(84);
      expect(many.minX).toBeGreaterThanOrEqual(many.L.x0 - 1);
      expect(many.maxX).toBeLessThanOrEqual(many.L.x1 + 1);
      expect(many.minY).toBeGreaterThanOrEqual(many.L.y0 - 1);
      expect(many.maxY).toBeLessThanOrEqual(many.L.y1 + 1);
      await page.screenshot({ path: `audit-results/batch-many-${browserName}.png` });
    });

    test('form, wheel and photos', async ({ page, browserName }) => {
      test.setTimeout(50000);
      await local(page);
      await page.goto('https://amesharding.com/');
      await page.waitForTimeout(3000);
      // a second push while the first page change is still running must still count
      const wheelAt = () => page.mouse.wheel(0, 60);
      await page.mouse.move(700, 450);
      await wheelAt();
      await page.waitForTimeout(260);
      await wheelAt();
      await page.waitForTimeout(1100);
      const n = await page.evaluate(() => RM.viewerRouter.mag.currentPage.num);
      console.log('WHEEL', browserName, n);
      expect(n, 'both pushes moved a page').toBe(3);

      // page 3: the columns hold only when pointed at
      await page.waitForTimeout(800);
      const cols = await page.evaluate(() => [...document.querySelectorAll('.page.center-page .animation-container')].map((c) => { const r = c.getBoundingClientRect(); return [r.left, r.right]; }));
      const held = () => page.evaluate(() => document.querySelector('.page.center-page').classList.contains('ames-hold'));
      await page.mouse.move(720, 450); await page.waitForTimeout(150);
      expect(await held(), 'middle of the page: keeps moving').toBe(false);
      await page.mouse.move((cols[0][0] + cols[0][1]) / 2, 450); await page.waitForTimeout(150);
      expect(await held(), 'over a column: holds').toBe(true);
      await page.mouse.move(720, 300); await page.waitForTimeout(150);
      expect(await held(), 'away again: moves').toBe(false);

      await page.goto('https://amesharding.com/5/');
      await page.waitForTimeout(3500);
      const bb = await page.locator('.widget-form .button').boundingBox();
      const f = await page.evaluate(() => { const c = document.querySelector('.widget-form input[type=checkbox]'); return { vh: innerHeight, checked: c.checked, shift: window.__amesPaging.formShift }; });
      f.bottom = Math.round(bb.y + bb.height);
      console.log('FORM', browserName, JSON.stringify(f), JSON.stringify(await page.evaluate(() => [...document.querySelector('.widget-form').closest('.page').querySelectorAll('.rmwidget')].map((w) => [w.className.slice(0, 34), Math.round(w.getBoundingClientRect().top), Math.round(w.getBoundingClientRect().height)]))));
      const hdB = await page.locator('.page.center-page .widget-text-v3', { hasText: 'MAKE SOMETHING' }).boundingBox();
      const nameB = await page.locator('.widget-form .input-wrapper').first().boundingBox();
      console.log('FORMGAP', hdB.y, hdB.y + hdB.height, nameB.y);
      expect(hdB.y + hdB.height, 'heading above the fields').toBeLessThanOrEqual(nameB.y);
      expect(hdB.y, 'heading on screen').toBeGreaterThan(20);
      expect(f.checked).toBe(true);
      expect(f.vh - f.bottom, 'clear of the bottom').toBeGreaterThan(150);
      await page.screenshot({ path: `audit-results/batch-form-${browserName}.png` });
      await page.locator('.widget-form .input-checkbox-wrapper').click();
      expect(await page.locator('.widget-form input[type=checkbox]').isChecked(), 'can be unticked').toBe(false);
    });
  });
}

test.describe('phone', () => {
  test.beforeEach(({}, i) => { test.skip(i.project.name !== 'chrome-ios-webkit'); });
  test('first swipe lands exactly, title centred, form clear', async ({ page }) => {
    test.setTimeout(50000);
    await local(page);
    // Listen must never show before it has its place
    await page.addInitScript(() => { window.__lt = []; const f = () => { const b = document.getElementById('ames-listen'); if (b) { const r = b.getBoundingClientRect(); if (getComputedStyle(b).visibility === 'visible') window.__lt.push(Math.round(r.top)); } requestAnimationFrame(f); }; requestAnimationFrame(f); });
    await page.goto('https://amesharding.com/');
    await page.waitForTimeout(3500);
    const lt = await page.evaluate(() => [...new Set(window.__lt)]);
    console.log('LISTEN', JSON.stringify(lt));
    expect(lt.length, 'one position only').toBe(1);

    // page 1 re-sizes mid-glide, as Chrome on iPhone does the first time: must still land exactly on page 2
    const land = await page.evaluate(() => new Promise((res) => {
      const ps = document.querySelectorAll('.mag .page');
      window.__amesPaging.goTo(2);
      setTimeout(() => { ps[0].style.marginBottom = '30px'; }, 150);
      setTimeout(() => res({ top: Math.round(ps[1].getBoundingClientRect().top), prev: Math.round(ps[0].getBoundingClientRect().bottom), vis: getComputedStyle(ps[0]).visibility }), 1200);
    }));
    console.log('LAND', JSON.stringify(land));
    expect(land.top, 'page 2 exactly at the top').toBe(0);
    await page.evaluate(() => { document.querySelectorAll('.mag .page')[0].style.marginBottom = ''; });

    await page.waitForSelector('#ames-mb .ames-stage.on');
    await page.locator('#ames-mb .ames-light').nth(3).click({ force: true });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.ames-info')).textAlign)).toBe('center');
    await page.screenshot({ path: 'audit-results/batch-player-phone.png' });
    await page.locator('.ames-fbtn', { hasText: 'Slow' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'audit-results/batch-grey-phone.png' });

    await page.goto('https://amesharding.com/5/');
    await page.waitForTimeout(3500);
    const f = await page.evaluate(() => { const b = document.querySelector('.widget-form .button').getBoundingClientRect(); return { bottom: Math.round(b.bottom), vh: innerHeight, checked: document.querySelector('.widget-form input[type=checkbox]').checked, shift: window.__amesPaging.formShift }; });
    console.log('FORMP', JSON.stringify(f));
    const hdB = await page.locator('.widget-text-v3', { hasText: 'MAKE SOMETHING' }).first().boundingBox();
    const nameB = await page.locator('.widget-form .input-wrapper').first().boundingBox();
    console.log('FORMGAP', hdB.y, hdB.y + hdB.height, nameB.y);
    expect(hdB.y + hdB.height, 'heading above the fields').toBeLessThanOrEqual(nameB.y);
    expect(f.checked).toBe(true);
    expect(f.vh - f.bottom, 'clear of the bottom').toBeGreaterThan(60);
    await page.screenshot({ path: 'audit-results/batch-form-phone.png' });
    // the same room on a phone with three times the songs
    await page.goto('https://amesharding.com/2/');
    await page.waitForSelector('#ames-mb .ames-stage.on');
    const many = await page.evaluate(async () => {
      const S = window.__amesMood, box = S.boxes[0], base = S.tracks;
      S.tracks = [].concat(base, base.map((t, i) => ({ ...t, src: t.src + 'b', x: (t.x + 0.37 * i) % 1, y: (t.y + 0.21 * i) % 1 })), base.map((t, i) => ({ ...t, src: t.src + 'c', x: (t.x + 0.61 * i) % 1, y: (t.y + 0.43 * i) % 1 })));
      window.__amesRender(box);
      await new Promise((r) => setTimeout(r, 900));
      const L = box._layout, ls = [...box._stage.querySelectorAll('.ames-light')].map((e) => ({ x: parseFloat(e.style.left) / 100 * L.W, y: parseFloat(e.style.top) / 100 * L.H }));
      let min = 1e9; ls.forEach((a, i) => ls.forEach((b, j) => { if (j > i) min = Math.min(min, Math.hypot(a.x - b.x, a.y - b.y)); }));
      return { n: ls.length, L, minX: Math.min(...ls.map((p) => p.x)), maxX: Math.max(...ls.map((p) => p.x)), minY: Math.min(...ls.map((p) => p.y)), maxY: Math.max(...ls.map((p) => p.y)), min };
    });
    console.log('MANYP', JSON.stringify(many));
    expect(many.minX).toBeGreaterThanOrEqual(many.L.x0 - 1);
    expect(many.maxX).toBeLessThanOrEqual(many.L.x1 + 1);
    expect(many.minY).toBeGreaterThanOrEqual(many.L.y0 - 1);
    expect(many.maxY).toBeLessThanOrEqual(many.L.y1 + 1);
    await page.screenshot({ path: 'audit-results/batch-many-phone.png' });
  });
});
