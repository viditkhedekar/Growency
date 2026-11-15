// "The work": the full-bleed spec reel the hero zooms into, then a bento of
// Growency's services (strategy, creative, testing, budget, reporting),
// pricing, FAQ and clients. Copy comes from trygrowency.com.
import './work.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initWork(motionPreference: MediaQueryList, animatedHero: boolean) {
  const motion = !motionPreference.matches;
  const work = document.querySelector<HTMLElement>('[data-work]');
  if (!work) return;
  if (motion) work.classList.add('has-reveal');
  // ── Cursor spotlight on every tile ──
  const bento = work.querySelector<HTMLElement>('[data-bento]');
  bento?.addEventListener('pointermove', (e) => {
    const tile = (e.target as HTMLElement).closest<HTMLElement>('.tile');
    if (!tile) return;
    const r = tile.getBoundingClientRect();
    tile.style.setProperty('--mx', `${e.clientX - r.left}px`);
    tile.style.setProperty('--my', `${e.clientY - r.top}px`);
  });

  // ── Reveal + count-ups ──
  const countUp = (el: HTMLElement) => {
    const to = Number(el.dataset.count);
    const prefix = el.dataset.prefix ?? '';
    if (!motion) return;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: to,
      duration: 1.4,
      delay: 0.3,
      ease: 'power3.out',
      onUpdate: () => (el.textContent = prefix + Math.round(obj.v).toLocaleString('en-GB')),
    });
  };
  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        e.target.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
        reveal.unobserve(e.target);
      }),
    { threshold: 0.18 },
  );
  work.querySelectorAll('.tile').forEach((t) => (motion ? reveal.observe(t) : t.classList.add('is-in')));

  // ── FAQ: one answer open at a time ──
  const faqs = [...work.querySelectorAll<HTMLDetailsElement>('.svc--faq details')];
  faqs.forEach((d) =>
    d.addEventListener('toggle', () => {
      if (d.open) faqs.forEach((o) => o !== d && (o.open = false));
    }),
  );

  const reel = work.querySelector<HTMLElement>('[data-reel]')!;
  const video = reel.querySelector<HTMLVideoElement>('[data-reel-video]')!;
  initReel(reel, video, motionPreference);
  if (!animatedHero) return;

  reel.classList.add('is-motion-reel');
  const frame = reel.querySelector<HTMLElement>('[data-reel-frame]')!;
  const sticky = reel.querySelector<HTMLElement>('.reel__sticky')!;
  const page = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffffff';
  const shade = reel.querySelector<HTMLElement>('[data-reel-shade]')!;
  const copy = reel.querySelector<HTMLElement>('[data-reel-copy]')!;
  const lines = copy.querySelectorAll<HTMLElement>('.reel__line > span');
  const rest = copy.querySelectorAll<HTMLElement>('.eyebrow, .reel__lede, .reel__actions');
  copy.inert = true;
  gsap.set(lines, { yPercent: 110 });
  gsap.set(rest, { opacity: 0, y: 24 });
  gsap
    .timeline({
      scrollTrigger: {
        trigger: reel,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.22,
        refreshPriority: -1,
        onUpdate: (self) => {
          reel.classList.toggle('is-framed', self.progress > 0.8);
          copy.inert = self.progress < 0.24;
        },
      },
      defaults: { ease: 'none' },
    })
    // Breathe on the full-bleed reel for a beat, then darken and rise the headline.
    .to(video, { scale: 1.06, duration: 1 }, 0)
    .to(shade, { opacity: 1, duration: 0.3 }, 0.12)
    .to(copy, { opacity: 1, duration: 0.01 }, 0.12)
    .to(lines, { yPercent: 0, duration: 0.28, stagger: 0.06, ease: 'power3.out' }, 0.14)
    .to(rest, { opacity: 1, y: 0, duration: 0.22, stagger: 0.04, ease: 'power2.out' }, 0.3)
    // Then the reel draws in to a framed panel before the bento.
    .fromTo(
      frame,
      { clipPath: 'inset(0% 0% 0% 0% round 0px)' },
      { clipPath: 'inset(7% 3.5% 7% 3.5% round 30px)', duration: 0.3, ease: 'power2.inOut' },
      0.68,
    )
    // …and the page around it brightens to match the rest of the landing.
    .to(sticky, { backgroundColor: page, duration: 0.3, ease: 'power2.inOut' }, 0.68);
  ScrollTrigger.refresh();
}

function initReel(reel: HTMLElement, video: HTMLVideoElement, preference: MediaQueryList) {
  const controls = reel.querySelector<HTMLElement>('[data-reel-controls]')!;
  const toggle = reel.querySelector<HTMLButtonElement>('[data-reel-toggle]')!;
  const seek = reel.querySelector<HTMLInputElement>('[data-reel-seek]')!;
  const time = reel.querySelector<HTMLElement>('[data-reel-time]')!;
  const source = video.querySelector('source')!;
  const landscape = { src: source.src, poster: video.poster };
  const portrait = { src: video.dataset.portraitSrc!, poster: video.dataset.portraitPoster! };
  const portraitMedia = matchMedia('(max-aspect-ratio: 3/4)');
  let pendingSeek = 0;
  let wantsPlay = !preference.matches;
  let inView = false;
  video.defaultPlaybackRate = 0.5;
  video.playbackRate = 0.5;

  function syncPlayback() {
    if (wantsPlay && !document.hidden && (inView || video.dataset.portal === 'open')) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  function syncControls() {
    const playing = !video.paused;
    toggle.textContent = playing ? 'Pause' : 'Play';
    toggle.setAttribute('aria-label', playing ? 'Pause sample ads' : 'Play sample ads');
  }

  function syncTime() {
    seek.value = String(video.currentTime);
    const seconds = Math.floor(video.currentTime);
    time.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function setFormat() {
    const format = portraitMedia.matches ? portrait : landscape;
    if (new URL(format.src, location.href).href === source.src) return;
    pendingSeek = video.currentTime || pendingSeek;
    if (video.readyState > 0) video.preload = 'metadata';
    seek.disabled = true;
    video.poster = format.poster;
    source.src = format.src;
    video.load();
    syncPlayback();
  }

  video.addEventListener('loadedmetadata', () => {
    seek.max = String(video.duration);
    if (pendingSeek > 0) video.currentTime = Math.min(pendingSeek, video.duration);
    pendingSeek = 0;
    seek.disabled = false;
    syncTime();
  });
  video.addEventListener('timeupdate', syncTime);
  video.addEventListener('play', syncControls);
  video.addEventListener('pause', syncControls);
  video.addEventListener('reel-portal-change', syncPlayback);
  toggle.addEventListener('click', () => {
    wantsPlay = video.paused;
    syncPlayback();
  });
  seek.addEventListener('input', () => {
    wantsPlay = false;
    video.pause();
    video.currentTime = seek.valueAsNumber;
    syncTime();
  });
  preference.addEventListener('change', () => {
    if (preference.matches) {
      wantsPlay = false;
      syncPlayback();
    }
  });
  document.addEventListener('visibilitychange', syncPlayback);
  portraitMedia.addEventListener('change', setFormat);
  setFormat();
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
    syncPlayback();
  }, { threshold: 0.25 }).observe(reel.querySelector('.reel__sticky')!);
  controls.hidden = false;
}
