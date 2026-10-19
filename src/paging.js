/* AMES HARDING — MOBILE VERTICAL PAGING (TikTok-style)
   Requires the Phone portrait viewport to use the Vertical viewer. One swipe = one page. */
(function () {
  if (window.__amesPaging) return;
  window.__amesPaging = true;

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

    var TRANSITION = (mag.getPageTransitionTime && mag.getPageTransitionTime()) || 550;
    var y0 = 0, x0 = 0, t0 = 0, axis = null, busy = false;

    document.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
      t0 = Date.now(); axis = null;
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (axis || e.touches.length !== 1) return;
      var dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0;
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis = Math.abs(dy) > Math.abs(dx) * 1.4 ? 'y' : 'x';
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      if (!isPhone() || axis !== 'y' || busy) return;
      var dy = e.changedTouches[0].clientY - y0;
      var dt = Date.now() - t0;
      var commit = Math.abs(dy) > innerHeight * 0.15 || (dt < 300 && Math.abs(dy) > 40);
      if (!commit) return;
      busy = true;
      if (dy < 0) { if (!mag.isLastPage()) mag.goNextPage(); }
      else { if (!mag.isFirstPage()) mag.goPrevPage(); }
      setTimeout(function () { busy = false; }, TRANSITION + 80);
    }, { passive: true });
  }
  boot();
})();
