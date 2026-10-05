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
      email:'Maya — saw Atlas opened a US entity after the Series B.\n\nHow are you combining the UK and US forecasts while the finance team grows?\n\nNorthstar connects accounting, banking and CRM data in one place, so finance teams can update reporting without rebuilding spreadsheets.\n\nWorth a quick look next week?\n\nVidit',
      followup:'Just checking whether bringing UK and US reporting together is on your radar. Happy to show you how Northstar approaches it.',
      reply:'Sounds relevant. Happy to take a look — Tuesday at 10:30 works.',
      slot:'Tuesday · 10:30',brief:['Maya Patel — CFO','Series B · 84 employees','Recently expanded into the US','Interested in consolidating financial reporting','Primary pain: multi-entity forecasting']},
    {name:'Daniel Wong',initials:'DW',role:'Founder',company:'Relay Systems',
      fit:['Series A','46 employees','London','£7.5m raised','Finance team growing','SaaS','Hiring across 8 roles'],
      research:['Raised £7.5m Series A','Hiring across sales and engineering','Headcount doubled this year','Founder discussed operational visibility','Hiring the first Head of Finance'],openingIndex:4,opening:'First finance hire → founder-led reporting',
      subject:'Relay’s first finance hire',
      email:'Daniel — saw Relay is hiring its first Head of Finance.\n\nIs reporting still sitting with you until that person starts?\n\nNorthstar connects accounting, banking and CRM data, giving your first finance hire one place to build forecasts and track runway.\n\nWorth a quick look next week?\n\nVidit',
      followup:'Following up on the finance hire. If reporting is still founder-led, I can show you how Northstar brings the data into one place.',
      reply:'Good timing with the hire. Wednesday at 14:00 would work for me.',
      slot:'Wednesday · 14:00',brief:['Daniel Wong — Founder','Series A · 46 employees','Hiring the first Head of Finance','Current reporting is largely founder-led','Primary pain: scaling finance operations']},
    {name:'Sofia Martins',initials:'SM',role:'VP Finance',company:'Lumen AI',
      fit:['Series B','126 employees','London / Lisbon','£21m raised','6-person finance team','AI software','Expanding internationally'],
      research:['Expanded from the UK into Portugal','126 employees across two countries','Raised £21m','Hiring finance operations roles','Growing international reporting requirements'],openingIndex:0,opening:'Two countries → cross-entity reporting',
      subject:'Lumen’s UK and Portugal reporting',
      email:'Sofia — saw Lumen has expanded from the UK into Portugal.\n\nAre the two teams managing forecasts separately?\n\nNorthstar brings accounting, banking and CRM data together, so your finance team can work on cross-entity reporting without maintaining separate spreadsheets.\n\nWorth a quick look next week?\n\nVidit',
      followup:'Checking back on cross-entity reporting. If the UK and Portugal teams are working from separate spreadsheets, Northstar may be relevant.',
      reply:'That’s something we’re looking at. Thursday at 11:00 works.',
      slot:'Thursday · 11:00',brief:['Sofia Martins — VP Finance','Series B · 126 employees','UK + Portugal','International finance team','Primary pain: cross-entity reporting']}
  ];
  const players = [...document.querySelectorAll('[data-campaign]')].map(stage => ({stage,id:stage.dataset.campaign,controller:null}));
  if (!players.length) return;
  const q = (player,selector) => player.stage.querySelector(selector);
  const all = (player,selector) => [...player.stage.querySelectorAll(selector)];
  const status = (player,text,phase) => { q(player,'.campaign-status').textContent=text; player.stage.dataset.phase=phase; };
  const still = () => preference.matches || root.classList.contains('motion-paused');
  function wait(ms,signal) {
    return new Promise((resolve,reject) => {
      if(signal.aborted) {reject(new DOMException('Stopped','AbortError'));return;}
      const abort=()=>{clearTimeout(timer);reject(new DOMException('Stopped','AbortError'));};
      const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);
      signal.addEventListener('abort',abort,{once:true});
    });
  }
  async function aim(player,target,signal,click=false) {
    if(!target)return;
    const pointer=q(player,'.campaign-pointer');
    const a=player.stage.getBoundingClientRect(),b=target.getBoundingClientRect();
    pointer.style.setProperty('--campaign-x',`${Math.max(8,Math.min(a.width-32,b.left-a.left+b.width*.72))}px`);
    pointer.style.setProperty('--campaign-y',`${Math.max(8,Math.min(a.height-36,b.top-a.top+b.height*.5))}px`);
    pointer.classList.add('is-visible');
    await wait(370,signal);
    if(click){pointer.classList.add('is-clicking');await wait(180,signal);pointer.classList.remove('is-clicking');}
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
      for(let length=0;length<criteria[i].length;length+=5){lines[i].textContent=criteria[i].slice(0,length+5);await wait(26,signal);}
      await wait(110,signal);
    }
    q(player,'.campaign-pointer').classList.remove('is-visible');
    scene.classList.add('criteria-compact');await wait(420,signal);
    for(let i=0;i<people.length;i++){
      card.hidden=true;findPerson(player,i);await wait(180,signal);card.hidden=false;
      status(player,`${people[i].name} → checking against Northstar’s criteria`,'fit');
      const rows=all(player,'.candidate-checks li');
      await aim(player,card.querySelector('header'),signal);
      for(let r=0;r<rows.length;r++){rows[r].classList.add('is-checked');q(player,'.fit-result').textContent=`${r+1} of 7 criteria matched`;await wait(240,signal);}
      q(player,`[data-shortlist="${i}"]`).classList.add('is-shortlisted');
      status(player,`${people[i].company} → shortlisted for research`,'shortlisted');
      await wait(1450,signal);
    }
    await wait(1700,signal);
  }
  async function researchFilm(player,signal) {
    for(let index=0;index<people.length;index++){
      await aim(player,q(player,`[data-person="${index}"]`),signal,true);
      researchPerson(player,index);
      status(player,`${people[index].company} → looking beyond the contact record`,'research');
      const rows=all(player,'.campaign-findings li');
      for(const row of rows){row.classList.add('is-revealed');await wait(450,signal);}
      await aim(player,rows[people[index].openingIndex],signal);
      rows[people[index].openingIndex].classList.add('is-opening');
      q(player,'.research-opening p').textContent=people[index].opening;
      status(player,`${people[index].company} → a relevant opening found`,'opening');
      await wait(2200,signal);
    }
  }
  async function outreachFilm(player,signal) {
    for(let index=0;index<people.length;index++){
      const person=people[index];outreachPerson(player,index);
      status(player,`${person.company} → writing from the research`,'writing');
      await aim(player,q(player,'.campaign-envelope'),signal);
      q(player,'.campaign-pointer').classList.remove('is-visible');
      player.stage.classList.add('is-typing');
      let length=0,beat=0;
      while(length<person.email.length){
        const chunk=3+beat%4,part=person.email.slice(length,length+chunk);length+=chunk;beat++;
        q(player,'.email-text').textContent=person.email.slice(0,length);
        await wait(part.includes('\n')?150:/[.?!]/.test(part)?95:24+(beat%4)*7,signal);
      }
      player.stage.classList.remove('is-typing');await wait(600,signal);
      await aim(player,q(player,'.mail-send'),signal,true);
      q(player,'.mail-send').classList.add('is-pressed');await wait(170,signal);q(player,'.mail-send').classList.remove('is-pressed');
      q(player,'.mail-send').firstChild.textContent='Sent ';
      const timeline=all(player,'.campaign-mail-timeline li');timeline[0].classList.add('is-complete');
      status(player,`Day 1 → personal email sent to ${person.name.split(' ')[0]}`,'sent');await wait(1000,signal);
      timeline[1].classList.add('is-complete');reply(player,'VK','Vidit · follow-up',person.followup);q(player,'.campaign-reply').classList.add('is-shown');
      status(player,'Day 4 → a relevant follow-up, still handled by a person','followup');await wait(1700,signal);
      timeline[2].classList.add('is-complete');reply(player,person.initials,`${person.name.split(' ')[0]} replied`,person.reply);
      status(player,`Day 6 → genuine interest. ${person.slot} agreed.`,'reply');await wait(3400,signal);
    }
  }
  async function calendarFilm(player,signal) {
    for(let index=0;index<people.length;index++){
      calendarPerson(player,index,false);await wait(320,signal);
      await aim(player,q(player,`[data-meeting="${index}"]`),signal,true);
      calendarPerson(player,index,true);
      status(player,`${people[index].slot} → ${people[index].company} × Northstar`,'brief');
      await wait(3300,signal);
    }
    status(player,'Three conversations. Research and replies handed over.','booked');await wait(1700,signal);
  }
  const films={find:findFilm,research:researchFilm,conversation:outreachFilm,booked:calendarFilm};
  function stopped(player) {
    player.controller?.abort();player.controller=null;
    q(player,'.campaign-pointer').classList.remove('is-visible','is-clicking');
    player.stage.classList.remove('is-typing');
    q(player,'.mail-send')?.classList.remove('is-pressed');
    player.stage.dataset.playback='parked';
  }
  function completedFrame(player) {
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
    if(player.controller)return;
    const controller=new AbortController();player.controller=controller;player.stage.dataset.playback='playing';
    (async()=>{while(!controller.signal.aborted){await films[player.id](player,controller.signal);await wait(700,controller.signal);}})()
      .catch(error=>{if(error.name!=='AbortError')console.error('Campaign animation:',error);})
      .finally(()=>{if(player.controller===controller)player.controller=null;});
  }
  let frame=0;
  function update() {
    frame=0;
    if(document.hidden||still()){players.forEach(player=>{stopped(player);if(still())completedFrame(player);});return;}
    let closest=null,distance=Infinity;
    players.forEach(player=>{
      if(player.stage.closest('[inert]'))return;
      const r=player.stage.getBoundingClientRect();
      if(r.bottom>60&&r.top<innerHeight-60){const delta=Math.abs(r.top+r.height/2-innerHeight/2);if(delta<distance){distance=delta;closest=player;}}
    });
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
