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
  const chapters = [...document.querySelectorAll('#top,#work,#pitch,.journey-intro,.story-step,#founder,#team,#pilot,#pricing,#faq,#contact')];
  const labels = ['The first conversation', 'Worked with', 'The hedge fund for sales', 'The workflow', 'Finding your people', 'Doing the homework', 'Starting conversations', 'Getting you booked', 'Why we started', 'The team', 'The pilot', 'Pricing', 'Your questions', 'The next trade'];
  let currentChapter = 0;
  let currentScene = -1;
  let chapterGeometry = [], milestonePositions = [], stepPositions = [], pageHeight = 1;
  let measureFrame = 0, displayedChapter = -1;
  const dockCount = dock.querySelector('.dock-count');
  const dockLabel = dock.querySelector('.dock-label');
  const scenePalettes = [
    // Distinct, restrained chapter colours: blue, lilac, periwinkle and teal.
    // Keep light fields pale enough for ink copy and dark fields behind white copy.
    ['#f8f7f3','#090619'], ['#eee3f4','#241833'], ['#e2eafb','#162747'],
    ['#efe8f4','#201930'], ['#d3e6f7','#172d48'], ['#e5d5ee','#2b1c3b'],
    ['#dce0f5','#202549'], ['#d5e9e7','#153438'], ['#e9ddef','#2a1a38'],
    ['#dde7f3','#182d40'], ['#f0e4d8','#2b2332'], ['#dbe9ee','#1a303e'], ['#e5dff1','#252039'],
    ['#dfe0f3','#251c40']
  ];
  const milestones = chapters.map((chapter, index) => {
    chapter.dataset.scenePaper = scenePalettes[index][0];
    chapter.dataset.sceneNight = scenePalettes[index][1];
    let node = chapter.querySelector('.step-node');
    if (!node) {
      node = document.createElement('span'); node.className = 'scene-node';
      node.setAttribute('aria-hidden','true');
      node.innerHTML = `<svg viewBox="0 0 120 120"><use href="#mark"/></svg><span>${String(index + 1).padStart(2,'0')}</span>`;
      chapter.append(node);
    }
    node.dataset.chapter = String(index);
    return node;
  });
  const timers = new Set();
  function measure() {
    measureFrame = 0;
    pageHeight = document.body.scrollHeight;
    const milestoneY = node => window.GROWENCY_DEMOS?.milestoneY(node) ?? node.getBoundingClientRect().top + scrollY + node.offsetHeight / 2;
    milestonePositions = milestones.map(milestoneY);
    stepPositions = steps.map(step => milestoneY(step.querySelector('.step-node')));
    chapterGeometry = chapters.map(chapter => {
      const r = chapter.getBoundingClientRect();
      return { top: r.top + scrollY, bottom: r.bottom + scrollY, middle: r.top + scrollY + r.height / 2 };
    });
    schedule();
  }
  function scheduleMeasure() {
    if (!measureFrame) measureFrame = requestAnimationFrame(measure);
  }
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
    const pagePosition = Math.max(0, Math.min(pageHeight, scrollY + innerHeight * .5));
    const paused = userPaused || preference.matches;
    if (!paused && !root.classList.contains('routed-rail')) {
      document.body.style.setProperty('--site-progress', String(pagePosition / pageHeight));
      document.body.style.setProperty('--site-traveller-y', `${pagePosition}px`);
    }
    steps.forEach((step, index) => {
      const passed = stepPositions[index] <= pagePosition + 1;
      step.classList.toggle('is-passed', passed);
    });
    let scene = 0;
    milestones.forEach((node,index) => {
      const passed = milestonePositions[index] <= pagePosition + 1;
      node.classList.toggle('milestone-reached',passed);
      if (passed) scene = index;
    });
    if (scene !== currentScene) {
      const previous = currentScene;
      currentScene = scene;
      root.dataset.scene = String(scene);
      milestones.forEach((node,index)=>node.classList.toggle('milestone-current',index===scene));
      if (!paused && previous !== -1) {
        milestones[scene].classList.remove('milestone-arrived');
        requestAnimationFrame(()=>milestones[scene].classList.add('milestone-arrived'));
      }
    }
    let nearest = Infinity;
    let containing = -1;
    chapterGeometry.forEach((chapter, index) => {
      if (chapter.top <= pagePosition && chapter.bottom >= pagePosition) containing = index;
      const distance = Math.abs(chapter.middle - pagePosition);
      if (distance < nearest) { nearest = distance; currentChapter = index; }
    });
    if (containing !== -1) currentChapter = containing;
    if (window.GROWENCY_DEMOS?.pinned) currentChapter = chapters.indexOf(window.GROWENCY_DEMOS.activeStep);
    dock.hidden = scrollY < 140;
    if (currentChapter !== displayedChapter) {
      displayedChapter = currentChapter;
      dockCount.textContent = `${String(currentChapter + 1).padStart(2, '0')} / ${chapters.length}`;
      dockLabel.textContent = labels[currentChapter];
      dock.setAttribute('aria-label', `Current chapter: ${labels[currentChapter]}. Go to ${labels[currentChapter + 1] || labels[0]}`);
    }
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
    const target = chapters[currentChapter + 1] || chapters[0];
    if (window.GROWENCY_DEMOS?.scrollToStep(target)) return;
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
  document.addEventListener('growency:demo-layout', scheduleMeasure);
  document.addEventListener('toggle', scheduleMeasure, true);
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  window.addEventListener('load', scheduleMeasure, { once: true });
  new ResizeObserver(scheduleMeasure).observe(document.body);
  document.fonts?.ready.then(scheduleMeasure);
  measure();
  configure();
})();
