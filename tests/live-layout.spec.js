// Live layout check on several screens. LIVE=1 [LOCAL=1] npx playwright test tests/live-layout.spec.js --project=iphone-webkit
import { test, expect, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';

const SCREENS = {
  'iPhone SE': devices['iPhone SE'], 'iPhone 13': devices['iPhone 13'], 'iPhone 15 Pro Max': devices['iPhone 15 Pro Max'],
  'Galaxy S9+': devices['Galaxy S9+'], 'Desktop 1440': { viewport: { width: 1440, height: 900 } }, 'Laptop 1280': { viewport: { width: 1280, height: 720 } },
};

for (const [name, dev] of Object.entries(SCREENS)) {
  const { defaultBrowserType, ...use } = dev;
  test.describe(name, () => {
    test.use(use);
    test(`page 2 layout on ${name}`, async ({ page }) => {
      if (process.env.LOCAL) await page.route(/chrisharding132\.github\.io\/amesharding-site\/src\/[^?]+/, (route) => {
        const file = new URL(route.request().url()).pathname.split('/amesharding-site/')[1];
        route.fulfill({ body: readFileSync(new URL('../' + file, import.meta.url)), contentType: file.endsWith('.js') ? 'application/javascript' : 'image/png' });
      });
      await page.goto('https://amesharding.com/2');
      await expect(page.locator('#ames-mb .ames-light')).toHaveCount(28, { timeout: 20000 });
      await page.waitForTimeout(1200);
      const slug = name.replace(/\W+/g, '-');
      await page.screenshot({ path: `test-results/layout-${slug}-idle.png` });
      await page.locator('#ames-mb .ames-light').nth(10).dispatchEvent('click');
      await expect(page.locator('#ames-player')).toHaveClass(/active/);
      await page.waitForTimeout(500);
      await page.screenshot({ path: `test-results/layout-${slug}-playing.png` });
      const r = await page.evaluate(() => {
        const pl = document.getElementById('ames-player').getBoundingClientRect();
        const pts = [...document.querySelectorAll('#ames-mb .ames-light')].map((e) => { const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
        let min = 1e9; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) min = Math.min(min, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
        const offscreen = pts.filter((p) => p.x < 12 || p.x > innerWidth - 12 || p.y < 12 || p.y > innerHeight - 12).length;
        const underPlayer = pts.filter((p) => p.x > pl.left && p.x < pl.right && p.y + 14 > pl.top).length;
        const t = document.querySelector('#ames-player .ames-title');
        return { min: Math.round(min), offscreen, underPlayer, titleClipped: t.scrollHeight > t.clientHeight + 1 || t.scrollWidth > t.clientWidth + 1,
          tagsShown: getComputedStyle(document.querySelector('#ames-player .ames-tags')).display !== 'none', playerTop: Math.round(pl.top), vh: innerHeight };
      });
      console.log('LAYOUT', name, JSON.stringify(r));
      expect(r.offscreen).toBe(0);
      expect(r.underPlayer).toBe(0);
      expect(r.titleClipped).toBe(false);
      expect(r.tagsShown).toBe(true);
    });
  });
}
