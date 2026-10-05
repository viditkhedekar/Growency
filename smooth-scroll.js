(() => {
  if (typeof Lenis === 'undefined') return;

  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const smoothing = 0.18;
  let scroller;
  let paused;

  function configure() {
    const disabled = preference.matches || root.classList.contains('motion-paused');
    if (disabled === paused) return;
    paused = disabled;
    if (!disabled && !scroller) {
      scroller = new Lenis({
        autoRaf: true,
        lerp: smoothing,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 1,
        anchors: { offset: -(parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) },
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
      });
    }
    if (scroller) {
      if (disabled) scroller.scrollTo(scrollY, { immediate: true });
      scroller.options.smoothWheel = !disabled;
      scroller.options.lerp = disabled ? 1 : smoothing;
      scroller.options.anchors = disabled ? false : {
        offset: -(parseFloat(getComputedStyle(root).scrollPaddingTop) || 0),
      };
    }
  }

  // Pause motion restores native scrolling; resuming starts from the current position.
  new MutationObserver(configure).observe(root, { attributes: true, attributeFilter: ['class'] });
  preference.addEventListener('change', configure);
  window.GROWENCY_SCROLL = {
    to(top) {
      if (scroller && !paused) scroller.scrollTo(top);
      else window.scrollTo({ top, behavior: 'instant' });
    },
  };
  configure();
})();
