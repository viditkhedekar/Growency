(() => {
  const hints = {
    '#industry-filter': 'Narrow the sample shortlist to the market your offer serves.',
    '#role-filter': 'Choose the decision-maker you want to reach.',
    '#region-filter': 'Focus outreach on the market you can sell into.',
    '[data-angle="expansion"]': 'Use a relevant market signal to give the introduction a reason.',
    '[data-angle="hiring"]': 'Try a different angle and watch the email draft change.',
    '#email-tone': 'Switch between a personal introduction, a direct approach and a follow-up.',
    '#reply-outcome': 'Try an interested reply, a pricing question or a referral to another person.',
    '#book-demo': 'Confirm the sample meeting and open the handover brief. This is a local demonstration.',
    '#run-workflow': 'Watch one selected prospect move through research, outreach, replies and calendar handover.',
    '.team-art': 'Human-led. Always on. Research, outreach and follow-ups handled by real people.'
  };
  Object.entries(hints).forEach(([selector, value]) => document.querySelectorAll(selector).forEach(el => {
    el.dataset.info = value;
    if (!el.matches('button,input,select,textarea,a,[tabindex]')) el.tabIndex = 0;
  }));
  const popover = document.createElement('div');
  popover.className = 'info-popover'; popover.id = 'growency-info';
  popover.setAttribute('role', 'tooltip'); popover.hidden = true;
  document.body.append(popover);
  let active, hideTimer;
  function hide() {
    clearTimeout(hideTimer);
    if (active) {
      const ids = (active.getAttribute('aria-describedby') || '').split(' ').filter(id => id && id !== popover.id);
      if (ids.length) active.setAttribute('aria-describedby', ids.join(' ')); else active.removeAttribute('aria-describedby');
      if (active.hasAttribute('aria-expanded')) active.setAttribute('aria-expanded', 'false');
    }
    popover.hidden = true; active = null;
  }
  function show(el) {
    if (!el || !el.dataset.info) return;
    if (active !== el) hide();
    clearTimeout(hideTimer); active = el;
    popover.textContent = el.dataset.info; popover.hidden = false;
    const ids = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    if (!ids.includes(popover.id)) el.setAttribute('aria-describedby', [...ids, popover.id].join(' '));
    if (el.hasAttribute('aria-expanded')) el.setAttribute('aria-expanded', 'true');
    const rect = el.getBoundingClientRect(); const box = popover.getBoundingClientRect();
    popover.style.left = `${Math.max(12, Math.min(innerWidth - box.width - 12, rect.left + rect.width / 2 - box.width / 2))}px`;
    popover.style.top = `${Math.max(12, rect.bottom + box.height + 22 < innerHeight ? rect.bottom + 10 : rect.top - box.height - 10)}px`;
  }
  const trigger = target => target instanceof Element ? target.closest('[data-info]') : null;
  const delayHide = () => { hideTimer = setTimeout(hide, 160); };
  document.addEventListener('pointerover', e => { const el = trigger(e.target); if (el) show(el); });
  document.addEventListener('pointerout', e => { if (trigger(e.target) && !trigger(e.relatedTarget) && !popover.contains(e.relatedTarget)) delayHide(); });
  popover.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  popover.addEventListener('pointerleave', delayHide);
  document.addEventListener('focusin', e => { const el = trigger(e.target); if (el) show(el); else hide(); });
  document.addEventListener('focusout', e => { if (trigger(e.target)) delayHide(); });
  document.addEventListener('click', e => { if (!e.isTrusted) return; const el = trigger(e.target); if (el) show(el); else hide(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  addEventListener('scroll', hide, { passive: true }); addEventListener('resize', hide);

  const video = document.querySelector('#hero-video');
  if (!video) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let heroVisible = true;
  function updateVideo() {
    if (!video.getAttribute('src')) return;
    if (document.hidden || !heroVisible || reduced.matches || video.dataset.userPaused === 'true' || document.documentElement.classList.contains('motion-paused')) video.pause();
    else video.play().catch(() => {});
  }
  new MutationObserver(updateVideo).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; updateVideo(); }).observe(video);
  document.addEventListener('visibilitychange', updateVideo);
  reduced.addEventListener('change', updateVideo); video.addEventListener('loadeddata', updateVideo);
})();
