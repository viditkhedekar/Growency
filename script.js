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
   the pinned strategy and the dotted wordmark only exist
   under `.fx`, which is added here and only when motion is
   welcome.
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
    /* the network joining the dots is not part of the lattice, so it is read
       separately and added, and the scene, plates and mosaics all draw it */
    var net = document.querySelector('#mark .mark__net');
    if (net) {
      var pts = (net.getAttribute('d') || '').match(/-?[\d.]+/g) || [];
      for (var k = 0; k + 3 < pts.length; k += 2) segs.push([+pts[k], +pts[k + 1], +pts[k + 2], +pts[k + 3]]);
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
    /* the wordmark as dots: sample positions relative to the hero, where the
       hero sits on screen, and how far it has scrolled away */
    hero: { pts: null, n: 0, ver: 0, left: 0, top: 0, out: 0, formAt: 0 },
    scene: { name: 'film', p: 0 },
    anchor: null,
    node: -1,
    pointer: { x: 0, y: 0, nx: 0, ny: 0, on: false, moved: false },
    loader: { active: false, phase: 'count', formAt: 0, formed: false, skip: false, done: false, doneAt: 0 },
    sceneOk: false, sceneFail: false,
    sceneReady: function () {
      if (G.sceneOk || G.sceneFail) return;
      G.sceneOk = true;
      root.classList.add('gl-on');
      whenFonts(buildDots);
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
    if (cursor) cursor.aim(e.target && e.target.closest ? e.target.closest('a,button,[data-cursor]') : null);
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
      stage: el.querySelector('.act__stage'),
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
     CH 01: the wordmark as a field of dots. The letters are
     drawn offscreen at .word's own layout and sampled on a
     jittered grid, so CSS still owns the type; scene.js draws
     a dot at every sample and gathers them in.
     ======================================================= */
  var hero = { sec: $('top'), el: $('hero'), word: $('word'), stamp: $('stamp') };

  function buildDots() {
    if (!fx || !G.sceneOk || !hero.el || !hero.word) return;
    var W = hero.el.clientWidth, H = hero.el.clientHeight;
    var spans = all('span', hero.word), blEl = hero.word.querySelector('.word__bl');
    if (!W || !H || !spans.length || !blEl) return;
    var box = hero.el.getBoundingClientRect();
    var cs = getComputedStyle(hero.word);
    var F = parseFloat(cs.fontSize);

    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.font = (cs.fontWeight || '800') + ' ' + F + 'px ' + cs.fontFamily;
    x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';

    /* the baseline marker sits on the last row, and the letters stack in rows
       (GROW over ENCY, or two to a row on phones), so each glyph's baseline is
       that same distance below its own top */
    var bl = blEl.getBoundingClientRect().top - box.top;
    var lastTop = spans[spans.length - 1].getBoundingClientRect().top;
    var minX = Infinity, maxX = -Infinity;
    spans.forEach(function (sp) {
      var r = sp.getBoundingClientRect();
      x.fillText(sp.textContent, r.left - box.left, bl + r.top - lastTop);
      minX = Math.min(minX, r.left - box.left);
      maxX = Math.max(maxX, r.right - box.left);
    });

    var data = x.getImageData(0, 0, W, H).data, ink = 0, gx, gy;
    for (gy = 0; gy < H; gy += 2) for (gx = 0; gx < W; gx += 2) if (data[(gy * W + gx) * 4 + 3] > 128) ink += 4;
    if (!ink) return;
    /* spacing chosen for a steady dot count whatever the type size */
    var gap = Math.max(2.4, Math.sqrt(ink / (mobile ? 4200 : 10500)));
    var rand = rng(20260916), out = [];
    for (gy = gap / 2; gy < H; gy += gap) {
      for (gx = gap / 2; gx < W; gx += gap) {
        var px = gx + (rand() - 0.5) * gap * 0.7, py = gy + (rand() - 0.5) * gap * 0.7;
        var ix = clamp(px | 0, 0, W - 1), iy = clamp(py | 0, 0, H - 1);
        if (data[(iy * W + ix) * 4 + 3] > 128) out.push(px, py, (px - minX) / Math.max(1, maxX - minX));
      }
    }
    G.hero.pts = new Float32Array(out);
    G.hero.n = out.length / 3;
    G.hero.gap = gap;
    G.hero.ver++;
    root.classList.add('dots-on');
    dirty = true;
  }

  /* The stamp is pressed across the Y of the wordmark, so it is measured
     from the Y's own box rather than positioned by hand. */
  function placeStamp() {
    var st = hero.stamp;
    if (!st || !hero.word || !hero.el) return;
    var spans = all('span', hero.word);
    var y = spans[spans.length - 1];
    if (!y) return;
    var box = hero.el.getBoundingClientRect(), yb = y.getBoundingClientRect();
    if (!yb.width) return;
    var F = parseFloat(getComputedStyle(hero.word).fontSize) || 100;
    st.style.fontSize = Math.max(12, F * 0.165).toFixed(1) + 'px';
    var first = spans[0].getBoundingClientRect(), hx, hy;
    if (yb.top - first.top > 1) {
      /* stacked (two rows on wide screens, four on phones): pressed across
         the middle of the stack instead */
      var right = 0;
      spans.forEach(function (sp) { right = Math.max(right, sp.getBoundingClientRect().right); });
      hx = (first.left + right) / 2 - box.left; hy = (first.top + yb.bottom) / 2 - box.top;
    } else {
      hx = yb.left + yb.width / 2 - box.left; hy = yb.top + yb.height * 0.54 - box.top;
    }
    css(st, 'left', hx.toFixed(1) + 'px');
    css(st, 'top', hy.toFixed(1) + 'px');
  }

  /* =======================================================
     CH 02: the emails. Each one can be copied as plain text.
     ======================================================= */
  function letterCopy(el) {
    var btn = el.querySelector('.letter__copy');
    if (!btn) return;
    var subj = el.querySelector('.letter__subj');
    var subject = subj ? subj.textContent.trim() : '';
    var body = all('.ln', el).map(function (ln) { return ln.textContent.trim(); }).join('\n\n');
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
     CH 04: the portfolio, as it stands after week two
     ======================================================= */
  var port = {
    svg: $('portSvg'), list: $('portAngles'),
    angles: all('#portAngles li'), nodes: [], data: [], flows: []
  };

  function buildPortfolio() {
    if (!port.svg || !MARK) return;
    var d = MARK.segs.map(function (s) { return 'M' + s[0] + ' ' + s[1] + 'L' + s[2] + ' ' + s[3]; }).join('');
    var html = '<defs><radialGradient id="halo">' +
      '<stop offset="0" stop-color="#8FCBFF" stop-opacity=".95"/>' +
      '<stop offset=".4" stop-color="#5250E8" stop-opacity=".35"/>' +
      '<stop offset="1" stop-color="#5028BE" stop-opacity="0"/></radialGradient></defs>' +
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

    port.data.forEach(function (a) {
      var n = MARK.nodes[a.node];
      a.li.style.left = (n[0] / 1.2).toFixed(2) + '%';
      a.li.style.top = (n[1] / 1.2).toFixed(2) + '%';
      if (n[0] < 52) a.li.classList.add('is-left');
    });
    if (port.list) port.list.classList.add('is-placed');
    renderWeek(2, 1);
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
  }

  /* =======================================================
     CH 05: the trade. Each step opens a card with the detail:
     on hover or focus with a mouse, on tap on touch screens.
     The globe beside it lights the matching node.
     ======================================================= */
  var steps = all('#steps .step');
  function openStep(st) {
    steps.forEach(function (o) {
      var on = o === st;
      if (o.classList.contains('is-open') === on) return;
      o.classList.toggle('is-open', on);
      var b = o.querySelector('.step__btn');
      if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    G.node = st ? +st.dataset.i : -1;
  }
  function buildSteps() {
    steps.forEach(function (st) {
      var btn = st.querySelector('.step__btn');
      if (fine) {
        st.addEventListener('mouseenter', function () { openStep(st); });
        st.addEventListener('mouseleave', function () { if (st.classList.contains('is-open')) openStep(null); });
        st.addEventListener('focusin', function () { openStep(st); });
        st.addEventListener('focusout', function (e) { if (!st.contains(e.relatedTarget)) openStep(null); });
      }
      if (btn) btn.addEventListener('click', function () {
        if (!fine) openStep(st.classList.contains('is-open') ? null : st);
      });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openStep(null); });
  }

  /* =======================================================
     CH 06: the operators, as character mosaics
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
     Reveals, the chapter marker, the rail, the magnets and the
     letter shift: the page's smaller moving parts
     ======================================================= */
  var reveals = fx ? all('.rv') : [];
  var revealTop = [];
  var markers = all('[data-ch]').map(function (el) {
    return { el: el, ch: +el.dataset.ch, title: el.dataset.title || '', top: 0 };
  });
  var CHAPTERS = 7;
  var hud = $('hud'), hudCh = $('hudCh'), hudT = $('hudT'), hudBar = $('hudBar'), hudAt = -1;
  var rail = all('#rail a').map(function (a) {
    return { a: a, el: document.querySelector(a.getAttribute('href')), top: 0, h: 0 };
  }).filter(function (r) { return r.el; });
  var railAt = -1;
  var nav = $('nav'), stuck = false;

  var magnets = (fx && fine) ? all('[data-magnet]').map(function (el) {
    return { el: el, cx: 0, cy: 0, w: 0, h: 0, mx: 0, my: 0 };
  }) : [];

  /* A dot that follows the pointer and opens into a circle over anything you
     can act on, naming the action where there is a word for it. Fine pointers
     only, and never under reduced motion, which is also why the native cursor
     is only hidden under `.has-cursor`. */
  var cursor = (function () {
    var el = $('cursor');
    if (!el || !fx || !fine) return null;
    var label = el.querySelector('.cursor__label');
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2, hot = null, shown = null;
    root.classList.add('has-cursor');
    window.addEventListener('pointerdown', function () { el.classList.add('is-down'); }, { passive: true });
    window.addEventListener('pointerup', function () { el.classList.remove('is-down'); }, { passive: true });
    return {
      aim: function (target) {
        if (target === hot) return;
        hot = target;
        var word = target && target.getAttribute ? target.getAttribute('data-cursor') : null;
        el.classList.toggle('is-hot', !!word);
        el.classList.toggle('is-warm', !!target && !word);
        /* the near-white buttons need the dark version of it */
        el.classList.toggle('is-light', !!(target && target.closest && target.closest('.btn--solid,.skip')));
        text(label, word || '');
      },
      tick: function () {
        if (P.on !== shown) { shown = P.on; css(el, 'opacity', P.on ? '1' : '0'); }
        cx += (P.x - cx) * 0.22;
        cy += (P.y - cy) * 0.22;
        css(el, 'transform', 'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)');
      }
    };
  })();

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
  var dirty = true, lastY = -1, asciiAt = 0;

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
    placeStamp();
    asciis.forEach(function (A) { sizeAscii(A); if (!fx) renderAscii(A, 0); });
    if (G.sceneOk) buildDots();
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
      for (i = 0; i < rail.length; i++) {
        r = rail[i].el.getBoundingClientRect();
        rail[i].top = r.top; rail[i].h = r.height;
      }
      if (hero.el) {
        r = hero.el.getBoundingClientRect();
        G.hero.left = r.left; G.hero.top = r.top;
        G.hero.out = clamp(-r.top / Math.max(1, r.height * 0.75), 0, 1);
      }
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
      writeRail();
      pickScene();
      if (nav) {
        var want = y > 8;
        if (want !== stuck) { stuck = want; nav.classList.toggle('is-stuck', want); }
      }
    }

    if (leadsStale > 0) { leadsStale--; drawLeads(); }
    pointerTick();
    if (fx) {
      /* the mosaics are a text rebuild per frame, so phones redraw them less often */
      var every = mobile ? 120 : 55;
      for (var j = 0; j < asciis.length; j++) {
        var Q = asciis[j];
        if (Q.vis && Q.c && now - asciiAt > every) renderAscii(Q, now / 1000);
      }
      if (now - asciiAt > every) asciiAt = now;
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

  /* The rail lights the section under the upper part of the screen, and
     fills its line with how far through that section you are. */
  function writeRail() {
    if (!rail.length) return;
    var line = vh * 0.4, cur = 0;
    for (var i = 0; i < rail.length; i++) if (rail[i].top <= line) cur = i;
    if (lastY + vh >= docH - 4) cur = rail.length - 1;
    if (cur !== railAt) {
      if (railAt >= 0) rail[railAt].a.removeAttribute('aria-current');
      rail[cur].a.setAttribute('aria-current', 'location');
      railAt = cur;
    }
    var R = rail[cur];
    setVar(R.a, '--p', lastY + vh >= docH - 4 ? 1 : clamp((line - R.top) / Math.max(1, R.h), 0, 1));
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
    if (cursor) cursor.tick();
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
  buildFill();
  buildExplode();
  buildPortfolio();
  buildSteps();
  buildSign();
  buildShift();
  all('.letter').forEach(letterCopy);

  act(hero.sec, { mode: 'pass', scene: 'film' });
  act($('emails'), { mode: 'pass', scene: 'mail' });
  act($('alpha'), { mode: 'pin', scene: 'strat', update: fx ? stratUpdate : null });
  act($('portfolio'), { mode: 'pass', scene: 'port' });
  act($('how'), { mode: 'pass', scene: 'life', anchor: $('tradeOrb') });
  act($('operators'), { mode: 'pass', scene: 'ops' });
  act($('wont'), { mode: 'pass', scene: 'wont' });
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
