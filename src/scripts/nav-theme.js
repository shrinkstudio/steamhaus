// -----------------------------------------
// NAV THEME — Auto-detect section luminance on scroll
// Reads computed background-color of each <section>,
// calculates luminance, and sets [data-theme-nav] to
// "light" or "dark" so CSS can style the nav accordingly.
// No manual attributes needed on sections.
// Uses Lenis scroll events when available, falls back to native.
// -----------------------------------------

let nav = null;
let sections = [];
let sectionThemes = [];
let currentTheme = null;
let ticking = false;
let nativeHandler = null;

function luminance(r, g, b) {
  // Relative luminance (WCAG)
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseColor(str) {
  const m = str.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3] };
}

function detectTheme(el) {
  // Walk up the tree to find a non-transparent background
  let node = el;
  while (node && node !== document.documentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    const color = parseColor(bg);
    if (color) {
      // Check alpha — skip fully transparent
      const alphaMatch = bg.match(/rgba\([^)]+,\s*([\d.]+)\)/);
      if (alphaMatch && parseFloat(alphaMatch[1]) === 0) {
        node = node.parentElement;
        continue;
      }
      return luminance(color.r, color.g, color.b) > 0.4 ? 'light' : 'dark';
    }
    node = node.parentElement;
  }
  return 'light';
}

function cacheSectionThemes() {
  sectionThemes = sections.map(s => {
    // Allow manual override via data-theme-section
    const manual = s.getAttribute('data-theme-section');
    if (manual) return manual;
    return detectTheme(s);
  });
}

function checkTheme() {
  if (!nav || !sections.length) { ticking = false; return; }

  const offset = nav.offsetHeight / 2;

  for (let i = 0; i < sections.length; i++) {
    const rect = sections[i].getBoundingClientRect();
    if (rect.top <= offset && rect.bottom >= offset) {
      const theme = sectionThemes[i];
      if (theme && theme !== currentTheme) {
        currentTheme = theme;
        nav.setAttribute('data-theme-nav', theme);
      }
      break;
    }
  }

  ticking = false;
}

function requestCheck() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(checkTheme);
  }
}

export function initNavTheme(scope) {
  scope = scope || document;

  nav = document.querySelector('[data-theme-nav]');
  if (!nav) return;

  sections = [...scope.querySelectorAll('section')];
  if (!sections.length) return;

  currentTheme = null;
  ticking = false;

  cacheSectionThemes();
  checkTheme();

  if (window.__steamhausLenis) {
    window.__steamhausLenis.on('scroll', requestCheck);
  } else {
    nativeHandler = requestCheck;
    window.addEventListener('scroll', nativeHandler, { passive: true });
  }

  window.addEventListener('resize', requestCheck);
}

export function destroyNavTheme() {
  if (window.__steamhausLenis) {
    window.__steamhausLenis.off('scroll', requestCheck);
  }

  if (nativeHandler) {
    window.removeEventListener('scroll', nativeHandler);
    nativeHandler = null;
  }

  window.removeEventListener('resize', requestCheck);

  nav = null;
  sections = [];
  sectionThemes = [];
  currentTheme = null;
  ticking = false;
}
