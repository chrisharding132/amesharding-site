// Whole-site audit on the published site. LIVE=1 npx playwright test tests/live-audit.spec.js
import { test, devices } from '@playwright/test';
import { PHONE } from './phones.js';
import { writeFileSync } from 'node:fs';

const TARGETS = { phone: PHONE, desktop: { viewport: { width: 1440, height: 900 } } };

for (const [kind, dev] of Object.entries(TARGETS)) {
  const { defaultBrowserType, ...use } = dev;
  test.describe(kind, () => {
    test.use(use);
    test(`audit ${kind}`, async ({ page }, info) => {
      test.setTimeout(120000);
      const out = { kind, project: info.project.name, requests: [], failed: [], console: [], pages: [] };
      const t0 = Date.now();
      page.on('requestfinished', async (rq) => {
        const r = await rq.response(); const t = rq.timing();
        let size = 0; try { size = (await rq.sizes()).responseBodySize; } catch {}
        out.requests.push({ url: rq.url().slice(0, 140), type: rq.resourceType(), status: r && r.status(), ms: Math.round(t.responseEnd), kb: Math.round(size / 1024), at: Date.now() - t0 });
      });
      page.on('requestfailed', (rq) => out.failed.push({ url: rq.url().slice(0, 140), err: rq.failure() && rq.failure().errorText }));
      page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) out.console.push(m.type() + ': ' + m.text().slice(0, 200)); });
      page.on('pageerror', (e) => out.console.push('pageerror: ' + e.message));
      const dir = `audit-results/${kind}-${info.project.name}`;

      await page.goto('https://amesharding.com/', { waitUntil: 'commit' });
      for (const ms of [400, 900, 1600, 3000]) {
        await page.waitForTimeout(ms - (Date.now() - t0) > 0 ? ms - (Date.now() - t0) : 0);
        await page.screenshot({ path: `${dir}-load-${ms}ms.png` });
      }
      await page.waitForLoadState('load');
      out.timing = await page.evaluate(() => {
        const n = performance.getEntriesByType('navigation')[0];
        const paint = Object.fromEntries(performance.getEntriesByType('paint').map((p) => [p.name, Math.round(p.startTime)]));
        return { ttfb: Math.round(n.responseStart), domContentLoaded: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), ...paint };
      });

      await page.waitForFunction(() => window.RM && RM.viewerRouter && RM.viewerRouter.mag, null, { timeout: 20000 });
      const count = await page.evaluate(() => RM.viewerRouter.mag.getPagesCount());
      for (let n = 1; n <= count; n++) {
        if (n > 1) await page.evaluate(() => RM.viewerRouter.mag.goNextPage());
        await page.waitForTimeout(350);
        await page.screenshot({ path: `${dir}-p${n}-early.png` });
        await page.waitForTimeout(2200);
        await page.screenshot({ path: `${dir}-p${n}.png` });
        out.pages.push(await page.evaluate(async (n) => {
          const mag = RM.viewerRouter.mag, el = mag.currentPage && mag.currentPage.el;
          const scope = el || document;
          const imgs = [...scope.querySelectorAll('img')].filter((i) => i.getBoundingClientRect().width > 0);
          const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => (i.currentSrc || i.src).slice(0, 120));
          const pending = imgs.filter((i) => !i.complete).map((i) => (i.currentSrc || i.src).slice(0, 120));
          const bgs = [...scope.querySelectorAll('*')].map((e) => getComputedStyle(e).backgroundImage).filter((b) => b && b !== 'none' && b.includes('url(')).length;
          const videos = [...scope.querySelectorAll('video')].map((v) => ({ src: (v.currentSrc || '').slice(0, 100), ready: v.readyState, paused: v.paused }));
          const iframes = [...scope.querySelectorAll('iframe')].map((f) => f.src.slice(0, 100));
          const texts = [...scope.querySelectorAll('.rmwidget.text, [class*="widget-text"]')].map((t) => {
            const p = t.querySelector('p, span, div') || t; const cs = getComputedStyle(p);
            return { text: (t.innerText || '').trim().slice(0, 40), font: cs.fontFamily.slice(0, 60), loaded: document.fonts.check(`12px ${cs.fontFamily}`) };
          }).filter((t) => t.text);
          return { n, path: location.pathname, title: document.title, imgs: imgs.length, broken, pending, bgImages: bgs, videos, iframes, texts,
            fonts: document.fonts.status, fontFaces: [...document.fonts].map((f) => f.family + ':' + f.status).filter((v, i, a) => a.indexOf(v) === i) };
        }, n));
      }
      out.requests.sort((a, b) => b.ms - a.ms);
      writeFileSync(`${dir}.json`, JSON.stringify(out, null, 1));
    });
  });
}
