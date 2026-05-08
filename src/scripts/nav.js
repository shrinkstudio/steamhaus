// -----------------------------------------
// NAV — Scroll state (data-nav-scrolled)
// Sets --nav-height CSS var via ResizeObserver
// Uses Lenis scroll events when available, falls back to native
// -----------------------------------------

let nav = null;
let shrinkThreshold = 10;
let isScrolled = false;
let navResizeObserver = null;
let lastScrollY = 0;
let nativeHandler = null;

function onScroll({ scroll }) {
  if (!nav) return;

  const currentY = typeof scroll === 'number' ? scroll : window.scrollY;

  const shouldShrink = currentY > shrinkThreshold;
  if (shouldShrink !== isScrolled) {
    isScrolled = shouldShrink;
    nav.setAttribute('data-nav-scrolled', isScrolled ? 'true' : 'false');
  }

  lastScrollY = currentY;
}

function onNativeScroll() {
  onScroll({ scroll: window.scrollY });
}

function setNavHeightVar() {
  if (!nav) return;
  document.documentElement.style.setProperty('--nav-height', nav.offsetHeight + 'px');
}

export function initNavScrollHide() {
  nav = document.querySelector('[data-menu-wrap]');
  if (!nav) return;

  lastScrollY = window.scrollY;
  isScrolled = false;

  nav.setAttribute('data-nav-scrolled', window.scrollY > shrinkThreshold ? 'true' : 'false');

  setNavHeightVar();
  navResizeObserver = new ResizeObserver(setNavHeightVar);
  navResizeObserver.observe(nav);

  if (window.__steamhausLenis) {
    window.__steamhausLenis.on('scroll', onScroll);
  } else {
    nativeHandler = onNativeScroll;
    window.addEventListener('scroll', nativeHandler, { passive: true });
  }
}

export function destroyNavScrollHide() {
  if (window.__steamhausLenis) {
    window.__steamhausLenis.off('scroll', onScroll);
  }

  if (nativeHandler) {
    window.removeEventListener('scroll', nativeHandler);
    nativeHandler = null;
  }

  if (navResizeObserver) {
    navResizeObserver.disconnect();
    navResizeObserver = null;
  }

  nav = null;
  isScrolled = false;
  lastScrollY = 0;
}
