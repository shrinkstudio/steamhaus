// -----------------------------------------
// CASE SLIDER — full-screen case-study slider (GSAP line reveal + autoplay tabs)
// -----------------------------------------
// Osmo-style line reveal (SplitText, masked lines) for the text, image
// crossfade for the background, and a custom tab nav where each tab's
// underline fills over the autoplay duration. Matches the Shrink Studio
// testimonial transition. Requires GSAP + SplitText (loaded on the site).
//
// Structure:
//   [data-case-slider]  data-case-delay="6000"
//     [data-case-list]
//       [data-case-item]           × N   (stacked; active visible)
//         [data-case-bg]                 — bg image (crossfades)
//         [data-case-split]        × M   — text that line-reveals (eyebrow/headline/desc)
//         [data-case-fade]         × ?   — extra content that fades up (stats/button)
//     [data-case-tabs]
//       [data-case-tab]            × N   (same count/order as items)
//         [data-case-tab-progress]       — fill (scaleX, origin left)

let instances = [];

function initInstance(wrap) {
  const list = wrap.querySelector('[data-case-list]');
  if (!list || typeof gsap === 'undefined') return null;

  const items = Array.from(list.querySelectorAll('[data-case-item]'));
  const tabs = Array.from(wrap.querySelectorAll('[data-case-tab]'));
  if (items.length < 2) return null;

  const hasSplit = typeof SplitText !== 'undefined';
  const duration = (parseInt(wrap.getAttribute('data-case-delay'), 10) || 6000) / 1000;
  const progressEls = tabs.map((t) => t.querySelector('[data-case-tab-progress]'));

  let reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = 0;
  let animating = false;
  let inView = true;
  let progressTween = null;
  let scrollTrigger = null;
  const listeners = [];

  const slides = items.map((item) => ({
    item,
    bg: item.querySelector('[data-case-bg]'),
    splitEls: Array.from(item.querySelectorAll('[data-case-split]')),
    fadeEls: Array.from(item.querySelectorAll('[data-case-fade]')),
    splits: [],
    lines() { return this.splits.flatMap((s) => s.lines || []); },
  }));

  // Build SplitText per slide
  if (hasSplit && !reduceMotion) {
    slides.forEach((slide, i) => {
      slide.splits = slide.splitEls.map((el) =>
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'case-line',
          autoSplit: true,
          onSplit(self) {
            gsap.set(self.lines, { yPercent: i === active ? 0 : 110 });
          },
        })
      );
    });
  }

  // Initial visual state
  slides.forEach((slide, i) => {
    const on = i === active;
    gsap.set(slide.item, { autoAlpha: on ? 1 : 0, pointerEvents: on ? 'auto' : 'none' });
    if (slide.bg) gsap.set(slide.bg, { autoAlpha: on ? 1 : 0 });
    if (slide.fadeEls.length) gsap.set(slide.fadeEls, { autoAlpha: on ? 1 : 0, y: on ? 0 : 14 });
  });

  function setTab(i) {
    tabs.forEach((tab, k) => {
      const on = k === i;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-current', on ? 'true' : 'false');
      if (progressEls[k] && !on) gsap.set(progressEls[k], { scaleX: 0 });
    });
  }
  setTab(active);

  // Progress-driven autoplay: the fill IS the timer
  function play() {
    if (progressTween) progressTween.kill();
    const el = progressEls[active];
    if (el) gsap.set(el, { scaleX: 0, transformOrigin: 'left center' });
    if (reduceMotion) return; // no autoplay under reduced motion
    progressTween = gsap.to(el || {}, {
      scaleX: 1,
      duration,
      ease: 'none',
      onComplete: () => goTo((active + 1) % slides.length),
    });
  }

  function goTo(next) {
    if (animating || next === active) return;
    animating = true;
    if (progressTween) progressTween.kill();

    const out = slides[active];
    const inc = slides[next];

    // reset other tab fills
    progressEls.forEach((p, k) => { if (p && k !== next) gsap.set(p, { scaleX: 0 }); });

    const finish = () => {
      gsap.set(out.item, { autoAlpha: 0, pointerEvents: 'none' });
      gsap.set(inc.item, { pointerEvents: 'auto' });
      active = next;
      setTab(active);
      animating = false;
      play();
    };

    if (reduceMotion || !hasSplit) {
      gsap.timeline({ onComplete: finish })
        .to(out.item, { autoAlpha: 0, duration: 0.4, ease: 'power2' }, 0)
        .fromTo(inc.item, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power2' }, 0);
      setTab(next);
      return;
    }

    const outLines = out.lines();
    const incLines = inc.lines();

    gsap.set(inc.item, { autoAlpha: 1, pointerEvents: 'auto' });
    gsap.set(incLines, { yPercent: 110 });
    if (inc.bg) gsap.set(inc.bg, { autoAlpha: 0 });
    if (inc.fadeEls.length) gsap.set(inc.fadeEls, { autoAlpha: 0, y: 14 });

    setTab(next);

    const tl = gsap.timeline({ onComplete: finish });

    // outgoing lines slide up & out
    tl.to(outLines, { yPercent: -110, duration: 0.6, ease: 'power4.inOut', stagger: { amount: 0.25 } }, 0);
    if (out.bg) tl.to(out.bg, { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' }, 0);
    if (out.fadeEls.length) tl.to(out.fadeEls, { autoAlpha: 0, y: -10, duration: 0.4, ease: 'power2.in' }, 0);

    // incoming lines slide up into place
    tl.to(incLines, { yPercent: 0, duration: 0.7, ease: 'power4.inOut', stagger: { amount: 0.4 } }, '>-=0.3');
    if (inc.bg) tl.to(inc.bg, { autoAlpha: 1, duration: 0.6, ease: 'power2.inOut' }, '<');
    if (inc.fadeEls.length) tl.to(inc.fadeEls, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '<+0.15');
  }

  // Tabs
  tabs.forEach((tab, i) => {
    const fn = () => goTo(i);
    tab.addEventListener('click', fn);
    listeners.push({ el: tab, type: 'click', fn });
  });

  // Pause when off-screen
  if (typeof ScrollTrigger !== 'undefined') {
    scrollTrigger = ScrollTrigger.create({
      trigger: wrap,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => { inView = true; if (progressTween) progressTween.resume(); },
      onEnterBack: () => { inView = true; if (progressTween) progressTween.resume(); },
      onLeave: () => { inView = false; if (progressTween) progressTween.pause(); },
      onLeaveBack: () => { inView = false; if (progressTween) progressTween.pause(); },
    });
  }

  play();

  return function destroy() {
    listeners.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
    if (progressTween) progressTween.kill();
    if (scrollTrigger) scrollTrigger.kill();
    slides.forEach((s) => s.splits.forEach((sp) => sp.revert && sp.revert()));
  };
}

export function initCaseSlider(scope) {
  scope = scope || document;
  const wraps = scope.querySelectorAll('[data-case-slider]');
  if (!wraps.length) return;
  wraps.forEach((wrap) => {
    if (wrap.__caseSliderInit) return;
    wrap.__caseSliderInit = true;
    const cleanup = initInstance(wrap);
    if (cleanup) instances.push(cleanup);
    else wrap.__caseSliderInit = false;
  });
}

export function destroyCaseSlider() {
  instances.forEach((fn) => fn && fn());
  instances = [];
}
