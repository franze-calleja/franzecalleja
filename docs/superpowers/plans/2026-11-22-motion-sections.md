# Motion Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three motion upgrades as three PRs: a `/stats` count-up with a calendar ripple, ghost labels on the home Experience section, and a horizontal projects gallery on `/projects`.

**Architecture:**
- **Ghost labels and gallery:** pure CSS scroll-driven animations in the existing gated block in `app/globals.css`.
- **Stats:** a one-shot, time-based CSS animation armed and triggered by a tiny IntersectionObserver hook.
- **Pure logic** (parsing stat values, deriving the latest start year) lives in tested `lib/` helpers.

**Tech Stack:** Next.js 16.1.7 (App Router, React Compiler), React 19.2.3, Tailwind 4, Vitest 4 (node env, `lib/**/*.test.ts`, relative imports only, since the `@/` alias isn't configured for Vitest).

**Spec:** `docs/superpowers/specs/2026-11-22-motion-sections-design.md`

## Global Constraints

- No new dependencies. Don't modify the bottom nav, page view transitions, or the home Featured Projects stack.
- Scroll-linked motion goes inside `@media (prefers-reduced-motion: no-preference) { @supports (animation-timeline: view()) { … } }` (`app/globals.css`, ~line 685). The stats one-shot animations are gated on `prefers-reduced-motion: no-preference` only.
- Animate only `transform`/`translate`/`scale`/`opacity` and the `@property --num` integer. No per-frame JS.
- The static fallback must show final values and full content (no zeros, no hidden panels).
- **Three branches, each from `origin/main`, one PR each:** `feat/stats-count-up` (already holds the spec, and this plan is committed there too), `feat/experience-ghost-labels`, `feat/projects-gallery`.
- Dev server: Franze runs `next dev` on :3000 from this checkout. **Never run `next build` into this checkout's `.next`.** For production checks, rsync to the scratchpad (excluding `node_modules`, `.next`, `.git`, `.superpowers`), symlink `node_modules`, and run `next build --webpack` plus `next start -p 3124` there.
- Commits: Conventional Commits, no AI attribution.

## Review Focus

1. **Stats tiles already visible on first paint:** they must animate once from 0 after hydration, never sit half-counted, and never show zeros before JS (server HTML shows final values). (Task 1 manual check, plus `parseStatValue` tests for exact final text.)
2. **Calendar data arriving after the section is already in view:** the ripple must still play once data renders, and never leave squares at scale 0. (Task 2 manual check.)
3. **Keyboard tabbing through `/projects` on desktop:** every panel link is reachable and visible when focused. (Task 5 manual check.)
4. **Projects without screenshots** (Investo, UTOL, NQ Trend): they render a text-only panel, with no broken image or empty frame. (Task 4 manual check, plus the existing `lib/project-images.test.ts`.)
5. **Reduced motion or no scroll timelines on `/projects`:** a normal list with no extra runway height and nothing translated off-screen. (Task 5 manual check.)

---

## PR 1: `feat/stats-count-up`

### Task 1: Stat value parsing and the count-up

**Files:**
- Create: `lib/stat-value.ts`, `lib/stat-value.test.ts`
- Create: `lib/use-in-view-once.ts` (client hook)
- Create: `components/stats-metrics.tsx` (`"use client"`; renders the primary metrics grid)
- Modify: `app/stats/page.tsx:145-180` (replace the inline grid with `<StatsMetrics stats={…} />`, passing plain data: label, value, detail, and the icon *name*, because components can't cross the server→client boundary)
- Modify: `app/globals.css` (count-up rules and keyframes)

**Interfaces:**
- Produces:
  - `parseStatValue(value: string): { prefix: string; number: number; suffix: string; pad: number } | null`. It returns `null` when there is no integer.
  - `useInViewOnce<T extends Element>(options?: { threshold?: number }): { ref: RefObject<T | null>; armed: boolean; inView: boolean }`. `armed` becomes true on mount. `inView` becomes true the first time the element intersects; the observer then disconnects. Task 2 reuses this hook.

- [ ] **Step 1: Write failing tests** in `lib/stat-value.test.ts`:
  - `parseStatValue("11")` → `{ prefix: "", number: 11, suffix: "", pad: 0 }`
  - `parseStatValue("28+")` → `{ prefix: "", number: 28, suffix: "+", pad: 0 }`
  - `parseStatValue("05")` → `{ prefix: "", number: 5, suffix: "", pad: 2 }`
  - `parseStatValue("01")` → `pad: 2, number: 1`
  - `parseStatValue("100%")` → `{ number: 100, suffix: "%", pad: 0 }`
  - `parseStatValue("0 Incidents")` → `{ number: 0, suffix: " Incidents", pad: 0 }`
  - `parseStatValue("LeBron James #1")` → `null` (no leading integer)
  - Round trip: for each of `["11","28+","05","01","100%","62"]`, `prefix + String(number).padStart(pad, "0") + suffix === input`

- [ ] **Step 2: Run them to verify they fail.** Run `npx vitest run lib/stat-value.test.ts`. Expected: FAIL, the module is not found.

- [ ] **Step 3: Implement `parseStatValue`.** Match `/^(\D*?)(\d+)(.*)$/`. `pad` = the digit string's length when it starts with `0` and is longer than 1, otherwise 0.

- [ ] **Step 4: Run them to verify they pass.** Run `npx vitest run lib/stat-value.test.ts`. Expected: PASS.

- [ ] **Step 5: Implement `useInViewOnce` and `components/stats-metrics.tsx`.**
  - Keep the existing tile markup and classes.
  - Render the value as `<p className="stat-value …">`. Inside it, put the real text in `<span className="stat-value__text">` and an `aria-hidden` `<span className="stat-value__count">`.
  - On the count span, set the CSS variables `--to` (number), `--suffix` (as a CSS string, e.g. `'"+"'`), `--prefix` and `--i` (tile index).
  - Set `data-armed` and `data-in` on the grid from the hook. When `parseStatValue` returns `null`, render the plain value only.

- [ ] **Step 6: Add CSS** inside a `@media (prefers-reduced-motion: no-preference)` block (outside the `@supports` gate):
  - Register `@property --num { syntax: "<integer>"; inherits: false; initial-value: 0; }`.
  - When `[data-armed]` is set:
    - `.stat-value__text` becomes visually hidden (clip pattern; it stays readable by screen readers).
    - `.stat-value__count::after` shows `content: var(--prefix) counter(num, var(--style)) var(--suffix)` with `counter-reset: num var(--num)`. `--style` is `decimal-leading-zero` when pad is 2, otherwise `decimal`.
    - Tiles start at `opacity: 0; translate: 0 1rem`.
  - When `[data-in]` is set:
    - The tiles run `stat-rise` (0.6s, `cubic-bezier(.16,1,.3,1)`, `both`, delay `calc(var(--i) * 90ms)`).
    - The counts run `stat-count` (`from { --num: 0 } to { --num: var(--to) }`, 1.2s, `cubic-bezier(.16,1,.3,1)`, `both`, same delay).
  - Without `[data-armed]`, the count span is `display: none`.

- [ ] **Step 7: Verify.** Run `npm test && npm run lint && npx tsc --noEmit -p .`. Expected: all pass. Then open `localhost:3000/stats` in headless Chrome (CDP script in the scratchpad) at 1440×900:
  - All six tiles animate once to exactly `11`, `28+`, `05`, `01`, `<test count>`, `100%`.
  - With reduced motion emulated, the final values show with no animation.
  - The server HTML (`curl`) contains the final values.

- [ ] **Step 8: Commit.**
  ```bash
  git add lib/stat-value.ts lib/stat-value.test.ts lib/use-in-view-once.ts components/stats-metrics.tsx app/stats/page.tsx app/globals.css
  git commit -m "feat: count the /stats metrics up when they come into view"
  ```

### Task 2: GitHub calendar ripple

**Files:**
- Modify: `components/github-stats-calendar.tsx` (hook, plus a MutationObserver that indexes the weeks)
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `useInViewOnce` (Task 1).

- [ ] **Step 1: Wire the hook.** Attach `useInViewOnce` to the `.github-calendar-wrapper` div, and set `data-armed` / `data-in` from it. Add a MutationObserver on the wrapper. Whenever the calendar's `svg` contains week `<g>` elements that hold `<rect>`s, set `style.setProperty("--w", index)` on each week `<g>`, and set `data-ready` on the wrapper once at least one is indexed.

- [ ] **Step 2: Add CSS** (reduced-motion gate only):
  - Under `.github-calendar-wrapper[data-armed][data-ready] svg g > rect`: `transform-box: fill-box; transform-origin: center; scale: 0`.
  - With `[data-in]` also set: `animation: cell-pop 0.4s cubic-bezier(.34,1.56,.64,1) both`, delay `calc(var(--w, 0) * 18ms)`.
  - `@keyframes cell-pop { to { scale: 1 } }`.
  - Don't override the existing `rx`/`stroke` rules.

- [ ] **Step 3: Verify.**
  - Run `npm test && npm run lint`. Expected: pass.
  - In headless Chrome at 1440×900, scroll the calendar into view. Squares should pop in left to right, and every `rect` should have computed `scale` 1 after 2.5s.
  - Load the page already scrolled to the calendar (`#github-activity-heading`). The ripple should still play once the data renders.
  - With reduced motion, the squares should show immediately.

- [ ] **Step 4: Commit.**
  ```bash
  git add components/github-stats-calendar.tsx app/globals.css
  git commit -m "feat: ripple the GitHub contribution squares in on /stats"
  ```

- [ ] **Step 5: PR.** Push `feat/stats-count-up` and open a PR (includes the spec and plan commits).

---

## PR 2: `feat/experience-ghost-labels` (from `origin/main`)

### Task 3: Ghost labels and the accent rail

**Files:**
- Create: `lib/experience-years.ts`, `lib/experience-years.test.ts`
- Modify: `components/experience-timeline.tsx` (Current Roles section ~line 86, Previous Roles ~line 163)
- Modify: `app/globals.css` (`.timeline-track::before` background ~line 743, plus the new ghost rules)

**Interfaces:**
- Produces: `latestStartYear(periods: string[]): number | null`. It reads the first 4-digit year in each period and returns the maximum.

- [ ] **Step 1: Write failing tests** in `lib/experience-years.test.ts`:
  - `latestStartYear(["August 2025 - January 2026", "February - May 2025"])` → `2025`
  - `latestStartYear(["2023 - Present", "January 2026 - Present"])` → `2026`
  - `latestStartYear(["Present"])` → `null`
  - `latestStartYear([])` → `null`

- [ ] **Step 2: Run them to verify they fail.** Run `npx vitest run lib/experience-years.test.ts`. Expected: FAIL, the module is not found.

- [ ] **Step 3: Implement** using `/\b(19|20)\d{2}\b/`.

- [ ] **Step 4: Run them to verify they pass.** Same command. Expected: PASS.

- [ ] **Step 5: Add the labels.**
  - Make each of the two group `<section>`s `relative isolate`.
  - In each, add `<span aria-hidden className="experience-ghost …">` positioned top-right with `-z-10`, `pointer-events-none`, `select-none`, font-black, `leading-none`, about `text-[9rem] lg:text-[16rem]`, and styled like `.hero-ghost-text`.
  - The text is `NOW` for current roles and `latestStartYear(previousRoles.map(r => r.period))` for previous roles; omit that label when the result is `null`.

- [ ] **Step 6: Add CSS.** Inside the scroll gate: `.experience-ghost { animation: experience-ghost linear both; animation-timeline: view(); animation-range: cover 0% cover 100%; }` with `@keyframes experience-ghost { from { translate: 0 calc(var(--depth) * 6rem) } to { translate: 0 calc(var(--depth) * -6rem) } }`. Change `.timeline-track::before` to `background: var(--accent)`.

- [ ] **Step 7: Verify.**
  - Run `npm test && npm run lint`. Expected: pass.
  - In headless Chrome at 1440×900 and 375×812, in both themes: the labels sit behind the cards, drift as you scroll, aren't clipped awkwardly and don't cause horizontal scroll (`scrollWidth === clientWidth`). The rail fills orange.

- [ ] **Step 8: Commit and PR.**
  ```bash
  git add lib/experience-years.ts lib/experience-years.test.ts components/experience-timeline.tsx app/globals.css
  git commit -m "feat: add drifting ghost labels to the experience section"
  ```
  Push `feat/experience-ghost-labels` and open a PR.

---

## PR 3: `feat/projects-gallery` (from `origin/main`)

### Task 4: Gallery panels with a static layout

**Files:**
- Rewrite: `components/projects-catalog.tsx` (now a server component; no hover preview, no state)
- Modify: `app/projects/page.tsx` (structure only, if needed for full-bleed)

**Interfaces:**
- Produces these DOM hooks for Tasks 5–6:
  - `.gallery` (the runway, `style={{ "--n": count }}`)
  - `.gallery__stage`, `.gallery__track`
  - `.gallery__panel` (`style={{ "--i": index }}`)
  - `.gallery__ghost`, `.gallery__frame`, `.gallery__shot` (wraps the `next/image`), `.gallery__copy`
  - `.gallery__panel--text` (no screenshot)
  - `.gallery__end`

- [ ] **Step 1: Build the panels.**
  - Each panel is one `<a href={project.href} target="_blank" rel="noopener noreferrer">`.
  - Inside: the ghost number `NN` (`aria-hidden`); a frame with `next/image` (`fill`, `sizes="(min-width:1024px) 40vw, 85vw"`, `className="object-cover object-top"`); and a copy column with eyebrow `NN / 11`, `h2` name, `line-clamp-3` description, chips and an `ArrowUpRight` icon.
  - Projects with an empty `image` get `.gallery__panel--text`, which shows the name large in the frame area.
  - Add an end panel linking to `/` ("Back to home").
  - Remove `ProjectHoverPreview` from this file.

- [ ] **Step 2: Static styles (Tailwind, ungated).**
  - lg+: panels stack vertically as a list (frame left 55%, copy right), each `min-h-[60vh]` with borders matching the site.
  - Below lg: `.gallery__track` is `flex overflow-x-auto snap-x snap-mandatory`, panels are `w-[85vw] shrink-0 snap-center` with the frame on top.

- [ ] **Step 3: Verify.**
  - Run `npm test && npm run lint && npx tsc --noEmit -p .`. Expected: pass.
  - In headless Chrome at 1440×900 and 375×812, with reduced motion emulated: all 11 panels plus the end panel render.
  - The 3 text panels have no `img`. No horizontal page scroll at 1440 (`document.documentElement.scrollWidth === clientWidth`).
  - On a phone, the row swipes and snaps.

- [ ] **Step 4: Commit.**
  ```bash
  git add components/projects-catalog.tsx app/projects/page.tsx
  git commit -m "feat: rebuild /projects as gallery panels with screenshots"
  ```

### Task 5: Desktop scroll-driven gallery

**Files:** Modify `app/globals.css` (inside the scroll gate, `@media (min-width: 1024px)`).

- [ ] **Step 1: Runway and track.**
  - `.gallery { height: calc(var(--n) * 70svh + 100svh); view-timeline-name: --gallery; view-timeline-axis: block; }`. The `--n` count includes the end panel.
  - `.gallery__stage { position: sticky; top: 0; height: 100svh; overflow: hidden; display: flex; align-items: center; }`.
  - `.gallery__track { display: flex; gap: 4vw; padding-inline: 8vw; width: max-content; animation: gallery-slide linear both; animation-timeline: --gallery; animation-range: contain 0% contain 100%; }` with `@keyframes gallery-slide { to { translate: calc(-100% + 100vw) 0 } }`.
  - Panels: `width: min(68vw, 980px); height: 70svh`, horizontal grid.

- [ ] **Step 2: Layers.** For each panel, the neutral point is `p = var(--i) / (var(--n) - 1)` along `--gallery`.
  - `.gallery__ghost` animates `translate: calc(var(--depth) * 14vw) 0` → `calc(var(--depth) * -14vw) 0`.
  - `.gallery__shot` animates `translate: -4% 0` → `4% 0` at `scale: 1.15`.
  - Both use `animation-range: contain calc((p - 0.5 / (var(--n) - 1)) * 100%) contain calc((p + 0.5 / (var(--n) - 1)) * 100%)`. Write it as nested `calc()` with `--i` and `--n`.

- [ ] **Step 3: Keyboard.** `.gallery:has(:focus-visible) :is(.gallery__track, .gallery__ghost, .gallery__shot) { animation: none; }`. Under the same `:has`, the stage becomes `position: static`, the gallery gets `height: auto`, and the track turns into a wrapped vertical list, so the focused link is laid out in place and the browser scrolls it into view.

- [ ] **Step 4: Verify.** In a production build (scratchpad copy, `next build --webpack`, port 3124), headless Chrome at 1440×900:
  - At scroll positions 0%, 50% and 100% of the runway, check that the track translate is 0 → about mid → end, so the last panel and end panel are fully visible at 100%.
  - The ghost numbers and screenshots move relative to their frames.
  - Tab 5 times from the page top: the focused panel is visible (`getBoundingClientRect` inside the viewport).
  - Reduced motion: a static list with no runway height.
  - 1280×700: panels fit.
  - Console clean.

- [ ] **Step 5: Commit.**
  ```bash
  git add app/globals.css
  git commit -m "feat: slide the /projects gallery sideways on scroll with layered parallax"
  ```

### Task 6: Phone parallax

**Files:** Modify `app/globals.css` (inside the scroll gate, `@media (max-width: 1023.98px)`).

- [ ] **Step 1: Inline parallax.** `.gallery__panel { view-timeline-name: --panel; view-timeline-axis: inline; }`. `.gallery__shot` animates `translate: -6% 0` → `6% 0` (`scale: 1.15`) on `--panel` across `cover`. `.gallery__ghost` animates the opposite way, further.

- [ ] **Step 2: Verify.** In headless Chrome at 375×812, scroll the row by one panel width. The shot translate of the panel being entered changes, there are no console errors, and the page has no vertical runway height.

- [ ] **Step 3: Commit and PR.**
  ```bash
  git add app/globals.css
  git commit -m "feat: add swipe parallax to the /projects gallery on phones"
  ```
  Push `feat/projects-gallery` and open a PR.
