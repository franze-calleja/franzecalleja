import { PAL } from "./game-palette";
import {
  px, box, dith, gableRoof, steppedRoof, window2, plankDoor, stoneCourse,
  timberFrame, chimney, chimneySmoke, lantern, flowerBox, ivy, hangingSign,
  type PixelCtx,
} from "./game-pixel";

export interface BuildingSpec {
  x: number;
  y: number;
  draw(ctx: PixelCtx, t: number): void;
}

const ROOF_TONE = { l: PAL.roofL, m: PAL.roof, d: PAL.roofD, x: PAL.roofX };

/**
 * Projects Showcase Guild. 70x55 logical (140x110 world) at 70,60.
 * Level 3: timber-framed stucco with a guild sign, chimney, lantern,
 * flower boxes and ivy. The chimney and hanging sign overhang above and
 * to the left of the footprint by design; the stone foundation course
 * also overhangs by 4px below it (stoneCourse at y=56,h=4 paints to y=60,
 * flush with the next building's row rather than the wall's own y=56 edge).
 */
export function drawProjectsGuild(ctx: PixelCtx, t: number): void {
  // Chimney sits behind the roof, so it draws first.
  chimney(ctx, 14, 0, 9, 13);

  // Correction 1: the body (box at x=8, w=54) is centred at x=35, not the
  // gableRoof default of eaveW/2=28 — pass the explicit centre so the roof
  // sits over its own wall instead of 7px to the left of it.
  steppedRoof(ctx, gableRoof(24, 56, 4, 9, 35), ROOF_TONE);

  // Eave with an underside shadow line
  box(ctx, 4, 22, 62, 5, PAL.roofX);
  px(ctx, 5, 25, 60, 1, PAL.woodD);

  // Stucco body
  box(ctx, 8, 26, 54, 30, PAL.wall);
  dith(ctx, 9, 27, 52, 28, PAL.wall, PAL.wallL);
  px(ctx, 55, 27, 6, 28, PAL.wallD);
  dith(ctx, 53, 27, 3, 28, PAL.wall, PAL.wallD);

  timberFrame(ctx, 8, 26, 54, 30, [18, 38]);
  px(ctx, 8, 46, 18, 3, PAL.wood);
  px(ctx, 44, 46, 18, 3, PAL.wood);
  px(ctx, 9, 46, 16, 1, PAL.woodL);
  px(ctx, 45, 46, 16, 1, PAL.woodL);

  window2(ctx, 14, 30);
  window2(ctx, 47, 30);
  plankDoor(ctx, 30, 42, 12, 14);
  stoneCourse(ctx, 6, 56, 58, 4);

  // Weathering streaks below the eave
  px(ctx, 16, 27, 1, 3, PAL.wallX);
  px(ctx, 40, 27, 1, 4, PAL.wallX);
  px(ctx, 52, 27, 1, 2, PAL.wallX);

  // Character props
  flowerBox(ctx, 14, 43);
  flowerBox(ctx, 47, 43);
  ivy(ctx, 60, 30, 54);
  hangingSign(ctx, -2, 28);
  lantern(ctx, 44, 45, t);
  // Correction 2: chimneySmoke draws its puffs in [y-2, y+12], i.e. below
  // its anchor. The chimney occupies y=0..13, so anchoring at y=-13 puts
  // the puffs in [-15, -1] — emerging at the cap and rising above it.
  chimneySmoke(ctx, 18, -13, t);
}

export const BUILDINGS: Record<string, BuildingSpec> = {
  "projects-guild": { x: 70, y: 60, draw: drawProjectsGuild },
};
