(() => {
  const results = document.querySelector('#prospect-results');
  if (!results) return;
  const prospects = [
    { id: 'alex', name: 'Alex Morgan', company: 'Meridian', role: 'Founder', industry: 'saas', region: 'UK', initials: 'AM', colour: 'blue' },
    { id: 'maya', name: 'Maya Chen', company: 'Form & Field', role: 'CEO', industry: 'saas', region: 'UK', initials: 'MC', colour: 'purple' },
    { id: 'sam', name: 'Sam Rivera', company: 'Layerwork', role: 'Founder', industry: 'saas', region: 'UK', initials: 'SR', colour: 'olive' },
    { id: 'jamie', name: 'Jamie Taylor', company: 'Parallel', role: 'CEO', industry: 'saas', region: 'UK', initials: 'JT', colour: 'pink' },
    { id: 'anna', name: 'Anna Reed', company: 'Studio North', role: 'CEO', industry: 'services', region: 'UK', initials: 'AR', colour: 'purple' },
    { id: 'rory', name: 'Rory Patel', company: 'Westward', role: 'Founder', industry: 'services', region: 'UK', initials: 'RP', colour: 'blue' },
    { id: 'robin', name: 'Robin Ellis', company: 'Ellis Advisory', role: 'Founder', industry: 'services', region: 'US', initials: 'RE', colour: 'olive' },
    { id: 'casey', name: 'Casey Park', company: 'Signal House', role: 'Founder', industry: 'saas', region: 'US', initials: 'CP', colour: 'pink' },
    { id: 'jordan', name: 'Jordan Lee', company: 'Framewise', role: 'CEO', industry: 'saas', region: 'US', initials: 'JL', colour: 'blue' }
  ];
  const search = document.querySelector('#prospect-search');
  const industry = document.querySelector('#industry-filter');
  const role = document.querySelector('#role-filter');
  const region = document.querySelector('#region-filter');
  const count = document.querySelector('.prospect-count');
  const researchButton = document.querySelector('#research-lead');
  const subject = document.querySelector('#demo-subject');
  const message = document.querySelector('#demo-message');
  const sendButton = document.querySelector('#send-demo');
  const sendStatus = document.querySelector('#send-status');
  const reply = document.querySelector('#demo-reply');
  const event = document.querySelector('#demo-event');
  const bookingResult = document.querySelector('#booking-result');
  let selected = prospects[0];
  let angle = 'expansion';
  let day = 'WED';
  let time = '10:00';
  let timers = [];
  let scanTimers = [];
  let runController;
  let delivery = 'draft';
  let scanState = 'idle';
  const offeredSlot = { day: 'WED', time: '14:00' };
  const runButton = document.querySelector('#run-workflow');
  const runStatus = document.querySelector('#workflow-run-status');
  const outcome = document.querySelector('#reply-outcome');
  const tone = document.querySelector('#email-tone');
  function activity(text) {
    const log = document.querySelector('#outbox-log');
    const row = document.createElement('span');
    row.textContent = `• ${text}`;
    log.append(row);
    while (log.children.length > 3) log.firstElementChild.remove();
  }
  function pipeline(id, finished = false) {
    const ids = ['find', 'research', 'conversation', 'booked'];
    const current = ids.indexOf(id);
    document.querySelectorAll('[data-pipeline]').forEach((el, i) => {
      el.classList.toggle('is-current', i === current && !finished);
      el.classList.toggle('is-done', i < current || finished);
    });
  }

  function moveTo(id) {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-paused');
    document.getElementById(id).scrollIntoView({ behavior: still ? 'instant' : 'smooth', block: 'center' });
  }
  function bind(key, text) {
    document.querySelectorAll(`[data-bind="${key}"]`).forEach(el => { el.textContent = text; });
  }
  function setSequence(index) {
    document.querySelectorAll('#email-sequence > span').forEach((el, i) => el.classList.toggle('sequence-active', i <= index));
  }
  const isEmail = () => document.querySelector('[data-channel="email"]').getAttribute('aria-pressed') === 'true';
  function resetSend() {
    delivery = 'draft';
    timers.forEach(clearTimeout);
    timers = [];
    reply.hidden = true;
    document.querySelector('.outreach-stage').classList.remove('is-sending');
    sendButton.disabled = !message.value.trim() || (isEmail() && !subject.value.trim());
    sendButton.firstElementChild.textContent = isEmail() ? 'Send demo email' : 'Send demo message';
    sendStatus.textContent = 'Try editing the email';
    setSequence(0);
    document.querySelector('#outbox-log').replaceChildren(Object.assign(document.createElement('span'), { textContent: 'Outbox ready. Make the first move.' }));
    document.querySelector('#reply-book').textContent = 'Pick a time →';
    document.querySelector('#followup-editor').classList.remove('followup-cancelled');
    document.querySelector('#add-followup').textContent = document.querySelector('#followup-editor').hidden ? '+ Add a follow-up' : '− Remove follow-up';
  }
  function buildDraft() {
    const first = selected.name.split(' ')[0];
    const market = selected.region === 'UK' ? 'the UK' : 'the US';
    const expansion = angle === 'expansion';
    const opening = expansion
      ? `Saw you’re expanding ${selected.company} into ${market}.`
      : `Noticed ${selected.company} is growing its sales team.`;
    const reason = expansion
      ? 'We have a few ideas about the people you’ll want to speak to first.'
      : 'We can help put the right conversations on their calendars from day one.';
    document.querySelector('#angle-preview').textContent = `“${opening} ${reason}”`;
    bind('signal', expansion ? `Expanding into ${market}` : 'Growing the sales team');
    bind('signal-detail', expansion ? 'A new market. A new set of buyers.' : 'New hires. More conversations to start.');
    subject.value = expansion ? `${selected.company}’s next chapter` : `A head start for ${selected.company}’s sales team`;
    message.value = `Hi ${first},\n\n${opening}\n${reason}\n\nWorth a conversation?\n\nThe Growency team`;
    tone.value = 'personal';
    document.querySelector('#brief-angle').textContent = opening;
    document.querySelector('#research-evidence-text').textContent = `${selected.name} is ${selected.role.toLowerCase()} at ${selected.company}. ${opening} This sample signal is the reason for the introduction.`;
    resetSend();
  }
  function resetBooking() {
    bookingResult.querySelector('small').textContent = 'YOUR NEXT CONVERSATION';
    bookingResult.querySelector('b').textContent = 'Choose a day and time above.';
    bookingResult.querySelector('.toast-check').textContent = '↗';
    document.querySelector('#book-demo').textContent = 'Book demo call ↗';
    document.querySelector('.calendar-stage').classList.remove('is-booked');
  }
  function selectProspect(prospect) {
    selected = prospect;
    bind('name', prospect.name);
    bind('initials', prospect.initials);
    bind('role-company', `${prospect.role} at ${prospect.company}`);
    bind('domain', `${prospect.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.example`);
    bind('role', `${prospect.role} & decision-maker`);
    bind('industry', prospect.industry === 'saas' ? 'B2B software' : 'Professional services');
    bind('region', prospect.region === 'UK' ? 'United Kingdom' : 'United States');
    bind('reply-name', `${prospect.name.split(' ')[0].toUpperCase()} REPLIED`);
    bind('meeting-title', `You × ${prospect.company}`);
    bind('attendees', `You + ${prospect.name.split(' ')[0]}`);
    buildDraft();
    resetBooking();
    document.dispatchEvent(new CustomEvent('growency:context-changed', { detail: 'prospect' }));
  }
  function renderProspects() {
    const query = search.value.trim().toLowerCase();
    const filtered = prospects.filter(p =>
      (industry.value === 'all' || p.industry === industry.value) &&
      (role.value === 'all' || p.role === role.value) &&
      (region.value === 'all' || p.region === region.value) &&
      `${p.name} ${p.company} ${p.role}`.toLowerCase().includes(query)
    );
    if (filtered.length && !filtered.some(p => p.id === selected.id)) selectProspect(filtered[0]);
    count.dataset.total = String(filtered.length);
    count.textContent = String(filtered.length);
    researchButton.disabled = filtered.length === 0;
    results.replaceChildren();
    for (const p of filtered) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'prospect-row';
      button.dataset.prospect = p.id;
      button.dataset.info = `${p.company} · ${p.industry === 'saas' ? 'B2B software' : 'Services'} · ${p.region === 'UK' ? 'United Kingdom' : 'United States'}. Select this sample prospect to carry their details through the workflow.`;
      const active = p.id === selected.id;
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', `Select ${p.name}, ${p.role} at ${p.company}`);
      // Every inserted string below is fixed fictional demo content from the array above.
      const initials = document.createElement('span');
      initials.className = `person-initials initials-${p.colour}`;
      initials.textContent = p.initials;
      const detail = document.createElement('span');
      detail.className = 'prospect-details';
      const name = document.createElement('b');
      name.textContent = p.name;
      const company = document.createElement('span');
      company.textContent = `${p.role} · ${p.company}`;
      detail.append(name, company);
      const status = document.createElement('span');
      status.className = 'match-label';
      status.textContent = active ? 'Selected ✓' : 'Select +';
      button.append(initials, detail, status);
      button.addEventListener('click', () => {
        selectProspect(p);
        pipeline('find');
        // Update selection in place, keeping keyboard focus on the chosen row.
        results.querySelectorAll('.prospect-row').forEach(row => {
          const chosen = row.dataset.prospect === p.id;
          row.setAttribute('aria-pressed', String(chosen));
          row.querySelector('.match-label').textContent = chosen ? 'Selected ✓' : 'Select +';
        });
        document.querySelector('#prospect-status').textContent = `${p.name} selected. Research, email and meeting demos updated.`;
      });
      results.append(button);
    }
    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'prospect-empty';
      empty.textContent = 'No sample leads match. Try another filter or clear your search.';
      results.append(empty);
    }
    document.querySelector('#prospect-status').textContent = `${filtered.length} sample prospects found.`;
  }
  [industry, role, region].forEach(el => el.addEventListener('change', renderProspects));
  search.addEventListener('input', renderProspects);
  researchButton.addEventListener('click', () => { pipeline('research'); moveTo('research'); });
  function chooseAngle(value) {
    angle = value;
    document.querySelectorAll('[data-angle]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.angle === angle)));
    buildDraft();
    pipeline('research');
    document.dispatchEvent(new CustomEvent('growency:context-changed', { detail: 'angle' }));
  }
  document.querySelectorAll('[data-angle]').forEach(button => button.addEventListener('click', () => chooseAngle(button.dataset.angle)));
  subject.addEventListener('input', resetSend);
  message.addEventListener('input', resetSend);
  sendButton.addEventListener('channelchange',resetSend);
  function sendDemo({ automaticReply = true } = {}) {
    if (!message.value.trim() || (isEmail() && !subject.value.trim())) return;
    resetSend();
    delivery = 'sending';
    sendButton.disabled = true;
    sendButton.firstElementChild.textContent = 'Sending demo…';
    sendStatus.textContent = 'Simulating delivery';
    pipeline('conversation');
    activity(`${isEmail() ? 'Email' : 'LinkedIn'} introduction prepared for ${selected.name.split(' ')[0]}`);
    document.querySelector('.outreach-stage').classList.add('is-sending');
    const showSent = () => {
      delivery = 'sent';
      sendStatus.textContent = '✓ Demo sent';
      setSequence(1);
      activity('Introduction delivered in the demo');
      if (!document.querySelector('#followup-editor').hidden) {
        activity(`Follow-up scheduled after ${document.querySelector('#followup-delay').value} days if unanswered`);
      }
    };
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-paused');
    if (still) { showSent(); if (automaticReply) receiveReply(); }
    else {
      timers.push(setTimeout(showSent, 600));
      if (automaticReply) timers.push(setTimeout(receiveReply, 1500));
    }
  }
  function receiveReply() {
    if (delivery !== 'sent') return;
    delivery = 'replied';
    reply.hidden = false;
    const replies = { interested: '“Sounds relevant. Let’s find a time.”', question: '“What does it cost?”', contact: '“Our head of sales handles this.”' };
    reply.querySelector('b').textContent = replies[outcome.value];
    document.querySelector('#reply-book').textContent = outcome.value === 'interested' ? 'Agree a time →' : 'See how we handle it →';
    activity(outcome.value === 'interested' ? `${selected.name.split(' ')[0]} replied: interested in a call` : 'Reply received. Operator follow-up needed');
    if (!document.querySelector('#followup-editor').hidden) {
      activity('Scheduled follow-up cancelled after the reply');
      document.querySelector('#add-followup').textContent = '✓ Follow-up cancelled after reply';
      document.querySelector('#followup-editor').classList.add('followup-cancelled');
    }
    setSequence(2);
    sendButton.disabled = false;
    sendButton.firstElementChild.textContent = 'Send again';
    sendStatus.textContent = '↳ Demo reply received';
  }
  function handleReply({ navigate = true } = {}) {
    if (delivery !== 'replied' && delivery !== 'agreed') return;
    if (outcome.value !== 'interested' && document.querySelector('#reply-book').textContent.includes('handle')) {
      reply.querySelector('b').textContent = outcome.value === 'question'
        ? '“Terms, pricing and scope are agreed after the pilot.”'
        : '“Thanks. We’ll take the introduction from here.”';
      document.querySelector('#reply-book').textContent = 'Pick a time →';
      activity('A person handles the reply and next step');
      return;
    }
    delivery = 'agreed';
    reply.querySelector('b').textContent = '“Wednesday at 14:00 works. See you then.”';
    document.querySelector('#reply-book').textContent = 'Open the calendar →';
    activity(`${selected.name.split(' ')[0]} agreed to Wednesday at 14:00`);
    pipeline('booked');
    if (navigate) { day = offeredSlot.day; time = offeredSlot.time; updateSlot(); moveTo('booked'); }
  }
  sendButton.addEventListener('click', () => sendDemo());
  document.querySelector('#reply-book').addEventListener('click', () => handleReply());
  function updateSlot() {
    const days = ['MON', 'TUE', 'WED', 'THU'];
    const index = days.indexOf(day);
    const cells = [...document.querySelectorAll('.calendar-cell')];
    cells.forEach(cell => cell.classList.remove('event-cell'));
    cells[4 + index].classList.add('event-cell');
    cells[4 + index].append(event);
    event.style.width = index === 3 ? 'calc(100% - 7px)' : 'calc(200% - 7px)';
    document.querySelectorAll('.calendar-day').forEach(button => {
      const chosen = button.dataset.day === day;
      button.setAttribute('aria-pressed', String(chosen));
      button.classList.toggle('day-selected', chosen);
    });
    document.querySelectorAll('[data-time]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.time === time)));
    document.querySelector('#event-time').textContent = `${time} – ${time.slice(0, 2)}:30`;
    const hour = Number(time.slice(0, 2));
    document.querySelectorAll('.calendar-time').forEach((el, i) => { el.textContent = `${String(hour + i - 1).padStart(2, '0')}:00`; });
    resetBooking();
    pipeline('booked');
  }
  document.querySelectorAll('[data-day]').forEach(button => button.addEventListener('click', () => { day = button.dataset.day; updateSlot(); }));
  document.querySelectorAll('[data-time]').forEach(button => button.addEventListener('click', () => { time = button.dataset.time; updateSlot(); }));
  function confirmBooking() {
    bookingResult.querySelector('small').textContent = 'DEMO BOOKING CONFIRMED';
    bookingResult.querySelector('b').textContent = `${selected.name.split(' ')[0]} · ${day[0] + day.slice(1).toLowerCase()} at ${time}`;
    bookingResult.querySelector('.toast-check').textContent = '✓';
    document.querySelector('#book-demo').textContent = '✓ Demo booked';
    document.querySelector('.calendar-stage').classList.add('is-booked');
    const history = delivery === 'agreed' ? 'Personal introduction, interested reply and agreed time.' : 'Your prospect research and personal introduction.';
    document.querySelector('#brief-context').textContent = `${selected.name}, ${selected.role.toLowerCase()} at ${selected.company}. ${history} ${day[0] + day.slice(1).toLowerCase()} at ${time}.`;
    pipeline('booked', true);
  }
  document.querySelector('#book-demo').addEventListener('click', confirmBooking);
  document.querySelector('#conversation .replay').addEventListener('click', resetSend);
  document.querySelector('#booked .replay').addEventListener('click', resetBooking);
  tone.addEventListener('change', () => {
    const first = selected.name.split(' ')[0];
    if (tone.value === 'direct') message.value = `Hi ${first},\n\nWe help B2B teams get in front of the right buyers. I think there’s a conversation worth having about ${selected.company}.\n\nOpen to a short call?\n\nGrowency`;
    else if (tone.value === 'followup') message.value = `Hi ${first},\n\nFollowing up on my note about ${selected.company}. Is this a good time to talk, or should I check back later?\n\nGrowency`;
    else {
      const current = angle; buildDraft(); angle = current;
    }
    resetSend();
  });
  outcome.addEventListener('change', resetSend);
  function scanSources() {
    scanState = 'checking';
    scanTimers.forEach(clearTimeout); scanTimers = [];
    const badges = [...document.querySelectorAll('[data-source]')];
    badges.forEach(el => el.classList.remove('source-checked'));
    const status = document.querySelector('#source-status');
    status.textContent = 'Checking sample lead sources…';
    document.querySelector('.prospect-stage').classList.add('is-scanning');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-paused');
    badges.forEach((el, i) => {
      const mark = () => { el.classList.add('source-checked'); status.textContent = `${el.textContent} checked`; };
      if (still) mark(); else scanTimers.push(setTimeout(mark, (i + 1) * 350));
    });
    const finish = () => { scanState = 'ready'; status.textContent = 'Sample shortlist ready'; renderProspects(); document.querySelector('.prospect-stage').classList.remove('is-scanning'); pipeline('find'); };
    if (still) finish(); else scanTimers.push(setTimeout(finish, 1250));
  }
  document.querySelector('#scan-sources').addEventListener('click', scanSources);
  event.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', 'growency-demo-event'); e.dataTransfer.effectAllowed = 'move'; });
  document.querySelectorAll('.calendar-cell').forEach((cell, index) => {
    cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('drop-target'); });
    cell.addEventListener('dragleave', () => cell.classList.remove('drop-target'));
    cell.addEventListener('drop', e => {
      e.preventDefault(); cell.classList.remove('drop-target');
      if (e.dataTransfer.getData('text/plain') !== 'growency-demo-event') return;
      day = ['MON', 'TUE', 'WED', 'THU'][index % 4];
      const row = Math.floor(index / 4);
      time = `${String(Math.max(1, Math.min(22, Number(time.slice(0, 2)) + row - 1))).padStart(2, '0')}:00`;
      updateSlot();
    });
  });
  function cancelPending() {
    timers.forEach(clearTimeout); timers = [];
    scanTimers.forEach(clearTimeout); scanTimers = [];
    document.querySelector('.prospect-stage').classList.remove('is-scanning');
    if (scanState === 'checking') scanState = 'idle';
    document.querySelector('.outreach-stage').classList.remove('is-sending');
    if (delivery === 'sending') {
      delivery = 'draft'; sendButton.disabled = false;
      sendButton.firstElementChild.textContent = 'Send demo email';
      sendStatus.textContent = 'Preview stopped. Your draft is saved.';
    }
    document.dispatchEvent(new Event('growency:demo-stopped'));
  }
  function stopRun() {
    if (runController) { runController.abort(); cancelPending(); }
    runController = null;
    runButton.innerHTML = 'Run the whole workflow <span aria-hidden="true">↗</span>';
    runStatus.textContent = 'Explore any step';
  }
  runButton.addEventListener('click', async () => {
    if (runController) { stopRun(); return; }
    if (!window.GrowencyPlayback) return;
    if (researchButton.disabled) { search.value = ''; industry.value = 'all'; role.value = 'all'; region.value = 'all'; renderProspects(); }
    const controller = new AbortController(); runController = controller;
    runButton.textContent = 'Stop walkthrough Ⅱ';
    document.dispatchEvent(new Event('growency:walkthrough-start'));
    try {
      outcome.value = 'interested';
      await window.GrowencyPlayback.runAll(controller.signal);
      if (controller.signal.aborted) return;
      runStatus.textContent = `${selected.name.split(' ')[0]} shortlisted, researched, contacted and booked. Your turn.`;
      runController = null; runButton.innerHTML = 'Run again <span aria-hidden="true">↻</span>';
      document.dispatchEvent(new Event('growency:walkthrough-end'));
    } catch (error) {
      if (!controller.signal.aborted) { stopRun(); runStatus.textContent = 'Preview stopped. You can replay or use the controls.'; }
    }
  });
  window.GrowencyDemo = {
    context: () => ({ ...selected, angle, day, time, subject: subject.value, message: message.value, offeredSlot: { ...offeredSlot }, outcome: outcome.value }),
    status: () => ({ delivery, scan: scanState }),
    scanSources, chooseAngle, resetSend, send: sendDemo, receiveReply, handleReply,
    resetBooking, confirmBooking, pipeline, moveTo, cancelPending,
    selectSlot(nextDay, nextTime) { day = nextDay; time = nextTime; updateSlot(); },
    prepareSearch() {
      scanState = 'idle';
      document.querySelectorAll('[data-source]').forEach(el => el.classList.remove('source-checked'));
      document.querySelector('#source-status').textContent = 'Criteria set. Scan the sources next.';
    }
  };
  document.querySelector('#reset-workflow').addEventListener('click', () => {
    stopRun(); timers.forEach(clearTimeout); scanTimers.forEach(clearTimeout);
    search.value = ''; industry.value = 'saas'; role.value = 'all'; region.value = 'UK';
    angle = 'expansion'; outcome.value = 'interested'; day = 'WED'; time = '10:00';
    document.querySelectorAll('[data-angle]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.angle === angle)));
    document.querySelectorAll('[data-source]').forEach(el => el.classList.remove('source-checked'));
    document.querySelector('#source-status').textContent = 'Ready to research';
    document.querySelector('.prospect-stage').classList.remove('is-scanning');
    selectProspect(prospects[0]); renderProspects(); updateSlot(); pipeline('find');
  });
  document.querySelectorAll('.workflow-stage').forEach(stage => {
    const interrupt = e => { if (e.isTrusted && runController) stopRun(); };
    stage.addEventListener('pointerdown', interrupt); stage.addEventListener('keydown', interrupt);
  });
  document.querySelector('.motion-toggle').addEventListener('click', () => { if (runController) stopRun(); });
  // Each control operates entirely in this document. There is no network or form submission.
  selectProspect(selected);
  renderProspects();
})();
