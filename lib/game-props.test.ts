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
