/* =========================================================
   Growency
   No dependencies. Everything degrades to a readable page.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var nav = document.getElementById('nav');
  var rail = document.getElementById('rail');
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  var railItems = Array.prototype.slice.call(document.querySelectorAll('.rail__item'));
  var darkSel = '.method, .results, .final, .footer';

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* =======================================================
     Smooth scroll: a weighted glide that eases to a stop,
     with a soft pull onto the nearest walkthrough panel.
     Native scrolling stays in charge on touch and when the
     visitor asks for reduced motion.
     ======================================================= */
  var Scroll = (function () {
    var on = false;
    var target = window.scrollY;
    var current = target;
    var raf = null;
    var wheelTimer = null;
    var lerp = 0.115;

    function limit() {
      return Math.max(0, root.scrollHeight - window.innerHeight);
    }
    function clamp(v) {
      return Math.max(0, Math.min(v, limit()));
    }
    function tick() {
      var d = target - current;
      if (Math.abs(d) < 0.4) {
        current = target;
        window.scrollTo(0, current);
        raf = null;
        return;
      }
      current += d * lerp;
      window.scrollTo(0, current);
      raf = requestAnimationFrame(tick);
    }
    function run() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    /* soft snap: once the wheel goes quiet, if a panel edge is
       close enough, drift onto it rather than resting off centre */
    function settle() {
      if (!panels.length) return;
      var reach = window.innerHeight * 0.42;
      var best = null, dist = Infinity;
      panels.forEach(function (p) {
        if (p.classList.contains('panel--last')) return;
        var top = p.getBoundingClientRect().top + current;
        var d = Math.abs(top - target);
        if (d < dist) { dist = d; best = top; }
      });
      if (best !== null && dist < reach && dist > 1) {
        target = clamp(best);
        lerp = 0.085;
        run();
        setTimeout(function () { lerp = 0.115; }, 700);
      }
    }

    function onWheel(e) {
      if (e.ctrlKey) return;
      var unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight * 0.9 : 1;
      e.preventDefault();
      target = clamp(target + e.deltaY * unit);
      run();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(settle, 170);
    }

    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
      var vh = window.innerHeight;
      var step = null;
      switch (e.key) {
        case 'ArrowDown': step = 110; break;
        case 'ArrowUp': step = -110; break;
        case 'PageDown': step = vh * 0.9; break;
        case 'PageUp': step = -vh * 0.9; break;
        case 'Home': step = -limit(); break;
        case 'End': step = limit(); break;
        case ' ':
          if (e.target.closest && e.target.closest('a, button')) return;
          step = e.shiftKey ? -vh * 0.9 : vh * 0.9;
          break;
        default: return;
      }
      e.preventDefault();
      target = clamp(target + step);
      run();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(settle, 220);
    }

    function sync() {
      if (raf) return;
      target = current = window.scrollY;
    }

    function to(y) {
      y = clamp(y);
      if (!on) {
        window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
        return;
      }
      clearTimeout(wheelTimer);
      target = y;
      run();
    }

    function enable() {
      if (on) return;
      on = true;
      target = current = window.scrollY;
      root.classList.add('js-scroll');
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('keydown', onKey);
      window.addEventListener('scroll', sync, { passive: true });
    }
    function disable() {
      if (!on) return;
      on = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      root.classList.remove('js-scroll');
      window.removeEventListener('wheel', onWheel, { passive: false });
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', sync, { passive: true });
    }

    /* the glide is a pointer-and-room-for-it feature, so it can come
       and go as the window is resized */
    function review() {
      if (fine && !reduced && window.innerWidth > 900) { enable(); } else { disable(); }
      target = clamp(target);
    }

    on = false;
    review();
    window.addEventListener('resize', review, { passive: true });

    return { to: to, get enabled() { return on; } };
  })();

  /* anchors and the rail both go through the same glide */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    var el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    var navH = parseInt(getComputedStyle(root).getPropertyValue('--nav-h'), 10) || 76;
    var top = el.getBoundingClientRect().top + window.scrollY;
    Scroll.to(el.classList.contains('panel') ? top : top - navH);
  });

  /* =======================================================
     Custom cursor: a dot that grows and names the action
     ======================================================= */
  (function customCursor() {
    var el = document.querySelector('.cursor');
    if (!el || !fine || reduced) return;
    var label = el.querySelector('.cursor__label');
    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    var cx = x, cy = y, moved = false, hot = null;

    root.classList.add('has-cursor');

    window.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY; moved = true;
      var t = e.target.closest ? e.target.closest('[data-cursor], a, button') : null;
      if (t !== hot) {
        hot = t;
        var word = t && t.getAttribute('data-cursor');
        el.classList.toggle('is-hot', !!word);
        el.classList.toggle('is-warm', !!t && !word);
        label.textContent = word || '';
      }
      /* the dot has to read against whatever sits under it, so a
         solid button flips it back the other way */
      var under = document.elementFromPoint(e.clientX, e.clientY);
      var dark = !!(under && under.closest && under.closest(darkSel));
      if (t && t.classList.contains('btn--fill')) dark = !dark;
      el.classList.toggle('is-dark', dark);
    }, { passive: true });

    window.addEventListener('mousedown', function () { el.classList.add('is-down'); });
    window.addEventListener('mouseup', function () { el.classList.remove('is-down'); });
    document.addEventListener('mouseleave', function () { el.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { el.style.opacity = ''; });

    (function follow() {
      cx += (x - cx) * 0.24;
      cy += (y - cy) * 0.24;
      if (moved) el.style.transform = 'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)';
      requestAnimationFrame(follow);
    })();
  })();

  /* =======================================================
     Hero line drawing
     ======================================================= */
  (function heroArt() {
    var shapes = document.querySelectorAll('.signal__draw path, .signal__draw rect');
    Array.prototype.forEach.call(shapes, function (s) {
      var len = 700;
      try { len = Math.ceil(s.getTotalLength()); } catch (e) {}
      s.style.setProperty('--len', len);
      s.style.strokeDasharray = len;
      s.style.strokeDashoffset = reduced ? 0 : len;
    });
    requestAnimationFrame(function () { document.body.classList.add('is-loaded'); });
  })();

  /* =======================================================
     Nav: solid on scroll, inverted over the dark sections
     ======================================================= */
  (function navState() {
    var onScroll = function () { nav.classList.toggle('is-solid', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!('IntersectionObserver' in window)) return;
    var navH = parseInt(getComputedStyle(root).getPropertyValue('--nav-h'), 10) || 76;
    var live = [];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = live.indexOf(e.target);
        if (e.isIntersecting && i === -1) live.push(e.target);
        if (!e.isIntersecting && i > -1) live.splice(i, 1);
      });
      nav.classList.toggle('is-dark', live.length > 0);
    }, { rootMargin: '-' + (navH - 2) + 'px 0px -100% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll(darkSel), function (s) { io.observe(s); });
  })();

  /* =======================================================
     Reveal on scroll
     ======================================================= */
  (function reveals() {
    var items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  })();

  /* =======================================================
     Count-up numerals
     ======================================================= */
  function countUp(el, force) {
    if (el.dataset.running === '1') return;
    if (el.dataset.done === '1' && !force) return;
    el.dataset.done = '1';
    el.dataset.running = '1';
    var to = parseFloat(el.dataset.to);
    var dec = parseInt(el.dataset.decimals || '0', 10);
    var suffix = el.dataset.suffix || '';
    if (reduced) {
      el.textContent = to.toFixed(dec) + suffix;
      el.dataset.running = '0';
      return;
    }
    var dur = 1400, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * eased).toFixed(dec) + suffix;
      if (p < 1) { requestAnimationFrame(step); } else { el.dataset.running = '0'; }
    }
    requestAnimationFrame(step);
  }

  (function statCounters() {
    var counters = document.querySelectorAll('.results .counter');
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(counters, function (c) { countUp(c); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countUp(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(counters, function (el) { io.observe(el); });
  })();

  /* =======================================================
     The product mocks
     ======================================================= */
  var frames = Array.prototype.slice.call(document.querySelectorAll('.frame'));
  var LOOP = (parseFloat(getComputedStyle(root).getPropertyValue('--loop')) || 9) * 1000;

  /* each mock is built at a fixed design width and scaled to whatever
     room the panel gives it, so the interface keeps real proportions */
  function fitFrames() {
    frames.forEach(function (f) {
      var app = f.querySelector('.app');
      if (!app) return;
      var design = parseFloat(getComputedStyle(app).getPropertyValue('--aw')) || 760;
      var w = f.clientWidth;
      if (w) app.style.setProperty('--s', (w / design).toFixed(4));
    });
  }
  fitFrames();
  window.addEventListener('resize', fitFrames, { passive: true });
  window.addEventListener('load', fitFrames);

  /* numbers re-run with each pass of the clip, on the beat the
     interface would actually produce them */
  function runClipCounters(frame) {
    Array.prototype.forEach.call(frame.querySelectorAll('.counter'), function (c) {
      var at = parseFloat(c.dataset.at || '0');
      if (!at) { countUp(c, true); return; }
      clearTimeout(c._t);
      c._t = setTimeout(function () { countUp(c, true); }, LOOP * at / 100);
    });
  }
  frames.forEach(function (f) {
    var bar = f.querySelector('.playbar i');
    if (bar) bar.addEventListener('animationiteration', function () { runClipCounters(f); });
  });

  /* =======================================================
     Walkthrough: active panel, rail sync, clip playback
     ======================================================= */
  (function walkthrough() {
    if (!panels.length) return;

    function activate(panel) {
      var step = parseInt(panel.dataset.step, 10);
      panels.forEach(function (p) { p.classList.toggle('is-active', p === panel); });
      railItems.forEach(function (item) {
        var n = parseInt(item.dataset.step, 10);
        item.classList.toggle('is-active', n === step);
        item.classList.toggle('is-past', n < step);
        item.setAttribute('aria-current', n === step ? 'true' : 'false');
      });
      var frame = panel.querySelector('.frame');
      if (frame) runClipCounters(frame);
    }

    if (!('IntersectionObserver' in window)) {
      panels.forEach(function (p) { p.classList.add('is-active'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) activate(e.target); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    panels.forEach(function (p) { io.observe(p); });

    var deck = document.getElementById('panels');
    if (deck && rail) {
      var railIO = new IntersectionObserver(function (entries) {
        rail.classList.toggle('is-visible', entries[0].isIntersecting);
      }, { rootMargin: '-30% 0px -30% 0px', threshold: 0 });
      railIO.observe(deck);
    }

    railItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var t = document.getElementById('step-' + item.dataset.step);
        if (t) Scroll.to(t.getBoundingClientRect().top + window.scrollY);
      });
    });
  })();
})();
