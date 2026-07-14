# Logo Wall — cycling logo grid

GSAP-driven wall where each visible slot periodically swaps its logo for a fresh one from a pool, staggered by a shuffled pattern. Pauses off-screen (ScrollTrigger) and when the tab is hidden. Module: `src/scripts/logo-wall.js`, auto-inits on `[data-logo-wall-cycle-init]`. Needs GSAP + ScrollTrigger (already on the site).

## How the pool works (important)

The logos that *cycle in* come from **extra `[data-logo-wall-item]`s that are `display:none`**. Every item — visible or hidden — contributes its starting logo to the pool. So:

- **Visible slots** = the grid you see (e.g. 6).
- **Reserve items** = additional items set to `display:none` (e.g. another 6). Their logos are what rotate through the visible slots.

If every item is visible, there's nothing spare to cycle — so always include more items than fit.

## HTML structure

```
[data-logo-wall-cycle-init]  data-logo-wall-loop-delay="1.5" data-logo-wall-duration="0.9"
└─ [data-logo-wall-list]
   ├─ [data-logo-wall-item]              (visible slot × N)
   │  └─ [data-logo-wall-target-parent]   (overflow:hidden — clips the slide)
   │     └─ [data-logo-wall-target]        (the logo — img or div)
   └─ [data-logo-wall-item] (display:none) (reserve × M — feed the cycling pool)
```

## Webflow build (CMS-driven)

1. Section/wrapper: attr `data-logo-wall-cycle-init` (+ optional `data-logo-wall-loop-delay`, `data-logo-wall-duration`).
2. Collection List (bound to Clients/Logos): give the list `data-logo-wall-list`; each Collection Item `data-logo-wall-item`; an inner wrapper `data-logo-wall-target-parent` with **overflow: hidden**; the logo image `data-logo-wall-target`.
3. To create reserve items: either let the CMS list render all of them and cap the visible grid with CSS (`display:none` on `:nth-child(n+7)` at each breakpoint), or use a Collection List "Limit" trick. Simplest: show all, hide overflow items per breakpoint.

## Attributes

| Attribute | Default | Effect |
|---|---|---|
| `data-logo-wall-cycle-init` | — | Enables the wall on this element |
| `data-logo-wall-loop-delay` | `1.5` | Seconds between swaps |
| `data-logo-wall-duration` | `0.9` | Swap animation length (seconds) |
| `data-logo-wall-shuffle` | shuffled | Set `"false"` to keep the initial front row in source order |

## Notes
- `[data-logo-wall-target-parent]` **must be `overflow: hidden`** — the swap slides the outgoing logo up and the incoming up from below; without clipping you'll see both mid-slide.
- Responsive: the module re-runs `setup()` automatically when the visible-item count changes (e.g. a breakpoint hides some slots).
- Cleans up on Barba page-leave (timeline + ScrollTrigger killed, visibility listener removed).
- Test page: `preview/logo-wall-test.html`.
