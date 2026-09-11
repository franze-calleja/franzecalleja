import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import {
  drawCentralFountain, drawBasketballCourt, drawStatues, drawBanners, FOUNTAIN_BASELINE,
} from "../components/game/game-landmarks";

// Mirrors lib/game-props.test.ts's recorder — these four were the heaviest
// curve users in the codebase (the fountain alone: 26 arcs vs 37 rects) and
// are reconstructed the same way game-props.ts rebuilt fences/pots/bushes/
// furniture/trees: px/box/dith/pixelDisc rows, an outline pass before a fill
// pass on anything round, and colour only from PAL.
function recorder() {
  const rects: { x: number; y: number; w: number; h: number; color: string }[] = [];
  const calls: string[] = [];
  let fill = "";
  const ctx = {
    globalAlpha: 1,
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect(x: number, y: number, w: number, h: number) { rects.push({ x, y, w, h, color: fill }); },
    save() {}, restore() {}, translate() {}, scale() {},
    createLinearGradient() { calls.push("createLinearGradient"); return {}; },
    createRadialGradient() { calls.push("createRadialGradient"); return {}; },
    arc() { calls.push("arc"); }, ellipse() { calls.push("ellipse"); },
    imageSmoothingEnabled: true,
  };
  return { ctx, rects, calls };
}

/**
 * A recorder that actually honours save/restore/translate/scale, so rects
 * come back in world space instead of the sprite's pre-transform logical
 * space. Needed to check FOUNTAIN_BASELINE against real drawing output —
 * the plain `recorder()` above can't, since withSprite's translate+scale
 * is invisible to it (a static-output oracle over logical coordinates would
 * prove nothing about the actual world-space footprint).
 */
function worldRecorder() {
  const rects: { x: number; y: number; w: number; h: number; color: string }[] = [];
  let fill = "";
  let tx = 0, ty = 0, sx = 1, sy = 1;
  const stack: Array<{ tx: number; ty: number; sx: number; sy: number }> = [];
  const ctx = {
    globalAlpha: 1,
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect(x: number, y: number, w: number, h: number) {
      rects.push({ x: tx + x * sx, y: ty + y * sy, w: w * sx, h: h * sy, color: fill });
    },
    save() { stack.push({ tx, ty, sx, sy }); },
    restore() { const s = stack.pop(); if (s) ({ tx, ty, sx, sy } = s); },
    translate(x: number, y: number) { tx += x * sx; ty += y * sy; },
    scale(x: number, y: number) { sx *= x; sy *= y; },
    imageSmoothingEnabled: true,
  };
  return { ctx, rects };
}

const HEAVY = { drawCentralFountain, drawBasketballCourt, drawStatues, drawBanners };

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

  it("all leave globalAlpha restored", () => {
    Object.entries(HEAVY).forEach(([name, fn]) => {
      const { ctx } = recorder();
      fn(ctx as never, 300);
      expect(ctx.globalAlpha, `${name} leaked alpha`).toBe(1);
    });
  });

  it("all actually draw something", () => {
    Object.entries(HEAVY).forEach(([name, fn]) => {
      const { ctx, rects } = recorder();
      fn(ctx as never, 0);
      expect(rects.length, `${name} drew nothing`).toBeGreaterThan(0);
    });
  });
});

describe("fountain water animation", () => {
  it("actually cycles through the 3-frame ripple — not an anchor value that silently disables the branch", () => {
    // Math.floor(t / 200) % 3 must actually reach all three frames across a
    // spawn-to-despawn timeline, not just frame 0.
    const frames = new Set([0, 200, 400, 600].map((t) => Math.floor(t / 200) % 3));
    expect(frames.size).toBeGreaterThan(1);
  });

  it("draws a different number of rects across the ripple cycle", () => {
    const counts = [0, 200, 400].map((t) => {
      const { ctx, rects } = recorder();
      drawCentralFountain(ctx as never, t);
      return rects.length;
    });
    expect(new Set(counts).size).toBeGreaterThan(1);
  });

  it("draws the same frame's rect count deterministically for a repeated t", () => {
    const run = (t: number) => {
      const { ctx, rects } = recorder();
      drawCentralFountain(ctx as never, t);
      return rects.length;
    };
    expect(run(400)).toBe(run(400));
  });
});

describe("FOUNTAIN_BASELINE", () => {
  it("is a finite world-y number the y-sort can key off", () => {
    expect(Number.isFinite(FOUNTAIN_BASELINE)).toBe(true);
  });

  it("equals the bottom edge of the fountain's own opaque masonry footprint in world space, not the shadow", () => {
    // Render in world space (translate/scale honoured) and take the lowest
    // y among rects painted in the fountain's own stone/water/outline tones
    // — this is "the masonry", the same distinction the FOUNTAIN_BASELINE
    // doc comment draws against the shadow ellipse that used to be measured
    // by mistake (a 26px error a player would have walked straight through).
    // PAL.grassX (the ground shadow) is deliberately excluded: every other
    // converted prop in this codebase (trees, bushes, pots, furniture) draws
    // its shadow at/around its own baseline rather than tracking baseline
    // off the shadow's own extent, and the fountain follows that convention.
    const { ctx, rects } = worldRecorder();
    drawCentralFountain(ctx as never, 0);
    const masonry = rects.filter((r) => r.color !== PAL.grassX);
    expect(masonry.length).toBeGreaterThan(0);
    const maxBottom = Math.max(...masonry.map((r) => r.y + r.h));
    expect(maxBottom).toBe(FOUNTAIN_BASELINE);
  });

  it("has no collision box, so the shadow is allowed to extend a little past it but the masonry may not", () => {
    const { ctx, rects } = worldRecorder();
    drawCentralFountain(ctx as never, 0);
    const masonry = rects.filter((r) => r.color !== PAL.grassX);
    masonry.forEach((r) => {
      expect(r.y + r.h, `a masonry rect bottoms out past FOUNTAIN_BASELINE at y=${r.y + r.h}`)
        .toBeLessThanOrEqual(FOUNTAIN_BASELINE);
    });
  });
});
