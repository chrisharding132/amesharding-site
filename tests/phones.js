// Phone profiles for live tests. CHROME_IOS=1 swaps in Chrome on iPhone: same WebKit engine, but Chrome's
// user agent and its smaller visible area (toolbars top and bottom). Real Chrome-iOS quirks (zoom memory,
// toolbar behaviour) still need a real device: open amesharding.com/#ames-debug there.
import { devices } from '@playwright/test';
const { defaultBrowserType, ...iphone13 } = devices['iPhone 13'];
export const CHROME_IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1';
// measured on a real iPhone in Chrome (diagnostics overlay): 402x684 visible, screen 402x874, dpr 3, Reduce Motion on
export const chromeIOS = { ...iphone13, userAgent: CHROME_IOS_UA, viewport: { width: 402, height: 684 }, screen: { width: 402, height: 874 }, deviceScaleFactor: 3,
  reducedMotion: process.env.MOTION === 'full' ? 'no-preference' : 'reduce' };
export const PHONE = process.env.CHROME_IOS ? chromeIOS : iphone13;
export const PHONE_NAME = process.env.CHROME_IOS ? 'chrome-ios' : 'safari-ios';
