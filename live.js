(() => {
  const api = window.GrowencyDemo;
  if (!api) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  let manualMode = false;
  let guided = false;
  let guidedPlayer = null;
  const $ = selector => document.querySelector(selector);
  const still = () => reduced.matches || root.classList.contains('motion-paused');
  const cancelled = signal => { if (signal.aborted) throw new DOMException('Preview stopped', 'AbortError'); };
  function wait(ms, signal) {
    cancelled(signal);
    return new Promise((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(new DOMException('Preview stopped', 'AbortError')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
      signal.addEventListener('abort', abort, { once: true });
    });
  }
  async function until(ready, signal) {
    const deadline = Date.now() + 6000;
    while (!ready()) {
      cancelled(signal);
      if (Date.now() > deadline) throw new Error('The demo action did not finish');
      await wait(80, signal);
    }
  }

  // One selected prospect supplies every chapter. These steps describe real local
  // state changes, not a timer-driven list of unrelated selectors or feed items.
  const plans = {
    find: {
      input: () => `Your criteria → ${$('#industry-filter').selectedOptions[0].textContent} · ${$('#role-filter').selectedOptions[0].textContent} · ${$('#region-filter').selectedOptions[0].textContent}`,
      prepare() { api.prepareSearch(); $('.demo-shortlist').open = false; },
      steps: [
        { label: 'Criteria', caption: 'Start with the right market', target: '.filter-chips',
          result: () => ['Criteria applied', `${$('.prospect-count').dataset.total} sample matches for the current filters`] },
        { label: 'Sources', caption: 'Scan the company and contact sources', target: '#scan-sources', action: api.scanSources,
          ready: () => api.status().scan === 'ready', result: () => ['Sources checked', 'Company signals, roles and contact sources reviewed'] },
        { label: 'Match', caption: 'Review the prospect who fits', target: () => `.prospect-row[data-prospect="${api.context().id}"]`,
          result: c => [c.name, `${c.role} at ${c.company} · matches the selected market`] },
        { label: 'Shortlist', caption: 'Carry this prospect into research', target: '#add-shortlist', action: api.addShortlist,
          result: c => [`${c.name} shortlisted`, `${c.company} is ready for a closer look`] }
      ],
      outcome: c => `${c.name} → ready for research`
    },
    research: {
      input: c => `From the shortlist → ${c.name} · ${c.company}`,
      prepare() { api.clearResearch(); $('.research-evidence').open = false; },
      steps: [
        { label: 'Research', caption: 'Research the shortlisted account', target: '#enrich-lead', action: api.runResearch,
          ready: () => api.researchChecked('company'), result: c => [`${c.company} reviewed`, 'Company and market context checked'] },
        { label: 'Role', caption: 'Check that this is the decision-maker', target: '[data-enrich="role"]',
          ready: () => api.researchChecked('role'), result: c => [`${c.name} verified`, `${c.role} · the person we want to reach`] },
        { label: 'Signal', caption: 'Find a reason to start the conversation', target: '.research-signal',
          ready: () => api.researchChecked('angle'), result: c => ['Relevant signal found', c.angle === 'expansion' ? `${c.company} is entering a new market` : `${c.company} is growing its sales team`] },
        { label: 'Angle', caption: 'Use that signal in the introduction', target: () => `[data-angle="${api.context().angle}"]`,
          action: () => api.chooseAngle(api.context().angle), result: c => ['One angle chosen', c.angle === 'expansion' ? 'New market → a personal opening' : 'Growing team → a personal opening'] }
      ],
      outcome: c => `${c.company} → opening and draft ready`
    },
    conversation: {
      input: c => `From research → ${c.name} · ${c.angle === 'expansion' ? 'new market' : 'growing team'}`,
      prepare() { api.resetSend(); api.setFollowup(false); $('#reply-outcome').value = 'interested'; },
      steps: [
        { label: 'Write', caption: 'Write from the research, not a template', target: '#demo-message', type: true,
          result: c => [`A personal note for ${c.name.split(' ')[0]}`, `Subject: ${c.subject}`] },
        { label: 'Follow-up', caption: 'Queue a follow-up only if unanswered', target: '#add-followup', action: () => api.setFollowup(true),
          result: () => ['Follow-up queued', `Wait ${$('#followup-delay').value} days; cancel if a reply arrives`] },
        { label: 'Send', caption: 'Send the introduction', target: '#send-demo', action: () => api.send({ automaticReply: false }),
          ready: () => api.status().delivery === 'sent', result: c => [`Introduction delivered to ${c.name.split(' ')[0]}`, 'The draft has moved to Sent in this sample'] },
        { label: 'Reply', caption: 'An interested reply comes back', action: api.receiveReply,
          ready: () => api.status().delivery === 'replied', hold: 1800,
          result: c => [`${c.name.split(' ')[0]} replied`, 'Interested in a call · the queued follow-up is cancelled'] },
        { label: 'Agree', caption: 'A person handles the reply and agrees a time', target: '#reply-book', action: () => api.handleReply({ navigate: false }),
          ready: () => api.status().delivery === 'agreed', result: c => [`A time agreed with ${c.name.split(' ')[0]}`, 'Wednesday · 14:00 → send to the calendar'] }
      ],
      outcome: c => `${c.name.split(' ')[0]} → interested, time agreed`
    },
    booked: {
      input: c => `From the conversation → ${c.name.split(' ')[0]} agreed to Wed · 14:00`,
      prepare() {
        api.resetBooking(); api.setTask('research', false); api.setTask('followup', false);
        $('.handover-brief').open = false;
      },
      steps: [
        { label: 'Day', caption: 'Use the day agreed in the reply', target: '[data-day="WED"]',
          action: () => api.selectSlot(api.context().offeredSlot.day, api.context().time), result: () => ['Wednesday selected', 'The day agreed with the prospect'] },
        { label: 'Time', caption: 'Place the call in the agreed slot', target: '[data-time="14:00"]',
          action: () => api.selectSlot(api.context().offeredSlot.day, api.context().offeredSlot.time), result: c => [`You × ${c.company}`, 'Wednesday · 14:00–14:30'] },
        { label: 'Brief', caption: 'Attach the research and conversation', target: '.handover-brief > summary',
          action: () => { api.setTask('research', true); api.setTask('followup', true); api.prepareBrief(); },
          result: c => ['Handover brief ready', `${c.company} · opening, interested reply and agreed time`] },
        { label: 'Book', caption: 'Confirm the call, with context attached', target: '#book-demo', action: api.confirmBooking,
          ready: () => $('.calendar-stage').classList.contains('is-booked'), result: c => [`Call booked with ${c.name.split(' ')[0]}`, 'Confirmed in the sample calendar · ready for you to close'] }
      ],
      outcome: c => `${c.name.split(' ')[0]} → booked, with a brief`
    }
  };

  const players = [...document.querySelectorAll('.story-step')].map(article => {
    const stage = article.querySelector('.workflow-stage');
    const stream = document.createElement('div'); stream.className = 'demo-stream';
    stream.setAttribute('aria-label', `${article.id} sample workflow and completed actions`);
    // Autoplay logs are readable but do not create recurring live announcements.
    const header = document.createElement('div'); header.className = 'stream-header';
    const label = document.createElement('span'); label.textContent = 'SAMPLE WORKFLOW';
    const control = document.createElement('button'); control.type = 'button';
    control.setAttribute('aria-pressed', 'false'); header.append(label, control);
    const input = document.createElement('p'); input.className = 'demo-input';
    const progress = document.createElement('ol'); progress.className = 'demo-step-list';
    plans[article.id].steps.forEach(step => {
      const item = document.createElement('li'); item.textContent = step.label; progress.append(item);
    });
    const feed = document.createElement('div'); feed.className = 'stream-feed';
    const outcome = document.createElement('p'); outcome.className = 'demo-outcome';
    outcome.textContent = 'Follow the steps above. All data is a sample.';
    stream.append(header, input, progress, feed, outcome); stage.append(stream);
    const pointer = document.createElement('div'); pointer.className = 'demo-pointer'; pointer.setAttribute('aria-hidden', 'true');
    pointer.innerHTML = '<svg viewBox="0 0 32 36"><path d="M4 3 25 19 16 21 12 31Z" fill="#6650b7" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg><i></i>';
    const badge = document.createElement('div'); badge.className = 'demo-action-badge'; badge.setAttribute('aria-hidden', 'true');
    stage.append(pointer, badge);
    let typing;
    if (article.id === 'conversation') {
      typing = document.createElement('div'); typing.className = 'demo-typing-preview'; typing.setAttribute('aria-hidden', 'true'); typing.hidden = true;
      stage.querySelector('.compose-body').append(typing);
    }
    return { id: article.id, article, stage, stream, label, control, input, progress, feed, outcome, pointer, badge, typing,
      visible: false, paused: false, controller: null };
  });

  function cleanup(player) {
    player.pointer.classList.remove('is-clicking'); player.pointer.style.opacity = '0';
    player.stage.querySelectorAll('.demo-click-target,.demo-focus-target').forEach(el => el.classList.remove('demo-click-target', 'demo-focus-target'));
    if (player.typing) { player.typing.hidden = true; player.stage.classList.remove('is-preview-typing'); }
  }
  function addRow(player, title, detail, index) {
    const row = document.createElement('div'); row.className = 'stream-row';
    const icon = document.createElement('span'); icon.className = 'stream-avatar'; icon.textContent = '✓';
    const body = document.createElement('span');
    const b = document.createElement('b'); b.textContent = title;
    const small = document.createElement('small'); small.textContent = detail;
    const number = document.createElement('i'); number.textContent = String(index + 1).padStart(2, '0');
    body.append(b, small); row.append(icon, body, number); player.feed.prepend(row);
    while (player.feed.children.length > 3) player.feed.lastElementChild.remove();
  }
  async function aim(player, step, signal) {
    const selector = typeof step.target === 'function' ? step.target() : step.target;
    const target = selector ? player.stage.querySelector(selector) : null;
    if (!target) {
      if (selector) throw new Error(`Missing demo target: ${selector}`);
      return null;
    }
    if (!target.getClientRects().length) throw new Error(`Hidden demo target: ${selector}`);
    if (guided) {
      const bounds = target.getBoundingClientRect();
      if (bounds.top < 90 || bounds.bottom > innerHeight - 90) {
        target.scrollIntoView({ block: 'center', behavior: still() ? 'instant' : 'smooth' });
        await wait(still() ? 50 : 550, signal);
      }
    }
    target.classList.add('demo-focus-target');
    if (!still()) {
      const box = player.stage.getBoundingClientRect(), rect = target.getBoundingClientRect();
      player.pointer.style.setProperty('--demo-x', `${Math.max(8, Math.min(box.width - 32, rect.left - box.left + rect.width * .6))}px`);
      player.pointer.style.setProperty('--demo-y', `${Math.max(8, Math.min(box.height - 40, rect.top - box.top + rect.height * .55))}px`);
      player.pointer.style.opacity = '1';
      await wait(450, signal);
    }
    return target;
  }
  async function typeDraft(player, signal) {
    if (still()) return;
    const draft = api.context().message;
    player.typing.hidden = false; player.stage.classList.add('is-preview-typing');
    const text = document.createTextNode(''), caret = document.createElement('i');
    player.typing.replaceChildren(text, caret);
    // The actual editable draft stays intact; only the visual reveal is animated.
    for (let length = 0; length < draft.length; length += 5) {
      text.textContent = draft.slice(0, length + 5);
      await wait(45, signal);
    }
    await wait(500, signal);
    player.typing.hidden = true; player.stage.classList.remove('is-preview-typing');
  }
  async function playChapter(player, signal) {
    const plan = plans[player.id];
    cancelled(signal); cleanup(player); plan.prepare(); api.pipeline(player.id);
    player.input.textContent = plan.input(api.context());
    player.feed.replaceChildren(); player.outcome.textContent = 'Watching the process · all data is a sample';
    player.progress.querySelectorAll('li').forEach(el => { el.removeAttribute('aria-current'); el.className = ''; });
    player.stage.dataset.demoState = 'running';
    player.stage.classList.add('is-live-preview'); player.stream.classList.add('stream-playing');
    for (const [index, step] of plan.steps.entries()) {
      cancelled(signal); cleanup(player);
      player.stage.dataset.demoStep = String(index + 1);
      player.label.textContent = `SAMPLE · STEP ${index + 1} OF ${plan.steps.length}`;
      player.badge.textContent = step.caption;
      const item = player.progress.children[index]; item.classList.add('is-current'); item.setAttribute('aria-current', 'step');
      if (guided) $('#workflow-run-status').textContent = `${api.context().name.split(' ')[0]} · ${step.caption}`;
      const target = await aim(player, step, signal);
      cancelled(signal);
      if (step.action) {
        if (target && !still()) { player.pointer.classList.add('is-clicking'); target.classList.add('demo-click-target'); }
        step.action();
      }
      if (step.type) await typeDraft(player, signal);
      if (step.ready) await until(step.ready, signal);
      const [title, detail] = step.result(api.context()); addRow(player, title, detail, index);
      await wait(still() ? 300 : (step.hold || 1200), signal);
      item.classList.remove('is-current'); item.classList.add('is-done'); item.removeAttribute('aria-current');
    }
    cancelled(signal); cleanup(player);
    player.stage.dataset.demoState = 'complete';
    player.label.textContent = 'SAMPLE · PROCESS COMPLETE';
    player.badge.textContent = 'Ready for the next step';
    player.outcome.textContent = plan.outcome(api.context());
    if (guided) player.stream.scrollIntoView({ block: 'nearest', behavior: still() ? 'instant' : 'smooth' });
    await wait(still() ? 400 : 3200, signal);
  }
  function stop(player) {
    if (!player.controller) return;
    player.controller.abort(); player.controller = null;
    api.cancelPending(); cleanup(player);
    player.stage.classList.remove('is-live-preview'); player.stream.classList.remove('stream-playing');
    if (player.stage.dataset.demoState === 'running') player.stage.dataset.demoState = 'paused';
  }
  function canAutoplay() {
    const focused = document.activeElement;
    return !guided && !manualMode && !document.hidden && !still() &&
      !(focused?.closest('.workflow-stage') && !focused.closest('.stream-header'));
  }
  function sync() {
    const visible = players.filter(p => p.visible && !p.paused);
    visible.sort((a, b) => {
      const distance = p => { const r = p.stage.getBoundingClientRect(); return Math.abs(r.top + r.height / 2 - innerHeight / 2); };
      return distance(a) - distance(b);
    });
    const active = canAutoplay() ? visible[0] : null;
    players.forEach(player => {
      const paused = player.paused || manualMode;
      player.control.textContent = paused ? '▷ Play demo' : 'Ⅱ Pause';
      player.control.setAttribute('aria-pressed', String(paused));
      player.control.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} ${player.id} sample workflow`);
      if (guided) { player.control.textContent = guidedPlayer === player ? 'Walkthrough playing' : 'In walkthrough'; player.control.disabled = true; }
      else player.control.disabled = false;
      if (player !== active) stop(player);
    });
    if (active && !active.controller) {
      const controller = new AbortController(); active.controller = controller;
      (async () => {
        try { while (!controller.signal.aborted) await playChapter(active, controller.signal); }
        catch (error) {
          if (error.name !== 'AbortError') {
            active.paused = true; active.outcome.textContent = 'Use the controls, or press Play to restart this sample.';
            console.error('Growency sample workflow:', error);
          }
        } finally {
          if (active.controller === controller) { stop(active); sync(); }
        }
      })();
    }
  }
  function takeControl(event) {
    if (!event.isTrusted || event.target.closest('.stream-header')) return;
    manualMode = true; players.forEach(stop); sync();
  }
  players.forEach(player => {
    player.input.textContent = plans[player.id].input(api.context());
    player.control.addEventListener('click', () => {
      if (manualMode || player.paused) { manualMode = false; player.paused = false; }
      else player.paused = true;
      sync();
    });
    ['pointerdown', 'keydown', 'input', 'change'].forEach(type => player.stage.addEventListener(type, takeControl));
    player.stage.addEventListener('focusin', sync);
    player.stage.addEventListener('focusout', () => requestAnimationFrame(sync));
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { players.find(p => p.stage === entry.target).visible = entry.isIntersecting && entry.intersectionRatio >= .12; }); sync();
  }, { threshold: [0, .12, .5] });
  players.forEach(player => observer.observe(player.stage));
  let scrollFrame = 0;
  document.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; sync(); }); }, { passive: true });
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && guided) $('#run-workflow').click();
    sync();
  });
  reduced.addEventListener('change', sync);
  document.addEventListener('growency:walkthrough-start', () => { guided = true; players.forEach(stop); sync(); });
  document.addEventListener('growency:walkthrough-end', () => { guided = false; guidedPlayer = null; manualMode = true; sync(); });
  document.addEventListener('growency:context-changed', event => {
    players.forEach(player => {
      player.input.textContent = plans[player.id].input(api.context());
      if (event.detail === 'prospect') {
        player.feed.replaceChildren(); player.stage.dataset.demoState = 'idle';
        player.progress.querySelectorAll('li').forEach(el => { el.className = ''; el.removeAttribute('aria-current'); });
        player.outcome.textContent = 'New prospect selected. Play or explore the controls.';
      }
    });
  });
  $('#reset-workflow').addEventListener('click', () => {
    players.forEach(stop); guided = false; guidedPlayer = null; manualMode = false;
    players.forEach(player => { player.paused = false; player.feed.replaceChildren(); player.stage.dataset.demoState = 'idle'; player.input.textContent = plans[player.id].input(api.context()); });
    sync();
  });
  window.GrowencyPlayback = {
    async runAll(signal) {
      try {
        for (const player of players) {
          cancelled(signal); guidedPlayer = player; sync(); api.moveTo(player.id);
          await wait(still() ? 50 : 600, signal);
          await playChapter(player, signal);
          player.stage.classList.remove('is-live-preview'); player.stream.classList.remove('stream-playing');
        }
      } finally {
        players.forEach(player => {
          cleanup(player); player.stage.classList.remove('is-live-preview'); player.stream.classList.remove('stream-playing');
          if (signal.aborted && player.stage.dataset.demoState === 'running') {
            player.stage.dataset.demoState = 'paused'; player.label.textContent = 'SAMPLE · PREVIEW STOPPED';
            player.outcome.textContent = 'Your draft is saved. Play or explore the controls.';
          }
        });
        guided = false; guidedPlayer = null; manualMode = true; sync();
      }
    }
  };
  sync();
})();
