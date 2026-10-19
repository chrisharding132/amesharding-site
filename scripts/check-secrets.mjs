// Fails if an Airtable token is about to be committed (public repo -> GitHub would get it revoked).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const skip = new Set(['node_modules', '.git', 'live-snapshot', 'test-results', 'playwright-report']);
let bad = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    if (skip.has(f)) continue;
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|mjs|html|json|css|md)$/.test(f) && /pat[A-Za-z0-9]{14}\.[a-f0-9]{64}/.test(readFileSync(p, 'utf8'))) bad.push(p);
  }
})('.');
if (bad.length) { console.error('Airtable token found in:', bad.join(', ')); process.exit(1); }
console.log('no secrets');
