import { describe, it, expect } from "vitest";
import {
  DECORATIVE_BUSHES, VILLAGE_FURNITURE, PATH_AREAS, TALL_GRASS_AREAS, type Rect,
} from "../components/game/game-data";

// A bush's canopy + shadow together read as roughly this footprint from its
// withSprite anchor (see components/game/game-props.ts drawBushes).
//
// BUSH_W corrected from 32 to 36 (fix round 2 / review item 4): the real
// canopy, including its outline pass, spans logical x 0..17 (BUSH_CANOPY's
// widest row is 16, centred on cx=9, plus the 1px outline bleed each side)
// = 18 logical px = 36 world px at the 2-world-px-per-logical-px unit — the
// old value under-measured every clearance check in this file by 4px.
const BUSH_W = 36;
const BUSH_H = 30;
const MIN_CLEARANCE = 24;

/** Shortest distance between two axis-aligned rects; 0 when they touch/overlap. */
function gap(a: Rect, b: Rect): number {
  const dx = Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w), 0);
  const dy = Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h), 0);
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Asserts every bush keeps at least `MIN_CLEARANCE` world px clear of every
 * rect in `areas` (never merely "not overlapping" — `overlaps()`'s old
 * strict `<`/`>` comparisons let two rects sit exactly flush, 0px apart,
 * and still "pass"; a test named after a clearance requirement has to
 * require a positive margin, or a 1px nudge in the wrong direction flips it
 * without the test ever noticing). Fix round 2 / review item 4: both this
 * and the path check below now run against every bush, not just the one
 * each used to regression-guard — the white hedge used to be checked only
 * against paths and the blue hedge only against tall grass, so a bush could
 * be flush against the *other* kind of area with nothing catching it (as
 * the white hedge in fact was, 23px from a tall-grass patch).
 */
function assertClearance(areas: Rect[], label: string): void {
  DECORATIVE_BUSHES.forEach((bush) => {
    const bushBox: Rect = { x: bush.x, y: bush.y, w: BUSH_W, h: BUSH_H };
    areas.forEach((area) => {
      const clearance = gap(bushBox, area);
      expect(
        clearance,
        `bush (${bush.x},${bush.y}) is only ${clearance.toFixed(1)}px from ${label} ` +
          `{x:${area.x},y:${area.y},w:${area.w},h:${area.h}}`
      ).toBeGreaterThanOrEqual(MIN_CLEARANCE);
    });
  });
}

describe("bush placement (Task 15 / fix round 2)", () => {
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

  // Regression: the white flowering hedge used to sit at (780,480)
  // (overlapping the "Trail to Court" PATH_AREA and only ~31px from the
  // East Forest Grove chess table), then at (820,507) — flush (0px
  // clearance) against both the "Trail to Court" and "Basketball Court"
  // PATH_AREAS, and only 23px from the south-east TALL_GRASS_AREA. Every
  // bush is now checked against every path, not just this one against
  // paths alone.
  it("every bush keeps at least 24 world px clear of every path/trail area", () => {
    assertClearance(PATH_AREAS, "path area");
  });

  // Regression: the blue flowering hedge used to sit at (490,540)
  // (overlapping the tall-grass patch south of the plaza approach, right
  // beside the Gamer Cottage's bench-se), then at (574,660) — flush (0px
  // clearance) against the "SE Trail to Cottage" PATH_AREA, and only 22px
  // from the tall-grass patch south of the plaza approach. Every bush is
  // now checked against every tall-grass patch, not just this one against
  // grass alone.
  it("every bush keeps at least 24 world px clear of every tall-grass patch", () => {
    assertClearance(TALL_GRASS_AREAS, "tall-grass patch");
  });
});
