// Page 4 at the Chrome-on-iPhone size: every line of text sits inside the visible screen.
// CHROME_IOS=1 LIVE=1 npx playwright test tests/live-press.spec.js --project=chrome-ios-webkit
import { test, expect } from '@playwright/test';

test('page 4 text fits the visible screen', async ({ page }) => {
  test.setTimeout(40000);
  await page.goto('https://amesharding.com/4/');
  await page.waitForTimeout(3500);
  const r = await page.evaluate(() => {
    const pages = [...document.querySelectorAll('.page')];
    const p = pages[3];
    const pr = p.getBoundingClientRect();
    const text = [...p.querySelectorAll('.widget-text-v3, .rmwidget')].filter((e) => e.textContent.trim());
    const bottom = Math.max(...text.map((e) => e.getBoundingClientRect().bottom));
    return { vh: innerHeight, pageTop: Math.round(pr.top), pageH: Math.round(pr.height), textBottom: Math.round(bottom), over: Math.round(bottom - innerHeight), blocks: text.length };
  });
  console.log('PRESS', JSON.stringify(r));
  await page.screenshot({ path: 'audit-results/press-chrome-ios.png' });
  expect(r.over, 'text past the bottom of the screen').toBeLessThanOrEqual(0);
});
