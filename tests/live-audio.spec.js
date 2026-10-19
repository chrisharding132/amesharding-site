// Live: tap-to-sound time, music across pages, now-playing bar. LIVE=1 npx playwright test tests/live-audio.spec.js
import { test, expect, devices } from '@playwright/test';
import { PHONE } from './phones.js';
for (const [name, d] of Object.entries({ phone: PHONE, desktop: { viewport: { width: 1440, height: 900 } } })) {
  const { defaultBrowserType, ...use } = d;
  test.describe(name, () => {
    test.use(use);
    test(`audio flow on ${name}`, async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('https://amesharding.com/2');
      await expect(page.locator('#ames-mb .ames-stage.on')).toBeVisible({ timeout: 20000 });
      await page.waitForFunction(() => window.__amesPlayer && window.__amesPlayer.resolve('a/Hummin-Intro-140BPM.mp3').includes('github.io'), null, { timeout: 10000 });
      const light = page.locator('#ames-mb .ames-light').nth(3);
      await light.dispatchEvent('pointerdown');
      const t0 = Date.now();
      await light.dispatchEvent('click');
      await expect(light).toHaveClass(/playing/, { timeout: 15000 });
      const startMs = Date.now() - t0;
      await page.waitForTimeout(700);
      await expect(page.locator('#ames-mini'), 'no now-playing bar on the page with the full player').not.toHaveClass(/\bon\b/);
      const src = await page.evaluate(() => document.querySelector('audio') ? null : null) ;
      const playingSrc = await page.evaluate(() => { const P = window.__amesPlayer; return P.resolve(P.track.src); });
      // leave the page: music continues, bar appears
      await page.evaluate(() => RM.viewerRouter.mag.goNextPage());
      await expect(page.locator('#ames-mini')).toHaveClass(/\bon\b/, { timeout: 5000 });
      await expect(page.locator('#ames-mini')).toHaveClass(/playing/);
      await page.screenshot({ path: `audit-results/mini-${name}.png` });
      // tap the title: back to the map, bar hides
      await page.locator('#ames-mini .t').click();
      await expect(page).toHaveURL(/\/2\/?$/, { timeout: 5000 });
      await expect(page.locator('#ames-mini')).not.toHaveClass(/\bon\b/, { timeout: 5000 });
      console.log('AUDIO', name, JSON.stringify({ tapToSoundMs: startMs, playingFrom: playingSrc.split('/').slice(2, 3)[0] }));
      expect(playingSrc).toContain('github.io');
    });
  });
}
