import { describe, it, expect } from "vitest";
import { sortByBaseline, type Drawable, type PixelCtx } from "../components/game/game-pixel";
import { collectBuildings } from "../components/game/game-buildings";
import {
  collectFences, collectFlowerPots, collectBushes, collectFurniture, collectTrees,
} from "../components/game/game-props";
import { collectTallGrassTips } from "../components/game/game-terrain";
import { collectStatues, collectBanners } from "../components/game/game-landmarks";

/**
 * None of the collect* functions touch `ctx` until an individual
 * Drawable's `draw()` is invoked — baseline computation is pure data math.
 * A dummy object stands in for the canvas context wherever a test only
 * inspects `.baseline` and never calls `.draw()`.
 */
const dummyCtx = {} as unknown as CanvasRenderingContext2D;
const dummyPixelCtx = {} as unknown as PixelCtx;

describe("sortByBaseline", () => {
  it("sorts a lower baseline before a higher one", () => {
    const far: Drawable = { baseline: 10, draw: () => {} };
    const near: Drawable = { baseline: 500, draw: () => {} };
    const sorted = sortByBaseline([near, far]);
    expect(sorted).toEqual([far, near]);
  });

  it("is stable: equal baselines keep their input order", () => {
    const log: string[] = [];
    const a: Drawable = { baseline: 100, draw: () => log.push("a") };
    const b: Drawable = { baseline: 100, draw: () => log.push("b") };
    const c: Drawable = { baseline: 100, draw: () => log.push("c") };

    sortByBaseline([a, b, c]).forEach((d) => d.draw());
    expect(log).toEqual(["a", "b", "c"]);

    // Reversing the fixed input order reverses the output too — proving
    // the stability comes from preserving *whatever* order the caller
    // builds the list in, not from re-deriving some canonical order.
    log.length = 0;
    sortByBaseline([c, b, a]).forEach((d) => d.draw());
    expect(log).toEqual(["c", "b", "a"]);
  });

  it("does not mutate its input array", () => {
    const items: Drawable[] = [
      { baseline: 500, draw: () => {} },
      { baseline: 10, draw: () => {} },
    ];
    const original = [...items];
    sortByBaseline(items);
    expect(items).toEqual(original);
  });
});

/**
 * This is the Task 16 bug, asserted directly: with a fixed draw order the
 * player always painted after (on top of) buildings, so walking to a
 * building's doorway never occluded them. A real building's baseline
 * (collectBuildings' own `y + height`) must sort against a synthetic
 * player Drawable exactly the way the render loop's merged scene list
 * would.
 */
describe("building vs. player occlusion", () => {
  const [firstBuilding] = collectBuildings(dummyPixelCtx, 0);

  it("a building whose baseline is below (south of) the player's draws after them — player occluded", () => {
    const log: string[] = [];
    const player: Drawable = { baseline: firstBuilding.baseline - 5, draw: () => log.push("player") };
    const building: Drawable = { baseline: firstBuilding.baseline, draw: () => log.push("building") };

    sortByBaseline([building, player]).forEach((d) => d.draw());

    expect(log).toEqual(["player", "building"]); // building painted last -> on top -> player hidden
  });

  it("a building whose baseline is above (north of) the player's draws before them — player in front", () => {
    const log: string[] = [];
    const player: Drawable = { baseline: firstBuilding.baseline + 5, draw: () => log.push("player") };
    const building: Drawable = { baseline: firstBuilding.baseline, draw: () => log.push("building") };

    sortByBaseline([building, player]).forEach((d) => d.draw());

    expect(log).toEqual(["building", "player"]); // player painted last -> on top -> in front
  });
});

describe("every collected drawable has a finite numeric baseline", () => {
  const categories: Array<[string, Drawable[]]> = [
    ["fences", collectFences(dummyCtx, 0)],
    ["flower pots", collectFlowerPots(dummyCtx, 0)],
    ["bushes", collectBushes(dummyCtx, 0)],
    ["furniture", collectFurniture(dummyCtx, 0)],
    ["trees", collectTrees(dummyCtx, 0)],
    ["buildings", collectBuildings(dummyPixelCtx, 0)],
    ["statues", collectStatues(dummyCtx, 0)],
    ["banners", collectBanners(dummyCtx, 0)],
    ["tall grass tufts", collectTallGrassTips(dummyPixelCtx, 0)],
  ];

  it.each(categories)("%s: every drawable's baseline is a finite number", (name, drawables) => {
    expect(drawables.length, `${name} collected nothing`).toBeGreaterThan(0);
    drawables.forEach((d, i) => {
      expect(typeof d.baseline, `${name}[${i}].baseline is not a number`).toBe("number");
      expect(Number.isFinite(d.baseline), `${name}[${i}].baseline (${d.baseline}) is not finite`).toBe(true);
    });
  });

  it("collects a non-trivial total scene (roughly 250-300 drawables once tall-grass tufts are counted)", () => {
    // Props/buildings/landmarks alone are ~70 entities, but tall-grass
    // tufts (one per non-gap 16px grid cell, across six patches) dominate
    // the real total — around 245 of them. Sorting a per-frame array this
    // size is still trivial; this just guards the earlier "~80" estimate
    // (written before tall grass was folded into the sort) from misleading
    // the next reader about the actual scene size.
    const total = categories.reduce((sum, [, drawables]) => sum + drawables.length, 0);
    expect(total).toBeGreaterThan(200);
  });
});
