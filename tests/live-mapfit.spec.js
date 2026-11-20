// The mood map always fits between the header and the player on phones: no light, label or ring is cut off,
// whether you arrive from page 1, a direct link, or come back to it, and with the player open.
// LIVE=1 [LOCAL=1] npx playwright test tests/live-mapfit.spec.js --project=chrome-ios-webkit --project=iphone-webkit
import { test, expect } from './mute.js';
import { readFileSync } from 'node:fs';

// phones only (it measures in phone units; computer windows of every size are covered by live-sizes.spec.js)
test.beforeEach(({}, i) => { test.skip(!/iphone|ios/.test(i.project.name)); });

async function local(page) {
  if (!process.env.LOCAL) return;
  await page.route(/chrisharding132\.github\.io\/amesharding-site\/src\/[^?]+\.(js|png)/, (route) => {
    const file = new URL(route.request().url()).pathname.split('/amesharding-site/')[1];
    route.fulfill({ body: readFileSync(new URL('../' + file, import.meta.url)), contentType: file.endsWith('js') ? 'application/javascript' : 'image/png', headers: { 'access-control-allow-origin': '*' } });
  });
}

// everything drawn on the map, in screen coordinates, against the space it has
const fit = (page) => page.evaluate(() => {
  const box = document.querySelector('#ames-mb'); if (!box) return null;
  const head = document.getElementById('ames-head'), hb = head && head.classList.contains('on') ? head.getBoundingClientRect().bottom : 0;
  const pl = document.getElementById('ames-player'), pr = pl && pl.getBoundingClientRect();
  // (the swipe hint sits beside the page dots on the right edge, not under the map: live-sizes checks it covers no light)
  const floor = Math.min(pr && pr.height ? pr.top : innerHeight, innerHeight);
  const items = [...box.querySelectorAll('.ames-light')].map((l) => l.getBoundingClientRect()).map((r) => [r.left + r.width / 2, r.top + r.height / 2]);
  const img = [...box.querySelectorAll('.ames-labels')].find((i) => i.style.display !== 'none'), ir = img && img.getBoundingClientRect();
  const ys = items.map((p) => p[1]);
  return { hb: Math.round(hb), floor: Math.round(floor), top: Math.round(Math.min(...ys)), bottom: Math.round(Math.max(...ys)),
    labels: ir ? [Math.round(ir.top), Math.round(ir.bottom)] : null, n: items.length, vh: innerHeight };
});

for (const size of [[440, 782], [402, 684], [390, 664]]) {
  test(`map fits on a ${size[0]}x${size[1]} phone`, async ({ browser }, info) => {
    test.setTimeout(90000);
    const ctx = await browser.newContext({ ...info.project.use, viewport: { width: size[0], height: size[1] } });
    const page = await ctx.newPage();
    await local(page);
    const bad = [];
    const check = async (label) => {
      await page.waitForTimeout(1600);
      const f = await fit(page);
      await page.screenshot({ path: info.outputPath(`${size[0]}-${label}.png`) });
      if (!f || !f.n) { bad.push(label + ' no map'); return; }
      // lights (radius ~16) stay below the header and above the player
      if (f.top - 16 < f.hb || f.bottom + 16 > f.floor) bad.push(`${label} lights ${f.top}-${f.bottom} outside ${f.hb}-${f.floor}`);
      if (f.labels && (f.labels[0] < f.hb - 2 || f.labels[1] > f.floor + 2)) bad.push(`${label} labels ${f.labels} outside ${f.hb}-${f.floor}`);
      console.log(size.join('x'), label, JSON.stringify(f));
    };
    await page.goto('https://amesharding.com/');
    await page.waitForFunction(() => window.RM && RM.viewerRouter && RM.viewerRouter.mag && RM.viewerRouter.mag.currentPage && RM.viewerRouter.mag.currentPage.num === 2, null, { timeout: 20000 });
    await check('from-landing');
    await page.evaluate(() => window.__amesPaging.goTo(3)); await page.waitForTimeout(1200);
    await page.evaluate(() => window.__amesPaging.goTo(2));
    await check('back-from-3');
    await page.goto('https://amesharding.com/2/');
    await page.waitForFunction(() => window.__amesPaging && window.__amesPaging.ready, null, { timeout: 20000 });
    await check('direct');
    // Chrome on iPhone grows/shrinks its toolbars mid-swipe: the window changes height during the page change
    await page.evaluate(() => window.__amesPaging.goTo(3)); await page.waitForTimeout(1500);
    await page.evaluate(() => window.__amesPaging.goTo(2));
    await page.waitForTimeout(120);
    await page.setViewportSize({ width: size[0], height: size[1] + 110 });
    await page.waitForTimeout(250);
    await page.setViewportSize({ width: size[0], height: size[1] });
    await check('toolbar-mid-turn');
    const off = await page.evaluate(() => { const p = document.querySelectorAll('.mag .page')[1].getBoundingClientRect(); return Math.round(p.top); });
    if (Math.abs(off) > 3) bad.push('map page sits ' + off + 'px off the top after the toolbar change');
    await page.locator('#ames-mb .ames-light').first().click({ force: true });
    await check('player-open');
    await ctx.close();
    expect(bad).toEqual([]);
  });
}

// Chrome on iPhone's toolbars growing and shrinking never moves you to another page
test('toolbar changes keep you on the page you are on', async ({ browser }, info) => {
  test.setTimeout(120000);
  const ctx = await browser.newContext({ ...info.project.use, viewport: { width: 440, height: 782 } });
  const page = await ctx.newPage();
  await local(page);
  await page.goto('https://amesharding.com/3/');
  await page.waitForFunction(() => window.__amesPaging && window.__amesPaging.ready, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  const seen = [];
  for (const n of [3, 4, 3, 5]) {
    await page.evaluate((n) => window.__amesPaging.goTo(n), n); await page.waitForTimeout(1400);
    for (const h of [892, 782, 840, 700, 782]) {
      await page.setViewportSize({ width: 440, height: h });
      await page.waitForTimeout(200 + Math.round(Math.random() * 300));
    }
    await page.waitForTimeout(1500);
    const s = await page.evaluate(() => ({ cur: window.__amesPaging.cur(), top: Math.round(document.querySelectorAll('.mag .page')[window.__amesPaging.cur() - 1].getBoundingClientRect().top) }));
    seen.push([n, s.cur, s.top]);
  }
  console.log('toolbar', JSON.stringify(seen));
  await ctx.close();
  expect(seen.filter(([n, c, t]) => n !== c || Math.abs(t) > 3)).toEqual([]);
});
