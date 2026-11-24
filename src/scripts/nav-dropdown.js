// -----------------------------------------
// NAV DROPDOWN — simple text-link dropdown + mobile burger menu
// Replaces mega-nav.js.
//
// Markup (Mega Nav component):
//   nav[data-menu-wrap]
//     [data-nav-list]                      — link list; full-screen menu on ≤991
//       li[data-nav-drop]
//         button[data-nav-drop-toggle][aria-controls]
//         [data-nav-drop-panel]            — the four text links
//     button[data-burger-toggle] > [data-burger-line="top|mid|bot"]
//
// Desktop: opens on hover, click or ArrowDown; Escape and outside click close.
// Tablet + mobile: burger opens the menu, the toggle expands its links inline.
// -----------------------------------------

const MOBILE = '(max-width: 991px)';
const HOVER_ENTER = 80;
const HOVER_LEAVE = 150;

let cleanups = [];

export function initNavDropdown() {
  const menuWrap = document.querySelector('[data-menu-wrap]');
  if (!menuWrap) return;

  const navList = menuWrap.querySelector('[data-nav-list]');
  const burger = menuWrap.querySelector('[data-burger-toggle]');
  const lineTop = menuWrap.querySelector('[data-burger-line="top"]');
  const lineMid = menuWrap.querySelector('[data-burger-line="mid"]');
  const lineBot = menuWrap.querySelector('[data-burger-line="bot"]');
  const drops = [...menuWrap.querySelectorAll('[data-nav-drop]')]
    .map((item) => ({
      item,
      toggle: item.querySelector('[data-nav-drop-toggle]'),
      panel: item.querySelector('[data-nav-drop-panel]'),
      open: false,
      timer: null,
    }))
    .filter((d) => d.toggle && d.panel);

  const mq = window.matchMedia(MOBILE);
  let isMobile = mq.matches;
  let menuOpen = false;

  const on = (el, type, fn, opts) => {
    el.addEventListener(type, fn, opts);
    cleanups.push(() => el.removeEventListener(type, fn, opts));
  };

  const links = (d) => [...d.panel.querySelectorAll('a')];

  // --- Dropdown open/close --------------------------------------------------

  function openDrop(d) {
    if (d.open) return;
    drops.forEach((o) => o !== d && closeDrop(o));
    d.open = true;
    d.toggle.setAttribute('aria-expanded', 'true');
    gsap.killTweensOf(d.panel);

    if (isMobile) {
      gsap.to(d.panel, { height: 'auto', duration: 0.35, ease: 'power3.out' });
    } else {
      menuWrap.setAttribute('data-menu-open', 'true');
      gsap.fromTo(d.panel,
        { autoAlpha: 0, y: -6 },
        { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      );
    }
  }

  function closeDrop(d, instant) {
    clearTimeout(d.timer);
    if (!d.open) return;
    d.open = false;
    d.toggle.setAttribute('aria-expanded', 'false');
    gsap.killTweensOf(d.panel);

    if (isMobile) {
      gsap.to(d.panel, { height: 0, duration: instant ? 0 : 0.25, ease: 'power2.inOut' });
    } else {
      if (!drops.some((o) => o.open)) menuWrap.setAttribute('data-menu-open', 'false');
      gsap.to(d.panel, { autoAlpha: 0, y: -6, duration: instant ? 0 : 0.18, ease: 'power2.in' });
    }
  }

  // --- Mobile menu ----------------------------------------------------------

  function animateBurger(toX) {
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
    if (!lineTop || !lineMid || !lineBot) return tl;
    if (toX) {
      tl.to(lineTop, { y: '0.3125em', duration: 0.15 }, 0);
      tl.to(lineBot, { y: '-0.3125em', duration: 0.15 }, 0);
      tl.to(lineMid, { autoAlpha: 0, duration: 0.1 }, 0.1);
      tl.to(lineTop, { rotation: 45, duration: 0.2 }, 0.15);
      tl.to(lineBot, { rotation: -45, duration: 0.2 }, 0.15);
    } else {
      tl.to([lineTop, lineBot], { rotation: 0, duration: 0.2 }, 0);
      tl.to([lineTop, lineBot], { y: 0, duration: 0.15 }, 0.15);
      tl.to(lineMid, { autoAlpha: 1, duration: 0.1 }, 0.15);
    }
    return tl;
  }

  function navItems() {
    return navList ? [...navList.querySelectorAll('[data-nav-list-item]')] : [];
  }

  function openMenu() {
    if (!navList) return;
    menuOpen = true;
    menuWrap.setAttribute('data-menu-open', 'true');
    burger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    window.__steamhausLenis?.stop();

    gsap.killTweensOf([navList, ...navItems()]);
    animateBurger(true);
    gsap.to(navList, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' });
    gsap.fromTo(navItems(),
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power3.out', delay: 0.1 }
    );
  }

  function closeMenu(instant) {
    if (!navList) return;
    menuOpen = false;
    menuWrap.setAttribute('data-menu-open', 'false');
    burger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    window.__steamhausLenis?.start();

    drops.forEach((d) => closeDrop(d, true));
    gsap.killTweensOf([navList, ...navItems()]);
    animateBurger(false);
    gsap.to(navList, { autoAlpha: 0, duration: instant ? 0 : 0.25, ease: 'power2.inOut' });
  }

  // --- Layout reset per breakpoint -----------------------------------------

  function setup() {
    drops.forEach((d) => {
      d.open = false;
      clearTimeout(d.timer);
      d.toggle.setAttribute('aria-expanded', 'false');
      gsap.killTweensOf(d.panel);
      gsap.set(d.panel, { clearProps: 'all' });
    });
    menuWrap.setAttribute('data-menu-open', 'false');

    if (isMobile) {
      if (navList) gsap.set(navList, { autoAlpha: 0 });
    } else {
      menuOpen = false;
      burger?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (navList) gsap.set([navList, ...navItems()], { clearProps: 'opacity,visibility,transform' });
      if (lineTop) gsap.set([lineTop, lineMid, lineBot], { clearProps: 'all' });
    }
  }

  // --- Events ---------------------------------------------------------------

  drops.forEach((d) => {
    on(d.toggle, 'click', () => (d.open ? closeDrop(d) : openDrop(d)));

    on(d.item, 'mouseenter', () => {
      if (isMobile) return;
      clearTimeout(d.timer);
      d.timer = setTimeout(() => openDrop(d), HOVER_ENTER);
    });
    on(d.item, 'mouseleave', () => {
      if (isMobile) return;
      clearTimeout(d.timer);
      d.timer = setTimeout(() => closeDrop(d), HOVER_LEAVE);
    });

    on(d.toggle, 'keydown', (e) => {
      if (isMobile || e.key !== 'ArrowDown') return;
      e.preventDefault();
      openDrop(d);
      links(d)[0]?.focus();
    });

    on(d.panel, 'keydown', (e) => {
      if (isMobile) return;
      const list = links(d);
      const i = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length]?.focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus(); }
    });

    // Close when focus leaves the item (keyboard tabbing past the last link)
    on(d.item, 'focusout', (e) => {
      if (isMobile || d.item.contains(e.relatedTarget)) return;
      closeDrop(d);
    });
  });

  on(document, 'keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openOne = drops.find((d) => d.open);
    if (openOne && !isMobile) {
      closeDrop(openOne);
      openOne.toggle.focus();
    } else if (menuOpen) {
      closeMenu();
      burger?.focus();
    }
  });

  on(document, 'click', (e) => {
    if (isMobile) return;
    drops.forEach((d) => d.open && !d.item.contains(e.target) && closeDrop(d));
  });

  if (burger) on(burger, 'click', () => (menuOpen ? closeMenu() : openMenu()));

  const onChange = () => {
    if (menuOpen) closeMenu(true);
    isMobile = mq.matches;
    setup();
  };
  on(mq, 'change', onChange);

  setup();
}

export function destroyNavDropdown() {
  cleanups.forEach((fn) => fn());
  cleanups = [];
}
