(() => {
  const gallery = document.querySelector('.ad-gallery');
  if (!gallery) return;
  const track = gallery.querySelector('.ad-gallery-track');
  const controls = gallery.querySelector('.ad-gallery-controls');
  const [previous, next] = controls.querySelectorAll('button');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function updateControls() {
    previous.disabled = track.scrollLeft < 1;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
  }

  controls.hidden = false;
  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-ad-direction]');
    if (!button) return;
    const distance = track.children[1].offsetLeft - track.children[0].offsetLeft;
    track.scrollBy({
      left: Number(button.dataset.adDirection) * distance,
      behavior: reducedMotion.matches || document.documentElement.classList.contains('motion-paused') ? 'instant' : 'smooth',
    });
  });

  track.addEventListener('wheel', event => {
    if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
    const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientWidth : 1;
    const destination = Math.max(0, Math.min(track.scrollWidth - track.clientWidth, track.scrollLeft + event.deltaY * factor));
    if (Math.abs(destination - track.scrollLeft) < 1) return;
    event.preventDefault();
    track.scrollLeft = destination;
  }, { passive: false });

  track.addEventListener('scroll', updateControls, { passive: true });
  new ResizeObserver(updateControls).observe(track);
  updateControls();
})();
