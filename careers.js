(() => {
  const tabList = document.querySelector('[data-role-tabs]');
  if (!tabList) return;
  const tabs = [...tabList.querySelectorAll('[data-role-tab]')];
  const panels = [...document.querySelectorAll('[data-career-panel]')];
  const anchor = document.getElementById('roles');
  let activeRole = 'gtm';
  let routeFrame;

  function scrollToTarget(target) {
    const height = document.querySelector('.career-tabs-shell').offsetHeight;
    const offset = target === anchor ? 12 : height + 18;
    const top = Math.max(0, target.getBoundingClientRect().top + scrollY - offset);
    if (window.GROWENCY_SCROLL) window.GROWENCY_SCROLL.to(top, { immediate: true });
    else window.scrollTo({ top, behavior: 'instant' });
  }

  function activate(role) {
    if (!panels.some(panel => panel.dataset.careerPanel === role)) return;
    activeRole = role;
    panels.forEach(panel => { panel.hidden = panel.dataset.careerPanel !== role; });
    tabs.forEach(tab => {
      const selected = tab.dataset.roleTab === role;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    // Refresh the rail, colour field and scroll geometry after a panel changes.
    dispatchEvent(new Event('resize'));
  }

  function choose(tab) {
    const role = tab.dataset.roleTab;
    activate(role);
    if (location.hash !== `#${role}`) history.pushState(null, '', `#${role}`);
    tab.focus({ preventScroll: true });
    scrollToTarget(anchor);
  }

  function restoreFromUrl(scroll = true) {
    const target = document.getElementById(location.hash.slice(1));
    const panel = target?.closest('[data-career-panel]');
    activate(panel ? panel.dataset.careerPanel : location.hash ? activeRole : 'gtm');
    if (scroll && target) scrollToTarget(target);
  }

  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-orientation', 'horizontal');
  panels.forEach(panel => panel.setAttribute('role', 'tabpanel'));
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `panel-${tab.dataset.roleTab}`);
    tab.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      choose(tab);
    });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else if (event.key === ' ') next = index;
      else return;
      event.preventDefault();
      choose(tabs[next]);
    });
  });
  document.documentElement.classList.add('careers-tabs-ready');
  function scheduleRestore() {
    cancelAnimationFrame(routeFrame);
    routeFrame = requestAnimationFrame(() => restoreFromUrl());
  }
  addEventListener('hashchange', scheduleRestore);
  addEventListener('popstate', scheduleRestore);
  addEventListener('pageshow', () => restoreFromUrl(false));
  restoreFromUrl(false);
  if (location.hash) scheduleRestore();
})();
