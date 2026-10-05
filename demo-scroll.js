(() => {
  const track = document.querySelector('.journey-track');
  if (!track) return;
  const root = document.documentElement;
  const steps = [...track.querySelectorAll('.story-step')];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 901px) and (min-height: 700px)');
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
  pin.append(progress);
  const rows = [...progress.querySelectorAll('li')];
  let enabled = false, start = 0, distance = 0, index = -1, frame = 0;

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
      const bounds = scene.getBoundingClientRect();
      const visible = bounds.top < innerHeight * .3 && bounds.bottom > innerHeight * .3;
      root.classList.toggle('demo-inview', visible);
      if (visible) {
        let closest = 0, nearest = Infinity;
        steps.forEach((step, i) => {
          const r = step.getBoundingClientRect();
          const delta = Math.abs(r.top + r.height / 2 - innerHeight / 2);
          if (delta < nearest) { closest = i; nearest = delta; }
        });
        select(closest);
        const r = steps[closest].getBoundingClientRect();
        const fraction = Math.max(0, Math.min(1, (innerHeight / 2 - r.top) / r.height));
        rows.forEach((row, i) => row.style.setProperty('--step-progress', i < closest ? 1 : i === closest ? fraction : 0));
        progress.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(Math.round((closest + fraction) / steps.length * 100)));
      }
      return;
    }
    const travelled = Math.max(0, Math.min(distance * steps.length, scrollY - start));
    const next = Math.min(steps.length - 1, Math.floor(travelled / distance));
    select(next);
    rows.forEach((row, i) => row.style.setProperty('--step-progress', Math.max(0, Math.min(1, travelled / distance - i))));
    progress.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(Math.round(travelled / (distance * steps.length) * 100)));
    const pinned = scrollY >= start - 1 && scrollY < start + distance * steps.length;
    root.classList.toggle('demo-pinned', pinned);
    root.classList.toggle('demo-inview', pinned);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }

  function measure() {
    enabled = desktop.matches && !preference.matches;
    root.classList.toggle('has-pinned-demos', enabled);
    distance = innerHeight * 1.1;
    scene.style.setProperty('--demo-scroll-height', `${innerHeight + distance * steps.length}px`);
    start = scene.getBoundingClientRect().top + scrollY;
    index = -1;
    if (enabled) {
      select(Math.min(steps.length - 1, Math.max(0, Math.floor((scrollY - start) / distance))));
      steps.forEach(step => {
        const stage = step.querySelector('.campaign-stage');
        const available = innerHeight - 145;
        const scale = Math.min(1, available / stage.offsetHeight);
        step.style.setProperty('--demo-scale', scale);
        step.style.setProperty('--demo-scaled-height', `${stage.offsetHeight * scale}px`);
      });
    } else {
      steps.forEach(step => {
        step.inert = false;
        step.removeAttribute('aria-hidden');
        step.classList.remove('demo-active');
      });
    }
    schedule();
  }

  window.GROWENCY_DEMOS = {
    get enabled() { return enabled; },
    get activeStep() { return enabled ? steps[index] : null; },
    get pinned() { return enabled && scrollY >= start && scrollY < start + distance * steps.length; },
    milestoneY(node) {
      const step = node.closest('.story-step');
      return enabled && step ? start + steps.indexOf(step) * distance + innerHeight / 2 : node.getBoundingClientRect().top + scrollY + node.offsetHeight / 2;
    },
    scrollToStep(step) {
      const i = steps.indexOf(step);
      if (!enabled || i < 0) return false;
      const top = start + i * distance + 1;
      if (window.GROWENCY_SCROLL) window.GROWENCY_SCROLL.to(top);
      else window.scrollTo({ top, behavior: 'smooth' });
      return true;
    },
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure, { once: true });
  function followHash() {
    const step = steps.find(step => `#${step.id}` === location.hash);
    if (step) window.GROWENCY_DEMOS.scrollToStep(step);
  }
  addEventListener('load', followHash, { once: true });
  addEventListener('hashchange', followHash);
  preference.addEventListener('change', measure);
  document.fonts?.ready.then(measure);
  new ResizeObserver(measure).observe(document.body);
  measure();
})();
