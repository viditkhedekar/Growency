(() => {
  // Keep the central thread in the whitespace: neither its line nor its traveller crosses copy.
  const rail = document.querySelector('.site-rail');
  let maskFrame;
  function rebuildMask() {
    maskFrame = 0;
    if (!rail) return;
    const centre = innerWidth / 2;
    const height = document.body.scrollHeight;
    const clearance = innerWidth <= 700 ? 26 : 36;
    const intervals = [];
    const selector = '.header,.hero-copy,.film-frame,.hero-console,.client-monument,.founder-content,.team-card,.term-sheet,.qa,.workflow-stage,.workflow-controls,.pipeline-overview,.footer-layout,h1,h2,h3,p,a,button,label,figcaption,.footer-fine,.hero-actions,.hero-principles,.pilot-fit li';
    document.querySelectorAll(selector).forEach(el => {
      if (el.closest('[hidden],.site-rail,.scene-node,.step-node,.journey-dock') || el.getAttribute('aria-hidden') === 'true') return;
      const r = el.getBoundingClientRect();
      if (r.width && r.height && r.left < centre + clearance && r.right > centre - clearance) {
        intervals.push([Math.max(0,r.top + scrollY - 14),Math.min(height,r.bottom + scrollY + 14)]);
      }
    });
    intervals.sort((a,b) => a[0]-b[0]);
    const merged = [];
    for (const interval of intervals) {
      const last = merged[merged.length-1];
      if (last && interval[0] <= last[1]) last[1] = Math.max(last[1],interval[1]);
      else merged.push(interval);
    }
    const stops = ['#000 0px'];
    for (const [start,end] of merged) stops.push(`#000 ${start}px`,`transparent ${start}px`,`transparent ${end}px`,`#000 ${end}px`);
    stops.push(`#000 ${height}px`);
    rail.style.setProperty('--rail-mask', `linear-gradient(to bottom,${stops.join(',')})`);
    rail.dataset.clearAreas = String(merged.length);
  }
  function scheduleMask() { if (!maskFrame) maskFrame = requestAnimationFrame(rebuildMask); }
  new ResizeObserver(scheduleMask).observe(document.body);
  addEventListener('resize',scheduleMask);
  addEventListener('load',scheduleMask);
  document.addEventListener('toggle',scheduleMask,true);
  document.addEventListener('transitionend',scheduleMask,true);
  document.addEventListener('animationend',scheduleMask,true);
  if (document.fonts) document.fonts.ready.then(scheduleMask);
  scheduleMask();

  // Keyboard-accessible tabs in the hero: the preview links straight into the matching demo.
  const previewContent = {
    leads: ['Alex at Meridian','Company signal found. Research comes next.','AM','#find'],
    outreach: ['A personal introduction','The email, the follow-up, and a person handling the reply.','↗','#conversation'],
    calls: ['An interested conversation','A time that works. A brief ready for your team.','✓','#booked']
  };
  const tabs = [...document.querySelectorAll('[data-preview]')];
  function selectPreview(tab) {
    const [title,description,avatar,link] = previewContent[tab.dataset.preview];
    tabs.forEach(el => { el.setAttribute('aria-selected',String(el===tab)); el.tabIndex = el===tab ? 0 : -1; });
    document.querySelector('#preview-title').textContent = title;
    document.querySelector('#preview-description').textContent = description;
    document.querySelector('.console-avatar').textContent = avatar;
    document.querySelector('.console-open').href = link;
    const panel = document.querySelector('#hero-preview');
    panel.setAttribute('aria-labelledby',tab.id);
    panel.classList.remove('is-changing');
    requestAnimationFrame(()=>panel.classList.add('is-changing'));
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click',()=>selectPreview(tab));
    tab.addEventListener('keydown',e=>{
      let next;
      if (e.key==='ArrowRight') next=tabs[(index+1)%tabs.length];
      if (e.key==='ArrowLeft') next=tabs[(index+tabs.length-1)%tabs.length];
      if (e.key==='Home') next=tabs[0]; if (e.key==='End') next=tabs[tabs.length-1];
      if (next) { e.preventDefault(); next.focus(); selectPreview(next); }
    });
  });

  const enrichButton=document.querySelector('#enrich-lead');
  const checks=[...document.querySelectorAll('[data-enrich]')];
  let enrichTimers=[];
  function clearResearch() {
    enrichTimers.forEach(clearTimeout); enrichTimers=[];
    checks.forEach(el=>el.classList.remove('is-checked'));
    enrichButton.disabled=false;
    document.querySelector('#enrich-status').textContent='Context ready to review';
  }
  function runResearch() {
    clearResearch(); enrichButton.disabled=true;
    const status=document.querySelector('#enrich-status'); status.textContent='Researching this sample account…';
    const still=matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-paused');
    checks.forEach((el,i)=>{
      const update=()=>{ el.classList.add('is-checked'); status.textContent=`${el.textContent} reviewed`; };
      if(still)update();else enrichTimers.push(setTimeout(update,(i+1)*450));
    });
    const finish=()=>{ status.textContent='Context checked. Choose your angle.'; enrichButton.disabled=false; document.querySelector('.research-evidence').open=true; scheduleMask(); };
    if(still)finish();else enrichTimers.push(setTimeout(finish,1600));
  }
  enrichButton.addEventListener('click',runResearch);
  document.querySelector('#prospect-results').addEventListener('click',clearResearch);
  document.addEventListener('growency:demo-stopped',()=>{
    enrichTimers.forEach(clearTimeout); enrichTimers=[]; enrichButton.disabled=false;
  });

  const shortlist = new Map();
  function renderShortlist() {
    const list=document.querySelector('#shortlist-items'); list.replaceChildren();
    document.querySelector('#shortlist-count').textContent=`${shortlist.size} shortlisted`;
    if(!shortlist.size) { list.textContent='Add a sample lead to build your shortlist.'; return; }
    shortlist.forEach((name,id)=>{
      const row=document.createElement('button'); row.type='button'; row.textContent=`${name} ×`;
      row.setAttribute('aria-label',`Remove ${name} from shortlist`);
      row.addEventListener('click',()=>{shortlist.delete(id);renderShortlist();}); list.append(row);
    });
  }
  function addShortlist() {
    const row=document.querySelector('.prospect-row[aria-pressed="true"]'); if(!row)return;
    shortlist.set(row.dataset.prospect,row.querySelector('b').textContent);
    renderShortlist(); document.querySelector('.demo-shortlist').open=true;
  }
  document.querySelector('#add-shortlist').addEventListener('click',addShortlist);
  document.querySelector('#clear-shortlist').addEventListener('click',()=>{shortlist.clear();renderShortlist();});

  const followupButton=document.querySelector('#add-followup');
  const followup=document.querySelector('#followup-editor');
  function setFollowup(visible) {
    followup.classList.remove('followup-cancelled');
    followup.hidden=!visible; followupButton.setAttribute('aria-expanded',String(!followup.hidden));
    followupButton.textContent=followup.hidden?'+ Add a follow-up':'− Remove follow-up';
    scheduleMask();
  }
  followupButton.addEventListener('click',()=>setFollowup(followup.hidden));
  document.querySelector('#followup-delay').addEventListener('change',e=>{
    document.querySelector('#send-status').textContent=`Follow-up queued after ${e.target.value} days if there is no reply`;
  });
  const channelButtons=[...document.querySelectorAll('[data-channel]')];
  channelButtons.forEach(button=>button.addEventListener('click',()=>{
    channelButtons.forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
    const email=button.dataset.channel==='email';
    document.querySelector('#channel-description').textContent=email?'Personal email introduction':'Personal LinkedIn introduction';
    document.querySelector('#conversation .window-section').textContent=email?'Email outreach':'LinkedIn outreach';
    document.querySelector('.compose-subject').hidden=!email;
    document.querySelector('#send-demo').dispatchEvent(new Event('channelchange'));
  }));
  function setTask(key, done) {
    const button=document.querySelector(`[data-task="${key}"]`);
    button.classList.toggle('is-done',done); button.setAttribute('aria-pressed',String(done));
    const ready=[...document.querySelectorAll('[data-task]')].every(el=>el.classList.contains('is-done'));
    document.querySelector('#calendar-task-status').textContent=ready?'Research + reply context ready':'Your handover is being prepared';
  }
  document.querySelectorAll('[data-task]').forEach(button=>button.addEventListener('click',()=>setTask(button.dataset.task,!button.classList.contains('is-done'))));
  Object.assign(window.GrowencyDemo, {
    runResearch, clearResearch, addShortlist, setFollowup, setTask,
    researchChecked: key => document.querySelector(`[data-enrich="${key}"]`).classList.contains('is-checked'),
    prepareBrief() {
      const lead=window.GrowencyDemo.context();
      document.querySelector('#brief-context').textContent=`${lead.name}, ${lead.role.toLowerCase()} at ${lead.company}, replied to the personal introduction and agreed to Wednesday at 14:00.`;
      document.querySelector('.handover-brief').open=true;
      scheduleMask();
    }
  });
  document.querySelector('#reset-workflow').addEventListener('click',()=>{
    clearResearch(); shortlist.clear(); renderShortlist();
    followup.hidden=true;followupButton.setAttribute('aria-expanded','false');followupButton.textContent='+ Add a follow-up';
    document.querySelector('.demo-shortlist').open=false;
    document.querySelector('.research-evidence').open=false;
    document.querySelectorAll('[data-task]').forEach(el=>{el.classList.remove('is-done');el.setAttribute('aria-pressed','false');});
    document.querySelector('#calendar-task-status').textContent='Your handover is being prepared';
    document.querySelector('#followup-delay').value='3';
    channelButtons[0].click(); scheduleMask();
  });

  // Native SVG cursor plus a lightweight halo; native text/drag cursors still apply.
  if(matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const halo=document.createElement('div');halo.className='cursor-halo';halo.setAttribute('aria-hidden','true');document.body.append(halo);
    let pointerFrame=0,x=0,y=0;
    document.addEventListener('pointermove',e=>{
      x=e.clientX;y=e.clientY;halo.classList.add('is-visible');
      halo.classList.toggle('is-link',!!e.target.closest('a,button,summary,[data-info]'));
      if(!pointerFrame)pointerFrame=requestAnimationFrame(()=>{halo.style.transform=`translate3d(${x}px,${y}px,0)`;pointerFrame=0;});
    },{passive:true});
    document.addEventListener('pointerout',e=>{if(!e.relatedTarget)halo.classList.remove('is-visible');});
    document.addEventListener('focusin',()=>halo.classList.remove('is-visible'));
  }
})();
