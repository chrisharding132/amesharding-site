/* AMES HARDING — MOBILE VERTICAL PAGING (TikTok-style)
   Requires the Phone portrait viewport to use the Vertical viewer. One swipe = one page. */
(function () {
  if (window.__amesPaging) return;
  // window.__amesPaging.last says what the most recent swipe did (handy from Safari's Web Inspector)
  var dbg = window.__amesPaging = { ready: false, last: null };

  var st = document.createElement('style');
  st.id = 'ames-paging-css';
  // lock native free-scroll on the phone build; pages advance only via swipes
  st.textContent =
    '.isphone body{overscroll-behavior:none;}' +
    '.isphone .mag.viewer-type-vertical,.isphone .mag.viewer-type-vertical .mag-pages-container{touch-action:none;}';
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
  }
  boot();
})();
