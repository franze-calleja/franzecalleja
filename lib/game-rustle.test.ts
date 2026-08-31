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
  // TALL_GRASS_AREAS[0] (y: 48..136) is the only patch below y=290 — the
  // next-lowest patch (index 4, "east, below the Archives") starts at
  // y=292 — so band(0, 290) isolates patch 0 with no straddling row, and
  // everything patch 0 draws lands at logical y < 100 (world y <= 128,
  // /2 = 64, plus a few px of outline/blade overhang).
  const FAR = 100000;
  const PATCH0_ONLY_BOUNDARY = 290;
  const PATCH0_Y_CEILING = 100;

  it("emits calls only for cells whose row overlaps the given band", () => {
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

  it("splits cleanly at a patch boundary — the two bands don't overlap", () => {
    const full = new Set(collectFillRects((ctx) => drawTallGrassTips(ctx, 0, 0, FAR)));
    const low = new Set(
      collectFillRects((ctx) => drawTallGrassTips(ctx, 0, 0, PATCH0_ONLY_BOUNDARY))
    );
    const high = new Set(
      collectFillRects((ctx) => drawTallGrassTips(ctx, 0, PATCH0_ONLY_BOUNDARY, FAR))
    );

    for (const rect of low) expect(high.has(rect)).toBe(false);
    expect(low.size + high.size).toBe(full.size);
  });

  it("covers every rect from a single unbounded call, even with an " +
    "arbitrary (non-grid-aligned) split like the real call sites use", () => {
    const full = new Set(collectFillRects((ctx) => drawTallGrassTips(ctx, 0, 0, FAR)));
    const low = collectFillRects((ctx) => drawTallGrassTips(ctx, 0, 0, 301));
    const high = collectFillRects((ctx) => drawTallGrassTips(ctx, 0, 301, FAR));

    const union = new Set([...low, ...high]);
    expect(union).toEqual(full); // no tuft lost — every rect is somewhere in the union
    for (const rect of full) expect(union.has(rect)).toBe(true);
  });
});
