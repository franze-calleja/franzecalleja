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
  ctx.imageSmoothingEnabled = false;
  ctx.translate(worldX, worldY);
  ctx.scale(UNIT, UNIT);
  draw();
  ctx.restore();
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
