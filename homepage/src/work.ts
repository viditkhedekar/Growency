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

  // ── Reel: plays while on screen (or while the hero's window shows it) ──
  const reel = work.querySelector<HTMLElement>('[data-reel]');
  const video = work.querySelector<HTMLVideoElement>('[data-reel-video]');
  if (reel && video) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) void video.play().catch(() => {});
      else if (video.dataset.portal !== 'open') video.pause();
    }).observe(reel);
  }

  if (!motion || !reel) return;
  const frame = reel.querySelector<HTMLElement>('[data-reel-frame]')!;
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
        scrub: 0.6,
        refreshPriority: -1,
        onUpdate: (self) => reel.classList.toggle('is-framed', self.progress > 0.8),
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
