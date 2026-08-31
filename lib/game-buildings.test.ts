import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { BUILDINGS } from "../components/game/game-buildings";
import { WORLD_OBJECTS } from "../components/game/game-data";

function recorder() {
  const rects: { x: number; y: number; w: number; h: number; color: string }[] = [];
  const calls: string[] = [];
  let fill = "";
  const ctx = {
    globalAlpha: 1,
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect(x: number, y: number, w: number, h: number) { rects.push({ x, y, w, h, color: fill }); },
    save() { calls.push("save"); }, restore() { calls.push("restore"); },
    translate() { calls.push("translate"); }, scale() { calls.push("scale"); },
    createLinearGradient() { calls.push("createLinearGradient"); return {}; },
    createRadialGradient() { calls.push("createRadialGradient"); return {}; },
    arc() { calls.push("arc"); }, ellipse() { calls.push("ellipse"); },
    imageSmoothingEnabled: true,
  };
  return { ctx, rects, calls };
}

describe("Projects Showcase Guild", () => {
  it("is registered at the coordinates the world object declares", () => {
    const spec = BUILDINGS["projects-guild"];
    const obj = WORLD_OBJECTS.find((o) => o.name === "Projects Showcase Guild")!;
    expect(spec.x).toBe(obj.x);
    expect(spec.y).toBe(obj.y);
  });

  it("honours the pixel contract — no gradients, no curves", () => {
    const { ctx, calls } = recorder();
    BUILDINGS["projects-guild"].draw(ctx, 0);
    ["createLinearGradient", "createRadialGradient", "arc", "ellipse"]
      .forEach((banned) => expect(calls).not.toContain(banned));
  });

  it("paints only palette colours", () => {
    const { ctx, rects } = recorder();
    BUILDINGS["projects-guild"].draw(ctx, 0);
    const allowed = new Set<string>(Object.values(PAL));
    rects.forEach((r) => expect(allowed.has(r.color), `${r.color} not in palette`).toBe(true));
  });

  it("stays within its 70x55 logical footprint", () => {
    const { ctx, rects } = recorder();
    BUILDINGS["projects-guild"].draw(ctx, 0);
    // Chimney and hanging sign may overhang above and to the left by design.
    rects.forEach((r) => {
      expect(r.x).toBeGreaterThanOrEqual(-4);
      expect(r.x + r.w).toBeLessThanOrEqual(74);
      expect(r.y + r.h).toBeLessThanOrEqual(60);
    });
  });

  it("animates — output differs between two timestamps", () => {
    const a = recorder(); BUILDINGS["projects-guild"].draw(a.ctx, 0);
    const b = recorder(); BUILDINGS["projects-guild"].draw(b.ctx, 800);
    expect(JSON.stringify(a.rects)).not.toBe(JSON.stringify(b.rects));
  });
});
