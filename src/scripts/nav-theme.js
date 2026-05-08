// -----------------------------------------
// NAV THEME — Detect section theme on scroll
// Updates [data-theme-nav] on the nav element based on
// which [data-theme-section] the nav overlaps
// Uses Lenis scroll events when available, falls back to native
// -----------------------------------------

let nav = null;
let sections = [];
let currentTheme = null;
let ticking = false;
let nativeHandler = null;

function checkTheme() {
  if (!nav || !sections.length) { ticking = false; return; }

  const offset = nav.offsetHeight / 2;

  for (let i = 0; i < sections.length; i++) {
    const rect = sections[i].getBoundingClientRect();
    if (rect.top <= offset && rect.bottom >= offset) {
      const theme = sections[i].getAttribute('data-theme-section');
      if (theme && theme !== currentTheme) {
        currentTheme = theme;
        nav.setAttribute('data-theme-nav', theme);
      }
      break;
    }
  }

  ticking = false;
}

function onLenisScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(checkTheme);
  }
}

function onNativeScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(checkTheme);
  }
}

export function initNavTheme(scope) {
  scope = scope || document;

  nav = document.querySelector('[data-theme-nav]');
  if (!nav) return;

  sections = [...scope.querySelectorAll('[data-theme-section]')];
  if (!sections.length) return;

  currentTheme = null;
  ticking = false;

  // Initial check
  checkTheme();

  if (window.__steamhausLenis) {
    window.__steamhausLenis.on('scroll', onLenisScroll);
  } else {
    nativeHandler = onNativeScroll;
    window.addEventListener('scroll', nativeHandler, { passive: true });
  }

  window.addEventListener('resize', onNativeScroll);
}

export function destroyNavTheme() {
  if (window.__steamhausLenis) {
    window.__steamhausLenis.off('scroll', onLenisScroll);
  }

  if (nativeHandler) {
    window.removeEventListener('scroll', nativeHandler);
    nativeHandler = null;
  }

  window.removeEventListener('resize', onNativeScroll);

  nav = null;
  sections = [];
  currentTheme = null;
  ticking = false;
}
