/* =========================================================
   Growency
   No dependencies. Everything degrades to a readable page.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('nav');
  var rail = document.getElementById('rail');
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  var railItems = Array.prototype.slice.call(document.querySelectorAll('.rail__item'));

  /* ---------- footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- hero line drawing ---------- */
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

  /* ---------- nav: solid on scroll, inverted over dark sections ---------- */
  (function navState() {
    var onScroll = function () {
      nav.classList.toggle('is-solid', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var darkSections = document.querySelectorAll('.method, .results, .final, .footer');
    if (!('IntersectionObserver' in window)) return;
    var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 76;
    var live = [];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = live.indexOf(e.target);
        if (e.isIntersecting && i === -1) live.push(e.target);
        if (!e.isIntersecting && i > -1) live.splice(i, 1);
      });
      nav.classList.toggle('is-dark', live.length > 0);
    }, { rootMargin: '-' + (navH - 2) + 'px 0px -100% 0px' });
    Array.prototype.forEach.call(darkSections, function (s) { io.observe(s); });
  })();

  /* ---------- reveal on scroll ---------- */
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

  /* ---------- count-up numerals ---------- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var to = parseFloat(el.dataset.to);
    var dec = parseInt(el.dataset.decimals || '0', 10);
    var suffix = el.dataset.suffix || '';
    if (reduced) { el.textContent = to.toFixed(dec) + suffix; return; }
    var dur = 1400, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * eased).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  (function statCounters() {
    var counters = document.querySelectorAll('.results .counter');
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(counters, countUp);
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

  /* ---------- panel I: the dot field ---------- */
  (function dotField() {
    var host = document.getElementById('viz-dots');
    if (!host) return;
    var total = 60, keep = { 7: 1, 13: 1, 24: 1, 31: 1, 38: 1, 46: 1, 53: 1 };
    var frag = document.createDocumentFragment();
    for (var i = 0; i < total; i++) {
      var d = document.createElement('i');
      if (keep[i]) d.className = 'keep';
      d.style.transitionDelay = (keep[i] ? 420 : Math.round((i % 11) * 42)) + 'ms';
      frag.appendChild(d);
    }
    host.appendChild(frag);
  })();

  /* ---------- panel III: the drafted line ---------- */
  function typeLine(el) {
    if (el.dataset.typed) return;
    el.dataset.typed = '1';
    var text = el.textContent.trim();
    if (reduced) return;
    el.textContent = '';
    var i = 0;
    (function tick() {
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, 34);
    })();
  }

  /* ---------- panels: active state, rail sync, per-panel triggers ---------- */
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
      var line = panel.querySelector('.w-type');
      if (line) typeLine(line);
      Array.prototype.forEach.call(panel.querySelectorAll('.counter'), countUp);
    }

    if (!('IntersectionObserver' in window)) {
      panels.forEach(function (p) { p.classList.add('is-active'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) activate(e.target);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    panels.forEach(function (p) { io.observe(p); });

    /* rail shows only while the walkthrough owns the screen */
    var deck = document.getElementById('panels');
    if (deck && rail) {
      var railIO = new IntersectionObserver(function (entries) {
        rail.classList.toggle('is-visible', entries[0].isIntersecting);
      }, { rootMargin: '-30% 0px -30% 0px', threshold: 0 });
      railIO.observe(deck);
    }

    railItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var target = document.getElementById('step-' + item.dataset.step);
        if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      });
    });
  })();
})();
