import './styles.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CAMPAIGNS } from './content/campaigns';
import { fillMarkIcon } from './hero/staticHero';
import { PIN_LENGTH_VH, T } from './hero/timeline';
import { initWork } from './work';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;

// Nav icon
fillMarkIcon($<SVGSVGElement>('[data-mark-icon]'));
fillMarkIcon($<SVGSVGElement>('[data-footer-mark]'));

const fallback = $<HTMLElement>('[data-hero-static]');
const track = document.createElement('div');
track.className = 'ad-fallback';
track.tabIndex = 0;
track.setAttribute('aria-label', 'Sample ads');
for (const ad of CAMPAIGNS) {
  const link = document.createElement('a');
  link.href = ad.poster;
  const image = new Image();
  image.src = ad.poster;
  image.alt = ad.alt;
  image.loading = 'lazy';
  link.append(image);
  track.append(link);
}
fallback.replaceChildren(track);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const forceStatic = new URLSearchParams(location.search).has('static');

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
  const showMark = new URLSearchParams(location.search).has('logo-preview');
  hero.classList.toggle('intro-only', !showMark);
  const syncIntro = (progress: number) => {
    // Leave the rendering code intact and stop before the mark assembles.
    scene.setProgress(showMark ? progress : progress * T.clickStart);
    if (!showMark) hero.style.setProperty('--intro-exit', String(Math.max(0, (progress - .87) / .13)));
  };
  const st = ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: () => `+=${Math.round(stage.clientHeight * PIN_LENGTH_VH)}`,
    pin: stage,
    pinSpacing: true,
    onUpdate: self => syncIntro(self.progress),
    onRefresh: self => syncIntro(self.progress),
  });
  syncIntro(st.progress);
  // Debug / review helper: ?p=0.7 jumps to a point in the sequence.
  const jump = new URLSearchParams(location.search).get('p');
  if (jump !== null) window.scrollTo(0, st.start + (st.end - st.start) * Number(jump));

  if (jump === null && location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  st.update();
  if (st.progress > 0) scene.snap();

  (window as unknown as { __hero: unknown }).__hero = { scene, st };
}


const milestones = Array.from(document.querySelectorAll<HTMLAnchorElement>('.milestones a'));
function showMilestone() {
  const active = [...milestones].reverse().find(link => {
    const section = document.getElementById(link.hash.slice(1));
    return section && section.getBoundingClientRect().top <= innerHeight * .34;
  }) ?? milestones[0];
  for (const link of milestones) {
    if (link === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
window.addEventListener('scroll', showMilestone, { passive: true });
showMilestone();

const examples = ['market your SaaS', 'fill your school places', 'sell your clothing line', 'launch your app', 'sell more products online', 'book more consultations'];
const example = document.querySelector<HTMLElement>('[data-example]')!;
if (!reduceMotion) {
  let exampleIndex = 0;
  window.setInterval(() => {
    if (document.hidden) return;
    exampleIndex = (exampleIndex + 1) % examples.length;
    example.textContent = examples[exampleIndex];
    example.animate([{ opacity: .35, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], 180);
  }, 2000);
}
