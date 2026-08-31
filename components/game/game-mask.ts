import { MAP_TOTAL_WIDTH, MAP_TOTAL_HEIGHT, PATH_AREAS, WORLD_OBJECTS } from "./game-data";

/**
 * Precomputes, once, which tiles sit on a path or building. Replaces a
 * per-tile per-frame scan over 31 rectangles (~22k iterations/frame) with a
 * single array lookup. Padding values are copied exactly from the original
 * isInsidePathOrBuilding so flower placement does not shift.
 */
export function buildExclusionMask(tileSize: number): Uint8Array {
  const cols = Math.ceil(MAP_TOTAL_WIDTH / tileSize);
  const rows = Math.ceil(MAP_TOTAL_HEIGHT / tileSize);
  const mask = new Uint8Array(cols * rows);

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = c * tileSize;
      const y = r * tileSize;
      let hit = false;

      for (const pa of PATH_AREAS) {
        if (x + 28 >= pa.x && x <= pa.x + pa.w + 4 && y + 28 >= pa.y && y <= pa.y + pa.h + 4) {
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (const obj of WORLD_OBJECTS) {
          if (x + 32 >= obj.x && x <= obj.x + obj.width + 8 && y + 32 >= obj.y && y <= obj.y + obj.height + 8) {
            hit = true;
            break;
          }
        }
      }
      if (hit) mask[r * cols + c] = 1;
    }
  }
  return mask;
}

export function isExcluded(mask: Uint8Array, cols: number, col: number, row: number): boolean {
  return mask[row * cols + col] === 1;
}
