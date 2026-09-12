/* =========================================================
   Growency: the DOM layer

   Owns window.GROWENCY (the mark's geometry, scroll state,
   the pointer), which scene.js reads every frame.

   One requestAnimationFrame loop reads the scroll position
   and drives every scrubbed state from it, so all of it
   plays backwards when you scroll back up. No scroll
   listeners: the loop reads scrollY and does nothing at all
   on a frame where the page has not moved.

   With this file missing the page still reads top to bottom:
   the pinned scenes and hidden states only exist under `.fx`,
   which is added here and only when motion is welcome.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('still');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var fx = !reduced;
  if (fx) root.classList.add('fx');

  /* ---------------------------------------------- helpers -- */
  function $(id) { return document.getElementById(id); }
  function all(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function out3(t) { return 1 - Math.pow(1 - t, 3); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function r3(v) { return Math.round(v * 1000) / 1000; }

  /* Every write goes through these, so a frame where nothing actually
     changed costs nothing. */
  function css(el, prop, v) { if (!el) return; var k = '_s' + prop; if (el[k] !== v) { el[k] = v; el.style[prop] = v; } }
  function setVar(el, name, v) { if (!el) return; var s = '' + r3(v); var k = '_v' + name; if (el[k] !== s) { el[k] = s; el.style.setProperty(name, s); } }
  function attr(el, name, v) { if (!el) return; var s = '' + v; var k = '_a' + name; if (el[k] !== s) { el[k] = s; el.setAttribute(name, s); } }
  function text(el, v) { if (el && el._t !== v) { el._t = v; el.textContent = v; } }
  function pad3(n) { return (n < 10 ? '00' : n < 100 ? '0' : '') + n; }
  function rng(seed) {
    return function () {
      seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var measure = (function () {
    var c = null;
    return function () { if (!c) c = document.createElement('canvas').getContext('2d'); return c; };
  })();

  var yearEl = $('year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* =======================================================
     The mark's geometry, read once from the logo itself so
     the scene, the plates and the portfolio never drift
     apart from the wordmark. The lattice runs past the
     circle and the SVG clips it, so the path carries
     negative coordinates.
     ======================================================= */
  var MARK = (function () {
    var path = document.querySelector('#mark path');
    if (!path) return null;
    var CLIP = 51.2, CX = 60, CY = 60;
    function rad(x, y) { return Math.hypot(x - CX, y - CY); }
    var segs = [], d = path.getAttribute('d') || '';
    var re = /M(-?[\d.]+)\s+(-?[\d.]+)L(-?[\d.]+)\s+(-?[\d.]+)/g, m;
    while ((m = re.exec(d))) {
      var s = [+m[1], +m[2], +m[3], +m[4]];
      if (rad(s[0], s[1]) <= CLIP && rad(s[2], s[3]) <= CLIP) segs.push(s);
    }
    var nodes = all('#mark circle').filter(function (c) { return +c.getAttribute('r') < 10; })
      .map(function (c) { return [+c.getAttribute('cx'), +c.getAttribute('cy')]; });
    return segs.length > 8 ? { segs: segs, nodes: nodes, CLIP: CLIP, CX: CX, CY: CY } : null;
  })();

  /* ------------------------------------- the shared object -- */
  var G = window.GROWENCY = {
    mark: MARK,
    fx: fx, reduced: reduced, fine: fine, mobile: false,
    nogl: params.has('nogl'),
    vw: window.innerWidth, vh: window.innerHeight,
    film: { p: 0 },
    portal: { x: 0, y: 0, r: 0, open: 0, on: false },
    scene: { name: 'film', p: 0 },
    anchor: null,
    node: 0,
    pointer: { x: 0, y: 0, nx: 0, ny: 0, on: false, moved: false },
    loader: { active: false, phase: 'count', formAt: 0, formed: false, skip: false, done: false, doneAt: 0 },
    sceneOk: false, sceneFail: false,
    sceneReady: function () {
      if (G.sceneOk || G.sceneFail) return;
      G.sceneOk = true;
      root.classList.add('gl-on');
      whenFonts(buildKnock);
    },
    sceneFailed: function (e) {
      if (G.sceneFail) return;
      G.sceneFail = true;
      root.classList.add('no-gl');
      if (e && window.console) console.warn('Growency: the scene is off.', e.message || e);
    }
  };
  if (G.nogl) G.sceneFailed(null);

  var vw = window.innerWidth, vh = window.innerHeight, mobile = vw <= 900, docH = 0;
  G.mobile = mobile;

  /* ---------------------------------------------- pointer -- */
  var P = G.pointer;
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') { P.on = false; return; }
    P.x = e.clientX; P.y = e.clientY;
    P.nx = P.x / vw * 2 - 1; P.ny = -(P.y / vh * 2 - 1);
    P.on = true; P.moved = true;
  }, { passive: true });
  root.addEventListener('mouseleave', function () { P.on = false; P.moved = true; }, { passive: true });
  window.addEventListener('blur', function () { P.on = false; P.moved = true; });

  /* =======================================================
     The scroll registry. Each act measures itself once per
     scrolled frame and turns that into a 0 to 1 progress,
     which its update draws from. Clamped, so an act that is
     far away stops changing and stops costing anything.
     ======================================================= */
  var acts = [];
  function act(el, opts) {
    if (!el) return null;
    var a = {
      el: el, mode: opts.mode || 'pin', update: opts.update || null,
      scene: opts.scene || null, anchor: opts.anchor || null, lenOf: opts.lenOf || null,
      stage: el.querySelector('.act__stage, .film__stage'),
      p: -1, top: 0, h: 0, sh: 0, len: 0, rect: null
    };
    acts.push(a);
    return a;
  }
  function progressOf(a) {
    if (a.mode === 'pin') return clamp(-a.top / Math.max(1, a.h - a.sh), 0, 1);
    if (a.mode === 'pass') return clamp((vh - a.top) / (vh + a.h), 0, 1);
    return clamp((vh * 0.85 - a.top) / Math.max(1, a.len), 0, 1);
  }

  /* =======================================================
     CH 01 and 02: the film
     ======================================================= */
  var film = {
    sec: $('top'), stage: $('filmStage'), hero: $('hero'), txt: $('heroTxt'), word: $('word'),
    knock: $('knock'), noise: $('noise'), one: $('noiseOne'), pane: $('pane'),
    letter: $('letter'), subj: $('letterSubj'),
    lines: [], K: null, target: { dx: 0, dy: 0, s: 1 }
  };

  var NOISE = [
    'Quick question', 'Following up', 'Circling back', 'Touching base', 'Quick intro',
    'Partnership opportunity', 'Can we connect?', 'Re: our last conversation',
    '15 minutes this week?', 'Scaling your outbound', 'Idea for {{company}}',
    '{{first_name}}, quick question', 'Checking in', 'Worth a chat?',
    'Helping teams like yours', 'Last try', 'Bumping this up', 'Did you see my note?',
    'Congrats on the growth!', 'Would love your thoughts', 'A free audit for your team',
    'Hope this finds you well', 'Just following up', 'Thoughts?', 'Exploring synergies',
    'Grow your pipeline this quarter', 'Any interest?', 'Re: Re: quick question'
  ];

  function buildNoise() {
    if (!film.noise || !fx) return;
    var n = mobile ? 32 : 70, rand = rng(20260911), frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var el = document.createElement('p');
      el.textContent = NOISE[i % NOISE.length];
      var x = (rand() - 0.5) * (mobile ? 1.15 : 1.55);
      var y = (rand() - 0.5) * 1.25;
      if (Math.abs(x) < 0.13 && Math.abs(y) < 0.1) y += 0.22;   /* keep the middle clear */
      film.lines.push({ el: el, x: x, y: y, z0: -1500 + rand() * 1450, seed: rand() });
      frag.appendChild(el);
    }
    film.noise.insertBefore(frag, film.one);
  }

  /* The wordmark as cut-out letters. The mask mirrors .word's own layout,
     so CSS still owns the type and this only borrows its measurements. */
  function buildKnock() {
    if (!fx || !G.sceneOk || !film.knock || !film.word || !film.stage) return;
    var stage = film.stage.getBoundingClientRect();
    var W = film.stage.clientWidth, H = film.stage.clientHeight;
    if (!W || !H) return;
    var cs = getComputedStyle(film.word);
    var F = parseFloat(cs.fontSize);
    var fam = (cs.fontFamily || 'sans-serif').replace(/"/g, "'");
    var weight = cs.fontWeight || '800';
    var blEl = film.word.querySelector('.word__bl');
    var bl = blEl ? blEl.getBoundingClientRect().top - stage.top : H * 0.5;
    var spans = all('span', film.word);
    if (!spans.length) return;

    var ctx = measure();
    ctx.font = weight + ' ' + F + 'px ' + fam;

    var glyphs = spans.map(function (sp) {
      var r = sp.getBoundingClientRect();
      return { ch: sp.textContent, x: r.left - stage.left };
    });
    var fontAttrs = ' font-family="' + fam + '" font-weight="' + weight + '" font-size="' + F + '"';
    var letters = glyphs.map(function (g) {
      return '<text x="' + g.x.toFixed(1) + '" y="' + bl.toFixed(1) + '">' + g.ch + '</text>';
    }).join('');

    film.knock.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    film.knock.setAttribute('preserveAspectRatio', 'none');
    film.knock.innerHTML =
      '<defs><mask id="knockMask" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '">' +
      '<rect width="' + W + '" height="' + H + '" fill="#fff"/>' +
      '<g fill="#000"' + fontAttrs + '>' + letters + '</g>' +
      '<circle id="knockHole" cx="0" cy="0" r="0" fill="#000"/>' +
      '</mask></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="#06060C" mask="url(#knockMask)"/>' +
      '<g id="knockLine" fill="none" stroke="rgba(190,200,255,.2)" stroke-width="1"' + fontAttrs + '>' + letters + '</g>';

    var maskText = all('mask text', film.knock), lineText = all('#knockLine text', film.knock);
    var oi = 0;
    glyphs.forEach(function (g, i) { if (g.ch === 'O') oi = i; });
    var m = ctx.measureText('O');
    var left = m.actualBoundingBoxLeft, right = m.actualBoundingBoxRight;
    var asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
    var cx = glyphs[oi].x + (right - left) / 2;
    var cy = bl - (asc - desc) / 2;
    var r = Math.max((right + left) / 2, (asc + desc) / 2);

    film.K = {
      letters: maskText.map(function (el, i) { return { m: el, s: lineText[i] }; }),
      oi: oi,
      o: { cx: cx, cy: cy, r: r, rin: counterRadius(ctx.font, F, m) },
      hole: film.knock.querySelector('#knockHole'),
      line: film.knock.querySelector('#knockLine')
    };
    G.portal.x = cx; G.portal.y = cy; G.portal.r = r; G.portal.on = true;
    if (filmAct) filmAct.p = -1;
    dirty = true;
  }

  /* The O's counter, measured rather than guessed: draw the glyph and walk
     out from its centre until the ink starts. */
  function counterRadius(font, F, m) {
    var w = Math.ceil(F * 1.4), h = Math.ceil(F * 1.4);
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d');
    x.font = font; x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';
    var ox = w / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2 + m.actualBoundingBoxLeft;
    var base = h / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
    x.fillText('O', ox, base);
    var row = x.getImageData(0, Math.round(h / 2), w, 1).data;
    for (var i = Math.round(w / 2); i < w; i++) if (row[i * 4 + 3] > 128) return i - w / 2;
    return F * 0.22;
  }

  function computeTarget() {
    if (!film.pane || !film.subj || !film.one || !film.letter) return;
    var span = film.subj.firstElementChild;
    if (!span || !film.stage) return;
    var W = film.stage.clientWidth, H = film.stage.clientHeight;
    var paneLeft = film.pane.offsetLeft - film.pane.offsetWidth / 2;
    var paneTop = film.pane.offsetTop - film.pane.offsetHeight / 2;
    var x = paneLeft + film.letter.offsetLeft + span.offsetLeft + span.offsetWidth / 2;
    var y = paneTop + film.letter.offsetTop + film.subj.offsetTop + span.offsetHeight / 2;
    film.target.dx = x - W / 2;
    film.target.dy = y - H / 2;
    film.target.s = span.offsetWidth / Math.max(1, film.one.offsetWidth);
  }

  function filmUpdate(p) {
    G.film.p = p;

    var t = inOut(seg(p, 0.04, 0.18));
    css(film.txt, 'opacity', '' + r3(1 - t));
    css(film.txt, 'transform', 'translate3d(0,' + (-t * 7).toFixed(2) + 'vh,0)');
    css(film.txt, 'filter', t > 0.004 ? 'blur(' + (t * 10).toFixed(2) + 'px)' : 'none');
    css(film.txt, 'visibility', t > 0.985 ? 'hidden' : 'visible');

    if (film.K) knockUpdate(p);
    else { /* no scene: the gradient wordmark leaves with the copy */
      var w = inOut(seg(p, 0.05, 0.24));
      css(film.word, 'opacity', '' + r3(1 - w));
      css(film.word, 'transform', 'scale(' + (1 + w * 0.35).toFixed(3) + ')');
    }

    noiseUpdate(p);

    var into = inOut(seg(p, 0.72, 0.84));
    css(film.pane, 'visibility', into > 0.002 ? 'visible' : 'hidden');
    css(film.pane, 'opacity', '' + r3(into));
    css(film.pane, 'transform', 'translate(-50%,-50%) translate3d(0,' + ((1 - into) * 6).toFixed(2) + 'vh,0) scale(' + (0.94 + 0.06 * into).toFixed(3) + ')');

    if (p >= 0.86) letterCtl.play(); else if (p < 0.8) letterCtl.stop();
  }

  function knockUpdate(p) {
    var K = film.K, o = K.o;
    var m = inOut(seg(p, 0.06, 0.28));
    var S = Math.min(vw, vh) * 0.3 / Math.max(1, o.r);
    var s = lerp(1, S, m);
    var cx = lerp(o.cx, vw / 2, m), cy = lerp(o.cy, vh / 2, m);
    var tO = 'translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ') scale(' + s.toFixed(4) + ') translate(' + (-o.cx).toFixed(1) + ' ' + (-o.cy).toFixed(1) + ')';

    for (var i = 0; i < K.letters.length; i++) {
      var L = K.letters[i];
      if (i === K.oi) { attr(L.m, 'transform', tO); attr(L.s, 'transform', tO); continue; }
      var k = i - K.oi, away = Math.abs(k);
      var d = inOut(seg(p, 0.06 + away * 0.012, 0.23 + away * 0.012));
      var dx = (k < 0 ? -1 : 1) * (0.2 + away * 0.075) * vw * d;
      var tr = 'translate(' + dx.toFixed(1) + ' ' + (-d * vh * 0.05).toFixed(1) + ')';
      attr(L.m, 'transform', tr); attr(L.m, 'fill-opacity', r3(1 - d));
      attr(L.s, 'transform', tr); attr(L.s, 'stroke-opacity', r3(1 - d));
    }

    var hole = p < 0.26
      ? out3(seg(p, 0.15, 0.24)) * o.rin * s
      : lerp(o.r * s, Math.hypot(vw, vh) * 0.62, inOut(seg(p, 0.26, 0.42)));
    attr(K.hole, 'cx', cx.toFixed(1)); attr(K.hole, 'cy', cy.toFixed(1)); attr(K.hole, 'r', hole.toFixed(1));
    attr(K.line, 'opacity', r3(1 - seg(p, 0.24, 0.31)));
    css(film.knock, 'visibility', p > 0.44 ? 'hidden' : 'visible');

    G.portal.x = cx; G.portal.y = cy; G.portal.r = o.r * s;
    G.portal.open = seg(p, 0.15, 0.26);
  }

  function noiseUpdate(p) {
    if (!film.noise) return;
    var live = p > 0.4 && p < 0.92;
    css(film.noise, 'visibility', live ? 'visible' : 'hidden');
    if (!live) return;

    var arrive = seg(p, 0.42, 0.5), fly = seg(p, 0.42, 0.82);
    for (var i = 0; i < film.lines.length; i++) {
      var L = film.lines[i];
      var z = L.z0 + fly * 1500;
      var depth = clamp(1 + z / 1600, 0.12, 1);
      var edge = z > 220 ? clamp(1 - (z - 220) / 260, 0, 1) : 1;
      var f = seg(p, 0.62 + L.seed * 0.08, 0.71 + L.seed * 0.08); f = f * f;
      var op = arrive * edge * (0.16 + 0.5 * depth) * (1 - f);
      if (op < 0.005) { css(L.el, 'opacity', '0'); continue; }
      css(L.el, 'opacity', '' + r3(op));
      css(L.el, 'transform', 'translate3d(' + (L.x * vw).toFixed(1) + 'px,' + (L.y * vh + f * vh * 0.9).toFixed(1) + 'px,' + z.toFixed(1) + 'px) translate(-50%,-50%)');
    }

    var shows = seg(p, 0.5, 0.58), lit = seg(p, 0.6, 0.68);
    var travel = inOut(seg(p, 0.74, 0.84)), handover = seg(p, 0.82, 0.86);
    var T = film.target;
    var scale = lerp(1 + lit * 0.28, T.s, travel);
    setVar(film.one, '--lit', lit);
    css(film.one, 'opacity', '' + r3(shows * (1 - handover)));
    css(film.one, 'transform', 'translate3d(' + (T.dx * travel).toFixed(1) + 'px,' + (T.dy * travel).toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + scale.toFixed(3) + ')');
    setVar(film.subj, '--so', handover);
  }

  /* =======================================================
     The letter, and its Copy button
     ======================================================= */
  function letterCopy() {
    var el = $('letter'), btn = $('letterCopy');
    if (!el || !btn) return;
    var subj = el.querySelector('.letter__subj');
    var subject = subj ? subj.textContent.trim() : '';
    var body = all('.ln', el).map(function (ln) {
      return ln.dataset.specific || ln.textContent.trim();
    }).join('\n\n');
    var out = 'Subject: ' + subject + '\n\n' + body;

    btn.hidden = false;
    var label = btn.textContent, back = null;
    function done() {
      btn.textContent = 'Copied';
      btn.classList.add('is-done');
      clearTimeout(back);
      back = setTimeout(function () { btn.textContent = label; btn.classList.remove('is-done'); }, 1800);
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = out; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    }
    btn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(out).then(done, fallback);
      else fallback();
    });
  }

  var letterCtl = (function () {
    var el = $('letter');
    if (!el || !fx) return { play: function () {}, stop: function () {} };
    var lines = all('.ln', el);
    var bar = el.querySelector('.letter__bar i');
    if (!lines.length) return { play: function () {}, stop: function () {} };

    var parts = lines.map(function (ln) {
      var spec = ln.dataset.specific || ln.textContent.trim();
      var gen = ln.dataset.generic || spec;
      ln.textContent = '';
      /* .gen is the block that collapses; .gen__t is the inline text inside
         it, which carries the strike so it follows the words across wraps */
      var g = document.createElement('span'); g.className = 'gen';
      var gt = document.createElement('span'); gt.className = 'gen__t'; g.appendChild(gt);
      var sp = document.createElement('span'); sp.className = 'spec'; sp.textContent = spec;
      ln.appendChild(g); ln.appendChild(sp);
      return { el: ln, gen: gt, generic: gen, rewrites: !ln.dataset.hold };
    });

    var TYPE = 17, token = 0, timers = [], playing = false, wanted = false;
    function at(ms, fn) { var t = token; timers.push(setTimeout(function () { if (t === token) fn(); }, ms)); }
    function type(node, host, str, from) {
      at(from, function () { host.classList.add('is-typing'); });
      for (var i = 1; i <= str.length; i++) {
        (function (n) {
          at(from + n * TYPE, function () {
            node.textContent = str.slice(0, n);
            if (n === str.length) host.classList.remove('is-typing');
          });
        })(i);
      }
      return from + str.length * TYPE;
    }
    function reset() {
      parts.forEach(function (p) { p.el.classList.remove('is-cut', 'is-new', 'is-typing'); p.gen.textContent = ''; });
    }
    /* what the letter shows before it has been played, and after it stops */
    function finished() {
      parts.forEach(function (p) {
        p.el.classList.remove('is-cut', 'is-typing');
        p.gen.textContent = '';
        p.el.classList.add('is-new');
      });
      if (bar) { bar.style.transition = 'none'; bar.style.width = '0%'; }
    }
    function pass() {
      reset();
      var t = 240;
      parts.forEach(function (p) { t = type(p.gen, p.el, p.generic, t) + 120; });
      t += 900;
      parts.filter(function (p) { return p.rewrites; }).forEach(function (p) {
        (function (s) {
          at(s, function () { p.el.classList.add('is-cut'); });
          at(s + 420, function () { p.el.classList.add('is-new'); });
        })(t);
        t += 700;
      });
      t += 4200;   /* the finished letter is the point, so it holds longest */
      at(t, function () { el.classList.add('is-fading'); });
      t += 420;
      at(t, function () { el.classList.remove('is-fading'); timers = []; pass(); });
      if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '0%';
        at(40, function () {
          bar.style.transition = 'width ' + (t - 40) + 'ms linear';
          bar.style.width = '100%';
        });
      }
    }
    function start() { if (playing) return; playing = true; token++; pass(); }
    function halt() {
      if (!playing) return;
      playing = false; token++;
      timers.forEach(clearTimeout); timers = [];
      el.classList.remove('is-fading');
      finished();
    }
    finished();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) halt(); else if (wanted) start();
    });
    return {
      play: function () { wanted = true; if (!document.hidden) start(); },
      stop: function () { wanted = false; halt(); }
    };
  })();

  /* =======================================================
     CH 03: the strategy, and the mark taken apart
     ======================================================= */
  var strat = {
    el: $('alpha'), rows: all('#alpha .rd'), fill: $('fill'), parts: [], words: [],
    box: $('explode'), stack: $('stack'), leads: $('leads'), labels: all('#labels li'),
    now: $('explodeNow'), plates: [], anchors: [], part: -2, e: 0, lead: null
  };

  function buildFill() {
    if (!strat.fill) return;
    all('.part', strat.fill).forEach(function (part) {
      var idx = part.dataset.part != null ? +part.dataset.part : -1;
      strat.parts.push({ el: part, i: idx });
      var words = part.textContent.split(/\s+/).filter(Boolean);
      part.textContent = '';
      words.forEach(function (w, i) {
        var s = document.createElement('span');
        s.className = 'w'; s.textContent = w;
        part.appendChild(s);
        if (i < words.length - 1) part.appendChild(document.createTextNode(' '));
        strat.words.push({ el: s, part: idx });
      });
    });
  }

  /* Each segment of the lattice belongs to the node it sits closest to, so
     the mark comes apart into six cells that still add up to the logo. */
  function buildExplode() {
    if (!strat.stack || !MARK) return;
    var nodes = MARK.nodes, groups = nodes.map(function () { return []; });
    MARK.segs.forEach(function (s) {
      var mx = (s[0] + s[2]) / 2, my = (s[1] + s[3]) / 2, best = 0, bd = Infinity;
      nodes.forEach(function (n, i) {
        var d = (n[0] - mx) * (n[0] - mx) + (n[1] - my) * (n[1] - my);
        if (d < bd) { bd = d; best = i; }
      });
      groups[best].push(s);
    });
    var html = '';
    groups.forEach(function (g, i) {
      var d = g.map(function (s) { return 'M' + s[0] + ' ' + s[1] + 'L' + s[2] + ' ' + s[3]; }).join('');
      var n = nodes[i];
      html += '<div class="plate" data-i="' + i + '"><svg viewBox="0 0 120 120">' +
        '<circle class="plate__disc" cx="60" cy="60" r="53"/>' +
        (i === groups.length - 1 ? '<circle class="plate__ring" cx="60" cy="60" r="53"/>' : '') +
        '<path class="plate__lines" d="' + d + '"/>' +
        '<circle class="plate__node" cx="' + n[0] + '" cy="' + n[1] + '" r="3.1"/></svg>' +
        '<i class="plate__anchor" style="left:' + (n[0] / 1.2).toFixed(2) + '%;top:' + (n[1] / 1.2).toFixed(2) + '%"></i></div>';
    });
    strat.stack.innerHTML = html;
    strat.plates = all('.plate', strat.stack);
    strat.anchors = all('.plate__anchor', strat.stack);
    if (strat.leads && fx) {
      var l = '';
      for (var i = 0; i < strat.plates.length; i++) l += '<path d=""/><circle r="2.4" cx="0" cy="0"/>';
      strat.leads.innerHTML = l;
      strat.lead = { paths: all('path', strat.leads), dots: all('circle', strat.leads) };
    }
  }

  function stratUpdate(p) {
    strat.rows.forEach(function (row, k) {
      setVar(row, '--b', 1 - out3(seg(p, 0.03 + k * 0.045, 0.1 + k * 0.045)));
      setVar(row, '--s', seg(p, 0.12 + k * 0.045, 0.19 + k * 0.045));
    });
    setVar(strat.el, '--xa', 1 - seg(p, 0.28, 0.34));
    setVar(strat.el, '--xb', seg(p, 0.32, 0.38));

    var f = seg(p, 0.3, 0.8), n = strat.words.length, filled = f * n, part = -1;
    for (var i = 0; i < n; i++) {
      var w = strat.words[i], o = clamp(filled - i, 0, 1);
      setVar(w.el, '--o', 0.16 + 0.84 * o);
      if (o > 0.55 && w.part >= 0) part = w.part;
    }

    var e = inOut(seg(p, 0.28, 0.44)) * (1 - inOut(seg(p, 0.87, 0.98)));
    strat.e = e;
    var gap = mobile ? 34 : 62;
    strat.plates.forEach(function (pl, i) {
      css(pl, 'transform', 'translateZ(' + ((2.5 - i) * gap * e).toFixed(2) + 'px)');
      if (pl.classList.contains('is-on') !== (i === part && e > 0.25)) pl.classList.toggle('is-on');
    });

    if (part !== strat.part) {
      strat.part = part;
      strat.parts.forEach(function (pt) { pt.el.classList.toggle('is-now', pt.i === part); });
      strat.labels.forEach(function (li, i) { li.classList.toggle('is-on', i === part); });
      text(strat.now, part >= 0 && strat.labels[part] ? strat.labels[part].textContent.replace(/^0\d/, '') : '');
    }
    strat.labels.forEach(function (li, i) { setVar(li, 'opacity', e * (i <= part ? 1 : 0.3)); });
    leadsStale = 3;
  }

  /* The callouts are placed from the plates' own anchors, read a frame
     behind the transforms that move them. */
  var leadsStale = 0;
  function drawLeads() {
    if (!strat.box || !strat.lead || mobile || !strat.plates.length) return;
    var box = strat.box.getBoundingClientRect();
    if (!box.width) return;
    var lx = box.width * 0.68, ys = [], pts = [];
    for (var i = 0; i < strat.anchors.length; i++) {
      var r = strat.anchors[i].getBoundingClientRect();
      pts.push({ x: r.left - box.left, y: r.top - box.top });
    }
    for (i = 0; i < pts.length; i++) {
      var y = pts[i].y;
      if (i && y < ys[i - 1] + 30) y = ys[i - 1] + 30;
      ys.push(y);
    }
    var show = strat.e > 0.06;
    css(strat.leads, 'opacity', '' + r3(strat.e));
    for (i = 0; i < pts.length; i++) {
      var lb = strat.labels[i];
      if (lb) css(lb, 'transform', 'translate(' + lx.toFixed(1) + 'px,' + (ys[i] - 9).toFixed(1) + 'px)');
      if (!show) continue;
      attr(strat.lead.paths[i], 'd', 'M' + pts[i].x.toFixed(1) + ' ' + pts[i].y.toFixed(1) + 'L' + (lx - 10).toFixed(1) + ' ' + ys[i].toFixed(1));
      attr(strat.lead.dots[i], 'cx', pts[i].x.toFixed(1));
      attr(strat.lead.dots[i], 'cy', pts[i].y.toFixed(1));
    }
  }

  /* =======================================================
     CH 04: the portfolio. Six dots, two weeks.
     ======================================================= */
  var port = {
    el: $('portfolio'), svg: $('portSvg'), grid: $('portGrid'), proof: $('proof'),
    counter: $('counter'), week: $('portWeek'), beats: all('#portfolio .port__beat'),
    angles: all('#portAngles li'), nodes: [], data: [], flows: []
  };

  function buildPortfolio() {
    if (!port.svg || !MARK) return;
    var d = MARK.segs.map(function (s) { return 'M' + s[0] + ' ' + s[1] + 'L' + s[2] + ' ' + s[3]; }).join('');
    var html = '<defs><radialGradient id="halo">' +
      '<stop offset="0" stop-color="#9FB0FF" stop-opacity=".95"/>' +
      '<stop offset=".4" stop-color="#7C6CFF" stop-opacity=".3"/>' +
      '<stop offset="1" stop-color="#7C6CFF" stop-opacity="0"/></radialGradient></defs>' +
      '<path class="port__lines" d="' + d + '"/>' +
      '<circle class="port__ring" cx="60" cy="60" r="53"/><g class="port__flows">';

    port.data = port.angles.map(function (li) {
      return {
        li: li, node: +li.dataset.node, to: li.dataset.to != null ? +li.dataset.to : -1,
        alloc: (li.dataset.alloc || '0,0,0').split(',').map(Number),
        b: li.querySelector('b')
      };
    });
    port.data.forEach(function (a) {
      if (a.to < 0) return;
      var from = MARK.nodes[a.node], to = MARK.nodes[a.to], dots = [];
      for (var j = 0; j < 5; j++) html += '<circle r="1.1" cx="' + from[0] + '" cy="' + from[1] + '" opacity="0"/>';
      port.flows.push({ from: from, to: to, dots: dots });
    });
    html += '</g>';
    MARK.nodes.forEach(function (n) {
      html += '<g class="pn" transform="translate(' + n[0] + ' ' + n[1] + ')">' +
        '<circle class="pn__halo" r="9" fill="url(#halo)"/>' +
        '<circle class="pn__dot" r="2.6"/>' +
        '<path class="pn__x" d="M-3.2 -3.2L3.2 3.2M3.2 -3.2L-3.2 3.2" opacity="0"/></g>';
    });
    port.svg.innerHTML = html;
    port.nodes = all('.pn', port.svg).map(function (g) {
      return { halo: g.querySelector('.pn__halo'), dot: g.querySelector('.pn__dot'), x: g.querySelector('.pn__x') };
    });
    var flowDots = all('.port__flows circle', port.svg);
    port.flows.forEach(function (f, i) { f.dots = flowDots.slice(i * 5, i * 5 + 5); });

    if (fx) {
      port.data.forEach(function (a) {
        var n = MARK.nodes[a.node];
        a.li.style.left = (n[0] / 1.2).toFixed(2) + '%';
        a.li.style.top = (n[1] / 1.2).toFixed(2) + '%';
        if (n[0] < 52) a.li.classList.add('is-left');
      });
    } else {
      renderWeek(2, 1);
    }
  }

  function renderWeek(w, flow) {
    port.data.forEach(function (a) {
      var v = w <= 1 ? lerp(a.alloc[0], a.alloc[1], w) : lerp(a.alloc[1], a.alloc[2], w - 1);
      var N = port.nodes[a.node];
      if (!N) return;
      var cut = a.to >= 0 ? seg(w, 1.4, 1.85) : 0;
      attr(N.halo, 'r', (4 + v * 0.58).toFixed(2));
      attr(N.halo, 'opacity', r3(1 - cut * 0.9));
      attr(N.dot, 'opacity', r3(1 - cut * 0.7));
      attr(N.x, 'opacity', r3(cut));
      text(a.b, Math.round(v) + '%');
      if (a.li.classList.contains('is-cut') !== (cut > 0.5)) a.li.classList.toggle('is-cut');
    });
    port.flows.forEach(function (f) {
      f.dots.forEach(function (dot, j) {
        var t = clamp(flow * 1.7 - j * 0.16, 0, 1);
        attr(dot, 'cx', lerp(f.from[0], f.to[0], t).toFixed(2));
        attr(dot, 'cy', lerp(f.from[1], f.to[1], t).toFixed(2));
        attr(dot, 'opacity', r3(t > 0 && t < 1 ? Math.sin(Math.PI * t) * 0.9 : 0));
      });
    });
    text(port.week, 'Week ' + Math.min(2, Math.floor(w + 0.002)));
  }

  function portUpdate(p) {
    var w = seg(p, 0.1, 0.62) * 2;
    renderWeek(w, seg(p, 0.34, 0.62));
    setVar(port.beats[0], '--o', 0.28 + 0.72 * (seg(w, 0.15, 0.6) * (1 - seg(w, 1.35, 1.7) * 0.6)));
    setVar(port.beats[1], '--o', 0.28 + 0.72 * seg(w, 1.3, 1.75));

    var q = inOut(seg(p, 0.66, 0.78));
    css(port.grid, 'opacity', '' + r3(1 - q));
    css(port.grid, 'transform', 'scale(' + (1 - q * 0.06).toFixed(3) + ')');
    css(port.grid, 'visibility', q > 0.99 ? 'hidden' : 'visible');
    css(port.proof, 'opacity', '' + r3(q));
    css(port.proof, 'transform', 'scale(' + (0.9 + 0.1 * q).toFixed(3) + ')');
    var n = out3(seg(p, 0.68, 0.88));
    text(port.counter, Math.round(30 * n) + '-' + Math.round(40 * n));
  }

  /* =======================================================
     CH 05: the trade, and the desk beside it
     ======================================================= */
  var trade = {
    el: $('how'), steps: all('#steps .step'), panels: all('#desk .panel'),
    odo: $('odo'), orb: $('tradeOrb'), spark: $('spark'), sparkLen: 0, step: -1, t: []
  };

  function buildTrade() {
    if (trade.spark && trade.spark.getTotalLength) {
      trade.sparkLen = trade.spark.getTotalLength();
      if (fx) {
        trade.spark.style.strokeDasharray = trade.sparkLen;
        trade.spark.style.strokeDashoffset = trade.sparkLen;
      }
    }
    if (!fx) return;
    trade.panels.forEach(function (pn, i) { renderPanel(i, 0); });
  }

  function renderPanel(i, t) {
    var pn = trade.panels[i];
    if (!pn) return;
    var k;
    if (i === 0 || i === 4) {
      var rows = all('.row', pn);
      for (k = 0; k < rows.length; k++) setVar(rows[k], '--o', clamp(t * 4 - k, 0, 1));
    } else if (i === 1) {
      var dds = all('dd', pn);
      for (k = 0; k < dds.length; k++) setVar(dds[k], '--t', clamp(t * 3 - k, 0, 1));
    } else if (i === 2) {
      all('.bars li', pn).forEach(function (li) {
        setVar(li, '--t', t);
        var b = li.querySelector('b');
        text(b, Math.round((+b.dataset.pct || 0) * t) + '%');
      });
    } else if (i === 3) {
      all('.stats b', pn).forEach(function (b) {
        text(b, Math.round((+b.dataset.to || 0) * t).toLocaleString('en-US'));
      });
    } else if (i === 5) {
      if (trade.spark) trade.spark.style.strokeDashoffset = (trade.sparkLen * (1 - t)).toFixed(1);
      var book = all('.book li', pn);
      for (k = 0; k < book.length; k++) setVar(book[k], '--o', clamp(t * 3 - k, 0, 1));
    }
  }

  function tradeUpdate(p) {
    var x = p * 6, s = Math.min(5, Math.floor(x)), local = x - s;
    if (s !== trade.step) {
      trade.step = s;
      G.node = s;
      trade.steps.forEach(function (st, i) { st.classList.toggle('is-on', i === s); });
      trade.panels.forEach(function (pn, i) {
        pn.classList.toggle('is-on', i === s);
        pn.classList.toggle('is-done', i < s);
      });
      setVar(trade.odo, '--s', s);
    }
    for (var i = 0; i < trade.panels.length; i++) {
      var t = i < s ? 1 : i > s ? 0 : out3(seg(local, 0.04, 0.72));
      if (t !== trade.t[i]) { trade.t[i] = t; renderPanel(i, t); }
    }
  }

  /* =======================================================
     CH 06: the operators, as character mosaics, and the
     refusals, as a fan of cards
     ======================================================= */
  var RAMP = ' .,:;-=+*#%@';
  var asciis = all('.ascii').map(function (pre) {
    return { pre: pre, kind: pre.dataset.kind, slot: pre.parentNode, cols: 0, rows: 0, cw: 6.6, c: null, x: null, r: fx ? 0 : 1, vis: !hasIO, seed: null, rect: null };
  });

  function sizeAscii(A) {
    var pad = 14.4, lh = 12;
    var ctx = measure();
    ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
    A.cw = ctx.measureText('M').width || 6.6;
    var w = A.slot.clientWidth - pad * 2, h = A.slot.clientHeight - pad * 2;
    if (w <= 0 || h <= 0) return;
    A.cols = Math.max(10, Math.floor(w / A.cw));
    A.rows = Math.max(6, Math.floor(h / lh));
    A.c = document.createElement('canvas');
    A.c.width = A.cols * 2; A.c.height = A.rows * 2;
    A.x = A.c.getContext('2d', { willReadFrequently: true });
    A.aspect = A.cw / lh;
    var rand = rng(4242 + A.cols);
    A.seed = new Float32Array(A.cols * A.rows);
    for (var i = 0; i < A.seed.length; i++) A.seed[i] = rand();
    A.pre.style.lineHeight = lh + 'px';
  }

  function asciiSource(A, t) {
    var x = A.x, W = A.c.width, H = A.c.height;
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    if (!MARK) return;
    var S = Math.min(W, H / A.aspect) * 0.42, cx = W / 2, cy = H / 2;
    x.lineCap = 'round';
    if (A.kind === 'globe') {
      var spin = t * 0.35, tilt = -0.3;
      var project = function (px, py) {
        var u = (px - 60) / 53, v = (py - 60) / 53, rr = Math.hypot(u, v);
        var phi = Math.min(rr, 1) * Math.PI / 2, k = rr > 1e-6 ? Math.sin(phi) / rr : 0;
        var a = u * k, b = v * k, c = Math.cos(phi);
        var cs = Math.cos(spin), sn = Math.sin(spin);
        var X = a * cs + c * sn, Z = -a * sn + c * cs;
        var Y = b * Math.cos(tilt) - Z * Math.sin(tilt);
        Z = b * Math.sin(tilt) + Z * Math.cos(tilt);
        var q = 5 / (5 - Z);
        return [cx + X * S * q, cy + Y * S * q * A.aspect, Z];
      };
      MARK.segs.forEach(function (s) {
        var a = project(s[0], s[1]), b = project(s[2], s[3]);
        var depth = ((a[2] + b[2]) / 2 + 1) / 2;
        x.strokeStyle = 'rgba(255,255,255,' + (0.12 + 0.88 * Math.pow(depth, 1.7)).toFixed(3) + ')';
        x.lineWidth = 1.7;
        x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke();
      });
      x.fillStyle = '#fff';
      MARK.nodes.forEach(function (n) {
        var q = project(n[0], n[1]);
        if (q[2] < 0) return;
        x.beginPath(); x.arc(q[0], q[1], 1.6 + q[2] * 1.6, 0, 6.2832); x.fill();
      });
    } else {
      var sweep = (t * 0.16) % 1.6 - 0.3;
      MARK.segs.forEach(function (s) {
        var ax = cx + (s[0] - 60) / 53 * S, ay = cy + (s[1] - 60) / 53 * S * A.aspect;
        var bx = cx + (s[2] - 60) / 53 * S, by = cy + (s[3] - 60) / 53 * S * A.aspect;
        var mid = ((s[0] + s[2]) / 2 - 8) / 104;
        var band = Math.exp(-(mid - sweep) * (mid - sweep) / 0.02);
        x.strokeStyle = 'rgba(255,255,255,' + (0.3 + 0.7 * band).toFixed(3) + ')';
        x.lineWidth = 1.7;
        x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
      });
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 2;
      x.beginPath(); x.ellipse(cx, cy, S, S * A.aspect, 0, 0, 6.2832); x.stroke();
      x.fillStyle = '#fff';
      MARK.nodes.forEach(function (n) {
        x.beginPath();
        x.arc(cx + (n[0] - 60) / 53 * S, cy + (n[1] - 60) / 53 * S * A.aspect, 2, 0, 6.2832);
        x.fill();
      });
    }
  }

  function renderAscii(A, t) {
    if (!A.c) return;
    asciiSource(A, t);
    var data = A.x.getImageData(0, 0, A.c.width, A.c.height).data;
    var W = A.c.width, pc = -99, pr = -99;
    if (P.on && A.rect && P.x > A.rect.left && P.x < A.rect.right && P.y > A.rect.top && P.y < A.rect.bottom) {
      pc = (P.x - A.rect.left - 14.4) / A.cw;
      pr = (P.y - A.rect.top - 14.4) / 12;
    }
    var out = '', last = RAMP.length - 1;
    for (var row = 0; row < A.rows; row++) {
      for (var col = 0; col < A.cols; col++) {
        /* sample the 2x2 block this cell covers, clamped so the last row and
           column never read past the end of the canvas */
        var x0 = col * 2, y0 = row * 2;
        var x1 = Math.min(x0 + 1, A.c.width - 1), y1 = Math.min(y0 + 1, A.c.height - 1);
        var l = (data[(y0 * W + x0) * 4] + data[(y0 * W + x1) * 4] +
                 data[(y1 * W + x0) * 4] + data[(y1 * W + x1) * 4]) / 1020;
        var ch = RAMP[Math.min(last, Math.max(0, Math.round(Math.pow(l, 0.55) * last)))];
        var s = A.seed[row * A.cols + col];
        if (s > A.r) ch = s * 13 % 1 > 0.82 ? RAMP[Math.abs((s * 977 + t * 6) | 0) % RAMP.length] : ' ';
        if (pc > -50 && Math.hypot(col - pc, (row - pr) * 1.8) < 5.5) ch = RAMP[(Math.random() * RAMP.length) | 0];
        out += ch;
      }
      out += '\n';
    }
    A.pre.textContent = out;
  }

  var wont = { el: $('wont'), cards: all('#fan .card'), band: $('wontBand'), rows: [] };
  function buildWont() {
    if (!wont.cards.length) return;
    var ROT = [-3, 4, -6, 5, -2, 7];
    wont.cards.forEach(function (c, i) {
      c.style.setProperty('--z', 10 - i);
      c.style.setProperty('--rot', ROT[i % ROT.length] + 'deg');
      c.style.setProperty('--dx', (i % 2 ? -1 : 1) * 118 + 'vw');
      c.style.setProperty('--dr', (i % 2 ? -1 : 1) * 32 + 'deg');
      c.style.setProperty('--dy', (i * 7) + 'px');
    });
    if (!wont.band || !fx) return;
    var words = wont.cards.map(function (c) { return c.querySelector('.card__t').textContent; });
    var line = words.join('     ') + '     ';
    wont.band.innerHTML = '<p class="wont__row">' + line + line + '</p><p class="wont__row">' + line + line + '</p>';
    wont.rows = all('.wont__row', wont.band);
  }
  function wontUpdate(p) {
    wont.cards.forEach(function (c, j) {
      var start = 0.05 + j * 0.145, cp = seg(p, start, start + 0.145);
      setVar(c, '--s', out3(seg(cp, 0, 0.35)));
      setVar(c, '--st', seg(cp, 0.3, 0.52));
      setVar(c, '--f', inOut(seg(cp, 0.56, 1)));
    });
    if (wont.rows.length) {
      css(wont.rows[0], 'transform', 'translateX(' + (-p * 30).toFixed(2) + '%)');
      css(wont.rows[1], 'transform', 'translateX(' + (p * 30 - 30).toFixed(2) + '%)');
    }
  }

  /* =======================================================
     CH 07: the terms. Scrolling signs the sheet.
     ======================================================= */
  var sign = { sheet: $('sheet'), path: $('sig'), cta: $('signCta'), ticks: all('#ticks li') };
  function buildSign() {
    if (sign.path && sign.path.getTotalLength) {
      var len = sign.path.getTotalLength();
      sign.path.style.setProperty('--len', len.toFixed(1));
    }
  }

  /* =======================================================
     Reveals, the chapter marker, the magnets and the letter
     shift: the page's smaller moving parts
     ======================================================= */
  var reveals = fx ? all('.rv') : [];
  var revealTop = [];
  var markers = all('[data-ch]').map(function (el) {
    return { el: el, ch: +el.dataset.ch, title: el.dataset.title || '', top: 0 };
  });
  var CHAPTERS = 7;
  var hud = $('hud'), hudCh = $('hudCh'), hudT = $('hudT'), hudBar = $('hudBar'), hudAt = -1;
  var nav = $('nav'), stuck = false;

  var magnets = (fx && fine) ? all('[data-magnet]').map(function (el) {
    return { el: el, cx: 0, cy: 0, w: 0, h: 0, mx: 0, my: 0 };
  }) : [];

  var shifts = [];
  function buildShift() {
    if (!fx || !fine) return;
    all('[data-shift]').forEach(function (h) {
      var str = h.textContent.trim();
      if (!str) return;
      var sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = str;
      var vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
      var letters = [];
      str.split(' ').forEach(function (word, wi, arr) {
        var w = document.createElement('span'); w.className = 'sh-w';
        Array.prototype.forEach.call(word, function (ch) {
          var l = document.createElement('span'); l.className = 'sh-l'; l.textContent = ch;
          w.appendChild(l); letters.push({ el: l, ox: 0, oy: 0, live: false });
        });
        vis.appendChild(w);
        if (wi < arr.length - 1) vis.appendChild(document.createTextNode(' '));
      });
      h.textContent = '';
      h.appendChild(sr); h.appendChild(vis);
      h.classList.add('sh');
      shifts.push({ el: h, letters: letters, top: 0, left: 0, bottom: 0 });
    });
  }
  function measureShift() {
    shifts.forEach(function (S) {
      S.letters.forEach(function (L) {
        L.ox = L.el.offsetLeft + L.el.offsetWidth / 2;
        L.oy = L.el.offsetTop + L.el.offsetHeight / 2;
      });
    });
  }

  /* =======================================================
     The loader
     ======================================================= */
  var loader = { el: $('loader'), n: $('loaderN'), shown: 0, t0: 0, fonts: false };
  var LOADED = 'growency.loaded';

  function startLoader() {
    var seen = false;
    try { seen = sessionStorage.getItem(LOADED) === '1'; } catch (e) {}
    if (!fx || seen || G.nogl || !loader.el) { G.loader.done = true; afterLoad(); return; }
    root.classList.add('is-loading');
    G.loader.active = true;
    loader.t0 = performance.now();
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, skipLoader, { passive: true });
    });
  }
  function skipLoader() { if (G.loader.active) G.loader.skip = true; }
  function afterLoad() { if (hud) hud.classList.add('is-on'); }

  function loaderTick(now) {
    if (!G.loader.active) return;
    var el = now - loader.t0;
    var goal = Math.min(42, el / 18);
    if (loader.fonts) goal = Math.max(goal, Math.min(70, 42 + (el - 700) / 18));
    if (G.sceneOk) goal = Math.max(goal, el > 1500 ? 100 : 93);
    if (G.sceneFail || G.loader.skip) goal = 100;
    if (el > 7000 && !G.sceneOk && !G.sceneFail) G.sceneFailed(new Error('the scene did not arrive'));

    loader.shown += (goal - loader.shown) * (G.loader.skip ? 0.4 : 0.09);
    if (goal - loader.shown < 0.4) loader.shown = goal;
    text(loader.n, pad3(Math.floor(loader.shown)));

    if (loader.shown >= 100 && G.loader.phase === 'count') {
      G.loader.phase = 'form';
      G.loader.formAt = now;
    }
    if (G.loader.phase === 'form' &&
        (G.loader.formed || !G.sceneOk || G.loader.skip || now - G.loader.formAt > 1700)) finishLoader();
  }
  function finishLoader() {
    G.loader.active = false;
    G.loader.done = true;
    G.loader.doneAt = performance.now();
    root.classList.remove('is-loading');
    try { sessionStorage.setItem(LOADED, '1'); } catch (e) {}
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
      window.removeEventListener(ev, skipLoader);
    });
    afterLoad();
  }

  function whenFonts(fn) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fn, fn);
    else fn();
  }

  /* =======================================================
     Layout, and the one loop
     ======================================================= */
  var filmAct = null, dirty = true, lastY = -1, asciiAt = 0;

  function relayout() {
    vw = window.innerWidth; vh = window.innerHeight;
    mobile = vw <= 900;
    G.vw = vw; G.vh = vh; G.mobile = mobile;
    docH = document.documentElement.scrollHeight;
    acts.forEach(function (a) {
      a.sh = a.stage ? a.stage.offsetHeight : vh;
      if (a.lenOf) a.len = a.lenOf();
      a.p = -1;
    });
    measureShift();
    computeTarget();
    asciis.forEach(function (A) { sizeAscii(A); if (!fx) renderAscii(A, 0); });
    if (G.sceneOk) buildKnock();
    dirty = true;
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    dirty = true;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(relayout, 140);
  }, { passive: true });
  window.addEventListener('orientationchange', function () { setTimeout(relayout, 300); }, { passive: true });

  function frame(now) {
    var y = window.scrollY || window.pageYOffset || 0;
    var moved = y !== lastY || dirty;

    if (moved) {
      lastY = y; dirty = false;

      /* read */
      var i, a, r;
      for (i = 0; i < acts.length; i++) {
        a = acts[i];
        r = a.el.getBoundingClientRect();
        a.top = r.top; a.h = r.height;
        if (a.anchor) a.rect = a.anchor.getBoundingClientRect();
      }
      for (i = 0; i < reveals.length; i++) revealTop[i] = reveals[i].getBoundingClientRect().top;
      for (i = 0; i < markers.length; i++) markers[i].top = markers[i].el.getBoundingClientRect().top;
      for (i = 0; i < magnets.length; i++) {
        r = magnets[i].el.getBoundingClientRect();
        magnets[i].cx = r.left + r.width / 2 - magnets[i].mx;
        magnets[i].cy = r.top + r.height / 2 - magnets[i].my;
        magnets[i].w = r.width; magnets[i].h = r.height;
      }
      for (i = 0; i < shifts.length; i++) {
        r = shifts[i].el.getBoundingClientRect();
        shifts[i].left = r.left; shifts[i].top = r.top; shifts[i].bottom = r.bottom;
      }
      for (i = 0; i < asciis.length; i++) asciis[i].rect = asciis[i].slot.getBoundingClientRect();

      /* write */
      for (i = 0; i < acts.length; i++) {
        a = acts[i];
        var p = progressOf(a);
        if (p !== a.p) { a.p = p; if (a.update) a.update(p, a); }
      }
      for (i = 0; i < reveals.length; i++) setVar(reveals[i], '--r', clamp((vh * 0.92 - revealTop[i]) / (vh * 0.3), 0, 1));
      for (i = 0; i < asciis.length; i++) {
        var A = asciis[i];
        if (A.rect) A.r = clamp((vh * 0.95 - A.rect.top) / (vh * 0.55), 0, 1);
      }
      writeHud();
      pickScene();
      if (nav) {
        var want = y > 8;
        if (want !== stuck) { stuck = want; nav.classList.toggle('is-stuck', want); }
      }
    }

    if (leadsStale > 0) { leadsStale--; drawLeads(); }
    pointerTick();
    if (fx) {
      for (var j = 0; j < asciis.length; j++) {
        var Q = asciis[j];
        if (Q.vis && Q.c && now - asciiAt > 55) renderAscii(Q, now / 1000);
      }
      if (now - asciiAt > 55) asciiAt = now;
    }
    loaderTick(now);
    P.moved = false;
    requestAnimationFrame(frame);
  }

  function writeHud() {
    if (!hud || !markers.length) return;
    var line = vh * 0.5, cur = 0;
    for (var i = 0; i < markers.length; i++) if (markers[i].top <= line) cur = i;
    var m = markers[cur], next = markers[cur + 1];
    var span = next ? next.top - m.top : Math.max(1, docH - lastY - m.top - vh * 0.5);
    if (cur !== hudAt) {
      hudAt = cur;
      text(hudCh, 'Ch 0' + m.ch + ' / 0' + CHAPTERS);
      text(hudT, m.title);
    }
    css(hudBar, 'transform', 'scaleX(' + clamp((line - m.top) / Math.max(1, span), 0, 1).toFixed(3) + ')');
  }

  function pickScene() {
    var line = vh * 0.5, pick = null;
    for (var i = 0; i < acts.length; i++) if (acts[i].scene && acts[i].top <= line) pick = acts[i];
    if (!pick) { for (i = 0; i < acts.length; i++) if (acts[i].scene) { pick = acts[i]; break; } }
    if (!pick) return;
    G.scene.name = pick.scene;
    G.scene.p = pick.p;
    if (pick.rect && pick.rect.width) {
      G.anchor = G.anchor || {};
      G.anchor.x = pick.rect.left + pick.rect.width / 2;
      G.anchor.y = pick.rect.top + pick.rect.height / 2;
      G.anchor.r = pick.rect.width / 2;
    } else G.anchor = null;
  }

  function pointerTick() {
    if (!magnets.length && !shifts.length) return;
    var i, j;
    for (i = 0; i < magnets.length; i++) {
      var M = magnets[i], tx = 0, ty = 0;
      if (P.on && M.w) {
        var dx = P.x - M.cx, dy = P.y - M.cy;
        var reach = Math.max(M.w, M.h) * 0.5 + 54;
        if (Math.hypot(dx, dy) < reach) { tx = dx * 0.3; ty = dy * 0.4; }
      }
      M.mx += (tx - M.mx) * 0.2; M.my += (ty - M.my) * 0.2;
      if (Math.abs(M.mx) < 0.04 && !tx) M.mx = 0;
      if (Math.abs(M.my) < 0.04 && !ty) M.my = 0;
      css(M.el, 'transform', 'translate3d(' + M.mx.toFixed(2) + 'px,' + M.my.toFixed(2) + 'px,0)');
    }
    if (!P.moved) return;
    for (i = 0; i < shifts.length; i++) {
      var S = shifts[i];
      var near = P.on && S.bottom > -40 && S.top < vh + 40;
      for (j = 0; j < S.letters.length; j++) {
        var L = S.letters[j];
        if (!near) {
          if (L.live) { L.live = false; setVar(L.el, '--lx', 0); setVar(L.el, '--ly', 0); setVar(L.el, '--lg', 0); }
          continue;
        }
        var ddx = S.left + L.ox - P.x, ddy = S.top + L.oy - P.y;
        var d = Math.hypot(ddx, ddy), R = 115;
        if (d > R) {
          if (L.live) { L.live = false; setVar(L.el, '--lx', 0); setVar(L.el, '--ly', 0); setVar(L.el, '--lg', 0); }
          continue;
        }
        var f = 1 - d / R; f *= f;
        L.live = true;
        setVar(L.el, '--lx', ddx / (d || 1) * f * 9);
        setVar(L.el, '--ly', ddy / (d || 1) * f * 9);
        setVar(L.el, '--lg', f);
      }
    }
  }

  /* =======================================================
     Build, register, go
     ======================================================= */
  buildNoise();
  buildFill();
  buildExplode();
  buildPortfolio();
  buildTrade();
  buildWont();
  buildSign();
  buildShift();
  letterCopy();

  filmAct = act(film.sec, { mode: 'pin', scene: 'film', update: fx ? filmUpdate : null });
  act($('alpha'), { mode: 'pin', scene: 'strat', update: fx ? stratUpdate : null });
  act($('portfolio'), { mode: 'pin', scene: 'port', update: fx ? portUpdate : null });
  act($('how'), { mode: 'pin', scene: 'life', update: fx ? tradeUpdate : null, anchor: trade.orb });
  act($('operators'), { mode: 'pass', scene: 'ops' });
  act($('wont'), { mode: 'pin', scene: 'wont', update: fx ? wontUpdate : null });
  act($('pilot'), { mode: 'pass', scene: 'pilot' });
  act($('contact'), { mode: 'pass', scene: 'final', anchor: $('medallion') });
  if (fx) {
    act(sign.sheet, {
      mode: 'enter',
      lenOf: function () { return sign.sheet ? sign.sheet.offsetHeight * 0.9 : vh * 0.6; },
      update: function (p) {
        setVar(sign.path, '--sd', inOut(seg(p, 0.08, 0.8)));
        setVar(sign.cta, '--co', seg(p, 0.76, 1));
      }
    });
    act($('ticks'), {
      mode: 'enter',
      lenOf: function () { return vh * 0.45; },
      update: function (p) {
        sign.ticks.forEach(function (li, k) { setVar(li, '--t', out3(seg(p, k * 0.12, k * 0.12 + 0.4))); });
      }
    });
  }

  if (hasIO) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        asciis.forEach(function (A) { if (A.slot === e.target) A.vis = e.isIntersecting; });
      });
    }, { rootMargin: '120px' });
    asciis.forEach(function (A) { io.observe(A.slot); });
  }

  whenFonts(function () { loader.fonts = true; relayout(); });
  relayout();
  startLoader();
  requestAnimationFrame(frame);
})();
