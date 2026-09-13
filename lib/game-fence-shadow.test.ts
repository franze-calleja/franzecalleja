import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { fenceRunHorizontal, fenceRunVertical } from "../components/game/game-props";
import type { PixelCtx } from "../components/game/game-pixel";

interface Rect { x: number; y: number; w: number; h: number; color: string }

function recorder() {
  const rects: Rect[] = [];
  const calls: string[] = [];
  let fill = "";
  const ctx: PixelCtx = {
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect(x: number, y: number, w: number, h: number) { rects.push({ x, y, w, h, color: fill }); },
    save() {}, restore() {}, translate() {}, scale() {},
  } as unknown as PixelCtx & { fillStyle: string };
  (ctx as unknown as { arc: () => void }).arc = () => calls.push("arc");
  (ctx as unknown as { ellipse: () => void }).ellipse = () => calls.push("ellipse");
  return { ctx, rects, calls };
}

describe("fence ground shadow (Task 15 / Task 10 follow-up)", () => {
  it("fenceRunHorizontal paints a 3-row opaque grassX shadow, narrow-wide-narrow", () => {
    const { ctx, rects } = recorder();
    fenceRunHorizontal(ctx, 40);
    const shadowRows = rects.filter((r) => r.color === PAL.grassX);
    expect(shadowRows.length, "expected a shadow").toBeGreaterThanOrEqual(3);

    const byY = new Map<number, number>();
    shadowRows.forEach((r) => byY.set(r.y, (byY.get(r.y) ?? 0) + r.w));
    const ys = [...byY.keys()].sort((a, b) => a - b);
    expect(ys.length, "shadow should occupy 3 distinct rows").toBe(3);

    const [top, mid, bottom] = ys.map((y) => byY.get(y)!);
    expect(mid, "the middle row must be the widest (narrow-wide-narrow)").toBeGreaterThan(top);
    expect(mid, "the middle row must be the widest (narrow-wide-narrow)").toBeGreaterThan(bottom);
    expect(top).toBe(bottom);
  });

  it("fenceRunHorizontal's shadow never uses alpha or ctx.ellipse/arc", () => {
    const { ctx, calls } = recorder();
    fenceRunHorizontal(ctx, 40);
    expect(calls).not.toContain("ellipse");
    expect(calls).not.toContain("arc");
    expect(ctx.globalAlpha).toBe(1);
  });

  it("fenceRunHorizontal's shadow scales with fence length", () => {
    const short = recorder();
    fenceRunHorizontal(short.ctx, 20);
    const long = recorder();
    fenceRunHorizontal(long.ctx, 80);

    const widest = (rects: Rect[]) =>
      Math.max(...rects.filter((r) => r.color === PAL.grassX).map((r) => r.w));

    expect(widest(long.rects)).toBeGreaterThan(widest(short.rects));
  });

  it("fenceRunHorizontal's shadow sits below the fence body, not overlapping the rails", () => {
    const { ctx, rects } = recorder();
    fenceRunHorizontal(ctx, 40);
    const THICK = 8; // matches the constant inside fenceRunHorizontal
    const shadowRows = rects.filter((r) => r.color === PAL.grassX);
    shadowRows.forEach((r) => expect(r.y).toBeGreaterThanOrEqual(THICK));
  });

  it("fenceRunVertical paints a 3-column opaque grassX shadow, narrow-wide-narrow", () => {
    const { ctx, rects } = recorder();
    fenceRunVertical(ctx, 40);
    const shadowCols = rects.filter((r) => r.color === PAL.grassX);
    expect(shadowCols.length, "expected a shadow").toBeGreaterThanOrEqual(3);

    // Assert each rect's own width, not just that 3 distinct x-keys exist —
    // grouping by x and summing h (as this test used to) cannot see a column
    // that is itself 2 world px wide (fix round 2 / review item 6: the
    // middle column used to be drawn as one w=2 rect, doubling its own
    // coverage to 4 columns total while still reporting 3 distinct x-keys).
    shadowCols.forEach((r) =>
      expect(r.w, `shadow rect at x=${r.x} is ${r.w} world px wide, expected exactly 1`).toBe(1)
    );

    const byX = new Map<number, number>();
    shadowCols.forEach((r) => byX.set(r.x, (byX.get(r.x) ?? 0) + r.h));
    const xs = [...byX.keys()].sort((a, b) => a - b);
    expect(xs.length, "shadow should occupy 3 distinct columns").toBe(3);
    // ...and that those 3 columns are contiguous (no gap, no overlap) —
    // mirrors fenceRunHorizontal's 3 contiguous rows.
    expect(xs[1]).toBe(xs[0] + 1);
    expect(xs[2]).toBe(xs[1] + 1);

    const [left, mid, right] = xs.map((x) => byX.get(x)!);
    expect(mid, "the middle column must be the tallest (narrow-wide-narrow)").toBeGreaterThan(left);
    expect(mid, "the middle column must be the tallest (narrow-wide-narrow)").toBeGreaterThan(right);
    expect(left).toBe(right);
  });

  it("fenceRunVertical's shadow scales with fence length", () => {
    const short = recorder();
    fenceRunVertical(short.ctx, 20);
    const long = recorder();
    fenceRunVertical(long.ctx, 80);

    const tallest = (rects: Rect[]) =>
      Math.max(...rects.filter((r) => r.color === PAL.grassX).map((r) => r.h));

    expect(tallest(long.rects)).toBeGreaterThan(tallest(short.rects));
  });
});
