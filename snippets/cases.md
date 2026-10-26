# Cases — [CMS] Case Study Tabs

Module: `src/scripts/cases.js`, auto-inits on `[data-cases]`. Replaces `case-slider.js` (keep that until `/case-slider-test`'s old section is deleted).
Local demo: `preview/cases.html`.

## Components
- **Case Panel** (CMS group, closed). Props: Client Label, Headline, Summary, Button Text, Link, Image, Image Alt, Show Stats, Stat 1/2 Value + Label. Inside: Image (Background), Eyebrow (Dot), Heading (H2), Plain Text (Paragraph LG), Button (Secondary, `ph ph-arrow-bend-down-right`), two `cases_stat` cards.
- **[CMS] Case Study Tabs** (CMS group, closed). `section.cases_wrap[data-cases][data-cases-duration]` > media / scrim / blur > `cases_contain` > Collection List (Case Studies, Show on Slider? on, Display Order asc, limit 6) with a Case Panel per item > `cases_tablist`; hidden `cases_template` holds the one tab the script clones.

## Bindings (Case Panel instance in the list item)
Client Label = Slider Label · Headline = Slider Headline · Summary = Summary · Image = Thumbnail Image (switch to Slider Image once populated) · Stat 1/2 = Stat #1/#2 fields · Link = current Case Study (Designer only).

## CSS embed (Custom Code component, new "Case Study Tabs" group)
Only what classes can't express. Everything else is on the classes, bound to variables.

```html
<style>
.cases_item:not(:first-child) .cases_panel { visibility: hidden; }
html.wf-design-mode .cases_item:not(:first-child) { display: none; }
.cases_bg { will-change: transform, clip-path; }
.cases_bg img { width: 100%; height: 100%; object-fit: cover; }
.cases_title { font-size: calc(var(--_typography---h2--font-size) * .92); }
.cases_line { padding-bottom: .12em; margin-bottom: -.12em; }
.cases_text { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: clip; }
.cases_stat_value { font-variant-numeric: tabular-nums; }
.cases_tab:hover .cases_tab_label, .cases_tab.is-active .cases_tab_label { opacity: 1; }
.cases_tab:focus-visible { outline: 2px solid var(--_color---secondary--peach); outline-offset: 2px; }
.cases_tablist { scrollbar-width: none; }
.cases_tablist::-webkit-scrollbar { display: none; }

/* Designer only: tabs are built by the script, so preview the template tab in place */
html.wf-design-mode .cases_template { display: flex; position: absolute; left: 0; right: 0; bottom: var(--_components---section--padding); width: 100%; max-width: var(--_components---container--max-width); margin-inline: auto; padding-inline: var(--_components---container--gutter); }
html.wf-design-mode .cases_template .cases_tab { flex: 0 1 25%; }
html.wf-design-mode .cases_template .cases_tab_label { opacity: 1; }
html.wf-design-mode .cases_template .cases_tab_fill { transform: scaleX(.5); }
</style>
```

## Behaviour
- Underline fill = the autoplay timer (default 7s, `data-cases-duration`). Pauses on tab hover, keyboard focus, off-screen, hidden tab.
- Click / arrow keys / Home / End switch cases; swipe on touch.
- Reduced motion: crossfade, no autoplay.
- Tablet + mobile (≤991): stats under the copy; the tab row scrolls sideways with names kept (min 8rem a tab, faded edges), and the script centres the active tab (GSAP scrollLeft tween, row only). Swiping the row scrolls it; swiping the panel changes case.
