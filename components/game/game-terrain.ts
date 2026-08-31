import { PAL } from "./game-palette";
import { px, dith, hash, withSprite, type PixelCtx } from "./game-pixel";
import { MAP_TOTAL_WIDTH, MAP_TOTAL_HEIGHT, PATH_AREAS } from "./game-data";
import { buildExclusionMask, isExcluded } from "./game-mask";

const TILE_WORLD = 32;
const TILE = 16; // logical
const COLS = Math.ceil(MAP_TOTAL_WIDTH / TILE_WORLD);
const ROWS = Math.ceil(MAP_TOTAL_HEIGHT / TILE_WORLD);

const GRASS_TONES = ["grassL", "grass", "grassD"] as const;
export type GrassTone = (typeof GRASS_TONES)[number];

/** Six blade-cluster layouts, in logical px offsets within a 16x16 tile. */
const BLADES: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [[2, 4], [5, 2], [9, 6]],
  [[7, 3], [11, 5], [3, 9]],
  [[4, 7], [10, 2], [13, 8]],
  [[1, 6], [6, 10], [12, 4]],
  [[8, 8], [2, 11], [13, 2]],
  [[5, 5], [9, 11], [3, 3]],
];

export function bladeVariant(col: number, row: number): number {
  return hash(col, row) % 6;
}

/**
 * Low-frequency value noise: sampling on a coarse grid makes neighbouring
 * tiles usually agree, so tones form soft blobs instead of per-tile static.
 */
export function patchTone(col: number, row: number): GrassTone {
  const n = hash(col >> 2, row >> 2);
  return GRASS_TONES[n % 3];
}

function drawTile(ctx: PixelCtx, col: number, row: number, mask: Uint8Array): void {
  const x = col * TILE;
  const y = row * TILE;
  const base = PAL[patchTone(col, row)];

  px(ctx, x, y, TILE, TILE, base);
  // Suggestion of a mowing stripe: one tone step, not the old hard band.
  if (col % 2 === 0) dith(ctx, x, y + 7, TILE, 1, base, PAL.grassD);

  for (const [bx, by] of BLADES[bladeVariant(col, row)]) {
    px(ctx, x + bx, y + by + 2, 2, 1, PAL.grassS);
    px(ctx, x + bx, y + by, 1, 3, PAL.grassX);
    px(ctx, x + bx + 1, y + by - 1, 1, 2, PAL.grassL);
  }

  if (!isExcluded(mask, COLS, col, row)) {
    const h = hash(col * 3, row * 5) % 31;
    if (h === 1) { px(ctx, x + 5, y + 7, 1, 2, PAL.leafD); px(ctx, x + 4, y + 4, 3, 3, PAL.gold); }
    else if (h === 2) { px(ctx, x + 10, y + 9, 1, 2, PAL.leafD); px(ctx, x + 9, y + 6, 3, 3, PAL.bloom); }
    else if (h === 3) { px(ctx, x + 7, y + 12, 1, 2, PAL.leafD); px(ctx, x + 6, y + 9, 3, 3, PAL.glass); }
    else if (h === 4) { px(ctx, x + 8, y + 4, 3, 3, PAL.leaf); px(ctx, x + 9, y + 5, 1, 1, PAL.leafD); }
    else if (h === 5) { px(ctx, x + 3, y + 11, 3, 3, PAL.wallL); px(ctx, x + 4, y + 12, 1, 1, PAL.gold); }
  }
}

function drawPaths(ctx: PixelCtx): void {
  for (const p of PATH_AREAS) {
    // PATH_AREAS holds world coordinates, and several are odd numbers
    // (e.g. x: 375). Halving them raw would produce fractional logical
    // coordinates and reintroduce anti-aliasing, so snap to the 2px grid.
    const x = Math.floor(p.x / 2), y = Math.floor(p.y / 2);
    const w = Math.ceil(p.w / 2), h = Math.ceil(p.h / 2);
    px(ctx, x, y, w, h, PAL.path);
    for (let py = y; py < y + h - 5; py += 8) {
      for (let pxx = x; pxx < x + w - 5; pxx += 8) {
        px(ctx, pxx, py, 8, 8, PAL.pathD);
        px(ctx, pxx, py, 7, 7, PAL.pathL);
        px(ctx, pxx + 1, py + 1, 6, 6, (pxx + py) % 16 === 0 ? PAL.path : PAL.pathL);
      }
    }
    // Dithered fringe: grass fingers into the stone instead of stopping dead.
    for (let i = 0; i < w; i++) {
      const top = hash(x + i, y) % 3;
      const bot = hash(x + i, y + h) % 3;
      for (let d = 0; d < top; d++) px(ctx, x + i, y + d, 1, 1, PAL.grass);
      for (let d = 0; d < bot; d++) px(ctx, x + i, y + h - 1 - d, 1, 1, PAL.grass);
    }
    for (let j = 0; j < h; j++) {
      const l = hash(x, y + j) % 3;
      const r = hash(x + w, y + j) % 3;
      for (let d = 0; d < l; d++) px(ctx, x + d, y + j, 1, 1, PAL.grass);
      for (let d = 0; d < r; d++) px(ctx, x + w - 1 - d, y + j, 1, 1, PAL.grass);
    }
  }
}

/** Builds the static ground once. Called at mount, never per frame. */
export function renderTerrainToCache(): HTMLCanvasElement {
  const cache = document.createElement("canvas");
  cache.width = MAP_TOTAL_WIDTH;
  cache.height = MAP_TOTAL_HEIGHT;
  const ctx = cache.getContext("2d") as unknown as PixelCtx;
  const mask = buildExclusionMask(TILE_WORLD);

  withSprite(ctx, 0, 0, () => {
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const perimeter = c === 0 || r === 0 || c === COLS - 1 || r === ROWS - 1;
        if (perimeter) {
          px(ctx, c * TILE, r * TILE, TILE, TILE, PAL.grassS);
          dith(ctx, c * TILE, r * TILE, TILE, TILE, PAL.grassS, PAL.grassX);
        } else {
          drawTile(ctx, c, r, mask);
        }
      }
    }
    drawPaths(ctx);
  });

  return cache;
}

/** One blit per frame, replacing ~18k fillRect calls. */
export function drawTerrain(
  ctx: CanvasRenderingContext2D, cache: HTMLCanvasElement
): void {
  ctx.drawImage(cache, 0, 0);
}
