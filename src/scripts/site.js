// Site-wide scripts: GSAP eases, Lenis, nav, content reveal.
// Slider and list load run here too; other feature scripts live in their own Webflow components.

import { initNavDropdown } from './nav-dropdown.js';
import { initNavScrollHide } from './nav.js';
import { initContentReveal } from './content-reveal.js';
import { initSliders } from './slider.js';
import { initListLoad } from './list-load.js';

gsap.registerPlugin(CustomEase);
CustomEase.create('steamhaus', '0.625, 0.05, 0, 1');
CustomEase.create('parallax', '0.7, 0.05, 0.13, 1');
gsap.defaults({ ease: 'steamhaus', duration: 0.6 });

const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';

if (typeof window.Lenis !== 'undefined') {
  const lenis = new Lenis({ lerp: 0.165, wheelMultiplier: 1.25 });
  window.__steamhausLenis = lenis;
  if (hasScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function run() {
  if (document.querySelector('[data-menu-wrap]')) {
    initNavDropdown();
    initNavScrollHide();
  }
  if (document.querySelector('[data-reveal-group]')) initContentReveal(document);
  if (document.querySelector('[data-slider="slider"]')) initSliders(document);
  if (document.querySelector('[data-list-load]')) initListLoad(document);
  if (hasScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
