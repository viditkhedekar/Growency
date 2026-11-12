(() => {
  const root = document.documentElement;
  const rail = document.querySelector('.site-rail');
  const track = document.querySelector('.journey-track');
  const traveller = rail?.querySelector('.site-traveller');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px), (pointer: coarse)');
  let geometry, maskFrame=0, scrollFrame=0;
  let progress, routePath, liveLayer, liveSvg, liveProgress, clearAreas=[];
  if (rail && track) {
    root.classList.add('routed-rail');
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.classList.add('site-rail-svg');svg.setAttribute('aria-hidden','true');
    svg.innerHTML='<defs><linearGradient id="routed-rail-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e97ee"/><stop offset=".5" stop-color="#aaa3f3"/><stop offset="1" stop-color="#7152bd"/></linearGradient></defs><path class="rail-casing"/><path class="rail-track"/><path class="rail-progress"/>';
    rail.prepend(svg);progress=svg.querySelector('.rail-progress');
    routePath=svg.querySelector('.rail-track');
    // The mobile illuminated path paints only a viewport-sized surface. The
    // full-page casing and track remain static underneath it.
    liveLayer=document.createElement('div');liveLayer.className='rail-live';liveLayer.setAttribute('aria-hidden','true');
    liveSvg=svg.cloneNode(true);
    liveSvg.classList.remove('site-rail-svg');
    liveSvg.querySelector('linearGradient').id='rail-live-gradient';
    liveSvg.querySelectorAll('.rail-casing,.rail-track').forEach(path=>path.remove());
    liveProgress=liveSvg.querySelector('.rail-progress');
    liveProgress.style.stroke='url(#rail-live-gradient)';
    liveLayer.append(liveSvg);rail.after(liveLayer);
  }
  function measureRoute() {
    if(!progress)return;
    const width=innerWidth,height=Math.max(document.body.offsetHeight,innerHeight);
    const r=track.getBoundingClientRect();
    const entry=r.top+scrollY+(width<=700?48:width<=1100?65:90);
    const exit=r.bottom+scrollY+(width<=700?48:70);
    const centre=width/2,right=width-(width<=700?14:width<=1100?24:32);
    const radius=width<=700?16:24;
    const bend=right-centre+2*radius*(1.62322524014-1);
    const offset=bend-2*radius;
    const d=`M ${centre} 0 V ${entry-radius} Q ${centre} ${entry} ${centre+radius} ${entry} H ${right-radius} Q ${right} ${entry} ${right} ${entry+radius} V ${exit-radius} Q ${right} ${exit} ${right-radius} ${exit} H ${centre+radius} Q ${centre} ${exit} ${centre} ${exit+radius} V ${height}`;
    const svg=rail.querySelector('svg.site-rail-svg');
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    svg.querySelectorAll('path').forEach(path=>path.setAttribute('d',d));
    liveProgress.setAttribute('d',d);
    root.classList.toggle('rail-lite',mobile.matches);
    (mobile.matches?liveLayer:rail).append(traveller);
    geometry={width,height,entry,exit,centre,right,radius,offset,window:width<=700?55:80,total:routePath.getTotalLength()};
    rail.dataset.route='centre-right-centre';
    rebuildMask();updateScroll();
  }
  // Scrolling through a turn advances along the horizontal piece of the same
  // path. The traveller and illuminated stroke always share its exact geometry.
  function distanceAt(position) {
    const g=geometry,w=g.window;
    if(position<g.entry-w)return position;
    if(position<g.entry+w)return g.entry-w+(position-g.entry+w)/(2*w)*(2*w+g.offset);
    if(position<g.exit-w)return position+g.offset;
    if(position<g.exit+w)return g.exit-w+g.offset+(position-g.exit+w)/(2*w)*(2*w+g.offset);
    return position+2*g.offset;
  }
  function routeX(y) {
    const g=geometry;
    return y>=g.entry-g.radius && y<=g.exit+g.radius?g.right:g.centre;
  }
  function rebuildMask() {
    if(!geometry)return;
    const {height,entry,exit,centre,right,radius}=geometry;
    const clearance=innerWidth<=700?16:32,intervals=[];
    const selector='.minimal-hero,.header,.hero-copy,.film-frame,.client-monument,.founder-content,.team-card,.term-sheet,.qa,.workflow-stage,.footer-layout,h1,h2,h3,p,a,button,label,figcaption,.footer-fine,.hero-actions,.hero-principles';
    document.querySelectorAll(selector).forEach(el=>{
      if(el.closest('[hidden],[inert],.site-rail,.scene-node,.step-node,.journey-dock,.meeting-shortcut') || el.getAttribute('aria-hidden')==='true')return;
      const r=el.getBoundingClientRect(),top=r.top+scrollY,bottom=r.bottom+scrollY;
      const x=routeX((top+bottom)/2);
      const crossesTurn=[entry,exit].some(y=>top<y+radius&&bottom>y-radius&&r.left<right+clearance&&r.right>centre-clearance);
      if(r.width&&r.height&&(crossesTurn||(r.left<x+clearance&&r.right>x-clearance)))intervals.push([Math.max(0,top-14),Math.min(height,bottom+14)]);
    });
    intervals.sort((a,b)=>a[0]-b[0]);
    const merged=[];
    for(const interval of intervals){const last=merged.at(-1);if(last&&interval[0]<=last[1])last[1]=Math.max(last[1],interval[1]);else merged.push(interval);}
    clearAreas=merged;
    const stops=['#000 0px'];
    for(const [start,end] of merged)stops.push(`#000 ${start}px`,`transparent ${start}px`,`transparent ${end}px`,`#000 ${end}px`);
    stops.push(`#000 ${height}px`);
    rail.style.setProperty('--rail-mask',`linear-gradient(to bottom,${stops.join(',')})`);rail.dataset.clearAreas=String(merged.length);
  }
  function updateScroll() {
    scrollFrame=0;if(!geometry||document.hidden)return;
    const paused=preference.matches||root.classList.contains('motion-paused');
    const distance=Math.max(0,Math.min(geometry.total,distanceAt(scrollY+innerHeight*.5)));
    const position=scrollY+innerHeight*.5;
    const zone=position>=geometry.entry&&position<=geometry.exit?'demos':'centre';
    if(root.dataset.railZone!==zone)root.dataset.railZone=zone;
    // Straight stretches need no SVG geometry query. Move only the small
    // traveller layer rather than changing inherited styles on the whole rail.
    const turning=Math.abs(position-geometry.entry)<geometry.window || Math.abs(position-geometry.exit)<geometry.window;
    const point=turning?routePath.getPointAtLength(distance):{x:routeX(position),y:Math.max(0,Math.min(geometry.height,position))};
    traveller.style.transform=`translate3d(${point.x}px,${point.y-(mobile.matches?scrollY:0)}px,0)`;
    if(mobile.matches&&!paused){
      liveLayer.style.height=`${innerHeight}px`;
      liveSvg.setAttribute('viewBox',`0 ${scrollY} ${geometry.width} ${innerHeight}`);
      liveProgress.style.strokeDasharray=`${distance} ${geometry.total}`;
      const stops=['#000 0px'];
      for(const [top,bottom] of clearAreas){
        if(bottom<=scrollY||top>=scrollY+innerHeight)continue;
        const start=Math.max(0,top-scrollY),end=Math.min(innerHeight,bottom-scrollY);
        stops.push(`#000 ${start}px`,`transparent ${start}px`,`transparent ${end}px`,`#000 ${end}px`);
      }
      stops.push(`#000 ${innerHeight}px`);
      liveLayer.style.setProperty('--rail-live-mask',`linear-gradient(to bottom,${stops.join(',')})`);
    }else progress.style.strokeDasharray=`${paused?geometry.total:distance} ${geometry.total}`;
  }
  function scheduleScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);}
  function scheduleMeasure(){if(!maskFrame)maskFrame=requestAnimationFrame(()=>{maskFrame=0;measureRoute();});}
  if(rail&&track){
    new ResizeObserver(scheduleMeasure).observe(document.body);
    addEventListener('resize',scheduleMeasure);addEventListener('load',scheduleMeasure);
    addEventListener('scroll',scheduleScroll,{passive:true});
    document.addEventListener('toggle',scheduleMeasure,true);
    // Film and milestone animations leave the rail geometry unchanged.
    document.addEventListener('visibilitychange',scheduleScroll);
    preference.addEventListener('change',scheduleScroll);
    mobile.addEventListener('change',scheduleMeasure);
    new MutationObserver(scheduleScroll).observe(root,{attributes:true,attributeFilter:['class']});
    document.fonts?.ready.then(scheduleMeasure);scheduleMeasure();
  }

  // The native plus stays precise; only its light surround expands on actions.
  if(matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const halo=document.createElement('div');
    halo.className='cursor-halo';halo.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.className='cursor-label';
    halo.append(label);document.body.append(halo);
    let frame=0,x=0,y=0,active=null,width=40;
    const actionSelector='a[href],button,summary,[role="tab"],[data-info]';
    function actionLabel(el) {
      if(el.dataset.cursor)return el.dataset.cursor;
      const href=el.getAttribute('href')||'';
      if(/(?:^|\/)book(?:[?#/]|$)|calendly\.com/.test(href))return 'Book';
      if(el.matches('summary'))return el.closest('details')?.open?'Close':'Open';
      if(el.matches('[data-info]'))return 'Info';
      if(el.matches('.motion-toggle'))return el.getAttribute('aria-pressed')==='true'?'Resume':'Pause';
      if(el.matches('.journey-dock'))return 'Next';
      if(href==='#approach')return 'Explore';
      if(href==='#top')return 'Home';
      if(href.startsWith('mailto:'))return 'Email';
      if(/^https?:/.test(href))return 'Visit';
      return el.matches('a')?'View':'Select';
    }
    function target(el) {
      const action=el.closest(actionSelector);
      const next=action&&!action.matches(':disabled,[aria-disabled="true"]')?action:null;
      if(next!==active) {
        active=next;label.textContent=next?actionLabel(next):'';
        width=next?Math.max(88,Math.min(152,54+label.textContent.length*7)):40;
        halo.style.setProperty('--cursor-width',`${width}px`);
        halo.classList.toggle('is-link',!!next);
      }
      halo.classList.toggle('is-text',!!el.closest('input,textarea,[contenteditable="true"]'));
      halo.classList.toggle('opens-left',!!next&&x+width-20>innerWidth-12);
    }
    document.addEventListener('pointermove',e=>{
      if(e.pointerType==='touch')return;
      x=e.clientX;y=e.clientY;
      if(e.target.closest('.demo-film')){hide();return;}
      target(e.target);halo.classList.add('is-visible');
      if(!frame)frame=requestAnimationFrame(()=>{halo.style.transform=`translate3d(${x}px,${y}px,0)`;frame=0;});
    },{passive:true});
    const release=()=>halo.classList.remove('is-pressed');
    const hide=()=>{release();halo.classList.remove('is-visible');};
    document.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&e.button===0)halo.classList.add('is-pressed');},{passive:true});
    document.addEventListener('pointerup',()=>{release();if(active)label.textContent=actionLabel(active);},{passive:true});
    document.addEventListener('toggle',()=>{if(active)label.textContent=actionLabel(active);},true);
    document.addEventListener('pointercancel',hide,{passive:true});
    document.addEventListener('pointerout',e=>{if(!e.relatedTarget)hide();});
    document.addEventListener('keydown',e=>{if(e.key==='Tab')hide();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();});
    window.addEventListener('blur',hide);
    window.addEventListener('scroll',()=>{
      const el=document.elementFromPoint(x,y);
      if(el?.closest('.demo-film'))hide();
      else if(el)target(el);
    },{passive:true});
  }
})();
