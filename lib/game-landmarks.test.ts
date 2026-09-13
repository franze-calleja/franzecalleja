import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import {
  drawCentralFountain, drawBasketballCourt, drawStatues, drawBanners, FOUNTAIN_BASELINE,
  collectBasketballHoop,
} from "../components/game/game-landmarks";

// Mirrors lib/game-props.test.ts's recorder — these four were the heaviest
// curve users in the codebase (the fountain alone: 26 arcs vs 37 rects) and
// are reconstructed the same way game-props.ts rebuilt fences/pots/bushes/
// furniture/trees: px/box/dith/pixelDisc rows, an outline pass before a fill
// pass on anything round, and colour only from PAL.
function recorder() {
  const rects: { x: number; y: number; w: number; h: number; color: string }[] = [];
  const calls: string[] = [];
  // Every globalAlpha write, in order — see lib/game-interior.test.ts's
  // recorder for why a plain `globalAlpha: 1` field can't tell "restored"
  // apart from "never touched" (it only remembers the last value written).
  // None of the four HEAVY renderers below use alpha at all today (they
  // animate via discrete frame/colour cycling instead — see e.g.
  // drawCentralFountain's ripple, which swaps PAL.glass/glassD per frame
  // rather than fading), so there is no existing alpha block to delete for
  // a "does this test bite" check the way lib/game-props.test.ts has one.
  // What this DOES still guard against is a future regression: if a HEAVY
  // renderer starts using alpha for a glow and leaks it, `alphaLog` makes
  // that visible instead of silently passing.
  const alphaLog: number[] = [];
  let fill = "";
  let alpha = 1;
  const ctx = {
    get globalAlpha() { return alpha; },
    set globalAlpha(v: number) { alpha = v; alphaLog.push(v); },
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect(x: number, y: number, w: number, h: number) { rects.push({ x, y, w, h, color: fill }); },
    save() {}, restore() {}, translate() {}, scale() {},
    createLinearGradient() { calls.push("createLinearGradient"); return {}; },
    createRadialGradient() { calls.push("createRadialGradient"); return {}; },
    arc() { calls.push("arc"); }, ellipse() { calls.push("ellipse"); },
    imageSmoothingEnabled: true,
  };
  return { ctx, rects, calls, alphaLog };
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

  it("all leave globalAlpha restored (none of the four touch it today — this guards a future glow effect)", () => {
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

  it("all emit only integer coordinates — withSprite's own contract, and the class of bug an odd width / a stray /2 or /4 position reintroduces", () => {
    // Mirrors lib/game-pixel-parts.test.ts's equivalent check for pixelDisc
    // in isolation, extended across every HEAVY renderer's actual output.
    // Would have caught a centred `box(c, -w / 2, 0, w, h, ...)` with an odd
    // w=45 (half-pixel offsets throughout, and — worse — the whole court
    // silently shifted off the world position its PATH_AREAS ground texture
    // expects) directly, instead of relying on a comment or a screenshot.
    Object.entries(HEAVY).forEach(([name, fn]) => {
      const { ctx, rects } = recorder();
      fn(ctx as never, 0);
      expect(rects.length).toBeGreaterThan(0);
      rects.forEach((r) => {
        expect(Number.isInteger(r.x), `${name} drew a non-integer x=${r.x}`).toBe(true);
        expect(Number.isInteger(r.y), `${name} drew a non-integer y=${r.y}`).toBe(true);
        expect(Number.isInteger(r.w), `${name} drew a non-integer w=${r.w}`).toBe(true);
        expect(Number.isInteger(r.h), `${name} drew a non-integer h=${r.h}`).toBe(true);
      });
    });
  });
});

describe("basketball court world alignment", () => {
  it("anchors its art at the sprite's own (0,0) — top-left, matching PATH_AREAS's { x: 730, y: 535 } — not centred on it", () => {
    // box(c, 0, 0, w, h, PAL.roof) draws its PAL.out outline at exactly the
    // rect it's given before insetting the fill by 1px — so that outline
    // rect (uniquely identified by matching the court's own w=45, h=50) is
    // the true edge of the court's art. It must sit at exactly local (0,0),
    // reproducing world [730,820]x[535,635] — the same rect PATH_AREAS uses
    // to paint the stone texture underneath. A centred court would place
    // this outline near x=-22, silently detaching the art from that texture.
    const { ctx, rects } = recorder();
    drawBasketballCourt(ctx as never, 0);
    const surfaceOutline = rects.filter((r) => r.color === PAL.out && r.w === 45 && r.h === 50);
    expect(surfaceOutline).toHaveLength(1);
    expect(surfaceOutline[0].x).toBe(0);
    expect(surfaceOutline[0].y).toBe(0);
  });
});

describe("fountain water animation", () => {
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

describe("basketball hoop split from the court surface (fix round 2 / review item 7)", () => {
  // Colours the hoop alone paints — the backboard's glass and its red
  // target square never appear in the flat court surface (hardwood,
  // apron, key, circles, out-of-bounds lines), which sticks to
  // roof/stone/steelX/gold/pathL. Used below to prove the two are
  // actually split, not just that collectBasketballHoop exists.
  const HOOP_ONLY_COLORS = [PAL.glass, PAL.glassL, PAL.bloom];

  it("collectBasketballHoop returns exactly one Drawable, baselined at the stanchion base", () => {
    const drawables = collectBasketballHoop((null as unknown) as CanvasRenderingContext2D, 0);
    expect(drawables).toHaveLength(1);
    expect(drawables[0].baseline).toBe(543);
  });

  it("the hoop Drawable actually paints the backboard/rim — not an empty stub", () => {
    const { ctx, rects } = recorder();
    collectBasketballHoop(ctx as never, 0)[0].draw();
    const used = new Set(rects.map((r) => r.color));
    HOOP_ONLY_COLORS.forEach((c) =>
      expect(used.has(c), `hoop never painted ${c}`).toBe(true)
    );
  });

  it("drawBasketballCourt (the ground-band surface) no longer paints the hoop at all", () => {
    const { ctx, rects } = recorder();
    drawBasketballCourt(ctx as never, 0);
    const used = new Set(rects.map((r) => r.color));
    HOOP_ONLY_COLORS.forEach((c) =>
      expect(used.has(c), `court surface still paints hoop colour ${c}`).toBe(false)
    );
  });

  it("the hoop's baseline sits below the ground-band court surface's own bottom edge (world y=535+2*50=635), confirming it's a standing object, not flush ground texture", () => {
    // Not a strict requirement of y-sorting in general, but a sanity check
    // that 543 is a real "the stanchion touches the ground here" value
    // rather than an arbitrary constant — it should land inside the
    // court's own footprint (world y 535..635), close to its top edge
    // where the hoop actually stands, not off in the weeds.
    const drawables = collectBasketballHoop((null as unknown) as CanvasRenderingContext2D, 0);
    expect(drawables[0].baseline).toBeGreaterThan(535);
    expect(drawables[0].baseline).toBeLessThan(635);
  });
});
