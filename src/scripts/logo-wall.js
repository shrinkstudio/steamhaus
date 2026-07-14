// -----------------------------------------
// LOGO WALL — cycling logo grid (GSAP)
// -----------------------------------------
// Each visible slot swaps its logo for a fresh one from the pool on a loop,
// staggered by a shuffled pattern. Pauses when scrolled off-screen
// (ScrollTrigger) and when the browser tab is hidden. init/destroy scoped to
// the Barba container.
//
// Attributes:
//   [data-logo-wall-cycle-init]        — wrapper (one instance)
//   [data-logo-wall-list]              — the list of slots
//   [data-logo-wall-item]              — a slot
//   [data-logo-wall-target]            — a logo (the element that swaps)
//   [data-logo-wall-target-parent]     — optional inner element that holds the target
//   [data-logo-wall-shuffle="false"]   — disable front-row shuffle (default: shuffled)
//   [data-logo-wall-loop-delay="1.5"]  — optional, seconds between swaps
//   [data-logo-wall-duration="0.9"]    — optional, swap animation seconds

let instances = [];

function initInstance(root) {
  if (typeof gsap === 'undefined') return null;

  const list = root.querySelector('[data-logo-wall-list]');
  if (!list) return null;

  const items = Array.from(list.querySelectorAll('[data-logo-wall-item]'));
  if (!items.length) return null;

  const loopDelay = parseFloat(root.getAttribute('data-logo-wall-loop-delay')) || 1.5;
  const duration = parseFloat(root.getAttribute('data-logo-wall-duration')) || 0.9;
  const shuffleFront = root.getAttribute('data-logo-wall-shuffle') !== 'false';

  const originalTargets = items
    .map((item) => item.querySelector('[data-logo-wall-target]'))
    .filter(Boolean);

  let visibleItems = [];
  let visibleCount = 0;
  let pool = [];
  let pattern = [];
  let patternIndex = 0;
  let tl = null;
  let scrollTrigger = null;

  function isVisible(el) {
    return window.getComputedStyle(el).display !== 'none';
  }

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function setup() {
    if (tl) tl.kill();

    visibleItems = items.filter(isVisible);
    visibleCount = visibleItems.length;

    pattern = shuffleArray(Array.from({ length: visibleCount }, (_, i) => i));
    patternIndex = 0;

    // remove all injected targets
    items.forEach((item) => {
      item.querySelectorAll('[data-logo-wall-target]').forEach((old) => old.remove());
    });

    pool = originalTargets.map((n) => n.cloneNode(true));

    let front, rest;
    if (shuffleFront) {
      const shuffledAll = shuffleArray(pool);
      front = shuffledAll.slice(0, visibleCount);
      rest = shuffleArray(shuffledAll.slice(visibleCount));
    } else {
      front = pool.slice(0, visibleCount);
      rest = shuffleArray(pool.slice(visibleCount));
    }
    pool = front.concat(rest);

    for (let i = 0; i < visibleCount; i++) {
      const parent =
        visibleItems[i].querySelector('[data-logo-wall-target-parent]') || visibleItems[i];
      parent.appendChild(pool.shift());
    }

    tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay });
    tl.call(swapNext);
    tl.play();
  }

  function swapNext() {
    const nowCount = items.filter(isVisible).length;
    if (nowCount !== visibleCount) {
      setup();
      return;
    }
    if (!pool.length) return;

    const idx = pattern[patternIndex % visibleCount];
    patternIndex++;

    const container = visibleItems[idx];
    const parent =
      container.querySelector('[data-logo-wall-target-parent]') ||
      container.querySelector('*:has(> [data-logo-wall-target])') ||
      container;
    const existing = parent.querySelectorAll('[data-logo-wall-target]');
    if (existing.length > 1) return;

    const current = parent.querySelector('[data-logo-wall-target]');
    const incoming = pool.shift();

    gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
    parent.appendChild(incoming);

    if (current) {
      gsap.to(current, {
        yPercent: -50,
        autoAlpha: 0,
        duration,
        ease: 'expo.inOut',
        onComplete: () => {
          current.remove();
          pool.push(current);
        },
      });
    }

    gsap.to(incoming, {
      yPercent: 0,
      autoAlpha: 1,
      duration,
      delay: 0.1,
      ease: 'expo.inOut',
    });
  }

  setup();

  if (typeof ScrollTrigger !== 'undefined') {
    scrollTrigger = ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => tl && tl.play(),
      onLeave: () => tl && tl.pause(),
      onEnterBack: () => tl && tl.play(),
      onLeaveBack: () => tl && tl.pause(),
    });
  }

  const onVisibility = () => {
    if (!tl) return;
    document.hidden ? tl.pause() : tl.play();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return function destroy() {
    if (tl) tl.kill();
    if (scrollTrigger) scrollTrigger.kill();
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

export function initLogoWall(scope) {
  scope = scope || document;
  const roots = scope.querySelectorAll('[data-logo-wall-cycle-init]');
  if (!roots.length) return;
  roots.forEach((root) => {
    if (root.__logoWallInit) return;
    root.__logoWallInit = true;
    const cleanup = initInstance(root);
    if (cleanup) instances.push(cleanup);
    else root.__logoWallInit = false;
  });
}

export function destroyLogoWall() {
  instances.forEach((fn) => fn && fn());
  instances = [];
}
