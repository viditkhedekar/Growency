(() => {
  const track = document.querySelector('.journey-track');
  if (!track) return;
  const root = document.documentElement;
  const steps = [...track.querySelectorAll('.story-step')];
  const toggle = document.querySelector('.motion-toggle');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  let frame = 0;
  let observer;
  const dock = document.querySelector('.journey-dock');
  const labels = ['Finding your people', 'Doing the homework', 'Starting conversations', 'Getting you booked'];
  let currentStep = 0;
  const timers = new Set();
  function finishCounters() {
    timers.forEach(clearTimeout);
    timers.clear();
    document.querySelectorAll('.prospect-count').forEach(el => { el.textContent = el.dataset.total || '4'; });
  }
  function play(step) {
    step.classList.add('is-playing');
    const counter = step.querySelector('.prospect-count');
    if (counter) {
      finishCounters();
      counter.textContent = '0';
      const originalTotal = counter.dataset.total;
      Array.from({ length: Number(counter.dataset.total || 4) }, (_, index) => (index + 1) * 350).forEach((delay, index) => {
        const timer = setTimeout(() => {
          if (counter.dataset.total === originalTotal) counter.textContent = String(index + 1);
          timers.delete(timer);
        }, delay);
        timers.add(timer);
      });
    }
  }

  function update() {
    frame = 0;
    const rect = track.getBoundingClientRect();
    const position = Math.max(0, Math.min(rect.height, innerHeight * .5 - rect.top));
    const paused = userPaused || preference.matches;
    if (!paused) {
      track.style.setProperty('--journey-progress', String(position / rect.height));
      track.style.setProperty('--traveller-y', `${position}px`);
    }
    currentStep = 0;
    let nearest = Infinity;
    steps.forEach((step, index) => {
      const node = step.querySelector('.step-node').getBoundingClientRect();
      const distance = Math.abs(node.top + node.height / 2 - innerHeight * .5);
      const passed = node.top + node.height / 2 <= innerHeight * .5 + 18;
      step.classList.toggle('is-passed', passed);
      if (distance < nearest) { nearest = distance; currentStep = index; }
    });
    dock.hidden = rect.top > innerHeight * .45 || rect.bottom < innerHeight * .4;
    dock.querySelector('.dock-count').textContent = `0${currentStep + 1} / 04`;
    dock.querySelector('.dock-label').textContent = labels[currentStep];
    dock.setAttribute('aria-label', `Current step: ${labels[currentStep]}. Go to ${currentStep < 3 ? labels[currentStep + 1] : 'Let’s talk growth'}`);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function configure() {
    const paused = userPaused || preference.matches;
    if (paused) finishCounters();
    root.classList.toggle('motion-enabled', !paused);
    root.classList.toggle('motion-paused', paused);
    toggle.hidden = preference.matches;
    document.querySelectorAll('.replay').forEach(button => { button.hidden = paused; });
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.querySelector('.motion-label').textContent = userPaused ? 'Resume motion' : 'Pause motion';
    toggle.firstElementChild.textContent = userPaused ? '▷' : 'Ⅱ';
    if (observer) observer.disconnect();
    if (!paused && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            play(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: .15 });
      steps.forEach(step => observer.observe(step));
    } else {
      steps.forEach(step => step.classList.add('is-visible'));
    }
    schedule();
  }
  dock.addEventListener('click', () => {
    const target = steps[currentStep + 1] || document.querySelector('.journey-end');
    target.scrollIntoView({ behavior: userPaused || preference.matches ? 'instant' : 'smooth', block: 'center' });
  });
  document.querySelectorAll('.replay').forEach(button => {
    button.addEventListener('click', () => {
      const step = button.closest('.story-step');
      step.classList.remove('is-playing');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!userPaused && !preference.matches) play(step);
      }));
    });
  });
  toggle.addEventListener('click', () => { userPaused = !userPaused; configure(); });
  preference.addEventListener('change', configure);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('load', schedule, { once: true });
  configure();
})();
