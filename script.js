/* =========================================================
   Growency
   No dependencies. With this file missing the page is fully
   readable: the hidden reveal states and redaction bars only
   exist once <html> has the `js` class, the letter sits in
   its finished state, and the intro overlay never appears.
   No window scroll listeners: everything scroll-related is
   driven by IntersectionObserver.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function token(name, fallback) {
    var v = getComputedStyle(root).getPropertyValue(name).trim();
    return v || fallback;
  }

  /* =======================================================
     The mark's geometry, read once from the logo itself so
     the intro, the hero globe and the logo never drift apart.
     The lattice runs past the circle and the SVG clips it,
     so the path carries negative coordinates.
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
    var nodes = Array.prototype.slice.call(document.querySelectorAll('#mark circle'))
      .filter(function (c) { return +c.getAttribute('r') < 10; })
      .map(function (c) { return [+c.getAttribute('cx'), +c.getAttribute('cy')]; });
    return segs.length > 8 ? { segs: segs, nodes: nodes, CLIP: CLIP, CX: CX, CY: CY, rad: rad } : null;
  })();

  /* =======================================================
     Nav: a sentinel near the top of the document tells us
     when the page has moved, without a scroll listener.
     ======================================================= */
  (function navState() {
    var nav = document.getElementById('nav');
    var sentinel = document.getElementById('sentinel');
    if (!nav) return;
    if (!hasIO || !sentinel) { nav.classList.add('is-stuck'); return; }
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }).observe(sentinel);
  })();

  /* =======================================================
     The intro
     ======================================================= */
  function intro(done) {
    var wrap = document.getElementById('intro');
    var canvas = document.getElementById('introCanvas');
    var seen = false;
    try { seen = sessionStorage.getItem('growency:intro') === '1'; } catch (e) {}
    if (!wrap || !canvas || !MARK || reduced || seen || !canvas.getContext) {
      if (wrap) wrap.remove();
      done();
      return;
    }

    var ctx = canvas.getContext('2d');
    var CX = MARK.CX, CY = MARK.CY, rad = MARK.rad, maxR = MARK.CLIP;
    var strong = token('--lattice-strong', '#fff');
    var accent = token('--accent', '#7C93FF');

    var vmap = {}, verts = [];
    MARK.segs.forEach(function (s) {
      [[s[0], s[1]], [s[2], s[3]]].forEach(function (p) {
        var k = p[0].toFixed(1) + ',' + p[1].toFixed(1);
        if (vmap[k] === undefined) { vmap[k] = verts.length; verts.push({ x: p[0], y: p[1] }); }
      });
    });
    var segs = MARK.segs.map(function (s) {
      return { s: s, delay: (rad((s[0] + s[2]) / 2, (s[1] + s[3]) / 2) / maxR) * 0.34 };
    });

    /* particles start scattered; the centre lands first so it grows outward */
    var parts = verts.map(function (v) {
      var a = Math.random() * Math.PI * 2, far = 0.7 + Math.random() * 1.1;
      return {
        tx: v.x, ty: v.y,
        x: CX + Math.cos(a) * 190 * far, y: CY + Math.sin(a) * 190 * far,
        delay: (rad(v.x, v.y) / maxR) * 0.3 + Math.random() * 0.07, px: 0, py: 0
      };
    });

    /* show it before measuring: a display:none element measures 0 */
    wrap.classList.add('is-live');

    var W = 0, H = 0, scale = 1, ox = 0, oy = 0;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth; H = wrap.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.min(W, H) * 0.44 / 120;
      ox = W / 2 - CX * scale; oy = H / 2 - CY * scale;
    }
    size();
    window.addEventListener('resize', size, { passive: true });

    function X(v) { return ox + v * scale; }
    function Y(v) { return oy + v * scale; }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    var DUR = 3200, start = null, raf = null, finished = false;

    function draw(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / DUR, 1);
      ctx.clearRect(0, 0, W, H);

      parts.forEach(function (p) {
        var k = easeOut(Math.max(0, Math.min((t - p.delay) / 0.42, 1)));
        p.px = X(p.x + (p.tx - p.x) * k);
        p.py = Y(p.y + (p.ty - p.y) * k);
      });

      ctx.lineCap = 'round';
      ctx.strokeStyle = strong;
      ctx.lineWidth = Math.max(1, 1.3 * scale);
      segs.forEach(function (g) {
        var lt = (t - 0.26 - g.delay) / 0.4;
        if (lt <= 0) return;
        var k = easeOut(Math.min(lt, 1)), s = g.s;
        var a = parts[vmap[s[0].toFixed(1) + ',' + s[1].toFixed(1)]];
        var b = parts[vmap[s[2].toFixed(1) + ',' + s[3].toFixed(1)]];
        ctx.globalAlpha = 0.75 * k;
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(a.px + (b.px - a.px) * k, a.py + (b.py - a.py) * k);
        ctx.stroke();
      });

      ctx.fillStyle = accent;
      parts.forEach(function (p) {
        var lt = (t - p.delay) / 0.42;
        if (lt <= 0) return;
        ctx.globalAlpha = easeOut(Math.min(lt, 1)) * 0.8;
        ctx.beginPath();
        ctx.arc(p.px, p.py, 1.4 * scale, 0, 6.2832);
        ctx.fill();
      });

      var rt = (t - 0.58) / 0.34;
      if (rt > 0) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = strong;
        ctx.lineWidth = Math.max(1.4, 2.6 * scale);
        ctx.beginPath();
        ctx.arc(X(CX), Y(CY), 53 * scale, -Math.PI / 2, -Math.PI / 2 + 6.2832 * easeOut(Math.min(rt, 1)));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (t < 1) { raf = requestAnimationFrame(draw); } else { finish(); }
    }

    function finish() {
      if (finished) return;
      finished = true;
      if (raf) cancelAnimationFrame(raf);
      try { sessionStorage.setItem('growency:intro', '1'); } catch (e) {}
      wrap.classList.add('is-gone');
      root.classList.remove('intro-lock');
      done();
      setTimeout(function () { if (wrap.parentNode) wrap.remove(); }, 1000);
    }

    root.classList.add('intro-lock');
    raf = requestAnimationFrame(draw);
    ['click', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, finish, { once: true, passive: true });
    });
    /* a stalled frame loop can never leave the page locked */
    setTimeout(finish, DUR + 2500);
  }

  /* =======================================================
     The hero globe
     The logo's lattice wrapped onto a sphere: each point on
     the flat mark is mapped to a hemisphere, mirrored for the
     back, and the ring becomes the equator. It turns slowly,
     tilts toward the pointer, dims with depth, and stops
     drawing whenever the hero is off screen.
     ======================================================= */
  function heroGlobe() {
    var c = document.getElementById('heroLattice');
    var hero = document.getElementById('top');
    if (!c || !hero || !MARK || !c.getContext) return;
    var ctx = c.getContext('2d');

    var R = 53;
    function sphere(x, y) {
      var u = (x - 60) / R, v = (y - 60) / R, r = Math.hypot(u, v);
      var phi = Math.min(r, 1) * Math.PI / 2;
      var k = r > 1e-6 ? Math.sin(phi) / r : 0;
      return [u * k, v * k, Math.cos(phi)];
    }

    /* each flat segment is split so it curves over the sphere */
    var lines = [];
    MARK.segs.forEach(function (s) {
      var prev = sphere(s[0], s[1]);
      for (var i = 1; i <= 4; i++) {
        var f = i / 4;
        var p = sphere(s[0] + (s[2] - s[0]) * f, s[1] + (s[3] - s[1]) * f);
        lines.push([prev, p]);
        lines.push([[prev[0], prev[1], -prev[2]], [p[0], p[1], -p[2]]]);
        prev = p;
      }
    });
    var ring = [];
    for (var i = 0; i <= 128; i++) {
      var a = i / 128 * Math.PI * 2;
      ring.push([Math.cos(a), Math.sin(a), 0]);
    }
    var nodes = MARK.nodes.map(function (n) { return sphere(n[0], n[1]); });

    var rgb, alpha, accent;
    function readColours() {
      rgb = token('--lattice-rgb', '150,168,255');
      alpha = parseFloat(token('--lattice-alpha', '.5')) || 0.5;
      accent = token('--accent', '#7C93FF');
    }
    readColours();

    var W = 0, H = 0, S = 1;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c.clientWidth; H = c.clientHeight;
      if (!W || !H) return;
      c.width = W * dpr; c.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      S = Math.min(W, H) * 0.4;
    }

    var spin = 0.6, tiltX = -0.32, tiltY = 0, aimX = -0.32, aimY = 0;
    var D = 3.4;
    function project(p) {
      var cy = Math.cos(spin + tiltY), sy = Math.sin(spin + tiltY);
      var x = p[0] * cy + p[2] * sy;
      var z = -p[0] * sy + p[2] * cy;
      var cx = Math.cos(tiltX), sx = Math.sin(tiltX);
      var y = p[1] * cx - z * sx;
      z = p[1] * sx + z * cx;
      var k = D / (D - z);
      return [W / 2 + x * S * k, H / 2 + y * S * k, z];
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      ctx.lineWidth = 1;
      for (var i = 0; i < lines.length; i++) {
        var a = project(lines[i][0]), b = project(lines[i][1]);
        var depth = ((a[2] + b[2]) / 2 + 1) / 2;
        ctx.strokeStyle = 'rgba(' + rgb + ',' + (alpha * (0.1 + 0.9 * Math.pow(depth, 1.6))).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (alpha * 0.95).toFixed(3) + ')';
      ctx.beginPath();
      ring.forEach(function (p, j) {
        var q = project(p);
        if (j) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]);
      });
      ctx.stroke();
      ctx.fillStyle = accent;
      nodes.forEach(function (n) {
        var q = project(n);
        if (q[2] < 0) return;
        ctx.globalAlpha = 0.35 + 0.65 * q[2];
        ctx.beginPath(); ctx.arc(q[0], q[1], 2.4 + q[2] * 1.4, 0, 6.2832); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    size();
    c.classList.add('is-on');
    window.addEventListener('resize', function () { size(); draw(); }, { passive: true });
    var scheme = window.matchMedia('(prefers-color-scheme: dark)');
    var onScheme = function () { readColours(); draw(); };
    if (scheme.addEventListener) scheme.addEventListener('change', onScheme);

    /* reduced motion: one still frame, no loop */
    if (reduced) { draw(); return; }

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      aimY = ((e.clientX - r.left) / r.width - 0.5) * 0.7;
      aimX = -0.32 + ((e.clientY - r.top) / r.height - 0.5) * 0.5;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { aimX = -0.32; aimY = 0; }, { passive: true });

    var visible = true, raf = null;
    function tick() {
      raf = null;
      spin += 0.0021;
      tiltX += (aimX - tiltX) * 0.05;
      tiltY += (aimY - tiltY) * 0.05;
      draw();
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    }
    function wake() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick); }
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        wake();
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', wake);
    wake();
  }

  /* =======================================================
     The letter, and its Copy button
     ======================================================= */
  function letterCopy() {
    var el = document.getElementById('letter');
    var btn = document.getElementById('letterCopy');
    if (!el || !btn) return;
    /* read the finished email before the animation takes the lines apart */
    var subj = el.querySelector('.letter__subj');
    var subject = subj ? (subj.dataset.specific || subj.textContent.trim()) : '';
    var body = Array.prototype.slice.call(el.querySelectorAll('.ln')).map(function (ln) {
      return ln.dataset.specific || ln.textContent.trim();
    }).join('\n\n');
    var text = 'Subject: ' + subject + '\n\n' + body;

    btn.hidden = false;
    var label = btn.textContent, reset = null;
    function done() {
      btn.textContent = 'Copied';
      btn.classList.add('is-done');
      clearTimeout(reset);
      reset = setTimeout(function () { btn.textContent = label; btn.classList.remove('is-done'); }, 1800);
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    }
    btn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    });
  }

  function letter() {
    var el = document.getElementById('letter');
    if (!el || reduced) return;
    var subject = el.querySelector('.letter__subj');
    var lines = Array.prototype.slice.call(el.querySelectorAll('.ln'));
    var bar = el.querySelector('.letter__bar i');
    if (!lines.length) return;

    var parts = lines.map(function (ln) {
      var spec = ln.dataset.specific || ln.textContent.trim();
      var gen = ln.dataset.generic || spec;
      ln.textContent = '';
      var g = document.createElement('span'); g.className = 'gen';
      var sp = document.createElement('span'); sp.className = 'spec'; sp.textContent = spec;
      ln.appendChild(g); ln.appendChild(sp);
      return { el: ln, gen: g, generic: gen, rewrites: !ln.dataset.hold };
    });
    var subjGen = subject ? (subject.dataset.generic || '') : '';
    var subjSpec = subject ? (subject.dataset.specific || subject.textContent.trim()) : '';
    if (subject) subject.textContent = '';

    var TYPE = 17, CYCLE = 0, tokenN = 0, timers = [], playing = false;
    function at(ms, fn) {
      var t = tokenN;
      timers.push(setTimeout(function () { if (t === tokenN) fn(); }, ms));
    }
    /* `host` carries the caret: the line for body lines, the element itself for the subject */
    function type(node, host, text, from) {
      at(from, function () { host.classList.add('is-typing'); });
      for (var i = 1; i <= text.length; i++) {
        (function (n) {
          at(from + n * TYPE, function () {
            node.textContent = text.slice(0, n);
            if (n === text.length) host.classList.remove('is-typing');
          });
        })(i);
      }
      return from + text.length * TYPE;
    }
    function reset() {
      parts.forEach(function (p) { p.el.classList.remove('is-cut', 'is-new', 'is-typing'); p.gen.textContent = ''; });
      if (subject) { subject.classList.remove('is-typing'); subject.textContent = ''; }
    }
    function pass() {
      reset();
      var t = 260;
      if (subject) t = type(subject, subject, subjGen, t) + 180;
      parts.forEach(function (p) { t = type(p.gen, p.el, p.generic, t) + 120; });
      t += 900;
      if (subject) { (function (s) { at(s, function () { subject.textContent = subjSpec; }); })(t); }
      parts.filter(function (p) { return p.rewrites; }).forEach(function (p) {
        (function (s) {
          at(s, function () { p.el.classList.add('is-cut'); });
          at(s + 420, function () { p.el.classList.add('is-new'); });
        })(t);
        t += 700;
      });
      t += 4200;  /* the finished letter is the point, so it holds longest */
      at(t, function () { el.classList.add('is-fading'); });
      t += 420;
      CYCLE = t;
      at(t, function () { el.classList.remove('is-fading'); timers = []; pass(); });
      if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '0%';
        at(40, function () {
          bar.style.transition = 'width ' + (CYCLE - 40) + 'ms linear';
          bar.style.width = '100%';
        });
      }
    }
    function play() { if (playing) return; playing = true; tokenN++; pass(); }
    function stop() { if (!playing) return; playing = false; tokenN++; timers.forEach(clearTimeout); timers = []; }

    if (hasIO) {
      new IntersectionObserver(function (entries) { entries[0].isIntersecting ? play() : stop(); }, { threshold: 0.2 }).observe(el);
    } else {
      play();
    }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });
  }

  /* =======================================================
     Reveals, redactions, strike-outs, the figure, the rail
     ======================================================= */
  function showAll(list, cls) { list.forEach(function (el) { el.classList.add(cls); }); }

  function reveals() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (reduced || !hasIO) { showAll(items, 'is-in'); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  (function redactions() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.rd'));
    if (!rows.length) return;
    if (reduced || !hasIO) { showAll(rows, 'is-open'); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        rows.forEach(function (row, i) { setTimeout(function () { row.classList.add('is-open'); }, i * 260); });
      });
    }, { threshold: 0.5 });
    io.observe(rows[0].parentNode);
  })();

  (function strikes() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.strike'));
    if (!rows.length) return;
    if (reduced || !hasIO) { showAll(rows, 'is-in'); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var i = rows.indexOf(e.target);
        setTimeout(function () { e.target.classList.add('is-in'); }, (i % 2) * 140 + 200);
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0.6 });
    rows.forEach(function (r) { io.observe(r); });
  })();

  (function figure() {
    var el = document.querySelector('.counter');
    if (!el) return;
    var to = parseFloat(el.dataset.to || '40'), prefix = el.dataset.prefix || '';
    function run() {
      if (reduced) { el.textContent = prefix + to; return; }
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / 1600, 1);
        el.textContent = prefix + Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!hasIO) { run(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); run(); } });
    }, { threshold: 0.6 });
    io.observe(el);
  })();

  /* the codes beside the lifecycle light up as each step crosses the middle */
  (function lifecycle() {
    var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
    var codes = Array.prototype.slice.call(document.querySelectorAll('.codes li'));
    var fill = document.getElementById('codesFill');
    if (!steps.length || !codes.length) return;
    function set(i) {
      codes.forEach(function (c, j) {
        c.classList.toggle('is-on', j === i);
        c.classList.toggle('is-past', j < i);
      });
      if (fill && codes[i]) fill.style.height = (codes[i].offsetTop + codes[i].offsetHeight) + 'px';
    }
    if (!hasIO) { set(codes.length - 1); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) set(+e.target.dataset.i); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(function (s) { io.observe(s); });
  })();

  letterCopy();

  /* the hero holds until the intro lifts, so its entrance is not spent behind it */
  intro(function () {
    reveals();
    letter();
    heroGlobe();
  });
})();
