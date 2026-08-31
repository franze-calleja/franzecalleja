import { describe, it, expect } from "vitest";
import {
  isInTallGrass,
  spawnLeaves,
  drawTallGrassTips,
} from "../components/game/game-terrain";
import type { PixelCtx } from "../components/game/game-pixel";
import { TALL_GRASS_AREAS } from "../components/game/game-data";

/**
 * Records every fillRect the tips pass issues, tagged with the fillStyle in
 * effect at call time, as opaque strings — enough to compare two runs for
 * set equality without caring about the real canvas transform (withSprite's
 * save/translate/scale are no-ops here; px() only ever calls fillRect).
 */
function collectFillRects(run: (ctx: PixelCtx) => void): string[] {
  const calls: string[] = [];
  const ctx = {
    fillStyle: "",
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push(`${x},${y},${w},${h},${ctx.fillStyle}`);
    },
    save() {},
    restore() {},
    translate() {},
    scale() {},
  } as unknown as PixelCtx;
  run(ctx);
  return calls;
}

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

describe("drawTallGrassTips depth-sort band", () => {
  // The band partitions on each cell's *bottom edge* (wy + 16): a cell is
  // drawn by band (fromY, toY) iff fromY < wy + 16 <= toY. That makes any
  // two adjacent bands (0, S) and (S, MAX) — for *any* S, grid-aligned or
  // not — strictly complementary: every cell's bottom edge is either <= S
  // or > S, never both, so the bands can't double-draw or drop a cell.
  const FAR = 100000;

  // TALL_GRASS_AREAS[0] (y: 48..136, bottom edges up to 144) is the only
  // patch with any row below y=290 — the next-lowest patch (index 4,
  // "east, below the Archives") starts at y=292 (bottom edge 308) — so
  // band(0, 290) isolates patch 0 exactly, and everything it draws lands
  // at logical y < 100 (world y <= 128, /2 = 64, plus a few px of blade
  // overhang).
  const PATCH0_ONLY_BOUNDARY = 290;
  const PATCH0_Y_CEILING = 100;

  it("emits calls only for cells whose bottom edge falls in the given band", () => {
    const full = new Set(collectFillRects((ctx) => drawTallGrassTips(ctx, 0, 0, FAR)));
    const patch0Only = [...full].filter((c) => Number(c.split(",")[1]) < PATCH0_Y_CEILING);
    const band = collectFillRects(
      (ctx) => drawTallGrassTips(ctx, 0, 0, PATCH0_ONLY_BOUNDARY)
    );

    expect(band.length).toBeGreaterThan(0);
    expect(new Set(band)).toEqual(new Set(patch0Only));

    // A band with no grass patch inside it emits nothing.
    const empty = collectFillRects((ctx) => drawTallGrassTips(ctx, 0, FAR, FAR + 100));
    expect(empty).toHaveLength(0);
  });

  it.each([
    ["a patch boundary", PATCH0_ONLY_BOUNDARY],
    ["an arbitrary, non-grid-aligned split matching the real call sites", 301],
    ["another arbitrary split, mid-patch", 400],
  ])("splits strictly at %s: before/after are disjoint and their union is exactly the unbounded call", (_label, split) => {
    const full = new Set(collectFillRects((ctx) => drawTallGrassTips(ctx, 0, 0, FAR)));
    const before = new Set(collectFillRects((ctx) => drawTallGrassTips(ctx, 0, 0, split)));
    const after = new Set(collectFillRects((ctx) => drawTallGrassTips(ctx, 0, split, FAR)));

    // (1) union equals exactly the unbounded call — no tuft lost.
    const union = new Set([...before, ...after]);
    expect(union).toEqual(full);

    // (2) disjoint — no tuft drawn twice (this is what the earlier,
    // overlap-tolerant filter got wrong: a row straddling the boundary
    // would land in both sets).
    for (const rect of before) expect(after.has(rect)).toBe(false);
    expect(before.size + after.size).toBe(full.size);
  });
});
