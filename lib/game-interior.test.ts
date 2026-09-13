import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import {
  drawAzraSanctuaryInterior,
  drawDevopsStationInterior,
  drawGuildInterior,
  drawStationPedestal,
  drawVillagePostInterior,
} from "../components/game/game-interior";
import { GUILD_PROJECT_STATIONS } from "../components/game/game-data";

// Mirrors lib/game-landmarks.test.ts's recorder — captures x/y/w/h so the
// integer-coordinate contract can be checked per rect, not just colour.
function recorder() {
  const rects: { x: number; y: number; w: number; h: number; color: string }[] = [];
  const calls: string[] = [];
  // Every globalAlpha write, in order — a plain `globalAlpha: 1` field
  // (the shape used before this fix, and still used by lib/game-props.test.ts
  // and lib/game-landmarks.test.ts) only ever reflects the LAST value
  // written, so "expect(ctx.globalAlpha).toBe(1)" passes identically
  // whether the renderer pulses alpha and restores it, or never touches
  // alpha at all — deleting the entire pulse/ember block wouldn't fail
  // that assertion. Logging every write lets a test also assert alpha was
  // actually *used* mid-draw, not just that it ended at 1.
  const alphaLog: number[] = [];
  let fill = "";
  let alpha = 1;
  const ctx = {
    get globalAlpha() { return alpha; },
    set globalAlpha(v: number) { alpha = v; alphaLog.push(v); },
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
  return { ctx, rects, calls, alphaLog };
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

  it("pulses globalAlpha for the hearth embers and every pedestal, then restores it to 1", () => {
    // t=700 is chosen (not 0) so a pulse/flicker term mid-cycle is actually
    // exercised rather than trivially starting at its rest value. Asserting
    // a non-1 value was logged is what makes this test able to fail: with
    // the old plain-field recorder, deleting the embers'/pedestals'
    // try/finally alpha block entirely would still leave
    // `ctx.globalAlpha === 1` true, since the field simply never moved.
    const { ctx, alphaLog } = recorder();
    drawGuildInterior(ctx as never, 700, null);
    expect(alphaLog.some((v) => v !== 1), "globalAlpha was never touched").toBe(true);
    expect(ctx.globalAlpha).toBe(1);
  });

  it("pulses globalAlpha for a single pedestal's display, then restores it to 1", () => {
    const { ctx, alphaLog } = recorder();
    drawStationPedestal(ctx as never, GUILD_PROJECT_STATIONS[0], 700);
    expect(alphaLog.some((v) => v !== 1), "globalAlpha was never touched").toBe(true);
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

describe("village post interior", () => {
  it("honours the pixel contract and paints only palette colours", () => {
    const { ctx, rects, calls } = recorder();
    drawVillagePostInterior(ctx as never, 700);

    expect(rects.length).toBeGreaterThan(100);
    ["createLinearGradient", "createRadialGradient", "arc", "ellipse"]
      .forEach((banned) => expect(calls, `used ${banned}`).not.toContain(banned));

    const allowed = new Set<string>(Object.values(PAL));
    rects.forEach((r) => expect(allowed.has(r.color), `${r.color} not in palette`).toBe(true));
  });

  it("renders deterministically with integer-coordinate pixel art", () => {
    const render = () => {
      const { ctx, rects } = recorder();
      drawVillagePostInterior(ctx as never, 400);
      return rects;
    };
    const first = render();
    const second = render();

    expect(first).toEqual(second);
    first.forEach((rect) => {
      expect(Number.isInteger(rect.x)).toBe(true);
      expect(Number.isInteger(rect.y)).toBe(true);
      expect(Number.isInteger(rect.w)).toBe(true);
      expect(Number.isInteger(rect.h)).toBe(true);
    });
  });
});

describe("AZRA sanctuary interior", () => {
  it("honours the pixel contract and restores its Oracle Core pulse", () => {
    const { ctx, rects, calls, alphaLog } = recorder();
    drawAzraSanctuaryInterior(ctx as never, 700);

    expect(rects.length).toBeGreaterThan(100);
    ["createLinearGradient", "createRadialGradient", "arc", "ellipse"]
      .forEach((banned) => expect(calls, `used ${banned}`).not.toContain(banned));
    expect(alphaLog.some((value) => value !== 1)).toBe(true);
    expect(ctx.globalAlpha).toBe(1);

    const allowed = new Set<string>(Object.values(PAL));
    rects.forEach((rect) => {
      expect(allowed.has(rect.color), `${rect.color} not in palette`).toBe(true);
      expect(Number.isInteger(rect.x)).toBe(true);
      expect(Number.isInteger(rect.y)).toBe(true);
      expect(Number.isInteger(rect.w)).toBe(true);
      expect(Number.isInteger(rect.h)).toBe(true);
    });
  });

  it("animates the Oracle Core and data motes", () => {
    const first = recorder();
    const second = recorder();
    drawAzraSanctuaryInterior(first.ctx as never, 0);
    drawAzraSanctuaryInterior(second.ctx as never, 180);
    expect(first.rects).not.toEqual(second.rects);
  });
});

describe("DevOps station interior", () => {
  it("honours the pixel contract and restores its console pulse", () => {
    const { ctx, rects, calls, alphaLog } = recorder();
    drawDevopsStationInterior(ctx as never, 700);

    expect(rects.length).toBeGreaterThan(100);
    ["createLinearGradient", "createRadialGradient", "arc", "ellipse"]
      .forEach((banned) => expect(calls, `used ${banned}`).not.toContain(banned));
    expect(alphaLog.some((value) => value !== 1)).toBe(true);
    expect(ctx.globalAlpha).toBe(1);

    const allowed = new Set<string>(Object.values(PAL));
    rects.forEach((rect) => {
      expect(allowed.has(rect.color), `${rect.color} not in palette`).toBe(true);
      expect(Number.isInteger(rect.x)).toBe(true);
      expect(Number.isInteger(rect.y)).toBe(true);
      expect(Number.isInteger(rect.w)).toBe(true);
      expect(Number.isInteger(rect.h)).toBe(true);
    });
  });

  it("animates the station status indicators", () => {
    const first = recorder();
    const second = recorder();
    drawDevopsStationInterior(first.ctx as never, 0);
    drawDevopsStationInterior(second.ctx as never, 240);
    expect(first.rects).not.toEqual(second.rects);
  });
});
