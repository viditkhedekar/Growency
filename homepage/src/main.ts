import './styles.css';
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

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const forceStatic = new URLSearchParams(location.search).has('static');

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

if (!motionPreference.matches && !forceStatic && webglAvailable()) {
  initMotion()
    .then(() => initWork(motionPreference, true))
    .catch((error) => {
      console.error('Hero animation failed, using static layout', error);
      $('[data-hero]').classList.remove('is-gl');
      initWork(motionPreference, false);
    });
} else {
  initWork(motionPreference, false);
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
  const progress = $<HTMLProgressElement>('[data-hero-progress]');
  const ticker = $<HTMLElement>('[data-hero-clients]');
  const next = $<HTMLButtonElement>('[data-hero-next]');
  const instruction = $<HTMLElement>('[data-hero-instruction]');
  const syncProgress = (value: number) => {
    scene.setProgress(value);
    progress.value = value;
    const showClients = value < T.taglineStart;
    ticker.classList.toggle('is-away', !showClients);
    ticker.inert = !showClients;
    const showWork = value >= T.chromeStart - 0.03;
    if (next.dataset.destination !== (showWork ? 'work' : 'logo')) {
      next.dataset.destination = showWork ? 'work' : 'logo';
      next.firstChild!.textContent = showWork ? 'See the sample ads ' : 'Reveal the logo ';
      instruction.textContent = showWork ? 'Keep scrolling to see the ads' : 'Scroll down to reveal the logo';
    }
  };
  const st = ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: () => `+=${Math.round(stage.clientHeight * (window.innerWidth < 700 ? PIN_LENGTH_VH.mobile : PIN_LENGTH_VH.desktop))}`,
    pin: stage,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => syncProgress(self.progress),
    onRefresh: (self) => syncProgress(self.progress),
  });
  syncProgress(st.progress);

  const reel = $<HTMLElement>('#sample-ads');
  const reachReel = () => {
    reel.scrollIntoView({ block: 'start' });
    st.update();
    scene.snap();
    reel.tabIndex = -1;
    reel.focus({ preventScroll: true });
  };
  next.addEventListener('click', () => {
    if (next.dataset.destination === 'work') {
      reachReel();
    } else {
      window.scrollTo({ top: st.start + (st.end - st.start) * (T.chromeEnd + 0.003), behavior: 'smooth' });
    }
  });
  $<HTMLAnchorElement>('[data-hero-skip]').addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.pushState(null, '', '#sample-ads');
    reachReel();
  });

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
  if (jump !== null) {
    window.scrollTo(0, st.start + (st.end - st.start) * Number(jump));
  } else {
    // The browser may have already followed the fragment before the pin
    // added its scroll space. Re-align deep links after the layout changes.
    document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }
  st.update();
  if (st.progress > 0) scene.snap();
  syncNav();

  (window as unknown as { __hero: unknown }).__hero = { scene, st };
}
