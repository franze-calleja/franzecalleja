# Ledger + Arsenal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the home Experience section with an index ledger, and Technical Arsenal with a folded stack.

**Architecture:**
- A pure tested helper turns `period` strings into year positions.
- Both sections are client components with one-open-at-a-time state.
- A shared CSS `.fold` grid-rows unfold.
- The bar draw-in uses the existing `useInViewOnce` (from #18).

**Tech Stack:** Next.js 16.1.7, React 19.2.3, Tailwind 4, Vitest (node env, relative imports in tests).

**Spec:** `docs/superpowers/specs/2026-11-22-ledger-and-arsenal-design.md`

## Global Constraints

- No new dependencies. Don't change `profile-data.json`.
- **Motion:** animate only transform/opacity/grid-template-rows. Reduced motion means instant unfolds and fully drawn bars.
- **Accessibility:** row/strip toggles are `<button aria-expanded aria-controls>`, and the panels have matching ids.
- **Verification:** use the scratch production build (`scratchpad/prodbuild.sh`, port 3124). Never `next build` in the checkout.
- **Commits:** Conventional Commits, no AI attribution.

## Review Focus

1. **Keyboard-only users:** Tab reaches every row and strip, Enter/Space toggles it, and the focused row's description is visible (focus counts like hover).
2. **Touch devices (no hover):** descriptions are visible without hovering, and tapping unfolds.
3. **Reduced motion:** bars are fully drawn and unfolds are instant.
4. **Unparseable or missing period text:** the row still renders, just without a bar (no NaN widths).
5. **The ledger on phones (375px):** no horizontal overflow, and bars and text stay readable.

### Task 1: Period parsing

**Files:** Create `lib/role-period.ts`, `lib/role-period.test.ts`.

**Interfaces:** It produces two functions:
- `parseRolePeriod(period: string, now: Date): { start: number; end: number; ongoing: boolean } | null`. Years are fractional (Jan = +0/12), and the end is end-of-month (+1/12).
- `rulerYears(spans: Array<{ start: number; end: number }>): number[]`. It returns whole years from `floor(min start)` to `floor(max end) + 1`, inclusive.

- [ ] **Step 1: Write the failing tests.**
  - `parseRolePeriod("August 2025 - Present", new Date(2026, 10, 22))` → `{ start: 2025 + 7/12, end: 2026 + 11/12, ongoing: true }`
  - `"February - May 2025"` → `{ start: 2025 + 1/12, end: 2025 + 5/12, ongoing: false }` (the start borrows the end's year)
  - `"2023 - Present"` → `start: 2023`
  - `"August 2025 - January 2026"` → `{ start: 2025 + 7/12, end: 2026 + 1/12, ongoing: false }`
  - `"Present"` → `null`
  - `rulerYears([{start:2023,end:2026.9},{start:2025.1,end:2025.4}])` → `[2023, 2024, 2025, 2026, 2027]`
- [ ] **Step 2: Run them to verify they fail.** Run `npx vitest run lib/role-period.test.ts`. Expected: FAIL, the module is missing.
- [ ] **Step 3: Implement.** Split on a hyphen or en dash. Map month names (full and 3-letter) to 0–11. A part without a year borrows the other side's year. "Present" means the end is `now`'s month.
- [ ] **Step 4: Run them to verify they pass.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat: parse role periods into timeline spans`.

### Task 2: Experience ledger

**Files:**
- Rewrite `components/experience-timeline.tsx`.
- Modify `app/globals.css`:
  - add `.fold` and the ledger styles;
  - remove `.timeline-accordion*`, the `modal-*` keyframes and classes, `.experience-ghost` and its keyframes, and `.timeline-track::before`.
- Delete `lib/experience-years.ts` and `lib/experience-years.test.ts`.

- [ ] **Step 1: Rewrite the component.**
  - The header shows `{current} current · {total} total`.
  - Add a ruler row of year ticks positioned at `(y - min) / (max - min)`.
  - Each role is an `<article>` row containing:
    - a `<button aria-expanded aria-controls={panelId}>` with company, title, dates, a description `.fold` (opens on hover, focus-within, or `hover:none`), a bar track, and a Now tag plus a + icon;
    - an unfold panel (`.fold`, `id={panelId}`, inverted bg/fg) with highlights and tech chips.
  - Bars are positioned by `left`/`width` %, use `transform-origin: left`, and draw in with `scaleX` once `data-in` is set on the ledger. They're only hidden at `scaleX(0)` while `[data-armed]:not([data-in])`, so server HTML shows them drawn.
  - When `parseRolePeriod` returns null, render no bar.
- [ ] **Step 2: Add the CSS.**
  - `.fold { display:grid; grid-template-rows:0fr; transition: grid-template-rows .45s cubic-bezier(.16,1,.3,1) } .fold > * { overflow:hidden; min-height:0 } .fold[data-open], …:hover…, …:focus-within… { grid-template-rows:1fr }`.
  - Reduced motion: `transition: none`.
  - Bars: `transition: transform 1s` with delay `calc(var(--r) * 120ms)`.
  - Current-bar end dot: an orange glow (box-shadow ring).
- [ ] **Step 3: Remove the dead CSS and lib files.** Run `npm test && npm run lint && npx tsc --noEmit -p .`. Expected: pass.
- [ ] **Step 4: Verify.** In the scratch production build, at 1440×900 and 375×812 in both themes:
  - 5 rows, the ruler spans 2023–2027, and the current bars are orange;
  - hovering row 1 shows its description; clicking opens the panel and clicking row 2 closes row 1;
  - Tab plus Enter works;
  - reduced motion shows the bars drawn;
  - `scrollWidth === clientWidth`; the console is clean.
- [ ] **Step 5: Commit** with `feat: redesign the experience section as an index ledger`.

### Task 3: Technical Arsenal folded stack

**Files:** Rewrite `components/technical-arsenal.tsx` (add `"use client"`). Modify `app/globals.css` for the strip styles.

- [ ] **Step 1: Build the strips.**
  - Each category is a strip `<button aria-expanded aria-controls>` showing `index`, the icon, the title, `{n} tools` and a + that rotates 45° when open.
  - Its panel is a `.fold` (inverted bg/fg) with the subtitle and the existing tool chips.
  - Open state is a single index, defaulting to 0; clicking the open strip closes it.
  - Closed strips shrink their title size (as in the mockup) only while another strip is open.
- [ ] **Step 2: Verify.** Run `npm test && npm run lint`, then check the scratch build at 1440 and 375 in both themes: the first strip is open on load, clicking another switches, keyboard toggles work, there's no overflow, and the console is clean.
- [ ] **Step 3: Commit** with `feat: turn the technical arsenal into a folded stack`.

### Task 4: PR

- [ ] Push `feat/ledger-and-arsenal` and open the PR. It may conflict with #20 in `globals.css` (`.gallery__ghost` sits next to the removed `.experience-ghost`); rebase after whichever merges first.
