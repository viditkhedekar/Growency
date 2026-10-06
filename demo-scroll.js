(() => {
  const track = document.querySelector('.journey-track');
  if (!track) return;
  const root = document.documentElement;
  const steps = [...track.querySelectorAll('.story-step')];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1101px) and (min-height: 740px)');
  const scene = document.createElement('div');
  scene.className = 'demo-scroll';
  const pin = document.createElement('div');
  pin.className = 'demo-pin';
  track.before(scene);
  scene.append(pin);
  pin.append(track);

  const progress = document.createElement('aside');
  progress.className = 'demo-progress';
  progress.setAttribute('aria-label', 'Workflow stages');
  const labels = ['Find', 'Research', 'Reach out', 'Book'];
  progress.innerHTML = `<ol>${labels.map((label, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span><b>${label}</b><i aria-hidden="true"></i></li>`).join('')}</ol><div class="demo-progress-total" role="progressbar" aria-label="Workflow progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="demo-progress-count">01 / 04</span><span>Scroll to continue ↓</span></div>`;
  pin.prepend(progress);
  const rows = [...progress.querySelectorAll('li')];
  const meter = progress.querySelector('[role="progressbar"]');
  const fills = rows.map(row => row.querySelector('i'));
  let filmGeometry = [], progressValues = [], lastPercent = -1;
  let enabled = false, start = 0, distance = 0, index = -1, frame = 0, measureFrame = 0;
  let inview = false, viewportWidth = innerWidth, viewportHeight = innerHeight;
  function measureFilms() {
    filmGeometry = steps.map(step => {
      const r = step.querySelector('.campaign-stage').getBoundingClientRect();
      return { top: r.top + scrollY, height: r.height };
    });
  }
  function paintProgress(values, percent) {
    values.forEach((value, i) => {
      if (value !== progressValues[i]) fills[i].style.setProperty('--step-progress', value);
    });
    progressValues = values;
    if (percent !== lastPercent) { meter.setAttribute('aria-valuenow', String(percent)); lastPercent = percent; }
  }

  function select(next) {
    if (next === index) return;
    index = next;
    scene.dataset.demoStep = steps[index].id;
    steps.forEach((step, i) => {
      step.classList.toggle('demo-active', i === index);
      step.inert = enabled && i !== index;
      if (enabled && i !== index) step.setAttribute('aria-hidden', 'true');
      else step.removeAttribute('aria-hidden');
    });
    rows.forEach((row, i) => {
      row.classList.toggle('is-current', i === index);
      row.classList.toggle('is-complete', i < index);
      if (i === index) row.setAttribute('aria-current', 'step');
      else row.removeAttribute('aria-current');
    });
    progress.querySelector('.demo-progress-count').textContent = `${String(index + 1).padStart(2, '0')} / 04`;
    document.dispatchEvent(new CustomEvent('growency:demo-step', { detail: { step: steps[index] } }));
  }

  function update() {
    frame = 0;
    if (!enabled) {
      root.classList.remove('demo-pinned');
      let closest = -1, best = 0;
      filmGeometry.forEach((film, i) => {
        const r = { top: film.top - scrollY, bottom: film.top + film.height - scrollY, height: film.height };
        const overlap = Math.max(0, Math.min(r.bottom, innerHeight - 24) - Math.max(r.top, 100));
        const score = overlap / Math.min(r.height, Math.max(1, innerHeight - 124));
        if (overlap > 80 && score > best) { closest = i; best = score; }
      });
      inview = closest !== -1;
      root.classList.toggle('demo-inview', inview);
      if (inview) {
        select(closest);
        const film = filmGeometry[closest];
        const fraction = Math.max(0, Math.min(1, (scrollY + innerHeight / 2 - film.top) / film.height));
        paintProgress(rows.map((row, i) => i < closest ? 1 : i === closest ? fraction : 0), Math.round((closest + fraction) / steps.length * 100));
      }
      return;
    }
    const travelled = Math.max(0, Math.min(distance * steps.length, scrollY - start));
    const next = Math.min(steps.length - 1, Math.floor(travelled / distance));
    select(next);
    paintProgress(rows.map((row, i) => Math.max(0, Math.min(1, travelled / distance - i))), Math.round(travelled / (distance * steps.length) * 100));
    const pinned = scrollY >= start - 1 && scrollY < start + distance * steps.length;
    inview = pinned;
    root.classList.toggle('demo-pinned', pinned);
    root.classList.toggle('demo-inview', pinned);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }

  function scaleFilms() {
    if (!enabled) return;
    steps.forEach(step => {
      const stage = step.querySelector('.campaign-stage');
      const available = Math.max(1, innerHeight - 160);
      const scale = Math.min(1, available / stage.offsetHeight);
      step.style.setProperty('--demo-scale', scale);
      step.style.setProperty('--demo-scaled-height', `${stage.offsetHeight * scale}px`);
    });
  }
  function measure() {
    measureFrame = 0;
    const wasEnabled = enabled, previousIndex = Math.max(0, index);
    const wasViewing = inview;
    const fraction = distance ? Math.max(0, Math.min(.99, (scrollY - start) / distance - previousIndex)) : 0;
    const reflow = viewportWidth !== innerWidth;
    const resized = reflow || viewportHeight !== innerHeight;
    enabled = desktop.matches && !preference.matches;
    root.classList.toggle('has-pinned-demos', enabled);
    viewportWidth = innerWidth; viewportHeight = innerHeight;
    distance = innerHeight * 1.1;
    scene.style.setProperty('--demo-viewport-height', `${innerHeight}px`);
    scene.style.setProperty('--demo-scroll-height', `${innerHeight + distance * steps.length}px`);
    start = scene.getBoundingClientRect().top + scrollY;
    if (!enabled) {
      steps.forEach(step => {
        step.inert = false;
        step.removeAttribute('aria-hidden');
        step.classList.remove('demo-active');
      });
    }
    if (wasViewing && (wasEnabled !== enabled || (resized && (wasEnabled || enabled || reflow)))) {
      const stage = steps[previousIndex].querySelector('.campaign-stage');
      const top = enabled ? start + (previousIndex + fraction) * distance + 1 : stage.getBoundingClientRect().top + scrollY - 150;
      if (window.GROWENCY_SCROLL) window.GROWENCY_SCROLL.to(top, { immediate: true });
      else window.scrollTo({ top, behavior: 'instant' });
    }
    if (enabled) {
      // Reapply inert state when returning from the normal-flow layout.
      if (!wasEnabled) index = -1;
      select(Math.min(steps.length - 1, Math.max(0, Math.floor((scrollY - start) / distance))));
      scaleFilms();
    }
    measureFilms();
    update();
    document.dispatchEvent(new CustomEvent('growency:demo-layout'));
  }
  function scheduleMeasure() {
    if (!measureFrame) measureFrame = requestAnimationFrame(measure);
  }
  // Animation content changes height without resizing the pinned page itself.
  let scaleFrame = 0;
  function filmsResized() {
    if (!scaleFrame) scaleFrame = requestAnimationFrame(() => {
      scaleFrame = 0; scaleFilms();
      if (!enabled) { measureFilms(); schedule(); }
    });
  }
  new ResizeObserver(filmsResized).observe(track);
  const filmObserver = new ResizeObserver(filmsResized);
  steps.forEach(step => filmObserver.observe(step.querySelector('.campaign-stage')));

  window.GROWENCY_DEMOS = {
    get enabled() { return enabled; },
    get activeStep() { return inview ? steps[index] : null; },
    get pinned() { return enabled && scrollY >= start && scrollY < start + distance * steps.length; },
    milestoneY(node) {
      const step = node.closest('.story-step');
      return enabled && step ? start + steps.indexOf(step) * distance + innerHeight / 2 : node.getBoundingClientRect().top + scrollY + node.offsetHeight / 2;
    },
    scrollToStep(step) {
      const i = steps.indexOf(step);
      if (i < 0) return false;
      const top = enabled ? start + i * distance + 1 : step.getBoundingClientRect().top + scrollY - 150;
      if (window.GROWENCY_SCROLL) window.GROWENCY_SCROLL.to(top);
      else window.scrollTo({ top, behavior: 'smooth' });
      return true;
    },
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', scheduleMeasure, { passive: true });
  addEventListener('load', measure, { once: true });
  function followHash() {
    const step = steps.find(step => `#${step.id}` === location.hash);
    if (step) window.GROWENCY_DEMOS.scrollToStep(step);
  }
  addEventListener('load', followHash, { once: true });
  addEventListener('hashchange', followHash);
  preference.addEventListener('change', scheduleMeasure);
  document.fonts?.ready.then(scheduleMeasure);
  new ResizeObserver(scheduleMeasure).observe(document.body);
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  measure();
})();
