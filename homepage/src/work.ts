// "The work": the full-bleed spec reel the hero zooms into, then a bento of
// Growency's services (strategy, creative, testing, budget, reporting),
// pricing, FAQ and clients. Copy comes from trygrowency.com.
import './work.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initWork(motion: boolean) {
  const work = document.querySelector<HTMLElement>('[data-work]');
  if (!work) return;
  // ── Cursor spotlight on every tile ──
  const bento = work.querySelector<HTMLElement>('[data-bento]');
  bento?.addEventListener('pointermove', (e) => {
    const tile = (e.target as HTMLElement).closest<HTMLElement>('.tile');
    if (!tile) return;
    const r = tile.getBoundingClientRect();
    tile.style.setProperty('--mx', `${e.clientX - r.left}px`);
    tile.style.setProperty('--my', `${e.clientY - r.top}px`);
  });

  const creative = work.querySelector<HTMLElement>('.svc--creative');
  if (creative) {
    const art = creative.querySelector<HTMLElement>('.creative-ads')!;
    const ads = [...art.querySelectorAll<HTMLImageElement>('[data-creative-slot]')];
    const next = creative.querySelector<HTMLButtonElement>('[data-creative-next]')!;
    const view = creative.querySelector<HTMLAnchorElement>('[data-creative-view]')!;
    const status = creative.querySelector<HTMLElement>('[data-creative-status]')!;
    let current = 0;

    const advance = (announce: boolean) => {
      current = (current + 1) % ads.length;
      ads.forEach((ad, index) => {
        const slot = (index - current + ads.length) % ads.length;
        ad.dataset.creativeSlot = String(slot);
        if (slot === 0) ad.removeAttribute('aria-hidden');
        else ad.setAttribute('aria-hidden', 'true');
      });
      view.href = ads[current].src;
      art.style.setProperty('--creative-image', `url("${ads[current].src}")`);
      if (announce) status.textContent = ads[current].alt + ', ad ' + (current + 1) + ' of ' + ads.length;
    };

    next.hidden = false;
    next.addEventListener('click', () => advance(true));
    if (motion) creative.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && !creative.contains(document.activeElement)) advance(false);
    });
  }

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

  const reel = work.querySelector<HTMLElement>('[data-reel]');
  const video = work.querySelector<HTMLVideoElement>('[data-reel-video]');
  const frame = reel?.querySelector<HTMLElement>('[data-reel-frame]');
  if (!reel || !video || !frame) return;

  const controls = reel.querySelector<HTMLElement>('[data-reel-controls]')!;
  const toggle = controls.querySelector<HTMLButtonElement>('.reel-toggle')!;
  const scrubber = controls.querySelector<HTMLInputElement>('[data-reel-scrub]')!;
  let wantsPlay = motion;
  let visible = false;
  let drag: { id: number; x: number; time: number; width: number; active: boolean } | null = null;
  let seekFrame = 0;
  let targetTime = 0;
  video.defaultPlaybackRate = .6;
  video.playbackRate = .6;

  function sync() {
    if (visible && wantsPlay && !document.hidden) void video!.play().catch(() => {});
    else video!.pause();
  }

  function pauseForScrub() {
    wantsPlay = false;
    video!.pause();
  }

  function updateButton() {
    const label = video!.paused ? 'Play' : 'Pause';
    toggle.textContent = label;
    toggle.setAttribute('aria-label', label + ' sample ads');
  }

  function syncScrubber() {
    if (!Number.isFinite(video!.duration) || video!.duration <= 0) return;
    scrubber.max = String(video!.duration);
    scrubber.value = String(video!.currentTime);
    scrubber.disabled = false;
    frame!.classList.add('is-draggable');
  }

  controls.hidden = false;
  toggle.addEventListener('click', () => {
    wantsPlay = video.paused;
    sync();
  });
  scrubber.addEventListener('input', () => {
    pauseForScrub();
    video.currentTime = scrubber.valueAsNumber;
  });
  video.addEventListener('play', updateButton);
  video.addEventListener('pause', updateButton);
  video.addEventListener('loadedmetadata', syncScrubber);
  video.addEventListener('timeupdate', () => {
    if (!drag?.active) scrubber.value = String(video.currentTime);
  });
  syncScrubber();

  frame.addEventListener('pointerdown', event => {
    if (event.button !== 0 || scrubber.disabled || drag) return;
    drag = { id: event.pointerId, x: event.clientX, time: video.currentTime, width: frame.clientWidth, active: false };
    frame.setPointerCapture(event.pointerId);
  });
  frame.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    const distance = drag.x - event.clientX;
    if (!drag.active) {
      if (Math.abs(distance) < 6) return;
      drag.active = true;
      pauseForScrub();
      frame.classList.add('is-dragging');
    }
    const cycle = video.duration;
    const offset = drag.time + distance / drag.width * cycle * .45;
    targetTime = (offset % cycle + cycle) % cycle;
    scrubber.value = String(targetTime);
    if (seekFrame) return;
    seekFrame = requestAnimationFrame(() => {
      video.currentTime = targetTime;
      seekFrame = 0;
    });
  });
  frame.addEventListener('lostpointercapture', event => {
    if (drag?.id !== event.pointerId) return;
    drag = null;
    frame.classList.remove('is-dragging');
  });

  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { threshold: .2 }).observe(reel);

  if (!motion) return;
  const sticky = reel.querySelector<HTMLElement>('.reel__sticky')!;
  const page = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffffff';
  const shade = reel.querySelector<HTMLElement>('[data-reel-shade]')!;
  const copy = reel.querySelector<HTMLElement>('[data-reel-copy]')!;
  const lines = copy.querySelectorAll<HTMLElement>('.reel__line > span');
  const rest = copy.querySelectorAll<HTMLElement>('.eyebrow, .reel__lede, .reel__actions');
  gsap.set(lines, { yPercent: 110 });
  gsap.set(rest, { opacity: 0, y: 24 });
  gsap
    .timeline({
      scrollTrigger: {
        trigger: reel,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.48,
        refreshPriority: -1,
        onUpdate: (self) => reel.classList.toggle('is-framed', self.progress > 0.8),
      },
      defaults: { ease: 'none' },
    })
    // Breathe on the full-bleed reel for a beat, then darken and rise the headline.
    .to(video, { scale: 1.035, duration: 1, ease: 'sine.inOut' }, 0)
    .to(shade, { opacity: 1, duration: 0.46, ease: 'sine.inOut' }, 0.07)
    .to(copy, { opacity: 1, duration: 0.24, ease: 'sine.out' }, 0.12)
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
