/* Growency — the busy layer. Side demos that never sleep + easter eggs.
   Everything here is decorative: rails are aria-hidden, and all motion
   stops for prefers-reduced-motion or a hidden tab. */
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = id => document.getElementById(id);
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  const timers = [];
  const every = (ms, fn) => { if (!still) timers.push(setInterval(fn, ms)); };

  /* ---------- shared fictional cast (same people as the workflow demos) ---------- */
  const cast = [
    { name: 'Alex Morgan', co: 'Meridian', match: 94 },
    { name: 'Maya Chen', co: 'Form & Field', match: 91 },
    { name: 'Sam Rivera', co: 'Layerwork', match: 88 },
    { name: 'Jamie Taylor', co: 'Parallel', match: 86 },
    { name: 'Anna Reed', co: 'Studio North', match: 92 },
    { name: 'Rory Patel', co: 'Westward', match: 84 },
    { name: 'Robin Ellis', co: 'Ellis Advisory', match: 89 },
    { name: 'Casey Park', co: 'Signal House', match: 90 },
    { name: 'Jordan Lee', co: 'Framewise', match: 87 }
  ];
  const avaHues = [222, 262, 288, 200, 330, 160];
  const initials = name => name.split(' ').map(w => w[0]).join('');
  const avaStyle = i => `background:linear-gradient(135deg,hsl(${avaHues[i % avaHues.length]} 82% 58%),hsl(${avaHues[(i + 2) % avaHues.length]} 70% 42%))`;

  /* ---------- 1. live prospect feed ---------- */
  const feed = $('feed-list');
  const feedCount = $('feed-count');
  let feedIndex = 0;
  const scanLines = ['scanning 2,400 profiles…', 'checking fit signals…', 'reading the room…', 'ranking by reply odds…', 'shortlisting the warm ones…'];
  function pushFeedRow(first) {
    const person = cast[feedIndex % cast.length];
    feedIndex++;
    const li = document.createElement('li');
    if (!first) li.className = 'fresh';
    const ava = document.createElement('span');
    ava.className = 'feed-ava';
    ava.style.cssText = avaStyle(feedIndex);
    ava.textContent = initials(person.name);
    const who = document.createElement('span');
    who.className = 'feed-who';
    const b = document.createElement('b');
    b.textContent = person.name;
    const sub = document.createElement('span');
    sub.textContent = person.co;
    who.append(b, sub);
    const match = document.createElement('span');
    match.className = 'feed-match';
    match.textContent = person.match + '%';
    li.append(ava, who, match);
    feed.prepend(li);
    while (feed.children.length > 4) feed.lastElementChild.remove();
    if (!still && !first) {
      const target = person.match;
      let shown = target - 26;
      const tick = setInterval(() => {
        shown += 2;
        if (shown >= target) { shown = target; clearInterval(tick); }
        match.textContent = shown + '%';
      }, 40);
    }
  }
  if (feed) {
    for (let i = 0; i < 4; i++) pushFeedRow(true);
    every(2400, () => pushFeedRow(false));
    let scanIndex = 0;
    every(3000, () => { feedCount.textContent = scanLines[++scanIndex % scanLines.length]; });
  }

  /* ---------- 2. research notes, typed live ---------- */
  const notes = $('notes-body');
  const noteSets = [
    ['✓ expanding into the uk', '✓ hiring 2 account execs', '→ angle: first customers'],
    ['✓ just raised a seed round', '✓ new vp of sales', '→ angle: ramp the team'],
    ['✓ launching in two markets', '✓ 40% team growth this year', '→ angle: first conversations']
  ];
  let noteSet = 0;
  function playNotes() {
    const lines = noteSets[noteSet % noteSets.length];
    noteSet++;
    notes.replaceChildren();
    let lineIndex = 0;
    function typeLine() {
      if (lineIndex >= lines.length) { timers.push(setTimeout(() => { if (!document.hidden) playNotes(); }, 2600)); return; }
      const text = lines[lineIndex];
      const row = document.createElement('div');
      row.className = 'note-line';
      const mark = document.createElement('span');
      mark.className = text.startsWith('→') ? 'arrow' : 'tick';
      mark.textContent = text.slice(0, 1);
      const body = document.createElement('span');
      const caret = document.createElement('span');
      caret.className = 'note-caret';
      row.append(mark, body, caret);
      notes.append(row);
      let charIndex = 0;
      const typer = setInterval(() => {
        charIndex++;
        body.textContent = text.slice(2, 2 + charIndex);
        if (charIndex >= text.length - 2) {
          clearInterval(typer);
          caret.remove();
          lineIndex++;
          timers.push(setTimeout(typeLine, 320));
        }
      }, 26);
      timers.push(typer);
    }
    typeLine();
  }
  if (notes) {
    if (still) {
      notes.innerHTML = noteSets[0].map(l => `<div class="note-line"><span class="${l.startsWith('→') ? 'arrow' : 'tick'}">${l.slice(0, 1)}</span><span>${l.slice(2)}</span></div>`).join('');
    } else playNotes();
  }

  /* ---------- 3. inbox that keeps getting replies ---------- */
  const inbox = $('inbox-list');
  const badge = $('inbox-badge');
  const replies = [
    { from: 'alex · meridian', text: '“sounds relevant. let’s find a time.”' },
    { from: 'maya · form & field', text: '“ok, this is actually interesting.”' },
    { from: 'rory · westward', text: '“can you do thursday?”' },
    { from: 'anna · studio north', text: '“tell me more. over coffee?”' },
    { from: 'casey · signal house', text: '“forwarding this to my cofounder.”' }
  ];
  let replyIndex = 0;
  let unread = 2;
  function addMessage(from, text, instant) {
    const msg = document.createElement('div');
    msg.className = 'msg';
    const b = document.createElement('b');
    b.textContent = from;
    const span = document.createElement('span');
    span.textContent = text;
    msg.append(b, span);
    if (instant) msg.style.animation = 'none';
    inbox.append(msg);
    while (inbox.children.length > 3) inbox.firstElementChild.remove();
  }
  function inboxCycle() {
    const typing = document.createElement('div');
    typing.className = 'msg typing';
    typing.innerHTML = '<i></i><i></i><i></i>';
    inbox.append(typing);
    while (inbox.children.length > 3) inbox.firstElementChild.remove();
    timers.push(setTimeout(() => {
      typing.remove();
      const reply = replies[replyIndex % replies.length];
      replyIndex++;
      addMessage(reply.from, reply.text, false);
      unread++;
      badge.textContent = unread;
      badge.classList.remove('bump');
      void badge.offsetWidth;
      badge.classList.add('bump');
    }, 1100));
  }
  if (inbox) {
    addMessage('alex · meridian', replies[0].text, true);
    addMessage('maya · form & field', replies[1].text, true);
    replyIndex = 2;
    every(3600, inboxCycle);
  }

  /* ---------- 4. calendar that books itself ---------- */
  const calGrid = $('cal-grid');
  const calToast = $('cal-toast');
  const meetings = [
    { title: 'meridian', time: '10:00' },
    { title: 'westward', time: '14:00' },
    { title: 'parallel', time: '16:00' }
  ];
  if (calGrid) {
    for (let i = 0; i < 10; i++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      calGrid.append(cell);
    }
    let meetingIndex = 0;
    function bookOne() {
      const cells = calGrid.children;
      const meeting = meetings[meetingIndex % meetings.length];
      const cell = cells[(meetingIndex * 3 + 2) % cells.length];
      meetingIndex++;
      cell.classList.add('has-event');
      const event = document.createElement('div');
      event.className = 'cal-event';
      event.textContent = meeting.title + '\n' + meeting.time;
      cell.append(event);
      if (meetingIndex % 3 === 0) {
        calToast.classList.add('show');
        timers.push(setTimeout(() => {
          calToast.classList.remove('show');
          [...cells].forEach(c => { c.classList.remove('has-event'); c.replaceChildren(); });
        }, 2600));
      }
    }
    if (still) {
      calGrid.children[2].classList.add('has-event');
      const event = document.createElement('div');
      event.className = 'cal-event';
      event.textContent = meetings[0].title + '\n' + meetings[0].time;
      calGrid.children[2].append(event);
      calToast.classList.add('show');
    } else {
      bookOne();
      every(1900, bookOne);
    }
  }

  /* ---------- 5. notification toasts ---------- */
  const stack = $('toast-stack');
  const toastDefs = [
    { ava: 'AM', b: 'alex morgan replied', s: '“sounds relevant. let’s find a time.”', t: 'now' },
    { ava: 'SR', b: 'call booked · wed 10:00', s: 'you × layerwork · 30 min', t: '1m' },
    { ava: '+3', b: 'new warm leads', s: 'form & field · parallel · westward', t: '2m' },
    { ava: 'MC', b: 'maya chen opened your email', s: '4th time. she’s interested.', t: '3m' },
    { ava: 'JL', b: 'follow-up due', s: 'jordan lee · framewise', t: '4m' }
  ];
  let toastIndex = 0;
  function showToast() {
    if (document.hidden) return;
    const def = toastDefs[toastIndex % toastDefs.length];
    toastIndex++;
    const toast = document.createElement('div');
    toast.className = 'toast';
    const ava = document.createElement('span');
    ava.className = 't-ava';
    ava.textContent = def.ava;
    const body = document.createElement('div');
    const b = document.createElement('b');
    b.textContent = def.b;
    const s = document.createElement('span');
    s.textContent = def.s;
    body.append(b, s);
    const t = document.createElement('small');
    t.textContent = def.t;
    toast.append(ava, body, t);
    stack.append(toast);
    while (stack.children.length > 2) stack.firstElementChild.remove();
    timers.push(setTimeout(() => toast.remove(), 5200));
  }
  if (stack) {
    showToast();
    every(5600, showToast);
  }

  /* ---------- 6. live counter ---------- */
  const liveCount = $('live-count');
  if (liveCount) every(4200, () => { liveCount.textContent = String(2 + Math.floor(Math.random() * 4)); });

  /* ---------- easter eggs ---------- */
  const eggToast = $('egg-toast');
  let eggTimer;
  function say(text, ms = 2800) {
    eggToast.textContent = text;
    eggToast.classList.add('show');
    clearTimeout(eggTimer);
    eggTimer = setTimeout(() => eggToast.classList.remove('show'), ms);
  }

  function confetti(x, y, count = 26) {
    if (still) return;
    const colours = ['#ffc94d', '#5a3fd8', '#2aa3fc', '#fffefb', '#f5b81e'];
    for (let i = 0; i < count; i++) {
      const bit = document.createElement('span');
      bit.className = 'confetti-bit';
      bit.style.left = x + 'px';
      bit.style.top = y + 'px';
      bit.style.background = rand(colours);
      bit.style.setProperty('--dx', (Math.random() * 340 - 170) + 'px');
      bit.style.setProperty('--dy', (Math.random() * -260 - 40 + Math.random() * 420) + 'px');
      bit.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      bit.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
      document.body.append(bit);
      setTimeout(() => bit.remove(), 1700);
    }
  }

  // logo → confetti (and it still scrolls you home)
  const brand = $('brand-egg');
  brand.addEventListener('click', () => {
    const rect = brand.getBoundingClientRect();
    confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 30);
  });

  // the mascot watches your cursor
  const mascot = $('mascot');
  const eyes = $('mascot-eyes');
  const bubble = $('mascot-bubble');
  const mascotLines = [
    'psst… hover everything.',
    'the gold text? hover it.',
    'try typing “sales”. anywhere.',
    'konami code works here. just saying.',
    'we’re basically a hedge fund. but nice.',
    'that “do not press” button is lying.'
  ];
  if (!still) {
    addEventListener('mousemove', e => {
      const rect = mascot.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const angle = Math.atan2(dy, dx);
      const reach = Math.min(2.6, Math.hypot(dx, dy) / 60);
      eyes.style.transform = `translate(${Math.cos(angle) * reach}px, ${Math.sin(angle) * reach}px)`;
    }, { passive: true });
    every(22000, () => {
      bubble.textContent = rand(mascotLines);
      mascot.classList.add('chatty');
      timers.push(setTimeout(() => mascot.classList.remove('chatty'), 3200));
    });
  }
  mascot.addEventListener('click', () => {
    const rect = mascot.getBoundingClientRect();
    confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 34);
    bubble.textContent = rand(mascotLines);
    mascot.classList.add('chatty');
    setTimeout(() => mascot.classList.remove('chatty'), 2600);
  });

  // konami code → party mode
  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIndex = 0;
  function party() {
    document.body.classList.add('party');
    say('party mode. revenue optional.');
    const overlay = $('party-overlay');
    if (!still) {
      for (let i = 0; i < 42; i++) {
        const spark = document.createElement('span');
        spark.className = 'party-spark';
        spark.style.left = Math.random() * 100 + 'vw';
        spark.style.width = spark.style.height = (14 + Math.random() * 26) + 'px';
        spark.style.animationDuration = (2.2 + Math.random() * 2.6) + 's';
        spark.style.animationDelay = (Math.random() * 1.8) + 's';
        spark.innerHTML = '<svg viewBox="0 0 64 64"><use href="#spark"/></svg>';
        overlay.append(spark);
        setTimeout(() => spark.remove(), 7000);
      }
    }
    setTimeout(() => document.body.classList.remove('party'), 7000);
  }

  // typing “sales” anywhere (outside form fields) summons us
  let buffer = '';
  addEventListener('keydown', e => {
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === konami[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konami.length) { konamiIndex = 0; party(); }
    } else konamiIndex = e.key === konami[0] ? 1 : 0;
    if (e.key.length === 1) {
      buffer = (buffer + e.key.toLowerCase()).slice(-5);
      if (buffer === 'sales') { buffer = ''; say('did someone say sales?'); }
    }
  });

  // the ticker holds a grudge
  const ticker = $('ticker');
  let tickerStopped = false;
  function toggleTicker() {
    tickerStopped = !tickerStopped;
    ticker.classList.toggle('paused', tickerStopped);
    say(tickerStopped ? 'you stopped the pipeline. bold.' : 'pipeline resumed. phew.');
  }
  ticker.addEventListener('click', toggleTicker);
  ticker.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTicker(); } });

  // do not press
  const dnp = $('dnp-button');
  let dnpCount = 0;
  dnp.addEventListener('click', () => {
    dnpCount++;
    document.body.classList.remove('shake');
    void document.body.offsetWidth;
    document.body.classList.add('shake');
    if (dnpCount === 1) say('told you.');
    else if (dnpCount === 2) say('seriously?');
    else {
      say('ok fine. you’re hired.');
      const rect = dnp.getBoundingClientRect();
      confetti(rect.left + rect.width / 2, rect.top, 40);
      dnpCount = 0;
    }
  });

  // press for luck
  $('luck-button').addEventListener('click', e => {
    const rect = e.currentTarget.getBoundingClientRect();
    confetti(rect.left + rect.width / 2, rect.top, 22);
    say(rand([
      'fortune: a reply lands thursday.',
      'fortune: the quiet prospect says yes.',
      'fortune: your calendar fills itself.',
      'fortune: someone forwards your email today.'
    ]));
  });

  /* ---------- nap when the tab sleeps ---------- */
  document.addEventListener('visibilitychange', () => {
    // intervals keep their cadence; the heavy visual loops check document.hidden
    // and CSS animations pause automatically in hidden tabs.
  });
})();
