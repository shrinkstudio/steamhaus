// -----------------------------------------
// STEAMHAUS BOOT
// Plain page loads (no Barba). Sets up GSAP, Lenis and every component once.
// -----------------------------------------

import { initAccordions } from './accordion.js';
import { initModalDelegation, initModals } from './modal.js';
import { initSliders } from './slider.js';
import { initInlineVideos } from './inline-video.js';
import { initTabs } from './tabs.js';
import { initTOC } from './toc.js';
import { initSocialShare } from './social-share.js';
import { initContentReveal } from './content-reveal.js';
import { initCaseSlider } from './case-slider.js';
import { initCases } from './cases.js';
import { initCopyClip } from './copy-clip.js';
import { initDotField } from './dot-field.js';
import { initLogoWall } from './logo-wall.js';
import { initCmsNest } from './cms-nest.js';
import { initListLoad } from './list-load.js';
import { initFilterBasic } from './filter-basic.js';
import { initFormValidate } from './form-validate.js';
import { initHubspot } from './hubspot.js';
import { initHeroVisual } from './hero-visual.js';
import { initNavDropdown } from './nav-dropdown.js';
import { initNavScrollHide } from './nav.js';

gsap.registerPlugin(CustomEase);

CustomEase.create('steamhaus', '0.625, 0.05, 0, 1');
CustomEase.create('parallax', '0.7, 0.05, 0.13, 1');
gsap.defaults({ ease: 'steamhaus', duration: 0.6 });

const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';

function initLenis() {
  if (typeof window.Lenis === 'undefined') return;

  const lenis = new Lenis({ lerp: 0.165, wheelMultiplier: 1.25 });
  window.__steamhausLenis = lenis;

  if (hasScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function initComponents(page) {
  const has = (s) => !!page.querySelector(s);

  initModalDelegation();

  if (has('details')) initAccordions(page);
  if (has('dialog, [data-modal-panel]')) initModals(page);
  if (has('[data-slider="slider"]')) initSliders(page);
  if (has('video[data-video]')) initInlineVideos(page);
  if (has('[data-tabs-component]')) initTabs(page);
  if (has('[data-toc-source]')) initTOC(page);
  if (has('[data-social-share]')) initSocialShare(page);
  if (has('[data-reveal-group]')) initContentReveal(page);
  if (has('[data-nest="target"]')) initCmsNest(page);
  if (has('[data-list-load]')) initListLoad(page);
  if (has('[data-case-slider]')) initCaseSlider(page);
  if (has('[data-cases]')) initCases(page);
  if (has('[data-copy="trigger"], [data-copy="link"]')) initCopyClip(page);
  if (has('[data-dot-field]')) initDotField(page);
  if (has('[data-logo-wall-cycle-init]')) initLogoWall(page);
  if (has('[data-filter-group]')) initFilterBasic(page);
  if (has('[data-form-validate]')) initFormValidate(page);
  if (has('form[data-hubspot-form]')) initHubspot(page);
  if (has('[data-hero-visual]')) initHeroVisual(page);

  if (has('[data-menu-wrap]')) {
    initNavDropdown(page);
    initNavScrollHide();
  }
}

function boot() {
  initLenis();
  initComponents(document);
  if (hasScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
