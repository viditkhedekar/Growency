(() => {
  const gallery = document.querySelector('.ad-gallery');
  if (!gallery) return;

  const root = document.documentElement;
  const panel = gallery.querySelector('.ad-gallery-panel');
  const track = gallery.querySelector('.ad-gallery-track');
  const controls = gallery.querySelector('.ad-gallery-controls');
  const [previous, next] = controls.querySelectorAll('button');
  const desktop = matchMedia('(min-width: 800px) and (min-height: 510px) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const scrollRatio = 0.8;
  let scrollLinked = false;
  let distance = 0;
  let stickyTop = 0;
  let frame = 0;

  const maxOffset = () => Math.max(0, track.scrollWidth - track.clientWidth);
  const motionPaused = () => reducedMotion.matches || root.classList.contains('motion-paused');
  const limitOffset = offset => Math.max(0, Math.min(maxOffset(), offset));

  function updateControls() {
    previous.disabled = track.scrollLeft < 1;
    next.disabled = track.scrollLeft >= maxOffset() - 1;
  }

  function paint() {
    frame = 0;
    if (scrollLinked && distance > 0) {
      const traveled = stickyTop - gallery.getBoundingClientRect().top;
      const progress = Math.max(0, Math.min(1, traveled / distance));
      track.scrollLeft = maxOffset() * progress;
      panel.style.setProperty('--ad-progress', progress);
    }
    updateControls();
  }

  function schedulePaint() {
    if (!frame) frame = requestAnimationFrame(paint);
  }

  function measure() {
    scrollLinked = desktop.matches && !motionPaused();
    gallery.toggleAttribute('data-scroll-linked', scrollLinked);
    if (scrollLinked) {
      distance = maxOffset() * scrollRatio;
      gallery.style.setProperty('--ad-scroll-distance', `${distance}px`);
      gallery.style.setProperty('--ad-panel-height', `${panel.offsetHeight}px`);
      stickyTop = parseFloat(getComputedStyle(panel).top) || 0;
    }
    schedulePaint();
  }

  function goTo(offset) {
    const target = limitOffset(offset);
    if (scrollLinked && distance > 0) {
      const start = window.scrollY + gallery.getBoundingClientRect().top - stickyTop;
      const top = start + target * scrollRatio;
      if (window.GROWENCY_SCROLL) window.GROWENCY_SCROLL.to(top);
      else window.scrollTo({ top, behavior: 'smooth' });
      return;
    }
    track.scrollTo({ left: target, behavior: motionPaused() ? 'instant' : 'smooth' });
  }

  function step(direction) {
    const [first, second] = track.children;
    if (!second) return;
    const stride = second.offsetLeft - first.offsetLeft;
    goTo(track.scrollLeft + direction * stride);
  }

  controls.hidden = false;
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  track.addEventListener('keydown', event => {
    if (!scrollLinked || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft') step(-1);
    else if (event.key === 'ArrowRight') step(1);
    else if (event.key === 'Home') goTo(0);
    else if (event.key === 'End') goTo(maxOffset());
    else return;
    event.preventDefault();
  });

  window.addEventListener('scroll', schedulePaint, { passive: true });
  window.addEventListener('resize', measure);
  track.addEventListener('scroll', updateControls, { passive: true });
  desktop.addEventListener('change', measure);
  reducedMotion.addEventListener('change', measure);
  new MutationObserver(measure).observe(root, { attributes: true, attributeFilter: ['class'] });
  new ResizeObserver(measure).observe(panel);
  measure();
})();
