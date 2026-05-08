// -----------------------------------------
// NAV — Hide on scroll down, show on scroll up
// + Scroll shrink (data-nav-scrolled)
// Uses Lenis scroll events when available, falls back to native
// -----------------------------------------

let nav = null;
let lastScrollY = 0;
let isHidden = false;
let scrollThreshold = 50;
let shrinkThreshold = 10;
let isScrolled = false;
let tween = null;
let navResizeObserver = null;
let navTopOffset = 0;

function onScroll({ scroll, direction }) {
  if (!nav) return;

  const currentY = typeof scroll === 'number' ? scroll : window.scrollY;

  // Scroll shrink — toggle data-nav-scrolled
  const shouldShrink = currentY > shrinkThreshold;
  if (shouldShrink !== isScrolled) {
    isScrolled = shouldShrink;
    nav.setAttribute('data-nav-scrolled', isScrolled ? 'true' : 'false');
  }

  // Don't hide nav while dropdown is open
  if (nav.getAttribute('data-menu-open') === 'true') {
    lastScrollY = currentY;
    return;
  }

  // Always show nav at the top of the page
  if (currentY <= scrollThreshold) {
    if (isHidden) showNav();
    lastScrollY = currentY;
    return;
  }

  if (direction === 1 && !isHidden) {
    hideNav();
  } else if (direction === -1 && isHidden) {
    showNav();
  }

  lastScrollY = currentY;
}

function hideNav() {
  if (!nav || isHidden) return;
  isHidden = true;

  if (tween) tween.kill();
  tween = gsap.to(nav, {
    yPercent: -100,
    y: -navTopOffset,
    duration: 0.4,
    ease: 'power3.inOut',
  });
}

function showNav() {
  if (!nav || !isHidden) return;
  isHidden = false;

  if (tween) tween.kill();
  tween = gsap.to(nav, {
    yPercent: 0,
    y: 0,
    duration: 0.4,
    ease: 'power3.out',
    onComplete: () => {
      // Remove transform so position:fixed children (mobile menu) work correctly
      gsap.set(nav, { clearProps: 'transform' });
    },
  });
}

function setNavHeightVar() {
  if (!nav) return;
  document.documentElement.style.setProperty('--nav-height', nav.offsetHeight + 'px');
}

let nativeHandler = null;

function onNativeScroll() {
  const currentY = window.scrollY;
  const direction = currentY > lastScrollY ? 1 : -1;
  onScroll({ scroll: currentY, direction });
}

export function initNavScrollHide() {
  nav = document.querySelector('[data-menu-wrap]');
  if (!nav) return;

  lastScrollY = window.scrollY;
  isHidden = false;
  isScrolled = false;

  navTopOffset = parseFloat(getComputedStyle(nav).top) || 0;

  nav.setAttribute('data-nav-scrolled', window.scrollY > shrinkThreshold ? 'true' : 'false');
  gsap.set(nav, { clearProps: 'transform' });

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
  if (nav && isHidden) {
    gsap.set(nav, { clearProps: 'transform' });
  }

  if (tween) {
    tween.kill();
    tween = null;
  }

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
  isHidden = false;
  isScrolled = false;
  lastScrollY = 0;
}
