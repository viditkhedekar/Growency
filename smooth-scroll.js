(() => {
  if (typeof Lenis === 'undefined') return;

  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const smoothing = 0.18;
  const desktopPointer = matchMedia('(hover: hover) and (pointer: fine)');
  const wideViewport = matchMedia('(min-width: 1101px)');
  let scroller;
  let paused;

  function configure() {
    const disabled = !desktopPointer.matches || !wideViewport.matches || preference.matches || root.classList.contains('motion-paused');
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
    if (disabled && scroller) {
      scroller.destroy(); scroller = undefined;
    }

  }

  // Pause motion restores native scrolling; resuming starts from the current position.
  new MutationObserver(configure).observe(root, { attributes: true, attributeFilter: ['class'] });
  preference.addEventListener('change', configure);
  desktopPointer.addEventListener('change', configure);
  wideViewport.addEventListener('change', configure);
  window.GROWENCY_SCROLL = {
    to(top, options = {}) {
      if (scroller && !paused) {
        if (options.immediate) scroller.resize();
        scroller.scrollTo(top, options);
      }
      else window.scrollTo({ top, behavior: 'instant' });
    },
  };
  configure();
})();
