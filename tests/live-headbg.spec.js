// Simulates the planned Readymag change: <HEAD> snippet added, per-page background pictures removed.
// LIVE=1 [SIMULATE=1] npx playwright test tests/live-headbg.spec.js --project=desktop-chromium
import { test, expect, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';
const HEAD = readFileSync(new URL('../readymag/head-code.html', import.meta.url), 'utf8');

for (const [name, d] of Object.entries({ phone: devices['iPhone 13'], desktop: { viewport: { width: 1440, height: 900 } } })) {
  const { defaultBrowserType, ...use } = d;
  test.describe(name, () => {
    test.use(use);
    test(`shared background + email on ${name}`, async ({ page }) => {
      test.setTimeout(60000);
      if (process.env.LOCAL) await page.route(/chrisharding132\.github\.io\/amesharding-site\/src\/[^?]+\.js/, (route) => {
        const file = new URL(route.request().url()).pathname.split('/amesharding-site/')[1];
        route.fulfill({ body: readFileSync(new URL('../' + file, import.meta.url)), contentType: 'application/javascript' });
      });
      if (process.env.SIMULATE) {
        await page.route(/^https:\/\/amesharding\.com\/(\d+\/?)?$/, async (route) => {
          const res = await route.fetch(); const html = await res.text();
          const cut = html.replace(/<!-- AMES HARDING \u2014 SHARED BACKGROUND[\s\S]*?<\/style>\s*/, '');
          route.fulfill({ response: res, body: cut.replace('<head>', '<head>' + HEAD) });
        });
        // the per-page Readymag copies (removed in the editor) must not load
        await page.route(/i-p\.rmcdn\.net\/.*\/image-(7ae8b1ad|3454d234|de1fee9b|156aa66d|c4035f0d|db176543)/, (r) => r.abort());
      }
      const bgReqs = [];
      page.on('requestfinished', (rq) => { if (/bg-(portrait|landscape)\.jpg|image-(7ae8b1ad|3454d234|de1fee9b|156aa66d|c4035f0d|db176543)/.test(rq.url())) bgReqs.push(rq.url().split('/').pop().slice(0, 40)); });
      await page.goto('https://amesharding.com/');
      await page.waitForTimeout(3000);
      for (let n = 2; n <= 5; n++) { await page.evaluate(() => RM.viewerRouter.mag.goNextPage()); await page.waitForTimeout(900); }
      await page.evaluate(() => RM.viewerRouter.mag.goFirstPage()); await page.waitForTimeout(1500);
      await page.screenshot({ path: `audit-results/headbg-${name}.png` });
      const r = await page.evaluate(() => {
        const w = document.querySelector('.page.center-page'); const a = document.querySelector('a[href^="mailto"]');
        if (!a) return { bg: getComputedStyle(w).backgroundImage.split('/').pop().slice(0, 30), mailColor: 'NO LINK', mailText: '', underline: null };
        a.classList.add('hover');   // Readymag's hover state
        // the topmost element that paints a colour at the top of the screen must also carry the image
        const top = document.elementsFromPoint(innerWidth / 2, 20).find((e) => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)' || getComputedStyle(e).backgroundImage !== 'none');
        return { bg: getComputedStyle(w).backgroundImage.split('/').pop().slice(0, 30), mailColor: getComputedStyle(a).color, mailText: getComputedStyle(a.parentElement).color,
          underline: getComputedStyle(a).backgroundImage !== 'none', visibleBg: top ? getComputedStyle(top).backgroundImage.split('/').pop().slice(0, 22) : 'none' };
      });
      // email click: phones open the mail app; desktop copies the address and shows the note
      if (name === 'desktop') await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
      const opened = await page.evaluate(() => new Promise((res) => {
        window.__amesPaging.openEmail = res;
        const a = document.querySelector('a[href^="mailto"]'); if (!a) return res('no link');
        a.click();
        setTimeout(() => {
          const t = document.getElementById('ames-toast');
          res(window.__amesPaging.desktopEmail ? 'toast:' + (t && t.classList.contains('on') ? t.textContent : 'none') : 'nothing');
        }, 600);
      }));
      const phoneMeta = await page.evaluate(() => ({ viewport: document.querySelector('meta[name=viewport]').content, touch: getComputedStyle(document.querySelector('.mag')).touchAction, isPhone: document.documentElement.classList.contains('isphone') }));
      console.log('HB', name, JSON.stringify({ ...r, opened, phoneMeta, bgDownloads: bgReqs }));
      expect(r.mailColor, 'email link colour').toBe(r.mailText);
      expect(r.underline).toBe(false);
      expect(r.visibleBg, 'image on the visible background layer').toMatch(/bg-(portrait|landscape)\.jpg/);
      if (phoneMeta.isPhone) {
        expect(opened).toBe('mailto:ameshardingmusic@gmail.com');
        expect(phoneMeta.viewport, 'no zoom-in on form fields').toContain('maximum-scale=1');
        expect(['pinch-zoom', 'auto', 'manipulation'], 'pinch never blocked, so a zoomed page can be zoomed back out').toContain(phoneMeta.touch);
      } else {
        expect(opened, 'desktop click copies + shows the note').toContain('Email copied');
      }
      expect(bgReqs.length, 'background downloads').toBe(1);
      if (process.env.SIMULATE) {
        expect(r.bg).toMatch(/bg-(portrait|landscape)\.jpg/);
        expect(bgReqs.length, 'background downloads').toBe(1);
        expect(r.mailColor).toBe(r.mailText);
        expect(r.underline).toBe(false);
        if (phoneMeta.isPhone) {
        expect(opened).toBe('mailto:ameshardingmusic@gmail.com');
        expect(phoneMeta.viewport, 'no zoom-in on form fields').toContain('maximum-scale=1');
        expect(['pinch-zoom', 'auto', 'manipulation'], 'pinch never blocked, so a zoomed page can be zoomed back out').toContain(phoneMeta.touch);
      } else {
        expect(opened, 'desktop click copies + shows the note').toContain('Email copied');
      }
      }
    });
  });
}
