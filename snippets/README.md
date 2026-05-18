# Hero Visual Embed Snippets

## TL;DR — paste this one file

Drop the contents of **`hero-composition.html`** into a single Webflow **HTML Embed** in the hero. That's it — module picks it up via `data-hero-visual` and animates all 5 shapes.

## Files

| File | Use |
|---|---|
| `hero-composition.html` | **Complete composed scene** (5 shapes, glass panels, responsive). Drop-in ready. |
| `hero-dotgrid.html` | Individual shape — wave-sweep dot grid |
| `hero-pipeline.html` | Individual shape — deployment pipeline pulse |
| `hero-topology.html` | Individual shape — hub-and-spoke node lighting |
| `hero-terminal.html` | Individual shape — typewriter cloud commands |

## Module behaviour

- Init: `initHeroVisual(scope)` runs on any element matching `[data-hero-visual]` after page enter
- Each child `[data-hero-shape="..."]` mapped to its animator
- Honours `prefers-reduced-motion`
- Cleaned up via `gsap.context().revert()` on page leave (Barba)

## Responsive

Composition uses CSS media queries:
- `>1024px` — full 5-shape composed scene next to copy
- `≤1024px` — visual stacks below copy
- `≤640px` — bars + pipeline hidden, 3 shapes only

## Colour palette

| Token | Hex |
|---|---|
| Accent (peach) | `#e7a38b` (Webflow var: `--_color---secondary--peach`) |
| Faint lines | `rgba(255,255,255,0.15)` |
| Mid | `rgba(255,255,255,0.35)` |
| Bright pulse | `rgba(255,255,255,0.85)` |
