import './work.css';
import { SPEC_ADS } from './content/work';

const AD_INTERVAL_MS = 6500;

export function initWork(motionPreference: MediaQueryList) {
  const slideshow = document.querySelector<HTMLElement>('[data-slideshow]')!;
  const controls = slideshow.querySelector<HTMLElement>('[data-slideshow-controls]')!;
  const previous = controls.querySelector<HTMLButtonElement>('[data-ad-previous]')!;
  const next = controls.querySelector<HTMLButtonElement>('[data-ad-next]')!;
  const toggle = controls.querySelector<HTMLButtonElement>('[data-ad-toggle]')!;
  let image = slideshow.querySelector<HTMLImageElement>('[data-ad-image]')!;
  const note = slideshow.querySelector<HTMLElement>('[data-ad-note]')!;
  const position = slideshow.querySelector<HTMLElement>('[data-ad-position]')!;
  const announcement = slideshow.querySelector<HTMLElement>('[data-ad-announcement]')!;

  let playing = !motionPreference.matches;
  let inView = false;
  let current = 0;
  let requested = 0;
  let requestId = 0;
  let autoAdvancePending = false;
  let timer: number | undefined;
  const wrap = (index: number) => (index + SPEC_ADS.length) % SPEC_ADS.length;

  function schedule() {
    clearTimeout(timer);
    if (playing && inView && !document.hidden) {
      timer = window.setTimeout(() => void show(current + 1), AD_INTERVAL_MS);
    }
  }

  function setPlaying(value: boolean) {
    playing = value;
    if (!playing && autoAdvancePending) {
      requestId++;
      requested = current;
      autoAdvancePending = false;
    }
    toggle.textContent = value ? 'Pause' : 'Play';
    toggle.setAttribute('aria-label', value ? 'Pause slideshow' : 'Play slideshow');
    schedule();
  }

  function describe(index: number) {
    const ad = SPEC_ADS[index];
    note.textContent = ad.note;
    position.textContent = `${index + 1} / ${SPEC_ADS.length}`;
  }

  async function show(index: number, manual = false) {
    requested = wrap(index);
    const id = ++requestId;
    autoAdvancePending = !manual;
    const ad = SPEC_ADS[requested];
    const replacement = image.cloneNode(false) as HTMLImageElement;
    replacement.loading = 'eager';
    replacement.alt = ad.alt;
    replacement.width = ad.width;
    replacement.height = ad.height;
    replacement.src = ad.src;
    try {
      await replacement.decode();
    } catch {
      if (id === requestId) {
        autoAdvancePending = false;
        requested = current;
        setPlaying(false);
        announcement.textContent = 'This sample ad could not load.';
      }
      return;
    }
    if (id !== requestId) return;
    autoAdvancePending = false;
    image.replaceWith(replacement);
    image = replacement;
    current = requested;
    describe(current);
    if (manual) announcement.textContent = `Ad ${current + 1} of ${SPEC_ADS.length}. ${ad.title}. ${ad.note}.`;
    if (!motionPreference.matches) image.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 280 });
    schedule();
  }

  function step(direction: number) {
    setPlaying(false);
    void show(requested + direction, true);
  }

  image.alt = SPEC_ADS[0].alt;
  describe(0);
  setPlaying(playing);
  controls.hidden = false;

  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  toggle.addEventListener('click', () => setPlaying(!playing));
  slideshow.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1);
  });
  document.addEventListener('visibilitychange', schedule);
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) setPlaying(false);
  });
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    schedule();
  }, { threshold: 0.4 }).observe(slideshow);
}
