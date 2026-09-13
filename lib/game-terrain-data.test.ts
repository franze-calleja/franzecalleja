import { describe, it, expect } from "vitest";
import {
  TALL_GRASS_AREAS, PATH_AREAS, WORLD_OBJECTS,
  MAP_TOTAL_WIDTH, MAP_TOTAL_HEIGHT,
} from "../components/game/game-data";
import { buildExclusionMask, isExcluded } from "../components/game/game-mask";

/** The exact predicate from game-canvas.tsx:188, kept here as the oracle the
 *  precomputed mask must reproduce. */
function legacyIsInsidePathOrBuilding(x: number, y: number): boolean {
  for (const pa of PATH_AREAS) {
    if (x + 28 >= pa.x && x <= pa.x + pa.w + 4 && y + 28 >= pa.y && y <= pa.y + pa.h + 4) return true;
  }
  for (const obj of WORLD_OBJECTS) {
    if (x + 32 >= obj.x && x <= obj.x + obj.width + 8 && y + 32 >= obj.y && y <= obj.y + obj.height + 8) return true;
  }
  return false;
}

describe("TALL_GRASS_AREAS", () => {
  it("defines at least four patches", () => {
    expect(TALL_GRASS_AREAS.length).toBeGreaterThanOrEqual(4);
  });

  it("never overlaps a pathway", () => {
    TALL_GRASS_AREAS.forEach((g) => {
      PATH_AREAS.forEach((p) => {
        const overlaps = g.x < p.x + p.w && g.x + g.w > p.x && g.y < p.y + p.h && g.y + g.h > p.y;
        expect(overlaps, `patch ${JSON.stringify(g)} overlaps path ${JSON.stringify(p)}`).toBe(false);
      });
    });
  });

  it("never overlaps a building or world object", () => {
    TALL_GRASS_AREAS.forEach((g) => {
      WORLD_OBJECTS.forEach((o) => {
        const overlaps = g.x < o.x + o.width && g.x + g.w > o.x && g.y < o.y + o.height && g.y + g.h > o.y;
        expect(overlaps, `patch ${JSON.stringify(g)} overlaps ${o.name}`).toBe(false);
      });
    });
  });

  it("stays inside the map perimeter", () => {
    TALL_GRASS_AREAS.forEach((g) => {
      expect(g.x).toBeGreaterThanOrEqual(32);
      expect(g.y).toBeGreaterThanOrEqual(32);
      expect(g.x + g.w).toBeLessThanOrEqual(MAP_TOTAL_WIDTH - 32);
      expect(g.y + g.h).toBeLessThanOrEqual(MAP_TOTAL_HEIGHT - 32);
    });
  });
});

describe("exclusion mask", () => {
  it("reproduces the legacy predicate for every tile", () => {
    const tile = 32;
    const cols = Math.ceil(MAP_TOTAL_WIDTH / tile);
    const rows = Math.ceil(MAP_TOTAL_HEIGHT / tile);
    const mask = buildExclusionMask(tile);

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        expect(
          isExcluded(mask, cols, c, r),
          `mask disagrees at tile ${c},${r}`
        ).toBe(legacyIsInsidePathOrBuilding(c * tile, r * tile));
      }
    }
  });

  it("is sized to the tile grid", () => {
    const tile = 32;
    const cols = Math.ceil(MAP_TOTAL_WIDTH / tile);
    const rows = Math.ceil(MAP_TOTAL_HEIGHT / tile);
    expect(buildExclusionMask(tile).length).toBe(cols * rows);
  });
});
