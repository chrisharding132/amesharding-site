// Writes the three Readymag paste-ins into readymag/, pointed at the hosted site.
// Usage: node scripts/snippets.mjs https://<user>.github.io/amesharding-site/
import { writeFileSync } from 'node:fs';
const base = (process.argv[2] || '').replace(/\/?$/, '/');
if (!/^https:\/\//.test(base)) { console.error('usage: node scripts/snippets.mjs https://<user>.github.io/<repo>/'); process.exit(1); }

// Cache-bust once a minute so a git push shows up on the site within ~1 min, with no re-paste.
const loader = (file) => `<script>(function(){var s=document.createElement('script');` +
  `s.src='${base}${file}?v='+Math.floor(Date.now()/6e4);document.head.appendChild(s);})();</script>`;

const out = {
  'settings-code.html': `<!-- AMES HARDING — MOBILE VERTICAL PAGING loader.
Settings -> Code -> Before </body>: replace the whole old "MOBILE VERTICAL PAGING" <style> + <script> with this.
Leave the TRACK PREFETCH block where it is (it holds the Airtable token, which stays out of the public repo). -->
${loader('paging.js')}
`,
  'widget-mood-browser.html': `<!-- AMES HARDING — MOOD BROWSER loader (Page 2, Code widget 1: replace everything in the widget) -->
<div id="ames-mb"></div>
${loader('mood.js')}
`,
  'widget-mood-player.html': `<!-- AMES HARDING — MOOD PLAYER loader (Page 2, Code widget 2: replace everything in the widget) -->
<div id="ames-player"></div>
${loader('player.js')}
`,
};
for (const [f, s] of Object.entries(out)) writeFileSync(new URL(`../readymag/${f}`, import.meta.url), s);
console.log('wrote readymag/* for', base);
