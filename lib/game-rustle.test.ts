import { describe, it, expect } from "vitest";
import {
  isInTallGrass,
  spawnLeaves,
  collectTallGrassTips,
} from "../components/game/game-terrain";
import { hash, type PixelCtx } from "../components/game/game-pixel";
import { PAL } from "../components/game/game-palette";
import { TALL_GRASS_AREAS } from "../components/game/game-data";

/**
 * Records every fillRect a Drawable's draw() issues, tagged with the
 * fillStyle in effect at call time, as opaque strings — enough to compare
 * runs for set equality without caring about the real canvas transform
 * (withSprite's save/translate/scale are no-ops here; px() only ever calls
 * fillRect).
 */
function recordingCtx() {
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
  return { ctx, calls };
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

/**
 * Task 16 replaced the old two-call, hand-rolled y-band split
 * (`drawTallGrassTips(ctx, t, fromY, toY)`, one call for tufts above the
 * player's feet and one for tufts at/below) with per-tuft baselines that
 * feed the same generic sort every other entity in the scene layer uses.
 * These tests cover the new mechanism: every non-gap grid cell in every
 * patch becomes its own Drawable, and its baseline is exactly the cell's
 * own bottom edge (`wy + 16`) — the value the old code partitioned bands
 * on.
 */
describe("collectTallGrassTips", () => {
  /** Reproduces the non-gap cell enumeration (patch grid + hash gap rule)
   *  as an independent oracle for the count and baseline assertions. */
  function expectedCells(): Array<{ wx: number; wy: number }> {
    const cells: Array<{ wx: number; wy: number }> = [];
    for (const g of TALL_GRASS_AREAS) {
      for (let wy = g.y; wy < g.y + g.h; wy += 16) {
        for (let wx = g.x; wx < g.x + g.w; wx += 16) {
          if (hash(wx, wy) % 4 === 0) continue;
          cells.push({ wx, wy });
        }
      }
    }
    return cells;
  }

  it("returns exactly one drawable per non-gap grid cell", () => {
    const { ctx } = recordingCtx();
    const drawables = collectTallGrassTips(ctx, 0);
    expect(drawables.length).toBeGreaterThan(0);
    expect(drawables.length).toBe(expectedCells().length);
  });

  it("gives every drawable a finite numeric baseline equal to its cell's bottom edge (wy + 16)", () => {
    const { ctx } = recordingCtx();
    const drawables = collectTallGrassTips(ctx, 0);
    drawables.forEach((d) => {
      expect(Number.isFinite(d.baseline), `baseline ${d.baseline} is not finite`).toBe(true);
    });

    const expectedBaselines = expectedCells().map((c) => c.wy + 16).sort((a, b) => a - b);
    const actualBaselines = drawables.map((d) => d.baseline).sort((a, b) => a - b);
    expect(actualBaselines).toEqual(expectedBaselines);
  });

  it("draws each cell exactly once — no rect is emitted twice", () => {
    // A duplicated cell (the exact failure mode of the old overlapping
    // y-bands) would re-emit that cell's 3 identical fillRect calls, so a
    // straight count vs. distinct-signature comparison catches it without
    // needing to re-derive wx/wy from the closure.
    const { ctx, calls } = recordingCtx();
    const drawables = collectTallGrassTips(ctx, 0);
    drawables.forEach((d) => d.draw());

    expect(calls.length).toBe(drawables.length * 3);
    expect(new Set(calls).size).toBe(calls.length);
  });

  it("drawing every collected tuft reproduces the pre-Task-16 renderer's pixels exactly", () => {
    // Independent oracle: the old cell math (grid walk, gap rule, sway,
    // three px() rects), inlined here rather than calling the code under
    // test twice, so this actually checks the visual effect survived the
    // refactor instead of just re-asserting the implementation.
    const { ctx: oracleCtx, calls: oracleCalls } = recordingCtx();
    for (const g of TALL_GRASS_AREAS) {
      for (let wy = g.y; wy < g.y + g.h; wy += 16) {
        for (let wx = g.x; wx < g.x + g.w; wx += 16) {
          if (hash(wx, wy) % 4 === 0) continue;
          const x = wx / 2, y = wy / 2;
          const sway = Math.round(Math.sin(0 * 0.002 + hash(wx, wy) * 0.1) * 1);
          oracleCtx.fillStyle = PAL.tall;
          oracleCtx.fillRect(x + 1 + sway, y, 1, 5);
          oracleCtx.fillStyle = PAL.tallL;
          oracleCtx.fillRect(x + 4 + sway, y - 1, 1, 6);
          oracleCtx.fillStyle = PAL.tall;
          oracleCtx.fillRect(x + 6 + sway, y + 1, 1, 4);
        }
      }
    }

    const { ctx: realCtx, calls: realCalls } = recordingCtx();
    collectTallGrassTips(realCtx, 0).forEach((d) => d.draw());

    expect(realCalls.length).toBe(oracleCalls.length);
    expect(new Set(realCalls)).toEqual(new Set(oracleCalls));
  });
});
