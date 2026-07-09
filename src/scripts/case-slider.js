// -----------------------------------------
// CASE SLIDER — full-screen case-study slider with autoplay tabs
// -----------------------------------------
// Swiper 11 (fade + parallax) driven by a custom tab nav. Each tab's
// underline fills over the autoplay duration; clicking a tab jumps to that
// slide and resets the timer. Honours prefers-reduced-motion (no autoplay).
//
// Structure:
//   [data-case-slider]                       — wrapper (one instance)
//     .swiper[data-case-swiper]
//       .swiper-wrapper
//         .swiper-slide            × N       — one per case study
//           [data-swiper-parallax] (optional) on the bg image
//     [data-case-tabs]
//       [data-case-tab]            × N       — same order/count as slides
//         [data-case-tab-progress]           — the fill element (scaleX)
//
// Optional attrs on [data-case-slider]:
//   data-case-delay="6000"   — autoplay ms per slide (default 6000)
//   data-case-effect="fade"  — "fade" (default) or "slide"

let instances = [];

function initInstance(root) {
  const swiperEl = root.querySelector('[data-case-swiper], .swiper');
  const tabs = Array.from(root.querySelectorAll('[data-case-tab]'));
  if (!swiperEl || typeof Swiper === 'undefined') return null;

  const delay = parseInt(root.getAttribute('data-case-delay'), 10) || 6000;
  const effect = root.getAttribute('data-case-effect') || 'fade';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const progressEls = tabs.map((t) => t.querySelector('[data-case-tab-progress]'));

  function setActive(realIndex) {
    tabs.forEach((tab, i) => {
      const on = i === realIndex;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-current', on ? 'true' : 'false');
      // reset non-active progress to empty
      if (progressEls[i] && !on) progressEls[i].style.transform = 'scaleX(0)';
    });
  }

  const config = {
    effect: effect === 'slide' ? 'slide' : 'fade',
    fadeEffect: { crossFade: true },
    parallax: true,
    loop: tabs.length > 1,
    speed: 800,
    allowTouchMove: true,
    autoplay: reduced ? false : { delay, disableOnInteraction: false },
    on: {
      init(sw) { setActive(sw.realIndex); },
      slideChange(sw) { setActive(sw.realIndex); },
      autoplayTimeLeft(sw, _time, progress) {
        // progress: 1 at start -> 0 at end; fill = 1 - progress
        const el = progressEls[sw.realIndex];
        if (el) el.style.transform = `scaleX(${(1 - progress).toFixed(4)})`;
      },
    },
  };

  const swiper = new Swiper(swiperEl, config);

  const clickHandlers = [];
  tabs.forEach((tab, i) => {
    const fn = () => {
      if (swiper.realIndex === i) return;
      // reset all fills, then jump
      progressEls.forEach((p) => p && (p.style.transform = 'scaleX(0)'));
      swiper.slideToLoop(i);
      if (!reduced && swiper.autoplay) {
        swiper.autoplay.stop();
        swiper.autoplay.start();
      }
    };
    tab.addEventListener('click', fn);
    clickHandlers.push({ tab, fn });
  });

  return function destroy() {
    clickHandlers.forEach(({ tab, fn }) => tab.removeEventListener('click', fn));
    if (swiper && !swiper.destroyed) swiper.destroy(true, true);
  };
}

export function initCaseSlider(scope) {
  scope = scope || document;
  const roots = scope.querySelectorAll('[data-case-slider]');
  if (!roots.length) return;
  roots.forEach((root) => {
    if (root.__caseSliderInit) return;
    root.__caseSliderInit = true;
    const cleanup = initInstance(root);
    if (cleanup) instances.push(cleanup);
    else root.__caseSliderInit = false;
  });
}

export function destroyCaseSlider() {
  instances.forEach((fn) => fn && fn());
  instances = [];
}
