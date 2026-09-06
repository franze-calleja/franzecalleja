import { describe, it, expect } from "vitest";
import {
  isInTallGrass,
  spawnLeaves,
  collectTallGrassTips,
} from "../components/game/game-terrain";
import { hash, sortByBaseline, type PixelCtx, type Drawable } from "../components/game/game-pixel";
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
 * patch becomes its own Drawable, and its baseline is `wy + 32` — **not**
 * the cell's literal bottom edge (`wy + 16`). That extra 16px replicates
 * the old renderer's own fudge factor (it split bands at
 * `playerFeetY - 16`, not `playerFeetY`) and matters: `wy + 16` looks like
 * the more "obvious" baseline and still passes a test that only checks
 * static per-cell rendering, but it shifts an entire row of tufts, in
 * every patch, 16 world px closer to the camera than the pre-refactor
 * renderer drew them (Fix round 1 caught this). The "genuine interleaving"
 * test below is what actually catches it — see the comment there.
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

  it("gives every drawable a finite numeric baseline equal to wy + 32 (not the cell's literal bottom edge, wy + 16)", () => {
    const { ctx } = recordingCtx();
    const drawables = collectTallGrassTips(ctx, 0);
    drawables.forEach((d) => {
      expect(Number.isFinite(d.baseline), `baseline ${d.baseline} is not finite`).toBe(true);
    });

    const expectedBaselines = expectedCells().map((c) => c.wy + 32).sort((a, b) => a - b);
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

  /**
   * The pixel-oracle test above only proves each tuft's *own* rendering is
   * unchanged — it never constructs a player baseline or checks how a tuft
   * interleaves with one, so it cannot catch a baseline-formula regression
   * (Fix round 1: it didn't, and a first draft of *this* test didn't either
   * — see the note on `cellAt` below). This test does.
   *
   * TALL_GRASS_AREAS[0] is {x:286, y:48, w:58, h:88}, giving grid rows at
   * wy = 48, 64, 80, 96, 112, 128. Pick playerFeetY = 120 (a plain number,
   * standing in for a real `p.y + 28`):
   *
   *  - "justNorth" (wy=96, cell bottom 112) is the regression-sensitive
   *    case. The pre-Task-16 renderer split bands at `playerFeetY - 16`
   *    and drew a cell in front whenever `wy+16 > playerFeetY-16`, i.e.
   *    `wy+32 > playerFeetY`: here 96+32=128 > 120, so the old renderer
   *    drew it in front (after the player). The *literal* bottom edge
   *    (wy+16=112) is <= 120, so if collectTallGrassTips used `wy + 16`
   *    this cell would wrongly sort behind the player instead — exactly
   *    the Fix round 1 bug. `wy + 32` (128) correctly sorts after.
   *  - "wellNorth" (wy=48, cell bottom 64) sorts behind under either
   *    formula (48+32=80 < 120, and 48+16=64 < 120 too) — a sanity
   *    contrast, not the regression case itself.
   *
   * `cellAt` locates a Drawable by its *world position* (wx, wy), via the
   * same deterministic enumeration order `expectedCells()` uses — not by
   * an assumed baseline value. Looking a cell up by baseline instead would
   * silently defeat this test: under a `wy + 16` regression, baseline 128
   * belongs to a *different* cell (wy=112, one row further south), so a
   * `tufts.find(t => t.baseline === 128)` lookup would quietly compare the
   * wrong cell and pass anyway. (A first draft of this test did exactly
   * that, and it passed against both `wy + 16` and `wy + 32` — i.e. it
   * tested nothing.)
   */
  function cellAt(wantWx: number, wantWy: number): number {
    let index = 0;
    for (const g of TALL_GRASS_AREAS) {
      for (let wy = g.y; wy < g.y + g.h; wy += 16) {
        for (let wx = g.x; wx < g.x + g.w; wx += 16) {
          if (hash(wx, wy) % 4 === 0) continue;
          if (wx === wantWx && wy === wantWy) return index;
          index++;
        }
      }
    }
    return -1;
  }

  it("a tuft just north of the player's feet still draws after them (in front), matching the pre-Task-16 two-band split", () => {
    const { ctx } = recordingCtx();
    const tufts = collectTallGrassTips(ctx, 0);

    // Both wx values are confirmed non-gap cells (hash(wx,wy) % 4 !== 0) at
    // their respective wy in TALL_GRASS_AREAS[0].
    const justNorthIndex = cellAt(286, 96);
    const wellNorthIndex = cellAt(302, 48);
    expect(justNorthIndex, "cell wx=286,wy=96 not found — did TALL_GRASS_AREAS[0] change?").toBeGreaterThanOrEqual(0);
    expect(wellNorthIndex, "cell wx=302,wy=48 not found — did TALL_GRASS_AREAS[0] change?").toBeGreaterThanOrEqual(0);

    const justNorth = tufts[justNorthIndex];
    const wellNorth = tufts[wellNorthIndex];
    const playerFeetY = 120;
    const player: Drawable = { baseline: playerFeetY, draw: () => {} };

    const order = sortByBaseline([justNorth, wellNorth, player]).map((d) => {
      if (d === player) return "player";
      return d === justNorth ? "justNorth" : "wellNorth";
    });

    expect(order).toEqual(["wellNorth", "player", "justNorth"]);
  });
});
