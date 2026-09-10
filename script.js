/* =========================================================
   Growency
   No dependencies. The page reads correctly with this file
   missing: reveals fall back to visible, redactions to open,
   the letter to its finished state, and the intro overlay
   never appears at all.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  requestAnimationFrame(function () { document.body.classList.add('is-loaded'); });

  /* =======================================================
     The intro
     The mark assembles out of loose particles on a canvas,
     the lattice draws between them, the ring closes, and the
     whole thing lifts away. The page is fully rendered
     underneath the entire time.
     ======================================================= */
  function intro(done) {
    var wrap = document.getElementById('intro');
    var canvas = document.getElementById('introCanvas');
    var symbol = document.querySelector('#mark path');

    /* every reason to skip it: no support, reduced motion, already seen
       this session, or the markup is not what we expect */
    var seen = false;
    try { seen = sessionStorage.getItem('growency:intro') === '1'; } catch (e) {}
    if (!wrap || !canvas || !symbol || reduced || seen || !canvas.getContext) {
      if (wrap) wrap.remove();
      done();
      return;
    }

    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1;

    /* the lattice is read straight off the logo, so the animation and the
       mark can never drift apart */
    var segs = [];
    var d = symbol.getAttribute('d') || '';
    var re = /M([\d.]+)\s+([\d.]+)L([\d.]+)\s+([\d.]+)/g, m;
    while ((m = re.exec(d))) {
      segs.push([+m[1], +m[2], +m[3], +m[4]]);
    }
    if (segs.length < 8) { wrap.remove(); done(); return; }

    var vmap = {}, verts = [];
    segs.forEach(function (s) {
      [[s[0], s[1]], [s[2], s[3]]].forEach(function (p) {
        var k = p[0].toFixed(1) + ',' + p[1].toFixed(1);
        if (vmap[k] === undefined) { vmap[k] = verts.length; verts.push({ x: p[0], y: p[1] }); }
      });
    });

    var CX = 60, CY = 60;
    function radius(p) { return Math.hypot(p.x - CX, p.y - CY); }
    var maxR = 54;

    /* particles start scattered and are pulled home. the ones nearest the
       centre arrive first, so the mark grows outward. */
    var parts = verts.map(function (v) {
      var a = Math.random() * Math.PI * 2;
      var far = 0.7 + Math.random() * 1.1;
      return {
        tx: v.x, ty: v.y,
        x: CX + Math.cos(a) * 190 * far,
        y: CY + Math.sin(a) * 190 * far,
        delay: (radius(v) / maxR) * 0.3 + Math.random() * 0.07,
        px: 0, py: 0
      };
    });

    /* loose dust that never lands, for depth */
    var dust = [];
    for (var i = 0; i < 90; i++) {
      dust.push({
        x: (Math.random() - 0.5) * 460, y: (Math.random() - 0.5) * 460,
        r: Math.random() * 1.3 + 0.3,
        vx: (Math.random() - 0.5) * 0.16, vy: (Math.random() - 0.5) * 0.16,
        a: Math.random() * 0.4 + 0.08
      });
    }

    segs.forEach(function (s) {
      var mid = { x: (s[0] + s[2]) / 2, y: (s[1] + s[3]) / 2 };
      s.delay = (radius(mid) / maxR) * 0.34;
    });

    var scale = 1, ox = 0, oy = 0;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth; H = wrap.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.min(W, H) * 0.46 / 120;
      ox = W / 2 - CX * scale; oy = H / 2 - CY * scale;
    }
    size();
    window.addEventListener('resize', size, { passive: true });

    var mx = -9999, my = -9999;
    wrap.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    wrap.addEventListener('mouseleave', function () { mx = my = -9999; }, { passive: true });

    function X(v) { return ox + v * scale; }
    function Y(v) { return oy + v * scale; }
    var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

    var DUR = 3400;
    var start = null, raf = null, finished = false;

    function draw(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / DUR, 1);
      ctx.clearRect(0, 0, W, H);

      /* dust drifts throughout and fades out at the end */
      var dustFade = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
      ctx.fillStyle = '#6E8BFF';
      dust.forEach(function (p) {
        p.x += p.vx; p.y += p.vy;
        ctx.globalAlpha = p.a * dustFade * Math.min(t / 0.12, 1);
        ctx.beginPath();
        ctx.arc(X(CX + p.x * 0.42), Y(CY + p.y * 0.42), p.r, 0, 6.284);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      /* particles home in on their vertex, then get nudged by the pointer */
      parts.forEach(function (p) {
        var lt = (t - p.delay) / 0.42;
        var k = easeOut(Math.max(0, Math.min(lt, 1)));
        var bx = p.x + (p.tx - p.x) * k;
        var by = p.y + (p.ty - p.y) * k;
        var sx = X(bx), sy = Y(by);
        if (mx > -9998) {
          var dx = sx - mx, dy = sy - my, dist = Math.hypot(dx, dy);
          if (dist < 150 && dist > 0.01) {
            var push = (1 - dist / 150) * 26;
            sx += (dx / dist) * push; sy += (dy / dist) * push;
          }
        }
        p.px = sx; p.py = sy;
      });

      /* the lattice draws between particles that have landed */
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      segs.forEach(function (s) {
        var lt = (t - 0.26 - s.delay) / 0.4;
        if (lt <= 0) return;
        var k = easeOut(Math.min(lt, 1));
        var a = parts[vmap[s[0].toFixed(1) + ',' + s[1].toFixed(1)]];
        var b = parts[vmap[s[2].toFixed(1) + ',' + s[3].toFixed(1)]];
        if (!a || !b) return;
        ctx.globalAlpha = 0.8 * k;
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(a.px + (b.px - a.px) * k, a.py + (b.py - a.py) * k);
        ctx.stroke();
      });

      /* the nodes themselves */
      ctx.globalAlpha = 1;
      parts.forEach(function (p, i) {
        var lt = (t - p.delay) / 0.42;
        if (lt <= 0) return;
        var k = easeOut(Math.min(lt, 1));
        var big = i % 11 === 0;
        ctx.fillStyle = big ? '#FFFFFF' : '#6E8BFF';
        ctx.globalAlpha = big ? k : k * 0.75;
        ctx.beginPath();
        ctx.arc(p.px, p.py, (big ? 3.1 : 1.5) * scale * (0.5 + k * 0.5), 0, 6.284);
        ctx.fill();
      });

      /* the ring closes last */
      var rt = (t - 0.58) / 0.34;
      if (rt > 0) {
        var rk = easeOut(Math.min(rt, 1));
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = Math.max(1.4, 3 * scale);
        ctx.beginPath();
        ctx.arc(X(CX), Y(CY), 53 * scale, -Math.PI / 2, -Math.PI / 2 + 6.284 * rk);
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
    wrap.classList.add('is-live');
    raf = requestAnimationFrame(draw);

    ['click', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, finish, { once: true, passive: true });
    });
    /* a belt-and-braces release, so a stalled frame loop can never leave
       the page locked behind an overlay */
    setTimeout(finish, DUR + 2500);
  }

  /* =======================================================
     The hero letter
     ======================================================= */
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

    var TYPE = 17, CYCLE = 0, token = 0, timers = [], playing = false;

    function at(ms, fn) {
      var t = token;
      timers.push(setTimeout(function () { if (t === token) fn(); }, ms));
    }

    /* `host` carries the caret: the line for a body line, the element
       itself for the subject */
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
      parts.forEach(function (p) {
        p.el.classList.remove('is-cut', 'is-new', 'is-typing');
        p.gen.textContent = '';
      });
      if (subject) { subject.classList.remove('is-typing'); subject.textContent = ''; }
    }

    function pass() {
      reset();
      var t = 260;
      if (subject) t = type(subject, subject, subjGen, t) + 180;
      parts.forEach(function (p) { t = type(p.gen, p.el, p.generic, t) + 120; });

      t += 900;  /* let the generic version sit before it comes apart */
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
      at(t, function () {
        el.classList.remove('is-fading');
        timers = [];
        pass();
      });

      if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '0%';
        at(40, function () {
          bar.style.transition = 'width ' + (CYCLE - 40) + 'ms linear';
          bar.style.width = '100%';
        });
      }
    }

    function play() { if (playing) return; playing = true; token++; pass(); }
    function stop() {
      if (!playing) return;
      playing = false; token++;
      timers.forEach(clearTimeout); timers = [];
    }

    if (hasIO) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? play() : stop();
      }, { threshold: 0.2 }).observe(el);
    } else {
      play();
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : play();
    });
  }

  /* =======================================================
     Nav
     ======================================================= */
  (function navState() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var queued = false;
    function draw() { queued = false; nav.classList.toggle('is-stuck', window.scrollY > 20); }
    function onScroll() { if (queued) return; queued = true; requestAnimationFrame(draw); }
    draw();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* =======================================================
     Reveals, redactions, strike-outs, the figure, the rail
     ======================================================= */
  function reveals() {
    var items = document.querySelectorAll('.reveal');
    if (reduced || !hasIO) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  (function redactions() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.rd'));
    if (!rows.length) return;
    if (reduced || !hasIO) {
      rows.forEach(function (r) { r.classList.add('is-open'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        rows.forEach(function (row, i) {
          setTimeout(function () { row.classList.add('is-open'); }, i * 260);
        });
      });
    }, { threshold: 0.5 });
    io.observe(rows[0].parentNode);
  })();

  (function strikes() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.strike'));
    if (!rows.length) return;
    if (reduced || !hasIO) {
      rows.forEach(function (r) { r.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var i = rows.indexOf(e.target);
        setTimeout(function () { e.target.classList.add('is-in'); }, Math.max(0, i % 3) * 130);
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.6 });
    rows.forEach(function (r) { io.observe(r); });
  })();

  (function figure() {
    var el = document.querySelector('.counter');
    if (!el) return;
    var to = parseFloat(el.dataset.to || '40');
    var prefix = el.dataset.prefix || '';
    function run() {
      if (reduced) { el.textContent = prefix + to; return; }
      var start = null, dur = 1600;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        el.textContent = prefix + Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!hasIO) { run(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        run();
      });
    }, { threshold: 0.6 });
    io.observe(el);
  })();

  (function rail() {
    var fill = document.getElementById('railFill');
    var steps = document.querySelector('.steps');
    if (!fill || !steps) return;
    var queued = false;
    function draw() {
      queued = false;
      var r = steps.getBoundingClientRect();
      var p = (window.innerHeight * 0.5 - r.top) / r.height;
      fill.style.height = (Math.max(0, Math.min(p, 1)) * 100).toFixed(1) + '%';
    }
    function onScroll() { if (queued) return; queued = true; requestAnimationFrame(draw); }
    draw();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  })();

  /* the hero holds until the intro lifts, so its entrance is not spent
     behind the overlay */
  intro(function () {
    reveals();
    letter();
  });
})();
