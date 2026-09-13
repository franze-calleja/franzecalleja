# Sprite-Art Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `/game` overworld as genuine sprite art — one pixel grid shared with the character sprites, one fixed palette, hard outlines, no gradients — with Pokémon-style grass and seven distinct Level 3 buildings.

**Architecture:** A toolkit-first build. `game-palette.ts` holds every colour; `game-pixel.ts` holds the drawing primitives and owns the 2px pixel contract by construction. Renderers (`game-terrain.ts`, `game-buildings.ts`, `game-props.ts`, `game-interior.ts`) are rewritten against that toolkit and imported by a much slimmer `game-canvas.tsx`. Static terrain moves to an offscreen cache so added detail costs less per frame, not more.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, HTML5 Canvas 2D, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-08-31-sprite-art-redesign-design.md`

## Global Constraints

Copied verbatim from the spec's pixel contract. Every task's requirements implicitly include this section.

1. **Unit = 2 world px.** Art is authored in logical pixels; the toolkit multiplies by 2.
2. **No gradients.** Flat ramps of 3–5 tones per material, with dithering for transitions.
3. **No arcs, ellipses, or beziers.** Curves are stepped as pixel staircases.
4. **No translucent fills** in static art. Opaque only. Alpha is reserved for genuinely luminous things — smoke, lantern glow, AZRA's aura.
5. **Every object gets a 1-logical-px outline** in the palette's tinted near-black.
6. **Light comes from the upper-left**, consistently, everywhere.

Additional project constraints:

- Tests live in `lib/**/*.test.ts` only (`vitest.config.ts` `include`), run with `environment: "node"`. They may import from `../components/game/*`.
- Never change map layout, building footprints, collision, NPC routes, dialogue, or modals. This is art only.
- No new runtime dependencies.
- Run `npm test` and `npm run lint` before every commit.

---

### Task 1: Palette module

**Files:**
- Create: `components/game/game-palette.ts`
- Test: `lib/game-palette.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `PAL` — a frozen record of colour name → hex string. `type PaletteColor = keyof typeof PAL`. Every later task imports `PAL` and uses **no colour literals**.

- [ ] **Step 1: Write the failing test**

```ts
// lib/game-palette.test.ts
import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";

describe("World palette", () => {
  it("every value is a valid 6-digit hex colour", () => {
    Object.entries(PAL).forEach(([name, value]) => {
      expect(value, `${name} is not a valid hex colour`).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it("stays within the 48-colour budget", () => {
    const count = Object.keys(PAL).length;
    expect(count).toBeGreaterThanOrEqual(30);
    expect(count).toBeLessThanOrEqual(48);
  });

  it("has no duplicate colours under different names", () => {
    const values = Object.values(PAL);
    expect(new Set(values).size).toBe(values.length);
  });

  it("exposes the material ramps the toolkit depends on", () => {
    ["out", "roofL", "roof", "roofD", "roofX", "wallL", "wall", "wallD", "wallX",
     "wood", "woodL", "woodD", "stoneL", "stone", "stoneD",
     "glassL", "glass", "glassD", "door", "doorL", "doorD",
     "gold", "goldD", "leaf", "leafD", "grass", "grassD", "grassX"]
      .forEach((key) => expect(PAL).toHaveProperty(key));
  });

  it("is frozen so renderers cannot mutate it", () => {
    expect(Object.isFrozen(PAL)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/game-palette.test.ts`
Expected: FAIL — cannot resolve `../components/game/game-palette`.

- [ ] **Step 3: Write the implementation**

```ts
// components/game/game-palette.ts

/**
 * The world palette. Cool Gen 5 (Black/White) sensibility: plum-tinted
 * near-black outlines, cool shadows, balanced saturation.
 *
 * Every colour in the game world comes from here. No renderer may use a
 * colour literal — that invariant is what keeps the world looking like one
 * place instead of seven separately-drawn ones.
 */
export const PAL = Object.freeze({
  // Outline — tinted near-black, never pure #000
  out: "#2b1f2e",

  // Roof ramp
  roofL: "#e08a78",
  roof: "#c1554b",
  roofD: "#9c3f3e",
  roofX: "#6e2c33",

  // Wall / stucco ramp
  wallL: "#f7efd8",
  wall: "#e8d9b8",
  wallD: "#c9b392",
  wallX: "#a08a68",

  // Timber
  wood: "#6b4630",
  woodL: "#8a5f42",
  woodD: "#43291c",

  // Stone
  stoneL: "#b9b2a4",
  stone: "#948d80",
  stoneD: "#6d675c",

  // Glass
  glassL: "#d3eef7",
  glass: "#7fc4d9",
  glassD: "#4a8ba8",

  // Door
  door: "#8a5a3c",
  doorL: "#a97449",
  doorD: "#5e3a26",

  // Metal / brass
  gold: "#e8c15c",
  goldD: "#b08a33",

  // Foliage
  leaf: "#5f9e4a",
  leafD: "#3f7233",
  bloom: "#e56b6b",
  bloom2: "#f0a5c0",

  // Ground — softened from the old #bef264/#22541d range
  grassL: "#92c973",
  grass: "#7cb85f",
  grassD: "#6fae54",
  grassX: "#5d9647",
  grassS: "#4a7d37",

  // Tall grass reads darker than the lawn
  tallL: "#63a54e",
  tall: "#4c8a3c",
  tallD: "#3d7030",

  // Paths
  pathL: "#fbf7ea",
  path: "#ede3c2",
  pathD: "#c5b382",

  // Effects
  smoke: "#cdc7c0",
  arcane: "#8fd4f0",
  arcaneD: "#3f7fa8",
} as const);

export type PaletteColor = keyof typeof PAL;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/game-palette.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add components/game/game-palette.ts lib/game-palette.test.ts
git commit -m "feat(game): add fixed world palette module"
```

---

### Task 2: Pixel toolkit core + the contract test

**Files:**
- Create: `components/game/game-pixel.ts`
- Test: `lib/game-pixel.test.ts`

**Interfaces:**
- Consumes: `PAL` from Task 1
- Produces:
  - `UNIT = 2`
  - `type PixelCtx` — the subset of `CanvasRenderingContext2D` the toolkit uses
  - `withSprite(ctx, worldX, worldY, draw: () => void): void` — establishes logical space
  - `px(ctx, x, y, w, h, color): void`
  - `box(ctx, x, y, w, h, fill): void`
  - `dith(ctx, x, y, w, h, c1, c2): void`
  - `hash(a: number, b: number): number` — 0..255, deterministic

**Design note for the implementer:** `withSprite` applies `translate` + `scale(2, 2)` once, so every primitive inside draws in *logical* pixels and the canvas does the scaling. Because all logical coordinates are integers, scaling by 2 lands on exact world pixels with no anti-aliasing. Do **not** multiply coordinates by hand inside the primitives — that duplicates the contract in a dozen places.

- [ ] **Step 1: Write the failing test**

```ts
// lib/game-pixel.test.ts
import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { UNIT, withSprite, px, box, dith, hash } from "../components/game/game-pixel";

type Call = { op: string; args: unknown[] };

/**
 * Records every canvas call so tests can assert on drawing output, and so the
 * pixel contract (no gradients, no arcs, no stray colours) can be enforced by
 * a test rather than by discipline.
 */
function fakeCtx() {
  const calls: Call[] = [];
  const rects: { x: number; y: number; w: number; h: number; color: string }[] = [];
  let fill = "";
  let tx = 0, ty = 0, sx = 1, sy = 1;

  const ctx = {
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; calls.push({ op: "fillStyle", args: [v] }); },
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push({ op: "fillRect", args: [x, y, w, h] });
      rects.push({ x: tx + x * sx, y: ty + y * sy, w: w * sx, h: h * sy, color: fill });
    },
    save() { calls.push({ op: "save", args: [] }); },
    restore() { calls.push({ op: "restore", args: [] }); tx = 0; ty = 0; sx = 1; sy = 1; },
    translate(x: number, y: number) { tx += x; ty += y; calls.push({ op: "translate", args: [x, y] }); },
    scale(x: number, y: number) { sx *= x; sy *= y; calls.push({ op: "scale", args: [x, y] }); },
    createLinearGradient() { calls.push({ op: "createLinearGradient", args: [] }); return {}; },
    createRadialGradient() { calls.push({ op: "createRadialGradient", args: [] }); return {}; },
    arc() { calls.push({ op: "arc", args: [] }); },
    ellipse() { calls.push({ op: "ellipse", args: [] }); },
    imageSmoothingEnabled: true,
    globalAlpha: 1,
  };

  return { ctx, calls, rects };
}

describe("hash", () => {
  it("is deterministic for the same inputs", () => {
    expect(hash(3, 7)).toBe(hash(3, 7));
    expect(hash(0, 0)).toBe(hash(0, 0));
  });

  it("returns a byte", () => {
    for (let a = 0; a < 40; a++) {
      for (let b = 0; b < 40; b++) {
        const h = hash(a, b);
        expect(Number.isInteger(h)).toBe(true);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(255);
      }
    }
  });

  it("distributes roughly evenly across 6 variant buckets", () => {
    const buckets = new Array(6).fill(0);
    for (let a = 0; a < 60; a++) {
      for (let b = 0; b < 60; b++) buckets[hash(a, b) % 6]++;
    }
    const total = 3600;
    buckets.forEach((n) => {
      expect(n).toBeGreaterThan(total / 6 * 0.7);
      expect(n).toBeLessThan(total / 6 * 1.3);
    });
  });

  it("does not collapse when only one input varies", () => {
    const row = new Set(Array.from({ length: 50 }, (_, i) => hash(i, 5)));
    expect(row.size).toBeGreaterThan(20);
  });
});

describe("withSprite", () => {
  it("scales logical pixels to world pixels by UNIT", () => {
    const { ctx, rects } = fakeCtx();
    withSprite(ctx, 70, 60, () => px(ctx, 1, 2, 3, 4, PAL.wall));
    expect(UNIT).toBe(2);
    expect(rects[0]).toEqual({ x: 70 + 2, y: 60 + 4, w: 6, h: 8, color: PAL.wall });
  });

  it("disables image smoothing and restores the context", () => {
    const { ctx, calls } = fakeCtx();
    withSprite(ctx, 0, 0, () => px(ctx, 0, 0, 1, 1, PAL.out));
    expect(ctx.imageSmoothingEnabled).toBe(false);
    expect(calls[0].op).toBe("save");
    expect(calls[calls.length - 1].op).toBe("restore");
  });
});

describe("box", () => {
  it("draws an outline rect then an inset fill", () => {
    const { ctx, rects } = fakeCtx();
    box(ctx, 0, 0, 10, 8, PAL.wall);
    expect(rects).toHaveLength(2);
    expect(rects[0]).toEqual({ x: 0, y: 0, w: 10, h: 8, color: PAL.out });
    expect(rects[1]).toEqual({ x: 1, y: 1, w: 8, h: 6, color: PAL.wall });
  });
});

describe("dith", () => {
  it("lays a 1px checkerboard of the two tones", () => {
    const { ctx, rects } = fakeCtx();
    dith(ctx, 0, 0, 2, 2, PAL.wall, PAL.wallL);
    expect(rects).toHaveLength(4);
    expect(rects.map((r) => r.color)).toEqual([PAL.wall, PAL.wallL, PAL.wallL, PAL.wall]);
    rects.forEach((r) => { expect(r.w).toBe(1); expect(r.h).toBe(1); });
  });
});

describe("the pixel contract", () => {
  it("primitives never call gradient or curve APIs", () => {
    const { ctx, calls } = fakeCtx();
    withSprite(ctx, 0, 0, () => {
      px(ctx, 0, 0, 4, 4, PAL.wall);
      box(ctx, 0, 0, 8, 8, PAL.roof);
      dith(ctx, 0, 0, 4, 4, PAL.stone, PAL.stoneD);
    });
    const banned = ["createLinearGradient", "createRadialGradient", "arc", "ellipse"];
    expect(calls.filter((c) => banned.includes(c.op))).toHaveLength(0);
  });

  it("primitives only ever paint palette colours", () => {
    const { ctx, rects } = fakeCtx();
    withSprite(ctx, 0, 0, () => {
      box(ctx, 0, 0, 8, 8, PAL.roof);
      dith(ctx, 1, 1, 4, 4, PAL.wall, PAL.wallL);
    });
    const allowed = new Set<string>(Object.values(PAL));
    rects.forEach((r) => expect(allowed.has(r.color), `${r.color} is not in the palette`).toBe(true));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/game-pixel.test.ts`
Expected: FAIL — cannot resolve `../components/game/game-pixel`.

- [ ] **Step 3: Write the implementation**

```ts
// components/game/game-pixel.ts
import { PAL } from "./game-palette";

/** One logical pixel is this many world pixels. Matches the 16x16 character
 *  sprites drawn at 32x32, so world art shares their grid. */
export const UNIT = 2;

/** The slice of CanvasRenderingContext2D the toolkit uses. Narrowing it keeps
 *  gradient and curve APIs out of reach of renderer code. */
export interface PixelCtx {
  fillStyle: string | CanvasGradient | CanvasPattern;
  globalAlpha: number;
  imageSmoothingEnabled: boolean;
  fillRect(x: number, y: number, w: number, h: number): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  scale(x: number, y: number): void;
}

/**
 * Runs `draw` in logical pixel space anchored at a world coordinate.
 * All logical coordinates are integers, so scaling by UNIT lands on exact
 * world pixels with no anti-aliasing.
 */
export function withSprite(
  ctx: PixelCtx,
  worldX: number,
  worldY: number,
  draw: () => void
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(worldX, worldY);
  ctx.scale(UNIT, UNIT);
  draw();
  ctx.restore();
}

/** The only place fillRect is called. */
export function px(
  ctx: PixelCtx, x: number, y: number, w: number, h: number, color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Outlined rect: 1px palette outline with an inset fill. */
export function box(
  ctx: PixelCtx, x: number, y: number, w: number, h: number, fill: string
): void {
  px(ctx, x, y, w, h, PAL.out);
  px(ctx, x + 1, y + 1, w - 2, h - 2, fill);
}

/** 1px checkerboard dither — how ramps transition without a gradient. */
export function dith(
  ctx: PixelCtx, x: number, y: number, w: number, h: number, c1: string, c2: string
): void {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      px(ctx, x + i, y + j, 1, 1, (i + j) & 1 ? c2 : c1);
    }
  }
}

/**
 * The single deterministic pseudo-random source for the whole world.
 * Scatter must be stable across frames or cached terrain will not match
 * live-drawn terrain. Returns 0..255.
 */
export function hash(a: number, b: number): number {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
  return (h ^ (h >>> 16)) >>> 24;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/game-pixel.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add components/game/game-pixel.ts lib/game-pixel.test.ts
git commit -m "feat(game): add pixel toolkit core with contract tests"
```

---

### Task 3: Toolkit building parts

**Files:**
- Modify: `components/game/game-pixel.ts`
- Test: `lib/game-pixel-parts.test.ts`

**Interfaces:**
- Consumes: `px`, `box`, `dith`, `hash`, `PixelCtx` from Task 2
- Produces:
  - `type RoofRow = readonly [x: number, y: number, w: number]`
  - `gableRoof(ridgeW: number, eaveW: number, topY: number, rows: number): RoofRow[]`
  - `steppedRoof(ctx, rows: RoofRow[], tone: RoofTone): void` where `RoofTone = { l: string; m: string; d: string; x: string }`
  - `window2(ctx, x, y): void` — 11×11 glass with frame, mullion, sill
  - `plankDoor(ctx, x, y, w, h): void`
  - `stoneCourse(ctx, x, y, w, h): void`
  - `timberFrame(ctx, x, y, w, h, posts: number[]): void`

- [ ] **Step 1: Write the failing test**

```ts
// lib/game-pixel-parts.test.ts
import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { gableRoof, steppedRoof, window2, plankDoor, stoneCourse } from "../components/game/game-pixel";

function recorder() {
  const rects: { x: number; y: number; w: number; h: number; color: string }[] = [];
  let fill = "";
  const ctx = {
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect(x: number, y: number, w: number, h: number) { rects.push({ x, y, w, h, color: fill }); },
    save() {}, restore() {}, translate() {}, scale() {},
    imageSmoothingEnabled: true, globalAlpha: 1,
  };
  return { ctx, rects };
}

describe("gableRoof geometry", () => {
  it("widens monotonically from ridge to eave", () => {
    const rows = gableRoof(24, 56, 2, 9);
    expect(rows).toHaveLength(9);
    expect(rows[0][2]).toBe(24);
    expect(rows[8][2]).toBe(56);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i][2]).toBeGreaterThan(rows[i - 1][2]);
    }
  });

  it("keeps every row horizontally centred on the same axis", () => {
    const rows = gableRoof(24, 56, 2, 9);
    const centres = rows.map((r) => r[0] * 2 + r[2]);
    centres.forEach((c) => expect(c).toBe(centres[0]));
  });

  it("advances y by 2 logical px per course", () => {
    const rows = gableRoof(24, 56, 2, 9);
    rows.forEach((r, i) => expect(r[1]).toBe(2 + i * 2));
  });
});

describe("steppedRoof", () => {
  const tone = { l: PAL.roofL, m: PAL.roof, d: PAL.roofD, x: PAL.roofX };

  it("draws the whole outline pass before any fill pass", () => {
    const { ctx, rects } = recorder();
    steppedRoof(ctx, gableRoof(8, 16, 0, 3), tone);
    const lastOutline = rects.map((r) => r.color).lastIndexOf(PAL.out);
    const firstFill = rects.findIndex((r) => r.color !== PAL.out);
    expect(lastOutline).toBeLessThan(firstFill);
  });

  it("outlines each course 1px proud on both sides", () => {
    const { ctx, rects } = recorder();
    const rows = gableRoof(8, 16, 0, 3);
    steppedRoof(ctx, rows, tone);
    const outline = rects.filter((r) => r.color === PAL.out);
    expect(outline).toHaveLength(3);
    outline.forEach((o, i) => {
      expect(o.x).toBe(rows[i][0] - 1);
      expect(o.w).toBe(rows[i][2] + 2);
    });
  });

  it("only uses roof-ramp colours", () => {
    const { ctx, rects } = recorder();
    steppedRoof(ctx, gableRoof(8, 16, 0, 3), tone);
    const allowed = new Set([PAL.out, PAL.roofL, PAL.roof, PAL.roofD, PAL.roofX]);
    rects.forEach((r) => expect(allowed.has(r.color)).toBe(true));
  });
});

describe("building parts stay inside their declared bounds", () => {
  it("window2 fits an 11x11 glass plus frame and sill", () => {
    const { ctx, rects } = recorder();
    window2(ctx, 20, 30);
    const minX = Math.min(...rects.map((r) => r.x));
    const maxX = Math.max(...rects.map((r) => r.x + r.w));
    expect(minX).toBeGreaterThanOrEqual(17);
    expect(maxX).toBeLessThanOrEqual(34);
  });

  it("plankDoor fills exactly the rect it is given", () => {
    const { ctx, rects } = recorder();
    plankDoor(ctx, 10, 40, 14, 14);
    const body = rects[0];
    expect(body).toEqual({ x: 10, y: 40, w: 14, h: 14, color: PAL.out });
  });

  it("stoneCourse emits repeated joints across its width", () => {
    const { ctx, rects } = recorder();
    stoneCourse(ctx, 0, 0, 60, 4);
    const joints = rects.filter((r) => r.color === PAL.stoneD && r.w === 1);
    expect(joints.length).toBeGreaterThanOrEqual(7);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/game-pixel-parts.test.ts`
Expected: FAIL — `gableRoof` is not exported.

- [ ] **Step 3: Append the implementation to `game-pixel.ts`**

```ts
// --- Building parts -------------------------------------------------------

export type RoofRow = readonly [x: number, y: number, w: number];
export interface RoofTone { l: string; m: string; d: string; x: string }

/**
 * Generates the stepped courses of a gable roof seen head-on with the roof
 * plane receding upward — the Gen 5 projection. Each course is 2 logical px
 * tall and widens evenly from ridge to eave, centred on one axis.
 */
export function gableRoof(
  ridgeW: number, eaveW: number, topY: number, rows: number
): RoofRow[] {
  const centre = eaveW / 2;
  const step = (eaveW - ridgeW) / (rows - 1);
  const out: RoofRow[] = [];
  for (let i = 0; i < rows; i++) {
    const w = Math.round(ridgeW + step * i);
    out.push([Math.round(centre - w / 2), topY + i * 2, w] as const);
  }
  return out;
}

/**
 * Outline pass first, then fill pass. Drawing all outlines up front means each
 * course's fill covers the next course's top outline, so the staircase shows a
 * clean 1px edge on its sides but no seams across its face.
 */
export function steppedRoof(ctx: PixelCtx, rows: RoofRow[], tone: RoofTone): void {
  for (const [x, y, w] of rows) px(ctx, x - 1, y - 1, w + 2, 3, PAL.out);

  rows.forEach(([x, y, w], i) => {
    const top = i < 2 ? tone.l : i < rows.length - 3 ? tone.m : tone.d;
    const bot = i < 2 ? tone.m : i < rows.length - 3 ? tone.d : tone.x;
    px(ctx, x, y, w, 1, top);
    px(ctx, x, y + 1, w, 1, bot);
    // Shingle tabs, offset every other course so they read as overlapping.
    for (let sx = x + (i & 1 ? 2 : 0); sx < x + w - 1; sx += 4) {
      px(ctx, sx, y + 1, 1, 1, tone.x);
    }
    if (i === 1 || i === rows.length - 4) dith(ctx, x, y, w, 1, top, bot);
  });
}

/** 11x11 glass with timber frame, mullion cross, specular highlight and sill. */
export function window2(ctx: PixelCtx, x: number, y: number): void {
  box(ctx, x - 1, y - 1, 13, 13, PAL.wood);
  px(ctx, x, y, 11, 11, PAL.glassD);
  px(ctx, x, y, 11, 5, PAL.glass);
  px(ctx, x + 1, y + 1, 4, 3, PAL.glassL);
  px(ctx, x + 5, y, 1, 11, PAL.wood);
  px(ctx, x, y + 5, 11, 1, PAL.wood);
  px(ctx, x - 2, y + 11, 15, 2, PAL.out);
  px(ctx, x - 1, y + 11, 13, 1, PAL.woodL);
}

/** Vertical-plank door with hinges, brass handle and a stone step. */
export function plankDoor(
  ctx: PixelCtx, x: number, y: number, w: number, h: number
): void {
  box(ctx, x, y, w, h, PAL.door);
  for (let i = x + 3; i < x + w - 1; i += 4) px(ctx, i, y + 1, 1, h - 2, PAL.doorD);
  px(ctx, x + 1, y + 1, 2, h - 2, PAL.doorL);
  px(ctx, x + 1, y + 1, w - 2, 1, PAL.doorL);
  px(ctx, x + 2, y + 3, 3, 1, PAL.stoneD);
  px(ctx, x + 2, y + h - 5, 3, 1, PAL.stoneD);
  px(ctx, x + w - 4, y + 7, 2, 2, PAL.gold);
  px(ctx, x - 1, y + h, w + 2, 1, PAL.stoneL);
}

/** Dressed-stone foundation course with lit top edges and shadowed joints. */
export function stoneCourse(
  ctx: PixelCtx, x: number, y: number, w: number, h: number
): void {
  px(ctx, x, y, w, h, PAL.out);
  px(ctx, x + 1, y + 1, w - 2, h - 2, PAL.stone);
  for (let i = x + 1; i < x + w - 2; i += 7) {
    px(ctx, i, y + 1, 1, h - 2, PAL.stoneD);
    px(ctx, i + 1, y + 1, 4, 1, PAL.stoneL);
  }
  px(ctx, x + 1, y + h - 2, w - 2, 1, PAL.stoneD);
}

/** Tudor half-timber: top plate, corner posts, and studs at the given offsets. */
export function timberFrame(
  ctx: PixelCtx, x: number, y: number, w: number, h: number, posts: number[]
): void {
  px(ctx, x, y, w, 3, PAL.wood);
  px(ctx, x, y, w, 1, PAL.woodL);
  px(ctx, x, y, 3, h, PAL.wood);
  px(ctx, x + w - 3, y, 3, h, PAL.wood);
  for (const p of posts) px(ctx, x + p, y, 2, h, PAL.wood);
  px(ctx, x, y + h - 2, 3, 2, PAL.woodD);
  px(ctx, x + w - 3, y + h - 2, 3, 2, PAL.woodD);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/game-pixel-parts.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add components/game/game-pixel.ts lib/game-pixel-parts.test.ts
git commit -m "feat(game): add roof, window, door and masonry toolkit parts"
```

---

### Task 4: Animated prop parts

**Files:**
- Modify: `components/game/game-pixel.ts`
- Test: `lib/game-pixel-props.test.ts`

**Interfaces:**
- Consumes: `px`, `box`, `dith` from Tasks 2–3
- Produces:
  - `chimney(ctx, x, y, w, h): void`
  - `chimneySmoke(ctx, x, y, t: number): void`
  - `lantern(ctx, x, y, t: number): void`
  - `flowerBox(ctx, x, y): void`
  - `ivy(ctx, x, yTop, yBottom): void`
  - `hangingSign(ctx, x, y): void`

**Design note:** these are the only functions permitted to touch `globalAlpha`, and only for genuinely luminous elements (smoke, lantern glow). Always restore it to `1` before returning — a leaked alpha silently washes out everything drawn afterwards.

- [ ] **Step 1: Write the failing test**

```ts
// lib/game-pixel-props.test.ts
import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { chimneySmoke, lantern, flowerBox, ivy } from "../components/game/game-pixel";

function recorder() {
  const rects: { x: number; y: number; w: number; h: number; color: string; alpha: number }[] = [];
  let fill = "";
  const ctx = {
    globalAlpha: 1,
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect(x: number, y: number, w: number, h: number) {
      rects.push({ x, y, w, h, color: fill, alpha: ctx.globalAlpha });
    },
    save() {}, restore() {}, translate() {}, scale() {},
    imageSmoothingEnabled: true,
  };
  return { ctx, rects };
}

describe("animated props", () => {
  it("chimneySmoke restores globalAlpha to 1", () => {
    const { ctx } = recorder();
    chimneySmoke(ctx, 10, 0, 1234);
    expect(ctx.globalAlpha).toBe(1);
  });

  it("lantern restores globalAlpha to 1", () => {
    const { ctx } = recorder();
    lantern(ctx, 10, 40, 999);
    expect(ctx.globalAlpha).toBe(1);
  });

  it("smoke rises over time", () => {
    const a = recorder(); chimneySmoke(a.ctx, 10, 0, 0);
    const b = recorder(); chimneySmoke(b.ctx, 10, 0, 400);
    const meanY = (r: typeof a) => r.rects.reduce((s, p) => s + p.y, 0) / r.rects.length;
    expect(meanY(b)).toBeLessThan(meanY(a));
  });

  it("lantern flame brightness varies with time", () => {
    const a = recorder(); lantern(a.ctx, 0, 0, 0);
    const b = recorder(); lantern(b.ctx, 0, 0, 260);
    const glow = (r: typeof a) => r.rects.filter((p) => p.color === PAL.gold).map((p) => p.alpha);
    expect(glow(a)).not.toEqual(glow(b));
  });

  it("static props never touch alpha", () => {
    const { ctx, rects } = recorder();
    flowerBox(ctx, 10, 40);
    ivy(ctx, 60, 20, 50);
    rects.forEach((r) => expect(r.alpha).toBe(1));
  });

  it("props only paint palette colours", () => {
    const { ctx, rects } = recorder();
    flowerBox(ctx, 10, 40);
    ivy(ctx, 60, 20, 50);
    chimneySmoke(ctx, 10, 0, 500);
    lantern(ctx, 30, 40, 500);
    const allowed = new Set<string>(Object.values(PAL));
    rects.forEach((r) => expect(allowed.has(r.color), `${r.color} not in palette`).toBe(true));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/game-pixel-props.test.ts`
Expected: FAIL — `chimneySmoke` is not exported.

- [ ] **Step 3: Append the implementation to `game-pixel.ts`**

```ts
// --- Animated props -------------------------------------------------------
// These are the ONLY functions permitted to set globalAlpha, and only for
// luminous elements. Each restores it to 1 before returning.

export function chimney(
  ctx: PixelCtx, x: number, y: number, w: number, h: number
): void {
  px(ctx, x, y, w, h, PAL.out);
  px(ctx, x + 1, y + 1, w - 2, h - 1, PAL.stone);
  dith(ctx, x + 1, y + 1, w - 2, h - 3, PAL.stone, PAL.stoneD);
  px(ctx, x - 1, y, w + 2, 3, PAL.out);
  px(ctx, x, y + 1, w, 1, PAL.stoneL);
}

export function chimneySmoke(ctx: PixelCtx, x: number, y: number, t: number): void {
  for (let i = 0; i < 4; i++) {
    const phase = ((t * 0.0009 + i * 0.25) % 1 + 1) % 1;
    const sy = Math.round(y + 12 - phase * 14);
    const sx = Math.round(x + Math.sin(phase * 5 + i) * 4);
    const size = Math.max(1, Math.round(3 - phase * 2));
    ctx.globalAlpha = 0.55 * (1 - phase);
    px(ctx, sx, sy, size, size, PAL.smoke);
  }
  ctx.globalAlpha = 1;
}

export function lantern(ctx: PixelCtx, x: number, y: number, t: number): void {
  const flicker = 0.72 + 0.28 * Math.sin(t * 0.006);
  px(ctx, x + 2, y - 3, 1, 3, PAL.wood);
  box(ctx, x, y, 5, 6, PAL.goldD);
  ctx.globalAlpha = flicker;
  px(ctx, x + 1, y + 1, 3, 4, PAL.gold);
  ctx.globalAlpha = 0.16 * flicker;
  px(ctx, x - 3, y - 2, 11, 11, PAL.gold);
  ctx.globalAlpha = 1;
}

export function flowerBox(ctx: PixelCtx, x: number, y: number): void {
  px(ctx, x - 2, y + 1, 15, 4, PAL.out);
  px(ctx, x - 1, y + 2, 13, 2, PAL.wood);
  for (let i = x - 1; i < x + 12; i += 3) {
    px(ctx, i, y, 2, 2, PAL.leaf);
    px(ctx, i + 1, y + 1, 1, 1, PAL.leafD);
    px(ctx, i, y - 1, 1, 1, i % 2 ? PAL.bloom : PAL.bloom2);
  }
}

export function ivy(ctx: PixelCtx, x: number, yTop: number, yBottom: number): void {
  for (let j = yTop; j < yBottom; j += 3) {
    px(ctx, x, j, 2, 2, PAL.leafD);
    px(ctx, x + 1, j + 1, 1, 1, PAL.leaf);
    if (j % 6 === 0) px(ctx, x - 2, j + 1, 2, 2, PAL.leaf);
  }
}

export function hangingSign(ctx: PixelCtx, x: number, y: number): void {
  px(ctx, x + 3, y, 8, 1, PAL.wood);
  px(ctx, x + 3, y, 1, 4, PAL.wood);
  px(ctx, x + 1, y + 3, 12, 2, PAL.out);
  box(ctx, x, y + 4, 14, 10, PAL.wood);
  px(ctx, x + 1, y + 5, 12, 8, PAL.doorD);
  px(ctx, x + 3, y + 7, 8, 1, PAL.gold);
  px(ctx, x + 3, y + 9, 5, 1, PAL.gold);
  px(ctx, x + 3, y + 11, 7, 1, PAL.goldD);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/game-pixel-props.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add components/game/game-pixel.ts lib/game-pixel-props.test.ts
git commit -m "feat(game): add animated chimney, lantern, flower box and ivy props"
```

---

### Task 5: Tall-grass map data and the exclusion mask

**Files:**
- Modify: `components/game/game-data.ts`
- Create: `components/game/game-mask.ts`
- Test: `lib/game-terrain-data.test.ts`

**Interfaces:**
- Consumes: `PATH_AREAS` and `WORLD_OBJECTS` (currently private to `game-canvas.tsx` for `PATH_AREAS` — export it from `game-data.ts` as part of this task)
- Produces:
  - `TALL_GRASS_AREAS: Rect[]` in `game-data.ts` where `interface Rect { x: number; y: number; w: number; h: number }`
  - `PATH_AREAS: Rect[]` moved to `game-data.ts` and exported
  - `buildExclusionMask(tileSize: number): Uint8Array` in `game-mask.ts`
  - `isExcluded(mask: Uint8Array, cols: number, col: number, row: number): boolean`

**Why the mask matters:** `isInsidePathOrBuilding` (`game-canvas.tsx:188`) is called once per tile per frame — 720 tiles × 31 rects ≈ 22,000 iterations every frame, for an answer that never changes. The equivalence test below is the important one: if the mask disagrees with the old function anywhere, flowers silently start growing on the pavement.

- [ ] **Step 1: Write the failing test**

```ts
// lib/game-terrain-data.test.ts
import { describe, it, expect } from "vitest";
import {
  TALL_GRASS_AREAS, PATH_AREAS, WORLD_OBJECTS,
  MAP_TOTAL_WIDTH, MAP_TOTAL_HEIGHT,
} from "../components/game/game-data";
import { buildExclusionMask, isExcluded } from "../components/game/game-mask";

/** The exact predicate from game-canvas.tsx:188, kept here as the oracle the
 *  precomputed mask must reproduce. */
function legacyIsInsidePathOrBuilding(x: number, y: number): boolean {
  for (const pa of PATH_AREAS) {
    if (x + 28 >= pa.x && x <= pa.x + pa.w + 4 && y + 28 >= pa.y && y <= pa.y + pa.h + 4) return true;
  }
  for (const obj of WORLD_OBJECTS) {
    if (x + 32 >= obj.x && x <= obj.x + obj.width + 8 && y + 32 >= obj.y && y <= obj.y + obj.height + 8) return true;
  }
  return false;
}

describe("TALL_GRASS_AREAS", () => {
  it("defines at least four patches", () => {
    expect(TALL_GRASS_AREAS.length).toBeGreaterThanOrEqual(4);
  });

  it("never overlaps a pathway", () => {
    TALL_GRASS_AREAS.forEach((g) => {
      PATH_AREAS.forEach((p) => {
        const overlaps = g.x < p.x + p.w && g.x + g.w > p.x && g.y < p.y + p.h && g.y + g.h > p.y;
        expect(overlaps, `patch ${JSON.stringify(g)} overlaps path ${JSON.stringify(p)}`).toBe(false);
      });
    });
  });

  it("never overlaps a building or world object", () => {
    TALL_GRASS_AREAS.forEach((g) => {
      WORLD_OBJECTS.forEach((o) => {
        const overlaps = g.x < o.x + o.width && g.x + g.w > o.x && g.y < o.y + o.height && g.y + g.h > o.y;
        expect(overlaps, `patch ${JSON.stringify(g)} overlaps ${o.name}`).toBe(false);
      });
    });
  });

  it("stays inside the map perimeter", () => {
    TALL_GRASS_AREAS.forEach((g) => {
      expect(g.x).toBeGreaterThanOrEqual(32);
      expect(g.y).toBeGreaterThanOrEqual(32);
      expect(g.x + g.w).toBeLessThanOrEqual(MAP_TOTAL_WIDTH - 32);
      expect(g.y + g.h).toBeLessThanOrEqual(MAP_TOTAL_HEIGHT - 32);
    });
  });
});

describe("exclusion mask", () => {
  it("reproduces the legacy predicate for every tile", () => {
    const tile = 32;
    const cols = Math.ceil(MAP_TOTAL_WIDTH / tile);
    const rows = Math.ceil(MAP_TOTAL_HEIGHT / tile);
    const mask = buildExclusionMask(tile);

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        expect(
          isExcluded(mask, cols, c, r),
          `mask disagrees at tile ${c},${r}`
        ).toBe(legacyIsInsidePathOrBuilding(c * tile, r * tile));
      }
    }
  });

  it("is sized to the tile grid", () => {
    const tile = 32;
    const cols = Math.ceil(MAP_TOTAL_WIDTH / tile);
    const rows = Math.ceil(MAP_TOTAL_HEIGHT / tile);
    expect(buildExclusionMask(tile).length).toBe(cols * rows);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/game-terrain-data.test.ts`
Expected: FAIL — `TALL_GRASS_AREAS` and `PATH_AREAS` are not exported from `game-data.ts`.

- [ ] **Step 3: Write the implementation**

Add to `components/game/game-data.ts` (move `PATH_AREAS` here from `game-canvas.tsx:170-186` verbatim, then add the new export):

```ts
export interface Rect { x: number; y: number; w: number; h: number }

/** Pathway bounding boxes. Moved from game-canvas.tsx so terrain data lives
 *  with the rest of the map data. Values are unchanged. */
export const PATH_AREAS: Rect[] = [
  { x: 340, y: 300, w: 160, h: 160 }, // Central Plaza
  { x: 370, y: 440, w: 90, h: 280 },  // South Entrance
  { x: 375, y: 140, w: 80, h: 170 },  // North Trail to Village Post
  { x: 110, y: 150, w: 80, h: 120 },  // NW Trail
  { x: 110, y: 240, w: 260, h: 80 },  // West Trail
  { x: 470, y: 150, w: 100, h: 160 }, // NE Trail
  { x: 550, y: 150, w: 150, h: 80 },  // East Trail to Sanctuary
  { x: 690, y: 160, w: 90, h: 70 },   // East Trail to Career Archives
  { x: 120, y: 480, w: 270, h: 70 },  // SW Trail
  { x: 120, y: 530, w: 80, h: 120 },  // SW Trail to Dojo
  { x: 440, y: 470, w: 260, h: 70 },  // SE Trail
  { x: 560, y: 520, w: 120, h: 140 }, // SE Trail to Cottage
  { x: 660, y: 470, w: 160, h: 60 },  // Trail to Court
  { x: 730, y: 535, w: 90, h: 100 },  // Basketball Court
];

/**
 * Hand-placed tall-grass patches, sited in the open field pockets between
 * buildings and trails. Deliberately placed rather than scattered so nothing
 * important gets covered and NPC walk routes stay clear.
 */
export const TALL_GRASS_AREAS: Rect[] = [
  { x: 216, y: 48,  w: 118, h: 88 },  // between Guild and Village Post
  { x: 214, y: 330, w: 116, h: 140 }, // west of the plaza
  { x: 216, y: 570, w: 136, h: 130 }, // south-west field
  { x: 470, y: 566, w: 82,  h: 150 }, // south of the plaza approach
  { x: 700, y: 292, w: 92,  h: 166 }, // east, below the Archives
  { x: 832, y: 560, w: 92,  h: 156 }, // south-east corner
];
```

Create `components/game/game-mask.ts`:

```ts
import { MAP_TOTAL_WIDTH, MAP_TOTAL_HEIGHT, PATH_AREAS, WORLD_OBJECTS } from "./game-data";

/**
 * Precomputes, once, which tiles sit on a path or building. Replaces a
 * per-tile per-frame scan over 31 rectangles (~22k iterations/frame) with a
 * single array lookup. Padding values are copied exactly from the original
 * isInsidePathOrBuilding so flower placement does not shift.
 */
export function buildExclusionMask(tileSize: number): Uint8Array {
  const cols = Math.ceil(MAP_TOTAL_WIDTH / tileSize);
  const rows = Math.ceil(MAP_TOTAL_HEIGHT / tileSize);
  const mask = new Uint8Array(cols * rows);

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = c * tileSize;
      const y = r * tileSize;
      let hit = false;

      for (const pa of PATH_AREAS) {
        if (x + 28 >= pa.x && x <= pa.x + pa.w + 4 && y + 28 >= pa.y && y <= pa.y + pa.h + 4) {
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (const obj of WORLD_OBJECTS) {
          if (x + 32 >= obj.x && x <= obj.x + obj.width + 8 && y + 32 >= obj.y && y <= obj.y + obj.height + 8) {
            hit = true;
            break;
          }
        }
      }
      if (hit) mask[r * cols + c] = 1;
    }
  }
  return mask;
}

export function isExcluded(mask: Uint8Array, cols: number, col: number, row: number): boolean {
  return mask[row * cols + col] === 1;
}
```

Then delete `PATH_AREAS` from `game-canvas.tsx:170-186` and import it from `game-data` instead.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/game-terrain-data.test.ts`
Expected: PASS, 6 tests. If an overlap assertion fails, nudge that patch's coordinates until it passes — the test is the placement spec.

- [ ] **Step 5: Commit**

```bash
git add components/game/game-data.ts components/game/game-mask.ts components/game/game-canvas.tsx lib/game-terrain-data.test.ts
git commit -m "feat(game): add tall-grass areas and precomputed exclusion mask"
```

---

### Task 6: Terrain renderer with offscreen cache

**Files:**
- Create: `components/game/game-terrain.ts`
- Modify: `components/game/game-canvas.tsx` — delete `drawOrganicGround` (`:491-702`) and `isInsidePathOrBuilding` (`:188-202`); call the new renderer at `:5489`
- Test: `lib/game-terrain.test.ts`

**Interfaces:**
- Consumes: `PAL`, `px`/`box`/`dith`/`hash`/`withSprite`, `buildExclusionMask`/`isExcluded`, `PATH_AREAS`
- Produces:
  - `bladeVariant(col: number, row: number): number` — 0..5, stable
  - `patchTone(col: number, row: number): "grassL" | "grass" | "grassD"`
  - `renderTerrainToCache(): HTMLCanvasElement` — builds the full static ground once
  - `drawTerrain(ctx, cache: HTMLCanvasElement): void` — one blit per frame

- [ ] **Step 1: Write the failing test**

```ts
// lib/game-terrain.test.ts
import { describe, it, expect } from "vitest";
import { bladeVariant, patchTone } from "../components/game/game-terrain";

describe("blade variants", () => {
  it("is stable for the same tile", () => {
    expect(bladeVariant(4, 9)).toBe(bladeVariant(4, 9));
  });

  it("returns one of six variants", () => {
    for (let c = 0; c < 30; c++) {
      for (let r = 0; r < 24; r++) {
        const v = bladeVariant(c, r);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(5);
      }
    }
  });

  it("does not repeat across adjacent tiles in a fixed pattern", () => {
    // The old renderer placed identical blades in every tile, producing a
    // visible 32px checkerboard. Neighbours must differ often.
    let differing = 0;
    for (let c = 0; c < 29; c++) {
      for (let r = 0; r < 24; r++) {
        if (bladeVariant(c, r) !== bladeVariant(c + 1, r)) differing++;
      }
    }
    expect(differing / (29 * 24)).toBeGreaterThan(0.6);
  });
});

describe("patchwork tone", () => {
  it("only ever returns a grass ramp key", () => {
    const allowed = ["grassL", "grass", "grassD"];
    for (let c = 0; c < 30; c++) {
      for (let r = 0; r < 24; r++) expect(allowed).toContain(patchTone(c, r));
    }
  });

  it("forms contiguous blobs rather than per-tile noise", () => {
    // Neighbouring tiles should usually share a tone, or the field reads as
    // static instead of as soft patches.
    let same = 0;
    for (let c = 0; c < 29; c++) {
      for (let r = 0; r < 24; r++) {
        if (patchTone(c, r) === patchTone(c + 1, r)) same++;
      }
    }
    expect(same / (29 * 24)).toBeGreaterThan(0.55);
  });

  it("uses more than one tone across the map", () => {
    const seen = new Set<string>();
    for (let c = 0; c < 30; c++) for (let r = 0; r < 24; r++) seen.add(patchTone(c, r));
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/game-terrain.test.ts`
Expected: FAIL — cannot resolve `../components/game/game-terrain`.

- [ ] **Step 3: Write the implementation**

Create `components/game/game-terrain.ts`. Key points for the implementer:

- Tiles are 32 world px = **16 logical px**. Draw everything inside `withSprite(ctx, 0, 0, ...)` so the whole terrain is in logical space.
- `bladeVariant` uses `hash(col, row) % 6`.
- `patchTone` samples a low-frequency value-noise field so tones form blobs: sample `hash` on a coarser grid (`col >> 2`, `row >> 2`) and interpolate by nearest, which is what makes neighbours agree.
- Flowers use the mask via `isExcluded`, not the deleted `isInsidePathOrBuilding`.
- Path edges: instead of a hard rect boundary, run a 3-cell scatter band around each `PATH_AREAS` rect using `hash` so grass fingers into stone.

```ts
import { PAL } from "./game-palette";
import { px, dith, hash, withSprite, type PixelCtx } from "./game-pixel";
import { MAP_TOTAL_WIDTH, MAP_TOTAL_HEIGHT, PATH_AREAS } from "./game-data";
import { buildExclusionMask, isExcluded } from "./game-mask";

const TILE_WORLD = 32;
const TILE = 16; // logical
const COLS = Math.ceil(MAP_TOTAL_WIDTH / TILE_WORLD);
const ROWS = Math.ceil(MAP_TOTAL_HEIGHT / TILE_WORLD);

const GRASS_TONES = ["grassL", "grass", "grassD"] as const;
export type GrassTone = (typeof GRASS_TONES)[number];

/** Six blade-cluster layouts, in logical px offsets within a 16x16 tile. */
const BLADES: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [[2, 4], [5, 2], [9, 6]],
  [[7, 3], [11, 5], [3, 9]],
  [[4, 7], [10, 2], [13, 8]],
  [[1, 6], [6, 10], [12, 4]],
  [[8, 8], [2, 11], [13, 2]],
  [[5, 5], [9, 11], [3, 3]],
];

export function bladeVariant(col: number, row: number): number {
  return hash(col, row) % 6;
}

/**
 * Low-frequency value noise: sampling on a coarse grid makes neighbouring
 * tiles usually agree, so tones form soft blobs instead of per-tile static.
 */
export function patchTone(col: number, row: number): GrassTone {
  const n = hash(col >> 2, row >> 2);
  return GRASS_TONES[n % 3];
}

function drawTile(ctx: PixelCtx, col: number, row: number, mask: Uint8Array): void {
  const x = col * TILE;
  const y = row * TILE;
  const base = PAL[patchTone(col, row)];

  px(ctx, x, y, TILE, TILE, base);
  // Suggestion of a mowing stripe: one tone step, not the old hard band.
  if (col % 2 === 0) dith(ctx, x, y + 7, TILE, 1, base, PAL.grassD);

  for (const [bx, by] of BLADES[bladeVariant(col, row)]) {
    px(ctx, x + bx, y + by + 2, 2, 1, PAL.grassS);
    px(ctx, x + bx, y + by, 1, 3, PAL.grassX);
    px(ctx, x + bx + 1, y + by - 1, 1, 2, PAL.grassL);
  }

  if (!isExcluded(mask, COLS, col, row)) {
    const h = hash(col * 3, row * 5) % 31;
    if (h === 1) { px(ctx, x + 5, y + 7, 1, 2, PAL.leafD); px(ctx, x + 4, y + 4, 3, 3, PAL.gold); }
    else if (h === 2) { px(ctx, x + 10, y + 9, 1, 2, PAL.leafD); px(ctx, x + 9, y + 6, 3, 3, PAL.bloom); }
    else if (h === 3) { px(ctx, x + 7, y + 12, 1, 2, PAL.leafD); px(ctx, x + 6, y + 9, 3, 3, PAL.glass); }
    else if (h === 4) { px(ctx, x + 8, y + 4, 3, 3, PAL.leaf); px(ctx, x + 9, y + 5, 1, 1, PAL.leafD); }
    else if (h === 5) { px(ctx, x + 3, y + 11, 3, 3, PAL.wallL); px(ctx, x + 4, y + 12, 1, 1, PAL.gold); }
  }
}

function drawPaths(ctx: PixelCtx): void {
  for (const p of PATH_AREAS) {
    // PATH_AREAS holds world coordinates, and several are odd numbers
    // (e.g. x: 375). Halving them raw would produce fractional logical
    // coordinates and reintroduce anti-aliasing, so snap to the 2px grid.
    const x = Math.floor(p.x / 2), y = Math.floor(p.y / 2);
    const w = Math.ceil(p.w / 2), h = Math.ceil(p.h / 2);
    px(ctx, x, y, w, h, PAL.path);
    for (let py = y; py < y + h - 5; py += 8) {
      for (let pxx = x; pxx < x + w - 5; pxx += 8) {
        px(ctx, pxx, py, 8, 8, PAL.pathD);
        px(ctx, pxx, py, 7, 7, PAL.pathL);
        px(ctx, pxx + 1, py + 1, 6, 6, (pxx + py) % 16 === 0 ? PAL.path : PAL.pathL);
      }
    }
    // Dithered fringe: grass fingers into the stone instead of stopping dead.
    for (let i = 0; i < w; i++) {
      const top = hash(x + i, y) % 3;
      const bot = hash(x + i, y + h) % 3;
      for (let d = 0; d < top; d++) px(ctx, x + i, y + d, 1, 1, PAL.grass);
      for (let d = 0; d < bot; d++) px(ctx, x + i, y + h - 1 - d, 1, 1, PAL.grass);
    }
    for (let j = 0; j < h; j++) {
      const l = hash(x, y + j) % 3;
      const r = hash(x + w, y + j) % 3;
      for (let d = 0; d < l; d++) px(ctx, x + d, y + j, 1, 1, PAL.grass);
      for (let d = 0; d < r; d++) px(ctx, x + w - 1 - d, y + j, 1, 1, PAL.grass);
    }
  }
}

/** Builds the static ground once. Called at mount, never per frame. */
export function renderTerrainToCache(): HTMLCanvasElement {
  const cache = document.createElement("canvas");
  cache.width = MAP_TOTAL_WIDTH;
  cache.height = MAP_TOTAL_HEIGHT;
  const ctx = cache.getContext("2d") as unknown as PixelCtx;
  const mask = buildExclusionMask(TILE_WORLD);

  withSprite(ctx, 0, 0, () => {
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const perimeter = c === 0 || r === 0 || c === COLS - 1 || r === ROWS - 1;
        if (perimeter) {
          px(ctx, c * TILE, r * TILE, TILE, TILE, PAL.grassS);
          dith(ctx, c * TILE, r * TILE, TILE, TILE, PAL.grassS, PAL.grassX);
        } else {
          drawTile(ctx, c, r, mask);
        }
      }
    }
    drawPaths(ctx);
  });

  return cache;
}

/** One blit per frame, replacing ~18k fillRect calls. */
export function drawTerrain(
  ctx: CanvasRenderingContext2D, cache: HTMLCanvasElement
): void {
  ctx.drawImage(cache, 0, 0);
}
```

In `game-canvas.tsx`: delete `drawOrganicGround` and `isInsidePathOrBuilding`, hold the cache in a ref built on mount, and replace the `drawOrganicGround(ctx)` call at `:5489` with `drawTerrain(ctx, terrainCacheRef.current)`.

- [ ] **Step 4: Run tests and check the game**

Run: `npx vitest run && npm run lint`
Expected: PASS.

Then `npm run dev`, open `/game`, and confirm: no visible 32px grid repetition, soft tone patches across the field, grass fingering into the path edges, and flowers still absent from paths and buildings.

- [ ] **Step 5: Commit**

```bash
git add components/game/game-terrain.ts components/game/game-canvas.tsx lib/game-terrain.test.ts
git commit -m "feat(game): rebuild terrain as cached sprite-art ground"
```

---

### Task 7: Tall grass, two-pass rendering and rustle feedback

**Files:**
- Modify: `components/game/game-terrain.ts` — add tall-grass drawing
- Modify: `components/game/game-audio.ts` — add `playRustle`
- Modify: `components/game/game-canvas.tsx` — render order, leaf particles, entry detection
- Test: `lib/game-rustle.test.ts`

**Interfaces:**
- Consumes: `TALL_GRASS_AREAS`, `hash`, `px`, `PAL`
- Produces:
  - `drawTallGrassBases(ctx, t: number): void`
  - `drawTallGrassTips(ctx, t: number): void`
  - `isInTallGrass(x: number, y: number): boolean`
  - `retroAudio.playRustle(): void`
  - `interface Leaf { x, y, vx, vy, life, maxLife, color }` and `spawnLeaves(x, y): Leaf[]`

**Design note:** the two-pass split is what makes the player stand *in* the grass. Bases draw before the player at render step 1; tips draw after the player. The existing 24-particle ambient pool (`game-canvas.tsx:4770`) wraps forever with no lifetime, so leaves need their own array.

- [ ] **Step 1: Write the failing test**

```ts
// lib/game-rustle.test.ts
import { describe, it, expect } from "vitest";
import { isInTallGrass, spawnLeaves } from "../components/game/game-terrain";
import { TALL_GRASS_AREAS } from "../components/game/game-data";

describe("isInTallGrass", () => {
  it("is true at the centre of every patch", () => {
    TALL_GRASS_AREAS.forEach((g) => {
      expect(isInTallGrass(g.x + g.w / 2, g.y + g.h / 2)).toBe(true);
    });
  });

  it("is false well outside every patch", () => {
    expect(isInTallGrass(0, 0)).toBe(false);
    TALL_GRASS_AREAS.forEach((g) => {
      expect(isInTallGrass(g.x - 20, g.y - 20)).toBe(false);
    });
  });

  it("is false on the plaza", () => {
    expect(isInTallGrass(420, 380)).toBe(false);
  });
});

describe("spawnLeaves", () => {
  it("emits a small burst with finite lifetimes", () => {
    const leaves = spawnLeaves(100, 100);
    expect(leaves.length).toBeGreaterThanOrEqual(3);
    expect(leaves.length).toBeLessThanOrEqual(8);
    leaves.forEach((l) => {
      expect(l.life).toBeGreaterThan(0);
      expect(l.life).toBe(l.maxLife);
    });
  });

  it("spreads leaves around the spawn point", () => {
    const leaves = spawnLeaves(100, 100);
    const xs = new Set(leaves.map((l) => l.vx));
    expect(xs.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/game-rustle.test.ts`
Expected: FAIL — `isInTallGrass` is not exported.

- [ ] **Step 3: Write the implementation**

Append to `components/game/game-terrain.ts`. **Add `TALL_GRASS_AREAS` to the existing `game-data` import at the top of the file** — do not add a second import statement mid-file:

```ts
// Top of file — extend the existing import, do not duplicate it:
// import { MAP_TOTAL_WIDTH, MAP_TOTAL_HEIGHT, PATH_AREAS, TALL_GRASS_AREAS } from "./game-data";

export interface Leaf {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string;
}

export function isInTallGrass(x: number, y: number): boolean {
  return TALL_GRASS_AREAS.some(
    (g) => x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h
  );
}

export function spawnLeaves(x: number, y: number): Leaf[] {
  const out: Leaf[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    out.push({
      x, y,
      vx: Math.cos(a) * 0.6,
      vy: Math.sin(a) * 0.4 - 0.5,
      life: 26, maxLife: 26,
      color: i % 2 ? PAL.tallL : PAL.leaf,
    });
  }
  return out;
}

/** Clump bases — drawn BEFORE the player so they sit behind it.
 *  Takes no time argument: bases do not sway, only the tips do. */
export function drawTallGrassBases(ctx: PixelCtx): void {
  withSprite(ctx, 0, 0, () => {
    for (const g of TALL_GRASS_AREAS) {
      for (let wy = g.y; wy < g.y + g.h; wy += 16) {
        for (let wx = g.x; wx < g.x + g.w; wx += 16) {
          if (hash(wx, wy) % 4 === 0) continue; // gaps keep it organic
          const x = wx / 2, y = wy / 2;
          px(ctx, x, y + 4, 8, 4, PAL.tallD);
          px(ctx, x + 1, y + 4, 6, 2, PAL.tall);
        }
      }
    }
  });
}

/** Blade tips — drawn AFTER the player so it stands waist-deep in the grass. */
export function drawTallGrassTips(ctx: PixelCtx, t: number): void {
  withSprite(ctx, 0, 0, () => {
    for (const g of TALL_GRASS_AREAS) {
      for (let wy = g.y; wy < g.y + g.h; wy += 16) {
        for (let wx = g.x; wx < g.x + g.w; wx += 16) {
          if (hash(wx, wy) % 4 === 0) continue;
          const x = wx / 2, y = wy / 2;
          const sway = Math.round(Math.sin(t * 0.002 + hash(wx, wy) * 0.1) * 1);
          px(ctx, x + 1 + sway, y, 1, 5, PAL.tall);
          px(ctx, x + 4 + sway, y - 1, 1, 6, PAL.tallL);
          px(ctx, x + 6 + sway, y + 1, 1, 4, PAL.tall);
        }
      }
    }
  });
}
```

Add to `components/game/game-audio.ts`, matching the procedural style of `playStep` at `:216`:

```ts
/** Short filtered-noise burst for walking into tall grass. */
public playRustle() {
  if (this.muted || !this.ctx) return;
  const ctx = this.ctx;
  const dur = 0.14;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2600;
  filter.Q.value = 0.8;
  const gain = ctx.createGain();
  gain.gain.value = 0.16;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}
```

In `game-canvas.tsx`:
- Add `leavesRef = useRef<Leaf[]>([])` and `wasInGrassRef = useRef(false)`.
- In the update step, when `isInTallGrass(p.x + 12, p.y + 20)` is true and `wasInGrassRef.current` is false, call `retroAudio.playRustle()` and push `spawnLeaves(p.x + 12, p.y + 24)` into `leavesRef.current`. Update `wasInGrassRef.current` each frame.
- Age leaves each frame (`life--`, apply velocity, `vy += 0.03`), and drop expired ones.
- Render order: `drawTerrain` → `drawTallGrassBases(ctx)` → existing props/buildings/NPCs → player → `drawTallGrassTips(ctx, time)` → leaves → existing particles.

- [ ] **Step 4: Run tests and check the game**

Run: `npx vitest run && npm run lint`
Expected: PASS.

Then `npm run dev` and walk into a patch: the sprite should be occluded from the waist down, a rustle should play once on entry (not every frame), and a small leaf burst should fade.

- [ ] **Step 5: Commit**

```bash
git add components/game/game-terrain.ts components/game/game-audio.ts components/game/game-canvas.tsx lib/game-rustle.test.ts
git commit -m "feat(game): add tall grass with two-pass occlusion and rustle feedback"
```

---

### Task 8: First building — Projects Showcase Guild (REVIEW CHECKPOINT)

**Files:**
- Create: `components/game/game-buildings.ts`
- Modify: `components/game/game-canvas.tsx` — route building 1 to the new renderer
- Test: `lib/game-buildings.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–4
- Produces:
  - `interface BuildingSpec { x: number; y: number; draw(ctx: PixelCtx, t: number): void }`
  - `drawProjectsGuild(ctx: PixelCtx, t: number): void`
  - `BUILDINGS: Record<string, BuildingSpec>`

**This task is a checkpoint.** Stop after it and review the result at 1× in the real game before building the remaining six. Mockups were approved at 4–6× zoom; at 1× a logical pixel is only 2 screen pixels and some detail will merge. Correcting the style here costs one building; correcting it later costs seven.

- [ ] **Step 1: Write the failing test**

```ts
// lib/game-buildings.test.ts
import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { BUILDINGS } from "../components/game/game-buildings";
import { WORLD_OBJECTS } from "../components/game/game-data";

function recorder() {
  const rects: { x: number; y: number; w: number; h: number; color: string }[] = [];
  const calls: string[] = [];
  let fill = "";
  const ctx = {
    globalAlpha: 1,
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect(x: number, y: number, w: number, h: number) { rects.push({ x, y, w, h, color: fill }); },
    save() { calls.push("save"); }, restore() { calls.push("restore"); },
    translate() { calls.push("translate"); }, scale() { calls.push("scale"); },
    createLinearGradient() { calls.push("createLinearGradient"); return {}; },
    createRadialGradient() { calls.push("createRadialGradient"); return {}; },
    arc() { calls.push("arc"); }, ellipse() { calls.push("ellipse"); },
    imageSmoothingEnabled: true,
  };
  return { ctx, rects, calls };
}

describe("Projects Showcase Guild", () => {
  it("is registered at the coordinates the world object declares", () => {
    const spec = BUILDINGS["projects-guild"];
    const obj = WORLD_OBJECTS.find((o) => o.name === "Projects Showcase Guild")!;
    expect(spec.x).toBe(obj.x);
    expect(spec.y).toBe(obj.y);
  });

  it("honours the pixel contract — no gradients, no curves", () => {
    const { ctx, calls } = recorder();
    BUILDINGS["projects-guild"].draw(ctx, 0);
    ["createLinearGradient", "createRadialGradient", "arc", "ellipse"]
      .forEach((banned) => expect(calls).not.toContain(banned));
  });

  it("paints only palette colours", () => {
    const { ctx, rects } = recorder();
    BUILDINGS["projects-guild"].draw(ctx, 0);
    const allowed = new Set<string>(Object.values(PAL));
    rects.forEach((r) => expect(allowed.has(r.color), `${r.color} not in palette`).toBe(true));
  });

  it("stays within its 70x55 logical footprint", () => {
    const { ctx, rects } = recorder();
    BUILDINGS["projects-guild"].draw(ctx, 0);
    // Chimney and hanging sign may overhang above and to the left by design.
    rects.forEach((r) => {
      expect(r.x).toBeGreaterThanOrEqual(-4);
      expect(r.x + r.w).toBeLessThanOrEqual(74);
      expect(r.y + r.h).toBeLessThanOrEqual(60);
    });
  });

  it("animates — output differs between two timestamps", () => {
    const a = recorder(); BUILDINGS["projects-guild"].draw(a.ctx, 0);
    const b = recorder(); BUILDINGS["projects-guild"].draw(b.ctx, 800);
    expect(JSON.stringify(a.rects)).not.toBe(JSON.stringify(b.rects));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/game-buildings.test.ts`
Expected: FAIL — cannot resolve `../components/game/game-buildings`.

- [ ] **Step 3: Write the implementation**

```ts
// components/game/game-buildings.ts
import { PAL } from "./game-palette";
import {
  px, box, dith, gableRoof, steppedRoof, window2, plankDoor, stoneCourse,
  timberFrame, chimney, chimneySmoke, lantern, flowerBox, ivy, hangingSign,
  type PixelCtx,
} from "./game-pixel";

export interface BuildingSpec {
  x: number;
  y: number;
  draw(ctx: PixelCtx, t: number): void;
}

const ROOF_TONE = { l: PAL.roofL, m: PAL.roof, d: PAL.roofD, x: PAL.roofX };

/**
 * Projects Showcase Guild. 70x55 logical (140x110 world) at 70,60.
 * Level 3: timber-framed stucco with a guild sign, chimney, lantern,
 * flower boxes and ivy.
 */
export function drawProjectsGuild(ctx: PixelCtx, t: number): void {
  // Chimney sits behind the roof, so it draws first.
  chimney(ctx, 14, 0, 9, 13);

  steppedRoof(ctx, gableRoof(24, 56, 4, 9), ROOF_TONE);

  // Eave with an underside shadow line
  box(ctx, 4, 22, 62, 5, PAL.roofX);
  px(ctx, 5, 25, 60, 1, PAL.woodD);

  // Stucco body
  box(ctx, 8, 26, 54, 30, PAL.wall);
  dith(ctx, 9, 27, 52, 28, PAL.wall, PAL.wallL);
  px(ctx, 55, 27, 6, 28, PAL.wallD);
  dith(ctx, 53, 27, 3, 28, PAL.wall, PAL.wallD);

  timberFrame(ctx, 8, 26, 54, 30, [18, 38]);
  px(ctx, 8, 46, 18, 3, PAL.wood);
  px(ctx, 44, 46, 18, 3, PAL.wood);
  px(ctx, 9, 46, 16, 1, PAL.woodL);
  px(ctx, 45, 46, 16, 1, PAL.woodL);

  window2(ctx, 14, 30);
  window2(ctx, 47, 30);
  plankDoor(ctx, 30, 42, 12, 14);
  stoneCourse(ctx, 6, 56, 58, 4);

  // Weathering streaks below the eave
  px(ctx, 16, 27, 1, 3, PAL.wallX);
  px(ctx, 40, 27, 1, 4, PAL.wallX);
  px(ctx, 52, 27, 1, 2, PAL.wallX);

  // Character props
  flowerBox(ctx, 14, 43);
  flowerBox(ctx, 47, 43);
  ivy(ctx, 60, 28, 54);
  hangingSign(ctx, -2, 28);
  lantern(ctx, 44, 45, t);
  chimneySmoke(ctx, 18, 0, t);
}

export const BUILDINGS: Record<string, BuildingSpec> = {
  "projects-guild": { x: 70, y: 60, draw: drawProjectsGuild },
};
```

In `game-canvas.tsx`, inside `drawCustomBuildings`, replace the building-1 block (`:1663-1933`) with:

```ts
const guild = BUILDINGS["projects-guild"];
withSprite(ctx, guild.x, guild.y, () => guild.draw(ctx, time));
```

- [ ] **Step 4: Run tests and review at 1×**

Run: `npx vitest run && npm run lint`
Expected: PASS, 5 new tests.

Then `npm run dev` and look at the Guild **at native zoom, not zoomed in**. Check: does the roof read as a receding plane? Are the timber frame and shingles legible or mush? Does the sign read at 1×? Report findings before proceeding — this is where the style gets corrected.

- [ ] **Step 5: Commit**

```bash
git add components/game/game-buildings.ts components/game/game-canvas.tsx lib/game-buildings.test.ts
git commit -m "feat(game): rebuild Projects Guild in Gen 5 sprite style"
```

---

### Task 9: Remaining six buildings

**Files:**
- Modify: `components/game/game-buildings.ts`
- Modify: `components/game/game-canvas.tsx` — delete `drawCustomBuildings` (`:1659-3161`) and route all seven through `BUILDINGS`
- Test: `lib/game-buildings.test.ts` — extend to cover all seven

**Interfaces:**
- Consumes: the toolkit, plus `drawProjectsGuild` as the reference implementation
- Produces: `BUILDINGS` gains `village-post`, `azra-sanctuary`, `career-archives`, `devops-station`, `enverga-dojo`, `gamer-cottage`

**Geometry per building.** All use `gableRoof(ridgeW, eaveW, topY, rows)` and the same body construction as the Guild; only the values, materials and props differ.

| Key | World x,y | Logical W×H | Roof | Body material | Props |
|---|---|---|---|---|---|
| `village-post` | 350,55 | 65×48 | `gableRoof(22,52,4,8)` | Stucco + timber | Mailbox (`box` + flag), notice board with 3 pinned papers, bracket bell in brass, weathervane above ridge |
| `azra-sanctuary` | 560,45 | 70×63 | `gableRoof(18,54,6,10)`, steeper | Stone + `arcane` rune band | 3 floating crystals (sine bob, `arcane`/`arcaneD`), glowing rune band pulsing on `globalAlpha`, no chimney |
| `career-archives` | 750,150 | 70×53 | `gableRoof(26,58,4,8)` | Stone with `stoneL` quoins | 3 stacked crates, wall clock (stepped pixel ring, two hands), 2 tall narrow windows, closed shutters |
| `devops-station` | 60,260 | 70×55 | Flat industrial: `box` + `stoneCourse`, no gable | Stone + metal plate | Twin `chimney` stacks with offset `chimneySmoke`, horizontal pipe run, 2 pressure gauges, 3 status lamps blinking on `hash`-offset phase |
| `enverga-dojo` | 60,560 | 70×55 | Two stacked `gableRoof` calls for a pagoda double-eave | Timber + plaster | Paired paper lanterns (`lantern`), training dummy, vertical banner |
| `gamer-cottage` | 560,535 | 70×55 | `gableRoof(24,56,4,9)` | Stucco + timber, warmer | CRT glow in window (alpha pulse in `glass`/`glassL`), `chimney` + smoke, controller-glyph `hangingSign`, doormat |

- [ ] **Step 1: Extend the test to cover all seven**

```ts
// Append to lib/game-buildings.test.ts
const KEYS = [
  "projects-guild", "village-post", "azra-sanctuary",
  "career-archives", "devops-station", "enverga-dojo", "gamer-cottage",
] as const;

const NAMES: Record<string, string> = {
  "projects-guild": "Projects Showcase Guild",
  "village-post": "Village Post & Inquiries Lodge",
  "azra-sanctuary": "AZRA's AI Arcane Sanctuary",
  "career-archives": "Career & Work Experience Archives",
  "devops-station": "DevOps & Telemetry Power Station",
  "enverga-dojo": "Academy of Enverga (Honors Dojo)",
  "gamer-cottage": "Franze's Gamer Cottage",
};

describe("all seven buildings", () => {
  it("are all registered", () => {
    KEYS.forEach((k) => expect(BUILDINGS[k], `${k} missing`).toBeDefined());
  });

  it("sit at their world object coordinates", () => {
    KEYS.forEach((k) => {
      const obj = WORLD_OBJECTS.find((o) => o.name === NAMES[k])!;
      expect(BUILDINGS[k].x, `${k} x`).toBe(obj.x);
      expect(BUILDINGS[k].y, `${k} y`).toBe(obj.y);
    });
  });

  it("all honour the pixel contract", () => {
    KEYS.forEach((k) => {
      const { ctx, calls } = recorder();
      BUILDINGS[k].draw(ctx, 0);
      ["createLinearGradient", "createRadialGradient", "arc", "ellipse"]
        .forEach((banned) => expect(calls, `${k} used ${banned}`).not.toContain(banned));
    });
  });

  it("all paint only palette colours", () => {
    const allowed = new Set<string>(Object.values(PAL));
    KEYS.forEach((k) => {
      const { ctx, rects } = recorder();
      BUILDINGS[k].draw(ctx, 0);
      rects.forEach((r) => expect(allowed.has(r.color), `${k} used ${r.color}`).toBe(true));
    });
  });

  it("all leave globalAlpha restored", () => {
    KEYS.forEach((k) => {
      const { ctx } = recorder();
      BUILDINGS[k].draw(ctx, 500);
      expect(ctx.globalAlpha, `${k} leaked alpha`).toBe(1);
    });
  });

  it("are visually distinct from one another", () => {
    const sigs = KEYS.map((k) => {
      const { ctx, rects } = recorder();
      BUILDINGS[k].draw(ctx, 0);
      return JSON.stringify(rects);
    });
    expect(new Set(sigs).size).toBe(KEYS.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/game-buildings.test.ts`
Expected: FAIL — `village-post` is undefined.

- [ ] **Step 3: Implement the six buildings**

Follow `drawProjectsGuild` as the template, using the geometry table above. Each function is roughly 30–45 lines: chimney/backdrop first, `steppedRoof`, eave `box`, body `box` + `dith`, `timberFrame` or `stoneCourse`, `window2`/`plankDoor`, then the props from the table. Register each in `BUILDINGS`.

Example — `village-post`, showing the pattern the other five follow:

```ts
export function drawVillagePost(ctx: PixelCtx, t: number): void {
  steppedRoof(ctx, gableRoof(22, 52, 4, 8), ROOF_TONE);
  box(ctx, 5, 20, 56, 5, PAL.roofX);
  px(ctx, 6, 23, 54, 1, PAL.woodD);

  box(ctx, 9, 24, 48, 26, PAL.wall);
  dith(ctx, 10, 25, 46, 24, PAL.wall, PAL.wallL);
  px(ctx, 50, 25, 6, 24, PAL.wallD);
  timberFrame(ctx, 9, 24, 48, 26, [16, 34]);

  window2(ctx, 14, 28);
  plankDoor(ctx, 30, 38, 12, 12);
  stoneCourse(ctx, 7, 50, 52, 4);

  // Mailbox
  box(ctx, 60, 38, 7, 8, PAL.stone);
  px(ctx, 62, 40, 3, 1, PAL.stoneD);
  px(ctx, 67, 36, 1, 5, PAL.bloom);   // raised flag
  px(ctx, 62, 46, 2, 6, PAL.wood);    // post

  // Notice board with pinned papers
  box(ctx, 0, 32, 14, 12, PAL.wood);
  px(ctx, 1, 33, 12, 10, PAL.woodD);
  px(ctx, 2, 34, 4, 4, PAL.wallL);
  px(ctx, 8, 35, 4, 3, PAL.wallL);
  px(ctx, 3, 39, 5, 3, PAL.wallL);
  px(ctx, 5, 44, 2, 8, PAL.wood);

  // Bracket bell, swinging gently
  const swing = Math.round(Math.sin(t * 0.003));
  px(ctx, 44, 22, 6, 1, PAL.wood);
  px(ctx, 49, 22, 1, 3, PAL.wood);
  box(ctx, 47 + swing, 25, 5, 5, PAL.gold);
  px(ctx, 49 + swing, 30, 1, 1, PAL.goldD);

  // Weathervane above the ridge
  px(ctx, 30, 0, 1, 5, PAL.stoneD);
  px(ctx, 27, 1, 7, 1, PAL.stoneD);
  px(ctx, 33, 0, 3, 3, PAL.gold);
}
```

Then delete `drawCustomBuildings` from `game-canvas.tsx` and replace its call site with a loop:

```ts
Object.values(BUILDINGS).forEach((b) => {
  withSprite(ctx, b.x, b.y, () => b.draw(ctx, time));
});
```

- [ ] **Step 4: Run tests and check the game**

Run: `npx vitest run && npm run lint`
Expected: PASS, 6 new tests.

Then `npm run dev` and walk the whole map. Every building should be recognisable from its props alone.

- [ ] **Step 5: Commit**

```bash
git add components/game/game-buildings.ts components/game/game-canvas.tsx lib/game-buildings.test.ts
git commit -m "feat(game): rebuild remaining six buildings in sprite style"
```

---

### Task 10: Props, furniture and foliage

**Files:**
- Create: `components/game/game-props.ts`
- Modify: `components/game/game-canvas.tsx` — delete `drawVillageFurniture` (`:1066-1455`), `drawSpriteTrees` (`:1456-1658`), `drawSpriteBushes` (`:944-1065`), `drawSpriteFlowerPots` (`:804-943`), `drawTexturedFences` (`:703-803`)
- Test: `lib/game-props.test.ts`

**Interfaces:**
- Consumes: the toolkit
- Produces: `drawFences`, `drawFlowerPots`, `drawBushes`, `drawFurniture`, `drawTrees` — each `(ctx: CanvasRenderingContext2D, t: number) => void`, iterating their existing constant arrays (`PATHWAY_FENCES`, `FLOWER_POTS`, `DECORATIVE_BUSHES`, `VILLAGE_FURNITURE`, `DECORATIVE_TREES`), which move to `game-data.ts` alongside `PATH_AREAS`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/game-props.test.ts
import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { drawFences, drawFlowerPots, drawBushes, drawFurniture, drawTrees } from "../components/game/game-props";

function recorder() {
  const rects: { color: string }[] = [];
  const calls: string[] = [];
  let fill = "";
  const ctx = {
    globalAlpha: 1,
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect() { rects.push({ color: fill }); },
    save() {}, restore() {}, translate() {}, scale() {},
    createLinearGradient() { calls.push("createLinearGradient"); return {}; },
    createRadialGradient() { calls.push("createRadialGradient"); return {}; },
    arc() { calls.push("arc"); }, ellipse() { calls.push("ellipse"); },
    imageSmoothingEnabled: true,
  };
  return { ctx, rects, calls };
}

const RENDERERS = { drawFences, drawFlowerPots, drawBushes, drawFurniture, drawTrees };

describe("prop renderers", () => {
  it("all honour the pixel contract", () => {
    Object.entries(RENDERERS).forEach(([name, fn]) => {
      const { ctx, calls } = recorder();
      fn(ctx as never, 0);
      ["createLinearGradient", "createRadialGradient", "arc", "ellipse"]
        .forEach((banned) => expect(calls, `${name} used ${banned}`).not.toContain(banned));
    });
  });

  it("all paint only palette colours", () => {
    const allowed = new Set<string>(Object.values(PAL));
    Object.entries(RENDERERS).forEach(([name, fn]) => {
      const { ctx, rects } = recorder();
      fn(ctx as never, 0);
      rects.forEach((r) => expect(allowed.has(r.color), `${name} used ${r.color}`).toBe(true));
    });
  });

  it("all leave globalAlpha restored", () => {
    Object.entries(RENDERERS).forEach(([name, fn]) => {
      const { ctx } = recorder();
      fn(ctx as never, 400);
      expect(ctx.globalAlpha, `${name} leaked alpha`).toBe(1);
    });
  });

  it("all actually draw something", () => {
    Object.entries(RENDERERS).forEach(([name, fn]) => {
      const { ctx, rects } = recorder();
      fn(ctx as never, 0);
      expect(rects.length, `${name} drew nothing`).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/game-props.test.ts`
Expected: FAIL — cannot resolve `../components/game/game-props`.

- [ ] **Step 3: Write the implementation**

Move `DECORATIVE_TREES`, `FLOWER_POTS`, `DECORATIVE_BUSHES`, `VILLAGE_FURNITURE` and `PATHWAY_FENCES` from `game-canvas.tsx:62-167` into `game-data.ts` unchanged. Then rebuild each renderer in `game-props.ts` using `withSprite` per item.

Conversion rules for the implementer — these replace every banned primitive found in the old code:

- **Round canopies** (`drawSpriteTrees`, `drawSpriteBushes`): replace `ctx.arc` with a stepped pixel circle — a symmetric array of row widths, e.g. for radius 8: `[4,8,10,12,12,12,12,10,8,4]`. Draw as `px` rows, outline pass first.
- **Ellipse shadows**: replace with a 3-row stepped ellipse in `PAL.grassX`, opaque, no alpha.
- **Gradient shading** (`drawVillageFurniture` has 1): replace with a 3-tone ramp plus `dith` at the boundary.
- **rgba fills**: pick the nearest opaque palette tone.
- Fence posts get `timberFrame`-style highlight/shadow edges instead of gradients.

`drawTrees`, showing the pattern the other four follow:

```ts
import { PAL } from "./game-palette";
import { px, box, dith, withSprite, hash, type PixelCtx } from "./game-pixel";
import { DECORATIVE_TREES } from "./game-data";

/** Stepped canopy rows, top to bottom — the replacement for ctx.arc. */
const CANOPY = [6, 12, 18, 22, 24, 24, 22, 18, 12, 6] as const;

export function drawTrees(ctx: CanvasRenderingContext2D, t: number): void {
  DECORATIVE_TREES.forEach((tree, i) => {
    withSprite(ctx as unknown as PixelCtx, tree.x, tree.y, () => {
      const c = ctx as unknown as PixelCtx;
      const sway = Math.round(Math.sin(t * 0.0015 + hash(tree.x, tree.y) * 0.05));

      // Opaque stepped shadow — no ellipse, no alpha
      px(c, 6, 30, 12, 1, PAL.grassX);
      px(c, 4, 31, 16, 1, PAL.grassX);
      px(c, 6, 32, 12, 1, PAL.grassX);

      // Trunk
      box(c, 10, 20, 5, 12, PAL.wood);
      px(c, 11, 21, 1, 10, PAL.woodL);
      px(c, 13, 21, 1, 10, PAL.woodD);

      // Canopy: outline pass, then fill, then a lit upper-left face
      CANOPY.forEach((w, r) => px(c, 12 - w / 2 + sway - 1, r - 1, w + 2, 3, PAL.out));
      CANOPY.forEach((w, r) => px(c, 12 - w / 2 + sway, r, w, 1, r < 4 ? PAL.leaf : PAL.leafD));
      dith(c, 12 - 8 + sway, 3, 8, 2, PAL.leaf, PAL.leafD);
      px(c, 12 - 6 + sway, 2, 4, 1, PAL.grassL);

      // Occasional fruit, stable per tree
      if (hash(tree.x, tree.y) % 3 === 0) px(c, 14 + sway, 6, 2, 2, PAL.bloom);
      void i;
    });
  });
}
```

- [ ] **Step 4: Run tests and check the game**

Run: `npx vitest run && npm run lint`
Expected: PASS, 4 new tests.

Then `npm run dev` and confirm trees, bushes, pots, fences and furniture all match the buildings' style.

- [ ] **Step 5: Commit**

```bash
git add components/game/game-props.ts components/game/game-data.ts components/game/game-canvas.tsx lib/game-props.test.ts
git commit -m "feat(game): rebuild trees, bushes, fences and furniture as sprite art"
```

---

### Task 11: Fountain, statues, banners and court

**Files:**
- Modify: `components/game/game-props.ts`
- Modify: `components/game/game-canvas.tsx` — delete `drawCentralFountain` (`:3846-4132`), `drawDetailedStatues` (`:3574-3845`), `drawDetailedBanners` (`:3331-3573`), `drawBasketballCourt` (`:3165-3330`)
- Test: `lib/game-props.test.ts` — extend

**Interfaces:**
- Consumes: the toolkit
- Produces: `drawFountain`, `drawStatues`, `drawBanners`, `drawCourt` — same signature as Task 10's renderers

**Why these are grouped:** they are the four heaviest curve users in the file — the fountain alone has 26 arcs against 37 rects, and the court has 7 against 9. They need genuine reconstruction rather than recolouring.

**Fountain reconstruction:** three concentric stepped pixel rings (basin, mid tier, top tier) built from row-width arrays, with a 3-frame water ripple cycle selected by `Math.floor(t / 200) % 3` and dithered water tones between `PAL.glass` and `PAL.glassD`. Spout droplets are 1×1 `px` on a sine path — no arcs anywhere.

- [ ] **Step 1: Extend the test**

```ts
// Append to lib/game-props.test.ts
import { drawFountain, drawStatues, drawBanners, drawCourt } from "../components/game/game-props";

const HEAVY = { drawFountain, drawStatues, drawBanners, drawCourt };

describe("reconstructed curve-heavy renderers", () => {
  it("use no curve APIs at all", () => {
    Object.entries(HEAVY).forEach(([name, fn]) => {
      const { ctx, calls } = recorder();
      fn(ctx as never, 0);
      ["arc", "ellipse", "createLinearGradient", "createRadialGradient"]
        .forEach((banned) => expect(calls, `${name} used ${banned}`).not.toContain(banned));
    });
  });

  it("paint only palette colours", () => {
    const allowed = new Set<string>(Object.values(PAL));
    Object.entries(HEAVY).forEach(([name, fn]) => {
      const { ctx, rects } = recorder();
      fn(ctx as never, 0);
      rects.forEach((r) => expect(allowed.has(r.color), `${name} used ${r.color}`).toBe(true));
    });
  });

  it("fountain water animates across its ripple cycle", () => {
    const frames = [0, 200, 400].map((t) => {
      const { ctx, rects } = recorder();
      drawFountain(ctx as never, t);
      return rects.length;
    });
    expect(new Set(frames).size).toBeGreaterThan(1);
  });

  it("all leave globalAlpha restored", () => {
    Object.entries(HEAVY).forEach(([name, fn]) => {
      const { ctx } = recorder();
      fn(ctx as never, 300);
      expect(ctx.globalAlpha, `${name} leaked alpha`).toBe(1);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/game-props.test.ts`
Expected: FAIL — `drawFountain` is not exported.

- [ ] **Step 3: Write the implementation**

Add a shared stepped-circle helper to `game-pixel.ts` first, since three of these four need it:

```ts
/** Draws a filled pixel circle from a row-width table — the sprite-art
 *  replacement for ctx.arc. Widths are per row, top to bottom. */
export function pixelDisc(
  ctx: PixelCtx, cx: number, y: number, widths: readonly number[], fill: string, outline = true
): void {
  if (outline) {
    widths.forEach((w, i) => px(ctx, cx - w / 2 - 1, y + i - 1, w + 2, 3, PAL.out));
  }
  widths.forEach((w, i) => px(ctx, cx - w / 2, y + i, w, 1, fill));
}
```

Conversion rules (repeated here in full so this task stands alone):

- **Round basins and rings** → `pixelDisc` with a row-width table. Fountain tiers use `[16,26,32,36,38,38,36,32,26,16]` (basin), `[10,18,22,24,24,22,18,10]` (mid), `[6,10,14,14,10,6]` (top).
- **Ellipse shadows** → a 3-row stepped ellipse in `PAL.grassX`, opaque.
- **Gradient shading** → a 3-tone ramp plus `dith` at the boundary.
- **`rgba()` fills** → the nearest opaque palette tone.
- **Banner cloth** → vertical `px` strips with a `dith` seam where the fold falls; the wave is a per-column `Math.sin` offset rounded to whole pixels, not a bezier.
- **Court markings** → the centre circle and key arc become `pixelDisc` outlines drawn in `PAL.pathL` with no fill.

The fountain, showing the pattern the other three follow:

```ts
const BASIN = [16, 26, 32, 36, 38, 38, 36, 32, 26, 16] as const;
const MID = [10, 18, 22, 24, 24, 22, 18, 10] as const;
const TOP = [6, 10, 14, 14, 10, 6] as const;

export function drawFountain(ctx: CanvasRenderingContext2D, t: number): void {
  withSprite(ctx as unknown as PixelCtx, 400, 340, () => {
    const c = ctx as unknown as PixelCtx;
    const frame = Math.floor(t / 200) % 3;

    pixelDisc(c, 20, 12, BASIN, PAL.stone);
    BASIN.forEach((w, i) => {
      if (i > 1 && i < 8) px(c, 20 - w / 2 + 2, 12 + i, w - 4, 1, PAL.glassD);
    });
    // Ripples: one dithered row shifts per frame.
    dith(c, 20 - 14, 15 + frame, 28, 1, PAL.glass, PAL.glassD);

    pixelDisc(c, 20, 4, MID, PAL.stoneL);
    pixelDisc(c, 20, -2, TOP, PAL.stone);

    // Spout droplets on a sine path — 1x1 pixels, never an arc.
    for (let i = 0; i < 5; i++) {
      const ph = ((t * 0.002 + i * 0.2) % 1 + 1) % 1;
      px(c, 20 + Math.round(Math.sin(ph * 6) * 6), Math.round(-4 + ph * 14), 1, 1, PAL.glassL);
    }
  });
}
```

- [ ] **Step 4: Run tests and check the game**

Run: `npx vitest run && npm run lint`
Expected: PASS, 4 new tests.

Then `npm run dev` and check the plaza. The fountain should read as stepped stone tiers with animated water and no anti-aliased edges anywhere.

- [ ] **Step 5: Commit**

```bash
git add components/game/game-pixel.ts components/game/game-props.ts components/game/game-canvas.tsx lib/game-props.test.ts
git commit -m "feat(game): reconstruct fountain, statues, banners and court without curves"
```

---

### Task 12: Guild interior

**Files:**
- Create: `components/game/game-interior.ts`
- Modify: `components/game/game-canvas.tsx` — delete `drawProjectsGuildInterior` (`:4252-4707`) and `drawProjectStationPedestal` (`:4151-4251`)
- Test: `lib/game-interior.test.ts`

**Interfaces:**
- Consumes: the toolkit, `GUILD_INTERIOR_WIDTH`, `GUILD_INTERIOR_HEIGHT`, `GUILD_PROJECT_STATIONS`
- Produces: `drawGuildInterior(ctx, t: number, charactersImage: HTMLImageElement | null): void`, `drawStationPedestal(ctx, station: ProjectStation, t: number): void`

**Why this can't be skipped:** the interior has 4 gradients, 8 curves and 13 rgba fills. Leaving it makes walking into the Guild a visible style break.

- [ ] **Step 1: Write the failing test**

```ts
// lib/game-interior.test.ts
import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { drawGuildInterior } from "../components/game/game-interior";
import { GUILD_PROJECT_STATIONS } from "../components/game/game-data";

function recorder() {
  const rects: { color: string }[] = [];
  const calls: string[] = [];
  let fill = "";
  const ctx = {
    globalAlpha: 1,
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect() { rects.push({ color: fill }); },
    drawImage() { calls.push("drawImage"); },
    save() {}, restore() {}, translate() {}, scale() {},
    createLinearGradient() { calls.push("createLinearGradient"); return {}; },
    createRadialGradient() { calls.push("createRadialGradient"); return {}; },
    arc() { calls.push("arc"); }, ellipse() { calls.push("ellipse"); },
    imageSmoothingEnabled: true,
  };
  return { ctx, rects, calls };
}

describe("guild interior", () => {
  it("honours the pixel contract", () => {
    const { ctx, calls } = recorder();
    drawGuildInterior(ctx as never, 0, null);
    ["createLinearGradient", "createRadialGradient", "arc", "ellipse"]
      .forEach((banned) => expect(calls).not.toContain(banned));
  });

  it("paints only palette colours", () => {
    const { ctx, rects } = recorder();
    drawGuildInterior(ctx as never, 0, null);
    const allowed = new Set<string>(Object.values(PAL));
    rects.forEach((r) => expect(allowed.has(r.color), `${r.color} not in palette`).toBe(true));
  });

  it("renders without a spritesheet loaded", () => {
    const { ctx, rects } = recorder();
    expect(() => drawGuildInterior(ctx as never, 0, null)).not.toThrow();
    expect(rects.length).toBeGreaterThan(0);
  });

  it("draws a pedestal for every project station", () => {
    const { ctx, rects } = recorder();
    drawGuildInterior(ctx as never, 0, null);
    expect(GUILD_PROJECT_STATIONS.length).toBeGreaterThan(0);
    expect(rects.length).toBeGreaterThan(GUILD_PROJECT_STATIONS.length * 4);
  });

  it("leaves globalAlpha restored", () => {
    const { ctx } = recorder();
    drawGuildInterior(ctx as never, 700, null);
    expect(ctx.globalAlpha).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/game-interior.test.ts`
Expected: FAIL — cannot resolve `../components/game/game-interior`.

- [ ] **Step 3: Write the implementation**

Rebuild the 700×540 interior (350×270 logical) with the toolkit: plank floor via repeated `px` rows with `dith` seams, stone walls via `stoneCourse`, `window2` for interior windows, `pixelDisc` for the round rug, and `lantern` for wall sconces.

```ts
// components/game/game-interior.ts
import { PAL } from "./game-palette";
import {
  px, box, dith, withSprite, pixelDisc, window2, stoneCourse, lantern,
  type PixelCtx,
} from "./game-pixel";
import { GUILD_PROJECT_STATIONS, type ProjectStation } from "./game-data";

const W = 350; // logical
const H = 270;

/** Pedestal: stone plinth with a pulsing arcane display above it. */
export function drawStationPedestal(
  ctx: PixelCtx, station: ProjectStation, t: number
): void {
  const x = Math.floor(station.x / 2);
  const y = Math.floor(station.y / 2);

  box(ctx, x, y + 8, 16, 10, PAL.stone);
  dith(ctx, x + 1, y + 9, 14, 8, PAL.stone, PAL.stoneD);
  stoneCourse(ctx, x - 1, y + 16, 18, 4);

  const pulse = 0.55 + 0.45 * Math.sin(t * 0.004 + x);
  box(ctx, x + 2, y, 12, 9, PAL.arcaneD);
  ctx.globalAlpha = pulse;
  px(ctx, x + 3, y + 1, 10, 7, PAL.arcane);
  ctx.globalAlpha = 1;
  px(ctx, x + 4, y + 2, 3, 2, PAL.glassL);
}

export function drawGuildInterior(
  ctx: PixelCtx, t: number, charactersImage: HTMLImageElement | null
): void {
  withSprite(ctx, 0, 0, () => {
    // Plank floor with dithered seams
    for (let y = 0; y < H; y += 6) {
      px(ctx, 0, y, W, 6, y % 12 === 0 ? PAL.wood : PAL.woodL);
      dith(ctx, 0, y + 5, W, 1, PAL.wood, PAL.woodD);
    }

    // Stone walls
    for (let y = 0; y < 24; y += 4) stoneCourse(ctx, 0, y, W, 4);
    px(ctx, 0, 0, 2, H, PAL.stoneD);
    px(ctx, W - 2, 0, 2, H, PAL.stoneD);

    window2(ctx, 60, 6);
    window2(ctx, 270, 6);
    lantern(ctx, 30, 10, t);
    lantern(ctx, 310, 10, t);

    // Central rug
    pixelDisc(ctx, W / 2, 120, [40, 60, 72, 78, 78, 72, 60, 40], PAL.bloom, false);

    GUILD_PROJECT_STATIONS.forEach((s) => drawStationPedestal(ctx, s, t));
  });

  void charactersImage; // NPCs inside the guild are drawn by the caller
}
```

- [ ] **Step 4: Run tests and check the game**

Run: `npx vitest run && npm run lint`
Expected: PASS, 5 new tests.

Then `npm run dev`, enter the Guild, and confirm the interior matches the overworld style.

- [ ] **Step 5: Commit**

```bash
git add components/game/game-interior.ts components/game/game-canvas.tsx lib/game-interior.test.ts
git commit -m "feat(game): rebuild guild interior in sprite style"
```

---

### Task 13: Cleanup and final verification

**Files:**
- Delete: `public/game/map.png`
- Move: `public/game/Buildings_Colour2.png` → `docs/assets/reference/Buildings_Colour2.png`
- Modify: `components/game/game-canvas.tsx` — remove now-unused imports and dead constants
- Test: `lib/game-contract.test.ts`

**Interfaces:**
- Consumes: every renderer module
- Produces: a single project-wide contract test

- [ ] **Step 1: Write the failing test**

```ts
// lib/game-contract.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const GAME_DIR = join(process.cwd(), "components", "game");
const RENDERERS = [
  "game-pixel.ts", "game-terrain.ts", "game-buildings.ts",
  "game-props.ts", "game-interior.ts",
];

describe("project-wide pixel contract", () => {
  it("no renderer module calls a gradient or curve API", () => {
    RENDERERS.forEach((file) => {
      const src = readFileSync(join(GAME_DIR, file), "utf8");
      [/createLinearGradient/, /createRadialGradient/, /\.arc\(/, /\.ellipse\(/,
       /bezierCurveTo/, /quadraticCurveTo/]
        .forEach((re) => expect(re.test(src), `${file} matches ${re}`).toBe(false));
    });
  });

  it("no renderer module contains a raw hex colour literal", () => {
    RENDERERS.filter((f) => f !== "game-pixel.ts").forEach((file) => {
      const src = readFileSync(join(GAME_DIR, file), "utf8");
      expect(/#[0-9a-fA-F]{6}\b/.test(src), `${file} has a hex literal`).toBe(false);
    });
  });

  it("the unused 3.1MB map.png is gone", () => {
    expect(existsSync(join(process.cwd(), "public", "game", "map.png"))).toBe(false);
  });

  it("game-canvas.tsx is no longer a monolith", () => {
    const src = readFileSync(join(GAME_DIR, "game-canvas.tsx"), "utf8");
    expect(src.split("\n").length).toBeLessThan(2500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/game-contract.test.ts`
Expected: FAIL — `map.png` still exists and `game-canvas.tsx` is still over 2,500 lines.

- [ ] **Step 3: Do the cleanup**

```bash
git rm public/game/map.png
mkdir -p docs/assets/reference
git mv public/game/Buildings_Colour2.png docs/assets/reference/Buildings_Colour2.png
```

Then strip `game-canvas.tsx` down to the React component, state, input handling, camera and render loop, removing every draw function and constant now living in a module, plus their unused imports.

- [ ] **Step 4: Run the full suite and verify the game end to end**

Run: `npx vitest run && npm run lint && npm run build`
Expected: all PASS.

Then `npm run dev` and walk the entire map: all seven buildings, the plaza fountain, every tall-grass patch, the Guild interior, and the character-skin picker. Confirm no visual regressions and no console errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(game): drop unused map.png and slim game-canvas to the component"
```

---

## Notes for the executor

- **Task 8 is a hard checkpoint.** Stop and get a visual review at 1× before starting Task 9. Everything approved during design was viewed at 4–6× zoom, and some Level 3 detail will merge at native scale. Correcting the style after Task 9 means redoing six buildings.
- **The contract tests are the point.** If a test complains about a hex literal or an `arc` call, do not weaken the test — fix the renderer. Those tests are what stop the world drifting back to illustration.
- **Reference mockups** from the design session are preserved in `.superpowers/brainstorm/62560-1788178563/content/` — `detail-level.html` is the Level 3 target and `palette.html` shows the chosen palette in context.
