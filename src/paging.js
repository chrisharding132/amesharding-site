/* AMES HARDING — MOBILE VERTICAL PAGING (TikTok-style)
   Requires the Phone portrait viewport to use the Vertical viewer. One swipe = one page. */
(function () {
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
    '#ames-toast a:hover{color:#F0E8DA!important;}'
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
    function glideTo(y, speed) {
      stopGlide();
      var from = scrollY, dist = y - from;
      if (Math.abs(dist) < 1) { scrollTo(0, y); return; }
      // faster flicks finish faster; short corrections are quick
      var dur = reduce ? 120 : Math.max(200, Math.min(480, Math.abs(dist) / Math.max(0.9, Math.abs(speed || 0)) * 0.9 + 140));
      var t0 = performance.now();
      (function frame(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);   // ease-out cubic
        scrollTo(0, from + dist * e);
        glide = k < 1 ? requestAnimationFrame(frame) : null;
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
      if (!isPhone() || axis !== 'y') return;
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
