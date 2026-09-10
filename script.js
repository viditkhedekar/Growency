/* =========================================================
   Growency
   No dependencies. The page reads correctly with this file
   missing: reveals fall back to visible, redactions to open.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* the stamp lands on load rather than fading in */
  requestAnimationFrame(function () { document.body.classList.add('is-loaded'); });

  /* nav gains a ground once the hero starts moving past */
  (function navState() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var queued = false;
    function draw() { queued = false; nav.classList.toggle('is-stuck', window.scrollY > 20); }
    function onScroll() { if (queued) return; queued = true; requestAnimationFrame(draw); }
    draw();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  var hasIO = 'IntersectionObserver' in window;

  /* ---------- reveal on scroll ---------- */
  (function reveals() {
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
  })();

  /* ---------- the redactions ----------
     Bars retract one after another, then the word underneath is
     struck out. Staggered so it reads as someone going down the
     list rather than the whole block flipping at once. */
  (function redactions() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.rd'));
    if (!rows.length) return;
    if (reduced || !hasIO) {
      rows.forEach(function (r) { r.classList.add('is-open'); });
      return;
    }
    var list = rows[0].parentNode;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        rows.forEach(function (row, i) {
          setTimeout(function () { row.classList.add('is-open'); }, i * 260);
        });
      });
    }, { threshold: 0.5 });
    io.observe(list);
  })();

  /* ---------- the strike-outs ----------
     Same idea on the dark panel, one line at a time. */
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

  /* ---------- the figure ----------
     Counts the top of the range up. The prefix stays put so the
     number reads as a range rather than a single measurement. */
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
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(to * eased);
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

  /* ---------- the lifecycle rail ----------
     Fills as the six steps pass the middle of the screen. */
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
})();
