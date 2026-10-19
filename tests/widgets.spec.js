import { test, expect } from '@playwright/test';

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/silence\.wav|favicon/.test(m.text())) errors.push(m.text()); });
  return errors;
}

test('Airtable data replaces the fallback with no duplicate dots', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/tests/harness.html');
  await expect(page.locator('#ames-mb .ames-light')).toHaveCount(3);
  await page.waitForTimeout(500);
  await expect(page.locator('#ames-mb .ames-light')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('loading the scripts twice does not double anything', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/tests/harness.html');
  await expect(page.locator('#ames-mb .ames-light')).toHaveCount(3);
  await page.addScriptTag({ url: '/src/mood.js' });
  await page.addScriptTag({ url: '/src/player.js' });
  await expect(page.locator('#ames-mb .ames-light')).toHaveCount(3);
  await expect(page.locator('#ames-player .ames-group')).toHaveCount(2);
  await expect(page.locator('style#ames-mb-css')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Readymag re-inserting the widgets remounts them once', async ({ page }) => {
  await page.goto('/tests/harness.html');
  await expect(page.locator('#ames-mb .ames-light')).toHaveCount(3);
  await page.evaluate(() => {
    document.querySelectorAll('.w').forEach((w) => { w.innerHTML = w.innerHTML.includes('ames-mb') ? '<div id="ames-mb"></div>' : '<div id="ames-player"></div>'; });
  });
  await expect(page.locator('#ames-mb .ames-light')).toHaveCount(3);
  await expect(page.locator('#ames-player .ames-group')).toHaveCount(2);
});

test('without Airtable the 28 fallback tracks render and filters still work', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/tests/harness.html?prefetch=fail');
  await expect(page.locator('#ames-mb .ames-light')).toHaveCount(28);
  await page.locator('.ames-fbtn', { hasText: /^Slow$/ }).click();
  await expect(page.locator('#ames-mb .ames-light:not(.hid)')).toHaveCount(5);
  expect(errors).toEqual([]);
});

test('filters hide non-matching lights and toggle off again', async ({ page }) => {
  await page.goto('/tests/harness.html');
  await expect(page.locator('#ames-mb .ames-light')).toHaveCount(3);
  const inst = page.locator('.ames-fbtn', { hasText: /^Inst$/ });
  await inst.click();
  await expect(page.locator('#ames-mb .ames-light.hid')).toHaveCount(2);
  await expect(inst).toHaveClass(/on/);
  await inst.click();
  await expect(page.locator('#ames-mb .ames-light.hid')).toHaveCount(0);
});

test('tapping a light shows the track in the player', async ({ page }) => {
  await page.goto('/tests/harness.html');
  await expect(page.locator('#ames-mb .ames-light')).toHaveCount(3);
  await page.evaluate(() => document.querySelectorAll('#ames-mb .ames-light')[1].click());
  await expect(page.locator('#ames-player')).toHaveClass(/active/);
  await expect(page.locator('#ames-player .ames-title')).toHaveText('Two');
  await expect(page.locator('#ames-mb .ames-light.sel')).toHaveCount(1);
  await page.locator('#ames-player .ames-close').click();
  await expect(page.locator('#ames-player .ames-idle')).toBeVisible();
});

test('portrait box shows the portrait axis labels', async ({ page }) => {
  await page.goto('/tests/harness.html');
  await expect(page.locator('#ames-mb .ames-labels.p')).toBeVisible();
  await expect(page.locator('#ames-mb .ames-labels.l')).toBeHidden();
  for (const img of ['labels-portrait.png', 'cursor.png', 'grain.png']) {
    expect((await page.request.get('/src/assets/' + img)).status()).toBe(200);
  }
});

test('player fits the 320x78 phone strip without overflow', async ({ page }) => {
  await page.goto('/tests/harness.html');
  const over = await page.evaluate(() => { const p = document.getElementById('ames-player'); return p.scrollHeight - p.clientHeight; });
  expect(over).toBeLessThanOrEqual(1);
});
