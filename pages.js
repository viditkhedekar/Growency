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
    const selector = '.page-header,.page-nav,.page-labels,.cohort-jumps,.page-copy li,.compensation,.header,.hero-copy,.film-frame,.hero-console,.client-monument,.founder-content,.team-card,.term-sheet,.qa,.workflow-stage,.workflow-controls,.pipeline-overview,.footer-layout,h1,h2,h3,p,a,button,label,figcaption,.footer-fine,.hero-actions,.hero-principles,.pilot-fit li';
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

  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('.page-motion');
  const chapters = [...document.querySelectorAll('main > .slide')];
  const nodes = chapters.map((chapter,index) => {
    const node = document.createElement('span');
    node.className = 'scene-node'; node.setAttribute('aria-hidden','true');
    node.innerHTML = `<svg viewBox="0 0 120 120"><use href="#mark"/></svg><span>${String(index+1).padStart(2,'0')}</span>`;
    chapter.append(node); return node;
  });
  let userPaused = false, progressFrame = 0;
  function updateProgress() {
    progressFrame = 0;
    const position = scrollY + innerHeight * .5;
    if (!userPaused && !preference.matches) {
      document.body.style.setProperty('--site-progress',String(position/document.body.scrollHeight));
      document.body.style.setProperty('--site-traveller-y',`${position}px`);
    }
    let current = 0;
    nodes.forEach((node,index) => {
      const r = node.getBoundingClientRect();
      const reached = r.top + r.height/2 <= innerHeight*.5;
      node.classList.toggle('milestone-reached',reached);
      if (reached) current = index;
    });
    nodes.forEach((node,index) => node.classList.toggle('milestone-current',index===current));
  }
  function scheduleProgress() { if (!progressFrame) progressFrame=requestAnimationFrame(updateProgress); }
  function configureMotion() {
    const paused = userPaused || preference.matches;
    root.classList.toggle('motion-paused',paused);
    root.classList.toggle('motion-enabled',!paused);
    toggle.hidden=preference.matches;
    toggle.setAttribute('aria-pressed',String(userPaused));
    toggle.querySelector('.motion-label').textContent=userPaused?'Resume motion':'Pause motion';
    toggle.lastElementChild.textContent=userPaused?'▷':'Ⅱ';
    scheduleProgress();
  }
  toggle.addEventListener('click',()=>{userPaused=!userPaused;configureMotion();});
  preference.addEventListener('change',configureMotion);
  addEventListener('scroll',scheduleProgress,{passive:true});
  addEventListener('resize',scheduleProgress);
  new ResizeObserver(scheduleProgress).observe(document.body);
  configureMotion();

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
