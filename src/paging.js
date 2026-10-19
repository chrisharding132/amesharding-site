/* AMES HARDING — MOBILE VERTICAL PAGING (TikTok-style)
   Requires the Phone portrait viewport to use the Vertical viewer. One swipe = one page. */
(function () {
  if (window.__amesPaging) return;
  // window.__amesPaging.last says what the most recent swipe did (handy from Safari's Web Inspector)
  var dbg = window.__amesPaging = { ready: false, last: null };

  var st = document.createElement('style');
  st.id = 'ames-paging-css';
  // lock native free-scroll on the phone build; pages advance only via swipes
  st.textContent = [
    '.isphone body{overscroll-behavior:none;}',
    '.isphone .mag.viewer-type-vertical,.isphone .mag.viewer-type-vertical .mag-pages-container{touch-action:none;}',
    // Readymag's bottom arrow sat on top of the Mood Player; the rail + hint below replace it on phones.
    '.isphone .navigation-arrow{display:none!important;}',
    '#ames-nav{display:none;}',
    '.isphone #ames-nav{display:block;}',
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
    '@media (prefers-reduced-motion:reduce){#ames-hint svg{animation:none}}'
  ].join('\n');
  document.head.appendChild(st);

  // Readymag applies UA classes after load, so check .isphone live inside the handlers.
  function isPhone() { return document.documentElement.classList.contains('isphone'); }

  function boot() {
    var mag = window.RM && RM.viewerRouter && RM.viewerRouter.mag;
    if (!mag) return setTimeout(boot, 120);

    // Read lazily: getPageTransitionTime() throws if called before Readymag finishes initialising,
    // which used to kill this script before any listener was attached.
    function transition() { try { return mag.getPageTransitionTime() || 550; } catch (e) { return 550; } }
    var y0 = 0, x0 = 0, t0 = 0, axis = null, busy = false;
    // capture on window: runs before any Readymag widget can stopPropagation() the touch
    var OPTS = { passive: true, capture: true };

    window.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
      t0 = Date.now(); axis = null;
    }, OPTS);

    window.addEventListener('touchmove', function (e) {
      if (axis || e.touches.length !== 1) return;
      var dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0;
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis = Math.abs(dy) > Math.abs(dx) * 1.4 ? 'y' : 'x';
    }, OPTS);

    window.addEventListener('touchend', function (e) {
      var dy = e.changedTouches[0].clientY - y0;
      var dt = Date.now() - t0;
      dbg.last = { dy: Math.round(dy), dt: dt, axis: axis, phone: isPhone(), busy: busy };
      if (!isPhone() || axis !== 'y' || busy) return;
      var commit = Math.abs(dy) > innerHeight * 0.15 || (dt < 300 && Math.abs(dy) > 40);
      if (!commit) return;
      busy = true;
      dbg.last.go = dy < 0 ? (mag.isLastPage() ? 'last-page' : 'next') : (mag.isFirstPage() ? 'first-page' : 'prev');
      if (dy < 0) { if (!mag.isLastPage()) mag.goNextPage(); }
      else { if (!mag.isFirstPage()) mag.goPrevPage(); }
      setTimeout(function () { busy = false; }, transition() + 80);
    }, OPTS);
    dbg.ready = true;
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
    hint.addEventListener('click', function () { if (!mag.isLastPage()) mag.goNextPage(); });

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
  }
  boot();
})();
