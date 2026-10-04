(() => {
  // One continuous colour field sits beneath the complete page. Palette blending
  // follows the rail; section boundaries blend spatially in their empty margins.
  const surfaces = [...document.querySelectorAll('main > .slide,.journey-intro,.story-step,.journey-end,.site-footer')];
  if (!surfaces.length) return;
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div');
  layer.className = 'scene-atmosphere'; layer.setAttribute('aria-hidden','true');
  document.body.prepend(layer);
  const rgb = value => {
    if (value.startsWith('#')) {
      const hex = value.slice(1);
      return [0,2,4].map(i => parseInt(hex.slice(i,i+2),16));
    }
    return (value.match(/[\d.]+/g) || ['13','10','29']).slice(0,3).map(Number);
  };
  const mix = (a,b,t) => a.map((v,i) => v+(b[i]-v)*t);
  const colour = values => `rgb(${values.map(v=>Math.round(v)).join(' ')})`;
  const ease = t => t*t*(3-2*t);
  const descriptors = surfaces.map(el => ({
    el, paper: !!el.closest('.journey,.pilot-slide,.pricing-slide'),
    initial: rgb(getComputedStyle(el).backgroundColor)
  }));
  const anchors = [...document.querySelectorAll('.scene-node,.step-node')].map(node => {
    const el = node.parentElement;
    const initial = rgb(getComputedStyle(el).backgroundColor);
    return {
      node,
      paper: rgb(el.dataset.scenePaper || '#f0edf5'),
      night: el.dataset.sceneNight ? rgb(el.dataset.sceneNight) : initial
    };
  });
  if (!anchors.length) {
    layer.remove(); return;
  }
  let geometry = [], stops = [], frame = 0, lastTime = 0;
  let currentPaper = anchors[0].paper.slice(), currentNight = anchors[0].night.slice();
  let lastPaint = '';
  document.body.classList.add('fluid-backgrounds');
  function measure() {
    geometry = anchors.map(anchor => ({...anchor,y:anchor.node.getBoundingClientRect().top+scrollY+anchor.node.offsetHeight/2}));
    // Measure normal flow, so the absolute colour layer cannot keep the page
    // artificially tall after an accordion closes or the viewport grows wider.
    const height = Math.max(document.body.offsetHeight,innerHeight);
    const edge = innerWidth <= 700 ? 60 : 92;
    const positions = descriptors.map(scene => ({...scene,start:scene.el.getBoundingClientRect().top+scrollY}));
    stops = [{paper:positions[0].paper,y:0}];
    positions.forEach((scene,index) => {
      if (!index) return;
      const previous = positions[index-1];
      if (scene.paper !== previous.paper) {
        stops.push({paper:previous.paper,y:Math.max(0,scene.start-edge)});
        stops.push({paper:scene.paper,y:scene.start+edge});
      }
    });
    stops.push({paper:positions.at(-1).paper,y:height});
    layer.style.height = `${height}px`;
    document.body.style.setProperty('--scene-edge',`${edge}px`);
    lastPaint = ''; schedule();
  }
  function palette(position) {
    let paper = geometry[0].paper, night = geometry[0].night;
    for (let i=1;i<geometry.length;i++) {
      const next = geometry[i], previous = geometry[i-1];
      const span = Math.min(innerHeight*.8,620,(next.y-previous.y)*.8);
      const amount = Math.max(0,Math.min(1,(position-next.y+span/2)/Math.max(1,span)));
      if (amount === 0) break;
      paper = mix(previous.paper,next.paper,ease(amount));
      night = mix(previous.night,next.night,ease(amount));
      if (amount < 1) break;
    }
    return {paper,night};
  }
  function update(time) {
    frame=0;
    if (document.hidden) { lastTime=0; return; }
    const target = palette(scrollY+innerHeight*.5);
    const still = preference.matches || root.classList.contains('motion-paused');
    const elapsed = lastTime ? Math.min(64,time-lastTime) : 16;
    lastTime=time;
    const amount = still ? 1 : 1-Math.exp(-elapsed/150);
    currentPaper=mix(currentPaper,target.paper,amount);
    currentNight=mix(currentNight,target.night,amount);
    const paper=colour(currentPaper),night=colour(currentNight);
    const paint=paper+night;
    if (paint!==lastPaint) {
      root.style.setProperty('--scene-paper',paper);
      root.style.setProperty('--scene-night',night);
      layer.style.backgroundImage=`linear-gradient(to bottom,${stops.map(stop=>`${stop.paper?paper:night} ${stop.y}px`).join(',')})`;
      root.dataset.sceneBlend='continuous'; lastPaint=paint;
    }
    const unfinished = [...currentPaper.map((v,i)=>Math.abs(v-target.paper[i])),...currentNight.map((v,i)=>Math.abs(v-target.night[i]))].some(delta=>delta>.15);
    if (!still && unfinished) schedule(); else lastTime=0;
  }
  function schedule() { if (!frame && !document.hidden) frame=requestAnimationFrame(update); }
  let measureFrame=0;
  function scheduleMeasure() {
    if (!measureFrame) measureFrame=requestAnimationFrame(()=>{measureFrame=0;measure();});
  }
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',scheduleMeasure,{passive:true});
  addEventListener('load',scheduleMeasure,{once:true});
  document.addEventListener('toggle',scheduleMeasure,true);
  preference.addEventListener('change',schedule);
  new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['class']});
  new ResizeObserver(scheduleMeasure).observe(document.body);
  document.fonts?.ready.then(scheduleMeasure);
  document.addEventListener('visibilitychange',()=>{
    if (document.hidden && frame) { cancelAnimationFrame(frame);frame=0;lastTime=0; }
    else schedule();
  });
  measure();
})();
