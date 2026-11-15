// Based on the labelled plus cursor from the original Growency homepage.
const finePointer = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

if (finePointer.matches) {
  const halo = document.createElement('div');
  halo.className = 'cursor-halo';
  halo.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'cursor-label';
  halo.append(label);
  document.body.append(halo);

  let frame = 0;
  let x = 0;
  let y = 0;
  let width = 40;
  let active = null;
  const actions = 'a[href],button,summary,[data-hero-canvas],.reel__frame.is-draggable';

  function actionLabel(element) {
    const href = element.getAttribute('href') || '';
    if (/^\/book(?:[?#/]|$)|calendly\.com/.test(href)) return 'Book';
    if (element.matches('summary')) return element.closest('details')?.open ? 'Close' : 'Open';
    if (element.matches('[data-hero-canvas]')) return 'Explore';
    if (element.matches('.reel__frame')) return 'Drag ads';
    if (element.matches('[data-creative-next]')) return 'Next ad';
    if (element.matches('.reel-toggle')) return element.textContent.trim();
    if (href === '/' || href === '#hero') return 'Home';
    if (href === '/contact') return 'Contact';
    if (href.startsWith('mailto:')) return 'Email';
    if (/^https?:/.test(href)) return 'Visit';
    return element.matches('a') ? 'View' : 'Select';
  }

  function place(target) {
    const action = target.closest(actions);
    active = action?.matches(':disabled,[aria-disabled="true"]') ? null : action;
    const text = active ? actionLabel(active) : '';
    if (label.textContent !== text) {
      label.textContent = text;
      width = text ? Math.max(88, 54 + text.length * 7) : 40;
      halo.style.setProperty('--cursor-width', width + 'px');
    }
    halo.classList.toggle('is-link', Boolean(active));
    halo.classList.toggle('is-text', Boolean(target.closest('input,textarea,select,iframe,[contenteditable="true"]')));
    halo.classList.toggle('opens-left', Boolean(active) && x + width - 20 > innerWidth - 12);
  }

  function hide() {
    halo.classList.remove('is-visible', 'is-pressed');
  }

  document.addEventListener('pointermove', event => {
    if (!finePointer.matches || event.pointerType === 'touch' || !(event.target instanceof Element)) return;
    x = event.clientX;
    y = event.clientY;
    place(event.target);
    if (frame) return;
    frame = requestAnimationFrame(() => {
      halo.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      halo.classList.add('is-visible');
      frame = 0;
    });
  }, { passive: true });

  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' && event.button === 0) halo.classList.add('is-pressed');
  }, { passive: true });
  document.addEventListener('pointerup', () => halo.classList.remove('is-pressed'), { passive: true });
  document.addEventListener('click', () => {
    if (active) requestAnimationFrame(() => {
      const target = document.elementFromPoint(x, y);
      if (target) place(target);
    });
  });
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) hide(); });
  document.addEventListener('pointercancel', hide, { passive: true });
  document.addEventListener('keydown', event => { if (event.key === 'Tab') hide(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  window.addEventListener('blur', hide);
  window.addEventListener('scroll', () => {
    if (!halo.classList.contains('is-visible')) return;
    const target = document.elementFromPoint(x, y);
    if (target) place(target);
  }, { passive: true });
}
