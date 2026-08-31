import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { chimneySmoke, lantern, flowerBox, ivy } from "../components/game/game-pixel";

function recorder() {
  const rects: { x: number; y: number; w: number; h: number; color: string; alpha: number }[] = [];
  let fill = "";
  const ctx = {
    globalAlpha: 1,
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect(x: number, y: number, w: number, h: number) {
      rects.push({ x, y, w, h, color: fill, alpha: ctx.globalAlpha });
    },
    save() {}, restore() {}, translate() {}, scale() {},
    imageSmoothingEnabled: true,
  };
  return { ctx, rects };
}

describe("animated props", () => {
  it("chimneySmoke restores globalAlpha to 1", () => {
    const { ctx } = recorder();
    chimneySmoke(ctx, 10, 0, 1234);
    expect(ctx.globalAlpha).toBe(1);
  });

  it("lantern restores globalAlpha to 1", () => {
    const { ctx } = recorder();
    lantern(ctx, 10, 40, 999);
    expect(ctx.globalAlpha).toBe(1);
  });

  it("smoke rises over time", () => {
    const a = recorder(); chimneySmoke(a.ctx, 10, 0, 0);
    const b = recorder(); chimneySmoke(b.ctx, 10, 0, 400);
    const meanY = (r: typeof a) => r.rects.reduce((s, p) => s + p.y, 0) / r.rects.length;
    expect(meanY(b)).toBeLessThan(meanY(a));
  });

  it("lantern flame brightness varies with time", () => {
    const a = recorder(); lantern(a.ctx, 0, 0, 0);
    const b = recorder(); lantern(b.ctx, 0, 0, 260);
    const glow = (r: typeof a) => r.rects.filter((p) => p.color === PAL.gold).map((p) => p.alpha);
    expect(glow(a)).not.toEqual(glow(b));
  });

  it("static props never touch alpha", () => {
    const { ctx, rects } = recorder();
    flowerBox(ctx, 10, 40);
    ivy(ctx, 60, 20, 50);
    rects.forEach((r) => expect(r.alpha).toBe(1));
  });

  it("props only paint palette colours", () => {
    const { ctx, rects } = recorder();
    flowerBox(ctx, 10, 40);
    ivy(ctx, 60, 20, 50);
    chimneySmoke(ctx, 10, 0, 500);
    lantern(ctx, 30, 40, 500);
    const allowed = new Set<string>(Object.values(PAL));
    rects.forEach((r) => expect(allowed.has(r.color), `${r.color} not in palette`).toBe(true));
  });
});
