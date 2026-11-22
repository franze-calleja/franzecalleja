# Motion Sections: Stats Count-Up, Experience Ghost Labels, Projects Gallery

**Date:** 2026-11-22
**Status:** Approved
**Branches / PRs:** one per item, built in this order:
`feat/stats-count-up` → `feat/experience-ghost-labels` → `feat/projects-gallery`

## Context

The site (Next.js 16.1.7, React 19.2.3, Tailwind 4) does all motion in CSS. Scroll-driven
animations live in `app/globals.css` inside
`@media (prefers-reduced-motion: no-preference) { @supports (animation-timeline: view()) { … } }`.
That block holds the hero depth layers, `.reveal`, the timeline fill and the scroll progress bar.
Page changes use React `ViewTransition`. There is no animation library. The burnt orange accent
(`--accent`, Tailwind `accent`) shipped in PR #16.

Mockups reviewed with Franze: `.superpowers/brainstorm/61303-1795332556/content/redesign-mockups.html`.
Items 01, 02 and 04 were chosen. Item 03 (the featured-card morph) was dropped.

## Intent

Add tasteful depth and motion to three places that are currently static, in keeping with the
existing black/cream editorial style, so the site feels crafted without becoming heavy.

## Goals

1. **`/stats`:** the primary metric numbers count up from 0 as their tiles scroll into view, the
   tiles rise in one after another, and the GitHub contribution squares ripple in week by week.
2. **Home, Experience section:** a large outlined ghost label drifts behind each group. **NOW**
   goes behind Current Roles and **2025** behind Previous Roles.
3. **`/projects`:** the card grid becomes a gallery. Scrolling down slides the projects sideways,
   with layered parallax (ghost number, screenshot, text). On phones it is a swipe-able row.

## Non-goals

- The featured-card morph (mockup 03).
- Changing content in `app/profile-data.json`, or the home page's Featured Projects stack.
- Restructuring the experience section into a single chronological list.

## Anti-goals

- Jank: animate only `transform` / `translate` / `scale` / `opacity` (and the `@property`
  counter). No per-frame JavaScript. A one-shot IntersectionObserver that sets a class is allowed
  (see Stats).
- Hidden content: every number, project and link must be readable and reachable with reduced
  motion, without scroll-timeline support, and by keyboard and screen readers.
- Accent sprawl: orange is not added anywhere beyond what this doc lists.

## Approach (decided)

Pure CSS scroll-driven animation in the existing gated block for the ghost labels and the
gallery. A JS scroll handler and an animation library were rejected as unnecessary weight now
that scroll-driven animations are Baseline (Firefox 159+).

The stats count-up is the exception. It is a **one-shot, time-based** animation triggered when the
tiles enter view, matching the approved mockup (see Stats).

## Global rules

- All new scroll-linked motion goes inside the existing reduced-motion +
  `@supports (animation-timeline: view())` gate. The stats one-shot animations are gated on
  reduced motion only, since they don't need scroll timelines. Outside it, every item renders as a correct static layout: final numbers, no ghost drift,
  and a normal projects list or grid.
- New motion respects the existing `--depth` variable (it halves parallax below lg).

## 1. Stats count-up (`/stats`, `app/stats/page.tsx`)

- **Numbers:** for each primary metric, parse the leading integer and any prefix/suffix from the
  existing string `value`: `"11"`, `"28+"`, `"05"`, `"100%"`, `"01"`, and the test count. Animate a
  registered `@property --num { syntax: "<integer>"; inherits: false; initial-value: 0 }` from 0 to
  the target. Display it with `counter-reset: num var(--num)` and `content: counter(num)`. Use the
  `decimal-leading-zero` style where the original value has a leading zero (`05`, `01`), so the
  final text matches today's exactly.
- **Trigger (builder-check decision):** play **once, over time**, not scroll-linked. A
  scroll-linked count would leave tiles that are already visible on load at a half-counted value
  (the metric grid sits right under the page header), and would count backwards when scrolling up.
  The approved mockup played once. A small client component uses one IntersectionObserver
  (threshold about 0.3) to set `data-in` on the metrics grid the first time it is in view, then
  disconnects. CSS animates `--num` via a keyframe `animation` (about 1.2s, ease-out) that starts
  only under `[data-in]`.
- **Tiles:** rise in (opacity plus a small translateY) with a real `animation-delay` stagger
  (about 90ms × index). The count for each tile starts with its tile.
- **No-JS / pre-hydration:** without `data-in`, the tiles must show their final values. Only add the
  "hidden, waiting to animate" state once the observer has mounted (e.g. `data-armed` set on
  mount), so server HTML and no-JS visitors never see zeros.
- **Accessibility:** the real value stays in the DOM as text for screen readers. The animated
  counter is a decorative `aria-hidden` element. In the static fallback, only the real value shows.
- **Calendar ripple** (`components/github-stats-calendar.tsx`, react-activity-calendar 3.2.1 SVG,
  where each week is a `<g>` of `<rect>`s): squares scale in from 0, staggered by week index, once
  (same one-shot pattern: armed on mount, played when the calendar is in view and has data). A small client effect sets `--w` (the week index) on each week `<g>`
  once the calendar has rendered its data, using a MutationObserver because the data loads
  asynchronously. The CSS then derives each week's stagger from `--w`.

## 2. Experience ghost labels (home, `components/experience-timeline.tsx`)

- Add an `aria-hidden` outlined label behind each group: **NOW** behind the Current Roles grid
  and **2025** behind the Previous Roles timeline. Styling matches `.hero-ghost-text`: transparent
  fill, a 1px stroke at about 14% of the foreground colour, and font-black.
- **Size:** large (about 14–20rem on lg, scaled down on phones). It sits behind the content
  (negative z-index inside an `isolate` wrapper) and never intercepts the pointer.
- **Parallax:** `animation-timeline: view()` on the group. The label translates slower than the
  content (`translate: 0 calc(var(--depth) * …)`) across `cover 0% cover 100%`.
- **Previous Roles rail fill:** the existing `.timeline-track::before` fill changes from
  `var(--foreground)` to `var(--accent)`, as in the mockup.
- **Label text:** derive it from data rather than hard-coding it. "NOW" is fixed. For Previous
  Roles, use the most recent start year among previous roles (currently 2025).

## 3. Projects gallery (`/projects`, `app/projects/page.tsx`, `components/projects-catalog.tsx`)

### Desktop (lg and up, motion allowed)

- The catalog becomes a tall "runway" section with a sticky 100svh stage. Inside the stage is a
  horizontal row (track) of panels, one per project in `content.projects.items` order (all 11),
  followed by an end panel linking back to the home page.
- **Track motion:** `animation-timeline: view()` on the runway with `animation-range: contain`.
  Keyframes go to `translate: calc(-100% + 100vw)`. The percentage is the track's own width, so no
  JS measurement is needed (account for page padding). Runway height is about `100svh` per panel,
  tunable via `--panels`.
- **Panel layout:** a screenshot frame (bordered, like the mockup) plus a copy column with
  index "NN / 11", project name (h2), description (2–3 lines), technology chips and an external
  link. The whole panel stays a single link to `project.href`, as the cards are today.
- **Parallax layers per panel:**
  - the ghost number (outlined, about 12rem) drifts fastest;
  - the screenshot slides slower inside its frame (image wider than the frame, scaled about 1.15);
  - the text stays steady.
  Each panel's layer animations use `animation-range` offsets derived from its index (`--i`) and
  the panel count (`--n`), so each layer reaches neutral as that panel crosses the centre.
- **Panels without a screenshot** (Investo, UTOL Web Dashboard, NQ Trend Trading): a text-only
  layout. A larger project name fills the frame area in an outlined/solid treatment. No empty box.

### Phones and tablets (below lg)

A native horizontal scroll row with `scroll-snap-type: x mandatory`. Each panel is about 85vw wide
with a peek of the next. Parallax uses `view-timeline-axis: inline` on each panel inside the
row's own scroll, still pure CSS.

### Fallback (reduced motion or no scroll timelines)

On desktop, a normal vertical list or grid of the same panels with no runway height and no
pinning. On phones, the snap row without parallax.

### Other changes

- **Remove `ProjectHoverPreview` from `/projects`.** The panels already show the screenshots large.
  The component stays for the home page's Featured Projects.
- **Keyboard:** tabbing to a panel off-screen must bring it into view. Because the track is
  translated rather than scrolled, focusing a link inside the runway snaps the gallery to its
  assembled static layout. Do this with
  `.gallery:has(:focus-visible)` setting `animation: none` on the track and layers (new to this
  repo), unless the builder finds a cleaner scroll-into-view approach.
- **Images:** use `next/image` with `sizes` for the frame width. Screenshots are 720px WebP;
  larger panels may look soft, so the builder may re-export at around 1200px if needed, keeping
  `lib/project-images.test.ts` within budget (raise it to about 400 KB only if required).

## Constraints

- No new dependencies. Next.js / React / Tailwind versions unchanged.
- Don't modify the bottom nav, page view transitions, or the home Featured Projects stack.
- Commit style: Conventional Commits. No AI attribution.

## Left to the builder

- Exact ranges, easings, sizes and runway length per panel.
- Whether the stats parsing lives in a small tested helper in `lib/` (recommended).
- The precise mechanism for the keyboard/off-screen focus case on the gallery, as long as every
  panel link is reachable and visible when focused.
