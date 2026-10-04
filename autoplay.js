/* The journey demos play themselves. When a step scrolls to the centre of
   the screen its demo runs through the same events a visitor would fire:
   the search types, an angle is chosen, the email sends, the call books.
   Any real interaction hands that demo over to the visitor for good, and
   everything stands still under reduced motion or the journey's own pause. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const steps = [...document.querySelectorAll('.story-step')];
  if (!steps.length) return;

  const still = () =>
    reduced.matches ||
    root.classList.contains('motion-paused') ||
    !root.classList.contains('motion-enabled');

  function typeInto(input, text, tick, done) {
    let i = 0;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const step = () => {
      if (i >= text.length) { done && done(); return; }
      input.value += text[i++];
      input.dispatchEvent(new Event('input', { bubbles: true }));
      tick(step, 90 + Math.random() * 70);
    };
    tick(step, 350);
  }

  /* Each script is a list of [delayMs, fn] beats, run only while its step
     is the centred one. Delays are from the previous beat. */
  const scripts = {
    find: (tick, click) => [
      [600, () => {
        const search = document.querySelector('#prospect-search');
        typeInto(search, 'ceo', tick, () => tick(() => {
          typeInto(search, '', tick);
          const rows = document.querySelectorAll('.prospect-row');
          if (rows[1]) click(rows[1]);
        }, 900));
      }],
    ],
    research: (tick, click) => [
      [900, () => {
        const hiring = document.querySelector('[data-angle="hiring"]');
        if (hiring) click(hiring);
        tick(() => {
          const expansion = document.querySelector('[data-angle="expansion"]');
          if (expansion) click(expansion);
        }, 2100);
      }],
    ],
    conversation: (tick, click) => [
      [1100, () => {
        const send = document.querySelector('#send-demo');
        if (send && !send.disabled) click(send);
      }],
    ],
    booked: (tick, click) => [
      [700, () => {
        const thu = document.querySelector('[data-day="THU"]');
        if (thu) click(thu);
        tick(() => {
          const slot = document.querySelector('[data-time="14:00"]');
          if (slot) click(slot);
          tick(() => {
            const book = document.querySelector('#book-demo');
            if (book) click(book);
          }, 1100);
        }, 1100);
      }],
    ],
  };

  const players = new Map();

  function makePlayer(step) {
    const id = step.id;
    const script = scripts[id];
    const timers = new Set();
    let taken = false; // the visitor has taken the controls
    let active = false;

    const tick = (fn, ms) => {
      const t = setTimeout(() => { timers.delete(t); if (active && !taken && !still()) fn(); }, ms);
      timers.add(t);
      return t;
    };
    const click = (el) => el.click();

    // Real interaction wins: the demo never grabs the controls back.
    const stage = step.querySelector('.workflow-stage');
    const takeover = () => { taken = true; timers.forEach(clearTimeout); timers.clear(); };
    if (stage) {
      stage.addEventListener('pointerdown', takeover, { passive: true });
      stage.addEventListener('keydown', takeover);
    }

    return {
      start() {
        if (taken || active || !script || still()) return;
        active = true;
        script(tick, click).forEach(([ms, fn]) => tick(fn, ms));
      },
      stop() {
        active = false;
        timers.forEach(clearTimeout);
        timers.clear();
      },
    };
  }

  steps.forEach(step => players.set(step, makePlayer(step)));

  // A step is "on stage" while its node sits near the viewport centre.
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const player = players.get(entry.target);
      if (!player) return;
      if (entry.isIntersecting) player.start();
      else player.stop();
    });
  }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 });

  steps.forEach(step => observer.observe(step));
})();
