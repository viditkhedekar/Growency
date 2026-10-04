/* Growency — vibe layer: live hero widgets, toasts, ticker, reveals */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(id) { return document.getElementById(id); }

  /* ---------- header scroll state ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { header && header.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduced) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- stat band counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduced) { el.textContent = target.toLocaleString() + suffix; return; }
    var start = null, dur = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- ticker pause ---------- */
  var ticker = $("ticker");
  function toggleTicker() { ticker && ticker.classList.toggle("paused"); }
  if (ticker) {
    ticker.addEventListener("click", toggleTicker);
    ticker.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTicker(); }
    });
  }

  /* ---------- shared fictional data ---------- */
  var PROSPECTS = [
    { initials: "AM", name: "Alex Morgan", meta: "Founder · Meridian", match: "97%",
      note: "Meridian is expanding into the UK — a new market, a new set of buyers. Strong opening." },
    { initials: "PS", name: "Priya Shah", meta: "CEO · Northbeam", match: "93%",
      note: "Northbeam just hired two AEs. Pipeline pressure is high — good time to reach out." },
    { initials: "DO", name: "Daniel Okafor", meta: "Founder · Ledgerly", match: "91%",
      note: "Ledgerly raised a seed round last month. Budget approved for growth channels." },
    { initials: "SR", name: "Sofia Reyes", meta: "CEO · Cartloop", match: "88%",
      note: "Cartloop is launching in two new verticals. Founder-led sales is hitting its ceiling." }
  ];
  var QUERIES = ["B2B SaaS founders, UK", "Series A fintech CEOs", "health-tech founders, US"];
  var STATUS = ["Scanning 1,240 profiles…", "42 match your criteria", "Researching top matches…", "Ready for outreach ✓"];

  /* ---------- prospect search widget ---------- */
  var queryEl = $("w-query"), listEl = $("w-prospects"),
      researchEl = $("w-research"), statusEl = $("w-status");

  function renderList(hotIndex) {
    if (!listEl) return;
    listEl.innerHTML = "";
    PROSPECTS.forEach(function (p, i) {
      var li = document.createElement("li");
      if (i === hotIndex) li.className = "hot";
      else if (hotIndex != null) li.className = "dimmed";
      li.innerHTML =
        '<span class="w-avatar">' + p.initials + "</span>" +
        '<span class="w-who"><b>' + p.name + "</b><span>" + p.meta + "</span></span>" +
        '<span class="w-match">' + p.match + "</span>";
      listEl.appendChild(li);
    });
  }

  function typeText(el, text, speed, done) {
    if (!el) return;
    if (reduced) { el.textContent = text; done && done(); return; }
    el.textContent = "";
    var i = 0;
    (function tick() {
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, speed);
      else done && done();
    })();
  }

  renderList(null);
  if (queryEl && !reduced) {
    var q = 0, hot = 0, st = 0;
    (function cycleQuery() {
      typeText(queryEl, QUERIES[q], 45, function () {
        setTimeout(function () {
          q = (q + 1) % QUERIES.length;
          cycleQuery();
        }, 3200);
      });
    })();
    setInterval(function () {
      hot = (hot + 1) % PROSPECTS.length;
      renderList(hot);
      typeText(researchEl, PROSPECTS[hot].note, 14);
    }, 5200);
    renderList(0);
    typeText(researchEl, PROSPECTS[0].note, 14);
    setInterval(function () {
      st = (st + 1) % STATUS.length;
      if (statusEl) statusEl.textContent = STATUS[st];
    }, 2600);
    if (statusEl) statusEl.textContent = STATUS[0];
  } else {
    renderList(0);
    if (researchEl) researchEl.textContent = PROSPECTS[0].note;
    if (statusEl) statusEl.textContent = STATUS[3];
  }

  /* ---------- activity feed ---------- */
  var ACTIVITY = [
    { icon: "◎", text: "Researched Meridian — UK expansion signal", time: "now" },
    { icon: "✉", text: "Follow-up sent to Priya Shah", time: "2m" },
    { icon: "↗", text: "Reply from Daniel Okafor — interested", time: "9m" },
    { icon: "≡", text: "Meeting brief prepared for Thursday", time: "21m" },
    { icon: "✓", text: "List refreshed — 42 new prospects", time: "38m" },
    { icon: "◎", text: "Contact verified: Sofia Reyes, Cartloop", time: "51m" }
  ];
  var actEl = $("w-activity"), actIndex = 0;
  function pushActivity(fresh) {
    if (!actEl) return;
    var a = ACTIVITY[actIndex % ACTIVITY.length];
    actIndex++;
    var li = document.createElement("li");
    if (fresh) li.className = "fresh";
    li.innerHTML = '<span class="act-ico">' + a.icon + "</span>" + a.text + "<time>" + a.time + "</time>";
    actEl.insertBefore(li, actEl.firstChild);
    while (actEl.children.length > 4) actEl.removeChild(actEl.lastChild);
  }
  for (var ai = 0; ai < 4; ai++) pushActivity(false);
  if (!reduced) setInterval(function () { pushActivity(true); }, 6000);

  /* ---------- inbox widget ---------- */
  var REPLIES = [
    { initials: "AM", name: "Alex Morgan", snippet: "“Sounds relevant. Let’s find a time.”", time: "now" },
    { initials: "PS", name: "Priya Shah", snippet: "“Can you do Thursday morning?”", time: "14m" },
    { initials: "DO", name: "Daniel Okafor", snippet: "“Send over some times next week.”", time: "1h" },
    { initials: "SR", name: "Sofia Reyes", snippet: "“Interesting — tell me more.”", time: "3h" }
  ];
  var inboxEl = $("w-inbox"), unreadEl = $("w-unread"), replyIndex = 0;
  function renderInbox(unreadCount, freshFirst) {
    if (!inboxEl) return;
    inboxEl.innerHTML = "";
    REPLIES.slice(0, 3).forEach(function (r, i) {
      var li = document.createElement("li");
      if (i < unreadCount) li.className = "unread";
      if (i === 0 && freshFirst) li.classList.add("fresh");
      li.innerHTML =
        '<span class="w-avatar">' + r.initials + "</span>" +
        '<span class="w-mail"><b>' + (i < unreadCount ? '<span class="unread-dot"></span>' : "") + r.name +
        "</b><span>" + r.snippet + "</span></span><time>" + r.time + "</time>";
      inboxEl.appendChild(li);
    });
    if (unreadEl) unreadEl.textContent = unreadCount;
  }
  renderInbox(2, false);
  if (!reduced) {
    setInterval(function () {
      replyIndex = (replyIndex + 1) % REPLIES.length;
      var first = REPLIES.shift();
      REPLIES.push(first);
      renderInbox(1 + (replyIndex % 2), true);
    }, 8000);
  }

  /* ---------- calendar widget ---------- */
  var calEl = $("w-cal");
  var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  var SLOTS = ["09:00", "11:00", "14:00"];
  var SEEDED = [
    { day: 1, slot: 0, label: "× Meridian" },
    { day: 3, slot: 2, label: "× Northbeam" },
    { day: 4, slot: 1, label: "× Ledgerly" }
  ];
  var meetEl = $("m-meet");

  function meetingCount() { return calEl ? calEl.querySelectorAll(".w-cal-pill").length : 0; }
  function syncMeet() { if (meetEl) meetEl.textContent = meetingCount(); }

  function makePill(label, held) {
    var pill = document.createElement("span");
    pill.className = "w-cal-pill" + (held ? " held" : "");
    pill.innerHTML = "<b>" + SLOTS[0] + "</b>" + label;
    return pill;
  }

  if (calEl) {
    for (var s = 0; s < SLOTS.length; s++) {
      for (var d = 0; d < DAYS.length; d++) {
        (function (day, slot) {
          var cell = document.createElement("div");
          cell.className = "w-cal-cell";
          cell.setAttribute("role", "button");
          cell.setAttribute("tabindex", "0");
          cell.setAttribute("aria-label", DAYS[day] + " " + SLOTS[slot] + " — toggle a held slot");
          var seed = null;
          SEEDED.forEach(function (m) { if (m.day === day && m.slot === slot) seed = m; });
          if (seed) {
            var pill = makePill(seed.label, false);
            pill.querySelector("b").textContent = SLOTS[slot];
            cell.appendChild(pill);
          }
          function toggle() {
            var existing = cell.querySelector(".w-cal-pill");
            if (existing) { cell.removeChild(existing); }
            else {
              var p = makePill("Held", true);
              p.querySelector("b").textContent = SLOTS[slot];
              cell.appendChild(p);
            }
            syncMeet();
          }
          cell.addEventListener("click", toggle);
          cell.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
          });
          calEl.appendChild(cell);
        })(d, s);
      }
    }
    syncMeet();
  }

  /* hero metric count-ups */
  function countTo(el, target, suffix, dur) {
    if (!el) return;
    if (reduced) { el.textContent = target.toLocaleString() + suffix; return; }
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  countTo($("m-calls"), 1240, "+", 2200);
  countTo($("m-reply"), 27, "%", 1800);

  /* ---------- toasts ---------- */
  var TOASTS = [
    { icon: "↗", title: "Call booked", sub: "You × Meridian — Wed 10:00" },
    { icon: "✉", title: "New reply", sub: "Priya Shah: “Let’s find a time.”" },
    { icon: "✓", title: "Brief ready", sub: "Research on Ledgerly complete" },
    { icon: "◎", title: "Prospect verified", sub: "Sofia Reyes — CEO, Cartloop" }
  ];
  var stack = $("toast-stack"), toastIndex = 0;
  function showToast() {
    if (!stack) return;
    var t = TOASTS[toastIndex % TOASTS.length];
    toastIndex++;
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<span class="toast-icon">' + t.icon + "</span><div><b>" + t.title + "</b><span>" + t.sub + "</span></div>";
    stack.appendChild(el);
    while (stack.children.length > 2) stack.removeChild(stack.firstChild);
    setTimeout(function () {
      el.classList.add("leaving");
      setTimeout(function () { el.parentNode && el.parentNode.removeChild(el); }, 450);
    }, 5200);
  }
  if (!reduced) {
    setTimeout(showToast, 3500);
    setInterval(showToast, 11000);
  }
})();
