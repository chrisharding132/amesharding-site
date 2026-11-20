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
    'html:not(.isphone),html:not(.isphone) body{overscroll-behavior:none;}',   // no sideways back/forward swipe or bounce
    // desktop: pages change in place and the content glides in vertically (below); Readymag's own sideways
    // slide between pages would run underneath that glide, so it is switched off
    'html:not(.isphone) .mag.viewer-type-horizontal .mag-pages-container .container .page{transition:none!important;}',
    // computer windows narrower than 769px: Readymag stops shrinking the page there and cuts off its right side;
    // here the page keeps shrinking with the window (see narrow() below)
    'html.ames-narrow body,html.ames-narrow .mag{min-width:0!important;width:100%!important;}',
    'html.ames-narrow .mag .mag-pages-container .container,html.ames-narrow .mag .mag-pages-container .container .page{width:100vw!important;}',
    'html.ames-narrow .mag .mag-pages-container .container .page.prev-page{transform:translateX(-100vw)!important;}',
    'html.ames-narrow .mag .mag-pages-container .container .page.next-page{transform:translateX(100vw)!important;}',
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
    // a computer window taller than wide, however narrow (Readymag never draws the page under 769px wide): the large
    // background, cropped to fit. The small phone image is only sharp on a phone; real phones keep loading just that one.
    '@media (max-aspect-ratio:1/1){html:not(.isphone) body .mag .page,html:not(.isphone) body .mag .page-fixed-bg-container,html:not(.isphone) body .mag .widget-background{background-image:url("' + BASE + 'assets/bg-landscape.jpg")!important;}}',
    '#ames-head{position:fixed;top:0;left:0;z-index:10001;padding:0;border:0;background:none;cursor:pointer;opacity:0;pointer-events:none;transform-origin:0 0;transition:opacity .25s ease;}',
    '#ames-head.on{opacity:1;pointer-events:auto;}',
    'html.ames-name-flying .mag .page.ames-home .rmwidget.widget-picture{visibility:hidden!important;}',
    '#ames-head img{position:absolute;display:block;max-width:none;pointer-events:none;transform-origin:0 0;}',
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
    // hints: beside the page dots on the right edge, the word written downwards. "Scroll/Swipe" with a down arrow
    // just under the dots on pages 1 and 2, an up arrow just above them on the last page. Out of the map's way.
    ".ames-hint{position:fixed;top:0;left:0;z-index:10000;",
    "  display:flex;flex-direction:column;align-items:center;gap:10px;padding:8px 4px;border:0;background:none;cursor:pointer;",
    "  font:400 12px/1 'Neue Haas Grotesk Display Pro','Neue Haas Grotesk Display','Helvetica Neue',Helvetica,sans-serif;",
    '  letter-spacing:.26em;text-transform:uppercase;color:rgba(240,232,218,.9);text-shadow:0 0 10px rgba(52,48,96,.7);',
    '  transition:opacity .5s ease;}',
    '.ames-hint span{writing-mode:vertical-rl;}',
    '.ames-hint svg{width:16px;height:16px;flex:none;}',
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

  // Below 769px wide Readymag holds a computer page at 769px (zoom 769/1024) and the window cuts off its right
  // side. Carry on its own scheme instead: the 1024px-wide design zoomed to the window's width, centred top to
  // bottom the way Readymag centres it (top = (screen height / zoom - page height) / 2).
  function narrow() {
    var html = document.documentElement, on = !isPhone() && innerWidth < 769;
    if (html.classList.contains('ames-narrow') !== on) html.classList.toggle('ames-narrow', on);
    if (!on) return;
    var w = innerWidth, z = w / 1024;
    Array.prototype.forEach.call(document.querySelectorAll('.mag .page'), function (pg) {
      var c = pg.querySelector('.page-content-container'), b = pg.querySelector('.content-bounds');
      if (b && b.style.width !== w + 'px') b.style.width = w + 'px';
      if (!c) return;
      var zs = z.toFixed(6), top = ((innerHeight / z - c.offsetHeight) / 2).toFixed(3) + 'px';
      if (c.style.zoom !== zs) c.style.zoom = zs;
      if (c.style.top !== top) c.style.top = top;
    });
  }
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
        if (i === 0) placeHome();
        if (i === count() - 1) placeForm();
        return ready(i).then(function () {
          return play(to, [{ translate: '0 ' + (reduce || i === 0 ? 0 : dir * 36) + 'px', opacity: 0 }, { translate: '0 0', opacity: 1 }], reduce ? 160 : 380, 'cubic-bezier(.2,.8,.2,1)');
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
    function arrived(i) {
      window.postMessage({ amesArrived: i + 1 }, '*');
      if (i === 0) { placeHome(); arm(); }
      if (i === count() - 1) { placeForm(); setTimeout(placeForm, 400); }
    }

    // Page 1 is the landing page: after 2s it moves on to the mood map by itself (a swipe or scroll goes at once).
    // Touching the page, or the tab being in the background, restarts the wait.
    var autoT, autoAt = -1e9;
    function arm() {
      clearTimeout(autoT);
      if (here() !== 0) return;
      autoT = setTimeout(function () {
        if (document.hidden || here() !== 0) return arm();
        autoAt = performance.now();
        goTo(2);
      }, 2000);
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
      // Readymag unloads page 1's pieces while you are far from it, and rebuilds them in the same place: keep the
      // last place they were seen, so the name can always fly back to it
      if (!parts.length) return logo.seen && logo.seen.vw === innerWidth ? logo.seen : null;
      var x0 = Math.min.apply(null, parts.map(function (q) { return q.x; })), y0 = Math.min.apply(null, parts.map(function (q) { return q.y; }));
      var x1 = Math.max.apply(null, parts.map(function (q) { return q.x + q.w; })), y1 = Math.max.apply(null, parts.map(function (q) { return q.y + q.h; }));
      return (logo.seen = { parts: parts, x: x0, y: y0, w: x1 - x0, h: y1 - y0, vw: innerWidth });
    }
    // AMES and HARDING side by side at equal heights; each word flies between its place on page 1 and the header
    // The header's own copies of the two name pictures, at header size, from Readymag's image server: it never
    // depends on page 1 having been built (a link straight to page 4 still gets its header).
    var NAME = [
      { src: 'https://i-p.rmcdn.net/6950a66cdb429179fc4690ec/6440110/image-dc96b975-bf35-41e1-88d7-776108eb0a02.png?w=360&e=webp&nll=true&cX=0&cY=4&cW=1844&cH=412', ar: 1007 / 225 },
      { src: 'https://i-p.rmcdn.net/6950a66cdb429179fc4690ec/6440110/image-f54a7788-97ba-406a-9fd4-ed33ae7a1e63.png?w=480&e=webp&nll=true&cX=5&cY=34&cW=1854&cH=302', ar: 1311 / 214 }
    ];
    var headBox = null;
    head.build = function () {
      var phone = isPhone(), hh = phone ? 22 : 26, gap = hh * 0.45;
      var parts = NAME;
      var ws = parts.map(function (q) { return q.ar * hh; }), W = ws.reduce(function (m, v) { return m + v; }, 0) + gap * (parts.length - 1);
      var top = (phone ? 14 : 30) + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ames-safe-top')) || 0);
      var x = (innerWidth - W) / 2, at = x, tg = parts.map(function (q, n) { var t = { x: at, y: top, w: ws[n], h: hh }; at += ws[n] + gap; return t; });
      var sig = parts.map(function (q) { return q.src; }).join('|') + Math.round(W) + 'x' + innerWidth;
      if (head.dataset.sig !== sig) {
        head.dataset.sig = sig;
        head.innerHTML = '';
        parts.forEach(function (q, n) {
          var im = document.createElement('img'); im.alt = ''; im.src = q.src;
          im.style.cssText = 'left:' + (tg[n].x - x).toFixed(1) + 'px;top:0;width:' + tg[n].w.toFixed(1) + 'px;height:' + hh + 'px;';
          head.appendChild(im);
        });
      }
      headBox = { x: x, y: top, w: W, h: hh, tg: tg };
      head.style.left = x.toFixed(1) + 'px'; head.style.top = top.toFixed(1) + 'px';
      head.style.width = W.toFixed(1) + 'px'; head.style.height = hh + 'px';
      window.__amesHeadBottom = top + hh + 10;
      return true;
    };
    // page 1's own copy of the name is hidden while a word is in flight, so the name never shows twice
    // (a page-level style, because Readymag rebuilds a page's pieces as it comes back into view)
    function homeLogo(show) {
      var page = pageEls()[0];
      if (page) page.classList.add('ames-home');
      document.documentElement.classList.toggle('ames-name-flying', !show);
    }
    function fly(up) {
      if (!head.build()) return Promise.resolve();
      // where the words sit on page 1 (AMES, then HARDING); without page 1 built, the header just fades
      var L = logo();
      dbg.lastFly = { up: up, parts: L ? L.parts.length : 0 };
      if (!L || L.parts.length !== headBox.tg.length) return Promise.resolve([]);
      var src = L.parts.slice().sort(function (a, b) { return Math.abs(a.y - b.y) > 4 ? a.y - b.y : a.x - b.x; });
      var ims = head.querySelectorAll('img'), jobs = [];
      src.forEach(function (q, n) {
        var t = headBox.tg[n], im = ims[n];
        if (!im || !im.animate) return;
        var big = { transform: 'translate(' + (q.x - t.x).toFixed(1) + 'px,' + (q.y - t.y).toFixed(1) + 'px) scale(' + (q.w / t.w).toFixed(4) + ',' + (q.h / t.h).toFixed(4) + ')' };
        var an = im.animate(up ? [big, { transform: 'none' }] : [{ transform: 'none' }, big], { duration: reduce ? 480 : 700, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' });
        jobs.push((an.finished || Promise.resolve()).then(function () { return an; }, function () { return an; }));
      });
      return Promise.all(jobs);
    }
    head.show = function (animate) {
      if (!head.build()) return;
      head.classList.add('on');
      if (animate) {
        homeLogo(false);
        fly(true).then(function (ans) { ans.forEach(function (a) { a.cancel(); }); homeLogo(true); });
      }
      fitAll();
    };
    head.hide = function (animate) {
      if (!animate || !head.classList.contains('on')) { head.classList.remove('on'); homeLogo(true); return; }
      homeLogo(false);
      fly(false).then(function (ans) {
        // the words have landed exactly on page 1's own: swap to those in the same frame (no fade, no jump)
        homeLogo(true);
        head.style.transition = 'none'; head.classList.remove('on'); void head.offsetWidth;
        ans.forEach(function (a) { a.cancel(); });
        requestAnimationFrame(function () { head.style.transition = ''; });
      });
    };
    dbg.head = head;
    // Phones: pages 2 onwards make room for the header. Their content eases down-and-smaller just enough to clear it,
    // keeping its bottom where it was (the player stays on the bottom edge). Moving photo strips are left out.
    function fitBelow(pg) {
      var b = pg.querySelector('.content-bounds'), pr = pg.getBoundingClientRect();
      if (!b || !pr.height) return;
      // The map page fits itself (mood.js sizes the map between the header and the player). Scaling it here as
      // well fed back into the map's own sizing: the map came out up to a quarter smaller and, after a browser-bar
      // change, hundreds of pixels down the screen.
      if (pg.querySelector('#ames-mb')) {
        if (b.dataset.fit) { delete b.dataset.fit; b.style.transform = ''; window.postMessage({ amesPlayerSize: true }, '*'); }
        return;
      }
      var old = b.dataset.fit ? b.dataset.fit.split(',').map(Number) : [1, 0], s0 = old[0], t0 = old[1], top = Infinity, low = 0;
      Array.prototype.forEach.call(pg.querySelectorAll('.rmwidget'), function (w) {
        if (w.classList.contains('widget-background') || w.closest('.page-fixed-bg-container')) return;
        var r = w.getBoundingClientRect();
        if (r.height < 2 || r.width < 2) return;
        // a strip of photos sliding sideways is content to keep on screen; one running off the page up/down is not
        var mover = w.closest('.animation-container');
        if (mover && getComputedStyle(mover).animationName !== 'none') {
          var mr = mover.getBoundingClientRect();
          if (mr.top < pr.top - 4 || mr.bottom > pr.bottom + 4) return;
        }
        top = Math.min(top, ((r.top - pr.top) - t0) / s0);
        low = Math.max(low, ((r.bottom - pr.top) - t0) / s0);
      });
      if (!isFinite(top)) return;
      // ...and the corner play button at the bottom, while it shows
      var mini = document.getElementById('ames-mini'), room = mini && mini.classList.contains('on') ? innerHeight - mini.getBoundingClientRect().top + 8 : 0;
      var strip = pg.querySelector('.animation-container') ? 18 : 0;   // a photo strip keeps clear of the bottom edge
      var hb = window.__amesHeadBottom || 0, bottom = Math.min(low, innerHeight - Math.max(room, strip)), s = 1, t = 0;
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
    // Desktop: Readymag sizes a page to the window's width only, so in a short window the content runs up under
    // the header and off the bottom. Pages 3 on scale down (centred) to fit between a fixed gap under the header
    // and the bottom. Page 1 centres itself and the map page fits its own lights.
    function fitDesk(pg) {
      var b = pg.querySelector('.content-bounds'), c = pg.querySelector('.page-content-container'), pr = pg.getBoundingClientRect();
      if (!b || !c || !pr.height) return;
      if (c.getAnimations && c.getAnimations().length) { clearTimeout(pg._fitT); pg._fitT = setTimeout(function () { fitDesk(pg); }, 600); return; }
      var old = b.dataset.fit ? b.dataset.fit.split(',').map(Number) : [1, 0], s0 = old[0], t0 = old[1];
      // under the zoom, rects can come back in unzoomed units: u turns them into screen pixels
      var z = parseFloat(getComputedStyle(c).zoom) || 1, br = b.getBoundingClientRect();
      var u = Math.abs(br.width / s0 - b.offsetWidth) < 2 ? z : 1, top = Infinity, low = 0;
      function add(r) {
        if (r.height < 2 || r.width < 2) return;
        top = Math.min(top, (r.top * u - pr.top - t0) / s0);
        low = Math.max(low, (r.bottom * u - pr.top - t0) / s0);
      }
      Array.prototype.forEach.call(pg.querySelectorAll('.rmwidget'), function (w) {
        if (w.classList.contains('widget-background') || w.closest('.page-fixed-bg-container')) return;
        // photo columns that run off the page (the About page's moving strips): not content. Judged by their size,
        // not by whether they are moving yet: on arrival Readymag starts them a moment late, and measured still
        // they once made the whole page shrink to half size and drop to the bottom
        var mover = w.closest('.animation-container');
        if (mover) {
          var mr = mover.getBoundingClientRect();
          if (mr.height * u > pr.height * 0.8 || mr.top * u < pr.top - 4 || mr.bottom * u > pr.bottom + 4) return;
        }
        add(w.getBoundingClientRect());
        var btn = w.querySelector('.widget-form .button');          // a form reaches down to its button
        if (btn) add(btn.getBoundingClientRect());
      });
      if (!isFinite(top)) return;
      var last = pg === pageEls()[pageEls().length - 1];
      var A = Math.max((window.__amesHeadBottom || 0) + (last ? 48 : 16), top), bottom = innerHeight - 24, sc = 1, t = 0;
      if (top < A || low > bottom) {
        sc = Math.max(0.45, Math.min(1, (bottom - A) / (low - top)));
        t = A - top * sc;
      }
      var sig = sc.toFixed(3) + ',' + t.toFixed(1);
      if (b.dataset.fit === sig) return;
      b.dataset.fit = sig;
      b.style.transformOrigin = '50% 0';
      b.style.transform = sc < 1 || t ? 'translateY(' + (t / z).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')' : '';
    }
    function fitDeskAll() {
      if (isPhone()) return;
      Array.prototype.forEach.call(pageEls(), function (pg, i) { if (i > 1) fitDesk(pg); });
    }
    dbg.fitDesk = fitDeskAll;
    function fitAll() {
      var ok = head.build();                       // also tells the map where the header ends
      window.postMessage({ amesPlayerSize: true }, '*');
      if (ok) fitDeskAll();
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
      // Claim every event, even the empty one a Mac trackpad sends to start each gesture: Chrome lets the page
      // cancel only a gesture's first event, and an unclaimed gesture goes on to Chrome's own sideways
      // back/forward swipe and rubber-band scroll while the pages turn here as well.
      e.preventDefault();
      e.stopImmediatePropagation();                  // Readymag's own wheel paging stays out of it
      var d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) d *= 16;
      if (!d) return;
      var abs = Math.abs(d), dir = d > 0 ? 1 : -1, now = performance.now();
      // a scroll that starts just as the landing page moves on by itself was aimed at that same move
      if (now - autoAt < 900 && !locked) { locked = true; turnedAt = now; hist = []; peak = 0; trough = Infinity; fading = false; clearTimeout(quiet); quiet = setTimeout(function () { locked = false; acc = 0; }, 180); return; }
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
        // (a coast's own wobble, or a second finger brushing the pad, is not enough: that once turned 3 on to 4)
        if (dir !== lastDir || (fading && now - turnedAt > 400 && r > Math.max(trough * 2, trough + 10))) { locked = false; acc = 0; }
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

    // Safari also sends the older 'mousewheel' events, which Readymag pages on by itself: a second page per flick
    ['mousewheel', 'DOMMouseScroll'].forEach(function (type) {
      window.addEventListener(type, function (e) {
        if (isPhone() || e.ctrlKey) return;
        var inner = e.target.closest && e.target.closest('textarea, select, [data-ames-scroll]');
        if (inner && inner.scrollHeight > inner.clientHeight + 1) return;
        e.preventDefault(); e.stopImmediatePropagation();
      }, { passive: false, capture: true });
    });

    // ---- desktop: page content glides in on every page change (wheel, keys, arrows); the sky stays still ----
    var lastIdx = curIdx();
    function arrive() {
      var i = curIdx();
      if (i === lastIdx) return;
      var dir = i > lastIdx ? 1 : -1, was = lastIdx; lastIdx = i;
      if (vertical()) return;
      clearTimeout(autoT);
      if (was === 0) head.show(true); else if (i === 0) head.hide(true);
      if (i === count() - 1) placeForm();
      if (i > 1 && dbg.fitDesk) { dbg.fitDesk(); setTimeout(dbg.fitDesk, 900); }   // again once its images have sized it
      setTimeout(function () { arrived(i); }, 250);
      if (reduce || i === 0) return;
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
    narrow();
    addEventListener('resize', narrow);
    setInterval(narrow, 300);
    new MutationObserver(narrow).observe(document.querySelector('.mag-pages-container') || document.body, { attributes: true, attributeFilter: ['style'], subtree: true });
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
      // Chrome on iPhone grows/shrinks its toolbars mid-swipe; a resize that lands during a page change was
      // skipped below, leaving the page part-way down the screen. Check the page is on its slot and put it back.
      var fingers = 0;
      ['touchstart', 'touchend', 'touchcancel'].forEach(function (t) {
        addEventListener(t, function (e) { fingers = e.touches.length; }, { passive: true, capture: true });
      });
      setInterval(function () {
        if (busy || fingers || zoomed() || !vertical()) return;
        if (Math.abs(scrollY - slotOf(cur)) > 2) settle(cur);
      }, 400);
      // browser bar showing/hiding: Readymag resizes the pages but leaves the scroll where it was: put the page back
      var resizeT, resizedAt = -1e9;
      addEventListener('resize', function () {
        resizedAt = performance.now();
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
          var off = Math.abs(scrollY - slotOf(cur));
          if (busy || off <= 2) return;
          // A toolbar growing/shrinking re-sizes the pages under a scroll that stays put, so the page looks out of
          // place without anyone having moved: that must never count as going to another page (it sent page 3 back
          // to page 2). Only a large move well clear of a resize follows the scroll; anything else goes back.
          if (performance.now() - resizedAt > 1500 && off > innerHeight * 0.6) cur = nearestIdx(scrollY);
          settle(cur);
        }, 160);
      }, { passive: true });
    }
    if (DEBUG) debugPanel(mag);
    buildNav(mag);
    whenPageVisible(mag, function () { arrived(here()); });   // the first page shown counts as an arrival too (a link to the map ripples)
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
  // topRoom: screen pixels kept clear at the top (the header, and the last page's swipe hint); the group is then
  // centred in what is left
  function placeGroup(page, ws, ratio, endOf, key, topRoom, bottomRoom) {
    var box = page && page.querySelector('.page-content-container');
    if (!box || !ws.length || !ws[0].offsetWidth) return;
    if (box.getAnimations && box.getAnimations().length) { clearTimeout(page['_t' + key]); page['_t' + key] = setTimeout(function () { placeGroup(page, ws, ratio, endOf, key, topRoom, bottomRoom); }, 600); return; }
    var r0 = ws[0].getBoundingClientRect(), k = r0.width / ws[0].offsetWidth || 1;   // Readymag scales the whole page
    // under the desktop zoom these boxes can be in unzoomed units, where the screen is innerHeight / zoom tall
    // (a page scaled to fit a short window is that much smaller again: allow for it when telling the units apart)
    var cb = page.querySelector('.content-bounds'), fs = cb && cb.dataset.fit ? +cb.dataset.fit.split(',')[0] || 1 : 1;
    var z = parseFloat(getComputedStyle(box).zoom) || 1, s = Math.abs(r0.width / fs - ws[0].offsetWidth) < 2 ? z : 1;
    var was = (dbg[key] || 0) * k, pt = page.getBoundingClientRect().top / s, top = Infinity, low = 0;
    ws.forEach(function (w) {
      var r = w.getBoundingClientRect();
      top = Math.min(top, r.top - pt - was);
      low = Math.max(low, (endOf ? endOf(w) : r.bottom) - pt - was);
    });
    var vh = innerHeight / s, room = (topRoom || 0) / s;
    var want = room ? room + Math.max(0, (vh - room - (bottomRoom || 0) / s - (low - top)) * ratio) : Math.max(24 / s, (vh - (low - top)) * ratio);
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
    // below the header and the swipe hint under it (about 48px tall), centred in the rest; phones keep the bottom
    // corner clear for the play button
    var room = (window.__amesHeadBottom || 0) + 48;
    placeGroup(page, ws, 0.5, function (w) { return (w === fw ? (form.querySelector('.button') || w) : w).getBoundingClientRect().bottom; }, 'formShift', room, isPhone() ? 72 : 24);
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
    // both hints line up with the page dots: the down one just under them, the up one just above
    function besideRail(el, below) {
      var rr = rail.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
      if (!rr.height || !w) return;
      var x = Math.round(Math.min(innerWidth - w, rr.left + rr.width / 2 - w / 2));
      var y = Math.round(below ? rr.bottom + 10 : rr.top - 10 - h);
      var tf = 'translate(' + x + 'px,' + y + 'px)';
      if (el.style.transform !== tf) el.style.transform = tf;
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
      var showHint = (n === 1 || n === 2) && count > 2, showUp = n === count && count > 2;
      if (showHint) besideRail(hint, true);
      if (showUp) besideRail(up, false);
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
