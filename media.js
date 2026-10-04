/* Add the supplied video URL or a project-relative path here when it is ready.
   The subdued editorial poster stays visible until the film is supplied. */
window.GROWENCY_MEDIA = { heroVideo: '' };
(() => {
  const video = document.querySelector('#hero-video');
  const source = window.GROWENCY_MEDIA.heroVideo;
  if (!video || !source) return;
  const play = document.querySelector('#film-play');
  const status = document.querySelector('.film-status');
  video.src = source;
  video.addEventListener('loadeddata', () => {
    video.closest('.brand-world').classList.add('has-video');
    play.disabled = false;
    status.textContent = 'The Growency film';
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) video.play().catch(() => {});
  }, { once: true });
  const update = () => {
    play.textContent = video.paused ? '▷' : 'Ⅱ';
    play.setAttribute('aria-label', video.paused ? 'Play Growency film' : 'Pause Growency film');
  };
  video.addEventListener('play', update);
  video.addEventListener('pause', update);
  play.addEventListener('click', () => {
    video.dataset.userPaused = String(!video.paused);
    if (video.paused) video.play().catch(() => {}); else video.pause();
    update();
  });
  video.addEventListener('error', () => {
    video.closest('.brand-world').classList.remove('has-video');
    play.disabled = true;
    play.setAttribute('aria-label', 'Growency film coming soon');
    status.textContent = 'Coming soon';
  });
  video.load();
})();
