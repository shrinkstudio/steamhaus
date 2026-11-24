# Steamhaus scripts

The live site does not load anything from this repo. Every script now sits inside Webflow:

| Where in Webflow | Script | Source |
|---|---|---|
| Site settings > Custom code > Footer | Lenis, GSAP eases, nav dropdown + burger, nav scroll state, content reveal, slider, list load more | `src/scripts/site.js` |
| Component: [CMS] Case Study Slider (Tabs) | Cases tabs | `cases.js` |
| Component: Accordion (inside the content) | Accordion | `accordion.js` |
| Component: Tabs | Tabs | `tabs.js` |
| Component: [CMS] Team List | Filter | `filter-basic.js` |
| Component: Section (Animated) | Dot field | `dot-field.js` |
| Component: [Contact] Contact Form Component | Form validation | `form-validate.js` |

Each component script is an Embed with the `u-d-none` class, guarded so it runs once per page however many instances there are. Libraries (GSAP, ScrollTrigger, CustomEase, SplitText, Lenis, Swiper) load from the site head.

To change a script, either edit it directly in Webflow, or edit `src/scripts/`, run `npm run build`, and paste the matching file from `webflow/` over the old one.
