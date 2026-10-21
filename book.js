(() => {
  const embed = document.getElementById('calendly-embed');
  if (!embed) return;
  const stage = document.getElementById('scheduler-stage');
  const feedback = document.getElementById('scheduler-feedback');
  const status = document.getElementById('scheduler-status');
  const retry = document.getElementById('booking-retry');
  const heading = document.getElementById('scheduler-title');
  let loadTimer;
  let script;
  let attempt = 0;

  function showError() {
    stage.setAttribute('aria-busy', 'false');
    feedback.hidden = false;
    feedback.classList.add('is-error');
    status.textContent = 'The calendar is taking a little longer. Try again, or open Calendly directly.';
    retry.hidden = false;
  }

  function initialiseWidget(currentAttempt) {
    if (currentAttempt !== attempt) return;
    if (!window.Calendly?.initInlineWidget) {
      clearTimeout(loadTimer);
      showError();
      return;
    }
    // Hiding duplicated event details works with the free embed. Keep the
    // calendar's native styling and cookie controls; no paid options or API.
    const url = new URL(embed.dataset.url);
    url.searchParams.set('hide_event_type_details', '1');
    url.searchParams.set('hide_landing_page_details', '1');
    try {
      window.Calendly.initInlineWidget({ url: url.href, parentElement: embed, resize: true });
      const frame = embed.querySelector('iframe');
      if (frame) frame.title = 'Choose a time for your 30-minute Growency call';
    } catch {
      clearTimeout(loadTimer);
      showError();
    }
  }

  function loadCalendar() {
    const currentAttempt = ++attempt;
    clearTimeout(loadTimer);
    embed.replaceChildren();
    stage.setAttribute('aria-busy', 'true');
    feedback.hidden = false;
    feedback.classList.remove('is-error');
    retry.hidden = true;
    status.textContent = 'Loading available times…';
    loadTimer = setTimeout(showError, 20000);
    if (window.Calendly?.initInlineWidget) {
      initialiseWidget(currentAttempt);
      return;
    }
    script?.remove();
    script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = () => initialiseWidget(currentAttempt);
    script.onerror = () => {
      if (currentAttempt !== attempt) return;
      clearTimeout(loadTimer);
      showError();
    };
    document.head.append(script);
  }

  window.addEventListener('message', event => {
    const frame = embed.querySelector('iframe');
    if (event.origin !== 'https://calendly.com' || !frame || event.source !== frame.contentWindow) return;
    const type = event.data && typeof event.data === 'object' ? event.data.event : null;
    if (!['calendly.event_type_viewed', 'calendly.date_and_time_selected', 'calendly.event_scheduled'].includes(type)) return;
    clearTimeout(loadTimer);
    stage.setAttribute('aria-busy', 'false');
    feedback.hidden = true;
    if (type === 'calendly.event_scheduled') {
      heading.textContent = 'You’re booked. See you soon.';
      heading.setAttribute('role', 'status');
    } else if (type === 'calendly.date_and_time_selected') {
      heading.textContent = 'One last thing. Your details.';
    } else {
      heading.textContent = 'Find a time that works.';
    }
  });

  retry.addEventListener('click', loadCalendar);
  loadCalendar();
})();
