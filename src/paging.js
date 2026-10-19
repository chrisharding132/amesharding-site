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
    '.isphone .navigation-arrow{display:none!important;}',
    '#ames-nav{display:none;}',
    // fades in only once the page behind it has painted, so it never floats over a blank screen
    '.isphone #ames-nav{display:block;opacity:0;transition:opacity .6s ease;}',
    '.isphone #ames-nav.ready{opacity:1;}',
    // page rail: one dot per page, current page drawn as a short pill
    '#ames-rail{position:fixed;right:9px;top:50%;transform:translateY(-50%);z-index:10000;display:flex;flex-direction:column;gap:8px;pointer-events:none;}',
    '#ames-rail i{display:block;width:4px;height:4px;border-radius:2px;background:rgba(240,232,218,.38);transition:height .35s ease,background .35s ease;}',
    '#ames-rail i.on{height:16px;background:rgba(240,232,218,.9);}',
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
    '.isphone.ames-still .mag.viewer-type-vertical .page:not(.center-page){visibility:hidden;}',
    '.isphone .mag.viewer-type-vertical{background:transparent!important;}',
    '#ames-sky{position:fixed;inset:0;z-index:-1;pointer-events:none;background:#7a6485 center/cover no-repeat;}',
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
    function pageH() { var p = document.querySelector('.mag .page'); return (p && p.offsetHeight) || innerHeight; }
    function count() { try { return mag.getPagesCount(); } catch (e) { return 1; } }
    function curIdx() { return (mag.currentPage && mag.currentPage.num || 1) - 1; }

    // ---- phone: the page column is the window scroll; we drive it so the page follows the finger ----
    var glide = null;
    function stopGlide() { if (glide) { cancelAnimationFrame(glide); glide = null; } }
    function still(on) { document.documentElement.classList.toggle('ames-still', on); }
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
      if (vertical()) return glideTo((n - 1) * pageH(), 2);
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
        if (vertical()) { var Hn = pageH(), near = Math.round(scrollY / Hn) * Hn; if (Math.abs(scrollY - near) > 1) glideTo(near, 1); else still(true); }
        return;
      }
      if (!vertical()) {                              // phone in landscape (horizontal viewer): plain page turn
        if (Math.abs(dy) > innerHeight * 0.15) { if (dy < 0) mag.goNextPage(); else mag.goPrevPage(); }
        return;
      }
      var H = pageH(), from = Math.round(s0 / H);
      var commit = Math.abs(dy) > H * 0.18 || (Math.abs(v) > 0.35 && Math.abs(dy) > 24);
      var to = commit ? from + (dy < 0 ? 1 : -1) : from;
      to = Math.max(0, Math.min(count() - 1, to));
      dbg.last.go = to > from ? 'next' : to < from ? 'prev' : 'stay';
      glideTo(to * H, v);
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
      if (c && c.animate) c.animate([{ transform: 'translateX(' + (dir * 56) + 'px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    var pagesBox = document.querySelector('.mag-pages-container') || document.documentElement;
    new MutationObserver(arrive).observe(pagesBox, { attributes: true, attributeFilter: ['class'], subtree: true });

    dbg.ready = true;
    noFormZoom();
    if (isPhone()) {
      var sky = document.createElement('div'); sky.id = 'ames-sky';
      sky.style.backgroundImage = 'url("' + BASE + 'assets/' + (innerWidth < innerHeight ? 'bg-portrait.jpg' : 'bg-landscape.jpg') + '")';
      document.body.insertBefore(sky, document.body.firstChild);
      still(true);
      setTimeout(resetZoom, 600);
    }
    if (DEBUG) debugPanel(mag);
    var lastPageForZoom = curIdx();
    setInterval(function () { var i = curIdx(); if (i !== lastPageForZoom) { lastPageForZoom = i; resetZoom(); } }, 500);
    buildNav(mag);
  }

  // ---- page rail + swipe hint (phones only, via .isphone CSS) ----
  var SEEN = 'amesSwipedUp';
  function seen() { try { return localStorage.getItem(SEEN) === '1'; } catch (e) { return false; } }
  function markSeen() { try { localStorage.setItem(SEEN, '1'); } catch (e) {} }

  function buildNav(mag) {
    var nav = document.createElement('div');
    nav.id = 'ames-nav';
    nav.innerHTML = '<div id="ames-rail" aria-hidden="true"></div>' +
      '<button id="ames-hint" type="button" aria-label="Next page">' +
      '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M7 12V2M2.5 6.5 7 2l4.5 4.5"/></svg>' +
      '<span>Swipe up</span></button>';
    document.body.appendChild(nav);
    var rail = nav.querySelector('#ames-rail'), hint = nav.querySelector('#ames-hint');
    hint.addEventListener('click', function () { if (dbg.goTo) dbg.goTo((mag.currentPage && mag.currentPage.num || 1) + 1); else if (!mag.isLastPage()) mag.goNextPage(); });

    var shown = { n: 0, count: 0, hint: null };
    function sync() {
      var count = 0, n = 1;
      try { count = mag.getPagesCount(); n = (mag.currentPage && mag.currentPage.num) || 1; } catch (e) { return; }
      if (n > 1 && !seen()) markSeen();
      if (count !== shown.count) {
        rail.innerHTML = new Array(count + 1).join('<i></i>');
        shown.count = count; shown.n = 0;
      }
      if (n !== shown.n) {
        Array.prototype.forEach.call(rail.children, function (d, i) { d.classList.toggle('on', i === n - 1); });
        shown.n = n;
      }
      var showHint = n === 1 && !seen() && count > 1;
      if (showHint !== shown.hint) { hint.classList.toggle('off', !showHint); shown.hint = showHint; }
      dbg.page = n;
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
      // Readymag inserts the page background after the other widgets: wait for it, it's the slow one
      var bg = el.querySelector('.widget-background .picture-background');
      var bgReady = bg && /url\(/.test(getComputedStyle(bg).backgroundImage);
      if (!urls.length || (!bgReady && !el.querySelector('.widget-background:not(:empty)') && Date.now() - start < 2500) || (bg && !bgReady))
        return setTimeout(wait, 150);
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
