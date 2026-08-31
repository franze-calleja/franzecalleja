import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { gableRoof, steppedRoof, window2, plankDoor, stoneCourse } from "../components/game/game-pixel";

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

  it("stays monotonic and centred for non-integer step sizes", () => {
    const rows = gableRoof(22, 52, 4, 8); // step = 30/7, not a whole number
    for (let i = 1; i < rows.length; i++) expect(rows[i][2]).toBeGreaterThan(rows[i - 1][2]);
    const centres = rows.map((r) => r[0] * 2 + r[2]);
    centres.forEach((c) => expect(c).toBe(centres[0]));
  });

  it("centres courses on an explicit centreX when given", () => {
    const rows = gableRoof(24, 56, 4, 9, 35);
    rows.forEach(([x, , w]) => expect(x + w / 2).toBe(35));
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
});
