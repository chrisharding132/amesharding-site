// Copies any Airtable track not yet hosted into src/audio/ and refreshes manifest.json.
// Run after adding songs:  AT_TOKEN=pat... node scripts/sync-audio.mjs   then commit + push.
// (Until then, new songs simply play from Dropbox.)
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
const BASE = 'appHn6szu9hYGCRax', TABLE = 'tbl0X45VGyqNMC1D5', DIR = new URL('../src/audio/', import.meta.url);
const token = process.env.AT_TOKEN;
if (!token) { console.error('Set AT_TOKEN (the read-only Airtable token from Readymag Settings -> Code).'); process.exit(1); }
let recs = [], offset;
do {
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}?filterByFormula=%7BLive%7D&pageSize=100${offset ? '&offset=' + offset : ''}`, { headers: { Authorization: 'Bearer ' + token } }).then((r) => r.json());
  recs = recs.concat(r.records || []); offset = r.offset;
} while (offset);
for (const rec of recs) {
  const url = rec.fields['Audio URL']; const m = url && /\/([^/?#]+\.mp3)(?:[?#]|$)/i.exec(url);
  if (!m || existsSync(new URL(m[1], DIR))) continue;
  const res = await fetch(url); if (!res.ok) { console.error('failed', m[1], res.status); continue; }
  writeFileSync(new URL(m[1], DIR), Buffer.from(await res.arrayBuffer())); console.log('copied', m[1]);
}
const files = readdirSync(DIR).filter((f) => f.endsWith('.mp3')).sort();
writeFileSync(new URL('manifest.json', DIR), JSON.stringify({ files }, null, 1));
console.log(files.length, 'clips hosted');
