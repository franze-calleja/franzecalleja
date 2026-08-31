import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { gableRoof, steppedRoof, window2, plankDoor, stoneCourse, timberFrame } from "../components/game/game-pixel";

function recorder() {
  const rects: { x: number; y: number; w: number; h: number; color: string }[] = [];
  let fill = "";
  const ctx = {
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect(x: number, y: number, w: number, h: number) { rects.push({ x, y, w, h, color: fill }); },
    save() {}, restore() {}, translate() {}, scale() {},
    imageSmoothingEnabled: true, globalAlpha: 1,
  };
  return { ctx, rects };
}

describe("gableRoof geometry", () => {
  it("widens monotonically from ridge to eave", () => {
    const rows = gableRoof(24, 56, 2, 9);
    expect(rows).toHaveLength(9);
    expect(rows[0][2]).toBe(24);
    expect(rows[8][2]).toBe(56);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i][2]).toBeGreaterThan(rows[i - 1][2]);
    }
  });

  it("keeps every row horizontally centred on the same axis", () => {
    const rows = gableRoof(24, 56, 2, 9);
    const centres = rows.map((r) => r[0] * 2 + r[2]);
    centres.forEach((c) => expect(c).toBe(centres[0]));
  });

  it("advances y by 2 logical px per course", () => {
    const rows = gableRoof(24, 56, 2, 9);
    rows.forEach((r, i) => expect(r[1]).toBe(2 + i * 2));
  });

  it("emits only even course widths", () => {
    // gableRoof(22,52,4,8) produced an odd width (31) before this was fixed.
    [gableRoof(24, 56, 2, 9), gableRoof(22, 52, 4, 8), gableRoof(26, 58, 4, 8)].forEach((rows) => {
      rows.forEach(([, , w]) => expect(w % 2).toBe(0));
    });
  });

  it("keeps every course on an integer x for non-integer step sizes", () => {
    // step = 30/7 here. Before the even-width snap, row 2 had w=31, so
    // centreX - w/2 landed on a half-pixel and the staircase leaned.
    const rows = gableRoof(22, 52, 4, 8);
    rows.forEach(([x, , w]) => {
      expect(Number.isInteger(x), `x=${x} is not an integer`).toBe(true);
      expect(w % 2).toBe(0);
    });
    for (let i = 1; i < rows.length; i++) expect(rows[i][2]).toBeGreaterThan(rows[i - 1][2]);
  });

  it("centres courses on an explicit centreX when given", () => {
    const rows = gableRoof(24, 56, 4, 9, 35);
    rows.forEach(([x, , w]) => expect(x + w / 2).toBe(35));
  });

  it("keeps every course x an integer with an odd eaveW and no explicit centreX", () => {
    // eaveW=53 makes the naive default centreX (26.5) fractional; the default
    // must round it so centreX - w/2 stays an integer for every course.
    const rows = gableRoof(21, 53, 0, 5);
    rows.forEach(([x]) => expect(Number.isInteger(x), `x=${x} is not an integer`).toBe(true));
  });
});

describe("steppedRoof", () => {
  const tone = { l: PAL.roofL, m: PAL.roof, d: PAL.roofD, x: PAL.roofX };

  it("draws the whole outline pass before any fill pass", () => {
    const { ctx, rects } = recorder();
    steppedRoof(ctx, gableRoof(8, 16, 0, 3), tone);
    const lastOutline = rects.map((r) => r.color).lastIndexOf(PAL.out);
    const firstFill = rects.findIndex((r) => r.color !== PAL.out);
    expect(lastOutline).toBeLessThan(firstFill);
  });

  it("outlines each course 1px proud on both sides", () => {
    const { ctx, rects } = recorder();
    const rows = gableRoof(8, 16, 0, 3);
    steppedRoof(ctx, rows, tone);
    const outline = rects.filter((r) => r.color === PAL.out);
    expect(outline).toHaveLength(3);
    outline.forEach((o, i) => {
      expect(o.x).toBe(rows[i][0] - 1);
      expect(o.w).toBe(rows[i][2] + 2);
    });
  });

  it("only uses roof-ramp colours", () => {
    const { ctx, rects } = recorder();
    steppedRoof(ctx, gableRoof(8, 16, 0, 3), tone);
    const allowed = new Set<string>([PAL.out, PAL.roofL, PAL.roof, PAL.roofD, PAL.roofX]);
    rects.forEach((r) => expect(allowed.has(r.color)).toBe(true));
  });
});

describe("building parts stay inside their declared bounds", () => {
  it("window2 fits an 11x11 glass plus frame and sill", () => {
    const { ctx, rects } = recorder();
    window2(ctx, 20, 30);
    const minX = Math.min(...rects.map((r) => r.x));
    const maxX = Math.max(...rects.map((r) => r.x + r.w));
    expect(minX).toBeGreaterThanOrEqual(17);
    expect(maxX).toBeLessThanOrEqual(34);
  });

  it("plankDoor fills exactly the rect it is given", () => {
    const { ctx, rects } = recorder();
    plankDoor(ctx, 10, 40, 14, 14);
    const body = rects[0];
    expect(body).toEqual({ x: 10, y: 40, w: 14, h: 14, color: PAL.out });
  });

  it("stoneCourse emits repeated joints across its width", () => {
    const { ctx, rects } = recorder();
    stoneCourse(ctx, 0, 0, 60, 4);
    const joints = rects.filter((r) => r.color === PAL.stoneD && r.w === 1);
    expect(joints.length).toBeGreaterThanOrEqual(7);
  });

  it("timberFrame stays within its rect, places posts at the given offsets, and uses only wood-ramp colours", () => {
    const { ctx, rects } = recorder();
    const x = 10, y = 20, w = 40, h = 30;
    const posts = [10, 22];
    timberFrame(ctx, x, y, w, h, posts);

    const minX = Math.min(...rects.map((r) => r.x));
    const maxX = Math.max(...rects.map((r) => r.x + r.w));
    const minY = Math.min(...rects.map((r) => r.y));
    const maxY = Math.max(...rects.map((r) => r.y + r.h));
    expect(minX).toBeGreaterThanOrEqual(x);
    expect(maxX).toBeLessThanOrEqual(x + w);
    expect(minY).toBeGreaterThanOrEqual(y);
    expect(maxY).toBeLessThanOrEqual(y + h);

    posts.forEach((p) => {
      expect(rects.some((r) => r.x === x + p && r.w === 2 && r.h === h)).toBe(true);
    });

    const allowed = new Set<string>([PAL.wood, PAL.woodL, PAL.woodD]);
    rects.forEach((r) => expect(allowed.has(r.color)).toBe(true));
  });
});
