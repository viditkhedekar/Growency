import './styles.css';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CAMPAIGNS } from './content/campaigns';
import { buildStaticMark, fillMarkIcon } from './hero/staticHero';
import { PIN_LENGTH_VH, T, seg } from './hero/timeline';
import { initWork } from './work';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;

// Nav icon
fillMarkIcon($<SVGSVGElement>('[data-mark-icon]'));
fillMarkIcon($<SVGSVGElement>('[data-footer-mark]'));

// Static mark is always built: it's the reduced-motion / no-WebGL layout.
buildStaticMark($<SVGSVGElement>('[data-static-mark]'), CAMPAIGNS);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const forceStatic = new URLSearchParams(location.search).has('static');

// Glide wheel scrolling throughout the page while leaving touch and
// reduced-motion scrolling native. Keep ScrollTrigger tied to actual scroll.
void import('lenis').then(({ default: Lenis }) => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let scrolling: InstanceType<typeof Lenis> | undefined;
  const sync = () => {
    scrolling?.destroy();
    scrolling = undefined;
    if (preference.matches) return;
    scrolling = new Lenis({ autoRaf: true, duration: 1.05, lerp: 0, smoothWheel: true, syncTouch: false, anchors: false });
    scrolling.on('scroll', ScrollTrigger.update);
    if (document.documentElement.classList.contains('has-campaign-viewer')) scrolling.stop();
  };
  document.addEventListener('click', (event) => {
    if (!scrolling || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const hash = link?.getAttribute('href');
    if (!hash || hash === '#') return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    // Numeric destinations stay accurate after keyboard focus or native
    // scroll-into-view moves, even before Lenis sees the next scroll event.
    const top = hash === '#hero' ? 0 : target.getBoundingClientRect().top + window.scrollY;
    history.pushState(null, '', hash);
    scrolling.scrollTo(top);
  });
  document.addEventListener('campaign-viewer-change', event => {
    if ((event as CustomEvent<{ open: boolean }>).detail.open) scrolling?.stop();
    else scrolling?.start();
  });
  preference.addEventListener('change', sync);
  sync();
});

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

if (!reduceMotion && !forceStatic && webglAvailable()) {
  initMotion()
    .catch((err) => {
      console.error('Hero animation failed, using static layout', err);
      $('[data-hero]').classList.remove('is-gl');
    })
    // The work section measures its scroll positions after the hero pin exists.
    .finally(() => initWork(!reduceMotion));
} else {
  initWork(!reduceMotion);
}

async function initMotion() {
  // three.js and the scene code load only when motion is allowed.
  const { HeroScene } = await import('./hero/heroScene');
  await document.fonts?.ready;
  const hero = $<HTMLElement>('[data-hero]');
  const stage = $<HTMLElement>('[data-hero-stage]');
  const scene = new HeroScene(
    {
      hero,
      stage,
      canvas: $<HTMLCanvasElement>('[data-hero-canvas]'),
      wordmark: $<HTMLElement>('[data-wordmark]'),
      markHit: $<HTMLButtonElement>('[data-mark-hit]'),
      hint: document.querySelector<HTMLElement>('[data-hero-hint]'),
    },
    CAMPAIGNS,
  );

  ScrollTrigger.config({ ignoreMobileResize: true });
  const st = ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: () => `+=${Math.round(window.innerHeight * PIN_LENGTH_VH)}`,
    pin: stage,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => scene.setProgress(self.progress),
  });
  scene.setProgress(st.progress);

  // Remove navigation from the immersive zoom and everything after it.
  // This trigger is independent of the scene RAF, so reversing from the
  // footer restores the navbar even when the hero is off screen.
  const nav = $<HTMLElement>('[data-nav]');
  const syncNav = () => {
    const progress = (window.scrollY - st.start) / Math.max(1, st.end - st.start);
    const fade = seg(progress, T.zoomStart - 0.025, T.zoomStart);
    nav.style.opacity = String(1 - fade);
    nav.inert = fade >= 0.99;
    nav.style.visibility = fade >= 0.99 ? 'hidden' : 'visible';
  };
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: syncNav, onRefresh: syncNav });
  syncNav();

  // Debug / review helper: ?p=0.7 jumps to a point in the sequence.
  const jump = new URLSearchParams(location.search).get('p');
  if (jump !== null) window.scrollTo(0, st.start + (st.end - st.start) * Number(jump));

  (window as unknown as { __hero: unknown }).__hero = { scene, st };
}

// Optional loop video loads only as the footer approaches.
const footer = document.querySelector<HTMLElement>('.world-footer');
if (footer) {
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    import('./footerMedia').then(({ initFooterVideo }) => initFooterVideo(footer)).catch(() => {
      // Responsive still images remain available if video cannot play.
    });
  }, { rootMargin: '300px' });
  observer.observe(footer);
}
