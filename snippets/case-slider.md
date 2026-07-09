# Case Slider — full-screen case-study slider with autoplay tabs

Swiper 11 (fade + parallax) driven by a custom tab nav. Each tab's underline fills over the autoplay duration; clicking a tab jumps to that slide and resets the timer. Module: `src/scripts/case-slider.js`, auto-inits on `[data-case-slider]`.

Swiper 11 is already loaded site-wide (`cdn.jsdelivr.net/npm/swiper@11`), so no extra script needed.

## HTML structure

```
[data-case-slider]  data-case-delay="5000"      ← section, full-screen (height:100vh)
├─ .swiper [data-case-swiper]
│  └─ .swiper-wrapper
│     └─ .swiper-slide            (× per case study)
│        ├─ img.case-slide__bg  [data-swiper-parallax="-14%"]
│        ├─ .case-slide__scrim   (gradient overlay for legibility)
│        └─ .case-slide__inner   (eyebrow · h2 · desc · Read more · stats)
└─ [data-case-tabs]
   └─ button[data-case-tab]      (× per case study — SAME count/order as slides)
      ├─ .case-tab__track > .case-tab__progress [data-case-tab-progress]
      └─ label (client name)
```

## Webflow build (CMS-driven)

Both the slides **and** the tabs are Collection Lists bound to the **same Case Studies collection, sorted identically** — so slide N lines up with tab N automatically.

1. **Section** — full-screen (`height: 100vh`, `position: relative`, `overflow: hidden`). Custom attribute `data-case-slider`. Optional `data-case-delay` (ms, default 6000).
2. **Slides list** — a Collection List. Give the list wrapper the class `swiper` + attribute `data-case-swiper`; give `.w-dyn-items` the `swiper-wrapper` class; give `.w-dyn-item` the `swiper-slide` class. (The bundle's existing `slider.js` unwraps `.w-dyn-*` — but here we keep Swiper's own classes, so map them directly.)
   - Inside each slide: the bg image with attribute `data-swiper-parallax="-14%"`, a scrim div, then the content (bind eyebrow/headline/desc/stats to CMS fields).
3. **Tabs list** — a second Collection List (same collection, same sort). Each item is a `button`/link with `data-case-tab`, containing a progress element with `data-case-tab-progress` and the client-name label bound to CMS.
4. Publish, hard-refresh (service-worker cache).

## Behaviour
- Autoplay advances every `data-case-delay` ms; active tab's `[data-case-tab-progress]` fills via `scaleX` (transform-origin left).
- Click a tab → `slideToLoop` + autoplay resets.
- `prefers-reduced-motion` → no autoplay; tabs still work as manual nav.
- Fade + crossfade between slides; bg images parallax-drift.

## Key CSS (see preview/case-slider-test.html for the full styled reference)
- `.case-tab__progress { transform: scaleX(0); transform-origin: left; background: var(--peach); }`
- active tab: `.case-tab.is-active` (module toggles this class + `aria-current`).

## Notes
- No thumbnails — the tabs replace them (client's request).
- Test page: `preview/case-slider-test.html` (self-contained, Swiper from CDN).
