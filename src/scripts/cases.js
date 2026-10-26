// -----------------------------------------
// CASES — tabbed case-study showcase (autoplay tabs w/ progress underline)
// -----------------------------------------
// Replaces case-slider.js. One CMS list drives everything: panels stack in a
// single grid cell (section sizes to the tallest case, tabs stay in flow),
// backgrounds lift into a shared media layer for a direction-aware wipe, and
// tabs are cloned from a template Ben styles in the Designer.
//
// Structure:
//   [data-cases]  data-cases-duration="7"  (seconds)
//     [data-cases-media]                     — empty layer, bgs are moved here
//     [data-cases-panels]                    — grid stack (the .w-dyn-items)
//       [data-cases-panel]  × N              — .w-dyn-item, optional data-cases-label
//         img [data-cases-bg]
//         [data-cases-eyebrow]               — fades (keeps its dot attached)
//         [data-cases-title]                 — masked line reveal (SplitText)
//         [data-cases-fade]   × ?            — desc, button
//         [data-cases-stat]   × ?            — stat card, staggers up
//           [data-cases-count]               — value, counts up if numeric
//     [data-cases-tablist]                   — tabs are appended here
//     [data-cases-template]                  — hidden, holds one tab:
//       [data-cases-tab] > [data-cases-tab-fill] + [data-cases-tab-label]

let instances = [];

const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function easeOr(name, fallback) {
  return typeof CustomEase !== 'undefined' && CustomEase.get(name) ? name : fallback;
}

// "~35%" → { pre: "~", n: 35, dec: 0, comma: false, post: "%" }
function parseCount(text) {
  const m = text.match(/^(\D*?)([\d,]*\.?\d+)(.*)$/);
  if (!m) return null;
  const raw = m[2];
  const dec = raw.includes('.') ? raw.split('.')[1].length : 0;
  return { pre: m[1], n: parseFloat(raw.replace(/,/g, '')), dec, comma: raw.includes(','), post: m[3] };
}

function formatCount(c, v) {
  const s = v.toFixed(c.dec);
  return c.pre + (c.comma ? Number(s).toLocaleString('en-GB', { minimumFractionDigits: c.dec }) : s) + c.post;
}

function labelFor(panel, i) {
  const attr = panel.getAttribute('data-cases-label');
  if (attr && attr.trim()) return attr.trim();
  const eyebrow = panel.querySelector('[data-cases-eyebrow]');
  return eyebrow ? eyebrow.textContent.trim() : String(i + 1).padStart(2, '0');
}

function initInstance(wrap) {
  const panelWrap = wrap.querySelector('[data-cases-panels]');
  const media = wrap.querySelector('[data-cases-media]');
  const tablist = wrap.querySelector('[data-cases-tablist]');
  const template = wrap.querySelector('[data-cases-template] [data-cases-tab]');
  if (!panelWrap || !media || !tablist || !template || typeof gsap === 'undefined') return null;

  const panelEls = Array.from(panelWrap.querySelectorAll('[data-cases-panel]'));
  if (!panelEls.length) return null;

  const duration = parseFloat(wrap.getAttribute('data-cases-duration')) || 7;
  const ease = easeOr('steamhaus', 'expo.inOut');
  const uid = Math.random().toString(36).slice(2, 7);
  const reduce = reduceQuery.matches;
  const hasSplit = typeof SplitText !== 'undefined' && !reduce;
  const cleanups = [];
  const on = (el, type, fn, opts) => {
    el.addEventListener(type, fn, opts);
    cleanups.push(() => el.removeEventListener(type, fn, opts));
  };

  let active = 0;
  let clock = null;
  let transition = null;
  let started = false;
  const paused = new Set();

  // Panels: lift bgs into the media layer, wire up a11y, build tabs
  const panels = panelEls.map((panel, i) => {
    const bg = panel.querySelector('[data-cases-bg]');
    // Heading component puts the attr on its wrapper: split the heading itself
    const titleEl = panel.querySelector('[data-cases-title]');
    const title = titleEl && !titleEl.matches('h1, h2, h3, h4, h5, h6')
      ? titleEl.querySelector('h1, h2, h3, h4, h5, h6') || titleEl
      : titleEl;
    const bgHome = bg ? { parent: bg.parentNode, next: bg.nextSibling } : null;
    if (bg) media.appendChild(bg);

    const tab = template.cloneNode(true);
    tab.querySelector('[data-cases-tab-label]').textContent = labelFor(panel, i);
    tab.id = `cases-${uid}-tab-${i}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `cases-${uid}-panel-${i}`);
    tablist.appendChild(tab);

    panel.id = `cases-${uid}-panel-${i}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);

    const counts = Array.from(panel.querySelectorAll('[data-cases-count]')).map((el) => ({
      el,
      text: el.textContent,
      parsed: parseCount(el.textContent.trim()),
    }));

    return {
      panel,
      bg,
      bgHome,
      tab,
      fill: tab.querySelector('[data-cases-tab-fill]'),
      eyebrow: panel.querySelector('[data-cases-eyebrow]'),
      title,
      fades: Array.from(panel.querySelectorAll('[data-cases-fade]')),
      stats: Array.from(panel.querySelectorAll('[data-cases-stat]')),
      counts,
      split: null,
    };
  });

  tablist.setAttribute('role', 'tablist');
  if (panels.length < 2) tablist.hidden = true;

  // Masked line reveal on titles; re-splits on resize and keeps hidden lines down
  if (hasSplit) {
    panels.forEach((p, i) => {
      if (!p.title) return;
      p.split = SplitText.create(p.title, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'cases_line',
        autoSplit: true,
        onSplit(self) {
          gsap.set(self.lines, { yPercent: i === active && started ? 0 : 110 });
        },
      });
    });
  }

  const lines = (p) => (p.split ? p.split.lines : []);

  function setTabs(index) {
    panels.forEach((p, k) => {
      const isOn = k === index;
      p.tab.classList.toggle('is-active', isOn);
      p.tab.setAttribute('aria-selected', String(isOn));
      p.tab.tabIndex = isOn ? 0 : -1;
      if (!isOn && p.fill) gsap.set(p.fill, { scaleX: 0 });
    });
  }

  function showPanel(p, visible) {
    gsap.set(p.panel, { autoAlpha: visible ? 1 : 0 });
    p.panel.inert = !visible;
    p.panel.setAttribute('aria-hidden', String(!visible));
  }

  // Initial state: first panel visible, content parked for the intro
  panels.forEach((p, i) => {
    showPanel(p, i === 0);
    if (p.bg) gsap.set(p.bg, { autoAlpha: i === 0 ? 1 : 0, zIndex: i === 0 ? 1 : 0 });
  });
  setTabs(0);

  const parkIn = (p) => {
    if (reduce) return;
    if (p.eyebrow) gsap.set(p.eyebrow, { autoAlpha: 0, y: '0.75rem' });
    gsap.set(lines(p), { yPercent: 110 });
    if (!hasSplit && p.title) gsap.set(p.title, { autoAlpha: 0, y: '1rem' });
    if (p.fades.length) gsap.set(p.fades, { autoAlpha: 0, y: '1rem' });
    if (p.stats.length) gsap.set(p.stats, { autoAlpha: 0, y: '1.5rem' });
  };
  parkIn(panels[0]);

  function countUp(p, tl, at) {
    p.counts.forEach(({ el, parsed }, k) => {
      if (!parsed) return;
      const o = { v: 0 };
      el.textContent = formatCount(parsed, 0);
      tl.to(o, {
        v: parsed.n,
        duration: 1.4,
        ease: 'power3.out',
        onUpdate: () => { el.textContent = formatCount(parsed, o.v); },
      }, at + k * 0.12);
    });
  }

  // Content in: eyebrow → title lines → desc/button → stats (+ count-up)
  function enter(p, tl, at) {
    if (reduce) return;
    if (p.eyebrow) tl.to(p.eyebrow, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, at);
    if (hasSplit) tl.to(lines(p), { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, at + 0.05);
    else if (p.title) tl.to(p.title, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, at + 0.05);
    if (p.fades.length) tl.to(p.fades, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, at + 0.25);
    if (p.stats.length) tl.to(p.stats, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1 }, at + 0.3);
    countUp(p, tl, at + 0.3);
  }

  // The fill IS the timer; the bg drifts back to scale 1 alongside it
  function runClock() {
    if (clock) clock.kill();
    const p = panels[active];
    clock = gsap.timeline({ paused: true, onComplete: () => goTo(active + 1, 1) });
    if (p.fill) clock.fromTo(p.fill, { scaleX: 0 }, { scaleX: 1, duration, ease: 'none' }, 0);
    else clock.to({}, { duration }, 0);
    if (p.bg && !reduce) clock.to(p.bg, { scale: 1, duration, ease: 'none' }, 0);
    if (reduce) clock.progress(0);
    syncPlay();
  }

  function syncPlay() {
    if (!clock) return;
    // No autoplay under reduced motion: tabs still work by hand
    if (reduce || paused.size || panels.length < 2) clock.pause();
    else clock.play();
  }

  function goTo(index, dir) {
    const next = (index + panels.length) % panels.length;
    if (next === active || !started) return;
    if (transition) transition.progress(1);
    if (clock) clock.kill();

    const out = panels[active];
    const inc = panels[next];
    const forward = dir ? dir > 0 : next > active;
    active = next;
    setTabs(next);

    if (reduce) {
      transition = gsap.timeline({ onComplete: runClock })
        .to(out.panel, { autoAlpha: 0, duration: 0.3 }, 0)
        .to(inc.panel, { autoAlpha: 1, duration: 0.3 }, 0);
      if (out.bg) transition.to(out.bg, { autoAlpha: 0, duration: 0.3 }, 0);
      if (inc.bg) transition.to(inc.bg, { autoAlpha: 1, duration: 0.3 }, 0);
      out.panel.inert = true;
      inc.panel.inert = false;
      out.panel.setAttribute('aria-hidden', 'true');
      inc.panel.setAttribute('aria-hidden', 'false');
      return;
    }

    parkIn(inc);
    inc.panel.inert = false;
    inc.panel.setAttribute('aria-hidden', 'false');
    out.panel.inert = true;
    out.panel.setAttribute('aria-hidden', 'true');

    const from = forward ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';
    panels.forEach((p) => { if (p.bg && p !== out && p !== inc) gsap.set(p.bg, { autoAlpha: 0, zIndex: 0 }); });
    if (out.bg) gsap.set(out.bg, { zIndex: 1 });
    if (inc.bg) gsap.set(inc.bg, { zIndex: 2, autoAlpha: 1, scale: 1.18, xPercent: 0, clipPath: from });

    transition = gsap.timeline({
      onComplete: () => {
        gsap.set(out.panel, { autoAlpha: 0 });
        if (out.bg) gsap.set(out.bg, { autoAlpha: 0, zIndex: 0, xPercent: 0, scale: 1 });
        if (inc.bg) gsap.set(inc.bg, { zIndex: 1, clearProps: 'clipPath' });
        transition = null;
      },
    });

    // Out: content lifts away fast so the wipe reads clean
    transition.to(out.panel, { autoAlpha: 0, y: '-1rem', duration: 0.4, ease: 'power2.in' }, 0);
    transition.set(out.panel, { y: 0 }, 0.4);

    // Media: incoming wipes across, outgoing drifts under it
    if (inc.bg) transition.to(inc.bg, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1.06, duration: 1.2, ease }, 0);
    if (out.bg) transition.to(out.bg, { xPercent: forward ? -8 : 8, duration: 1.2, ease }, 0);

    transition.set(inc.panel, { autoAlpha: 1 }, 0.35);
    enter(inc, transition, 0.45);

    // Start the next timer once the wipe has landed
    transition.add(runClock, 0.9);
  }

  // Tabs: click + roving-focus arrow keys (automatic activation)
  panels.forEach((p, i) => {
    on(p.tab, 'click', () => goTo(i));
  });
  on(tablist, 'keydown', (e) => {
    const keys = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: panels.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const dir = e.key === 'ArrowLeft' ? -1 : 1;
    goTo(keys[e.key], e.key === 'Home' || e.key === 'End' ? undefined : dir);
    panels[active].tab.focus();
  });

  // Pause while reading: hovering the tabs, keyboard focus inside, off-screen, tab hidden
  const pause = (why) => { paused.add(why); syncPlay(); };
  const resume = (why) => { paused.delete(why); syncPlay(); };
  on(tablist, 'pointerenter', (e) => { if (e.pointerType === 'mouse') pause('hover'); });
  on(tablist, 'pointerleave', () => resume('hover'));
  on(wrap, 'focusin', () => { if (wrap.matches(':focus-visible, :has(:focus-visible)')) pause('focus'); });
  on(wrap, 'focusout', (e) => { if (!wrap.contains(e.relatedTarget)) resume('focus'); });
  on(document, 'visibilitychange', () => (document.hidden ? pause('hidden') : resume('hidden')));

  // Swipe between cases on touch
  let touch = null;
  on(wrap, 'touchstart', (e) => { touch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  on(wrap, 'touchend', (e) => {
    if (!touch) return;
    const dx = e.changedTouches[0].clientX - touch.x;
    const dy = e.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(active + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  }, { passive: true });

  // First view plays the intro, then the clock only runs while on screen
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return pause('offscreen');
    if (!started) {
      started = true;
      const p = panels[0];
      transition = gsap.timeline({ onComplete: () => { transition = null; } });
      if (p.bg && !reduce) transition.fromTo(p.bg, { scale: 1.12 }, { scale: 1.06, duration: 1.6, ease: 'expo.out' }, 0);
      enter(p, transition, 0.1);
      runClock();
    }
    resume('offscreen');
  }, { threshold: 0.35 });
  io.observe(wrap);

  return function destroy() {
    io.disconnect();
    cleanups.forEach((fn) => fn());
    if (clock) clock.kill();
    if (transition) transition.kill();
    panels.forEach((p) => {
      if (p.split) p.split.revert();
      p.counts.forEach(({ el, text }) => { el.textContent = text; });
      gsap.set([p.panel, p.eyebrow, p.title, p.bg, ...p.fades, ...p.stats].filter(Boolean), { clearProps: 'all' });
      p.panel.inert = false;
      ['id', 'role', 'aria-labelledby', 'aria-hidden'].forEach((a) => p.panel.removeAttribute(a));
      if (p.bg && p.bgHome) p.bgHome.parent.insertBefore(p.bg, p.bgHome.next);
      p.tab.remove();
    });
    tablist.removeAttribute('role');
    tablist.hidden = false;
  };
}

export function initCases(scope) {
  scope = scope || document;
  scope.querySelectorAll('[data-cases]').forEach((wrap) => {
    if (wrap.__casesInit) return;
    wrap.__casesInit = true;
    const cleanup = initInstance(wrap);
    if (cleanup) instances.push(cleanup);
    else wrap.__casesInit = false;
  });
}

export function destroyCases() {
  instances.forEach((fn) => fn && fn());
  instances = [];
}
