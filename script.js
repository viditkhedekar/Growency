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
     The hero letter
     A template types itself in, then three phrases are struck
     out and replaced with specifics. The specific text is what
     sits in the markup, so with JS off, or under reduced
     motion, the finished letter is what shows.
     ======================================================= */
  (function heroLetter() {
    requestAnimationFrame(function () { document.body.classList.add('is-loaded'); });

    var letter = document.getElementById('letter');
    if (!letter || reduced) return;

    var subject = letter.querySelector('.letter__subject');
    var lines = Array.prototype.slice.call(letter.querySelectorAll('.ln'));
    var bar = letter.querySelector('.letter__bar i');
    if (!lines.length) return;

    /* split every line into its two faces. a data-hold line has no
       template version, so both faces carry the same words and it is
       never struck out. */
    var parts = lines.map(function (ln) {
      var spec = ln.dataset.specific || ln.textContent.trim();
      var gen = ln.dataset.generic || spec;
      ln.textContent = '';
      var g = document.createElement('span');
      g.className = 'gen';
      var sp = document.createElement('span');
      sp.className = 'spec';
      sp.textContent = spec;
      ln.appendChild(g);
      ln.appendChild(sp);
      return { el: ln, gen: g, generic: gen, rewrites: !ln.dataset.hold };
    });

    var subjGen = subject ? (subject.dataset.generic || '') : '';
    var subjSpec = subject ? (subject.dataset.specific || subject.textContent.trim()) : '';
    if (subject) subject.textContent = '';

    var TYPE = 17;      /* ms per character */
    var CYCLE = 0;      /* filled in once we know how long a pass takes */
    var token = 0;      /* bumped to abandon an in-flight pass */
    var timers = [];
    var playing = false;

    function clear() {
      timers.forEach(clearTimeout);
      timers = [];
    }
    function at(ms, fn) {
      var t = token;
      timers.push(setTimeout(function () { if (t === token) fn(); }, ms));
    }

    /* type a string into a node one character at a time, and report back
       how long it will take so the next beat can be scheduled. `host` is
       what carries the caret, which is the line for a body line and the
       element itself for the subject. */
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
      if (subject) {
        subject.classList.remove('is-typing');
        subject.textContent = '';
      }
    }

    function pass() {
      reset();
      var t = 260;

      if (subject) t = type(subject, subject, subjGen, t) + 180;
      parts.forEach(function (p) {
        t = type(p.gen, p.el, p.generic, t) + 120;
      });

      /* the template is now complete and generic. let it sit for a
         beat so the reader registers it before it comes apart. */
      t += 900;

      if (subject) {
        (function (start) {
          at(start, function () { if (subject) subject.textContent = subjSpec; });
        })(t);
      }

      parts.filter(function (p) { return p.rewrites; }).forEach(function (p) {
        (function (start) {
          at(start, function () { p.el.classList.add('is-cut'); });
          at(start + 420, function () { p.el.classList.add('is-new'); });
        })(t);
        t += 700;
      });

      t += 2800;                 /* hold on the finished letter */
      CYCLE = t;
      at(t, pass);               /* and round again */

      if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '0%';
        at(40, function () {
          bar.style.transition = 'width ' + (CYCLE - 40) + 'ms linear';
          bar.style.width = '100%';
        });
      }
    }

    function play() {
      if (playing) return;
      playing = true;
      token++;
      pass();
    }
    function stop() {
      if (!playing) return;
      playing = false;
      token++;
      clear();
    }

    /* it only runs while somebody can see it */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? play() : stop();
      }, { threshold: 0.25 }).observe(letter);
    } else {
      play();
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : play();
    });
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
  /* =======================================================
     The funnel in the margin
     One number that falls a stage at a time as the reader
     moves through the six steps, so the list is being cut
     while the page explains how the cutting works.
     ======================================================= */
  (function funnel() {
    var box = document.getElementById('funnel');
    var num = document.getElementById('funnelNum');
    var stage = document.getElementById('funnelStage');
    if (!box || !num || !stage || !('IntersectionObserver' in window)) return;

    /* index 0 is the raw list; 1 to 6 line up with the walkthrough steps */
    var STAGES = [
      [2940, 'Raw list'],
      [1420, 'Fits the ICP'],
      [610, 'Verified'],
      [340, 'Written for'],
      [236, 'Sending clean'],
      [118, 'In sequence'],
      [118, 'Measured']
    ];
    var shown = -1;

    function set(i) {
      i = Math.max(0, Math.min(i, STAGES.length - 1));
      if (i === shown) return;
      shown = i;
      num.textContent = STAGES[i][0].toLocaleString('en-US');
      stage.textContent = STAGES[i][1];
      box.classList.remove('is-drop');
      /* restart the drop animation rather than waiting it out */
      void box.offsetWidth;
      box.classList.add('is-drop');
    }
    set(0);

    /* it appears once the hero is behind us and leaves before the footer */
    var hero = document.getElementById('top');
    var final = document.getElementById('contact');
    function review() {
      var past = hero ? hero.getBoundingClientRect().bottom < window.innerHeight * 0.4 : true;
      var done = final ? final.getBoundingClientRect().top < window.innerHeight * 0.7 : false;
      box.classList.toggle('is-live', past && !done);
    }
    review();
    window.addEventListener('scroll', review, { passive: true });
    window.addEventListener('resize', review, { passive: true });

    /* each panel that reaches the middle of the screen advances a stage */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) set(parseInt(e.target.dataset.step, 10));
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    panels.forEach(function (p) { io.observe(p); });

    /* the number sits over ivory and forest by turns, so it has to flip */
    var darks = Array.prototype.slice.call(document.querySelectorAll(darkSel));
    function tint() {
      var r = box.getBoundingClientRect();
      var y = r.top + r.height / 2;
      var over = darks.some(function (d) {
        var b = d.getBoundingClientRect();
        return b.top < y && b.bottom > y;
      });
      box.classList.toggle('on-dark', over);
    }
    tint();
    window.addEventListener('scroll', tint, { passive: true });
    window.addEventListener('resize', tint, { passive: true });
  })();

  /* =======================================================
     The ink
     The accent floods out of the wordmark dot as the method
     section arrives. The origin is measured from the real
     mark so the two are actually connected.
     ======================================================= */
  (function ink() {
    var method = document.querySelector('.method');
    if (!method || reduced || !('IntersectionObserver' in window)) return;

    function origin() {
      var dot = document.querySelector('.nav .wordmark__dot');
      if (!dot) return;
      var d = dot.getBoundingClientRect();
      var m = method.getBoundingClientRect();
      if (!m.height) return;
      method.style.setProperty('--ink-x', (((d.left + d.width / 2) - m.left) / m.width * 100).toFixed(2) + '%');
      method.style.setProperty('--ink-y', (((d.top + d.height / 2) - m.top) / m.height * 100).toFixed(2) + '%');
    }

    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        origin();
        method.classList.add('is-inked');
      });
    }, { rootMargin: '0px 0px -25% 0px', threshold: 0 }).observe(method);
  })();

  /* =======================================================
     The deck spine
     A single line down all six steps, filling with progress,
     so the walkthrough reads as one continuous run rather
     than six separate screens.
     ======================================================= */
  (function spine() {
    var fill = document.getElementById('deckFill');
    var deck = document.getElementById('panels');
    if (!fill || !deck) return;

    var queued = false;
    function draw() {
      queued = false;
      var r = deck.getBoundingClientRect();
      var mid = window.innerHeight * 0.5;
      var p = (mid - r.top) / r.height;
      fill.style.height = (Math.max(0, Math.min(p, 1)) * 100).toFixed(2) + '%';
    }
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  })();

})();
