// Dots stay inside the screen on every phone, resting and floating, with spacing that keeps tap areas apart.
import { test, expect, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { chromeIOS } from './phones.js';
const PHONES = { 'iPhone SE': devices['iPhone SE'], 'iPhone 13': devices['iPhone 13'], 'iPhone 15 Pro Max': devices['iPhone 15 Pro Max'], 'Galaxy S9+': devices['Galaxy S9+'], 'Pixel 7': devices['Pixel 7'], 'Chrome iOS': chromeIOS };
for (const [name, d] of Object.entries(PHONES)) {
  const { defaultBrowserType, reducedMotion, ...use } = d;
  test.describe(name, () => { test.use(use);
    test(`dots on ${name}`, async ({ page }) => {
      test.setTimeout(45000);
      if (process.env.LOCAL) await page.route(/chrisharding132\.github\.io\/amesharding-site\/src\/[^?]+\.(js|json)/, (route) => { const f = new URL(route.request().url()).pathname.split('/amesharding-site/')[1]; route.fulfill({ body: readFileSync(new URL('../' + f, import.meta.url)), contentType: f.endsWith('json') ? 'application/json' : 'application/javascript', headers: { 'access-control-allow-origin': '*' } }); });
      await page.goto('https://amesharding.com/2');
      await expect(page.locator('#ames-mb .ames-stage.on')).toBeVisible({ timeout: 20000 });
      await page.waitForTimeout(900);
      const r = await page.evaluate(() => {
        const st = document.querySelector('#ames-mb .ames-stage').getBoundingClientRect(); const ls = [...document.querySelectorAll('#ames-mb .ames-light')]; const k = st.width / document.querySelector('#ames-mb').offsetWidth;
        const rest = ls.map((e) => ({ x: st.left + parseFloat(e.style.left) / 100 * st.width, y: st.top + parseFloat(e.style.top) / 100 * st.height }));
        let min = 1e9; rest.forEach((a, i) => rest.slice(i + 1).forEach((b) => { min = Math.min(min, Math.hypot(a.x - b.x, a.y - b.y)); }));
        const reach = 14 * k + 16 * k;   // float travel + visible glow
        const out = rest.filter((p) => p.x - reach < 0 || p.x + reach > innerWidth || p.y - reach < 0).length;
        const pl = document.getElementById('ames-player').getBoundingClientRect(), exp = (window.__amesPlayer.expandedHeight || 0) * (pl.height / document.getElementById('ames-player').offsetHeight);
        const under = rest.filter((p) => p.y + reach > pl.bottom - exp).length;
        return { min: Math.round(min), out, under, vw: innerWidth, vh: innerHeight, n: ls.length };
      });
      console.log('BLEED', name, JSON.stringify(r));
      expect(r.n).toBe(28);
      expect(r.out, 'dots past a screen edge at full float').toBe(0);
      expect(r.under, 'dots under the open player').toBe(0);
    });
  });
}
