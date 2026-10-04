(() => {
  // Reuse the cube-cell geometry from the earlier WebGL scene without bringing
  // back its loader, wordmark effects or renderer. Sections own their backgrounds
  // so opaque slide colours and editorial photographs can coexist with the net.
  const surfaces = [...document.querySelectorAll('main > .slide,main > .journey,.site-footer')];
  if (!surfaces.length) surfaces.push(document.body);
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.querySelector(':scope > .page-netting')?.classList.toggle('is-netting-visible', entry.isIntersecting));
  }, { threshold: 0 }) : null;
  surfaces.forEach(surface => {
    const net = document.createElement('div');
    net.className = 'page-netting'; net.setAttribute('aria-hidden', 'true');
    surface.classList.add('netting-surface'); surface.prepend(net);
    if (observer) observer.observe(surface); else net.classList.add('is-netting-visible');
  });
  const syncVisibility = () => document.documentElement.classList.toggle('netting-tab-hidden', document.hidden);
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
})();
