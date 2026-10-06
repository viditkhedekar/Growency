(() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const criteria = ['Series A–B funded','20–150 employees','UK or European HQ','£3m+ raised','Growing finance team','SaaS / technology company','Recently funded or rapidly hiring'];
  // All names, companies and signals in this illustrative campaign are fictional.
  const people = [
    {name:'Maya Patel',initials:'MP',role:'CFO',company:'Atlas Labs',
      fit:['Series B','84 employees','London','£14m raised','Hiring Financial Controller','B2B SaaS','Funded 3 months ago'],
      research:['Raised £14m Series B','Headcount up 62% in 12 months','Hiring a Financial Controller','Recently opened a US entity','Several separate reporting tools'],openingIndex:3,opening:'US expansion → multi-entity forecasting',
      subject:'Atlas’s US expansion',
      email:"Hi Maya,\nCame across Atlas while looking at companies that have recently expanded internationally.\nSaw the US launch and the Financial Controller hire. Usually around that point, reporting starts getting a lot more annoying than it used to be.\nWe built Northstar to give finance teams one place for forecasting, cash visibility and reporting without constantly rebuilding models.\nMight be completely off, but figured it was worth reaching out.\nOpen to a 15 minute chat?\nVidit",
      followup:'Just checking whether bringing UK and US reporting together is on your radar. Happy to show you how Northstar approaches it.',
      reply:'Sounds relevant. Happy to take a look — Tuesday at 10:30 works.',
      slot:'Tuesday · 10:30',brief:['Maya Patel — CFO','Series B · 84 employees','Recently expanded into the US','Interested in consolidating financial reporting','Primary pain: multi-entity forecasting']},
    {name:'Daniel Wong',initials:'DW',role:'Founder',company:'Relay Systems',
      fit:['Series A','46 employees','London','£7.5m raised','Finance team growing','SaaS','Hiring across 8 roles'],
      research:['Raised £7.5m Series A','Hiring across sales and engineering','Headcount doubled this year','Founder discussed operational visibility','Hiring the first Head of Finance'],openingIndex:4,opening:'First finance hire → founder-led reporting',
      subject:'Relay’s first finance hire',
      email:"Hi Daniel,\nSaw Relay is hiring its first Head of Finance after the Series A.\nI’m guessing a fair bit of the reporting and forecasting still sits with you or gets pulled together manually at the moment.\nThat’s basically why we built Northstar. It gives growing teams one place to track cash, forecasts and reporting before the finance function starts getting complicated.\nCould be too early for you, but thought the timing looked interesting.\nWorth a quick chat?\nVidit",
      followup:'Following up on the finance hire. If reporting is still founder-led, I can show you how Northstar brings the data into one place.',
      reply:'Good timing with the hire. Wednesday at 14:00 would work for me.',
      slot:'Wednesday · 14:00',brief:['Daniel Wong — Founder','Series A · 46 employees','Hiring the first Head of Finance','Current reporting is largely founder-led','Primary pain: scaling finance operations']},
    {name:'Sofia Martins',initials:'SM',role:'VP Finance',company:'Lumen AI',
      fit:['Series B','126 employees','London / Lisbon','£21m raised','6-person finance team','AI software','Expanding internationally'],
      research:['Expanded from the UK into Portugal','126 employees across two countries','Raised £21m','Hiring finance operations roles','Growing international reporting requirements'],openingIndex:0,opening:'Two countries → cross-entity reporting',
      subject:'Lumen’s UK and Portugal reporting',
      email:"Hi Sofia,\nSaw Lumen has been growing across the UK and Portugal.\nManaging reporting across two countries tends to create a lot of little manual jobs that somehow turn into very big ones.\nNorthstar brings the finance data into one place so teams can handle forecasts, cash visibility and cross-entity reporting without living in spreadsheets.\nNot sure if that’s something you’re dealing with at Lumen, but thought I’d ask.\nOpen to a quick chat next week?\nVidit",
      followup:'Checking back on cross-entity reporting. If the UK and Portugal teams are working from separate spreadsheets, Northstar may be relevant.',
      reply:'That’s something we’re looking at. Thursday at 11:00 works.',
      slot:'Thursday · 11:00',brief:['Sofia Martins — VP Finance','Series B · 126 employees','UK + Portugal','International finance team','Primary pain: cross-entity reporting']}
  ];
  // Playback durations and the animation share the same timing values.
  const timing = {
    pointer: 370, click: 180, loop: 700,
    criterion: 26, criterionHold: 110, collapse: 420, candidate: 180,
    fit: 240, shortlist: 1450, findHold: 1700,
    finding: 450, opening: 2200,
    typingLine: 150, typingPunctuation: 95, typingBeat: 24, typingVariation: 7,
    typedHold: 600, sendPress: 170, sentHold: 1000, followup: 1700, reply: 3400,
    calendar: 320, brief: 3300, calendarHold: 1700,
  };
  function emailFrames(email) {
    const frames = [];
    let length = 0, beat = 0;
    while (length < email.length) {
      const chunk = 3 + beat % 4, part = email.slice(length, length + chunk);
      length += chunk; beat++;
      frames.push({ length, duration: part.includes('\n') ? timing.typingLine : /[.?!]/.test(part) ? timing.typingPunctuation : timing.typingBeat + (beat % 4) * timing.typingVariation });
    }
    return frames;
  }
  const duration = {
    find: criteria.reduce((total, text) => total + timing.pointer + Math.ceil(text.length / 5) * timing.criterion + timing.criterionHold, 0)
      + timing.collapse + people.reduce((total, person) => total + timing.candidate + timing.pointer + person.fit.length * timing.fit + timing.shortlist, 0) + timing.findHold + timing.loop,
    research: people.reduce((total, person) => total + timing.pointer + timing.click + person.research.length * timing.finding + timing.pointer + timing.opening, 0) + timing.loop,
    conversation: people.reduce((total, person) => total + timing.pointer + emailFrames(person.email).reduce((sum, frame) => sum + frame.duration, 0)
      + timing.typedHold + timing.pointer + timing.click + timing.sendPress + timing.sentHold + timing.followup + timing.reply, 0) + timing.loop,
    booked: people.length * (timing.calendar + timing.pointer + timing.click + timing.brief) + timing.calendarHold + timing.loop,
  };
  const playbackClocks = new WeakMap();
  const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const players = [...document.querySelectorAll('[data-campaign]')].map(stage => ({stage,id:stage.dataset.campaign,controller:null,clockFrame:0}));
  if (!players.length) return;
  const q = (player,selector) => player.stage.querySelector(selector);
  const all = (player,selector) => [...player.stage.querySelectorAll(selector)];
  const status = (player,text,phase) => { q(player,'.campaign-status').textContent=text; player.stage.dataset.phase=phase; };
  const still = () => preference.matches || root.classList.contains('motion-paused');
  function paintPlayback(player, elapsed) {
    const total = duration[player.id], complete = elapsed >= total;
    const seconds = complete ? Math.ceil(total / 1000) : Math.floor(elapsed / 1000);
    player.progressFill.style.transform = `scaleX(${Math.min(1, elapsed / total)})`;
    if (player.seconds !== seconds) {
      player.seconds = seconds;
      player.elapsedText.textContent = formatTime(seconds);
      player.progress.setAttribute('aria-valuenow', String(seconds));
      player.progress.setAttribute('aria-valuetext', `${seconds} of ${Math.ceil(total / 1000)} seconds`);
    }
  }
  function tickPlayback(player) {
    const clock = playbackClocks.get(player.controller?.signal);
    if (!clock) return;
    paintPlayback(player, clock.elapsed + (clock.current?.elapsed() || 0));
    player.clockFrame = requestAnimationFrame(() => tickPlayback(player));
  }
  players.forEach(player => {
    const totalSeconds = Math.ceil(duration[player.id] / 1000);
    const label = q(player, '.campaign-bar > span:nth-child(2)').textContent;
    const footer = document.createElement('div');
    footer.className = 'campaign-playback';
    footer.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 2h6M12 2v3m6 1 2 2M12 9v4l3 2"/><circle cx="12" cy="14" r="8"/></svg><div class="campaign-playback-track" role="progressbar" aria-label="${label} demo playback" aria-valuemin="0" aria-valuemax="${totalSeconds}" aria-valuenow="0"><span></span></div><span class="campaign-playback-time" aria-hidden="true"><span class="campaign-elapsed">00:00</span><span class="campaign-time-divider"> / </span>${formatTime(totalSeconds)}</span>`;
    q(player, '.campaign-window').append(footer);
    player.progress = footer.querySelector('[role="progressbar"]');
    player.progressFill = player.progress.firstElementChild;
    player.elapsedText = footer.querySelector('.campaign-elapsed');
    paintPlayback(player, 0);
  });
  function wait(ms,signal) {
    return new Promise((resolve,reject) => {
      if(signal.aborted) {reject(new DOMException('Stopped','AbortError'));return;}
      const clock=playbackClocks.get(signal);
      let timer,started=null,consumed=0;
      const elapsed=()=>consumed+(started===null?0:Math.min(ms-consumed,performance.now()-started));
      const pause=()=>{consumed=elapsed();started=null;clearTimeout(timer);};
      const abort=()=>{pause();signal.removeEventListener('abort',abort);reject(new DOMException('Stopped','AbortError'));};
      const resume=()=>{
        if(started!==null||signal.aborted)return;
        started=performance.now();
        timer=setTimeout(()=>{
          signal.removeEventListener('abort',abort);
          if(clock){clock.elapsed+=ms;clock.current=null;}
          resolve();
        },Math.max(0,ms-consumed));
      };
      if(clock)clock.current={pause,resume,elapsed};
      signal.addEventListener('abort',abort,{once:true});
      if(!clock?.paused)resume();
    });
  }
  async function aim(player,target,signal,click=false) {
    if(!target)return;
    const pointer=q(player,'.campaign-pointer');
    const a=player.stage.getBoundingClientRect(),b=target.getBoundingClientRect();
    pointer.style.setProperty('--campaign-x',`${Math.max(8,Math.min(a.width-32,b.left-a.left+b.width*.72))}px`);
    pointer.style.setProperty('--campaign-y',`${Math.max(8,Math.min(a.height-36,b.top-a.top+b.height*.5))}px`);
    pointer.classList.add('is-visible');
    await wait(timing.pointer,signal);
    if(click){pointer.classList.add('is-clicking');await wait(timing.click,signal);pointer.classList.remove('is-clicking');}
  }
  function findPerson(player,index,complete=false) {
    const person=people[index];player.stage.dataset.person=String(index);
    q(player,'.candidate-name').textContent=person.name;
    q(player,'.candidate-role').textContent=`${person.role} · ${person.company}`;
    q(player,'.campaign-avatar').textContent=person.initials;
    q(player,'.candidate-sequence').textContent=`0${index+1} / 03`;
    all(player,'.candidate-checks li').forEach((row,i)=>{row.lastElementChild.textContent=person.fit[i];row.classList.toggle('is-checked',complete);});
    q(player,'.fit-result').textContent=complete?'7 of 7 criteria matched':'Reviewing the fit…';
  }
  function researchPerson(player,index,complete=false) {
    const person=people[index];player.stage.dataset.person=String(index);
    all(player,'[data-person]').forEach((tab,i)=>{tab.classList.toggle('is-active',i===index);});
    q(player,'.research-account h4').textContent=person.company;
    all(player,'.campaign-findings li').forEach((row,i)=>{
      row.querySelector('p').textContent=person.research[i];
      row.classList.toggle('is-revealed',complete);row.classList.toggle('is-opening',complete&&i===person.openingIndex);
    });
    q(player,'.research-opening p').textContent=complete?person.opening:'Finding the reason to reach out…';
  }
  function outreachPerson(player,index,complete=false) {
    const person=people[index];player.stage.dataset.person=String(index);
    q(player,'.mail-recipient').textContent=person.name;q(player,'.campaign-envelope small').textContent=person.company;
    q(player,'.mail-subject').textContent=person.subject;q(player,'.email-text').textContent=complete?person.email:'';
    q(player,'.campaign-email').scrollTop=0;
    q(player,'.mail-send').firstChild.textContent=complete?'Sent ':'Send ';
    all(player,'.campaign-mail-timeline li').forEach(row=>row.classList.toggle('is-complete',complete));
    q(player,'.campaign-reply').classList.toggle('is-shown',complete);
    reply(player,person.initials,`${person.name.split(' ')[0]} replied`,person.reply);
  }
  function reply(player,initials,from,text) {
    q(player,'.reply-avatar').textContent=initials;q(player,'.reply-from').textContent=from;q(player,'.campaign-reply p').textContent=text;
  }
  function calendarPerson(player,index,open=true) {
    const person=people[index];player.stage.dataset.person=String(index);
    all(player,'[data-meeting]').forEach((card,i)=>{card.classList.toggle('is-expanded',open&&i===index);});
    const brief=q(player,'.calendar-brief');brief.classList.toggle('is-shown',open);
    brief.querySelector('.brief-avatar').textContent=person.initials;brief.querySelector('h4').textContent=person.name;
    brief.querySelector('header p').textContent=`${person.role} · ${person.company}`;
    const list=brief.querySelector('ul');list.replaceChildren(...person.brief.map(value=>{const li=document.createElement('li');li.textContent=value;return li;}));
  }
  async function findFilm(player,signal) {
    const scene=q(player,'.find-scene'),card=q(player,'.candidate-card');
    scene.classList.remove('criteria-compact');card.hidden=true;
    all(player,'[data-shortlist]').forEach(chip=>chip.classList.remove('is-shortlisted'));
    const lines=all(player,'[data-criterion]');lines.forEach(line=>line.textContent='');
    status(player,'Northstar → defining the ideal customer','criteria');
    for(let i=0;i<criteria.length;i++){
      await aim(player,lines[i].parentElement,signal);
      for(let length=0;length<criteria[i].length;length+=5){lines[i].textContent=criteria[i].slice(0,length+5);await wait(timing.criterion,signal);}
      await wait(timing.criterionHold,signal);
    }
    q(player,'.campaign-pointer').classList.remove('is-visible');
    scene.classList.add('criteria-compact');await wait(timing.collapse,signal);
    for(let i=0;i<people.length;i++){
      card.hidden=true;findPerson(player,i);await wait(timing.candidate,signal);card.hidden=false;
      status(player,`${people[i].name} → checking against Northstar’s criteria`,'fit');
      const rows=all(player,'.candidate-checks li');
      await aim(player,card.querySelector('header'),signal);
      for(let r=0;r<rows.length;r++){rows[r].classList.add('is-checked');q(player,'.fit-result').textContent=`${r+1} of 7 criteria matched`;await wait(timing.fit,signal);}
      q(player,`[data-shortlist="${i}"]`).classList.add('is-shortlisted');
      status(player,`${people[i].company} → shortlisted for research`,'shortlisted');
      await wait(timing.shortlist,signal);
    }
    await wait(timing.findHold,signal);
  }
  async function researchFilm(player,signal) {
    for(let index=0;index<people.length;index++){
      await aim(player,q(player,`[data-person="${index}"]`),signal,true);
      researchPerson(player,index);
      status(player,`${people[index].company} → looking beyond the contact record`,'research');
      const rows=all(player,'.campaign-findings li');
      for(const row of rows){row.classList.add('is-revealed');await wait(timing.finding,signal);}
      await aim(player,rows[people[index].openingIndex],signal);
      rows[people[index].openingIndex].classList.add('is-opening');
      q(player,'.research-opening p').textContent=people[index].opening;
      status(player,`${people[index].company} → a relevant opening found`,'opening');
      await wait(timing.opening,signal);
    }
  }
  async function outreachFilm(player,signal) {
    for(let index=0;index<people.length;index++){
      const person=people[index];outreachPerson(player,index);
      status(player,`${person.company} → writing from the research`,'writing');
      await aim(player,q(player,'.campaign-envelope'),signal);
      q(player,'.campaign-pointer').classList.remove('is-visible');
      player.stage.classList.add('is-typing');
      for(const frame of emailFrames(person.email)){
        q(player,'.email-text').textContent=person.email.slice(0,frame.length);
        const email=q(player,'.campaign-email');email.scrollTop=email.scrollHeight;
        await wait(frame.duration,signal);
      }
      player.stage.classList.remove('is-typing');await wait(timing.typedHold,signal);
      await aim(player,q(player,'.mail-send'),signal,true);
      q(player,'.mail-send').classList.add('is-pressed');await wait(timing.sendPress,signal);q(player,'.mail-send').classList.remove('is-pressed');
      q(player,'.mail-send').firstChild.textContent='Sent ';
      const timeline=all(player,'.campaign-mail-timeline li');timeline[0].classList.add('is-complete');
      status(player,`Day 1 → personal email sent to ${person.name.split(' ')[0]}`,'sent');await wait(timing.sentHold,signal);
      timeline[1].classList.add('is-complete');reply(player,'VK','Vidit · follow-up',person.followup);q(player,'.campaign-reply').classList.add('is-shown');
      status(player,'Day 4 → a relevant follow-up, still handled by a person','followup');await wait(timing.followup,signal);
      timeline[2].classList.add('is-complete');reply(player,person.initials,`${person.name.split(' ')[0]} replied`,person.reply);
      status(player,`Day 6 → genuine interest. ${person.slot} agreed.`,'reply');await wait(timing.reply,signal);
    }
  }
  async function calendarFilm(player,signal) {
    for(let index=0;index<people.length;index++){
      calendarPerson(player,index,false);await wait(timing.calendar,signal);
      await aim(player,q(player,`[data-meeting="${index}"]`),signal,true);
      calendarPerson(player,index,true);
      status(player,`${people[index].slot} → ${people[index].company} × Northstar`,'brief');
      await wait(timing.brief,signal);
    }
    status(player,'Three conversations. Research and replies handed over.','booked');await wait(timing.calendarHold,signal);
  }
  const films={find:findFilm,research:researchFilm,conversation:outreachFilm,booked:calendarFilm};
  function stopped(player,complete=false) {
    cancelAnimationFrame(player.clockFrame);player.clockFrame=0;
    const clock=playbackClocks.get(player.controller?.signal);
    if(clock){clock.paused=true;clock.current?.pause();}
    if(complete){
      player.controller?.abort();player.controller=null;
      q(player,'.campaign-pointer').classList.remove('is-visible','is-clicking');
      player.stage.classList.remove('is-typing');
      q(player,'.mail-send')?.classList.remove('is-pressed');
    }
    player.stage.dataset.playback='parked';
  }
  function completedFrame(player) {
    paintPlayback(player,duration[player.id]);
    const index=Number(player.stage.dataset.person||0);
    if(player.id==='find'){
      q(player,'.find-scene').classList.add('criteria-compact');q(player,'.candidate-card').hidden=false;
      all(player,'[data-criterion]').forEach((line,i)=>line.textContent=criteria[i]);findPerson(player,index,true);
      all(player,'[data-shortlist]').forEach(chip=>chip.classList.add('is-shortlisted'));
    } else if(player.id==='research')researchPerson(player,index,true);
    else if(player.id==='conversation')outreachPerson(player,index,true);
    else calendarPerson(player,index,true);
    status(player,{'find':'A focused list for Northstar','research':'A relevant opening, grounded in research','conversation':'From the first email to genuine interest','booked':'Three conversations. All the context.'}[player.id],'complete');
  }
  function start(player) {
    if(player.controller){
      const clock=playbackClocks.get(player.controller.signal);
      if(clock?.paused){clock.paused=false;clock.current?.resume();player.stage.dataset.playback='playing';tickPlayback(player);}
      return;
    }
    const controller=new AbortController();player.controller=controller;player.stage.dataset.playback='playing';
    const clock={elapsed:0,current:null,paused:false};
    playbackClocks.set(controller.signal,clock);
    tickPlayback(player);
    (async()=>{while(!controller.signal.aborted){
      clock.elapsed=0;clock.current=null;paintPlayback(player,0);
      await films[player.id](player,controller.signal);await wait(timing.loop,controller.signal);
      paintPlayback(player,duration[player.id]);
    }})()
      .catch(error=>{if(error.name!=='AbortError')console.error('Campaign animation:',error);})
      .finally(()=>{if(player.controller===controller){cancelAnimationFrame(player.clockFrame);player.clockFrame=0;player.controller=null;}});
  }
  let frame=0;
  function update() {
    frame=0;
    if(document.hidden||still()){players.forEach(player=>{stopped(player,still());if(still())completedFrame(player);});return;}
    const active=window.GROWENCY_DEMOS?.activeStep;
    const closest=active?players.find(player=>active.contains(player.stage)):null;
    players.forEach(player=>player===closest?start(player):stopped(player));
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  new IntersectionObserver(schedule,{threshold:[0,.1,.25,.5]}).observe(document.querySelector('.journey'));
  players.forEach(player=>{completedFrame(player);new IntersectionObserver(schedule,{threshold:[0,.1,.25,.5]}).observe(player.stage);});
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  addEventListener('load',schedule,{once:true});preference.addEventListener('change',schedule);
  new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',schedule);
  document.addEventListener('growency:demo-step',schedule);
  document.addEventListener('growency:demo-layout',schedule);

  // Body copy types once on arrival, then remains complete for reading and review.
  const copies=[...document.querySelectorAll('.campaign-copy')].map(element=>({element,controller:null,started:false,text:element.querySelector('.sr-only').textContent}));
  function paintCopy(copy,length=copy.text.length) {
    const span=copy.element.querySelector('.copy-animated'),text=copy.text.slice(0,length),highlight=copy.element.dataset.highlight;
    span.replaceChildren();
    if(copy.element.classList.contains('calendar-copy')){
      const split=copy.text.indexOf('Over to you.');span.append(document.createTextNode(text.slice(0,split).trimEnd()));
      if(length>split){const em=document.createElement('em');em.textContent=text.slice(split);span.append(document.createElement('br'),em);}
    }else{
      const start=text.indexOf(highlight);
      if(start<0)span.textContent=text;
      else {const mark=document.createElement(copy.element.classList.contains('campaign-heading')?'em':'mark');mark.textContent=highlight;span.append(document.createTextNode(text.slice(0,start)),mark,document.createTextNode(text.slice(start+highlight.length)));}
    }
  }
  async function typeCopy(copy) {
    if(copy.started)return;copy.started=true;
    if(still()){paintCopy(copy);return;}
    copy.element.style.minHeight=`${copy.element.offsetHeight}px`;
    const controller=new AbortController();copy.controller=controller;copy.element.classList.add('is-copy-typing');
    try {for(let length=0;length<copy.text.length;length+=3){paintCopy(copy,length+3);await wait(38,controller.signal);}}
    catch(error){if(error.name!=='AbortError')throw error;}
    finally {paintCopy(copy);copy.element.classList.remove('is-copy-typing');copy.element.style.removeProperty('min-height');copy.controller=null;}
  }
  const copyObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting&&!entry.target.closest('[inert]')){const copy=copies.find(c=>c.element===entry.target);typeCopy(copy);copyObserver.unobserve(entry.target);}});},{threshold:.25});
  document.addEventListener('growency:demo-step',event=>{
    const copy=copies.find(c=>event.detail.step.contains(c.element));
    if(copy)typeCopy(copy);
  });
  copies.forEach(copy=>copyObserver.observe(copy.element));
  function stopCopyMotion(){if(document.hidden||still())copies.forEach(copy=>{copy.controller?.abort();paintCopy(copy);copy.element.classList.remove('is-copy-typing');});}
  new MutationObserver(stopCopyMotion).observe(root,{attributes:true,attributeFilter:['class']});
  preference.addEventListener('change',stopCopyMotion);document.addEventListener('visibilitychange',stopCopyMotion);
  schedule();
})();
