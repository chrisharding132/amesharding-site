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
    '#ames-player .ames-fbtn{border:none;background:none;cursor:pointer;font-family:inherit;font-weight:300;font-size:10px;letter-spacing:.12em;text-transform:uppercase;',
    '  color:rgba(240,232,218,.55);padding:7px 11px;transition:all .25s ease;}',
    '#ames-player .ames-fbtn+.ames-fbtn{border-left:1px solid rgba(240,232,218,.22);}',
    '#ames-player .ames-fbtn:hover{color:#F0E8DA;}',
    '#ames-player .ames-fbtn.on{background:rgba(232,93,117,.35);color:#F0E8DA;text-shadow:0 0 10px rgba(232,93,117,.8);}',
    '#ames-player .ames-right{grid-area:mid;display:flex;align-items:center;justify-content:center;gap:16px;min-width:0;}',
    '#ames-player.active .ames-right{justify-content:flex-start;}',
    '#ames-player .ames-idle{color:rgba(240,232,218,.75);font-weight:300;font-size:10px;letter-spacing:.2em;text-transform:uppercase;}',
    '#ames-player .ames-info{display:none;flex-direction:column;gap:3px;min-width:0;flex-shrink:0;max-width:45%;}',
    '#ames-player .ames-title{color:#E85D75;font-size:12px;font-weight:300;letter-spacing:.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '#ames-player .ames-tags{color:rgba(240,232,218,.65);font-size:8.5px;font-weight:300;letter-spacing:.14em;text-transform:uppercase;}',
    '#ames-player .ames-full{color:#F0E8DA;font-size:8.5px;font-weight:300;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;border-bottom:1px solid rgba(240,232,218,.35);margin-left:10px;display:none;white-space:nowrap;}',
    '#ames-player .ames-full.has{display:inline;}',
    '#ames-player .ames-controls{display:flex;align-items:center;gap:12px;flex:1;min-width:0;}',
    '#ames-player .ames-play,#ames-player .ames-skip{align-items:center;justify-content:center;padding:0;border:none;border-radius:50%;cursor:pointer;color:#F0E8DA;flex-shrink:0;display:none;}',
    '#ames-player .ames-play{width:36px;height:36px;background:radial-gradient(circle,rgba(240,232,218,.16),transparent 70%);}',
    '#ames-player .ames-skip{width:30px;height:30px;background:none;color:rgba(240,232,218,.8);}',
    '#ames-player .ames-play svg{width:14px;height:14px;fill:currentColor;}',
    '#ames-player .ames-skip svg{width:13px;height:13px;fill:currentColor;}',
    '#ames-player .ames-prog{flex:1;height:3px;padding:10px 0;background:rgba(240,232,218,.22);background-clip:content-box;border-radius:2px;cursor:pointer;display:none;}',
    '#ames-player .ames-fill{height:100%;width:0%;background:#F0E8DA;border-radius:2px;pointer-events:none;}',
    '#ames-player .ames-close{border:none;background:none;color:rgba(240,232,218,.7);cursor:pointer;font-size:14px;width:30px;height:30px;padding:0;flex-shrink:0;display:none;}',
    '#ames-player.active .ames-idle{display:none;}',
    '#ames-player.active .ames-info{display:flex;}',
    '#ames-player.active .ames-prog,#ames-player.active .ames-close{display:block;}',
    '#ames-player.active .ames-play,#ames-player.active .ames-skip{display:flex;}',
    '.ames-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}',
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
    '#ames-mini button.b{flex:none;display:flex;align-items:center;justify-content:center;padding:0;width:36px;height:36px;border-radius:50%;border:0;cursor:pointer;color:#F0E8DA;background:rgba(240,232,218,.1);font-size:13px;}',
    '#ames-mini button.b svg{width:13px;height:13px;fill:currentColor;}',
    '#ames-mini button.n{background:none;width:30px;}',
    '#ames-mini button.x{background:none;width:30px;color:rgba(240,232,218,.6);}',
    '@media (prefers-reduced-motion:reduce){#ames-mini.playing .dot{animation:none}}',
    // desktop idle prompt: centred on the whole player, not just the middle column
    '#ames-player:not(.active) .ames-idle{position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;}',
    '.ames-prompting #ames-player .ames-idle{visibility:hidden;}'
  ].join('\n');

  // Phone layout: two rows (type | tempo filters, then prompt or track). While a track is loaded the panel grows
  // upward from the bottom edge so the full title, tags + duration and all controls fit; mood.js keeps the
  // lights clear of that height. Chosen by the player's own width (container query), so it is right however the page is
  // scaled (Readymag preview, tablets); the window media query is the fallback for older browsers.
  var PHONE = [
    '  #ames-player{padding:8px 12px;grid-template-columns:1fr auto;grid-template-areas:"type tempo" "mid mid";align-content:center;row-gap:8px;column-gap:8px;min-height:0;}',
    '  #ames-player.active{position:absolute;left:0;right:0;bottom:0;height:auto;min-height:100%;align-content:end;padding:10px 12px 8px;}',
    '  #ames-player .ames-fbtn{font-size:9px;padding:8px 5px;letter-spacing:.06em;}',
    '  #ames-player .ames-right{flex-direction:column;align-items:stretch;justify-content:flex-start;gap:5px;}',
    '  #ames-player:not(.active) .ames-right{align-items:center;padding-top:6px;}',
    '  #ames-player .ames-info{max-width:none;flex:none;gap:4px;text-align:center;}',
    '  #ames-player .ames-title{font-size:13px;line-height:1.3;white-space:normal;text-overflow:clip;',
    '    display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;}',
    '  #ames-player .ames-tags{display:block;font-size:9.5px;line-height:1.3;}',
    '  #ames-player .ames-full{font-size:9.5px;}',
    '  #ames-player .ames-controls{flex:none;width:100%;gap:6px;}',
    '  #ames-player .ames-play{width:38px;height:38px;}',
    '  #ames-player .ames-skip,#ames-player .ames-close{width:32px;height:32px;}',
    '  #ames-player .ames-prog{flex:1 1 auto;width:auto;margin:0 6px;}'
  ].join('\n');
  CSS += '\n@media (max-width:760px){' + PHONE + '#ames-player:not(.active) .ames-idle{position:static;transform:none;}}\n@container amesplayer (max-width:600px){' + PHONE +
    '#ames-player:not(.active) .ames-idle{position:static;transform:none;}}';

  var GROUPS = [
    { key: 'type',  opts: [['vocal', 'Vox'], ['vocal-nolyrics', 'Vox (no lyrics)'], ['instrumental', 'Inst']] },
    { key: 'tempo', opts: [['slow', 'Slow'], ['mid', 'Med'], ['high', 'Fast']] }
  ];

  if (window.__amesPlayer) { window.__amesPlayer.scan(); return; }

  var P = window.__amesPlayer = { filters: { type: [], tempo: [] }, track: null, el: null };
  var ICON = {
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 1.5v13l11-6.5z"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1.5h3.6v13H3zM9.4 1.5H13v13H9.4z"/></svg>',
    prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h2.2v12H2zM14.5 2v12L5 8z"/></svg>',
    next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.8 2H14v12h-2.2zM1.5 2v12L11 8z"/></svg>'
  };
  var ART = [96, 192, 512].map(function (n) { var f = n === 96 ? 192 : n; return { src: BASE + 'assets/icon-' + f + '.png', sizes: n + 'x' + n, type: 'image/png' }; });
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
    media();
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
    var b = q('.ames-play'), want = playing() ? 'pause' : 'play';
    if (b.dataset.icon !== want) { b.dataset.icon = want; b.innerHTML = ICON[want]; b.setAttribute('aria-label', playing() ? 'Pause' : 'Play'); }
    if (P.track) {
      q('.ames-title').textContent = P.track.title;
      q('.ames-tags').firstChild.nodeValue = (P.track.tags || []).join(' · ') + (P.track.duration ? '  ·  ' + P.track.duration : '');
      var full = q('.ames-full'), link = P.track.full || '';
      full.classList.toggle('has', !!link);
      if (link) full.href = link; else full.removeAttribute('href');
      var live = q('.ames-sr');
      if (live.dataset.src !== P.track.src) { live.dataset.src = P.track.src; live.textContent = 'Now playing: ' + P.track.title; }
    }
    q('.ames-fill').style.width = audio.duration ? (audio.currentTime / audio.duration) * 100 + '%' : '0%';
    Array.prototype.forEach.call(P.el.querySelectorAll('.ames-fbtn'), function (btn) {
      var on = P.filters[btn.dataset.key].indexOf(btn.dataset.val) >= 0;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function mount(el) {
    if (el.__amesMounted) return;
    el.__amesMounted = true;
    el.innerHTML =
      '<div class="ames-grain"></div><div class="ames-filters"></div>' +
      '<div class="ames-right"><span class="ames-idle">' + (matchMedia('(hover: none)').matches ? 'Tap' : 'Click') + ' a light to listen</span>' +
      '<div class="ames-info"><span class="ames-title"></span><span class="ames-tags"> <a class="ames-full" target="_blank" rel="noopener">Full song &#8599;</a></span></div>' +
      '<div class="ames-controls"><button type="button" class="ames-skip ames-prev" aria-label="Previous track">' + ICON.prev + '</button>' +
      '<button type="button" class="ames-play" aria-label="Play" data-icon="play">' + ICON.play + '</button>' +
      '<button type="button" class="ames-skip ames-next" aria-label="Next track">' + ICON.next + '</button>' +
      '<div class="ames-prog" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="ames-fill"></div></div>' +
      '<button type="button" class="ames-close" aria-label="Close player">&#10005;</button></div></div>' +
      '<span class="ames-sr" role="status" aria-live="polite"></span>';
    var fw = el.querySelector('.ames-filters');
    GROUPS.forEach(function (g) {
      var grp = document.createElement('div');
      grp.className = 'ames-group';
      grp.dataset.key = g.key;
      grp.setAttribute('role', 'group');
      grp.setAttribute('aria-label', g.key === 'type' ? 'Filter by type' : 'Filter by tempo');
      g.opts.forEach(function (o) {
        var b = document.createElement('button');
        b.className = 'ames-fbtn';
        b.type = 'button';
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
      // Under Readymag's desktop zoom a measured box can be in unzoomed units while the pointer is in screen pixels:
      // a time past the end would skip to the next clip. Convert first, and never land on the very end.
      var r = this.getBoundingClientRect(), s = Math.abs(r.width - this.offsetWidth) < 2 ? zoomOf(this) : 1;
      var f = (e.clientX - r.left * s) / (r.width * s || 1);
      audio.currentTime = Math.max(0, Math.min(0.995, f)) * audio.duration;
      sync();
    };
    el.querySelector('.ames-close').onclick = function () { P.stop(); };
    el.querySelector('.ames-prev').onclick = function () { P.prev(); };
    el.querySelector('.ames-next').onclick = function () { P.next(); };
    el.querySelector('.ames-prog').onkeydown = function (e) {
      if (!audio.duration || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      e.preventDefault(); e.stopPropagation();
      audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + (e.key === 'ArrowLeft' ? -5 : 5)));
    };
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
    var oldT = t.textContent, oldG = g.firstChild.nodeValue;
    el.classList.add('active');
    t.textContent = 'Measure Measure Measure Measure Measure Measure Measure Measure Measure Measure';
    var gNode = g.firstChild; gNode.nodeValue = 'tag \u00B7 tag \u00B7 tag  \u00B7  0:00';
    var h = el.offsetHeight;
    el.classList.toggle('active', wasActive); t.textContent = oldT; gNode.nodeValue = oldG;
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
    a.addEventListener('pause', function () { if (a === audio && P.track && !a.ended) state('paused'); });
    a.addEventListener('ended', function () { if (a === audio) { state('ended'); P.next(true); } });
    a.addEventListener('timeupdate', function () {
      if (a !== audio || !a.duration) return;
      var bar = q('.ames-prog'); if (bar) bar.setAttribute('aria-valuenow', Math.round(a.currentTime / a.duration * 100));
      if (a.duration - a.currentTime < 8 && !a.__primedNext) { a.__primedNext = true; var n = nextTrack(); if (n) prime(n.src); }
      position();
    });
  }
  wire(audio);

  // ---- queue: when a clip ends, drift to the nearest unplayed light (respecting the filters) ----
  var history = [], played = {};
  function allTracks() { return (window.__amesMood && window.__amesMood.tracks) || []; }
  function pool() {
    var f = P.filters;
    return allTracks().filter(function (t) { return (!f.type.length || f.type.indexOf(t.type) >= 0) && (!f.tempo.length || f.tempo.indexOf(t.tempo) >= 0); });
  }
  function byTrack(src) { return allTracks().filter(function (t) { return t.src === src; })[0]; }
  function nextTrack() {
    var list = pool(), cur = P.track && byTrack(P.track.src);
    if (!list.length) list = allTracks();
    var fresh = list.filter(function (t) { return !played[t.src] && !(P.track && t.src === P.track.src); });
    if (!fresh.length) { played = {}; fresh = list.filter(function (t) { return !(P.track && t.src === P.track.src); }); }
    if (!fresh.length) return null;
    if (!cur) return fresh[0];
    return fresh.slice().sort(function (a, b) { return Math.hypot(a.x - cur.x, a.y - cur.y) - Math.hypot(b.x - cur.x, b.y - cur.y); })[0];
  }

  // keepElement: not from a tap (clip ended, lock screen): iOS only lets the element that already played keep playing
  function playTrack(track, keepElement) {
    var url = resolve(track.src);
    P.track = track;
    played[track.src] = true;
    if (!audio.paused) audio.pause();
    if (!keepElement && primed && primed.dataset.url === url) {
      audio = primed; primed = null; wire(audio);       // already buffering: use it
    } else if (audio.dataset.url !== url) {
      audio.dataset.url = url; audio.src = url; audio.__primedNext = false;
    } else {
      audio.currentTime = 0;
    }
    audio.preload = 'auto';
    state('loading');
    audio.play().then(function () { if (!audio.paused) state('playing'); }, function () { state('paused'); });
    sync();
  }
  P.find = function (re) { return allTracks().filter(function (t) { return re.test(t.title); })[0]; };
  P.start = function (t) { if (P.track) history.push(P.track); playTrack(t); };
  P.toggle = function () { if (playing()) audio.pause(); else if (P.track) audio.play().catch(sync); };
  P.stop = function () { audio.pause(); P.track = null; history = []; played = {}; state('stopped'); sync(); };
  P.next = function (auto) {
    var n = nextTrack();
    if (!n) return;
    if (P.track) history.push(P.track);
    playTrack(n, auto === true || !userGesture());
  };
  P.prev = function () {
    if (audio.currentTime > 3 || !history.length) { audio.currentTime = 0; return; }
    playTrack(history.pop(), !userGesture());
  };
  function userGesture() { return !!(navigator.userActivation ? navigator.userActivation.isActive : true); }

  // ---- lock screen / headphones: title, artwork, controls ----
  function media() {
    if (!('mediaSession' in navigator)) return;
    var m = navigator.mediaSession;
    if (!P.track) { m.metadata = null; m.playbackState = 'none'; return; }
    if (!m.metadata || m.metadata.title !== P.track.title) {
      m.metadata = new MediaMetadata({ title: P.track.title, artist: 'Ames Harding', album: 'Ames Harding', artwork: ART });
    }
    m.playbackState = playing() || P.state === 'loading' ? 'playing' : 'paused';
  }
  function position() {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState || !audio.duration || !isFinite(audio.duration)) return;
    try { navigator.mediaSession.setPositionState({ duration: audio.duration, playbackRate: audio.playbackRate || 1, position: Math.min(audio.currentTime, audio.duration) }); } catch (e) {}
  }
  if ('mediaSession' in navigator) {
    var act = {
      play: function () { if (P.track) audio.play().catch(sync); },
      pause: function () { audio.pause(); },
      stop: function () { P.stop(); },
      previoustrack: function () { if (history.length) playTrack(history.pop(), true); else audio.currentTime = 0; },
      nexttrack: function () { P.next(true); },
      seekto: function (d) { if (audio.duration && d.seekTime != null) audio.currentTime = Math.min(d.seekTime, audio.duration); }
    };
    Object.keys(act).forEach(function (k) { try { navigator.mediaSession.setActionHandler(k, act[k]); } catch (e) {} });
  }

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (d && d.amesClearFilters) {
      P.filters.type = []; P.filters.tempo = [];
      window.postMessage({ amesFilters: true, type: [], tempo: [] }, '*');
      sync();
    }
    if (!d || !d.amesPlayer) return;
    if (d.action === 'prime' && d.src) prime(d.src);
    if (d.action === 'play' && d.track) { if (P.track) history.push(P.track); playTrack(d.track); }
  });

  // Music keeps playing across pages. Away from the full player, a now-playing bar shows the track,
  // play/pause and close; tapping the title steps back to the Mood Browser page.
  var mini = null;
  // fully in view (not just a sliver of the neighbouring page during a slide)
  function fullPlayerOnScreen() {
    var r = P.el && P.el.isConnected ? P.el.getBoundingClientRect() : null;
    var vw = document.documentElement.clientWidth || innerWidth;
    return !!(r && r.width > 0 && r.left >= -2 && r.right <= vw + 2 && r.bottom > 0 && r.top < innerHeight);
  }
  // which Readymag page holds the full player: its position among the pages, not a timing guess
  function playerPageNum() {
    var page = P.el && P.el.isConnected && P.el.closest('.page');
    var pages = page ? Array.prototype.slice.call(document.querySelectorAll('.mag .page')) : [];
    var i = pages.indexOf(page);
    return i >= 0 ? i + 1 : null;
  }
  function buildMini() {
    mini = document.createElement('div');
    mini.id = 'ames-mini';
    mini.setAttribute('role', 'region');
    mini.setAttribute('aria-label', 'Now playing');
    mini.innerHTML = '<span class="dot"></span><button class="t" type="button"></button>' +
      '<button class="b p" type="button" aria-label="Pause" data-icon="pause">' + ICON.pause + '</button>' +
      '<button class="b n" type="button" aria-label="Next track">' + ICON.next + '</button>' +
      '<button class="b x" type="button" aria-label="Stop">&#10005;</button>';
    mini.querySelector('.t').onclick = goToPlayer;
    mini.querySelector('.p').onclick = function () { P.toggle(); };
    mini.querySelector('.n').onclick = function () { P.next(); };
    mini.querySelector('.x').onclick = function () { P.stop(); };
    document.body.appendChild(mini);
  }
  function syncMini() {
    if (!document.body) return;
    if (!mini) buildMini();
    var mag = window.RM && RM.viewerRouter && RM.viewerRouter.mag, home = playerPageNum() || P.homePage;
    var onPlayerPage = mag && mag.currentPage && home ? mag.currentPage.num === home : fullPlayerOnScreen();
    var show = !!P.track && P.state !== 'stopped' && !onPlayerPage;
    mini.classList.toggle('on', show);
    mini.classList.toggle('playing', playing());
    mini.classList.toggle('loading', P.state === 'loading');
    if (!P.track) return;
    var t = mini.querySelector('.t');
    if (t.dataset.title !== P.track.title) {
      t.dataset.title = P.track.title;
      t.innerHTML = '';
      t.appendChild(document.createTextNode(P.track.title));
      var sm = document.createElement('small'); sm.textContent = 'Now playing \u00B7 ' + (matchMedia('(hover: none)').matches ? 'tap' : 'click') + ' for the map'; t.appendChild(sm);
    }
    var b = mini.querySelector('.p'), want = playing() ? 'pause' : 'play';
    if (b.dataset.icon !== want) { b.dataset.icon = want; b.innerHTML = ICON[want]; b.setAttribute('aria-label', playing() ? 'Pause' : 'Play'); }
    fitAboveBar(show);
  }
  // The bar must not cover page content: if the current page's content reaches under it, ease that page's
  // content up-and-smaller just enough to clear the bar; restored when the bar goes away or the page changes.
  var fitted = null;
  // desktop Readymag scales with CSS zoom, which measured positions don't include
  function zoomOf(el) { var c = el.closest('.page-content-container'), z = c && parseFloat(getComputedStyle(c).zoom); return z && z > 0 ? z : 1; }
  function fitAboveBar(show) {
    var mag = window.RM && RM.viewerRouter && RM.viewerRouter.mag;
    var page = show && mag && mag.currentPage ? document.querySelectorAll('.mag .page')[mag.currentPage.num - 1] : null;
    var bounds = page && page.querySelector('.content-bounds');
    if (fitted && fitted !== bounds) { fitted.style.transform = ''; fitted = null; }
    if (!bounds) return;
    var cur = fitted === bounds ? (parseFloat(bounds.dataset.fit) || 1) : 1, pt = page.getBoundingClientRect().top, low = 0;
    Array.prototype.forEach.call(page.querySelectorAll('.rmwidget'), function (w) {
      if (w.classList.contains('widget-background') || w.closest('.page-fixed-bg-container')) return;
      // moving photo strips run off the screen on purpose: they don't count as content to protect
      var mover = w.closest('.animation-container');
      if (mover && getComputedStyle(mover).animationName !== 'none') return;
      var r = w.getBoundingClientRect();
      if (r.height > 0 && r.right > 0 && r.left < innerWidth) low = Math.max(low, (r.bottom - pt) * zoomOf(w) / cur);
    });
    var barTop = innerHeight - mini.offsetHeight - 14 - pt;   // where the bar rests (it may still be sliding in)
    var s = low > barTop - 6 ? Math.max(0.8, (barTop - 6) / low) : 1;
    if (Math.abs(s - cur) < 0.005 && fitted === bounds) return;
    bounds.style.transformOrigin = '50% 0';
    bounds.style.transition = 'transform .35s ease';
    bounds.style.transform = s < 1 ? 'scale(' + s.toFixed(3) + ')' : '';
    bounds.dataset.fit = s;
    fitted = s < 1 ? bounds : null;
  }
  P.syncMini = syncMini;
  // step page by page to the page holding the full player (Readymag's own transitions)
  function goToPlayer() {
    var mag = window.RM && RM.viewerRouter && RM.viewerRouter.mag;
    var home = P.el && P.el.closest('.page');
    if (!mag || !mag.currentPage) return;
    var target = playerPageNum() || P.homePage || 2, tries = 0;
    var nav = window.__amesPaging;
    if (nav && nav.goTo) return nav.goTo(target);     // glide straight there (phones) / step with page animation
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
    var n = playerPageNum(); if (n) P.homePage = n;   // remember where the full player lives (Readymag may unload it later)
    syncMini();
  }, 300);

  P.scan = function () { Array.prototype.forEach.call(document.querySelectorAll('#ames-player'), mount); };
  P.scan();
  new MutationObserver(P.scan).observe(document.documentElement, { childList: true, subtree: true });
})();
