/* AMES HARDING — MOOD PLAYER
   Hosted on GitHub Pages; the Readymag Code widget only holds <div id="ames-player"></div> + loader.
   One Audio element per page, however many times this file loads or the widget is re-inserted. */
(function () {
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');

  var CSS = [
    // grid: type filters | prompt or track | tempo filters (phones: two rows, see media query)
    '#ames-player{position:relative;width:100%;height:100%;min-height:52px;display:grid;grid-template-columns:auto 1fr auto;grid-template-areas:"type mid tempo";align-items:center;column-gap:24px;padding:6px 22px;box-sizing:border-box;',
    '  background:rgba(52,48,96,.22);-webkit-backdrop-filter:blur(20px) saturate(1.3);backdrop-filter:blur(20px) saturate(1.3);',
    '  border-top:1px solid rgba(240,232,218,.14);overflow:hidden;flex-wrap:wrap;',
    "  font-family:'Neue Haas Grotesk Display Pro','Neue Haas Grotesk Display','Helvetica Neue',Helvetica,sans-serif;}",
    '#ames-player .ames-grain{position:absolute;inset:0;pointer-events:none;opacity:.8;background:url("' + BASE + 'assets/grain.png") repeat;background-size:64px 64px;}',
    '#ames-player>*:not(.ames-grain){position:relative;}',
    '#ames-player .ames-filters{display:contents;}',
    '#ames-player .ames-group[data-key=type]{grid-area:type;justify-self:start;}',
    '#ames-player .ames-group[data-key=tempo]{grid-area:tempo;justify-self:end;}',
    '#ames-player .ames-group{display:flex;border:1px solid rgba(240,232,218,.28);border-radius:999px;overflow:hidden;}',
    '#ames-player .ames-fbtn{border:none;background:none;cursor:pointer;font-family:inherit;font-weight:300;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;',
    '  color:rgba(240,232,218,.55);padding:4px 10px;transition:all .25s ease;}',
    '#ames-player .ames-fbtn+.ames-fbtn{border-left:1px solid rgba(240,232,218,.22);}',
    '#ames-player .ames-fbtn:hover{color:#F0E8DA;}',
    '#ames-player .ames-fbtn.on{background:rgba(232,93,117,.35);color:#F0E8DA;text-shadow:0 0 10px rgba(232,93,117,.8);}',
    '#ames-player .ames-right{grid-area:mid;display:flex;align-items:center;justify-content:center;gap:16px;min-width:0;}',
    '#ames-player.active .ames-right{justify-content:flex-start;}',
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
    '#ames-player.loading .ames-play{animation:ames-spin 1s linear infinite;background:none;border:1px solid rgba(240,232,218,.25);border-top-color:#F0E8DA;color:transparent;}',
    '@keyframes ames-spin{to{transform:rotate(360deg)}}',
    // now-playing bar: every page except the one showing the full player
    "#ames-mini{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));z-index:10002;transform:translate(-50%,20px);opacity:0;pointer-events:none;",
    "  display:flex;align-items:center;gap:12px;max-width:min(520px,calc(100vw - 28px));padding:8px 10px 8px 14px;border-radius:999px;box-sizing:border-box;",
    "  background:rgba(52,48,96,.5);-webkit-backdrop-filter:blur(18px) saturate(1.3);backdrop-filter:blur(18px) saturate(1.3);border:1px solid rgba(240,232,218,.18);",
    "  font-family:'Neue Haas Grotesk Display Pro','Neue Haas Grotesk Display','Helvetica Neue',Helvetica,sans-serif;transition:opacity .35s ease,transform .35s ease;}",
    '#ames-mini.on{opacity:1;transform:translate(-50%,0);pointer-events:auto;}',
    '#ames-mini .dot{width:8px;height:8px;border-radius:50%;flex:none;background:#E85D75;box-shadow:0 0 10px rgba(232,93,117,.9);}',
    '#ames-mini.playing .dot{animation:ames-pulse 1.6s ease-in-out infinite;}',
    '@keyframes ames-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.6);opacity:.55}}',
    '#ames-mini .t{flex:1;min-width:0;border:0;background:none;padding:0;text-align:left;cursor:pointer;color:#F0E8DA;font:300 12px/1.2 inherit;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '#ames-mini .t small{display:block;color:rgba(240,232,218,.55);font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;margin-top:2px;}',
    '#ames-mini button.b{flex:none;width:30px;height:30px;border-radius:50%;border:0;cursor:pointer;color:#F0E8DA;background:rgba(240,232,218,.1);font-size:11px;}',
    '#ames-mini button.x{background:none;color:rgba(240,232,218,.6);font-size:13px;}',
    '#ames-mini.loading button.b{animation:ames-spin 1s linear infinite;background:none;border:1px solid rgba(240,232,218,.25);border-top-color:#F0E8DA;color:transparent;}',
    '@media (prefers-reduced-motion:reduce){#ames-mini.playing .dot,#ames-mini.loading button.b,#ames-player.loading .ames-play{animation:none}}',
    // desktop idle prompt: centred on the whole player, not just the middle column
    '#ames-player:not(.active) .ames-idle{position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;}'
  ].join('\n');

  // Phone layout: two rows (type | tempo filters, then prompt or track). While a track is loaded the panel grows
  // upward from the bottom edge so the full title, tags + duration and all controls fit; mood.js keeps the
  // lights clear of that height. Chosen by the player's own width (container query), so it is right however the page is
  // scaled (Readymag preview, tablets); the window media query is the fallback for older browsers.
  var PHONE = [
    '  #ames-player{padding:8px 12px;grid-template-columns:1fr auto;grid-template-areas:"type tempo" "mid mid";align-content:center;row-gap:8px;column-gap:8px;min-height:0;}',
    '  #ames-player.active{position:absolute;left:0;right:0;bottom:0;height:auto;min-height:100%;align-content:end;padding:10px 12px 8px;}',
    '  #ames-player .ames-fbtn{font-size:8px;padding:2px 6px;letter-spacing:.1em;}',
    '  #ames-player .ames-right{flex-direction:column;align-items:stretch;justify-content:flex-start;gap:5px;}',
    '  #ames-player .ames-info{max-width:none;flex:none;gap:4px;}',
    '  #ames-player .ames-title{font-size:12px;line-height:1.3;white-space:normal;text-overflow:clip;',
    '    display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;}',
    '  #ames-player .ames-tags{display:block;font-size:8.5px;line-height:1.3;}',
    '  #ames-player .ames-controls{flex:none;width:100%;gap:12px;}',
    '  #ames-player .ames-play{width:28px;height:28px;font-size:11px;}',
    // 2px bar, but an 18px-tall tap target
    '  #ames-player .ames-prog{flex:1 1 auto;width:auto;padding:8px 0;background-clip:content-box;}'
  ].join('\n');
  CSS += '\n@media (max-width:760px){' + PHONE + '#ames-player:not(.active) .ames-idle{position:static;transform:none;}}\n@container amesplayer (max-width:600px){' + PHONE +
    '#ames-player:not(.active) .ames-idle{position:static;transform:none;}}';

  var GROUPS = [
    { key: 'type',  opts: [['vocal', 'Vox'], ['vocal-nolyrics', 'Vox (no lyrics)'], ['instrumental', 'Inst']] },
    { key: 'tempo', opts: [['slow', 'Slow'], ['mid', 'Med'], ['high', 'Fast']] }
  ];

  if (window.__amesPlayer) { window.__amesPlayer.scan(); return; }

  var P = window.__amesPlayer = { filters: { type: [], tempo: [] }, track: null, el: null };
  var audio = new Audio();
  audio.preload = 'none';

  // Clips are copied to GitHub Pages (src/audio/, listed in manifest.json): ~0.1s to first byte instead of
  // Dropbox's 1-1.5s. A track that isn't copied yet (just added in Airtable) still plays from Dropbox.
  var HOSTED = {};
  fetch(BASE + 'audio/manifest.json').then(function (r) { return r.json(); }).then(function (m) {
    (m.files || []).forEach(function (f) { HOSTED[f] = true; });
  }).catch(function () {});
  function resolve(src) {
    var m = /\/([^/?#]+\.mp3)(?:[?#]|$)/i.exec(src || '');
    return m && HOSTED[m[1]] ? BASE + 'audio/' + m[1] : src;
  }
  P.resolve = resolve;

  // Start fetching a track the moment a light is touched or hovered, so the click plays almost instantly.
  var primed = null;
  function prime(src) {
    var url = resolve(src);
    if (!url || (primed && primed.dataset.url === url) || (audio.dataset.url === url)) return;
    primed = new Audio();
    primed.preload = 'auto';
    primed.dataset.url = url;
    primed.src = url;
    primed.load();
  }
  P.prime = prime;
  function state(s) {
    P.state = s;
    window.postMessage({ amesPlayerState: s, src: P.track && P.track.src }, '*');
    if (P.el) P.el.classList.toggle('loading', s === 'loading');
    syncMini();
  }

  var st = document.createElement('style');
  st.id = 'ames-player-css';
  st.textContent = CSS;
  document.head.appendChild(st);

  function q(sel) { return P.el && P.el.querySelector(sel); }
  function playing() { return !audio.paused && !audio.ended; }

  function sync() {
    syncMini();
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
      grp.dataset.key = g.key;
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
    el.querySelector('.ames-play').onclick = function () { P.toggle(); };
    el.querySelector('.ames-prog').onclick = function (e) {
      if (!audio.duration) return;
      var r = this.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    };
    el.querySelector('.ames-close').onclick = function () { P.stop(); };
    if (el.parentElement) { el.parentElement.style.containerType = 'inline-size'; el.parentElement.style.containerName = 'amesplayer'; }
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

  var EVENTS = ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata'];
  function wire(a) {
    EVENTS.forEach(function (ev) { a.addEventListener(ev, sync); });
    a.addEventListener('waiting', function () { if (a === audio && P.track) state('loading'); });
    a.addEventListener('playing', function () { if (a === audio) state('playing'); });
    a.addEventListener('pause', function () { if (a === audio && P.track) state('paused'); });
    a.addEventListener('ended', function () { if (a === audio) state('ended'); });
  }
  wire(audio);

  function playTrack(track) {
    var url = resolve(track.src);
    P.track = track;
    if (!audio.paused) audio.pause();
    if (primed && primed.dataset.url === url) {
      audio = primed; primed = null; wire(audio);       // already buffering: use it
    } else if (audio.dataset.url !== url) {
      audio.dataset.url = url; audio.src = url;
    } else {
      audio.currentTime = 0;
    }
    audio.preload = 'auto';
    state('loading');
    audio.play().then(function () { if (!audio.paused) state('playing'); }, function () { state('paused'); });
    sync();
  }
  P.toggle = function () { if (playing()) audio.pause(); else if (P.track) audio.play().catch(sync); };
  P.stop = function () { audio.pause(); P.track = null; state('stopped'); sync(); };

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || !d.amesPlayer) return;
    if (d.action === 'prime' && d.src) prime(d.src);
    if (d.action === 'play' && d.track) playTrack(d.track);
  });

  // Music keeps playing across pages. Away from the full player, a now-playing bar shows the track,
  // play/pause and close; tapping the title steps back to the Mood Browser page.
  var mini = null;
  function fullPlayerOnScreen() {
    var r = P.el && P.el.isConnected ? P.el.getBoundingClientRect() : null;
    return !!(r && r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth);
  }
  function buildMini() {
    mini = document.createElement('div');
    mini.id = 'ames-mini';
    mini.setAttribute('role', 'region');
    mini.setAttribute('aria-label', 'Now playing');
    mini.innerHTML = '<span class="dot"></span><button class="t" type="button"></button>' +
      '<button class="b" type="button" aria-label="Pause">&#10074;&#10074;</button>' +
      '<button class="b x" type="button" aria-label="Stop">&#10005;</button>';
    mini.querySelector('.t').onclick = goToPlayer;
    mini.querySelector('.b').onclick = function () { P.toggle(); };
    mini.querySelector('.x').onclick = function () { P.stop(); };
    document.body.appendChild(mini);
  }
  function syncMini() {
    if (!document.body) return;
    if (!mini) buildMini();
    var show = !!P.track && P.state !== 'stopped' && !fullPlayerOnScreen();
    mini.classList.toggle('on', show);
    mini.classList.toggle('playing', playing());
    mini.classList.toggle('loading', P.state === 'loading');
    if (!P.track) return;
    var t = mini.querySelector('.t');
    if (t.dataset.title !== P.track.title) {
      t.dataset.title = P.track.title;
      t.innerHTML = '';
      t.appendChild(document.createTextNode(P.track.title));
      var sm = document.createElement('small'); sm.textContent = 'Now playing \u00B7 tap for the map'; t.appendChild(sm);
    }
    var b = mini.querySelector('.b:not(.x)');
    b.innerHTML = playing() ? '&#10074;&#10074;' : '&#9654;';
    b.setAttribute('aria-label', playing() ? 'Pause' : 'Play');
  }
  P.syncMini = syncMini;
  // step page by page to the page holding the full player (Readymag's own transitions)
  function goToPlayer() {
    var mag = window.RM && RM.viewerRouter && RM.viewerRouter.mag;
    var home = P.el && P.el.closest('.page');
    if (!mag || !mag.currentPage) return;
    var target = P.homePage || 2, tries = 0;
    (function step() {
      if (fullPlayerOnScreen() || tries++ > 20) return;
      var n = mag.currentPage.num;
      // tapped mid-transition: Readymag may not have updated the current page yet, so wait and look again
      if (n === target) return setTimeout(step, 200);
      if (n > target) mag.goPrevPage(); else mag.goNextPage();
      setTimeout(step, ((mag.getPageTransitionTime && (function () { try { return mag.getPageTransitionTime(); } catch (e) { return 550; } })()) || 550) + 120);
    })();
  }
  setInterval(function () {
    var mag = window.RM && RM.viewerRouter && RM.viewerRouter.mag;
    if (fullPlayerOnScreen() && mag && mag.currentPage) P.homePage = mag.currentPage.num;   // remember where the full player lives
    syncMini();
  }, 300);

  P.scan = function () { Array.prototype.forEach.call(document.querySelectorAll('#ames-player'), mount); };
  P.scan();
  new MutationObserver(P.scan).observe(document.documentElement, { childList: true, subtree: true });
})();
