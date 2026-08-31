import { PAL } from "./game-palette";

/** One logical pixel is this many world pixels. Matches the 16x16 character
 *  sprites drawn at 32x32, so world art shares their grid. */
export const UNIT = 2;

/** The slice of CanvasRenderingContext2D the toolkit uses. Narrowing it keeps
 *  gradient and curve APIs out of reach of renderer code. */
export interface PixelCtx {
  fillStyle: string | CanvasGradient | CanvasPattern;
  globalAlpha: number;
  imageSmoothingEnabled: boolean;
  fillRect(x: number, y: number, w: number, h: number): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  scale(x: number, y: number): void;
}

/**
 * Runs `draw` in logical pixel space anchored at a world coordinate.
 * All logical coordinates are integers, so scaling by UNIT lands on exact
 * world pixels with no anti-aliasing.
 */
export function withSprite(
  ctx: PixelCtx,
  worldX: number,
  worldY: number,
  draw: () => void
): void {
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = false;
    ctx.translate(worldX, worldY);
    ctx.scale(UNIT, UNIT);
    draw();
  } finally {
    ctx.restore();
  }
}

/** The only place fillRect is called. */
export function px(
  ctx: PixelCtx, x: number, y: number, w: number, h: number, color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Outlined rect: 1px palette outline with an inset fill. */
export function box(
  ctx: PixelCtx, x: number, y: number, w: number, h: number, fill: string
): void {
  px(ctx, x, y, w, h, PAL.out);
  px(ctx, x + 1, y + 1, w - 2, h - 2, fill);
}

/** 1px checkerboard dither — how ramps transition without a gradient. */
export function dith(
  ctx: PixelCtx, x: number, y: number, w: number, h: number, c1: string, c2: string
): void {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      px(ctx, x + i, y + j, 1, 1, (i + j) & 1 ? c2 : c1);
    }
  }
}

/**
 * The single deterministic pseudo-random source for the whole world.
 * Scatter must be stable across frames or cached terrain will not match
 * live-drawn terrain. Returns 0..255.
 */
export function hash(a: number, b: number): number {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
  return (h ^ (h >>> 16)) >>> 24;
}

// --- Building parts -------------------------------------------------------

export type RoofRow = readonly [x: number, y: number, w: number];
export interface RoofTone { l: string; m: string; d: string; x: string }

/**
 * Generates the stepped courses of a gable roof seen head-on with the roof
 * plane receding upward — the Gen 5 projection. Each course is 2 logical px
 * tall and widens evenly from ridge to eave, centred on `centreX` (defaults
 * to the eave's own midpoint, rounded to an integer, which assumes the
 * building starts at x=0 — pass an explicit centreX when it doesn't).
 *
 * Course widths are snapped to even numbers so `centreX - w / 2` is always
 * an integer: an odd width would force a rounding step that nudges the
 * course off-axis and makes the staircase lean.
 */
export function gableRoof(
  ridgeW: number, eaveW: number, topY: number, rows: number, centreX: number = Math.round(eaveW / 2)
): RoofRow[] {
  const step = (eaveW - ridgeW) / (rows - 1);
  const out: RoofRow[] = [];
  for (let i = 0; i < rows; i++) {
    const w = Math.round((ridgeW + step * i) / 2) * 2;
    out.push([centreX - w / 2, topY + i * 2, w] as const);
  }
  return out;
}

/**
 * Outline pass first, then fill pass. Drawing all outlines up front means each
 * course's fill covers the next course's top outline, so the staircase shows a
 * clean 1px edge on its sides but no seams across its face.
 */
export function steppedRoof(ctx: PixelCtx, rows: RoofRow[], tone: RoofTone): void {
  for (const [x, y, w] of rows) px(ctx, x - 1, y - 1, w + 2, 3, PAL.out);

  rows.forEach(([x, y, w], i) => {
    const top = i < 2 ? tone.l : i < rows.length - 3 ? tone.m : tone.d;
    const bot = i < 2 ? tone.m : i < rows.length - 3 ? tone.d : tone.x;
    px(ctx, x, y, w, 1, top);
    px(ctx, x, y + 1, w, 1, bot);
    // Shingle tabs, offset every other course so they read as overlapping.
    for (let sx = x + (i & 1 ? 2 : 0); sx < x + w - 1; sx += 4) {
      px(ctx, sx, y + 1, 1, 1, tone.x);
    }
    if (i === 1 || i === rows.length - 4) dith(ctx, x, y, w, 1, top, bot);
  });
}

/** 11x11 glass with timber frame, mullion cross, specular highlight and sill. */
export function window2(ctx: PixelCtx, x: number, y: number): void {
  box(ctx, x - 1, y - 1, 13, 13, PAL.wood);
  px(ctx, x, y, 11, 11, PAL.glassD);
  px(ctx, x, y, 11, 5, PAL.glass);
  px(ctx, x + 1, y + 1, 4, 3, PAL.glassL);
  px(ctx, x + 5, y, 1, 11, PAL.wood);
  px(ctx, x, y + 5, 11, 1, PAL.wood);
  px(ctx, x - 2, y + 11, 15, 2, PAL.out);
  px(ctx, x - 1, y + 11, 13, 1, PAL.woodL);
}

/** Vertical-plank door with hinges, brass handle and a stone step. */
export function plankDoor(
  ctx: PixelCtx, x: number, y: number, w: number, h: number
): void {
  box(ctx, x, y, w, h, PAL.door);
  for (let i = x + 3; i < x + w - 1; i += 4) px(ctx, i, y + 1, 1, h - 2, PAL.doorD);
  px(ctx, x + 1, y + 1, 2, h - 2, PAL.doorL);
  px(ctx, x + 1, y + 1, w - 2, 1, PAL.doorL);
  px(ctx, x + 2, y + 3, 3, 1, PAL.stoneD);
  px(ctx, x + 2, y + h - 5, 3, 1, PAL.stoneD);
  px(ctx, x + w - 4, y + 7, 2, 2, PAL.gold);
  px(ctx, x - 1, y + h, w + 2, 1, PAL.stoneL);
}

/** Dressed-stone foundation course with lit top edges and shadowed joints. */
export function stoneCourse(
  ctx: PixelCtx, x: number, y: number, w: number, h: number
): void {
  px(ctx, x, y, w, h, PAL.out);
  px(ctx, x + 1, y + 1, w - 2, h - 2, PAL.stone);
  for (let i = x + 1; i < x + w - 2; i += 7) {
    px(ctx, i, y + 1, 1, h - 2, PAL.stoneD);
    px(ctx, i + 1, y + 1, 4, 1, PAL.stoneL);
  }
  px(ctx, x + 1, y + h - 2, w - 2, 1, PAL.stoneD);
}

/** Tudor half-timber: top plate, corner posts, and studs at the given offsets. */
export function timberFrame(
  ctx: PixelCtx, x: number, y: number, w: number, h: number, posts: number[]
): void {
  px(ctx, x, y, w, 3, PAL.wood);
  px(ctx, x, y, w, 1, PAL.woodL);
  px(ctx, x, y, 3, h, PAL.wood);
  px(ctx, x + w - 3, y, 3, h, PAL.wood);
  for (const p of posts) px(ctx, x + p, y, 2, h, PAL.wood);
  px(ctx, x, y + h - 2, 3, 2, PAL.woodD);
  px(ctx, x + w - 3, y + h - 2, 3, 2, PAL.woodD);
}

// --- Animated props -------------------------------------------------------
// These are the ONLY functions permitted to set globalAlpha, and only for
// luminous elements. Each restores it to 1 before returning.

export function chimney(
  ctx: PixelCtx, x: number, y: number, w: number, h: number
): void {
  px(ctx, x, y, w, h, PAL.out);
  px(ctx, x + 1, y + 1, w - 2, h - 1, PAL.stone);
  dith(ctx, x + 1, y + 1, w - 2, h - 3, PAL.stone, PAL.stoneD);
  px(ctx, x - 1, y, w + 2, 3, PAL.out);
  px(ctx, x, y + 1, w, 1, PAL.stoneL);
}

export function chimneySmoke(ctx: PixelCtx, x: number, y: number, t: number): void {
  try {
    for (let i = 0; i < 4; i++) {
      const phase = ((t * 0.0009 + i * 0.25) % 1 + 1) % 1;
      const sy = Math.round(y + 12 - phase * 14);
      const sx = Math.round(x + Math.sin(phase * 5 + i) * 4);
      const size = Math.max(1, Math.round(3 - phase * 2));
      ctx.globalAlpha = 0.55 * (1 - phase);
      px(ctx, sx, sy, size, size, PAL.smoke);
    }
  } finally {
    ctx.globalAlpha = 1;
  }
}

export function lantern(ctx: PixelCtx, x: number, y: number, t: number): void {
  const flicker = 0.72 + 0.28 * Math.sin(t * 0.006);
  px(ctx, x + 2, y - 3, 1, 3, PAL.wood);
  box(ctx, x, y, 5, 6, PAL.goldD);
  try {
    ctx.globalAlpha = flicker;
    px(ctx, x + 1, y + 1, 3, 4, PAL.gold);
    ctx.globalAlpha = 0.16 * flicker;
    px(ctx, x - 3, y - 2, 11, 11, PAL.gold);
  } finally {
    ctx.globalAlpha = 1;
  }
}

export function flowerBox(ctx: PixelCtx, x: number, y: number): void {
  px(ctx, x - 2, y + 1, 15, 4, PAL.out);
  px(ctx, x - 1, y + 2, 13, 2, PAL.wood);
  for (let i = x - 1; i < x + 12; i += 3) {
    px(ctx, i, y, 2, 2, PAL.leaf);
    px(ctx, i + 1, y + 1, 1, 1, PAL.leafD);
    px(ctx, i, y - 1, 1, 1, i % 2 ? PAL.bloom : PAL.bloom2);
  }
}

export function ivy(ctx: PixelCtx, x: number, yTop: number, yBottom: number): void {
  for (let j = yTop; j < yBottom; j += 3) {
    px(ctx, x, j, 2, 2, PAL.leafD);
    px(ctx, x + 1, j + 1, 1, 1, PAL.leaf);
    if (j % 6 === 0) px(ctx, x - 2, j + 1, 2, 2, PAL.leaf);
  }
}

export function hangingSign(ctx: PixelCtx, x: number, y: number): void {
  px(ctx, x + 3, y, 8, 1, PAL.wood);
  px(ctx, x + 3, y, 1, 4, PAL.wood);
  px(ctx, x + 1, y + 3, 12, 2, PAL.out);
  box(ctx, x, y + 4, 14, 10, PAL.wood);
  px(ctx, x + 1, y + 5, 12, 8, PAL.doorD);
  px(ctx, x + 3, y + 7, 8, 1, PAL.gold);
  px(ctx, x + 3, y + 9, 5, 1, PAL.gold);
  px(ctx, x + 3, y + 11, 7, 1, PAL.goldD);
}
