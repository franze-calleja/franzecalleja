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
  const stack: Array<{ tx: number; ty: number; sx: number; sy: number }> = [];

  const ctx = {
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; calls.push({ op: "fillStyle", args: [v] }); },
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push({ op: "fillRect", args: [x, y, w, h] });
      rects.push({ x: tx + x * sx, y: ty + y * sy, w: w * sx, h: h * sy, color: fill });
    },
    save() { calls.push({ op: "save", args: [] }); stack.push({ tx, ty, sx, sy }); },
    restore() { calls.push({ op: "restore", args: [] }); const state = stack.pop(); if (state) { tx = state.tx; ty = state.ty; sx = state.sx; sy = state.sy; } },
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

  it("restores the context even when draw throws", () => {
    const { ctx, calls } = fakeCtx();
    expect(() => withSprite(ctx, 10, 10, () => { throw new Error("boom"); })).toThrow("boom");
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
