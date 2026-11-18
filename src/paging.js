/* AMES HARDING — MOBILE VERTICAL PAGING (TikTok-style)
   Requires the Phone portrait viewport to use the Vertical viewer. One swipe = one page. */
(function () {
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');
  if (window.__amesPaging) return;
  // window.__amesPaging.last says what the most recent swipe did (handy from Safari's Web Inspector)
  var dbg = window.__amesPaging = { ready: false, last: null, openEmail: function (u) { location.href = u; } };
  // the player and the track list load straight away, not when Readymag gets round to page 2's widgets, so Listen
  // on page 1 can start a song inside the tap (both files are safe to load twice: the widgets load them too)
  ['player.js', 'mood.js'].forEach(function (f) {
    var sc = document.createElement('script'); sc.src = BASE + f + '?v=' + Math.floor(Date.now() / 6e4); document.head.appendChild(sc);
  });

  var st = document.createElement('style');
  st.id = 'ames-paging-css';
  // lock native free-scroll on the phone build; pages advance only via swipes
  st.textContent = [
    '.isphone body{overscroll-behavior:none;}',
    '.isphone .mag.viewer-type-vertical,.isphone .mag.viewer-type-vertical .mag-pages-container{touch-action:pinch-zoom;}',
    // Readymag's bottom arrow sat on top of the Mood Player; the rail + hint below replace it on phones.
    // the rail and hint replace Readymag's arrows everywhere; scrolling is the one way through the site on every device
    '.navigation-arrow{display:none!important;}',
    '#ames-nav{opacity:0;transition:opacity .6s ease;}',
    '#ames-nav.ready{opacity:1;}',
    // fades in only once the page behind it has painted, so it never floats over a blank screen

    // page rail: one dot per page, current page drawn as a short pill
    '#ames-rail{position:fixed;right:9px;top:50%;transform:translateY(-50%);z-index:10000;display:flex;flex-direction:column;gap:8px;pointer-events:none;}',
    '#ames-rail button{display:block;position:relative;padding:0;border:0;background:none;color:inherit;}',
    '#ames-rail i{display:block;width:4px;height:4px;border-radius:2px;background:rgba(240,232,218,.38);transition:height .35s ease,background .35s ease;}',
    '#ames-rail i.on{height:16px;background:rgba(240,232,218,.9);}',
    // desktop: bigger targets, clickable, page names on hover
    'html:not(.isphone) #ames-rail{right:14px;gap:0;pointer-events:auto;}',
    'html:not(.isphone) #ames-rail button{padding:7px 10px;cursor:pointer;}',
    'html:not(.isphone) #ames-rail i{width:5px;height:5px;}',
    'html:not(.isphone) #ames-rail i.on{height:20px;}',
    'html:not(.isphone) #ames-rail button:hover i,html:not(.isphone) #ames-rail button:focus-visible i{background:#F0E8DA;}',
    "#ames-rail span{position:absolute;right:26px;top:50%;transform:translate(6px,-50%);opacity:0;pointer-events:none;transition:opacity .2s ease,transform .2s ease;white-space:nowrap;color:#F0E8DA;",
    "  font:300 10px/1 'Neue Haas Grotesk Display Pro','Neue Haas Grotesk Display','Helvetica Neue',Helvetica,sans-serif;letter-spacing:.2em;text-transform:uppercase;text-shadow:0 0 12px rgba(52,48,96,.8);}",
    'html:not(.isphone) #ames-rail button:hover span,html:not(.isphone) #ames-rail button:focus-visible span{opacity:1;transform:translate(0,-50%);}',
    'html:not(.isphone) #ames-rail button:focus-visible{outline:1px solid rgba(240,232,218,.7);outline-offset:-2px;border-radius:3px;}',
    // pages 2 onwards: the name, small, at the top (it travels there from page 1); tapping it goes home
    '#ames-head{position:fixed;top:0;left:0;z-index:10001;padding:0;border:0;background:none;cursor:pointer;opacity:0;pointer-events:none;transform-origin:0 0;transition:opacity .25s ease;}',
    '#ames-head.on{opacity:1;pointer-events:auto;}',
    '#ames-head img{position:absolute;display:block;max-width:none;pointer-events:none;}',
    '#ames-head:focus-visible{outline:1px solid rgba(240,232,218,.7);outline-offset:4px;border-radius:3px;}',
    // moving photos: held while pointed at or pressed
    '.page.ames-hold .animation-container{animation-play-state:paused!important;}',
    // quotes read better left-aligned than justified (wide gaps on phones)
    '.mag .widget-text-v3 .align-justify,.mag .widget-text-v3 [style*="text-align: justify"],.mag .widget-text-v3 [style*="text-align:justify"]{text-align:left!important;}',
    // ---- contact form: underlined fields with floating labels on the sky, frosted send button ----
    '.widget-form{overflow:visible!important;height:auto!important;}',
    ".widget-form .input-wrapper{position:relative!important;height:50px!important;margin-bottom:6px!important;background:none!important;border-radius:0!important;box-shadow:none!important;border-bottom:1px solid rgba(240,232,218,.32);transition:border-color .25s ease,box-shadow .25s ease;}",
    '.widget-form .input-wrapper.is-multiline{height:84px!important;}',
    '.widget-form .input-wrapper:focus-within{border-bottom-color:#F0E8DA;box-shadow:0 1px 0 0 rgba(240,232,218,.55);}',
    '.widget-form .overlay{display:none!important;}',
    ".widget-form input.js-input:not([type=checkbox]),.widget-form textarea.js-input{position:absolute!important;left:0!important;right:0!important;top:20px!important;bottom:4px!important;width:100%!important;height:auto!important;margin:0!important;padding:0!important;border:0!important;outline:0!important;background:none!important;resize:none;box-sizing:border-box;",
    "  font:300 15px/1.35 'Neue Haas Grotesk Display Pro','Neue Haas Grotesk Display','Helvetica Neue',Helvetica,sans-serif!important;letter-spacing:.02em!important;color:#F0E8DA!important;caret-color:#E85D75;}",
    '.widget-form .js-input::placeholder{color:transparent!important;opacity:0!important;}',
    '.widget-form input.js-input:-webkit-autofill{-webkit-text-fill-color:#F0E8DA;-webkit-box-shadow:0 0 0 40px rgba(122,100,133,.9) inset;}',
    ".widget-form .ames-flabel{position:absolute;left:0;top:22px;pointer-events:none;transform-origin:0 0;transition:transform .2s ease,opacity .2s ease,color .2s ease;color:rgba(240,232,218,.72);",
    "  font:300 15px/1.2 'Neue Haas Grotesk Display Pro','Neue Haas Grotesk Display','Helvetica Neue',Helvetica,sans-serif;letter-spacing:.02em;}",
    '.widget-form .js-input:focus~.ames-flabel,.widget-form .js-input:not(:placeholder-shown)~.ames-flabel{transform:translateY(-18px) scale(.66);letter-spacing:.18em;text-transform:uppercase;color:rgba(240,232,218,.8);}',
    // mailing-list row
    '.widget-form .input-wrapper:has(.input-checkbox-wrapper){border-bottom:0;box-shadow:none;height:44px!important;margin-top:4px!important;}',
    '.widget-form .input-checkbox-wrapper{display:flex!important;align-items:center;height:100%;cursor:pointer;}',
    '.widget-form .input-checkbox-inner{display:flex!important;flex-direction:row-reverse;justify-content:flex-end;align-items:center;gap:12px;width:100%;height:100%;padding:0!important;}',
    ".widget-form .input-checkbox-inner .label{position:static!important;font:300 13px/1.2 'Neue Haas Grotesk Display Pro','Neue Haas Grotesk Display','Helvetica Neue',Helvetica,sans-serif!important;letter-spacing:.04em!important;color:rgba(240,232,218,.85)!important;}",
    '.widget-form .input-checkbox-wrapper,.widget-form .input-checkbox-inner{position:relative!important;left:0!important;margin:0!important;padding:0!important;opacity:1!important;}',
    '.widget-form .input-checkbox-inner .label{opacity:1!important;margin:0!important;}',
    '.widget-form .input-checkbox-inner .tick{opacity:1!important;visibility:visible!important;position:static!important;flex:none;display:flex!important;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;border:1px solid rgba(240,232,218,.45);box-sizing:border-box;transition:background .2s ease,border-color .2s ease;}',
    '.widget-form .input-checkbox-inner .tick svg{width:10px!important;height:8px!important;opacity:0;transition:opacity .2s ease;fill:#F0E8DA!important;}',
    '.widget-form input[type=checkbox]:checked~.input-checkbox-inner .tick{background:rgba(232,93,117,.55);border-color:rgba(240,232,218,.7);}',
    '.widget-form input[type=checkbox]:checked~.input-checkbox-inner .tick svg{opacity:1;}',
    '.widget-form input[type=checkbox]:focus-visible~.input-checkbox-inner .tick{outline:1px solid #F0E8DA;outline-offset:2px;}',
    // send button (Readymag writes its hover colours inline, hence !important)
    ".widget-form .button{height:46px!important;line-height:46px!important;margin-top:10px;width:100%!important;border-radius:999px!important;cursor:pointer;background:rgba(52,48,96,.28)!important;box-shadow:inset 0 0 0 1px rgba(240,232,218,.38)!important;color:#F0E8DA!important;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);transition:background .25s ease;",
    "  font:300 11px/46px 'Neue Haas Grotesk Display Pro','Neue Haas Grotesk Display','Helvetica Neue',Helvetica,sans-serif!important;letter-spacing:.26em!important;text-transform:uppercase;}",
    '.widget-form .button:hover,.widget-form .button:focus-visible{background:rgba(232,93,117,.35)!important;outline:none;}',
    '.widget-form .button svg{fill:#F0E8DA!important;}',
    // hints: a down arrow on page 2 (just above the player) and an up arrow on the last page, every visit
    ".ames-hint{position:fixed;left:50%;transform:translateX(-50%);z-index:10000;",
    "  display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 14px;border:0;background:none;cursor:pointer;",
    "  font:300 10px/1 'Neue Haas Grotesk Display Pro','Neue Haas Grotesk Display','Helvetica Neue',Helvetica,sans-serif;",
    '  letter-spacing:.24em;text-transform:uppercase;color:rgba(240,232,218,.8);text-shadow:0 0 10px rgba(52,48,96,.6);',
    '  transition:opacity .5s ease;}',
    '.ames-hint{bottom:calc(14px + env(safe-area-inset-bottom));}',
    '.ames-hint svg{width:14px;height:14px;}',
    '#ames-hint svg{animation:ames-bob-down 1.8s ease-in-out infinite;}',
    '#ames-hint-up svg{animation:ames-bob-up 1.8s ease-in-out infinite;}',
    '.ames-hint.off{opacity:0;pointer-events:none;}',
    '@keyframes ames-bob-down{0%,100%{transform:translateY(-3px)}50%{transform:translateY(4px)}}',
    '@keyframes ames-bob-up{0%,100%{transform:translateY(3px)}50%{transform:translateY(-4px)}}',
    '@media (prefers-reduced-motion:reduce){.ames-hint svg{animation:none!important}}',
    // "email copied" note (desktop)
    "#ames-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,12px);z-index:10001;opacity:0;pointer-events:none;",
    "  display:flex;align-items:center;gap:14px;padding:10px 18px;border-radius:999px;border:1px solid rgba(240,232,218,.22);",
    "  background:rgba(52,48,96,.55);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);color:#F0E8DA;",
    "  font:300 11px/1 'Neue Haas Grotesk Display Pro','Neue Haas Grotesk Display','Helvetica Neue',Helvetica,sans-serif;letter-spacing:.14em;text-transform:uppercase;",
    '  transition:opacity .25s ease,transform .25s ease;}',
    '#ames-toast.on{opacity:1;transform:translate(-50%,0);pointer-events:auto;}',
    '#ames-toast a{color:rgba(240,232,218,.75)!important;text-decoration:none;border-bottom:1px solid rgba(240,232,218,.3);padding-bottom:1px;}',
    '#ames-toast a:hover{color:#F0E8DA!important;}',
    // phones at rest: only the current page shows (no slivers of the neighbours); a fixed sky sits behind.
    // While a finger is down or a page is gliding the neighbours are shown, so they can slide in.
    // pages are marked off only from their measured position (never Readymag's current-page label, which lags)
    '.isphone .mag.viewer-type-vertical .page.ames-off{visibility:hidden!important;}',
    '.isphone .mag.viewer-type-vertical{background:transparent!important;}',
    // scroll area at least as tall as the pages (Readymag sometimes re-sizes it to the visible height in Chrome)
    '.isphone body.overflow-on-vertical-view,.isphone .mag.viewer-type-vertical{min-height:var(--ames-doc-h,0px)!important;}',
    // the sky lives inside Readymag's page area, under the pages (which are z-index 2-6), so a gap is never black
    '#ames-sky{position:fixed;inset:0;z-index:0;pointer-events:none;background:#7a6485 center/cover no-repeat;}',
    '#ames-debug{position:fixed;left:6px;top:6px;z-index:2147483647;max-width:calc(100vw - 12px);padding:8px 10px;border-radius:8px;background:rgba(0,0,0,.78);color:#9f9;font:10px/1.35 ui-monospace,Menlo,monospace;white-space:pre-wrap;pointer-events:none;}'
  ].join('\n');
  document.head.appendChild(st);

  // Email clicks. Phones: open the mail app. Desktop: many computers have no mail app set up (Chrome/Arc then
  // open a blank tab), so copy the address and offer Gmail / the mail app instead.
  var EMAIL = 'ameshardingmusic@gmail.com';
  var desktop = matchMedia('(hover: hover) and (pointer: fine)').matches;
  dbg.desktopEmail = desktop;
  var toast, toastTimer;
  function showToast(copied) {
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ames-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.innerHTML = '<span>' + (copied ? 'Email copied' : EMAIL) + '</span>' +
      '<a href="https://mail.google.com/mail/?view=cm&to=' + EMAIL + '" target="_blank" rel="noopener">Open in Gmail</a>' +
      '<a href="mailto:' + EMAIL + '" data-ames-direct>Mail app</a>';
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('on'); }, 5000);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a || a.hasAttribute('data-ames-direct')) return;
    var href = a.getAttribute('href');
    if (!/ameshardingmusic@gmail\.co(m)?$/i.test(href)) return;
    e.preventDefault(); e.stopPropagation();
    if (!desktop) return dbg.openEmail('mailto:' + EMAIL);
    var done = function (ok) { dbg.copied = ok; showToast(ok); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(EMAIL).then(function () { done(true); }, function () { done(false); });
    else done(false);
  }, true);

  // iPhones zoom in when a form field with text under 16px is focused (page 5), and the page then stays zoomed.
  // Capping the zoom stops that; iOS still lets people pinch-zoom on purpose.
  function noFormZoom() {
    if (!isPhone()) return;
    var m = document.querySelector('meta[name=viewport]');
    if (m && !/maximum-scale=1(\.0)?(,|$)/.test(m.content)) m.content = 'width=device-width,initial-scale=1,maximum-scale=1';
  }

  // Make the email text clickable wherever it appears, keeping its exact look (the <HEAD> CSS keeps
  // mailto links in the surrounding colour, with no underline). Readymag re-renders pages, so re-check.
  function linkEmail() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return n.nodeValue.toLowerCase().indexOf(EMAIL) >= 0 && !(n.parentElement && n.parentElement.closest('a, script, style, textarea, #ames-toast'))
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (t) {
      var i = t.nodeValue.toLowerCase().indexOf(EMAIL);
      var mid = t.splitText(i), after = mid.splitText(EMAIL.length);
      var a = document.createElement('a');
      a.href = 'mailto:' + EMAIL;
      a.className = 'ames-email';
      t.parentNode.insertBefore(a, after);
      a.appendChild(mid);
    });
  }
  var emailTimer;
  new MutationObserver(function () { clearTimeout(emailTimer); emailTimer = setTimeout(linkEmail, 100); })
    .observe(document.documentElement, { childList: true, subtree: true });
  linkEmail();

  // ---- zoom recovery (Chrome on iOS can stay zoomed in, e.g. after a form field took focus) ----
  function zoomed() { return !!(window.visualViewport && visualViewport.scale > 1.1); }
  function resetZoom() {
    if (!isPhone() || !zoomed()) return;
    var f = document.activeElement;
    if (f && /^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName)) return;     // still typing: leave it
    var m = document.querySelector('meta[name=viewport]');
    if (!m) return;
    // re-applying the viewport tag makes iOS re-fit the page at scale 1
    m.content = 'width=device-width,initial-scale=1.0,maximum-scale=1.0';
    setTimeout(function () { m.content = 'width=device-width,initial-scale=1,maximum-scale=1'; }, 60);
    dbg.zoomResets = (dbg.zoomResets || 0) + 1;
  }
  document.addEventListener('focusout', function () { setTimeout(resetZoom, 350); }, true);

  // ---- diagnostics overlay: open amesharding.com/#ames-debug (stays on while browsing this tab) ----
  var DEBUG = /ames-debug/.test(location.hash + location.search);
  try { if (DEBUG) sessionStorage.setItem('ames-debug', '1'); else DEBUG = sessionStorage.getItem('ames-debug') === '1'; } catch (e) {}
  function debugPanel(mag) {
    var el = document.createElement('div'); el.id = 'ames-debug'; document.body.appendChild(el);
    setInterval(function () {
      var vv = window.visualViewport, P = window.__amesPlayer || {}, pg = document.querySelector('.mag .page');
      var ua = navigator.userAgent, br = /CriOS/.test(ua) ? 'Chrome iOS' : /FxiOS/.test(ua) ? 'Firefox iOS' : /Safari/.test(ua) && /iPhone|iPad/.test(ua) ? 'Safari iOS' : 'other';
      el.textContent = [
        'browser ' + br + '  dpr ' + devicePixelRatio,
        'inner ' + innerWidth + 'x' + innerHeight + '  client ' + document.documentElement.clientWidth + 'x' + document.documentElement.clientHeight + '  screen ' + screen.width + 'x' + screen.height,
        'zoom ' + (vv ? vv.scale.toFixed(2) + '  vv ' + Math.round(vv.width) + 'x' + Math.round(vv.height) + ' @' + Math.round(vv.offsetLeft) + ',' + Math.round(vv.offsetTop) : 'n/a') + '  resets ' + (dbg.zoomResets || 0),
        'scrollY ' + Math.round(scrollY) + '  pageH ' + (pg ? pg.offsetHeight : '?') + '  docW ' + document.documentElement.scrollWidth,
        'page ' + (mag.currentPage && mag.currentPage.num) + '/' + (function () { try { return mag.getPagesCount(); } catch (e) { return '?'; } })() + '  viewer ' + ((document.querySelector('.mag') || {}).className || '').replace(/.*viewer-type-(\w+).*/, '$1'),
        'isphone ' + isPhone() + '  reduceMotion ' + matchMedia('(prefers-reduced-motion: reduce)').matches,
        'player ' + (P.state || '-') + '  playerPage ' + (P.homePage || '-') + '  bar ' + ((document.getElementById('ames-mini') || {}).className || '-'),
        'meta ' + ((document.querySelector('meta[name=viewport]') || {}).content || ''),
        'ua ' + ua.slice(0, 110)
      ].join('\n');
    }, 400);
  }

  // Readymag applies UA classes after load, so check .isphone live inside the handlers.
  function isPhone() { return document.documentElement.classList.contains('isphone'); }

  function boot() {
    var mag = window.RM && RM.viewerRouter && RM.viewerRouter.mag;
    if (!mag) return setTimeout(boot, 120);

    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function vertical() { return isPhone() && document.querySelector('.mag.viewer-type-vertical'); }
    // Readymag's pages are not all the same height (Chrome on iPhone: 684 then 714...), and a page far from the
    // current one can report a stale position (on the last page, page 1 claimed to sit where page 5 is, which sent
    // a swipe to page 2). A page's place is the sum of the heights above it; its own position is trusted only when it agrees.
    function pageEls() { return document.querySelectorAll('.mag .page'); }
    function tops() {
      var ps = pageEls(), typical = 0, out = [], sum = 0;
      Array.prototype.forEach.call(ps, function (p) { typical = Math.max(typical, p.offsetHeight); });
      Array.prototype.forEach.call(ps, function (p, i) {
        var t = p.getBoundingClientRect().top + scrollY, h = p.offsetHeight;
        out.push(h > 0 && Math.abs(t - sum) < 40 ? t : sum);
        sum += h || typical || innerHeight;
      });
      return out;
    }
    function topOf(i) { var t = tops(); return t[Math.max(0, Math.min(t.length - 1, i))] || 0; }
    function count() { try { return mag.getPagesCount(); } catch (e) { return 1; } }
    function curIdx() { return (mag.currentPage && mag.currentPage.num || 1) - 1; }

    // ---- phone: one page at a time. A swipe fades the page out and the next one in over the still sky:
    // no other page is ever on screen, and the page we are on is tracked here, not guessed from the scroll ----
    var cur = 0, busy = false;
    function nearestIdx(y) { var t = tops(), best = Math.max(0, Math.min(cur, t.length - 1)); t.forEach(function (v, i) { if (Math.abs(v - y) < Math.abs(t[best] - y) - 1) best = i; }); return best; }
    function showOnly(i) {
      if (i < 0) return;
      Array.prototype.forEach.call(document.querySelectorAll('.mag.viewer-type-vertical .page'), function (p, j) { p.classList.toggle('ames-off', j !== i); });
    }
    // Readymag can size the scrollable area shorter than its pages (Chrome on iPhone: 684px of scroll per
    // 714px page), so the last page could never be reached exactly. Make the scroll area as tall as the pages.
    function fitHeight() {
      if (!vertical()) return;
      var ps = pageEls(), last = ps[ps.length - 1];
      if (!last) return;
      var need = Math.ceil(topOf(ps.length - 1) + last.offsetHeight) + 'px';
      if (document.documentElement.style.getPropertyValue('--ames-doc-h') !== need) document.documentElement.style.setProperty('--ames-doc-h', need);
    }
    function maxScroll() { return Math.max(0, document.documentElement.scrollHeight - innerHeight); }
    function slotOf(i) { return Math.min(topOf(i), maxScroll()); }
    function settle(i) { var y = slotOf(i); if (Math.abs(scrollY - y) > 1) scrollTo(0, y); showOnly(i); }
    // the first time a page is used Chrome on iPhone can still re-size the one above it: keep it on its slot for a moment
    var holdT;
    function holdSlot(i) {
      var n = 0;
      clearInterval(holdT);
      holdT = setInterval(function () { if (++n > 12 || busy || i !== cur) return clearInterval(holdT); settle(i); }, 50);
    }
    function contentOf(i) { var p = pageEls()[i]; return p && p.querySelector('.page-content-container'); }
    // a page's photos ready to paint (or 450ms, whichever is first), so a page never fades in empty on a slow phone
    function ready(i) {
      var p = pageEls()[i];
      if (!p) return Promise.resolve();
      var jobs = Array.prototype.map.call(p.querySelectorAll('img'), function (im) {
        im.loading = 'eager';
        return im.decode ? im.decode().catch(function () {}) : null;
      });
      return Promise.race([Promise.all(jobs), new Promise(function (r) { setTimeout(r, 450); })]);
    }
    function play(el, frames, ms, ease) {
      if (!el || !el.animate) return Promise.resolve();
      var an = el.animate(frames, { duration: ms, easing: ease || 'ease', fill: 'forwards' });
      return (an.finished || Promise.resolve()).then(function () { return an; }, function () { return an; });
    }
    // drag feedback: only the page's own content leans a little with the finger (no other page shows)
    function lean(dy) {
      var c = contentOf(cur);
      if (!c) return;
      var d = Math.max(-26, Math.min(26, dy * 0.12));
      c.style.translate = '0 ' + d.toFixed(1) + 'px';
      c.style.opacity = String(1 - Math.abs(d) / 130);
    }
    function unlean() {
      var c = contentOf(cur);
      if (!c || !c.style.translate) return;
      var from = c.style.translate;
      c.style.translate = ''; c.style.opacity = '';
      if (!reduce) play(c, [{ translate: from, opacity: c.style.opacity || 0.85 }, { translate: '0 0', opacity: 1 }], 220, 'cubic-bezier(.2,.8,.2,1)').then(function (an) { if (an && an.cancel) an.cancel(); });
    }
    function go(i, home) {
      i = Math.max(0, Math.min(count() - 1, i));
      if (i === cur || busy || (i === 0 && !home)) { unlean(); return; }
      if (cur === 0) head.show(true); else if (i === 0) head.hide(true);
      clearTimeout(autoT);
      var dir = i > cur ? 1 : -1, from = contentOf(cur), lean0 = from && from.style.translate || '0 0';
      busy = true;
      dbg.last = Object.assign(dbg.last || {}, { go: i + 1 });
      play(from, [{ translate: lean0, opacity: from && from.style.opacity || 1 }, { translate: '0 ' + (-dir * 28) + 'px', opacity: 0 }], reduce ? 90 : 170, 'ease-in').then(function (an) {
        cur = i;
        fitHeight();
        settle(i);
        if (from) { from.style.translate = ''; from.style.opacity = ''; }
        if (an && an.cancel) an.cancel();
        var to = contentOf(i);
        if (to) to.style.opacity = '0';
        return ready(i).then(function () {
          return play(to, [{ translate: '0 ' + (reduce ? 0 : dir * 36) + 'px', opacity: 0 }, { translate: '0 0', opacity: 1 }], reduce ? 160 : 380, 'cubic-bezier(.2,.8,.2,1)');
        }).then(function (b) { if (to) to.style.opacity = ''; if (b && b.cancel) b.cancel(); });
      }).then(function () { busy = false; holdSlot(i); warm(i); arrived(i); }, function () { var c = contentOf(cur); if (c) c.style.opacity = ''; busy = false; settle(cur); });
    }
    // the pages either side get their photos ready ahead of time
    function warm(i) { [i - 1, i + 1].forEach(function (j) { if (j >= 0 && j < count()) ready(j); });
    }
    function goTo(n, home) {   // 1-based page number, used by the header, hints, rail and the corner play button
      n = Math.max(1, Math.min(count(), n));
      if (n === 1 && !home) return;
      if (vertical()) { fitHeight(); return go(n - 1, home); }
      // more than one page away (the rail): straight there, without flashing the pages in between
      if ((Math.abs(n - 1 - curIdx()) > 1 || n === 1) && typeof mag.showPage === 'function' && performance.now() - lastTurn > 560) {
        lastTurn = performance.now();
        try { mag.showPage(n); return; } catch (e) {}
      }
      // exactly as many steps as it is away; anything the visitor does (scroll, keys) cancels what is left
      var token = ++goToken, left = Math.abs(n - 1 - curIdx()), dir = n - 1 > curIdx() ? 1 : -1;
      (function step() {
        if (token !== goToken || !left || curIdx() === n - 1) return;
        left--;
        turn.home = !!home;
        turn(dir);
        turn.home = false;
        setTimeout(step, 640);
      })();
    }
    // Readymag ignores a page change asked for during its 520ms transition, and on a heavy page the change itself
    // can land late: asking again too soon then moves two pages. So a change waits until the last one has had its
    // 520ms, is asked for once, and is only asked for again if, well after that, nothing has moved.
    var turnT, lastTurn = 0, goToken = 0;
    window.addEventListener('keydown', function (e) { if (/^(Arrow|Page|Home|End| )/.test(e.key)) goToken++; }, true);
    function turn(dir) {
      clearTimeout(turnT);
      var from = curIdx();
      if (dir < 0 && from === 1 && !turn.home) return;   // page 2 is the top while scrolling
      (function ask(tries) {
        if (curIdx() !== from) return;                 // it moved
        if (dir > 0 ? mag.isLastPage() : mag.isFirstPage()) return;
        var wait = lastTurn + 560 - performance.now();
        if (wait > 0) { turnT = setTimeout(function () { ask(tries); }, wait); return; }
        lastTurn = performance.now();
        if (dir > 0) mag.goNextPage(); else mag.goPrevPage();
        if (tries < 2) turnT = setTimeout(function () { ask(tries + 1); }, 700);
      })(0);
    }
    dbg.goTo = goTo;
    dbg.cur = function () { return cur + 1; };
    function here() { return vertical() ? cur : curIdx(); }
    // the map (and anything else) hears when a page has fully arrived
    function arrived(i) { window.postMessage({ amesArrived: i + 1 }, '*'); if (i === 0) arm(); }

    // Page 1 is the landing page: after 4s it moves on to the mood map by itself (a swipe or scroll goes at once).
    // Touching the page, or the tab being in the background, restarts the wait.
    var autoT;
    function arm() {
      clearTimeout(autoT);
      if (here() !== 0) return;
      autoT = setTimeout(function () {
        if (document.hidden || here() !== 0) return arm();
        goTo(2);
      }, 4000);
    }
    dbg.arm = arm;
    document.addEventListener('pointerdown', function () { if (here() === 0) arm(); }, true);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) arm(); });

    // ---- the header: the page-1 name, small, at the top of every other page ----
    var head = document.createElement('button');
    head.id = 'ames-head'; head.type = 'button'; head.setAttribute('aria-label', 'Ames Harding — home');
    head.addEventListener('click', function () { goTo(1, true); });
    document.body.appendChild(head);
    // a box in screen pixels (desktop measures inside the zoomed page in unzoomed units)
    function scr(el) {
      var r = el.getBoundingClientRect(), c = el.closest && el.closest('.page-content-container');
      var z = c ? parseFloat(getComputedStyle(c).zoom) || 1 : 1, k = Math.abs(r.width - el.offsetWidth) < 2 ? z : 1;
      return { left: r.left * k, top: r.top * k, width: r.width * k, height: r.height * k };
    }
    // the name's pictures on page 1, relative to page 1 as if it were on screen
    function logo() {
      var page = pageEls()[0];
      if (!page) return null;
      var pr = page.getBoundingClientRect(), parts = [];
      Array.prototype.forEach.call(page.querySelectorAll('.rmwidget.widget-picture'), function (w) {
        var im = w.querySelector('img'), r = scr(w);
        if (im && im.currentSrc && r.height > 4) parts.push({ src: im.currentSrc, x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height });
      });
      if (!parts.length) return null;
      var x0 = Math.min.apply(null, parts.map(function (q) { return q.x; })), y0 = Math.min.apply(null, parts.map(function (q) { return q.y; }));
      var x1 = Math.max.apply(null, parts.map(function (q) { return q.x + q.w; })), y1 = Math.max.apply(null, parts.map(function (q) { return q.y + q.h; }));
      return { parts: parts, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    var headBox = null;
    head.build = function () {
      var L = logo();
      if (!L) return false;
      var hh = isPhone() ? 34 : 38, f = hh / L.h, w = L.w * f, top = 12 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ames-safe-top')) || 0);
      var sig = L.parts.map(function (q) { return q.src; }).join('|') + Math.round(w) + 'x' + innerWidth;
      if (head.dataset.sig !== sig) {
        head.dataset.sig = sig;
        head.innerHTML = '';
        L.parts.forEach(function (q) {
          var im = document.createElement('img'); im.alt = ''; im.src = q.src;
          im.style.cssText = 'left:' + ((q.x - L.x) * f).toFixed(1) + 'px;top:' + ((q.y - L.y) * f).toFixed(1) + 'px;width:' + (q.w * f).toFixed(1) + 'px;height:' + (q.h * f).toFixed(1) + 'px;';
          head.appendChild(im);
        });
      }
      headBox = { x: (innerWidth - w) / 2, y: top, w: w, h: hh, f: f, L: L };
      head.style.left = headBox.x.toFixed(1) + 'px'; head.style.top = headBox.y.toFixed(1) + 'px';
      head.style.width = w.toFixed(1) + 'px'; head.style.height = hh + 'px';
      window.__amesHeadBottom = top + hh + 8;
      return true;
    };
    // from the name's place on page 1 up into the header (or back down when going home)
    function flip(up) {
      if (!head.build() || !head.animate) return;
      var L = headBox.L, k = 1 / headBox.f, dx = L.x - headBox.x, dy = L.y - headBox.y;
      var big = { transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + k.toFixed(3) + ')' }, small = { transform: 'none' };
      return head.animate(up ? [big, small] : [small, big], { duration: reduce ? 1 : 620, easing: 'cubic-bezier(.3,.7,.2,1)' });
    }
    head.show = function (animate) {
      if (!head.build()) return;
      head.classList.add('on');
      if (animate) flip(true);
      fitAll();
    };
    head.hide = function (animate) {
      var an = animate && head.classList.contains('on') ? flip(false) : null;
      if (an && an.finished) an.finished.then(function () { if (here() === 0) head.classList.remove('on'); }, function () {});
      else head.classList.remove('on');
    };
    dbg.head = head;
    // Phones: pages 2 onwards make room for the header. Their content eases down-and-smaller just enough to clear it,
    // keeping its bottom where it was (the player stays on the bottom edge). Moving photo strips are left out.
    function fitBelow(pg) {
      var b = pg.querySelector('.content-bounds'), pr = pg.getBoundingClientRect();
      if (!b || !pr.height) return;
      var old = b.dataset.fit ? b.dataset.fit.split(',').map(Number) : [1, 0], s0 = old[0], t0 = old[1], top = Infinity, low = 0;
      Array.prototype.forEach.call(pg.querySelectorAll('.rmwidget'), function (w) {
        if (w.classList.contains('widget-background') || w.closest('.page-fixed-bg-container')) return;
        var mover = w.closest('.animation-container');
        if (mover && getComputedStyle(mover).animationName !== 'none') return;
        var r = w.getBoundingClientRect();
        if (r.height < 2 || r.width < 2) return;
        top = Math.min(top, ((r.top - pr.top) - t0) / s0);
        low = Math.max(low, ((r.bottom - pr.top) - t0) / s0);
      });
      if (!isFinite(top)) return;
      // ...and the corner play button at the bottom, while it shows
      var mini = document.getElementById('ames-mini'), room = mini && mini.classList.contains('on') ? innerHeight - mini.getBoundingClientRect().top + 8 : 0;
      var hb = window.__amesHeadBottom || 0, bottom = Math.min(low, innerHeight - room), s = 1, t = 0;
      if (top < hb || low > bottom) {
        // the content's top lands at the header's bottom (or stays put if already below it), its bottom above the button
        var A = Math.max(hb, top);
        s = Math.max(0.74, Math.min(1, (bottom - A) / (low - top)));
        t = A - top * s;
      }
      var sig = s.toFixed(3) + ',' + t.toFixed(1);
      if (b.dataset.fit === sig) return;
      b.dataset.fit = sig;
      b.style.transformOrigin = '50% 0';
      b.style.transform = s < 1 || t ? 'translateY(' + t.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')' : '';
      window.postMessage({ amesPlayerSize: true }, '*');     // the map measures itself again
    }
    function fitAll() {
      var ok = head.build();                       // also tells the map where the header ends
      window.postMessage({ amesPlayerSize: true }, '*');
      if (!vertical() || !ok) return;
      Array.prototype.forEach.call(pageEls(), function (pg, i) { if (i > 0) fitBelow(pg); });
    }
    dbg.fitHead = fitAll;
    addEventListener('resize', function () { setTimeout(function () { head.build(); fitAll(); }, 200); });

    var y0 = 0, x0 = 0, axis = null, samples = [];
    // capture on window: runs before any Readymag widget can stopPropagation() the touch
    var OPTS = { passive: true, capture: true };

    window.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { axis = 'multi'; return; }
      fitHeight();
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
      axis = null; samples = [[performance.now(), y0]];
    }, OPTS);

    window.addEventListener('touchmove', function (e) {
      if (axis === 'multi' || e.touches.length !== 1) { axis = 'multi'; return; }
      var y = e.touches[0].clientY, dx = e.touches[0].clientX - x0, dy = y - y0;
      if (!axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axis = Math.abs(dy) > Math.abs(dx) * 1.2 ? 'y' : 'x';
      }
      if (axis !== 'y' || !vertical() || busy) return;
      samples.push([performance.now(), y]); if (samples.length > 6) samples.shift();
      lean(dy);
    }, OPTS);

    window.addEventListener('touchend', function (e) {
      var y = e.changedTouches[0].clientY, dy = y - y0;
      var last = samples[samples.length - 1] || [0, y], first = samples[0] || last;
      var v = (last[1] - first[1]) / Math.max(1, last[0] - first[0]);       // px/ms, negative = finger moving up
      dbg.last = { dy: Math.round(dy), v: +v.toFixed(2), axis: axis, phone: isPhone(), vertical: !!vertical(), from: cur + 1 };
      if (!isPhone() || axis !== 'y') return;
      if (!vertical()) {                              // phone in landscape (horizontal viewer): plain page turn
        if (Math.abs(dy) > innerHeight * 0.15) { if (dy < 0) mag.goNextPage(); else mag.goPrevPage(); }
        return;
      }
      var commit = Math.abs(dy) > 60 || (Math.abs(v) > 0.3 && Math.abs(dy) > 24);
      if (commit) go(cur + (dy < 0 ? 1 : -1)); else unlean();
      if (cur === 0 && !commit) arm();
    }, OPTS);

    // ---- desktop: one page per wheel / trackpad gesture (the trackpad's coasting tail is ignored) ----
    var acc = 0, locked = false, quiet, lastDir = 0, turnedAt = 0, hist = [], peak = 0, trough = Infinity, fading = false;
    function avg(a) { return a.reduce(function (m, v) { return m + v; }, 0) / (a.length || 1); }
    window.addEventListener('wheel', function (e) {
      if (isPhone() || e.ctrlKey) return;                         // ctrl+wheel = pinch-zoom on trackpads
      var inner = e.target.closest && e.target.closest('textarea, select, [data-ames-scroll]');
      if (inner && inner.scrollHeight > inner.clientHeight + 1) return;   // only if it really has something to scroll
      var d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) d *= 16;
      if (!d) return;
      e.preventDefault();
      var abs = Math.abs(d), dir = d > 0 ? 1 : -1, now = performance.now();
      clearTimeout(quiet);
      quiet = setTimeout(function () { locked = false; acc = 0; }, 180);   // gesture over after 180ms of silence
      // A flick keeps building for a moment after it has turned the page, then coasts and fades for a second or
      // more, never perfectly smoothly (the browser can merge two frames into one event). Only once it is clearly
      // fading can a renewed, stronger push count as a new flick (or any change of direction).
      if (locked) {
        hist.push(abs); if (hist.length > 3) hist.shift();
        var r = avg(hist);
        peak = Math.max(peak, r);
        if (r < peak * 0.8) fading = true;
        if (fading) trough = Math.min(trough, r);
        if (dir !== lastDir || (fading && now - turnedAt > 300 && r > Math.max(trough * 1.6, trough + 6))) { locked = false; acc = 0; }
      }
      lastDir = dir;
      if (locked) return;
      acc += d;
      if (Math.abs(acc) < 14) return;
      locked = true; turnedAt = now; hist = []; peak = 0; trough = Infinity; fading = false;
      goToken++;                                     // the visitor's own scroll replaces any page move still under way
      dbg.lastWheel = acc > 0 ? 'next' : 'prev';
      turn(acc > 0 ? 1 : -1);
    }, { passive: false, capture: true });

    // ---- desktop: page content glides in on every page change (wheel, keys, arrows); the sky stays still ----
    var lastIdx = curIdx();
    function arrive() {
      var i = curIdx();
      if (i === lastIdx) return;
      var dir = i > lastIdx ? 1 : -1, was = lastIdx; lastIdx = i;
      if (vertical()) return;
      clearTimeout(autoT);
      if (was === 0) head.show(true); else if (i === 0) head.hide(true);
      setTimeout(function () { arrived(i); }, 250);
      if (reduce) return;
      var page = document.querySelector('.mag .page.center-page');
      var c = page && page.querySelector('.page-content-container');
      if (c && c.animate) dbg.arrivals = (dbg.arrivals || 0) + 1;
      if (c && c.animate) c.animate([{ transform: 'translateY(' + (dir * 64) + 'px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    window.addEventListener('keydown', function (e) {
      if (isPhone() || curIdx() !== 1 || !/^(ArrowUp|ArrowLeft|PageUp|Home)$/.test(e.key)) return;
      if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault(); e.stopImmediatePropagation();
    }, true);
    var pagesBox = document.querySelector('.mag-pages-container') || document.documentElement;
    new MutationObserver(arrive).observe(pagesBox, { attributes: true, attributeFilter: ['class'], subtree: true });

    dbg.ready = true;
    noFormZoom();
    enhance(mag);
    if (isPhone()) {
      var sky = document.createElement('div'); sky.id = 'ames-sky';
      sky.style.backgroundImage = 'url("' + BASE + 'assets/' + (innerWidth < innerHeight ? 'bg-portrait.jpg' : 'bg-landscape.jpg') + '")';
      var magEl = document.querySelector('.mag') || document.body;
      magEl.insertBefore(sky, magEl.firstChild);
      // start once Readymag has built its pages, on the page it opened (a link such as /2/ opens on page 2)
      (function start() {
        if (pageEls().length < count() || !pageEls().length) return setTimeout(start, 100);
        fitHeight();
        cur = Math.max(0, Math.min(count() - 1, curIdx()));
        settle(cur);
        holdSlot(cur);
        warm(cur);
        if (cur > 0) head.show(false);
      })();
      setInterval(fitHeight, 1000);
      // browser bar showing/hiding: Readymag resizes the pages but leaves the scroll where it was: put the page back
      var resizeT;
      addEventListener('resize', function () {
        fitHeight();
        clearTimeout(resizeT);
        resizeT = setTimeout(function () { if (!busy) settle(cur); }, 150);
      });
      // anything else that moves the scroll (a focused form field, Readymag itself): follow it to the nearest page
      var scrollEnd;
      addEventListener('scroll', function () {
        if (busy) return;
        clearTimeout(scrollEnd);
        scrollEnd = setTimeout(function () {
          if (busy || Math.abs(scrollY - slotOf(cur)) <= 2) return;
          cur = nearestIdx(scrollY); settle(cur);
        }, 160);
      }, { passive: true });
    }
    if (DEBUG) debugPanel(mag);
    buildNav(mag);
    whenPageVisible(mag, function () { arm(); });
  }

  // ---- site-wide touches that don't belong to a widget ----
  var NAMES = ['Home', 'Listen', 'About', 'Press', 'Contact'];
  function enhance(mag) {
    document.documentElement.lang = document.documentElement.lang || 'en';
    Array.prototype.forEach.call(document.querySelectorAll('link[rel*="icon"]'), function (l) { if (/\/dist\/img\/favicons\//.test(l.href)) l.remove(); });
    if (!document.getElementById('ames-h1')) {
      var h = document.createElement('h1'); h.id = 'ames-h1'; h.textContent = 'Ames Harding';
      h.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
      document.body.insertBefore(h, document.body.firstChild);
    }
    // Readymag swallows the Tab key; hand it back so keyboards can reach the controls (focus styles only show for keyboards)
    window.addEventListener('keydown', function (e) { if (e.key === 'Tab') e.stopImmediatePropagation(); }, true);
    document.addEventListener('focusin', function (e) {
      var pages = Array.prototype.slice.call(document.querySelectorAll('.mag .page')), page = e.target.closest && e.target.closest('.page');
      var i = pages.indexOf(page);
      if (i >= 0 && mag.currentPage && i + 1 !== mag.currentPage.num && dbg.goTo) dbg.goTo(i + 1);
    });
    // moving photos: hold them while pointed at or pressed
    function holdPage(e, on) {
      var w = e.target.closest && e.target.closest('.animation-container'), page = w && w.closest('.page');
      if (page) page.classList.toggle('ames-hold', on);
    }
    // the mouse: anywhere within the two columns' width (including the gaps between photos), and nowhere else
    if (desktop) {
      document.addEventListener('mousemove', function (e) {
        var page = document.querySelector('.mag .page.center-page'), cols = page ? page.querySelectorAll('.animation-container') : [], over = false;
        Array.prototype.forEach.call(cols, function (c) { var r = c.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right) over = true; });
        if (page && cols.length) page.classList.toggle('ames-hold', over);
      }, { passive: true });
      document.documentElement.addEventListener('mouseleave', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.page.ames-hold'), function (p) { p.classList.remove('ames-hold'); });
      });
    }
    document.addEventListener('touchstart', function (e) { holdPage(e, true); }, { passive: true });
    document.addEventListener('touchend', function (e) { holdPage(e, false); }, { passive: true });
    pageTouches(mag);
    new MutationObserver(function () { clearTimeout(enhanceT); enhanceT = setTimeout(function () { pageTouches(mag); }, 120); })
      .observe(document.querySelector('.mag-pages-container') || document.documentElement, { childList: true, subtree: true });
    addEventListener('resize', function () { placeForm(); placeHome(); });
  }
  var enhanceT;
  // applied whenever Readymag (re)renders a page's widgets
  function pageTouches(mag) {
    var pages = document.querySelectorAll('.mag .page');
    // image descriptions
    Array.prototype.forEach.call(pages, function (p, i) {
      Array.prototype.forEach.call(p.querySelectorAll('img'), function (im) {
        if (im.hasAttribute('alt') && im.getAttribute('alt') !== '') return;
        if (im.closest('#ames-mb')) return;
        im.setAttribute('alt', i === 0 ? 'Ames Harding' : 'Photo of Ames Harding');
      });
    });
    // "Let's"
    Array.prototype.forEach.call(document.querySelectorAll('.mag .widget-text-v3 span'), function (sp) {
      if (sp.childNodes.length === 1 && sp.firstChild.nodeType === 3 && /^LETS MAKE SOMETHING/.test(sp.firstChild.nodeValue)) sp.firstChild.nodeValue = sp.firstChild.nodeValue.replace('LETS', "LET\u2019S");
    });
    // contact form: floating labels, autofill hints (Readymag's own fields and delivery are untouched)
    Array.prototype.forEach.call(document.querySelectorAll('.widget-form .input-wrapper'), function (w) {
      var f = w.querySelector('input:not([type=checkbox]), textarea');
      if (!f || w.querySelector('.ames-flabel')) return;
      var id = 'ames-f-' + (f.getAttribute('name') || '').toLowerCase().replace(/\W+/g, '-');
      f.id = id;
      var l = document.createElement('label'); l.className = 'ames-flabel'; l.htmlFor = id; l.textContent = f.getAttribute('placeholder') || '';
      f.parentNode.insertBefore(l, f.nextSibling);
      if (f.placeholder) { f.placeholder = ' '; }
      if (/name/i.test(f.name)) f.setAttribute('autocomplete', 'name');
      if (/mail/i.test(f.name)) f.setAttribute('autocomplete', 'email');
      if (/name|message/i.test(f.name)) f.setAttribute('autocapitalize', 'sentences');
    });
    // mailing list starts ticked (once per field, so it can be unticked)
    Array.prototype.forEach.call(document.querySelectorAll('.widget-form input[type=checkbox]'), function (c) {
      if (c.__amesTicked || !/mailing/i.test(c.name)) return;
      c.__amesTicked = true;
      if (!c.checked) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    placeForm();
    placeHome();
    if (dbg.fitHead) dbg.fitHead();
  }
  // Moves a group of widgets up or down so it sits at `ratio` of the visible screen height, whatever that height is.
  // endOf(w) gives where a widget really ends (the form's own box has no height; it ends at its send button).
  function placeGroup(page, ws, ratio, endOf, key) {
    var box = page && page.querySelector('.page-content-container');
    if (!box || !ws.length || !ws[0].offsetWidth) return;
    if (box.getAnimations && box.getAnimations().length) { clearTimeout(page['_t' + key]); page['_t' + key] = setTimeout(function () { placeGroup(page, ws, ratio, endOf, key); }, 600); return; }
    var r0 = ws[0].getBoundingClientRect(), k = r0.width / ws[0].offsetWidth || 1;   // Readymag scales the whole page
    // under the desktop zoom these boxes can be in unzoomed units, where the screen is innerHeight / zoom tall
    var z = parseFloat(getComputedStyle(box).zoom) || 1, s = Math.abs(r0.width - ws[0].offsetWidth) < 2 ? z : 1;
    var was = (dbg[key] || 0) * k, pt = page.getBoundingClientRect().top / s, top = Infinity, low = 0;
    ws.forEach(function (w) {
      var r = w.getBoundingClientRect();
      top = Math.min(top, r.top - pt - was);
      low = Math.max(low, (endOf ? endOf(w) : r.bottom) - pt - was);
    });
    var vh = innerHeight / s, want = Math.max(24 / s, (vh - (low - top)) * ratio);
    var shift = Math.round((want - top) / k);
    ws.forEach(function (w) { w.style.translate = '0 ' + shift + 'px'; });
    dbg[key] = shift;
  }
  // contact page: heading + form a little above the middle
  function placeForm() {
    var form = document.querySelector('.mag .widget-form'), fw = form && form.closest('.rmwidget');
    var page = fw && fw.closest('.page');
    if (!page) return;
    var ws = Array.prototype.filter.call(page.querySelectorAll('.rmwidget.widget-text-v3'), function (w) { return w.getBoundingClientRect().height > 0; });
    ws.push(fw);
    placeGroup(page, ws, 0.42, function (w) { return (w === fw ? (form.querySelector('.button') || w) : w).getBoundingClientRect().bottom; }, 'formShift');
  }
  // landing page: name, tagline and email centred on the screen
  function placeHome() {
    var page = document.querySelector('.mag .page');
    if (!page) return;
    var ws = Array.prototype.filter.call(page.querySelectorAll('.rmwidget'), function (w) { return !w.classList.contains('widget-background') && w.getBoundingClientRect().height > 0; });
    placeGroup(page, ws, 0.5, null, 'homeShift');
  }
  // ---- page rail + hints ----
  function buildNav(mag) {
    var nav = document.createElement('div');
    nav.id = 'ames-nav';
    var word = isPhone() ? 'Swipe' : 'Scroll';
    nav.innerHTML = '<nav id="ames-rail" aria-label="Pages"></nav>' +
      '<button id="ames-hint" class="ames-hint off" type="button" aria-label="Next page"><span>' + word + '</span>' +
      '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M7 2v10M2.5 7.5 7 12l4.5-4.5"/></svg></button>' +
      '<button id="ames-hint-up" class="ames-hint off" type="button" aria-label="Previous page">' +
      '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M7 12V2M2.5 6.5 7 2l4.5 4.5"/></svg><span>' + word + '</span></button>';
    document.body.appendChild(nav);
    var rail = nav.querySelector('#ames-rail'), hint = nav.querySelector('#ames-hint'), up = nav.querySelector('#ames-hint-up');
    function page() { return (dbg.cur && isPhone() ? dbg.cur() : (mag.currentPage && mag.currentPage.num)) || 1; }
    hint.addEventListener('click', function () { if (dbg.goTo) dbg.goTo(page() + 1); else if (!mag.isLastPage()) mag.goNextPage(); });
    up.addEventListener('click', function () { if (dbg.goTo) dbg.goTo(page() - 1); else if (!mag.isFirstPage()) mag.goPrevPage(); });
    // page 2's hint sits just above the player (which grows while a song is loaded)
    function aboveplayer() {
      var pl = document.getElementById('ames-player');
      if (!pl || !pl.isConnected) return 14;
      var r = pl.getBoundingClientRect(), c = pl.closest('.page-content-container');
      var z = c ? parseFloat(getComputedStyle(c).zoom) || 1 : 1, k = Math.abs(r.width - pl.offsetWidth) < 2 ? z : 1;
      var top = r.top * k;
      return top > innerHeight * 0.4 && top < innerHeight ? Math.round(innerHeight - top + 4) : 14;
    }
    var shown = { n: 0, count: 0, hint: null, up: null };
    function sync() {
      var count = 0, n = 1;
      try { count = mag.getPagesCount(); n = (mag.currentPage && mag.currentPage.num) || 1; } catch (e) { return; }
      if (count !== shown.count) {
        rail.innerHTML = '';
        for (var ci = 1; ci < count; ci++) (function (pn) {     // page 1 is reached through the header, not the rail
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Go to ' + (NAMES[pn - 1] || 'page ' + pn));
          b.innerHTML = '<i></i><span>' + (NAMES[pn - 1] || pn) + '</span>';
          b.addEventListener('click', function () { if (dbg.goTo) dbg.goTo(pn); });
          rail.appendChild(b);
        })(ci + 1);
        shown.count = count; shown.n = 0;
      }
      if (n !== shown.n) {
        Array.prototype.forEach.call(rail.children, function (d, i) { d.firstChild.classList.toggle('on', i === n - 2); if (i === n - 2) d.setAttribute('aria-current', 'page'); else d.removeAttribute('aria-current'); });
        rail.style.visibility = n === 1 ? 'hidden' : '';
        shown.n = n;
      }
      var showHint = n === 2 && count > 2, showUp = n === count && count > 2;
      if (showHint) { var bt = aboveplayer() + 'px'; if (hint.style.bottom !== bt) hint.style.bottom = bt; }
      var miniOn = !!(document.getElementById('ames-mini') && document.getElementById('ames-mini').classList.contains('on'));
      if (miniOn !== shown.mini) { shown.mini = miniOn; if (dbg.fitHead) dbg.fitHead(); }
      // the header follows the page (a deep link, or a page Readymag showed by itself)
      var hd = dbg.head;
      if (hd) {
        if (n > 1 && !hd.classList.contains('on')) hd.show(false);
        else if (n === 1 && hd.classList.contains('on') && !(hd.getAnimations && hd.getAnimations().length)) hd.classList.remove('on');
      }
      if (showHint !== shown.hint) { hint.classList.toggle('off', !showHint); shown.hint = showHint; }
      if (showUp !== shown.up) { up.classList.toggle('off', !showUp); shown.up = showUp; }
      dbg.page = n;
      var want = n === 1 || !NAMES[n - 1] ? 'Ames Harding' : 'Ames Harding \u2014 ' + NAMES[n - 1];
      if (document.title !== want) document.title = want;
    }
    sync();
    setInterval(sync, 250);
    whenPageVisible(mag, function () { nav.classList.add('ready'); });
  }

  // Calls done() once every image (including CSS backgrounds) on the current page has loaded, or after 5s.
  function whenPageVisible(mag, done) {
    var fired = false, start = Date.now();
    function fire() { if (!fired) { fired = true; done(); } }
    setTimeout(fire, 5000);
    (function wait() {
      var el = mag.currentPage && (mag.currentPage.el || (mag.currentPage.$el && mag.currentPage.$el[0]));
      if (!el) return setTimeout(wait, 150);
      var urls = [];
      Array.prototype.forEach.call(el.querySelectorAll('*'), function (n) {
        if (n.tagName === 'IMG' && n.currentSrc) urls.push(n.currentSrc);
        var m = /url\(["']?([^"')]+)/.exec(getComputedStyle(n).backgroundImage || '');
        if (m && !/^data:/.test(m[1])) urls.push(m[1]);
      });
      if (!urls.length && Date.now() - start < 2500) return setTimeout(wait, 150);   // widgets not rendered yet
      if (!urls.length) return fire();
      var left = urls.length;
      urls.forEach(function (u) {
        var im = new Image();
        im.onload = im.onerror = function () { if (--left === 0) fire(); };
        im.src = u;
      });
    })();
  }
  boot();
})();
