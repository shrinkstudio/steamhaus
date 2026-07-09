# Dot Field — interactive section background

Vanilla-ported from [reactbits.dev/backgrounds/dot-field](https://reactbits.dev/backgrounds/dot-field). Canvas dot-grid that bulges away from the cursor. Lives in the bundle as `src/scripts/dot-field.js`, auto-initialised on any `[data-dot-field]` element.

## Webflow setup

1. Select the section. Background `#00160E`, **position: relative**.
2. Add custom attribute **`data-dot-field`** (no value).
3. Put content inside a wrapper with **position: relative + z-index ≥ 1** so it sits above the injected canvas (`z-index: 0`).
4. Publish. Bundle handles init on page-enter and cleanup on page-leave.

No embed, no `<script>` — just the attribute. The bundle is already loaded site-wide.

## Tunable attributes

All optional. Defaults use the brand palette on `#00160E`.

| Attribute | Default | Effect |
|---|---|---|
| `data-dot-radius` | `1.5` | Dot size (px) |
| `data-dot-spacing` | `14` | Gap between dots (px) |
| `data-bulge-strength` | `67` | How far dots push from the cursor |
| `data-cursor-radius` | `500` | Cursor influence radius (px). Lower = tighter bulge |
| `data-gradient-from` | `rgba(153,164,160,0.30)` (brand-300) | Dot colour, top-left |
| `data-gradient-to` | `rgba(102,118,113,0.18)` (brand-400) | Dot colour, bottom-right |
| `data-sparkle` | `false` | Occasional larger "twinkle" dots |
| `data-wave-amplitude` | `0` | Ambient idle wave (0 = off) |
| `data-glow-color` | *(empty = off)* | Cursor glow colour — **opt-in only**. Set a colour to enable |
| `data-glow-radius` | `160` | Glow size (only applies if `data-glow-color` is set) |

**Cursor glow is OFF by default.** It only renders if you set `data-glow-color` to a real colour (e.g. `#334941`). Leave it unset for no glow.

## Recipes

**Default (subtle, no glow) — just the attribute:**
```
data-dot-field
```

**More visible dots:**
```
data-dot-field
data-gradient-from="rgba(153,164,160,0.5)"
data-gradient-to="rgba(102,118,113,0.3)"
```

**Tighter, punchier bulge:**
```
data-dot-field
data-cursor-radius="300"
data-bulge-strength="90"
```

**Denser grid:**
```
data-dot-field
data-dot-spacing="10"
data-dot-radius="1.2"
```

**With a soft green cursor glow (if ever wanted):**
```
data-dot-field
data-glow-color="#334941"
data-glow-radius="180"
```

## Notes
- Honours `prefers-reduced-motion` — renders a static dot grid, no animation or interaction.
- Cleans up fully on Barba page-leave (RAF cancelled, listeners + ResizeObserver removed, canvas removed).
- Reads Lenis scroll (`window.__steamhausLenis`) to keep pointer mapping accurate during smooth scroll.
- Test page: `preview/dot-field-test.html`.
