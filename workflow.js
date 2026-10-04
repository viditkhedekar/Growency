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
  function resetSend() {
    timers.forEach(clearTimeout);
    timers = [];
    reply.hidden = true;
    document.querySelector('.outreach-stage').classList.remove('is-sending');
    sendButton.disabled = !message.value.trim() || !subject.value.trim();
    sendButton.firstElementChild.textContent = 'Send demo email';
    sendStatus.textContent = 'Try editing the email';
    setSequence(0);
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
  researchButton.addEventListener('click', () => moveTo('research'));
  document.querySelectorAll('[data-angle]').forEach(button => {
    button.addEventListener('click', () => {
      angle = button.dataset.angle;
      document.querySelectorAll('[data-angle]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
      buildDraft();
    });
  });
  subject.addEventListener('input', resetSend);
  message.addEventListener('input', resetSend);
  sendButton.addEventListener('click', () => {
    if (!message.value.trim() || !subject.value.trim()) return;
    resetSend();
    sendButton.disabled = true;
    sendButton.firstElementChild.textContent = 'Sending demo…';
    sendStatus.textContent = 'Simulating delivery';
    document.querySelector('.outreach-stage').classList.add('is-sending');
    const showSent = () => {
      sendStatus.textContent = '✓ Demo sent';
      setSequence(1);
    };
    const showReply = () => {
      reply.hidden = false;
      setSequence(2);
      sendButton.disabled = false;
      sendButton.firstElementChild.textContent = 'Send again';
      sendStatus.textContent = '↳ Demo reply received';
    };
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-paused');
    if (still) { showSent(); showReply(); }
    else { timers.push(setTimeout(showSent, 600), setTimeout(showReply, 1500)); }
  });
  document.querySelector('#reply-book').addEventListener('click', () => moveTo('booked'));
  function updateSlot() {
    const days = ['MON', 'TUE', 'WED', 'THU'];
    const index = days.indexOf(day);
    const cells = [...document.querySelectorAll('.calendar-cell')];
    cells.forEach(cell => cell.classList.remove('event-cell'));
    cells[4 + index].classList.add('event-cell');
    cells[4 + index].append(event);
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
  }
  document.querySelectorAll('[data-day]').forEach(button => button.addEventListener('click', () => { day = button.dataset.day; updateSlot(); }));
  document.querySelectorAll('[data-time]').forEach(button => button.addEventListener('click', () => { time = button.dataset.time; updateSlot(); }));
  document.querySelector('#book-demo').addEventListener('click', () => {
    bookingResult.querySelector('small').textContent = 'DEMO BOOKING CONFIRMED';
    bookingResult.querySelector('b').textContent = `${selected.name.split(' ')[0]} · ${day[0] + day.slice(1).toLowerCase()} at ${time}`;
    bookingResult.querySelector('.toast-check').textContent = '✓';
    document.querySelector('#book-demo').textContent = '✓ Demo booked';
    document.querySelector('.calendar-stage').classList.add('is-booked');
  });
  document.querySelector('#conversation .replay').addEventListener('click', resetSend);
  document.querySelector('#booked .replay').addEventListener('click', resetBooking);
  // Each control operates entirely in this document. There is no network or form submission.
  selectProspect(selected);
  renderProspects();
})();
