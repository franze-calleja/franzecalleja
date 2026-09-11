import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { drawGuildInterior, drawStationPedestal } from "../components/game/game-interior";
import { GUILD_PROJECT_STATIONS } from "../components/game/game-data";

// Mirrors lib/game-landmarks.test.ts's recorder — captures x/y/w/h so the
// integer-coordinate contract can be checked per rect, not just colour.
function recorder() {
  const rects: { x: number; y: number; w: number; h: number; color: string }[] = [];
  const calls: string[] = [];
  let fill = "";
  const ctx = {
    globalAlpha: 1,
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect(x: number, y: number, w: number, h: number) { rects.push({ x, y, w, h, color: fill }); },
    drawImage() { calls.push("drawImage"); },
    save() {}, restore() {}, translate() {}, scale() {},
    createLinearGradient() { calls.push("createLinearGradient"); return {}; },
    createRadialGradient() { calls.push("createRadialGradient"); return {}; },
    arc() { calls.push("arc"); }, ellipse() { calls.push("ellipse"); },
    imageSmoothingEnabled: true,
  };
  return { ctx, rects, calls };
}

describe("guild interior", () => {
  it("honours the pixel contract — no curve or gradient APIs", () => {
    const { ctx, calls } = recorder();
    drawGuildInterior(ctx as never, 0, null);
    ["createLinearGradient", "createRadialGradient", "arc", "ellipse"]
      .forEach((banned) => expect(calls, `used ${banned}`).not.toContain(banned));
  });

  it("paints only palette colours", () => {
    const { ctx, rects } = recorder();
    drawGuildInterior(ctx as never, 0, null);
    expect(rects.length).toBeGreaterThan(0);
    const allowed = new Set<string>(Object.values(PAL));
    rects.forEach((r) => expect(allowed.has(r.color), `${r.color} not in palette`).toBe(true));
  });

  it("renders without a spritesheet loaded — charactersImage may be null on first frame", () => {
    const { ctx, rects } = recorder();
    expect(() => drawGuildInterior(ctx as never, 0, null)).not.toThrow();
    expect(rects.length).toBeGreaterThan(0);
  });

  it("draws a pedestal for every project station", () => {
    const { ctx, rects } = recorder();
    drawGuildInterior(ctx as never, 0, null);
    expect(GUILD_PROJECT_STATIONS.length).toBeGreaterThan(0);
    expect(rects.length).toBeGreaterThan(GUILD_PROJECT_STATIONS.length * 4);
  });

  it("draws something for each individual station's pedestal, not just in aggregate", () => {
    // The aggregate count above proves the scene grows with the station
    // list, but not that every single station actually gets drawn — a
    // renderer that only ever drew the first station could still pass a
    // pure length check if the rest of the scene is large enough. Calling
    // drawStationPedestal directly per station closes that gap.
    GUILD_PROJECT_STATIONS.forEach((station) => {
      const { ctx, rects } = recorder();
      drawStationPedestal(ctx as never, station, 0);
      expect(rects.length, `station ${station.id} drew nothing`).toBeGreaterThan(0);
    });
  });

  it("leaves globalAlpha restored to 1 after the full scene, at a non-zero time", () => {
    // t=700 is chosen (not 0) so a pulse/flicker term mid-cycle is actually
    // exercised rather than trivially starting at its rest value.
    const { ctx } = recorder();
    drawGuildInterior(ctx as never, 700, null);
    expect(ctx.globalAlpha).toBe(1);
  });

  it("leaves globalAlpha restored after a single pedestal at a non-zero time", () => {
    const { ctx } = recorder();
    drawStationPedestal(ctx as never, GUILD_PROJECT_STATIONS[0], 700);
    expect(ctx.globalAlpha).toBe(1);
  });

  it("emits only integer coordinates for every recorded rect", () => {
    // Mirrors lib/game-landmarks.test.ts's equivalent check — this exact
    // assertion caught a real regression in the basketball court (an odd
    // width divided by two for a centred position). withSprite's own
    // contract is integer logical coordinates so scaling by UNIT lands on
    // exact world pixels with no anti-aliasing; a stray /2 or /4 on an odd
    // value (e.g. a station's world y=275) would silently break that.
    const { ctx, rects } = recorder();
    drawGuildInterior(ctx as never, 123, null);
    expect(rects.length).toBeGreaterThan(0);
    rects.forEach((r) => {
      expect(Number.isInteger(r.x), `non-integer x=${r.x}`).toBe(true);
      expect(Number.isInteger(r.y), `non-integer y=${r.y}`).toBe(true);
      expect(Number.isInteger(r.w), `non-integer w=${r.w}`).toBe(true);
      expect(Number.isInteger(r.h), `non-integer h=${r.h}`).toBe(true);
    });
  });

  it("does not throw or vary its rect count across repeated calls at the same t (deterministic)", () => {
    const run = (t: number) => {
      const { ctx, rects } = recorder();
      drawGuildInterior(ctx as never, t, null);
      return rects.length;
    };
    expect(run(400)).toBe(run(400));
  });
});
