/* AMES HARDING — MOOD PLAYER
   Hosted on GitHub Pages; the Readymag Code widget only holds <div id="ames-player"></div> + loader.
   One Audio element per page, however many times this file loads or the widget is re-inserted. */
(function () {
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');

  var CSS = [
    '#ames-player{position:relative;width:100%;height:100%;min-height:52px;display:flex;align-items:center;gap:16px;padding:6px 22px;box-sizing:border-box;',
    '  background:rgba(52,48,96,.22);-webkit-backdrop-filter:blur(20px) saturate(1.3);backdrop-filter:blur(20px) saturate(1.3);',
    '  border-top:1px solid rgba(240,232,218,.14);overflow:hidden;flex-wrap:wrap;',
    "  font-family:'Neue Haas Grotesk Display Pro','Neue Haas Grotesk Display','Helvetica Neue',Helvetica,sans-serif;}",
    '#ames-player .ames-grain{position:absolute;inset:0;pointer-events:none;opacity:.8;background:url("' + BASE + 'assets/grain.png") repeat;background-size:64px 64px;}',
    '#ames-player>*:not(.ames-grain){position:relative;}',
    '#ames-player .ames-filters{display:flex;gap:14px;flex-shrink:0;align-items:center;flex-wrap:wrap;}',
    '#ames-player .ames-group{display:flex;border:1px solid rgba(240,232,218,.28);border-radius:999px;overflow:hidden;}',
    '#ames-player .ames-fbtn{border:none;background:none;cursor:pointer;font-family:inherit;font-weight:300;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;',
    '  color:rgba(240,232,218,.55);padding:4px 10px;transition:all .25s ease;}',
    '#ames-player .ames-fbtn+.ames-fbtn{border-left:1px solid rgba(240,232,218,.22);}',
    '#ames-player .ames-fbtn:hover{color:#F0E8DA;}',
    '#ames-player .ames-fbtn.on{background:rgba(232,93,117,.35);color:#F0E8DA;text-shadow:0 0 10px rgba(232,93,117,.8);}',
    '#ames-player .ames-right{display:flex;align-items:center;gap:16px;flex:1;min-width:0;}',
    '#ames-player .ames-idle{color:rgba(240,232,218,.75);font-weight:300;font-size:10px;letter-spacing:.2em;text-transform:uppercase;}',
    '#ames-player .ames-info{display:none;flex-direction:column;gap:3px;min-width:0;flex-shrink:0;max-width:45%;}',
    '#ames-player .ames-title{color:#E85D75;font-size:12px;font-weight:300;letter-spacing:.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '#ames-player .ames-tags{color:rgba(240,232,218,.65);font-size:8.5px;font-weight:300;letter-spacing:.14em;text-transform:uppercase;}',
    '#ames-player .ames-controls{display:flex;align-items:center;gap:12px;flex:1;min-width:0;}',
    '#ames-player .ames-play{width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;background:radial-gradient(circle,rgba(240,232,218,.16),transparent 70%);',
    '  color:#F0E8DA;font-size:13px;flex-shrink:0;display:none;}',
    '#ames-player .ames-prog{flex:1;height:2px;background:rgba(240,232,218,.22);border-radius:2px;cursor:pointer;display:none;}',
    '#ames-player .ames-fill{height:100%;width:0%;background:#F0E8DA;border-radius:2px;}',
    '#ames-player .ames-close{border:none;background:none;color:rgba(240,232,218,.7);cursor:pointer;font-size:14px;flex-shrink:0;display:none;}',
    '#ames-player.active .ames-idle{display:none;}',
    '#ames-player.active .ames-info{display:flex;}',
    '#ames-player.active .ames-play,#ames-player.active .ames-prog,#ames-player.active .ames-close{display:block;}',
    // Phones: one column. While a track is loaded the panel grows upward from the bottom edge so the
    // full title, tags + duration and all controls fit; mood.js keeps the lights clear of that height.
    '@media (max-width:760px){',
    '  #ames-player{padding:8px 12px;flex-direction:column;align-items:stretch;justify-content:center;gap:6px;min-height:0;}',
    '  #ames-player.active{position:absolute;left:0;right:0;bottom:0;height:auto;min-height:100%;justify-content:flex-end;padding:10px 12px 8px;}',
    '  #ames-player .ames-filters{flex-direction:row;justify-content:flex-start;gap:8px;}',
    '  #ames-player .ames-fbtn{font-size:8px;padding:2px 6px;letter-spacing:.1em;}',
    '  #ames-player .ames-right{flex-direction:column;align-items:stretch;gap:5px;width:100%;flex:none;}',
    '  #ames-player .ames-info{max-width:none;flex:none;gap:4px;}',
    '  #ames-player .ames-title{font-size:12px;line-height:1.3;white-space:normal;text-overflow:clip;',
    '    display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;}',
    '  #ames-player .ames-tags{display:block;font-size:8.5px;line-height:1.3;}',
    '  #ames-player .ames-controls{flex:none;width:100%;gap:12px;}',
    '  #ames-player .ames-play{width:28px;height:28px;font-size:11px;}',
    // 2px bar, but an 18px-tall tap target
    '  #ames-player .ames-prog{flex:1 1 auto;width:auto;padding:8px 0;background-clip:content-box;}',
    '}'
  ].join('\n');

  var GROUPS = [
    { key: 'type',  opts: [['vocal', 'Vox'], ['vocal-nolyrics', 'Vox (no lyrics)'], ['instrumental', 'Inst']] },
    { key: 'tempo', opts: [['slow', 'Slow'], ['mid', 'Med'], ['high', 'Fast']] }
  ];

  if (window.__amesPlayer) { window.__amesPlayer.scan(); return; }

  var P = window.__amesPlayer = { filters: { type: [], tempo: [] }, track: null, el: null };
  var audio = new Audio();
  audio.preload = 'none';

  var st = document.createElement('style');
  st.id = 'ames-player-css';
  st.textContent = CSS;
  document.head.appendChild(st);

  function q(sel) { return P.el && P.el.querySelector(sel); }
  function playing() { return !audio.paused && !audio.ended; }

  function sync() {
    if (!P.el) return;
    P.el.classList.toggle('active', !!P.track);
    var b = q('.ames-play');
    b.innerHTML = playing() ? '&#10074;&#10074;' : '&#9654;';
    b.setAttribute('aria-label', playing() ? 'Pause' : 'Play');
    if (P.track) {
      q('.ames-title').textContent = P.track.title;
      q('.ames-tags').textContent = (P.track.tags || []).join(' · ') + (P.track.duration ? '  ·  ' + P.track.duration : '');
    }
    q('.ames-fill').style.width = audio.duration ? (audio.currentTime / audio.duration) * 100 + '%' : '0%';
    Array.prototype.forEach.call(P.el.querySelectorAll('.ames-fbtn'), function (btn) {
      btn.classList.toggle('on', P.filters[btn.dataset.key].indexOf(btn.dataset.val) >= 0);
    });
  }

  function mount(el) {
    if (el.__amesMounted) return;
    el.__amesMounted = true;
    el.innerHTML =
      '<div class="ames-grain"></div><div class="ames-filters"></div>' +
      '<div class="ames-right"><span class="ames-idle">' + (matchMedia('(hover: none)').matches ? 'Tap' : 'Click') + ' a light to listen</span>' +
      '<div class="ames-info"><span class="ames-title"></span><span class="ames-tags"></span></div>' +
      '<div class="ames-controls"><button class="ames-play" aria-label="Play">&#9654;</button>' +
      '<div class="ames-prog"><div class="ames-fill"></div></div>' +
      '<button class="ames-close" aria-label="Close player">&#10005;</button></div></div>';
    var fw = el.querySelector('.ames-filters');
    GROUPS.forEach(function (g) {
      var grp = document.createElement('div');
      grp.className = 'ames-group';
      g.opts.forEach(function (o) {
        var b = document.createElement('button');
        b.className = 'ames-fbtn';
        b.textContent = o[1];
        b.dataset.key = g.key; b.dataset.val = o[0];
        b.onclick = function () {
          var arr = P.filters[g.key], i = arr.indexOf(o[0]);
          if (i >= 0) arr.splice(i, 1); else arr.push(o[0]);
          window.postMessage({ amesFilters: true, type: P.filters.type, tempo: P.filters.tempo }, '*');
          sync();
        };
        grp.appendChild(b);
      });
      fw.appendChild(grp);
    });
    el.querySelector('.ames-play').onclick = function () { if (playing()) audio.pause(); else audio.play().catch(sync); };
    el.querySelector('.ames-prog').onclick = function (e) {
      if (!audio.duration) return;
      var r = this.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    };
    el.querySelector('.ames-close').onclick = function () { audio.pause(); P.track = null; sync(); };
    P.el = el;
    sync();
    measure();
  }

  // Height of the panel with a track loaded (worst case: two-line title), published for mood.js.
  function measure() {
    var el = P.el;
    if (!el || !el.isConnected) return;
    var wasActive = el.classList.contains('active'), t = q('.ames-title'), g = q('.ames-tags');
    var oldT = t.textContent, oldG = g.textContent;
    el.classList.add('active');
    t.textContent = 'Measure Measure Measure Measure Measure Measure Measure Measure Measure Measure';
    g.textContent = 'tag \u00B7 tag \u00B7 tag  \u00B7  0:00';
    var h = el.offsetHeight;
    el.classList.toggle('active', wasActive); t.textContent = oldT; g.textContent = oldG;
    if (h && h !== P.expandedHeight) {
      P.expandedHeight = h;
      window.postMessage({ amesPlayerSize: true, height: h }, '*');
    }
  }
  window.addEventListener('resize', measure);

  ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata'].forEach(function (ev) { audio.addEventListener(ev, sync); });

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || !d.amesPlayer || d.action !== 'play' || !d.track) return;
    P.track = d.track;
    audio.src = d.track.src;
    audio.play().catch(sync);
    sync();
  });

  // Pause when the visitor leaves the page (Readymag pages are client-side routes).
  var pageHref = location.href;
  function pauseNow() { if (playing()) audio.pause(); }
  setInterval(function () {
    if (location.href !== pageHref) { pageHref = location.href; pauseNow(); return; }
    if (!playing()) return;
    var r = P.el && P.el.isConnected ? P.el.getBoundingClientRect() : null;
    var onScreen = r && r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    if (!onScreen) pauseNow();
  }, 400);
  window.addEventListener('popstate', pauseNow);
  window.addEventListener('hashchange', pauseNow);

  P.scan = function () { Array.prototype.forEach.call(document.querySelectorAll('#ames-player'), mount); };
  P.scan();
  new MutationObserver(P.scan).observe(document.documentElement, { childList: true, subtree: true });
})();
