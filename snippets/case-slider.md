# Case Slider — full-screen case-study slider (GSAP line reveal + autoplay tabs)

Osmo-style **line reveal** (GSAP `SplitText`, masked lines) for the text — the same transition as the Shrink Studio testimonial slider — with an image crossfade and a custom tab nav whose underline fills over the autoplay duration. Module: `src/scripts/case-slider.js`, auto-inits on `[data-case-slider]`.

## ⚠️ Dependency — add SplitText

The site loads GSAP 3.15 + ScrollTrigger, but **not SplitText**. Add this to the Webflow site-wide custom code **before** the bundle script (SplitText is free since GSAP 3.13):

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>
```

Then register it (in your existing GSAP init, or the bundle already calls `gsap.registerPlugin` where needed — SplitText auto-registers on load in 3.13+). If SplitText is missing the module falls back to a plain crossfade, so nothing breaks.

## HTML structure

```
[data-case-slider]  data-case-delay="6000"      ← section, full-screen (height:100vh, position:relative, overflow:hidden)
├─ [data-case-list]                              ← items stack absolutely inside
│  └─ [data-case-item]           (× per case study)
│     ├─ img [data-case-bg]                      ← bg image (crossfades)
│     ├─ scrim div
│     └─ content:
│        ├─ [data-case-split]  eyebrow           ← LINE-REVEALS (repeat per text block)
│        ├─ [data-case-split]  h2
│        ├─ [data-case-split]  desc
│        ├─ [data-case-fade]   Read-more link    ← fades up (repeat as needed)
│        └─ [data-case-fade]   stats block
└─ [data-case-tabs]
   └─ [data-case-tab]           (× per case study — SAME count/order as items)
      ├─ track > [data-case-tab-progress]        ← fill (scaleX, transform-origin:left)
      └─ label (client name)
```

- `[data-case-split]` = text that does the masked line reveal (headline, description).
- `[data-case-fade]` = supporting content that fades/slides up as a unit (eyebrow, stats, button). Don't split stat numbers into lines — use fade.
- **Eyebrow with a dot:** use `data-case-fade`, NOT `data-case-split`. If the eyebrow has a `::before` dot (or any pseudo-element / icon), splitting it into masked lines animates the text but leaves the dot behind. Fade moves the whole element together so the dot stays attached.

## Webflow build (CMS-driven)

Slides **and** tabs are two Collection Lists on the **same Case Studies collection, sorted identically** — slide N lines up with tab N.

1. Section: `height:100vh`, `position:relative`, `overflow:hidden`, attr `data-case-slider` (+ optional `data-case-delay`).
2. Slides list: give `.w-dyn-list` (or a wrapping div) `data-case-list`; each `.w-dyn-item` = `data-case-item` (position absolute, inset 0). Inside: `data-case-bg` image, scrim, and content with `data-case-split` / `data-case-fade`.
3. Tabs list: second Collection List (same collection/sort); each item a button with `data-case-tab` containing `[data-case-tab-progress]` + the client-name label.
4. Publish, hard-refresh.

## Behaviour
- Progress fill **is** the autoplay timer — when a tab's underline finishes filling, it advances.
- Click a tab → jumps + resets the timer.
- Pauses when scrolled off-screen (ScrollTrigger).
- `prefers-reduced-motion` → plain crossfade, no autoplay; tabs still work.

## Notes
- Style `[data-case-tab-progress]` with `transform-origin: left` or it fills from centre.
- Test page (self-contained, GSAP+SplitText from CDN): `preview/case-slider-test.html`.
