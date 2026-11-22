# Experience Ledger + Technical Arsenal Folded Stack

**Date:** 2026-11-22
**Status:** Approved (in chat)
**Branch / PR:** `feat/ledger-and-arsenal`, one PR

## Intent

The home page's Experience section is cluttered (three current-role cards, a popup, and a
separate previous-roles accordion), and Technical Arsenal is a grid of dense cards. Replace both
with calmer, scannable list styles chosen from mockups
(`.superpowers/brainstorm/61303-1795332556/content/experience-styles.html`, styles 1 and 3).

## Experience → index ledger (`components/experience-timeline.tsx`)

- One row per role (all 5, in data order): company, role and dates, a duration bar on a shared
  year ruler, and a **Now** tag for current roles.
- **Ruler:** from the earliest start year to next year. Each bar's start and end come from the
  existing `period` strings (e.g. "August 2025 - Present", "February - May 2025", "2023 - Present")
  via a tested helper. `profile-data.json` is unchanged.
- **Bars:** orange with a glowing end for current roles, foreground colour for past roles. They draw
  in once when the section enters view (`useInViewOnce`). Reduced motion and pre-hydration show them
  fully drawn.
- **Hover/focus:** the role's description slides open under the title. On touch devices
  (`hover: none`) the description is always shown.
- **Click/Enter:** the row unfolds into an inverted black/cream panel with highlights and tech.
  One row is open at a time. Rows are buttons with `aria-expanded`/`aria-controls`.
- **Header:** "3 current · 5 total", derived from the data.
- **Removed:** the card grid, the details popup (and its CSS), the previous-roles accordion (and its
  CSS), the NOW/2025 ghost labels from #19 with `lib/experience-years.ts`, and the `.timeline-track`
  rail.

## Technical Arsenal → folded stack (`components/technical-arsenal.tsx`)

- The four categories become strips: index, title, tool count and a + that rotates when open.
- Clicking a strip unfolds it, inverted, to show its subtitle and tool chips. One is open at a time,
  and the first starts open. Strips are buttons with `aria-expanded`.
- The "View Full Stack & Skills" link stays. The category data stays as it is.

## Shared

- A single `.fold` unfold primitive (`grid-template-rows: 0fr → 1fr`) is used by both. It is
  instant under reduced motion.
- No new dependencies, and no per-frame JS.

## Approaches

Mockup styles 2 (pinned split) and 3 (folded stack, as a standalone Experience design) were
considered. Style 1 was chosen for Experience because it scans fastest and shows overlapping roles.
Style 3 is reused for the ledger's unfolded state and for Technical Arsenal. The pinned split was
declined.
