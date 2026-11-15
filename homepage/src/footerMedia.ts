// Set data-video-desktop / data-video-mobile on [data-footer-media] after
// exporting the loops. Until then, the responsive picture is the full footer.
export function initFooterVideo(footer: HTMLElement) {
  const media = footer.querySelector<HTMLElement>('[data-footer-media]');
  if (!media) return;
  const mobile = matchMedia('(max-width: 800px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'none';
  video.setAttribute('aria-hidden', 'true');
  media.append(video);
  let visible = false;
  let current = '';
  video.addEventListener('loadeddata', () => video.classList.add('is-ready'));
  video.addEventListener('error', () => video.classList.remove('is-ready'));
  const sync = () => {
    const src = reduced.matches || saveData ? '' : mobile.matches ? media.dataset.videoMobile || '' : media.dataset.videoDesktop || '';
    if (src !== current) {
      video.pause();
      video.classList.remove('is-ready');
      current = src;
      if (src) video.src = src;
      else video.removeAttribute('src');
      video.load();
    }
    if (src && visible && !document.hidden) void video.play().catch(() => video.classList.remove('is-ready'));
    else video.pause();
  };
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(footer);
  reduced.addEventListener('change', sync);
  mobile.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}
