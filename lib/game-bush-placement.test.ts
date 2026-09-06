import { describe, it, expect } from "vitest";
import {
  DECORATIVE_BUSHES, VILLAGE_FURNITURE, PATH_AREAS, TALL_GRASS_AREAS, type Rect,
} from "../components/game/game-data";

// A bush's canopy + shadow together read as roughly this footprint from its
// withSprite anchor (see components/game/game-props.ts drawBushes).
const BUSH_W = 32;
const BUSH_H = 30;
const MIN_CLEARANCE = 24;

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Shortest distance between two axis-aligned rects; 0 when they touch/overlap. */
function gap(a: Rect, b: Rect): number {
  const dx = Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w), 0);
  const dy = Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h), 0);
  return Math.sqrt(dx * dx + dy * dy);
}

describe("bush placement (Task 15)", () => {
  it("every bush keeps at least 24 world px clear of every furniture item", () => {
    DECORATIVE_BUSHES.forEach((bush) => {
      const bushBox: Rect = { x: bush.x, y: bush.y, w: BUSH_W, h: BUSH_H };
      VILLAGE_FURNITURE.forEach((f) => {
        const clearance = gap(bushBox, { x: f.x, y: f.y, w: f.w, h: f.h });
        expect(
          clearance,
          `bush (${bush.x},${bush.y}) is only ${clearance.toFixed(1)}px from furniture "${f.id}"`
        ).toBeGreaterThanOrEqual(MIN_CLEARANCE);
      });
    });
  });

  // Regression: this flowering hedge used to sit at (780,480), overlapping
  // the "Trail to Court" PATH_AREA and only ~31px from the East Forest
  // Grove chess table — close enough to visually merge with it.
  it("the white flowering hedge near the East Forest Grove clears the Trail to Court path", () => {
    const bush = DECORATIVE_BUSHES.find((b) => b.type === "flowering_hedge" && b.berry === "#ffffff");
    expect(bush, "expected the white flowering_hedge bush to exist").toBeDefined();
    const bushBox: Rect = { x: bush!.x, y: bush!.y, w: BUSH_W, h: BUSH_H };
    PATH_AREAS.forEach((p) => expect(overlaps(bushBox, p)).toBe(false));
  });

  // Regression: this flowering hedge used to sit at (490,540), overlapping
  // the tall-grass patch south of the plaza approach, right beside the
  // Gamer Cottage's bench-se.
  it("the blue flowering hedge near the Gamer Cottage clears every tall-grass patch", () => {
    const bush = DECORATIVE_BUSHES.find((b) => b.type === "flowering_hedge" && b.berry === "#38bdf8");
    expect(bush, "expected the blue flowering_hedge bush to exist").toBeDefined();
    const bushBox: Rect = { x: bush!.x, y: bush!.y, w: BUSH_W, h: BUSH_H };
    TALL_GRASS_AREAS.forEach((g) => expect(overlaps(bushBox, g)).toBe(false));
  });
});
