(() => {
  const scripts = {
    plan: {
      duration: 8000,
      cues: [
        { at: 0, target: 'goal', values: { build: 'Build brief' } },
        { at: 1750, target: 'build' },
        { at: 2650, target: 'build', values: { build: 'Building…' }, click: true },
        { at: 3650, target: 'brief', values: { build: 'Brief created' } },
        { at: 5200 },
      ],
    },
    measure: {
      duration: 11000,
      cues: [
        { at: 0, metric: 'enquiries', values: { metric: 'Enquiries', 'cost-a': '120', 'cost-b': '40', result: 'Ad A has three times as many enquiries' } },
        { at: 1100, target: 'results-a' },
        { at: 3100, target: 'results-b' },
        { at: 5250, target: 'metric' },
        { at: 6250, target: 'metric', click: true, metric: 'tours', values: { metric: 'Cost per attended tour', 'cost-a': 'AED 1,200', 'cost-b': 'AED 300', result: 'Ad B costs 75% less per attended Year 7 tour' } },
        { at: 7850 },
      ],
    },
    decide: {
      duration: 9000,
      cues: [
        { at: 0, values: { review: 'In review' } },
        { at: 1150, target: 'scale' },
        { at: 2600, target: 'pause' },
        { at: 4050, target: 'test' },
        { at: 5600, target: 'allocation', values: { review: 'Reviewed' } },
        { at: 7000 },
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

    return {
      stage, screen, controls, button, cursor,
      script: scripts[stage.dataset.film],
      fields: [...stage.querySelectorAll('[data-film-value]')],
      reveals: [...stage.querySelectorAll('[data-film-reveal]')],
      targets: [...stage.querySelectorAll('[data-film-target]')],
      time: controls.querySelector('.film-time'),
      name: button.getAttribute('aria-label').replace(/^Play /, ''),
      elapsed: 0,
      cue: -1,
      ratio: 0,
      started: false,
      paused: false,
    };
  });
  if (!films.length) return;

  let frame = 0;
  let lastTime = null;
  let current = null;
  let requested = null;
  let still;

  function stamp(milliseconds) {
    return `0:${String(Math.floor(milliseconds / 1000)).padStart(2, '0')}`;
  }

  function updateControl(film) {
    const complete = film.elapsed >= film.script.duration;
    const playing = current === film && film.started && !film.paused && !complete && !still;
    const action = complete ? 'Replay' : playing ? 'Pause' : 'Play';
    film.button.setAttribute('aria-label', `${action} ${film.name}`);
    film.button.firstElementChild.textContent = complete ? '↻' : playing ? 'Ⅱ' : '▶';
    film.button.lastElementChild.textContent = action;
  }

  function positionCursor(film) {
    if (!film.focus) return;
    const bounds = film.focus.getBoundingClientRect();
    const screen = film.screen.getBoundingClientRect();
    film.cursor.style.setProperty('--cursor-x', `${bounds.left - screen.left + bounds.width * .83}px`);
    film.cursor.style.setProperty('--cursor-y', `${bounds.top - screen.top + bounds.height * .72}px`);
  }

  function renderCue(film, index, staticFrame) {
    const cues = film.script.cues.slice(0, index + 1);
    const cue = cues[index];
    const values = Object.assign({}, ...cues.map(item => item.values));
    const metric = cues.findLast(item => item.metric)?.metric;

    film.cue = staticFrame ? -1 : index;
    if (staticFrame) delete film.stage.dataset.filmPhase;
    else film.stage.dataset.filmPhase = index;
    if (metric) film.stage.dataset.filmMetric = metric;

    film.reveals.forEach(item => item.toggleAttribute('data-film-pending', Number(item.dataset.filmReveal) > index));
    film.fields.forEach(field => {
      const value = values[field.dataset.filmValue];
      if (value !== undefined && field.textContent !== value) field.textContent = value;
    });
    film.focus = staticFrame ? null : film.targets.find(target => target.dataset.filmTarget === cue.target);
    film.targets.forEach(target => target.toggleAttribute('data-film-focus', target === film.focus));
    positionCursor(film);
    film.cursor.classList.toggle('is-visible', Boolean(film.focus));
    film.cursor.classList.toggle('is-clicking', Boolean(film.focus && cue.click));
  }

  function paint(film) {
    const { cues, duration } = film.script;
    const index = cues.findLastIndex(cue => cue.at <= film.elapsed);
    if (index !== film.cue) renderCue(film, index, false);

    if (film.stage.dataset.film === 'plan') {
      // Clip the sample text while typing and keep its layout footprint fixed.
      const typed = Math.min(20, Math.max(0, Math.floor((film.elapsed - 200) / 59)));
      if (typed !== film.typed) {
        film.screen.style.setProperty('--film-typed', `${typed * 5}%`);
        film.typed = typed;
      }
    }

    film.controls.style.setProperty('--film-progress', film.elapsed / duration);
    const time = `${stamp(film.elapsed)} / ${stamp(duration)}`;
    if (film.time.textContent !== time) film.time.textContent = time;
  }

  function showStill(film) {
    renderCue(film, film.script.cues.length - 1, true);
    film.screen.style.removeProperty('--film-typed');
    film.typed = undefined;
  }

  function restart(film) {
    film.started = true;
    film.elapsed = 0;
    film.cue = -1;
    film.stage.setAttribute('data-film-reset', '');
    paint(film);
    // Commit the first frame before restoring transitions on replay.
    requestAnimationFrame(() => film.stage.removeAttribute('data-film-reset'));
  }

  function setMotion() {
    const next = preference.matches || root.classList.contains('motion-paused');
    if (next === still) return;
    still = next;
    lastTime = null;
    films.forEach(film => {
      film.controls.hidden = still;
      if (still || !film.started) showStill(film);
      else paint(film);
      if (!film.started) film.time.textContent = `0:00 / ${stamp(film.script.duration)}`;
      updateControl(film);
    });
    schedule();
  }

  function tick(now) {
    frame = 0;
    const available = !still && !document.hidden;
    const eligible = film => !film.paused && film.elapsed < film.script.duration;
    let active = null;

    if (available) {
      if (requested?.ratio > 0 && eligible(requested)) {
        active = requested;
      } else {
        requested = null;
        // Start only once the film is readable. Keep a playing film through
        // small changes in visibility at the edge of the viewport.
        if (current?.ratio >= .4 && eligible(current)) active = current;
        else active = films.reduce((best, film) => (
          film.ratio >= .6 && eligible(film) && (!best || film.ratio > best.ratio) ? film : best
        ), null);
      }
    }

    if (current !== active) {
      const previous = current;
      current = active;
      lastTime = null;
      if (previous) updateControl(previous);
      if (active) {
        if (!active.started) restart(active);
        updateControl(active);
      }
    }
    if (!active) return;

    if (lastTime !== null) active.elapsed = Math.min(active.script.duration, active.elapsed + now - lastTime);
    lastTime = now;
    paint(active);
    if (active.elapsed >= active.script.duration) updateControl(active);
    schedule();
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      films.find(film => film.stage === entry.target).ratio = entry.intersectionRatio;
    });
    schedule();
  }, { threshold: [0, .4, .6, .8, 1] });
  const resizeObserver = new ResizeObserver(() => films.forEach(positionCursor));

  films.forEach(film => {
    observer.observe(film.stage);
    resizeObserver.observe(film.screen);
    film.button.addEventListener('click', () => {
      if (film === current && !film.paused && film.elapsed < film.script.duration) {
        film.paused = true;
      } else {
        if (!film.started || film.elapsed >= film.script.duration) restart(film);
        film.paused = false;
        requested = film;
      }
      updateControl(film);
      schedule();
    });
  });
  document.addEventListener('visibilitychange', () => {
    lastTime = null;
    schedule();
  });
  preference.addEventListener('change', setMotion);
  new MutationObserver(setMotion).observe(root, { attributes: true, attributeFilter: ['class'] });
  setMotion();
})();
