// Every test page plays silently: the player still runs (states, queue, seeking), but nothing reaches the speakers.
import { test as base, expect, devices } from '@playwright/test';
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () { this.muted = true; this.volume = 0; window.__mutedPlays = (window.__mutedPlays || 0) + 1; return play.apply(this, arguments); };
      const ctx = window.AudioContext;
      if (ctx) window.AudioContext = class extends ctx { constructor(...a) { super(...a); this.suspend && this.suspend(); } };
    });
    await use(page);
  },
});
export { expect, devices };
