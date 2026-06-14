# The B-Side — Hidden Brutalist Dimension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hidden, easter-egg "parallel dimension" version of the portfolio ("The B-Side") — the same `profile-data.json` content reimagined in Classic Neo-Brutalist style with playful GSAP motion, reached via a Konami code + hidden avatar hotspot + touch d-pad, entered through a glitch/CRT warp.

**Architecture:** Approach A — a self-contained `app/b-side/` route segment (home + `/projects` + `/stack` sub-routes) with its own nested layout that loads the brutalist fonts/CSS and GSAP. A single client component `components/dimension-portal.tsx`, mounted in the existing root layout, owns all entry triggers and the warp overlay, then `router.push('/b-side')`. Brutalist styles are scoped under a `.bside` class; the main site is untouched aside from mounting the portal.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `next/font/google` (Space Grotesk + Space Mono), GSAP (+ ScrollTrigger), Vitest (pure-logic tests only).

**Spec:** `docs/superpowers/specs/2026-06-14-b-side-dimension-design.md`

---

## File Structure

```
app/
  layout.tsx                     # MODIFY: mount <DimensionPortal/>
  b-side/
    layout.tsx                   # CREATE: fonts + noindex + .bside wrapper
    b-side.css                   # CREATE: scoped brutalist tokens + utilities
    page.tsx                     # CREATE: single-page brutalist mirror
    projects/page.tsx            # CREATE: brutalist "All Projects"
    stack/page.tsx               # CREATE: brutalist "Tech Stack & Skills"

components/
  dimension-portal.tsx           # CREATE: triggers + warp overlay + navigation
  profile-header.tsx             # MODIFY: report avatar clicks to the portal
  b-side/
    brutal-block.tsx             # CREATE: shared brutalist container
    use-gsap-reveal.ts           # CREATE: scroll-reveal hook (reduced-motion aware)
    b-side-hero.tsx              # CREATE
    b-side-about.tsx             # CREATE
    b-side-experience.tsx        # CREATE
    b-side-stack.tsx             # CREATE
    b-side-skills.tsx            # CREATE
    b-side-projects.tsx          # CREATE
    b-side-education.tsx         # CREATE
    b-side-testimonials.tsx      # CREATE
    b-side-availability.tsx      # CREATE
    b-side-gallery.tsx           # CREATE
    b-side-footer.tsx            # CREATE

lib/
  konami.ts                      # CREATE: pure sequence matcher
  konami.test.ts                 # CREATE: tests
  multi-click.ts                 # CREATE: pure click-window counter
  multi-click.test.ts            # CREATE: tests

vitest.config.ts                 # CREATE
package.json                     # MODIFY: add gsap, vitest, "test" script
```

---

## Task 1: Project setup (deps, test runner, gsap)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install runtime + dev dependencies**

Run:
```bash
npm install gsap
npm install -D vitest
```
Expected: both install with no errors; `gsap` appears under `dependencies`, `vitest` under `devDependencies`.

- [ ] **Step 2: Add a test script**

Modify `package.json` `scripts` to add:
```json
"test": "vitest run"
```
(Keep existing `dev`, `build`, `start`, `lint`.)

- [ ] **Step 3: Create the Vitest config (node env — pure logic only)**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Verify the runner starts (no tests yet is fine)**

Run: `npm test`
Expected: Vitest runs and reports "No test files found" or 0 tests — exits without crashing.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add gsap and vitest for the b-side dimension"
```

---

## Task 2: Konami sequence matcher (TDD)

A pure, framework-free matcher. Feed it keys one at a time; it returns `true` exactly when the full sequence has just completed. Case-insensitive (so `b`/`B` both match). A wrong key restarts progress (and re-counts the key if it equals the first symbol).

**Files:**
- Create: `lib/konami.ts`
- Test: `lib/konami.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/konami.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { KONAMI_SEQUENCE, createSequenceMatcher } from "./konami";

describe("createSequenceMatcher", () => {
  it("returns true only when the full sequence completes", () => {
    const m = createSequenceMatcher(KONAMI_SEQUENCE);
    const results = KONAMI_SEQUENCE.map((k) => m.push(k));
    // only the last push completes the sequence
    expect(results.slice(0, -1).every((r) => r === false)).toBe(true);
    expect(results[results.length - 1]).toBe(true);
  });

  it("is case-insensitive for letter keys", () => {
    const m = createSequenceMatcher(["a", "b"]);
    expect(m.push("A")).toBe(false);
    expect(m.push("B")).toBe(true);
  });

  it("restarts on a wrong key, re-counting a key that equals the first symbol", () => {
    const m = createSequenceMatcher(["ArrowUp", "ArrowDown"]);
    expect(m.push("ArrowUp")).toBe(false);   // progress 1
    expect(m.push("ArrowUp")).toBe(false);   // mismatch, but equals first -> progress stays 1
    expect(m.push("ArrowDown")).toBe(true);  // completes
  });

  it("fully resets on an unrelated key", () => {
    const m = createSequenceMatcher(["ArrowUp", "ArrowDown"]);
    expect(m.push("ArrowUp")).toBe(false);
    expect(m.push("x")).toBe(false);         // unrelated -> progress 0
    expect(m.push("ArrowDown")).toBe(false); // not the first symbol, no completion
  });

  it("exposes the canonical Konami sequence", () => {
    expect(KONAMI_SEQUENCE).toEqual([
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `lib/konami.ts` does not exist / exports undefined.

- [ ] **Step 3: Write minimal implementation**

Create `lib/konami.ts`:
```ts
export const KONAMI_SEQUENCE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
] as const;

export function createSequenceMatcher(sequence: readonly string[]) {
  let progress = 0;
  const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

  return {
    push(key: string): boolean {
      if (eq(key, sequence[progress])) {
        progress += 1;
        if (progress === sequence.length) {
          progress = 0;
          return true;
        }
        return false;
      }
      // mismatch: restart, but re-count if this key is the first symbol
      progress = eq(key, sequence[0]) ? 1 : 0;
      return false;
    },
    reset() {
      progress = 0;
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — all `konami` tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/konami.ts lib/konami.test.ts
git commit -m "feat: add konami sequence matcher"
```

---

## Task 3: Hotspot click-window counter (TDD)

A pure counter for the "5 quick clicks on the avatar" hotspot. Time is injected (caller passes `now` in ms) so tests are deterministic. Returns `true` when `threshold` clicks happen within `windowMs`; resets after firing or when the window lapses.

**Files:**
- Create: `lib/multi-click.ts`
- Test: `lib/multi-click.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/multi-click.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createMultiClickCounter } from "./multi-click";

describe("createMultiClickCounter", () => {
  it("fires on the Nth click within the window", () => {
    const c = createMultiClickCounter({ threshold: 5, windowMs: 1500 });
    expect(c.click(0)).toBe(false);
    expect(c.click(100)).toBe(false);
    expect(c.click(200)).toBe(false);
    expect(c.click(300)).toBe(false);
    expect(c.click(400)).toBe(true); // 5th within window
  });

  it("does not fire when clicks are too slow", () => {
    const c = createMultiClickCounter({ threshold: 3, windowMs: 500 });
    expect(c.click(0)).toBe(false);
    expect(c.click(600)).toBe(false);  // window lapsed -> restart at 1
    expect(c.click(700)).toBe(false);  // only 2 within window
  });

  it("restarts the window when it lapses, fresh count begins", () => {
    const c = createMultiClickCounter({ threshold: 2, windowMs: 300 });
    expect(c.click(0)).toBe(false);
    expect(c.click(1000)).toBe(false); // lapsed, count = 1
    expect(c.click(1100)).toBe(true);  // 2 within window
  });

  it("resets after firing so it can fire again", () => {
    const c = createMultiClickCounter({ threshold: 2, windowMs: 1000 });
    expect(c.click(0)).toBe(false);
    expect(c.click(100)).toBe(true);
    expect(c.click(200)).toBe(false); // count restarted
    expect(c.click(300)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `lib/multi-click.ts` not found.

- [ ] **Step 3: Write minimal implementation**

Create `lib/multi-click.ts`:
```ts
export function createMultiClickCounter(options: {
  threshold: number;
  windowMs: number;
}) {
  let count = 0;
  let firstTs = 0;

  return {
    click(now: number): boolean {
      if (count === 0 || now - firstTs > options.windowMs) {
        count = 1;
        firstTs = now;
      } else {
        count += 1;
      }
      if (count >= options.threshold) {
        count = 0;
        firstTs = 0;
        return true;
      }
      return false;
    },
    reset() {
      count = 0;
      firstTs = 0;
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — all `multi-click` tests green (konami tests still green too).

- [ ] **Step 5: Commit**

```bash
git add lib/multi-click.ts lib/multi-click.test.ts
git commit -m "feat: add hotspot multi-click counter"
```

---

## Task 4: Brutalist style foundation (scoped CSS)

All brutalist styles live under a `.bside` root class so they never affect the main site. Reuses the existing `--background`/`--foreground` CSS variables from `app/globals.css` (already global), and defines brutalist accent + token variables.

**Files:**
- Create: `app/b-side/b-side.css`

- [ ] **Step 1: Create the scoped stylesheet**

Create `app/b-side/b-side.css`:
```css
.bside {
  --bs-accent-pink: #ff5da2;
  --bs-accent-cyan: #00e0c6;
  --bs-accent-yellow: #ffe600;
  --bs-accent-violet: #7c5cff;
  --bs-border: 3px solid var(--foreground);
  --bs-shadow: 6px 6px 0 var(--foreground);
  --bs-shadow-sm: 4px 4px 0 var(--foreground);

  min-height: 100vh;
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-space-grotesk), system-ui, sans-serif;
}

.bside .bs-mono {
  font-family: var(--font-space-mono), ui-monospace, monospace;
}

.bside .bs-block {
  border: var(--bs-border);
  box-shadow: var(--bs-shadow);
  background: var(--background);
  padding: 1.25rem;
}

.bside .bs-tag {
  display: inline-block;
  border: 2px solid var(--foreground);
  box-shadow: var(--bs-shadow-sm);
  padding: 0.35rem 0.6rem;
  font-family: var(--font-space-mono), monospace;
  font-size: 0.72rem;
  font-weight: 700;
  background: var(--background);
}

.bside .bs-idx {
  display: inline-block;
  background: var(--foreground);
  color: var(--background);
  font-family: var(--font-space-mono), monospace;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 0.15rem 0.5rem;
}

.bside .bs-h {
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 0.95;
}

.bside .bs-hero-name {
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 0.88;
  font-size: clamp(2.75rem, 11vw, 6rem);
}

/* fill helpers */
.bside .bs-fill-pink { background: var(--bs-accent-pink); color: #0E100F; }
.bside .bs-fill-cyan { background: var(--bs-accent-cyan); color: #0E100F; }
.bside .bs-fill-yellow { background: var(--bs-accent-yellow); color: #0E100F; }
.bside .bs-fill-violet { background: var(--bs-accent-violet); color: #ffffff; }
.bside .bs-fill-ink { background: #0E100F; color: #f3efdd; }

/* reveal: hidden start state; the reveal hook animates to visible.
   When JS/GSAP is unavailable OR reduced motion is on, content must still show,
   so the hook sets data-revealed="true" immediately in those cases. */
.bside [data-reveal="true"] { opacity: 0; }
.bside [data-reveal="true"][data-revealed="true"] { opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .bside [data-reveal="true"] { opacity: 1; }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/b-side/b-side.css
git commit -m "feat: add scoped brutalist style foundation for the b-side"
```

---

## Task 5: B-Side nested layout (fonts, noindex, wrapper)

The nested layout loads Space Grotesk + Space Mono as CSS variables, imports the scoped CSS, sets `noindex`, and wraps children in `.bside`. The root layout still owns `<html>`/`data-theme`, so the theme carries over automatically.

**Files:**
- Create: `app/b-side/layout.tsx`

- [ ] **Step 1: Create the layout**

Create `app/b-side/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";

import "./b-side.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "The B-Side",
  robots: { index: false, follow: false },
};

export default function BSideLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`bside ${spaceGrotesk.variable} ${spaceMono.variable}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles with a temporary page**

Create a throwaway `app/b-side/page.tsx` with `export default function P(){return <main className="bs-block">B-SIDE OK</main>;}`, then run `npm run dev` and visit `http://localhost:3000/b-side`.
Expected: cream/dark page (matching current theme) shows "B-SIDE OK" in a bordered block with Space Grotesk. (This page is replaced in Task 8.)

- [ ] **Step 3: Commit**

```bash
git add app/b-side/layout.tsx app/b-side/page.tsx
git commit -m "feat: add b-side nested layout with brutalist fonts and noindex"
```

---

## Task 6: Shared `BrutalBlock` + GSAP reveal hook

`BrutalBlock` is the brutalist analog of `SectionCard`. `useGsapReveal` does the scroll-triggered "slam in" and is reduced-motion / SSR safe: it always makes content visible, animating only when motion is allowed.

**Files:**
- Create: `components/b-side/brutal-block.tsx`
- Create: `components/b-side/use-gsap-reveal.ts`

- [ ] **Step 1: Create the reveal hook**

Create `components/b-side/use-gsap-reveal.ts`:
```ts
"use client";

import { useEffect, useRef } from "react";

// Animates direct children of the container into view with a brutalist
// "slam" stagger. Always reveals content; only animates when motion is allowed.
export function useGsapReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => {
      el.querySelectorAll<HTMLElement>('[data-reveal="true"]').forEach((n) => {
        n.dataset.revealed = "true";
      });
    };

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      reveal();
      return;
    }

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { default: gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          const targets = el.querySelectorAll<HTMLElement>('[data-reveal="true"]');
          targets.forEach((n) => (n.dataset.revealed = "true"));
          gsap.from(targets, {
            opacity: 0,
            y: 24,
            duration: 0.5,
            ease: "back.out(1.6)",
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
        }, el);
      } catch {
        // GSAP failed to load: just show content
        reveal();
      }
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return ref;
}
```

- [ ] **Step 2: Create `BrutalBlock`**

Create `components/b-side/brutal-block.tsx`:
```tsx
import type { CSSProperties, ReactNode } from "react";

type BrutalBlockProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

// Brutalist container: thick border + hard offset shadow, no radius.
// Marked as a reveal target so the parent's useGsapReveal animates it in.
export default function BrutalBlock({
  children,
  className,
  style,
}: BrutalBlockProps) {
  return (
    <div data-reveal="true" className={`bs-block ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/b-side/brutal-block.tsx components/b-side/use-gsap-reveal.ts
git commit -m "feat: add BrutalBlock and gsap reveal hook"
```

---

## Task 7: B-Side hero + about + experience sections

All B-Side section components import `app/profile-data.json` directly (same pattern as existing components). Sections render brutalist markup using the Task 4 utility classes.

**Files:**
- Create: `components/b-side/b-side-hero.tsx`
- Create: `components/b-side/b-side-about.tsx`
- Create: `components/b-side/b-side-experience.tsx`

- [ ] **Step 1: Create the hero**

Create `components/b-side/b-side-hero.tsx`:
```tsx
import content from "@/app/profile-data.json";
import ThemeToggle from "@/components/theme-toggle";
import BrutalBlock from "./brutal-block";

export default function BSideHero() {
  return (
    <BrutalBlock className="bs-fill-yellow">
      <div className="flex items-start justify-between gap-3">
        <span className="bs-tag bs-fill-pink" style={{ transform: "rotate(-3deg)" }}>
          ⚡ DIMENSION: B-SIDE
        </span>
        <ThemeToggle />
      </div>

      <h1 className="bs-hero-name" style={{ marginTop: "1rem" }}>
        {content.profile.name.toUpperCase()}
      </h1>

      <span
        className="bs-tag bs-fill-cyan"
        style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}
      >
        {content.profile.role.toUpperCase()}
      </span>

      <div className="bs-mono" style={{ marginTop: "0.85rem", fontSize: "0.8rem" }}>
        ● {content.profile.location} &nbsp; ● {content.availability.status}
      </div>

      <div style={{ marginTop: "0.9rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {content.links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.label === "Send email" ? undefined : "_blank"}
            rel={link.label === "Send email" ? undefined : "noreferrer"}
            className={`bs-tag ${link.label === "Send email" ? "bs-fill-ink" : ""}`}
          >
            {link.label.toUpperCase()}
          </a>
        ))}
      </div>
    </BrutalBlock>
  );
}
```

- [ ] **Step 2: Create the about section**

Create `components/b-side/b-side-about.tsx`:
```tsx
import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideAbout() {
  return (
    <BrutalBlock>
      <span className="bs-idx">01 / ABOUT</span>
      <h2 className="bs-h" style={{ fontSize: "1.4rem", margin: "0.6rem 0 0.6rem" }}>
        {content.about.title}
      </h2>
      <div style={{ display: "grid", gap: "0.6rem" }}>
        {content.about.body.map((para, i) => (
          <p key={i} style={{ fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
            {para}
          </p>
        ))}
      </div>
    </BrutalBlock>
  );
}
```

- [ ] **Step 3: Create the experience section**

Create `components/b-side/b-side-experience.tsx`:
```tsx
import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideExperience() {
  return (
    <BrutalBlock className="bs-fill-violet">
      <span className="bs-idx" style={{ background: "#fff", color: "#0E100F" }}>
        02 / EXPERIENCE
      </span>
      <ul
        className="bs-mono"
        style={{ listStyle: "none", padding: 0, margin: "0.7rem 0 0", display: "grid", gap: "0.45rem", fontSize: "0.82rem" }}
      >
        {content.experience.steps.map((s) => (
          <li key={s.step}>
            {s.step} → <strong>{s.title}</strong> · {s.caption}
          </li>
        ))}
      </ul>
    </BrutalBlock>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/b-side/b-side-hero.tsx components/b-side/b-side-about.tsx components/b-side/b-side-experience.tsx
git commit -m "feat: add b-side hero, about, experience sections"
```

---

## Task 8: B-Side stack + skills + projects sections

**Files:**
- Create: `components/b-side/b-side-stack.tsx`
- Create: `components/b-side/b-side-skills.tsx`
- Create: `components/b-side/b-side-projects.tsx`

- [ ] **Step 1: Create the tech stack section**

Create `components/b-side/b-side-stack.tsx`:
```tsx
import Link from "next/link";
import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

const FILLS = ["bs-fill-yellow", "bs-fill-cyan", "bs-fill-pink", ""];

export default function BSideStack() {
  return (
    <BrutalBlock>
      <div className="flex items-center justify-between">
        <span className="bs-idx">03 / STACK</span>
        <Link href="/b-side/stack" className="bs-tag">VIEW ALL →</Link>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.7rem" }}>
        {content.techstack.items.map((t, i) => (
          <span key={t.label} className={`bs-tag ${FILLS[i % FILLS.length]}`}>
            {t.label} {t.level}
          </span>
        ))}
      </div>
    </BrutalBlock>
  );
}
```

- [ ] **Step 2: Create the skills section (ASCII-style mono bars)**

Create `components/b-side/b-side-skills.tsx`:
```tsx
import Link from "next/link";
import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

function bar(level: number) {
  const filled = Math.round(level / 12.5); // 0..8 blocks
  return "█".repeat(filled) + " ".repeat(8 - filled);
}

export default function BSideSkills() {
  return (
    <BrutalBlock className="bs-fill-ink">
      <div className="flex items-center justify-between">
        <span className="bs-idx" style={{ background: "#ffe600", color: "#0E100F" }}>
          04 / SKILLS
        </span>
        <Link href="/b-side/stack" className="bs-tag" style={{ color: "#0E100F" }}>
          VIEW ALL →
        </Link>
      </div>
      <div className="bs-mono" style={{ marginTop: "0.7rem", fontSize: "0.8rem", lineHeight: 2 }}>
        {content.skills.overall.map((s) => (
          <div key={s.label} style={{ whiteSpace: "pre" }}>
            {s.label.toUpperCase().padEnd(10, " ")} [{bar(s.level)}] {s.level}
          </div>
        ))}
      </div>
    </BrutalBlock>
  );
}
```

- [ ] **Step 3: Create the projects section (all items)**

Create `components/b-side/b-side-projects.tsx`:
```tsx
import Link from "next/link";
import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideProjects() {
  return (
    <BrutalBlock className="bs-fill-pink">
      <div className="flex items-center justify-between">
        <span className="bs-idx">05 / PROJECTS</span>
        <Link href="/b-side/projects" className="bs-tag">VIEW ALL →</Link>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.7rem", marginTop: "0.7rem" }}
      >
        {content.projects.items.map((p) => (
          <a
            key={p.name}
            href={p.href}
            target="_blank"
            rel="noreferrer"
            style={{ border: "2px solid #0E100F", background: "#f3efdd", color: "#0E100F", padding: "0.7rem", textDecoration: "none", display: "block" }}
          >
            <strong style={{ fontSize: "0.85rem" }}>{p.name}</strong>
            <p style={{ fontSize: "0.72rem", margin: "0.4rem 0", lineHeight: 1.4 }}>{p.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
              {p.technologies.map((t) => (
                <span key={t} className="bs-mono" style={{ fontSize: "0.62rem", border: "1px solid #0E100F", padding: "0.1rem 0.35rem" }}>
                  {t}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </BrutalBlock>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/b-side/b-side-stack.tsx components/b-side/b-side-skills.tsx components/b-side/b-side-projects.tsx
git commit -m "feat: add b-side stack, skills, projects sections"
```

---

## Task 9: B-Side education + testimonials + availability + gallery + footer

**Files:**
- Create: `components/b-side/b-side-education.tsx`
- Create: `components/b-side/b-side-testimonials.tsx`
- Create: `components/b-side/b-side-availability.tsx`
- Create: `components/b-side/b-side-gallery.tsx`
- Create: `components/b-side/b-side-footer.tsx`

- [ ] **Step 1: Education**

Create `components/b-side/b-side-education.tsx`:
```tsx
import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideEducation() {
  return (
    <BrutalBlock>
      <span className="bs-idx">06 / EDUCATION</span>
      {content.education.items.map((e) => (
        <div key={e.degree} style={{ marginTop: "0.6rem" }}>
          <strong style={{ fontSize: "0.95rem" }}>{e.degree}</strong>
          <p className="bs-mono" style={{ fontSize: "0.72rem", margin: "0.4rem 0", lineHeight: 1.5 }}>
            {e.institution} · {e.year}
            <br />
            {e.honors}
          </p>
          <p style={{ fontSize: "0.78rem", margin: 0 }}>{e.description}</p>
        </div>
      ))}
    </BrutalBlock>
  );
}
```

- [ ] **Step 2: Testimonials**

Create `components/b-side/b-side-testimonials.tsx`:
```tsx
import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideTestimonials() {
  return (
    <BrutalBlock className="bs-fill-cyan">
      <span className="bs-idx">07 / TESTIMONIALS</span>
      {content.testimonials.items.map((t) => (
        <figure key={t.name} style={{ margin: "0.6rem 0 0" }}>
          <blockquote style={{ fontSize: "0.9rem", fontStyle: "italic", margin: 0 }}>
            “{t.quote}”
          </blockquote>
          <figcaption className="bs-mono" style={{ fontSize: "0.72rem", marginTop: "0.5rem" }}>
            — {t.name}, {t.role}
          </figcaption>
        </figure>
      ))}
    </BrutalBlock>
  );
}
```

- [ ] **Step 3: Availability**

Create `components/b-side/b-side-availability.tsx`:
```tsx
import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideAvailability() {
  return (
    <BrutalBlock className="bs-fill-ink">
      <span className="bs-idx" style={{ background: "#00e0c6", color: "#0E100F" }}>
        08 / AVAILABILITY
      </span>
      <div style={{ marginTop: "0.6rem" }}>
        <span className="bs-tag bs-fill-cyan">● {content.availability.status.toUpperCase()}</span>
      </div>
      <p style={{ fontSize: "0.82rem", marginTop: "0.6rem" }}>
        {content.availability.description}
      </p>
      <a href={content.availability.contactHref} className="bs-tag bs-fill-yellow" style={{ marginTop: "0.6rem" }}>
        GET IN TOUCH →
      </a>
    </BrutalBlock>
  );
}
```

- [ ] **Step 4: Gallery**

Create `components/b-side/b-side-gallery.tsx`:
```tsx
import Image from "next/image";
import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideGallery() {
  return (
    <BrutalBlock>
      <span className="bs-idx">09 / GALLERY</span>
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.7rem", marginTop: "0.7rem" }}
      >
        {content.gallery.items.map((g) => (
          <div
            key={g.label}
            style={{ border: "3px solid var(--foreground)", boxShadow: "var(--bs-shadow-sm)", aspectRatio: "1", position: "relative", overflow: "hidden" }}
          >
            <Image src={g.image} alt={g.title} fill sizes="120px" style={{ objectFit: "cover" }} />
            <span
              className="bs-mono"
              style={{ position: "absolute", left: 4, top: 4, background: "#0E100F", color: "#f3efdd", fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}
            >
              {g.label}
            </span>
          </div>
        ))}
      </div>
    </BrutalBlock>
  );
}
```

- [ ] **Step 5: Footer (with EXIT control)**

The EXIT button dispatches a `b-side:exit` custom event that the portal listens for (wired in Task 11) to play the reverse warp.

Create `components/b-side/b-side-footer.tsx`:
```tsx
"use client";

import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideFooter() {
  return (
    <BrutalBlock className="bs-fill-ink">
      <h2 className="bs-h" style={{ fontSize: "1.8rem" }}>LET&apos;S BUILD →</h2>
      <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>{content.footer.tagline}</p>
      <div className="bs-mono" style={{ fontSize: "0.72rem", marginTop: "0.7rem", display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        {content.footer.quickLinks.map((l) => (
          <a key={l.label} href={l.href} style={{ color: "inherit" }}>{l.label}</a>
        ))}
      </div>
      <div style={{ marginTop: "0.9rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("b-side:exit"))}
          className="bs-tag bs-fill-pink"
        >
          ⏎ EXIT DIMENSION
        </button>
        <span className="bs-mono" style={{ fontSize: "0.66rem", opacity: 0.7 }}>
          or press ESC to return to the main universe
        </span>
      </div>
    </BrutalBlock>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add components/b-side/b-side-education.tsx components/b-side/b-side-testimonials.tsx components/b-side/b-side-availability.tsx components/b-side/b-side-gallery.tsx components/b-side/b-side-footer.tsx
git commit -m "feat: add b-side education, testimonials, availability, gallery, footer"
```

---

## Task 10: Assemble the B-Side home page

Replaces the throwaway page from Task 5. A client wrapper applies `useGsapReveal` to the whole column.

**Files:**
- Modify (replace): `app/b-side/page.tsx`

- [ ] **Step 1: Write the page**

Replace `app/b-side/page.tsx` with:
```tsx
"use client";

import { useGsapReveal } from "@/components/b-side/use-gsap-reveal";
import BSideHero from "@/components/b-side/b-side-hero";
import BSideAbout from "@/components/b-side/b-side-about";
import BSideExperience from "@/components/b-side/b-side-experience";
import BSideStack from "@/components/b-side/b-side-stack";
import BSideSkills from "@/components/b-side/b-side-skills";
import BSideProjects from "@/components/b-side/b-side-projects";
import BSideEducation from "@/components/b-side/b-side-education";
import BSideTestimonials from "@/components/b-side/b-side-testimonials";
import BSideAvailability from "@/components/b-side/b-side-availability";
import BSideGallery from "@/components/b-side/b-side-gallery";
import BSideFooter from "@/components/b-side/b-side-footer";

export default function BSidePage() {
  const ref = useGsapReveal<HTMLDivElement>();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
      <div ref={ref} style={{ display: "grid", gap: "1rem" }}>
        <BSideHero />
        <BSideAbout />
        <BSideExperience />
        <BSideStack />
        <BSideSkills />
        <BSideProjects />
        <BSideEducation />
        <BSideTestimonials />
        <BSideAvailability />
        <BSideGallery />
        <BSideFooter />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify in the browser**

Run `npm run dev`, visit `http://localhost:3000/b-side`.
Expected: full brutalist page; blocks slam/fade in on scroll; all 11 sections render real data; toggling theme (the toggle in the hero) switches cream/dark. Toggle OS reduced-motion on and reload → content all visible, no animation.

- [ ] **Step 3: Commit**

```bash
git add app/b-side/page.tsx
git commit -m "feat: assemble the b-side home page"
```

---

## Task 11: Dimension portal — triggers, warp overlay, navigation

The portal is mounted once in the root layout. It owns: the Konami key listener, a `window` event listener for avatar hotspot clicks, the touch d-pad UI, the glitch/CRT warp overlay (GSAP, dynamically imported), and the reverse-warp exit. Entry navigates to `/b-side`; exit navigates to `/`.

**Files:**
- Create: `components/dimension-portal.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create the portal**

Create `components/dimension-portal.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { KONAMI_SEQUENCE, createSequenceMatcher } from "@/lib/konami";
import { createMultiClickCounter } from "@/lib/multi-click";

// Plays a glitch flash on the overlay element, then runs `after`.
// Falls back to a plain timeout if GSAP/motion is unavailable.
async function playWarp(overlay: HTMLElement, after: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  overlay.style.display = "flex";

  if (reduced) {
    overlay.style.opacity = "1";
    window.setTimeout(after, 250);
    return;
  }

  try {
    const { default: gsap } = await import("gsap");
    const tl = gsap.timeline({ onComplete: after });
    tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.15 })
      .to(overlay, { x: 6, duration: 0.04, repeat: 8, yoyo: true })
      .to(overlay, { filter: "hue-rotate(180deg) contrast(2)", duration: 0.15 })
      .to(overlay, { duration: 0.25 });
  } catch {
    window.setTimeout(after, 250);
  }
}

const DPAD = [
  { k: "ArrowUp", s: "↑" }, { k: "ArrowDown", s: "↓" },
  { k: "ArrowLeft", s: "←" }, { k: "ArrowRight", s: "→" },
  { k: "b", s: "B" }, { k: "a", s: "A" },
];

export default function DimensionPortal() {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const matcherRef = useRef(createSequenceMatcher(KONAMI_SEQUENCE));
  const clickerRef = useRef(createMultiClickCounter({ threshold: 5, windowMs: 1500 }));
  const [showDpad, setShowDpad] = useState(false);

  const onB = pathname.startsWith("/b-side");

  const warpTo = useCallback(
    (dest: string) => {
      const overlay = overlayRef.current;
      if (!overlay) {
        router.push(dest);
        return;
      }
      playWarp(overlay, () => {
        router.push(dest);
        // hide overlay shortly after navigation
        window.setTimeout(() => {
          overlay.style.display = "none";
          overlay.style.opacity = "0";
          overlay.style.filter = "none";
        }, 400);
      });
    },
    [router],
  );

  const feedKey = useCallback(
    (key: string) => {
      if (onB) return;
      if (matcherRef.current.push(key)) warpTo("/b-side");
    },
    [onB, warpTo],
  );

  // keyboard konami (ignore when typing in a field)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) {
        return;
      }
      feedKey(e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [feedKey]);

  // avatar hotspot clicks (dispatched from profile-header)
  useEffect(() => {
    const handler = () => {
      if (onB) return;
      if (clickerRef.current.click(Date.now())) warpTo("/b-side");
    };
    window.addEventListener("b-side:avatar-click", handler);
    return () => window.removeEventListener("b-side:avatar-click", handler);
  }, [onB, warpTo]);

  // exit from inside the dimension (footer button or ESC)
  useEffect(() => {
    const exit = () => onB && warpTo("/");
    const onKey = (e: KeyboardEvent) => {
      if (onB && e.key === "Escape") warpTo("/");
    };
    window.addEventListener("b-side:exit", exit);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("b-side:exit", exit);
      window.removeEventListener("keydown", onKey);
    };
  }, [onB, warpTo]);

  return (
    <>
      {/* glitch warp overlay */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        style={{
          display: "none",
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          opacity: 0,
          alignItems: "center",
          justifyContent: "center",
          background:
            "repeating-linear-gradient(0deg,#000 0px,#000 2px,#111 3px,#111 4px)",
          color: "#33ff66",
          fontFamily: "monospace",
          fontSize: "1.1rem",
          letterSpacing: "0.2em",
          pointerEvents: "none",
        }}
      >
        ENTERING THE B-SIDE…
      </div>

      {/* touch d-pad: only on the main site, toggled by a small glyph */}
      {!onB && (
        <div style={{ position: "fixed", right: 12, bottom: 12, zIndex: 50 }}>
          {showDpad ? (
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 2.2rem)", gap: 4, background: "var(--background)", border: "2px solid var(--foreground)", padding: 6 }}
            >
              {DPAD.map(({ k, s }) => (
                <button
                  key={k}
                  type="button"
                  aria-label={`Code key ${s}`}
                  onClick={() => feedKey(k)}
                  style={{ border: "2px solid var(--foreground)", background: "transparent", color: "var(--foreground)", fontFamily: "monospace", height: "2.2rem", cursor: "pointer" }}
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                aria-label="Hide code pad"
                onClick={() => setShowDpad(false)}
                style={{ gridColumn: "span 3", border: "2px solid var(--foreground)", background: "transparent", color: "var(--foreground)", fontFamily: "monospace", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label="Open secret code pad"
              onClick={() => setShowDpad(true)}
              style={{ width: "1.6rem", height: "1.6rem", border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontFamily: "monospace", opacity: 0.5, cursor: "pointer" }}
            >
              ◳
            </button>
          )}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Mount the portal in the root layout**

In `app/layout.tsx`, add the import and render it next to `<ChatAssistant />`:
```tsx
import DimensionPortal from "@/components/dimension-portal";
```
Modify the body so it reads:
```tsx
        {children}
        <ChatAssistant />
        <DimensionPortal />
```

- [ ] **Step 3: Verify Konami + d-pad navigation**

Run `npm run dev`, on `http://localhost:3000/` type `↑ ↑ ↓ ↓ ← → ← → b a`.
Expected: glitch overlay flashes, then navigates to `/b-side`. On `/b-side`, press `Esc` → reverse flash → back to `/`. Click the small `◳` glyph (bottom-right) → d-pad opens; tapping the sequence also warps. Reduced-motion → plain fade instead of glitch.

- [ ] **Step 4: Commit**

```bash
git add components/dimension-portal.tsx app/layout.tsx
git commit -m "feat: add dimension portal with konami, d-pad, warp, and exit"
```

---

## Task 12: Wire the avatar hotspot

The existing avatar button flips on click (touch) / hover. Add a click handler that also reports to the portal via the `b-side:avatar-click` event, preserving current flip behavior.

**Files:**
- Modify: `components/profile-header.tsx`

- [ ] **Step 1: Dispatch the hotspot event on avatar click**

In `components/profile-header.tsx`, update the avatar `<button>`'s `onClick` (currently around lines 48-52) to also emit the event:
```tsx
            onClick={() => {
              window.dispatchEvent(new CustomEvent("b-side:avatar-click"));
              if (isTouchPointer) {
                setIsFlipped((current) => !current);
              }
            }}
```

- [ ] **Step 2: Verify the hotspot**

Run `npm run dev`, on `http://localhost:3000/` click the profile avatar 5 times quickly.
Expected: warp overlay flashes → navigates to `/b-side`. A single slow click still just flips on touch / does nothing on desktop (no accidental warp).

- [ ] **Step 3: Commit**

```bash
git add components/profile-header.tsx
git commit -m "feat: wire avatar 5-click hotspot to the dimension portal"
```

---

## Task 13: Brutalist sub-pages (/b-side/projects, /b-side/stack)

Full parallel of the main `/projects` and `/stack` pages, inside the dimension. Both inherit `app/b-side/layout.tsx` (fonts + `.bside` + noindex).

**Files:**
- Create: `app/b-side/projects/page.tsx`
- Create: `app/b-side/stack/page.tsx`

- [ ] **Step 1: Projects sub-page**

Create `app/b-side/projects/page.tsx`:
```tsx
"use client";

import Link from "next/link";
import content from "@/app/profile-data.json";
import { useGsapReveal } from "@/components/b-side/use-gsap-reveal";
import BrutalBlock from "@/components/b-side/brutal-block";

export default function BSideProjectsPage() {
  const ref = useGsapReveal<HTMLDivElement>();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
      <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
        <h1 className="bs-h" style={{ fontSize: "2rem" }}>ALL PROJECTS</h1>
        <Link href="/b-side" className="bs-tag">← BACK</Link>
      </div>
      <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
        {content.projects.items.map((p) => (
          <BrutalBlock key={p.name}>
            <strong style={{ fontSize: "0.95rem" }}>{p.name}</strong>
            <p style={{ fontSize: "0.8rem", margin: "0.5rem 0", lineHeight: 1.5 }}>{p.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.6rem" }}>
              {p.technologies.map((t) => (
                <span key={t} className="bs-tag" style={{ fontSize: "0.6rem" }}>{t}</span>
              ))}
            </div>
            <a href={p.href} target="_blank" rel="noreferrer" className="bs-tag bs-fill-yellow">OPEN →</a>
          </BrutalBlock>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Stack sub-page**

Create `app/b-side/stack/page.tsx`:
```tsx
"use client";

import Link from "next/link";
import content from "@/app/profile-data.json";
import { useGsapReveal } from "@/components/b-side/use-gsap-reveal";
import BrutalBlock from "@/components/b-side/brutal-block";

const sortedTech = [...content.techstack.items].sort((a, b) => b.level - a.level);

function bar(level: number) {
  const filled = Math.round(level / 10);
  return "█".repeat(filled) + " ".repeat(10 - filled);
}

export default function BSideStackPage() {
  const ref = useGsapReveal<HTMLDivElement>();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
      <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
        <h1 className="bs-h" style={{ fontSize: "2rem" }}>TECH STACK & SKILLS</h1>
        <Link href="/b-side" className="bs-tag">← BACK</Link>
      </div>
      <div ref={ref} style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <BrutalBlock>
          <span className="bs-idx">STACK</span>
          <div className="bs-mono" style={{ marginTop: "0.6rem", fontSize: "0.78rem", lineHeight: 2 }}>
            {sortedTech.map((t) => (
              <div key={t.label} style={{ whiteSpace: "pre" }}>
                {t.label.padEnd(14, " ")} [{bar(t.level)}] {t.level}
              </div>
            ))}
          </div>
        </BrutalBlock>
        <BrutalBlock className="bs-fill-ink">
          <span className="bs-idx" style={{ background: "#ffe600", color: "#0E100F" }}>SKILLS</span>
          <div className="bs-mono" style={{ marginTop: "0.6rem", fontSize: "0.78rem", lineHeight: 2 }}>
            {content.skills.overall.map((s) => (
              <div key={s.label} style={{ whiteSpace: "pre" }}>
                {s.label.padEnd(10, " ")} [{bar(s.level)}] {s.level}
              </div>
            ))}
          </div>
        </BrutalBlock>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify the sub-pages**

Run `npm run dev`. From `/b-side`, click "VIEW ALL →" on Stack and on Projects.
Expected: `/b-side/stack` and `/b-side/projects` render brutalist, in the dimension's styling, with "← BACK" returning to `/b-side`. All projects + all tech items present.

- [ ] **Step 4: Commit**

```bash
git add app/b-side/projects/page.tsx app/b-side/stack/page.tsx
git commit -m "feat: add brutalist b-side projects and stack sub-pages"
```

---

## Task 14: Build + final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Lint + unit tests + production build**

Run:
```bash
npm run lint && npm test && npm run build
```
Expected: lint clean, all `lib` tests pass, build succeeds with `/b-side`, `/b-side/projects`, `/b-side/stack` listed in the route output.

- [ ] **Step 2: Manual checklist (from the spec) on `npm run dev`**

Walk through each and confirm:
- [ ] Konami code on `/` warps to `/b-side`.
- [ ] 5 quick avatar clicks warp; a single click does not.
- [ ] Touch d-pad (open via the `◳` glyph) enters the code and warps.
- [ ] `Esc` and the footer EXIT button reverse-warp back to `/`.
- [ ] `/b-side`, `/b-side/projects`, `/b-side/stack` show every section/item from `profile-data.json`.
- [ ] Light + dark themes both look correct; theme persists across the warp.
- [ ] OS `prefers-reduced-motion` disables glitch + reveals; all content visible.
- [ ] Mobile (narrow viewport) single-column layout is usable.
- [ ] Main site (`/`) is visually unchanged.
- [ ] View page source / network on `/b-side` shows `noindex`.

- [ ] **Step 3: Confirm main bundle stays lean**

After `npm run build`, confirm GSAP is not in the main/home chunk (it is dynamically imported in the portal and reveal hook). Spot-check the build output: the `/` route chunk should not statically include `gsap`.
Expected: GSAP only loads on warp / under `/b-side`.

- [ ] **Step 4: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "chore: final verification fixes for the b-side dimension"
```

---

## Notes for the implementer

- **Theme:** The root layout owns `<html data-theme>`; the nested `b-side` layout does not re-render `<html>`, so the theme carries across navigation automatically. `ThemeToggle` is reused as-is.
- **Why custom events for the hotspot/exit:** the portal must be the single owner of `triggerWarp`/navigation, but the avatar lives in a server-rendered header and the footer EXIT lives deep in the page tree. `window` CustomEvents keep these decoupled without prop-drilling or a context provider wrapping the whole app.
- **GSAP isolation:** never import `gsap` at module top-level in anything reachable from the main `/` bundle. The portal and reveal hook both use `await import("gsap")` so it stays out of the home chunk.
- **Accent contrast:** accent fills pair dark text on light accents and light text on `--fill-ink`; if the dark theme makes any accent block text low-contrast, adjust the specific `bs-fill-*` text color — do not change `globals.css` tokens.
