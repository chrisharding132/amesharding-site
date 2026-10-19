/* AMES HARDING — MOOD BROWSER
   Hosted on GitHub Pages; the Readymag Code widget only holds <div id="ames-mb"></div> + loader.
   Track data: window.__amesTracksPromise (Settings -> Code prefetch, which holds the Airtable token).
   The token is deliberately NOT in this file: this repo is public and GitHub secret scanning
   would get an Airtable token auto-revoked. */
(function () {
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');

  var CSS = [
    '#ames-mb{position:relative;width:100%;height:100%;min-height:0;overflow:hidden;background:transparent;',
    '  cursor:url("' + BASE + 'assets/cursor.png") 4 4,auto;}',
    '#ames-mb .ames-labels{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:.65;pointer-events:none;z-index:1;}',
    '#ames-mb::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;',
    '  background-image:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.07\'/%3E%3C/svg%3E");}',
    '#ames-mb .ames-light{position:absolute;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;z-index:2;',
    '  background:radial-gradient(circle,rgba(236,182,146,.95) 0%,rgba(236,182,146,.75) 6%,rgba(236,182,146,.32) 14%,rgba(236,182,146,.1) 32%,rgba(236,182,146,0) 58%);',
    '  transition:transform .25s ease,opacity .3s ease,filter .3s ease;}',
    '#ames-mb .ames-light:hover{transform:scale(1.35);}',
    '#ames-mb .ames-light.sel{background:radial-gradient(circle,rgba(232,93,117,.95) 0%,rgba(232,93,117,.75) 6%,rgba(232,93,117,.32) 14%,rgba(232,93,117,.1) 32%,rgba(232,93,117,0) 58%);}',
    '@keyframes ames-drift{0%{margin-top:-30px;margin-left:-30px}25%{margin-top:-26px;margin-left:-33px}50%{margin-top:-33px;margin-left:-28px}75%{margin-top:-27px;margin-left:-26px}100%{margin-top:-30px;margin-left:-30px}}',
    '@keyframes ames-twinkle{0%,100%{opacity:1}50%{opacity:.72}}',
    '@media (prefers-reduced-motion:reduce){#ames-mb .ames-light{animation:none!important}}',
    '#ames-mb .ames-light.hid{animation:none!important;opacity:.1;filter:grayscale(1);pointer-events:none;}'
  ].join('\n');

  // Embedded fallback, used until (or if) Airtable answers.
  var DROPBOX = 'https://www.dropbox.com/scl/fi/';
  var FALLBACK = [
    ["Hummin' (Intro) 140 BPM", "0:25", "vocal", "high", ["nostalgic", "playful", "flirty"], 0.24, 0.6, "awe9d8fjk0h51c0m1z8fq/Hummin-Intro-140BPM.mp3?rlkey=bzrzlkaffo4k566ozkoghe4ks&st=pl58cf17"],
    ["Hummin' (Verse) 140 BPM", "0:27", "vocal", "high", ["nostalgic", "playful", "flirty"], 0.4, 0.5, "cvarxs6wtbkps8777o66p/Hummin-Verse-140BPM.mp3?rlkey=scjbqtipql5jhiyno9xa8ya3f&st=25wtx5aw"],
    ["Hummin' (Chorus) 140 BPM", "0:24", "vocal", "high", ["nostalgic", "playful", "energetic"], 0.35, 0.8, "2rww87t47qso6omz2olff/Hummin-Chorus-140BPM.mp3?rlkey=tmysehqzammgqj7g6qgd2s9va&st=qxnsuy3i"],
    ["Groovin' (Interlude) 130 BPM", "0:14", "instrumental", "high", ["mellow", "synth", "cinematic"], 0.6, 0.525, "g2pg8s4eflohghlp56g0s/Groovin-Interlude-130BPM.mp3?rlkey=1jrnhiakxvznngmxavamqhgxb&st=d7tl7fku"],
    ["Groovin' (Break) 130 BPM", "0:30", "instrumental", "high", ["energetic", "distorted", "urban"], 0.8, 0.2, "d2x8hkdvr1ds44rydq7nt/Groovin-Break-130BPM.mp3?rlkey=jzbhu4f4azyw3ff1w89aniqs4&st=1cq7kazf"],
    ["Groovin' (Chorus) 130 BPM", "0:31", "vocal", "high", ["mellow", "nostalgic", "feel-good"], 0.12, 0.75, "czok1v8t9rnqth1uqe29f/Groovin-Chorus-130BPM.mp3?rlkey=s1dug36nekc5eaefefjzpu5th&st=aipn7irf"],
    ["Groovin' (Instrumental) 130 BPM", "0:31", "instrumental", "high", ["mellow", "seventies", "feel-good"], 0.3, 0.825, "yfz3kr3jdksuvcc686edk/Groovin-Instrumental-130BPM.mp3?rlkey=wgv0n8kr53zjdx4lefxrdillv&st=2k5vrqj0"],
    ["Sister of the Lilies (Intro) 90 BPM", "0:27", "instrumental", "slow", ["nostalgic", "heartwarming", "intimate"], 0.21, 0.7, "rwna73w6ukub1n6flbba5/Sister-of-the-Lilies-Intro-90BPM.mp3?rlkey=4a2gkbyphnahj7l4ska6pgdl9&st=cvb4vdts"],
    ["Sister of the Lilies (Verse) 90 BPM", "0:22", "vocal", "slow", ["pure", "warm", "nostalgic"], 0.32, 0.865, "2zwrdusgiodmurvg7x3o7/Sister-of-the-Lilies-Verse-90BPM.mp3?rlkey=hdci6gpfsu79cs5ylp37cnd5c&st=tg0ow6zx"],
    ["Sister of the Lilies (B Part) 90 BPM", "0:21", "vocal", "slow", ["warm", "intimate", "harmonies"], 0.38, 0.65, "wfws0ifitg09a9sgchr6r/Sister-of-the-Lilies-B-Part-90BPM.mp3?rlkey=vastv5pfsuu0rd9jocxswf46e&st=0zbhkjm2"],
    ["Sister of the Lilies (Interlude) 90 BPM", "0:21", "vocal", "slow", ["warm", "playful", "radio"], 0.445, 0.625, "0jr46blr0j2frhs4kjwx8/Sister-of-the-Lilies-Interlude-90BPM.mp3?rlkey=4qn6ixgw9sscpx09trqdg0z9b&st=7tum643j"],
    ["Sister of the Lilies (Outro) 90 BPM", "0:22", "vocal", "slow", ["harmonies", "warm", "shimmering"], 0.05, 0.55, "c3sgudcwq0ob36wgenuj3/Sister-of-the-Lilies-Outro-90BPM.mp3?rlkey=af1mo8igiobht4rw9kc6pdu65&st=bv8d352d"],
    ["In This Tender Hour (Hook) 100 BPM", "0:23", "vocal", "mid", ["groovy", "dreamy", "falsetto"], 0.55, 0.45, "94j1m6d5x5en89p30i6og/In-This-Tender-Hour-Hook-100BPM.mp3?rlkey=oqdrz3c4elxjc5uaq8jqzlt0o&st=3lxu3d4i"],
    ["In This Tender Hour (B Part) 100 BPM", "0:40", "vocal", "mid", ["groovy", "lilting", "group vocal"], 0.48, 0.41, "tog9skkbwstgyegt1tx8m/In-This-Tender-Hour-B-Part-100-BPM.mp3?rlkey=1h6hkmlcplx1o8ghf9nphj3nd&st=9oscrlde"],
    ["In This Tender Hour (Outro) 100 BPM", "0:46", "instrumental", "mid", ["groovy", "dreamy", "percussive"], 0.64, 0.43, "o5dc8lj57r0xnrgs7x4bb/In-This-Tender-Hour-Outro-100BPM.mp3?rlkey=h7hjqn0p60d4fft84rkraavkn&st=lo4ov60u"],
    ["Through the Desert (Verse) 120 BPM", "0:25", "vocal", "mid", ["expansive", "dreamy", "heartfelt"], 0.52, 0.37, "hm6e1ongsqv5viwfmze55/Through-the-Desert-Verse-120-BPM.mp3?rlkey=hvea1sqwgp30ner27vyfm9hkl&st=5jq26fmu"],
    ["Through the Desert (Interlude) 120 BPM", "0:48", "vocal", "mid", ["harmonies", "dreamy", "group"], 0.27, 0.35, "zydb9yj9nha5g96h7syek/Through-the-Desert-Interlude-120-BPM.mp3?rlkey=iz5bdaw3rnmx27o0swcpf1hpm&st=k9j8r51x"],
    ["Through the Desert (Outro) 120 BPM", "0:32", "instrumental", "mid", ["guitar", "dreamy", "desert"], 0.575, 0.37, "f5inwaah8z1zlbkarr2ya/Through-the-Desert-Outro-120-BPM.mp3?rlkey=oblxnus2ydett2o0aczuakg6k&st=05x0gcmj"],
    ["Walk the Walk (Intro) 120 BPM", "0:16", "instrumental", "mid", ["club", "groovy", "percussive"], 0.845, 0.36, "eedqne5grcxasi20g30lk/Walk-the-Walk-Intro-120-BPM.mp3?rlkey=8wm3l8h909lwal65e7iuuezn9&st=bu9brjgi"],
    ["Walk the Walk (Verse) 120 BPM", "0:16", "vocal", "mid", ["confident", "club", "sultry"], 0.88, 0.315, "gpyweo9iglikc15a3ln3c/Walk-the-Walk-Verse-120-BPM.mp3?rlkey=n4xy454qgckcfzxr96tvk2sxw&st=dntaamo1"],
    ["Walk the Walk (Chorus) 120 BPM", "0:16", "vocal", "mid", ["confident", "club", "harmonies"], 0.76, 0.29, "cp1gtnlb4tdqb6t3ugj77/Walk-the-Walk-Chorus-120-BPM.mp3?rlkey=3pzboornexxovsz1j1vn7l5th&st=f23pr2wo"],
    ["Walk the Walk (Interlude) 120 BPM", "0:32", "vocal-nolyrics", "mid", ["warm", "synth", "sultry"], 0.725, 0.31, "ln5dtvpo13wqoyihmb7p5/Walk-the-Walk-Interlude-120-BPM.mp3?rlkey=56w1v45372pd74f6clifh50ci&st=0v53oq08"],
    ["Walk the Walk (Outro) 120 BPM", "0:25", "vocal", "mid", ["confident", "club", "sultry"], 0.825, 0.36, "tn9khe31xa026fpl0zjr3/Walk-the-Walk-Outro-120-BPM.mp3?rlkey=i4vedni5edxgdsjdt8cefbpzw&st=etg47hmi"],
    ["The Unblinking Eye (Intro) 100 BPM", "0:29", "vocal", "mid", ["cinematic", "dreamy", "sultry"], 0.145, 0.245, "uuie8vyh12lrk0q33mguc/The-Unblinking-Eye-Intro-100BPM.mp3?rlkey=ah9kyevs74t29qg9rvxsr9uaw&st=yow4lmdc"],
    ["The Unblinking Eye (Verse) 100 BPM", "0:50", "vocal", "mid", ["cinematic", "groovy", "sultry"], 0.165, 0.27, "yj7foexazd8mzdu46errv/The-Unblinking-Eye-Verse-100BPM.mp3?rlkey=4hb256epss4i3297u3407nrly&st=wab7qk99"],
    ["The Unblinking Eye (Hook) 100 BPM", "0:44", "vocal", "mid", ["cinematic", "harmonies", "dreamy"], 0.085, 0.165, "oynuq6qpralebree12eq3/The-Unblinking-Eye-Hook-100BPM.mp3?rlkey=51s1wukw6lkob7pgvw5b6zyxj&st=kpst5ydu"],
    ["The Unblinking Eye (Interlude) 100 BPM", "0:50", "vocal-nolyrics", "mid", ["cinematic", "haunting", "group"], 0.015, 0.145, "10vfoi60pu6ptri3jgqru/The-Unblinking-Eye-Interlude-100BPM.mp3?rlkey=ppji5wr0vayldfpla6ibbg29t&st=zyt55tba"],
    ["The Unblinking Eye (Outro) 100 BPM", "0:48", "vocal-nolyrics", "mid", ["cinematic", "haunting", "organ"], 0.0, 0.19, "y8px0drw0vldchbkcfc1t/The-Unblinking-Eye-Outro-100BPM.mp3?rlkey=bzve9h6q0twpko9t6uza4205n&st=1owcvp6z"]
  ].map(function (a) {
    return { title: a[0], duration: a[1], type: a[2], tempo: a[3], tags: a[4], x: a[5], y: a[6], src: DROPBOX + a[7] + '&raw=1' };
  });

  function fromAirtable(recs) {
    return (recs || []).map(function (r) {
      var f = r.fields || {};
      var x = f['X (organic→electronic)'], y = f['Y (dark→light)'];
      return {
        title: f['Title'] || '', duration: f['Duration'] || '', type: f['Type'] || '', tempo: f['Tempo'] || '',
        tags: f['Tags'] || [],
        x: typeof x === 'number' ? x : 0.5,
        y: typeof y === 'number' ? y : 0.5,
        src: f['Audio URL'] || ''
      };
    }).filter(function (t) { return t.title && t.src; });
  }

  // ---- shared state (one copy per page, however many times this file is loaded) ----
  var S = window.__amesMood;
  if (!S) {
    S = window.__amesMood = { tracks: FALLBACK, filters: { type: [], tempo: [] }, boxes: [] };
    var st = document.createElement('style');
    st.id = 'ames-mb-css';
    st.textContent = CSS;
    document.head.appendChild(st);

    window.addEventListener('message', function (e) {
      var d = e.data;
      if (d && d.amesFilters) { S.filters.type = d.type || []; S.filters.tempo = d.tempo || []; S.boxes.forEach(applyFilters); }
    });
    window.addEventListener('resize', function () { S.boxes.forEach(orient); });

    if (window.__amesTracksPromise) {
      window.__amesTracksPromise.then(function (recs) {
        var mapped = fromAirtable(recs);
        if (!mapped.length) return;
        S.tracks = mapped;
        S.boxes.forEach(render);
      }).catch(function () {});
    }
  }

  function orient(box) {
    var portrait = box.offsetHeight > box.offsetWidth;
    box.querySelector('.ames-labels.l').style.display = portrait ? 'none' : 'block';
    box.querySelector('.ames-labels.p').style.display = portrait ? 'block' : 'none';
  }

  function rnd(a, b) { return (a + Math.random() * (b - a)).toFixed(2); }

  // Clean rebuild: every light in the box is removed first, so dots can never double up.
  function render(box) {
    Array.prototype.forEach.call(box.querySelectorAll('.ames-light'), function (el) { el.remove(); });
    box._lights = S.tracks.map(function (t) {
      var el = document.createElement('div');
      el.className = 'ames-light';
      el.style.left = (8 + t.x * 84) + '%';
      el.style.top = (8 + (1 - t.y) * 84) + '%';
      el.style.animation = 'ames-drift ' + rnd(7, 12) + 's ease-in-out -' + rnd(0, 10) + 's infinite, ' +
        'ames-twinkle ' + rnd(2.5, 6) + 's ease-in-out -' + rnd(0, 5) + 's infinite';
      el.addEventListener('click', function () {
        var s = box.querySelector('.ames-light.sel');
        if (s) s.classList.remove('sel');
        el.classList.add('sel');
        window.postMessage({ amesPlayer: true, action: 'play',
          track: { title: t.title, duration: t.duration, tags: t.tags, src: t.src } }, '*');
      });
      box.appendChild(el);
      return { el: el, t: t };
    });
    applyFilters(box);
  }

  function applyFilters(box) {
    var f = S.filters;
    (box._lights || []).forEach(function (l) {
      var ok = (!f.type.length || f.type.indexOf(l.t.type) >= 0) && (!f.tempo.length || f.tempo.indexOf(l.t.tempo) >= 0);
      l.el.classList.toggle('hid', !ok);
    });
  }

  function mount(box) {
    if (box.__amesMounted) return;
    box.__amesMounted = true;
    box.innerHTML =
      '<img class="ames-labels l" alt="" src="' + BASE + 'assets/labels-landscape.png">' +
      '<img class="ames-labels p" alt="" src="' + BASE + 'assets/labels-portrait.png">';
    S.boxes.push(box);
    orient(box);
    render(box);
  }

  // Readymag can insert the widget after this script runs, and re-insert it on page revisits.
  function scan() {
    S.boxes = S.boxes.filter(function (b) { return b.isConnected; });
    Array.prototype.forEach.call(document.querySelectorAll('#ames-mb, .ames-mb'), mount);
  }
  scan();
  if (!S.observer) {
    S.observer = new MutationObserver(scan);
    S.observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
