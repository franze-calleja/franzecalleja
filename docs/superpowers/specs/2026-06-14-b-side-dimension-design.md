# The B-Side — Hidden Neo-Brutalist Dimension

**Date:** 2026-06-14
**Status:** Design approved, pending spec review
**Author:** Franze William Calleja (with Claude)

## Summary

"The B-Side" is a hidden, easter-egg alternate version of the portfolio: the same
content as the main site, reimagined in a Classic Neo-Brutalist visual language with
playful GSAP motion. It is reached through secret triggers (Konami code + a hidden
hotspot) and entered via a glitch/CRT "warp" transition, evoking a parallel
dimension. The data is identical to the main site; only the presentation changes.

It is the first of a planned set of "dimensions." A future editorial-maximalist
dimension is explicitly reserved and out of scope here.

## Goals

- A fully-styled brutalist mirror of the portfolio that reuses `app/profile-data.json`
  with zero content duplication.
- Discoverable-but-hidden entry: Konami code, a hidden avatar hotspot, and a touch
  d-pad so non-keyboard users can also enter the code.
- A memorable glitch/CRT warp transition in and out of the dimension.
- Playful, lively GSAP motion that fully respects `prefers-reduced-motion`.
- Keep the main site's bundle lean — brutalist CSS/fonts/GSAP load only under `/b-side`.

## Non-Goals

- Editorial/maximalist styling (reserved for a separate future dimension).
- Changing any existing main-site content, layout, or behavior (beyond mounting the
  trigger component in the root layout).
- A CMS or any new data source — `profile-data.json` remains the single source of truth.

## Decisions (locked during brainstorming)

| Topic | Decision |
| --- | --- |
| Name | **The B-Side** |
| Trigger | Konami code (`↑↑↓↓←→←→ B A`) + hidden hotspot (5 quick avatar clicks) + on-screen touch d-pad |
| Content scope | Full mirror of all sections; same data, new skin |
| Sub-pages | Full parallel — brutalist `/b-side/projects` and `/b-side/stack` too |
| Visual style | Classic Neo-Brutalism on the existing cream/dark base + bright accents |
| Type | Space Grotesk (display) + Space Mono (system/labels) |
| Motion | Playful & lively GSAP, with full reduced-motion fallback |
| Warp | Glitch / CRT transition, reversible |
| Architecture | Approach A — dedicated `/b-side` route segment with its own nested layout |
| Future | Editorial maximalism reserved as a later dimension |

## Architecture (Approach A)

A self-contained route segment so the brutalist world is isolated from the main site.

```
app/
  b-side/
    layout.tsx          # nested layout: loads Space Grotesk + Space Mono via next/font,
                        #   imports b-side.css, sets noindex metadata, renders the
                        #   GSAP provider/wrapper. Carries over theme (data-theme).
    page.tsx            # the single-page brutalist mirror (all sections inline)
    b-side.css          # scoped brutalist styles + accent tokens (.bside scope)
    projects/page.tsx   # brutalist "All Projects" (mirrors /projects)
    stack/page.tsx      # brutalist "Tech Stack & Skills" (mirrors /stack)

components/
  dimension-portal.tsx  # CLIENT. Mounted in ROOT layout. Konami listener +
                        #   avatar-hotspot wiring + touch d-pad + warp overlay +
                        #   router.push('/b-side'). No-op visually until triggered.
  b-side/
    brutal-block.tsx    # shared brutalist container (the SectionCard analog)
    b-side-hero.tsx
    b-side-about.tsx
    b-side-experience.tsx
    b-side-stack.tsx
    b-side-skills.tsx
    b-side-projects.tsx
    b-side-education.tsx
    b-side-testimonials.tsx
    b-side-availability.tsx
    b-side-gallery.tsx
    b-side-footer.tsx
    use-gsap-reveal.ts  # hook: scroll-triggered reveal + reduced-motion guard

lib/
  (existing)            # profile-data.json read directly; add a small mapping helper
                        #   only if a section needs reshaped data (e.g. skill bars).
```

**Data flow:** Every B-Side component imports `app/profile-data.json` (same as the
existing components) and renders it with brutalist markup. No new data is introduced.

**Bundle isolation:** `gsap` and `b-side.css` are imported only within
`app/b-side/**`. The root layout gains only `dimension-portal.tsx`, which is light
(event listeners + a lazily-rendered warp overlay; GSAP for the overlay is imported
dynamically on first trigger so it is not in the main bundle).

## Trigger system

A single client component `components/dimension-portal.tsx`, mounted once in the root
layout (`app/layout.tsx`), owns all entry mechanics and the warp overlay.

1. **Konami code** — listens for `↑ ↑ ↓ ↓ ← → ← → B A`. A rolling buffer matches the
   sequence; correct entry calls `triggerWarp()`. Buffer resets on mismatch/timeout.
2. **Hidden hotspot** — the existing profile avatar button
   (`components/profile-header.tsx`) is clicked **5 times within ~1.5s** to trigger
   the warp. Implementation: `dimension-portal` exposes the counter via a small
   client context or a `window` custom event the avatar dispatches, so the existing
   flip behavior is preserved and the portal stays the single owner of `triggerWarp()`.
3. **Touch d-pad** — a low-key, fixed-position control (bottom corner) with ↑ ↓ ← →
   plus **B** and **A** buttons, letting touch users input the same sequence. It is
   visually unobtrusive (small, muted) and only present on the main site. Real
   `<button>`s with aria-labels.

All three converge on `triggerWarp()`.

## Glitch / CRT warp transition

- A full-screen overlay rendered by `dimension-portal`.
- On trigger: a GSAP timeline runs ~900ms — RGB split, scanline collapse, flicker,
  and a stamped "ENTERING THE B-SIDE" flash — then `router.push('/b-side')`.
- **Return trip:** an EXIT brutalist block on `/b-side` (and the `Esc` key) plays the
  reverse warp, then navigates back to `/`.
- GSAP for the overlay is dynamically imported on first use.
- Reduced-motion: the overlay collapses to a brief opaque fade (no glitch/flicker)
  before navigating.

## Visual system

- **Base palette:** existing CSS variables — light `--background` `#f3efdd` /
  foreground `#0E100F`; dark inverts them. Theme toggle reuses the existing
  `localStorage` `theme` + `data-theme` mechanism (no new toggle logic).
- **Accents:** pink `#ff5da2`, cyan `#00e0c6`, yellow `#ffe600`, violet `#7c5cff`,
  used as block fills. Contrast verified against text in both themes.
- **Brutalist tokens (in `b-side.css`, scoped under a `.bside` root class):**
  - Borders: `3px solid` in the foreground color (`4px` for page frame).
  - Shadows: hard offset `6px 6px 0` foreground (no blur), smaller for inner blocks.
  - No border-radius. Slight rotations (`-3deg…3deg`) on tags/badges.
  - Mono index labels: `01 / ABOUT`, `02 / EXPERIENCE`, etc.
- **Type:** Space Grotesk 700 for headings (hero uses very large size + tight
  negative letter-spacing to read as a display face — no third font); Space Mono for
  labels, numbers, and "system" text. Loaded via `next/font/google` in the nested
  layout.

## Section mapping (B-Side home, single page)

All sections from `app/page.tsx`, in order, as brutalist blocks:

1. **Hero** — name (huge), role badge, location + availability chip, social/email
   tags. "DIMENSION: B-SIDE" stamp. Theme toggle.
2. **About** (`01`) — eyebrow + title + body from `about`.
3. **Experience** (`02`) — the `experience.steps` as a mono timeline list.
4. **Tech Stack** (`03`) — `techstack.items` as accent tags with levels; "view all" →
   `/b-side/stack`.
5. **Skills** (`04`) — `skills.overall` as mono ASCII-style bars; "view all" →
   `/b-side/stack`.
6. **Projects** (`05`) — `projects.items` (all 9) as brutalist cards; "view all" →
   `/b-side/projects`.
7. **Education** (`06`) — `education.items`.
8. **Testimonials** (`07`) — `testimonials.items`.
9. **Availability** (`08`) — status chip + description from `availability`.
10. **Gallery** (`09`) — `gallery.items` as a bordered/shadowed grid.
11. **Footer** — tagline, quick links, socials, plus an **EXIT** block (return warp)
    and a hint that `Esc` returns to the main universe.

## Sub-pages (full parallel)

- **`/b-side/projects`** — brutalist "All Projects": every `projects.items` entry as a
  brutalist card (mirrors `/projects`). Back link returns to `/b-side`.
- **`/b-side/stack`** — brutalist "Tech Stack & Skills": `techstack.items` (sorted by
  level) + `skills.overall`, brutalist meters (mirrors `/stack`). Back link to `/b-side`.
- The B-Side home "view all" CTAs link to these (stay inside the dimension).

## Motion (GSAP, playful & lively)

- New dependency: `gsap` (includes ScrollTrigger).
- **Load:** blocks slam/bounce in with a stagger.
- **Scroll:** each block reveals on viewport enter (`use-gsap-reveal` + ScrollTrigger).
- **Hover:** cards skew/wobble slightly.
- **Numbers:** section index numbers / skill levels count up.
- **Bars:** skill/stack meters fill on scroll into view.
- **Reduced motion:** when `prefers-reduced-motion: reduce`, all GSAP animations are
  skipped and content renders in its final static state (mirrors the main site's
  existing `motion-reduce` handling). The reveal hook checks the media query and
  no-ops.

## Accessibility & SEO

- `/b-side` and its sub-routes export metadata with `robots: { index: false, follow:
  false }` so the dimension stays hidden from search.
- Touch d-pad buttons are real `<button>`s with `aria-label`s.
- Keyboard exit via `Esc`; EXIT block is a focusable link/button.
- `prefers-reduced-motion` fully honored across warp + all section motion.
- Accent-on-text contrast checked for both themes (WCAG AA target for body text).
- The trigger listeners must not interfere with normal typing in the chat assistant
  input (ignore key events originating from form fields).

## Dependencies

- Add `gsap`. No other new dependencies. `lucide-react`, `next/font`, Tailwind v4 all
  already present and reused.

## Testing / verification (manual)

- Konami code triggers the warp (desktop keyboard).
- 5-quick-clicks on the avatar triggers the warp; normal single clicks still flip/no-op.
- Touch d-pad enters the sequence and triggers the warp on mobile/touch.
- Warp plays in and the reverse warp/`Esc`/EXIT returns to `/`.
- `/b-side`, `/b-side/projects`, `/b-side/stack` all render every section/item from
  `profile-data.json` with no missing data.
- Light and dark themes both look correct; theme toggle persists across the warp.
- `prefers-reduced-motion` disables glitch + section motion; content fully visible.
- Mobile layout (single column) is usable.
- The main site is visually unchanged and its bundle does not include GSAP.
- `/b-side*` routes are `noindex`.

## Risks & mitigations

- **Konami listener capturing keystrokes meant for inputs** → ignore events whose
  target is an editable field; reset buffer on blur.
- **GSAP leaking into main bundle** → import GSAP only inside `app/b-side/**` and
  dynamically for the warp overlay.
- **Style bleed between brutalist and main CSS** → scope all brutalist styles under a
  `.bside` root class in `b-side.css`; do not modify `app/globals.css` tokens.
- **Hotspot conflicting with the existing avatar flip** → portal owns the counter;
  avatar only reports clicks, preserving its current flip behavior.

## Future work (out of scope)

- A second "dimension" in editorial-maximalist style as a sibling route
  (e.g. `/c-side`), reusing the same trigger/warp infrastructure.
