import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { drawFences, drawFlowerPots, drawBushes, drawFurniture, drawTrees } from "../components/game/game-props";

function recorder() {
  const rects: { color: string }[] = [];
  const calls: string[] = [];
  // Every globalAlpha write, in order — see lib/game-interior.test.ts's
  // recorder for why a plain `globalAlpha: 1` field can't tell "restored"
  // apart from "never touched": it only remembers the last value written,
  // so deleting a renderer's entire alpha block wouldn't fail
  // `expect(ctx.globalAlpha).toBe(1)`.
  const alphaLog: number[] = [];
  let fill = "";
  let alpha = 1;
  const ctx = {
    get globalAlpha() { return alpha; },
    set globalAlpha(v: number) { alpha = v; alphaLog.push(v); },
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect() { rects.push({ color: fill }); },
    save() {}, restore() {}, translate() {}, scale() {},
    createLinearGradient() { calls.push("createLinearGradient"); return {}; },
    createRadialGradient() { calls.push("createRadialGradient"); return {}; },
    arc() { calls.push("arc"); }, ellipse() { calls.push("ellipse"); },
    imageSmoothingEnabled: true,
  };
  return { ctx, rects, calls, alphaLog };
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

  it("drawFurniture pulses globalAlpha for its streetlamps' lantern glow, then restores it to 1", () => {
    // Of the five RENDERERS, only drawFurniture ever touches globalAlpha —
    // via lantern() on each streetlamp (game-props.ts's own comment at the
    // drawStreetlamp definition: "the only place this module touches
    // globalAlpha"). The other four (fences, pots, bushes, trees) never
    // set it at all, so asserting "some non-1 value was logged" for THEM
    // would be false, not vacuous — this dual assertion only makes sense
    // where a renderer actually uses alpha. Deleting drawStreetlamp's
    // lantern() call would fail the first expectation here while leaving
    // the "all leave globalAlpha restored" test above trivially green,
    // which is exactly the vacuousness this test closes.
    const { ctx, alphaLog } = recorder();
    drawFurniture(ctx as never, 400);
    expect(alphaLog.some((v) => v !== 1), "drawFurniture never touched globalAlpha").toBe(true);
    expect(ctx.globalAlpha).toBe(1);
  });

  it("all actually draw something", () => {
    Object.entries(RENDERERS).forEach(([name, fn]) => {
      const { ctx, rects } = recorder();
      fn(ctx as never, 0);
      expect(rects.length, `${name} drew nothing`).toBeGreaterThan(0);
    });
  });
});
