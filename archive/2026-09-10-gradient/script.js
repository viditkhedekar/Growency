/* =========================================================
   Growency
   No dependencies. The page is readable with this file
   missing, so everything here is decoration.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* nav gains a ground once the hero starts scrolling past */
  (function navState() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var queued = false;
    function draw() {
      queued = false;
      nav.classList.toggle('is-stuck', window.scrollY > 20);
    }
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* reveal on scroll. without IntersectionObserver everything is
     simply shown, which is the correct fallback rather than a
     page of invisible text. */
  (function reveals() {
    var items = document.querySelectorAll('.reveal');
    if (reduced || !('IntersectionObserver' in window)) {
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

  /* the glow on a card follows the pointer, so the six cards feel
     lit rather than painted. off on coarse pointers. */
  (function cardGlow() {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return;
    var cards = document.querySelectorAll('.way');
    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      }, { passive: true });
    });
  })();
})();
