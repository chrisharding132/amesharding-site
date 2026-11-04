/* AMES HARDING — MOBILE VERTICAL PAGING (TikTok-style)
   Requires the Phone portrait viewport to use the Vertical viewer. One swipe = one page. */
(function () {
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');
  if (window.__amesPaging) return;
  // window.__amesPaging.last says what the most recent swipe did (handy from Safari's Web Inspector)
  var dbg = window.__amesPaging = { ready: false, last: null, openEmail: function (u) { location.href = u; } };

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
    // landing page: Listen
    "#ames-listen{position:absolute;left:50%;transform:translateX(-50%);z-index:50;display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:999px;cursor:pointer;color:#F0E8DA;white-space:nowrap;",
    "  background:rgba(52,48,96,.28);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(240,232,218,.35);transition:background .25s ease,border-color .25s ease;",
    "  font:300 9.5px/1 'Neue Haas Grotesk Display Pro','Neue Haas Grotesk Display','Helvetica Neue',Helvetica,sans-serif;letter-spacing:.24em;text-transform:uppercase;}",
    '#ames-listen:hover,#ames-listen:focus-visible{background:rgba(232,93,117,.35);border-color:rgba(240,232,218,.6);outline:none;}',
    '#ames-listen svg{width:9px;height:9px;fill:currentColor;}',
    // moving photos: held while pointed at or pressed
    '.page.ames-hold .animation-container{animation-play-state:paused!important;}',
    // quotes read better left-aligned than justified (wide gaps on phones)
    '.mag .widget-text-v3 .align-justify,.mag .widget-text-v3 [style*="text-align: justify"],.mag .widget-text-v3 [style*="text-align:justify"]{text-align:left!important;}',
    // ---- contact form: underlined fields with floating labels on the sky, frosted send button ----
    '.widget-form{overflow:visible!important;height:auto!important;}',
    ".widget-form .input-wrapper{position:relative!important;height:50px!important;margin-bottom:6px!important;background:none!important;border-radius:0!important;box-shadow:none!important;border-bottom:1px solid rgba(240,232,218,.32);transition:border-color .25s ease,box-shadow .25s ease;}",
    '.widget-form .input-wrapper.is-multiline{height:112px!important;}',
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
    // first-visit hint on page 1
    "#ames-hint{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:10000;",
    "  display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 14px;border:0;background:none;cursor:pointer;",
    "  font:300 10px/1 'Neue Haas Grotesk Display Pro','Neue Haas Grotesk Display','Helvetica Neue',Helvetica,sans-serif;",
    '  letter-spacing:.24em;text-transform:uppercase;color:rgba(240,232,218,.8);text-shadow:0 0 10px rgba(52,48,96,.6);',
    '  transition:opacity .5s ease;}',
    '#ames-hint svg{width:14px;height:14px;animation:ames-bob 1.8s ease-in-out infinite;}',
    '#ames-hint.off{opacity:0;pointer-events:none;}',
    '@keyframes ames-bob{0%,100%{transform:translateY(3px)}50%{transform:translateY(-4px)}}',
    '@media (prefers-reduced-motion:reduce){#ames-hint svg{animation:none}}',
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
  function zoomed() { return !!(window.visualViewport && visualViewport.scale > 1.02); }
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
    // Readymag's pages are not all the same height (Chrome on iPhone: 684 then 714...), so every target comes
    // from where each page actually sits in the document, never from "page number x one height".
    function tops() { return Array.prototype.map.call(document.querySelectorAll('.mag .page'), function (p) { return p.getBoundingClientRect().top + scrollY; }); }
    function nearestIdx(y) { var t = tops(), best = 0; t.forEach(function (v, i) { if (Math.abs(v - y) < Math.abs(t[best] - y)) best = i; }); return best; }
    function topOf(i) { var t = tops(); return t[Math.max(0, Math.min(t.length - 1, i))] || 0; }
    function pageH() { var p = document.querySelectorAll('.mag .page'), c = p[curIdx()] || p[0]; return (c && c.offsetHeight) || innerHeight; }
    function count() { try { return mag.getPagesCount(); } catch (e) { return 1; } }
    function curIdx() { return (mag.currentPage && mag.currentPage.num || 1) - 1; }

    // ---- phone: the page column is the window scroll; we drive it so the page follows the finger ----
    var glide = null;
    function stopGlide() { if (glide) { cancelAnimationFrame(glide); glide = null; } }
    // At rest only the page(s) actually on screen are shown; while dragging/gliding every page is shown.
    function markOff() {
      var pages = document.querySelectorAll('.mag.viewer-type-vertical .page'), best = null, bestOv = -1, ov = [];
      Array.prototype.forEach.call(pages, function (p, i) {
        var r = p.getBoundingClientRect(), o = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
        ov[i] = o; if (o > bestOv) { bestOv = o; best = i; }
      });
      Array.prototype.forEach.call(pages, function (p, i) { p.classList.toggle('ames-off', i !== best && ov[i] < innerHeight * 0.15); });
    }
    function still(on) {
      document.documentElement.classList.toggle('ames-still', on);
      if (on && vertical()) markOff();
      else Array.prototype.forEach.call(document.querySelectorAll('.mag .page.ames-off'), function (p) { p.classList.remove('ames-off'); });
    }
    // Readymag can size the scrollable area shorter than its pages (Chrome on iPhone: 684px of scroll per
    // 714px page), so the last page could never be reached exactly. Make the scroll area as tall as the pages.
    function fitHeight() {
      if (!vertical()) return;
      var ps = document.querySelectorAll('.mag .page'), last = ps[ps.length - 1];
      if (!last) return;
      var need = Math.ceil(topOf(ps.length - 1) + last.offsetHeight) + 'px';
      if (document.documentElement.style.getPropertyValue('--ames-doc-h') !== need) document.documentElement.style.setProperty('--ames-doc-h', need);
    }
    function maxScroll() { return Math.max(0, document.documentElement.scrollHeight - innerHeight); }
    function glideTo(y, speed) {
      stopGlide();
      still(false);
      var from = scrollY, dist = y - from;
      if (Math.abs(dist) < 1) { scrollTo(0, y); still(true); return; }
      // faster flicks finish faster; short corrections are quick
      var dur = reduce ? 120 : Math.max(200, Math.min(480, Math.abs(dist) / Math.max(0.9, Math.abs(speed || 0)) * 0.9 + 140));
      var t0 = performance.now();
      (function frame(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);   // ease-out cubic
        scrollTo(0, from + dist * e);
        glide = k < 1 ? requestAnimationFrame(frame) : null;
        if (!glide) still(true);
      })(t0);
    }
    function goTo(n) {   // 1-based page number, used by the swipe hint and the now-playing bar
      n = Math.max(1, Math.min(count(), n));
      if (vertical()) { fitHeight(); return glideTo(Math.min(topOf(n - 1), maxScroll()), 2); }
      var steps = n - 1 - curIdx();
      (function step() {
        if (!steps) return;
        if (steps > 0) { mag.goNextPage(); steps--; } else { mag.goPrevPage(); steps++; }
        setTimeout(step, 260);
      })();
    }
    dbg.goTo = goTo;

    var y0 = 0, x0 = 0, s0 = 0, axis = null, samples = [];
    // capture on window: runs before any Readymag widget can stopPropagation() the touch
    var OPTS = { passive: true, capture: true };

    window.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { axis = 'multi'; return; }
      stopGlide();                                   // catching a gliding page holds it under the finger
      fitHeight();
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; s0 = scrollY;
      axis = null; samples = [[performance.now(), y0]];
    }, OPTS);

    window.addEventListener('touchmove', function (e) {
      if (axis === 'multi' || e.touches.length !== 1) { axis = 'multi'; return; }
      var y = e.touches[0].clientY, dx = e.touches[0].clientX - x0, dy = y - y0;
      if (!axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axis = Math.abs(dy) > Math.abs(dx) * 1.2 ? 'y' : 'x';
      }
      if (axis !== 'y' || !vertical()) return;
      still(false);                                  // reveal the neighbours only once a vertical drag starts
      samples.push([performance.now(), y]); if (samples.length > 6) samples.shift();
      var max = document.documentElement.scrollHeight - innerHeight, target = s0 - dy;
      // past the first/last page: resist instead of moving 1:1
      if (target < 0) target = target * 0.3; else if (target > max) target = max + (target - max) * 0.3;
      scrollTo(0, Math.max(0, Math.min(max, target)));
    }, OPTS);

    window.addEventListener('touchend', function (e) {
      var y = e.changedTouches[0].clientY, dy = y - y0;
      var last = samples[samples.length - 1] || [0, y], first = samples[0] || last;
      var v = (last[1] - first[1]) / Math.max(1, last[0] - first[0]);       // px/ms, negative = finger moving up
      dbg.last = { dy: Math.round(dy), v: +v.toFixed(2), axis: axis, phone: isPhone(), vertical: !!vertical() };
      if (!isPhone() || axis !== 'y') {
        // a tap (possibly catching a gliding page): settle on the nearest page
        if (vertical()) { var near = Math.min(topOf(nearestIdx(scrollY)), maxScroll()); if (Math.abs(scrollY - near) > 1) glideTo(near, 1); else still(true); }
        return;
      }
      if (!vertical()) {                              // phone in landscape (horizontal viewer): plain page turn
        if (Math.abs(dy) > innerHeight * 0.15) { if (dy < 0) mag.goNextPage(); else mag.goPrevPage(); }
        return;
      }
      var H = pageH(), from = nearestIdx(s0);
      var commit = Math.abs(dy) > H * 0.18 || (Math.abs(v) > 0.35 && Math.abs(dy) > 24);
      var to = commit ? from + (dy < 0 ? 1 : -1) : from;
      to = Math.max(0, Math.min(count() - 1, to));
      dbg.last.go = to > from ? 'next' : to < from ? 'prev' : 'stay';
      glideTo(Math.min(topOf(to), maxScroll()), v);
    }, OPTS);

    // ---- desktop: one page per wheel / trackpad gesture (the trackpad's coasting tail is ignored) ----
    var acc = 0, locked = false, quiet;
    window.addEventListener('wheel', function (e) {
      if (isPhone() || e.ctrlKey) return;                         // ctrl+wheel = pinch-zoom on trackpads
      if (e.target.closest && e.target.closest('textarea, select, [data-ames-scroll]')) return;
      var d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) d *= 16;
      e.preventDefault();
      clearTimeout(quiet);
      quiet = setTimeout(function () { locked = false; acc = 0; }, 180);   // gesture over after 180ms of silence
      if (locked) return;
      acc += d;
      if (Math.abs(acc) < 40) return;
      locked = true;
      dbg.lastWheel = acc > 0 ? 'next' : 'prev';
      if (acc > 0) { if (!mag.isLastPage()) mag.goNextPage(); } else if (!mag.isFirstPage()) mag.goPrevPage();
    }, { passive: false, capture: true });

    // ---- desktop: page content glides in on every page change (wheel, keys, arrows); the sky stays still ----
    var lastIdx = curIdx();
    function arrive() {
      var i = curIdx();
      if (i === lastIdx) return;
      var dir = i > lastIdx ? 1 : -1; lastIdx = i;
      if (vertical() || reduce) return;
      var page = document.querySelector('.mag .page.center-page');
      var c = page && page.querySelector('.page-content-container');
      if (c && c.animate) dbg.arrivals = (dbg.arrivals || 0) + 1;
      if (c && c.animate) c.animate([{ transform: 'translateY(' + (dir * 64) + 'px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
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
      fitHeight();
      still(true);
      setTimeout(resetZoom, 600);
      setInterval(fitHeight, 1000);
      // browser bar showing/hiding: Readymag resizes the pages but leaves the scroll where it was, so the
      // current page slides off its slot (a sliver of the previous page appears). Put it back exactly.
      var resizeT;
      addEventListener('resize', function () {
        fitHeight();
        clearTimeout(resizeT);
        resizeT = setTimeout(function () {
          if (glide || !document.documentElement.classList.contains('ames-still')) return;
          var y = Math.min(topOf(nearestIdx(scrollY)), maxScroll());
          if (Math.abs(scrollY - y) > 1) scrollTo(0, y);
          markOff();
        }, 150);
      });
      // anything else that moves the page (Readymag itself, the address bar): re-mark once scrolling stops
      var scrollEnd;
      addEventListener('scroll', function () {
        if (glide || !document.documentElement.classList.contains('ames-still')) return;
        Array.prototype.forEach.call(document.querySelectorAll('.mag .page.ames-off'), function (p) { p.classList.remove('ames-off'); });
        clearTimeout(scrollEnd); scrollEnd = setTimeout(markOff, 120);
      }, { passive: true });
    }
    if (DEBUG) debugPanel(mag);
    var lastPageForZoom = curIdx();
    setInterval(function () { var i = curIdx(); if (i !== lastPageForZoom) { lastPageForZoom = i; resetZoom(); } }, 500);
    buildNav(mag);
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
      var w = e.target.closest && e.target.closest('.widget-picture'), page = w && w.closest('.page');
      if (page && page.querySelector('.animation-container')) page.classList.toggle('ames-hold', on);
    }
    document.addEventListener('mouseover', function (e) { holdPage(e, true); });
    document.addEventListener('mouseout', function (e) { holdPage(e, false); });
    document.addEventListener('touchstart', function (e) { holdPage(e, true); }, { passive: true });
    document.addEventListener('touchend', function (e) { holdPage(e, false); }, { passive: true });
    pageTouches(mag);
    new MutationObserver(function () { clearTimeout(enhanceT); enhanceT = setTimeout(function () { pageTouches(mag); }, 120); })
      .observe(document.querySelector('.mag-pages-container') || document.documentElement, { childList: true, subtree: true });
    addEventListener('resize', function () { placeListen(); });
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
    placeListen();
  }
  // landing page: a Listen button just below the page's content, and (once set) links beside it
  function placeListen() {
    var page = document.querySelector('.mag .page');
    var box = page && page.querySelector('.page-content-container');
    if (!box) return;
    var btn = document.getElementById('ames-listen');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'ames-listen'; btn.type = 'button';
      btn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1v14l12-7z"/></svg>Listen';
      btn.addEventListener('click', function () { if (dbg.goTo) dbg.goTo(2); });
    }
    // lives in Readymag's content layer (same coordinates and scaling as the widgets, on every device)
    if (btn.parentNode !== box) box.appendChild(btn);
    var low = 0;
    Array.prototype.forEach.call(box.querySelectorAll('.rmwidget'), function (w) {
      if (w.classList.contains('widget-background')) return;
      var t = parseFloat(w.style.top), h = parseFloat(w.style.height);
      if (!isNaN(t) && !isNaN(h) && w.getBoundingClientRect().height > 0) low = Math.max(low, t + h);
    });
    if (low) btn.style.top = Math.round(low + (isPhone() ? 22 : 30)) + 'px';
  }

  // ---- page rail + swipe hint ----
  var SEEN = 'amesSwipedUp';
  function seen() { try { return localStorage.getItem(SEEN) === '1'; } catch (e) { return false; } }
  function markSeen() { try { localStorage.setItem(SEEN, '1'); } catch (e) {} }

  function buildNav(mag) {
    var nav = document.createElement('div');
    nav.id = 'ames-nav';
    nav.innerHTML = '<nav id="ames-rail" aria-label="Pages"></nav>' +
      '<button id="ames-hint" type="button" aria-label="Next page">' +
      '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M7 12V2M2.5 6.5 7 2l4.5 4.5"/></svg>' +
      '<span>' + (isPhone() ? 'Swipe up' : 'Scroll') + '</span></button>';
    document.body.appendChild(nav);
    var rail = nav.querySelector('#ames-rail'), hint = nav.querySelector('#ames-hint');
    hint.addEventListener('click', function () { if (dbg.goTo) dbg.goTo((mag.currentPage && mag.currentPage.num || 1) + 1); else if (!mag.isLastPage()) mag.goNextPage(); });

    var shown = { n: 0, count: 0, hint: null };
    function sync() {
      var count = 0, n = 1;
      try { count = mag.getPagesCount(); n = (mag.currentPage && mag.currentPage.num) || 1; } catch (e) { return; }
      if (n > 1 && !seen()) markSeen();
      if (count !== shown.count) {
        rail.innerHTML = '';
        for (var ci = 0; ci < count; ci++) (function (pn) {
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
        Array.prototype.forEach.call(rail.children, function (d, i) { d.firstChild.classList.toggle('on', i === n - 1); if (i === n - 1) d.setAttribute('aria-current', 'page'); else d.removeAttribute('aria-current'); });
        shown.n = n;
      }
      var showHint = n === 1 && !seen() && count > 1;
      if (showHint !== shown.hint) { hint.classList.toggle('off', !showHint); shown.hint = showHint; }
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
