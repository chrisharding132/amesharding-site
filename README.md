# amesharding.com custom code

Readymag holds only short loaders (see `readymag/`). Real code lives in `src/` and is served by GitHub Pages,
so changes ship with `git push` and show up on the site within about a minute. You don't re-paste anything.

| File | Readymag spot |
|---|---|
| `src/paging.js` | Settings → Code → Before `</body>` (loader) |
| `src/mood.js` | Page 2, Code widget 1 (`<div id="ames-mb">` + loader) |
| `src/player.js` | Page 2, Code widget 2 (`<div id="ames-player">` + loader) |

The **Track prefetch** block stays pasted directly in Readymag Settings → Code. It holds the Airtable token,
which must never be committed: this repo is public, and GitHub reports leaked Airtable tokens, which then get revoked.
A pre-commit hook and `npm run lint` both check for it.

## Loop
- `npm test`: syntax plus secret check, then Playwright on iPhone WebKit and desktop Chromium against `tests/harness.html`
- `npm run serve`, then open http://127.0.0.1:8787/tests/harness.html to look at it by hand
- `git push`: live within ~1 min (the loaders cache-bust each minute)
