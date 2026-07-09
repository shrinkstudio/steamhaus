// -----------------------------------------
// DOT FIELD — interactive canvas dot grid (section background)
// -----------------------------------------
// Vanilla port of reactbits.dev/backgrounds/dot-field. Cursor "bulges" the
// grid outward; a soft glow follows the pointer, its intensity driven by
// pointer speed. Scoped to the Barba container, cleaned up on page leave.
//
// Attribute on the container:
//   [data-dot-field]                — enables the effect on this element
//
// Tunable attributes (all optional — sensible brand defaults):
//   data-dot-radius="1.5"           — dot size (px)
//   data-dot-spacing="14"           — gap between dots (px)
//   data-bulge-strength="67"        — how far dots push from the cursor
//   data-cursor-radius="500"        — cursor influence radius (px)
//   data-glow-radius="160"          — pointer glow size (px)
//   data-glow-color="#002f1e"       — pointer glow colour
//   data-gradient-from="rgba(...)"  — dot gradient start (top-left)
//   data-gradient-to="rgba(...)"    — dot gradient end (bottom-right)
//   data-sparkle="false"            — occasional larger "twinkle" dots
//   data-wave-amplitude="0"         — ambient idle wave (0 = off)
//
// The container must be position:relative (module sets it if static). Put page
// content inside with position:relative / z-index so it sits above the canvas.

const TWO_PI = Math.PI * 2;
let instances = [];

// ── attribute helpers ────────────────────────────────────────────
function num(el, attr, fallback) {
  const v = parseFloat(el.getAttribute(attr));
  return isNaN(v) ? fallback : v;
}
function str(el, attr, fallback) {
  const v = el.getAttribute(attr);
  return v === null || v === '' ? fallback : v;
}
function bool(el, attr, fallback) {
  const v = el.getAttribute(attr);
  if (v === null) return fallback;
  return v === 'true' || v === '' || v === '1';
}

function initInstance(container) {
  const opts = {
    dotRadius: num(container, 'data-dot-radius', 3),
    dotSpacing: num(container, 'data-dot-spacing', 16),
    cursorRadius: num(container, 'data-cursor-radius', 500),
    bulgeStrength: num(container, 'data-bulge-strength', 67),
    glowRadius: num(container, 'data-glow-radius', 160),
    glowColor: str(container, 'data-glow-color', ''), // empty = no cursor glow (opt-in)
    gradientFrom: str(container, 'data-gradient-from', 'rgba(153, 164, 160, 0.60)'), // brand-300
    gradientTo: str(container, 'data-gradient-to', 'rgba(102, 118, 113, 0.42)'),    // brand-400
    sparkle: bool(container, 'data-sparkle', false),
    waveAmplitude: num(container, 'data-wave-amplitude', 0),
  };

  // container must be a positioning context
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  container.prepend(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hasGlow =
    !!opts.glowColor &&
    opts.glowColor !== 'none' &&
    opts.glowColor !== 'transparent' &&
    opts.glowRadius > 0;

  let dots = [];
  let size = { w: 0, h: 0 };
  let rect = { left: 0, top: 0 };
  const mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
  let engagement = 0;
  let glowOpacity = 0;
  let raf = null;
  let frame = 0;

  function buildDots(w, h) {
    const step = opts.dotRadius + opts.dotSpacing;
    const cols = Math.floor(w / step);
    const rows = Math.floor(h / step);
    const padX = (w % step) / 2;
    const padY = (h % step) / 2;
    const arr = new Array(rows * cols);
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ax = padX + col * step + step / 2;
        const ay = padY + row * step + step / 2;
        arr[i++] = { ax, ay, sx: ax, sy: ay };
      }
    }
    dots = arr;
  }

  function measure() {
    const r = container.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    rect = { left: r.left, top: r.top };
    if (w === 0 || h === 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    size = { w, h };
    buildDots(w, h);
    if (prefersReduced) drawStatic();
  }

  function drawStatic() {
    ctx.clearRect(0, 0, size.w, size.h);
    const grad = ctx.createLinearGradient(0, 0, size.w, size.h);
    grad.addColorStop(0, opts.gradientFrom);
    grad.addColorStop(1, opts.gradientTo);
    ctx.fillStyle = grad;
    const rad = opts.dotRadius / 2;
    ctx.beginPath();
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      ctx.moveTo(d.ax + rad, d.ay);
      ctx.arc(d.ax, d.ay, rad, 0, TWO_PI);
    }
    ctx.fill();
  }

  // pointer position stored in container-local coords via cached rect
  function onMouseMove(e) {
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }
  function refreshRect() {
    const r = container.getBoundingClientRect();
    rect = { left: r.left, top: r.top };
  }

  const speedTimer = setInterval(() => {
    const dx = mouse.prevX - mouse.x;
    const dy = mouse.prevY - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    mouse.speed += (dist - mouse.speed) * 0.5;
    if (mouse.speed < 0.001) mouse.speed = 0;
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
  }, 20);

  function tick() {
    frame++;
    const { w, h } = size;
    const t = frame * 0.02;

    const target = Math.min(mouse.speed / 5, 1);
    engagement += (target - engagement) * 0.06;
    if (engagement < 0.001) engagement = 0;
    glowOpacity += (engagement - glowOpacity) * 0.08;

    ctx.clearRect(0, 0, w, h);

    // dots
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, opts.gradientFrom);
    grad.addColorStop(1, opts.gradientTo);
    ctx.fillStyle = grad;

    const cr = opts.cursorRadius;
    const crSq = cr * cr;
    const rad = opts.dotRadius / 2;
    ctx.beginPath();

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const dx = mouse.x - d.ax;
      const dy = mouse.y - d.ay;
      const distSq = dx * dx + dy * dy;

      if (distSq < crSq && engagement > 0.01) {
        const dist = Math.sqrt(distSq);
        const k = 1 - dist / cr;
        const push = k * k * opts.bulgeStrength * engagement;
        const angle = Math.atan2(dy, dx);
        d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
        d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
      } else {
        d.sx += (d.ax - d.sx) * 0.1;
        d.sy += (d.ay - d.sy) * 0.1;
      }

      let drawX = d.sx;
      let drawY = d.sy;
      if (opts.waveAmplitude > 0) {
        drawY += Math.sin(d.ax * 0.03 + t) * opts.waveAmplitude;
        drawX += Math.cos(d.ay * 0.03 + t * 0.7) * opts.waveAmplitude * 0.5;
      }

      if (opts.sparkle) {
        const hash = ((i * 2654435761) ^ (frame >> 3)) >>> 0;
        const r = (hash % 100) < 3 ? rad * 1.8 : rad;
        ctx.moveTo(drawX + r, drawY);
        ctx.arc(drawX, drawY, r, 0, TWO_PI);
      } else {
        ctx.moveTo(drawX + rad, drawY);
        ctx.arc(drawX, drawY, rad, 0, TWO_PI);
      }
    }
    ctx.fill();

    // pointer glow (over dots) — opt-in only
    if (hasGlow && glowOpacity > 0.01 && mouse.x > -9000) {
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, opts.glowRadius);
      g.addColorStop(0, opts.glowColor);
      g.addColorStop(1, 'transparent');
      ctx.globalAlpha = glowOpacity;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, opts.glowRadius, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    raf = requestAnimationFrame(tick);
  }

  // observers + listeners
  const ro = new ResizeObserver(() => measure());
  ro.observe(container);
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('scroll', refreshRect, { passive: true });
  const lenis = window.__steamhausLenis;
  if (lenis && typeof lenis.on === 'function') lenis.on('scroll', refreshRect);

  measure();
  if (!prefersReduced) raf = requestAnimationFrame(tick);

  return function destroy() {
    if (raf) cancelAnimationFrame(raf);
    clearInterval(speedTimer);
    ro.disconnect();
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('scroll', refreshRect);
    if (lenis && typeof lenis.off === 'function') lenis.off('scroll', refreshRect);
    if (canvas.parentElement) canvas.parentElement.removeChild(canvas);
  };
}

export function initDotField(scope) {
  scope = scope || document;
  const els = scope.querySelectorAll('[data-dot-field]');
  if (!els.length) return;
  els.forEach((el) => {
    if (el.__dotFieldInit) return;
    el.__dotFieldInit = true;
    instances.push(initInstance(el));
  });
}

export function destroyDotField() {
  instances.forEach((fn) => fn && fn());
  instances = [];
}
