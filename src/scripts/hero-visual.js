// -----------------------------------------
// HERO VISUAL — Animated SVG/HTML shapes for the hero area
// -----------------------------------------
// Attributes:
//   [data-hero-visual]                — container wrapping one or more shapes
//   [data-hero-shape="dotgrid"]       — radiating dot-grid wave
//   [data-hero-shape="pipeline"]      — deployment pipeline pulse
//   [data-hero-shape="topology"]      — hub-and-spoke node lighting
//   [data-hero-shape="terminal"]      — typewriter terminal stream
//
// Each shape is self-contained. Animations honour prefers-reduced-motion.
// Cleaned up via gsap.context().revert() on destroy.

let ctx = null;

const PEACH = '#e7a38b';
const FAINT = 'rgba(255, 255, 255, 0.15)';
const MID = 'rgba(255, 255, 255, 0.35)';
const BRIGHT = 'rgba(255, 255, 255, 0.85)';

const SHAPE_INITS = {
  dotgrid: initDotgrid,
  pipeline: initPipeline,
  topology: initTopology,
  terminal: initTerminal,
  bars: initBars,
};

export function initHeroVisual(scope) {
  scope = scope || document;
  const containers = scope.querySelectorAll('[data-hero-visual]');
  if (!containers.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  ctx = gsap.context(() => {
    containers.forEach(container => {
      container.querySelectorAll('[data-hero-shape]').forEach(shape => {
        const type = shape.getAttribute('data-hero-shape');
        const fn = SHAPE_INITS[type];
        if (fn) fn(shape, { reduced });
      });
    });
  });
}

export function destroyHeroVisual() {
  if (ctx) {
    ctx.revert();
    ctx = null;
  }
}


// -----------------------------------------
// SHAPE: DOTGRID — wave sweep across grid of dots
// -----------------------------------------
function initDotgrid(el, { reduced }) {
  const dots = el.querySelectorAll('circle');
  if (!dots.length) return;

  // Baseline state
  gsap.set(dots, { opacity: 0.18, fill: 'rgb(255,255,255)' });

  if (reduced) return;

  // Group by column for a horizontal sweep
  const dotArr = Array.from(dots);
  dotArr.sort((a, b) => parseFloat(a.getAttribute('cx')) - parseFloat(b.getAttribute('cx')));

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.8 });

  tl.to(dotArr, {
    opacity: 0.85,
    fill: PEACH,
    duration: 0.5,
    stagger: { each: 0.025, from: 'start' },
    ease: 'power2.out',
  });

  tl.to(dotArr, {
    opacity: 0.18,
    fill: 'rgb(255,255,255)',
    duration: 0.9,
    stagger: { each: 0.025, from: 'start' },
    ease: 'power2.in',
  }, '<+0.35');
}


// -----------------------------------------
// SHAPE: PIPELINE — pulse traveling between nodes
// -----------------------------------------
function initPipeline(el, { reduced }) {
  const nodes = el.querySelectorAll('[data-pipeline-node]');
  const pulse = el.querySelector('[data-pipeline-pulse]');
  if (!nodes.length || !pulse) return;

  gsap.set(nodes, { fill: FAINT });
  gsap.set(pulse, { autoAlpha: 0 });

  if (reduced) return;

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });

  nodes.forEach((node, i) => {
    const cx = parseFloat(node.getAttribute('cx'));
    const cy = parseFloat(node.getAttribute('cy'));

    if (i === 0) {
      tl.set(pulse, { attr: { cx, cy } });
      tl.to(pulse, { autoAlpha: 1, duration: 0.25, ease: 'power2.out' });
    } else {
      tl.to(pulse, {
        attr: { cx, cy },
        duration: 0.75,
        ease: 'power1.inOut',
      });
    }

    // Briefly brighten this node as the pulse arrives
    tl.to(node, {
      fill: PEACH,
      duration: 0.2,
      ease: 'power2.out',
    }, '<+0.55');

    tl.to(node, {
      fill: FAINT,
      duration: 0.8,
      ease: 'power2.in',
    }, '>0.15');
  });

  tl.to(pulse, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, '-=0.5');
}


// -----------------------------------------
// SHAPE: TOPOLOGY — hub-and-spoke sequential lighting
// -----------------------------------------
function initTopology(el, { reduced }) {
  const hub = el.querySelector('[data-topo-hub]');
  const spokes = el.querySelectorAll('[data-topo-spoke]');
  const outer = el.querySelectorAll('[data-topo-node]');
  if (!spokes.length || !outer.length) return;

  gsap.set(spokes, { stroke: FAINT, strokeWidth: 1 });
  gsap.set(outer, { fill: FAINT });
  if (hub) gsap.set(hub, { fill: MID });

  if (reduced) return;

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });

  outer.forEach((node, i) => {
    const spoke = spokes[i];
    if (!spoke) return;

    tl.to(spoke, {
      stroke: PEACH,
      strokeWidth: 1.5,
      duration: 0.2,
      ease: 'power2.out',
    }, `+=0.05`);

    tl.to(node, {
      fill: PEACH,
      duration: 0.2,
      ease: 'power2.out',
    }, '<+0.12');

    tl.to([spoke, node], {
      stroke: FAINT,
      fill: FAINT,
      strokeWidth: 1,
      duration: 0.55,
      ease: 'power2.in',
    }, '>0.15');
  });

  // Subtle hub pulse on every cycle
  if (hub) {
    tl.to(hub, {
      fill: BRIGHT,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
    }, 0);
  }
}


// -----------------------------------------
// SHAPE: TERMINAL — typewriter cloud command stream
// -----------------------------------------
function initTerminal(el, { reduced }) {
  const output = el.querySelector('[data-terminal-output]');
  const cursor = el.querySelector('[data-terminal-cursor]');
  if (!output) return;

  const lines = [
    '$ steamhaus deploy --env prod',
    '> bundling assets…',
    '> uploading to s3://app.steamhaus.io',
    '> invalidating cloudfront cache',
    '> ✓ ready in 12s',
  ];

  // Static state for reduced motion
  if (reduced) {
    output.innerHTML = lines
      .map(l => `<div class="terminal-line">${l}</div>`)
      .join('');
    return;
  }

  // Blink cursor independently
  if (cursor) {
    gsap.to(cursor, {
      opacity: 0,
      duration: 0.5,
      repeat: -1,
      yoyo: true,
      ease: 'steps(1)',
    });
  }

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });

  let lineEl = null;
  const charsObj = { count: 0 };

  lines.forEach((line, i) => {
    tl.call(() => {
      lineEl = document.createElement('div');
      lineEl.className = 'terminal-line';
      output.appendChild(lineEl);
      charsObj.count = 0;
    });

    tl.to(charsObj, {
      count: line.length,
      duration: Math.max(0.4, line.length * 0.035),
      ease: 'none',
      onUpdate: () => {
        if (lineEl) lineEl.textContent = line.slice(0, Math.floor(charsObj.count));
      },
      onComplete: () => {
        if (lineEl) lineEl.textContent = line;
      },
    });

    tl.to({}, { duration: i === lines.length - 1 ? 1.5 : 0.35 });
  });

  // Clear before next cycle
  tl.call(() => {
    output.innerHTML = '';
  });
}


// -----------------------------------------
// SHAPE: BARS — morphing bar chart (vertical rhythm)
// -----------------------------------------
function initBars(el, { reduced }) {
  const bars = el.querySelectorAll('[data-bar]');
  if (!bars.length) return;

  // Baseline anchored to the bottom edge of each bar
  const baselineY = parseFloat(el.getAttribute('data-baseline-y')) || 92;

  // Snapshot original heights for proportional cycling
  const meta = Array.from(bars).map(bar => ({
    bar,
    h: parseFloat(bar.getAttribute('height')),
  }));

  gsap.set(bars, { fill: FAINT });

  if (reduced) return;

  meta.forEach(({ bar, h }, i) => {
    const heights = [h, h * 0.6, h * 1.2, h * 0.8, h * 1.05, h * 0.7];
    const tl = gsap.timeline({ repeat: -1, delay: i * 0.18 });
    heights.forEach((target) => {
      tl.to(bar, {
        attr: { y: baselineY - target, height: target },
        duration: 1.6 + Math.random() * 0.8,
        ease: 'sine.inOut',
      });
    });
  });

  // Periodic peach flash on bars in a deterministic order (auto-tracked by ctx)
  const flashOrder = [2, 0, 3, 1, 4, 2, 0, 3];
  const flashTl = gsap.timeline({ repeat: -1, delay: 1.2 });
  flashOrder.forEach((idx, j) => {
    const bar = bars[idx % bars.length];
    if (!bar) return;
    const at = j * 1.6;
    flashTl.to(bar, { fill: PEACH, duration: 0.25, ease: 'power2.out' }, at);
    flashTl.to(bar, { fill: FAINT, duration: 0.45, ease: 'power2.in' }, at + 0.3);
  });
}
