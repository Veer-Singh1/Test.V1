/* Manifest Coffee Roasters — site behaviour
   1. Mobile nav   2. Roaster status   3. Customs stamps   4. Voyage chart
   5. Declaration form   6. Footer year
   Everything degrades gracefully: without JS the nav is visible, stamps show
   statically, the voyage chart shows the full route, and the form posts normally. */
(function () {
  'use strict';

  var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reducedMotion() { return reduceMotionQuery.matches; }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  /* 1. Mobile nav ---------------------------------------------------------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
      nav.classList.toggle('is-open', open);
    }
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    // Close when focus or a click leaves the header
    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') === 'true' && !e.target.closest('.masthead')) setOpen(false);
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  }

  /* 2. Roaster status (Durban time) ----------------------------------------- */
  function initStatus() {
    var el = document.querySelector('[data-status]');
    if (!el) return;
    var text = el.querySelector('[data-status-text]');
    var parts;
    try {
      parts = new Intl.DateTimeFormat('en-ZA', {
        timeZone: 'Africa/Johannesburg', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
      }).formatToParts(new Date());
    } catch (err) { return; }
    var get = function (type) { var p = parts.find(function (x) { return x.type === type; }); return p ? p.value : ''; };
    var day = get('weekday').slice(0, 3);
    var mins = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
    var weekdays = ['Tue', 'Wed', 'Thu', 'Fri'];
    var state = 'closed', msg;

    if (weekdays.indexOf(day) > -1 && mins >= 420 && mins < 900) {
      state = (day === 'Tue' || day === 'Thu') && mins < 720 ? 'roasting' : 'open';
      msg = state === 'roasting' ? 'Drum’s hot · roasting till noon' : 'Open now · till 3pm';
    } else if (day === 'Sat' && mins >= 480 && mins < 780) {
      state = 'open';
      msg = mins < 600 ? 'Open · cupping at 9am' : 'Open now · till 1pm';
    } else if (weekdays.indexOf(day) > -1 && mins < 420) {
      msg = 'Opening at 7am';
    } else if (day === 'Fri' || day === 'Sat' || day === 'Sun' || day === 'Mon') {
      msg = day === 'Fri' ? 'Closed · back Sat 8am' : 'Closed · back Tue 7am';
    } else {
      msg = 'Closed · back tomorrow 7am';
    }
    el.setAttribute('data-state', state);
    if (text) text.textContent = msg;
  }

  /* 3. Customs stamps -------------------------------------------------------- */
  function initStamps() {
    var stamps = Array.prototype.slice.call(document.querySelectorAll('[data-stamp]'));
    if (!stamps.length) return;
    function stamp(el) {
      var delay = parseInt(el.getAttribute('data-stamp-delay') || '0', 10);
      if (reducedMotion()) delay = 0;
      window.setTimeout(function () { el.classList.add('is-stamped'); }, delay);
    }
    if (!('IntersectionObserver' in window) || reducedMotion()) {
      stamps.forEach(function (el) { el.classList.add('is-stamped'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { stamp(entry.target); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.6 });
    stamps.forEach(function (el) {
      if (el.hasAttribute('data-stamp-manual')) return;
      io.observe(el);
    });
  }

  /* 4. Voyage chart ---------------------------------------------------------- */
  function initVoyage() {
    var section = document.querySelector('[data-voyage]');
    if (!section) return;
    var svg = section.querySelector('[data-chart]');
    var route = section.querySelector('[data-route]');
    var reveal = section.querySelector('.route-reveal');
    var ship = section.querySelector('[data-ship]');
    var frame = section.querySelector('.chart__frame');
    var dayEl = section.querySelector('[data-day]');
    var portNameEl = section.querySelector('[data-port-name]');
    var ports = Array.prototype.slice.call(section.querySelectorAll('.port'));
    var entries = Array.prototype.slice.call(section.querySelectorAll('.log__entry'));
    if (!svg || !route || !ship || entries.length < 2) return;

    var FULL_VIEW = '-10 -10 580 1000';
    var days = [0, 6, 9, 14, 19];
    var names = ['Djibouti', 'Mombasa', 'Dar es Salaam', 'Beira', 'Durban'];
    var stacked = window.matchMedia('(max-width: 899px)');
    var len = route.getTotalLength();
    var N = ports.length;

    // Where along the route each port sits (searched in order so close ports can't swap)
    var portLens = [];
    var from = 0;
    ports.forEach(function (p) {
      var x = parseFloat(p.getAttribute('data-x')), y = parseFloat(p.getAttribute('data-y'));
      var best = from, bestD = Infinity;
      for (var l = from; l <= len; l += 2) {
        var pt = route.getPointAtLength(l);
        var d = (pt.x - x) * (pt.x - x) + (pt.y - y) * (pt.y - y);
        if (d < bestD) { bestD = d; best = l; }
        if (bestD < 4 && d > 400) break; // found it and moved on
      }
      portLens.push(best);
      from = best;
    });
    portLens[0] = 0;
    portLens[N - 1] = len;

    reveal.style.strokeDasharray = len + ' ' + len;

    function smooth(t) { return t * t * (3 - 2 * t); }

    function place(progress) {
      var seg = progress * (N - 1);
      var i = Math.min(Math.floor(seg), N - 2);
      var t = smooth(clamp(seg - i, 0, 1));
      var L = portLens[i] + (portLens[i + 1] - portLens[i]) * t;

      reveal.style.strokeDashoffset = String(len - L);

      var p = route.getPointAtLength(L);
      var a = route.getPointAtLength(Math.max(0, L - 2));
      var b = route.getPointAtLength(Math.min(len, L + 2));
      var angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      ship.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') rotate(' + angle.toFixed(1) + ')');

      var current = Math.round(seg);
      ports.forEach(function (el, idx) { el.classList.toggle('is-visited', L >= portLens[idx] - 1); });
      entries.forEach(function (el, idx) {
        el.classList.toggle('is-current', idx === current);
        el.classList.toggle('is-visited', idx < current);
      });

      if (dayEl) {
        var day = Math.round(days[i] + (days[i + 1] - days[i]) * t);
        dayEl.textContent = (day < 10 ? '0' : '') + day;
      }
      if (portNameEl) {
        var atPort = Math.abs(seg - current) < 0.18;
        portNameEl.textContent = current === N - 1 && atPort ? 'Docked · Durban'
          : atPort ? (current === 0 ? 'Loading · ' : 'In port · ') + names[current]
          : 'Next port · ' + names[Math.min(i + 1, N - 1)];
      }

      // On small screens the chart is short, so the view follows the ship
      if (stacked.matches && !reducedMotion()) {
        var r = frame.getBoundingClientRect();
        var vh = 470, vw = Math.min(580, vh * (r.width / Math.max(r.height, 1)));
        var cx = clamp(p.x - vw / 2, -10, 570 - vw);
        var cy = clamp(p.y - vh * 0.5, -10, 990 - vh);
        svg.setAttribute('viewBox', cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + vw.toFixed(1) + ' ' + vh);
      } else if (svg.getAttribute('viewBox') !== FULL_VIEW) {
        svg.setAttribute('viewBox', FULL_VIEW);
      }
    }

    function progressFromScroll() {
      var first = entries[0].getBoundingClientRect();
      var last = entries[entries.length - 1].getBoundingClientRect();
      var focus;
      if (stacked.matches) {
        var chartBottom = section.querySelector('.chart').getBoundingClientRect().bottom;
        focus = (Math.max(chartBottom, 0) + window.innerHeight) / 2;
      } else {
        focus = window.innerHeight / 2;
      }
      var a = first.top + first.height / 2;
      var b = last.top + last.height / 2;
      return clamp((focus - a) / (b - a), 0, 1);
    }

    var ticking = false, active = false;
    function update() {
      ticking = false;
      if (reducedMotion()) { place(1); return; }
      place(progressFromScroll());
    }
    function onScroll() {
      if (!active || ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        active = es[0].isIntersecting;
        if (active) update();
      }, { rootMargin: '200px 0px' }).observe(section);
    } else {
      active = true;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { ticking = false; update(); });
    reduceMotionQuery.addEventListener('change', update);
    section.classList.add('is-live');
    update();
  }

  /* 5. Declaration form ------------------------------------------------------ */
  function initForm() {
    var form = document.querySelector('[data-declaration]');
    if (!form) return;
    var status = form.querySelector('[data-form-status]');
    var stampEl = form.querySelector('[data-received]');
    var rules = {
      name: function (v) { return v.trim() ? '' : 'Please tell us your name.'; },
      email: function (v) {
        if (!v.trim()) return 'We need an email address to reply to.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'That email address looks incomplete. Check for a missing @ or dot.';
      },
      message: function (v) { return v.trim().length >= 10 ? '' : 'Give us a little more to go on (at least 10 characters).'; }
    };

    function check(field) {
      var rule = rules[field.name];
      if (!rule) return true;
      var msg = rule(field.value);
      var wrap = field.closest('.field');
      var err = document.getElementById(field.name + '-error');
      if (err) err.textContent = msg;
      if (wrap) wrap.classList.toggle('has-error', !!msg);
      if (msg) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid');
      return !msg;
    }

    // Pre-tick the enquiry type when arriving from a "Book a spot" style link
    var wanted = new URLSearchParams(window.location.search).get('enquiry');
    if (wanted) {
      Array.prototype.forEach.call(form.querySelectorAll('input[name="enquiry"]'), function (box) {
        if (box.value === wanted) box.checked = true;
      });
    }

    Object.keys(rules).forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      field.addEventListener('blur', function () { if (field.value) check(field); });
      field.addEventListener('input', function () { if (field.getAttribute('aria-invalid')) check(field); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (name) {
        var field = form.elements[name];
        if (field && !check(field) && !firstBad) firstBad = field;
      });
      if (firstBad) {
        status.textContent = 'A couple of boxes need another look before we can stamp this.';
        firstBad.focus();
        return;
      }
      var name = form.elements.name.value.trim().split(' ')[0];
      status.textContent = 'Declaration received. Thanks ' + name + ', a real person will reply within one working day.';
      if (stampEl) {
        stampEl.hidden = false;
        stampEl.classList.remove('is-stamped');
        void stampEl.offsetWidth; // restart the animation
        stampEl.classList.add('is-stamped');
      }
      form.querySelector('button[type="submit"]').textContent = 'Stamped & sent';
      form.reset();
    });
  }

  /* 6. Footer year ----------------------------------------------------------- */
  function initYear() {
    var y = document.querySelector('[data-year]');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  initNav();
  initStatus();
  initStamps();
  initVoyage();
  initForm();
  initYear();
})();
