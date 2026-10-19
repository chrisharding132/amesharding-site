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

test('playing state keeps progress bar and close button inside the phone strip', async ({ page }) => {
  await page.goto('/tests/harness.html');
  await expect(page.locator('#ames-mb .ames-light')).toHaveCount(3);
  await page.evaluate(() => window.postMessage({ amesPlayer: true, action: 'play',
    track: { title: 'A Very Long Track Title That Should Truncate (Interlude) 120 BPM', tags: [], src: '/tests/silence.wav' } }, '*'));
  await expect(page.locator('#ames-player')).toHaveClass(/active/);
  const box = await page.locator('#ames-player').boundingBox();
  for (const sel of ['.ames-play', '.ames-prog', '.ames-close']) {
    const b = await page.locator('#ames-player ' + sel).boundingBox();
    expect(b.x + b.width, sel + ' right edge').toBeLessThanOrEqual(box.x + box.width);
  }
});

for (const layout of ['phone', 'desktop']) {
  test(`lights spread out, stay inside the box and off the labels (${layout})`, async ({ page }) => {
    await page.setViewportSize(layout === 'desktop' ? { width: 1024, height: 520 } : { width: 320, height: 568 });
    await page.goto('/tests/harness.html?prefetch=cluster' + (layout === 'desktop' ? '&layout=desktop' : ''));
    await expect(page.locator('#ames-mb .ames-light')).toHaveCount(28);
    await page.waitForTimeout(600); // left/top transition
    const r = await page.evaluate(() => {
      const box = document.getElementById('ames-mb').getBoundingClientRect();
      const pts = [...document.querySelectorAll('#ames-mb .ames-light')].map((e) => { const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
      let min = 1e9; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) min = Math.min(min, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      return { box: [box.left, box.top, box.right, box.bottom], min, spreadX: (Math.max(...xs) - Math.min(...xs)) / box.width, spreadY: (Math.max(...ys) - Math.min(...ys)) / box.height,
        outside: pts.filter((p) => p.x - 16 < box.left || p.x + 16 > box.right || p.y - 16 < box.top || p.y + 16 > box.bottom).length, layout: document.getElementById('ames-mb')._layout };
    });
    expect(r.outside, JSON.stringify(r)).toBe(0);
    expect(r.min, 'closest pair of lights (px)').toBeGreaterThanOrEqual(30);
    expect(r.spreadY, 'vertical spread').toBeGreaterThan(0.6);
    if (layout === 'desktop') expect(r.spreadX, 'horizontal spread').toBeGreaterThan(0.6);
  });
}

test('phone player shows every desktop element when playing, inside the screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/tests/harness.html?prefetch=cluster');
  await expect(page.locator('#ames-mb .ames-light')).toHaveCount(28);
  await page.evaluate(() => window.postMessage({ amesPlayer: true, action: 'play',
    track: { title: 'Sister of the Lilies (Interlude) 90 BPM', duration: '0:21', tags: ['warm', 'playful', 'radio'], src: '/tests/silence.wav' } }, '*'));
  await expect(page.locator('#ames-player')).toHaveClass(/active/);
  const p = await page.locator('#ames-player').boundingBox();
  expect(p.y).toBeGreaterThanOrEqual(0);
  for (const sel of ['.ames-fbtn >> nth=0', '.ames-title', '.ames-tags', '.ames-play', '.ames-prog', '.ames-close']) {
    const loc = page.locator('#ames-player ' + sel);
    await expect(loc, sel).toBeVisible();
    const b = await loc.boundingBox();
    expect(b.x + b.width, sel + ' right').toBeLessThanOrEqual(p.x + p.width + 0.5);
    expect(b.y + b.height, sel + ' bottom').toBeLessThanOrEqual(p.y + p.height + 0.5);
  }
  await expect(page.locator('#ames-player .ames-tags')).toContainText('warm');
  await expect(page.locator('#ames-player .ames-tags')).toContainText('0:21');
  const clipped = await page.locator('#ames-player .ames-title').evaluate((e) => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1);
  expect(clipped, 'title clipped').toBe(false);
  // no light may sit under the expanded panel
  const under = await page.evaluate((top) => [...document.querySelectorAll('#ames-mb .ames-light')]
    .filter((e) => { const b = e.getBoundingClientRect(); return b.top + b.height / 2 + 16 > top; }).length, p.y);
  expect(under, 'lights under the player').toBe(0);
});
