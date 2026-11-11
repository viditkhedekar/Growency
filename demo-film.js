(() => {
  const scripts = {
    plan: {
      duration: 4000,
      cues: [
        { at: 0, target: 'goal', values: { goal: 'Fill school places' } },
        { at: 360, target: 'goal', shot: 'saas', values: { goal: 'Book SaaS demos' } },
        { at: 720, target: 'goal', shot: 'store', values: { goal: 'Sell more products' } },
        { at: 1080, target: 'goal', shot: 'service', values: { goal: 'Get quote requests' } },
        { at: 1450, target: 'goal', values: { goal: 'Fill Year 7 places' } },
        { at: 2050, target: 'brief' },
        { at: 3150 },
      ],
    },
    create: {
      duration: 4000,
      cues: [
        { at: 0, shot: 'relocation', values: { hook: 'Moving to Dubai?', format: 'Carousel', variant: 'Statement opening' } },
        { at: 480, shot: 'school-day', values: { hook: 'Tour a school day', format: 'Static ad' } },
        { at: 960, shot: 'week-one', values: { hook: 'First week of Year 7', format: 'Motion graphic', variant: 'Question opening' } },
        { at: 1580, target: 'ad-a' },
        { at: 2280, target: 'ad-b' },
        { at: 3150 },
      ],
    },
    measure: {
      duration: 5000,
      cues: [
        { at: 0, target: 'metric', shot: 'chart', metric: 'enquiries', values: { metric: 'Enquiries', 'cost-a': '120', 'cost-b': '40', result: 'A leads on enquiry volume' } },
        { at: 300, shot: 'result-a' },
        { at: 730, target: 'results-a', shot: 'result-a' },
        { at: 1280, shot: 'result-b' },
        { at: 1720, target: 'results-b', shot: 'result-b' },
        { at: 2650, target: 'metric', shot: 'chart', metric: 'tours', values: { metric: 'Cost per attended Year 7 tour', 'cost-a': 'AED 1,200', 'cost-b': 'AED 300', result: 'Lower is better · B costs 75% less per attended tour' } },
        { at: 3750 },
      ],
    },
    decide: {
      duration: 4000,
      cues: [
        { at: 0, values: { review: 'In review' } },
        { at: 440, target: 'scale' },
        { at: 990, target: 'pause' },
        { at: 1540, target: 'test' },
        { at: 2240, target: 'allocation', values: { review: 'Reviewed' } },
        { at: 3150 },
      ],
    },
  };
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const films = [...document.querySelectorAll('.demo-film')].map(stage => {
    const screen = stage.querySelector('.film-content');
    const controls = stage.querySelector('.film-controls');
    const button = controls.querySelector('button');
    const cursor = document.createElement('span');
    cursor.className = 'film-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<svg viewBox="0 0 21 27" fill="currentColor" stroke="white" stroke-width="1.6" stroke-linejoin="round"><path d="M3 2l15 14-7 1-3 7Z"/></svg>';
    screen.append(cursor);
    const film = {
      stage, screen, controls, button, cursor,
      step: stage.closest('.story-step'),
      script: scripts[stage.dataset.film],
      fields: [...stage.querySelectorAll('[data-film-value]')],
      reveals: [...stage.querySelectorAll('[data-film-reveal]')],
      targets: [...stage.querySelectorAll('[data-film-target]')],
      time: controls.querySelector('.film-time'),
      name: button.getAttribute('aria-label').replace(/^Play /, ''),
      elapsed: 0, cue: -1, started: false, paused: false,
    };
    button.addEventListener('click', () => {
      if (film.elapsed >= film.script.duration) {
        film.elapsed = 0;
        film.cue = -1;
      } else if (film.started && !film.paused) {
        film.paused = true;
        updateControl(film);
        schedule();
        return;
      }
      film.started = true;
      film.paused = false;
      lastTime = null;
      updateControl(film);
      schedule();
    });
    return film;
  });

  let frame = 0;
  let lastTime = null;
  let current = null;
  let still;

  function stamp(milliseconds) {
    return `0:${String(Math.floor(milliseconds / 1000)).padStart(2, '0')}`;
  }

  function updateControl(film) {
    const complete = film.elapsed >= film.script.duration;
    const playing = film.started && !film.paused && !complete;
    const action = complete ? 'Replay' : playing ? 'Pause' : 'Play';
    film.button.setAttribute('aria-label', `${action} ${film.name}`);
    film.button.firstElementChild.textContent = complete ? '↻' : playing ? 'Ⅱ' : '▶';
    film.button.lastElementChild.textContent = action;
  }

  function positionCamera(film) {
    const target = film.focus;
    const screen = film.screen;
    const frameBounds = screen.getBoundingClientRect();
    const width = screen.offsetWidth;
    const height = screen.offsetHeight;
    if (!target || !frameBounds.width || !frameBounds.height) {
      screen.style.setProperty('--film-zoom', 1);
      screen.style.setProperty('--film-x', '0px');
      screen.style.setProperty('--film-y', '0px');
      return;
    }
    const bounds = (target.closest('[data-film-frame]') || target).getBoundingClientRect();
    const pointer = target.getBoundingClientRect();
    // Convert back to workspace pixels even while the previous shot is moving.
    const scaleX = width / frameBounds.width;
    const scaleY = height / frameBounds.height;
    const targetX = (bounds.left - frameBounds.left) * scaleX;
    const targetY = (bounds.top - frameBounds.top) * scaleY;
    const targetWidth = bounds.width * scaleX;
    const targetHeight = bounds.height * scaleY;
    const zoom = Math.max(1, Math.min(width < 490 ? 1.12 : 1.24, (width - 24) / targetWidth, (height - 24) / targetHeight));
    const x = width / 2 - (targetX + targetWidth / 2) * zoom;
    const y = height / 2 - (targetY + targetHeight / 2) * zoom;
    screen.style.setProperty('--film-zoom', zoom);
    screen.style.setProperty('--film-x', `${Math.min(0, Math.max(width * (1 - zoom), x))}px`);
    screen.style.setProperty('--film-y', `${Math.min(0, Math.max(height * (1 - zoom), y))}px`);
    const cursorX = (pointer.left - frameBounds.left + pointer.width * .78) * scaleX;
    const cursorY = (pointer.top - frameBounds.top + pointer.height * .64) * scaleY;
    film.cursor.style.setProperty('--cursor-x', `${cursorX}px`);
    film.cursor.style.setProperty('--cursor-y', `${cursorY}px`);
  }

  function renderCue(film, index, staticFrame = false) {
    const cues = film.script.cues.slice(0, index + 1);
    const cue = cues[index];
    const values = Object.assign({}, ...cues.map(item => item.values));
    const metric = cues.findLast(item => item.metric)?.metric;
    const priorMetric = film.stage.dataset.filmMetricMode;
    const rankChanges = index > 0 && metric && priorMetric && metric !== priorMetric && !staticFrame && !still;
    const rows = rankChanges ? [...film.stage.querySelectorAll('.film-bar-row')] : [];
    const rowTops = rows.map(row => row.getBoundingClientRect().top);
    film.cue = index;
    film.stage.dataset.filmShot = staticFrame ? '' : cue.shot || '';
    film.reveals.forEach(item => item.toggleAttribute('data-film-pending', Number(item.dataset.filmReveal) > index));
    if (metric) film.stage.dataset.filmMetricMode = metric;
    film.fields.forEach(field => {
      const value = values[field.dataset.filmValue];
      if (value && field.textContent !== value) field.textContent = value;
    });
    if (rows.length && film.screen.offsetHeight) {
      const scale = film.screen.getBoundingClientRect().height / film.screen.offsetHeight || 1;
      rows.forEach((row, i) => {
        const delta = (rowTops[i] - row.getBoundingClientRect().top) / scale;
        row.animate([{ translate: `0 ${delta}px` }, { translate: '0 0' }], {
          duration: 290,
          easing: 'cubic-bezier(.22,1,.36,1)',
        });
      });
    }
    film.focus = staticFrame ? null : film.targets.find(target => target.dataset.filmTarget === cue.target);
    film.targets.forEach(target => target.toggleAttribute('data-film-focus', target === film.focus));
    positionCamera(film);
    film.cursor.classList.toggle('is-visible', Boolean(film.focus));
  }

  function paint(film) {
    const { cues, duration } = film.script;
    const index = cues.findLastIndex(cue => cue.at <= film.elapsed);
    if (index !== film.cue) renderCue(film, index, film.elapsed >= duration);
    film.controls.style.setProperty('--film-progress', film.elapsed / duration);
    const time = `${stamp(film.elapsed)} / ${stamp(Math.ceil(duration / 1000) * 1000)}`;
    if (film.time.textContent !== time) film.time.textContent = time;
  }

  function setMotion() {
    const next = preference.matches || root.classList.contains('motion-paused');
    if (next === still) return;
    still = next;
    lastTime = null;
    films.forEach(film => {
      film.controls.hidden = still;
      film.cue = -1;
      if (still) {
        // Restore the complete sample workspace while motion is off.
        renderCue(film, film.script.cues.length - 1, true);
        film.cue = -1;
      } else if (film.started) {
        paint(film);
        updateControl(film);
      }
    });
    schedule();
  }

  function tick(now) {
    frame = 0;
    const visible = window.GROWENCY_DEMOS?.activeStep;
    const active = !still && !document.hidden && films.find(film => film.step === visible);
    if (current !== active) {
      current = active;
      lastTime = null;
    }
    if (!active || active.paused || active.elapsed >= active.script.duration) return;
    if (!active.started) {
      active.started = true;
      updateControl(active);
    }
    if (lastTime !== null) active.elapsed = Math.min(active.script.duration, active.elapsed + now - lastTime);
    lastTime = now;
    paint(active);
    if (active.elapsed < active.script.duration) schedule();
    else {
      active.cursor.classList.remove('is-visible');
      active.focus?.removeAttribute('data-film-focus');
      updateControl(active);
      lastTime = null;
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function refreshLayout() {
    if (current) positionCamera(current);
    schedule();
  }

  addEventListener('scroll', schedule, { passive: true });
  document.addEventListener('growency:demo-step', schedule);
  document.addEventListener('growency:demo-layout', refreshLayout);
  document.addEventListener('visibilitychange', () => {
    lastTime = null;
    schedule();
  });
  preference.addEventListener('change', setMotion);
  new MutationObserver(setMotion).observe(root, { attributes: true, attributeFilter: ['class'] });
  setMotion();
})();
