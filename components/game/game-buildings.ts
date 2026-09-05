import { PAL } from "./game-palette";
import {
  px, box, dith, hash, gableRoof, steppedRoof, window2, plankDoor, stoneCourse,
  timberFrame, chimney, chimneySmoke, lantern, flowerBox, ivy, hangingSign,
  type PixelCtx, type RoofTone,
} from "./game-pixel";

export interface BuildingSpec {
  x: number;
  y: number;
  draw(ctx: PixelCtx, t: number): void;
}

/**
 * One roof ramp per building (Task 14). At native 1x scale the seven
 * buildings previously shared a single red ROOF_TONE and read as the same
 * house — the roof colour is the single biggest at-a-glance legibility
 * lever, so every building gets its own {l,m,d,x} ramp, composed from
 * existing PAL families wherever one fits and reading light->dark for
 * light-from-upper-left shading.
 */
const GUILD_ROOF: RoofTone = { l: PAL.roofL, m: PAL.roof, d: PAL.roofD, x: PAL.roofX };
const POST_ROOF: RoofTone = { l: PAL.goldL, m: PAL.gold, d: PAL.goldD, x: PAL.goldX };
const SANCTUARY_ROOF: RoofTone = { l: PAL.glassL, m: PAL.arcane, d: PAL.arcaneD, x: PAL.arcaneX };
const ARCHIVES_ROOF: RoofTone = { l: PAL.stoneL, m: PAL.stone, d: PAL.stoneD, x: PAL.stoneX };
const DEVOPS_ROOF: RoofTone = { l: PAL.steelL, m: PAL.steel, d: PAL.steelD, x: PAL.steelX };
const DOJO_ROOF: RoofTone = { l: PAL.leafL, m: PAL.leaf, d: PAL.leafD, x: PAL.leafX };
const COTTAGE_ROOF: RoofTone = { l: PAL.woodL, m: PAL.wood, d: PAL.woodD, x: PAL.woodX };

export const ROOF_TONES: Record<string, RoofTone> = {
  "projects-guild": GUILD_ROOF,
  "village-post": POST_ROOF,
  "azra-sanctuary": SANCTUARY_ROOF,
  "career-archives": ARCHIVES_ROOF,
  "devops-station": DEVOPS_ROOF,
  "enverga-dojo": DOJO_ROOF,
  "gamer-cottage": COTTAGE_ROOF,
};

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
  steppedRoof(ctx, gableRoof(24, 56, 4, 9, 35), GUILD_ROOF);

  // Eave with an underside shadow line
  box(ctx, 4, 22, 62, 5, GUILD_ROOF.x);
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

/**
 * Village Post & Inquiries Lodge. 65x48 logical (130x95 world) at 350,55.
 * Stucco + timber post office: mailbox, notice board, a swinging bracket
 * bell and a roof-top weathervane. No chimney.
 */
export function drawVillagePost(ctx: PixelCtx, t: number): void {
  // The body (box at x=9, w=48) is centred at x=33, not the gableRoof
  // default of eaveW/2=26 — pass the explicit centre (Finding 2).
  steppedRoof(ctx, gableRoof(22, 52, 4, 8, 33), POST_ROOF);

  // Eave with an underside shadow line
  box(ctx, 5, 20, 56, 5, POST_ROOF.x);
  px(ctx, 6, 23, 54, 1, PAL.woodD);

  // Stucco body
  box(ctx, 9, 24, 48, 26, PAL.wall);
  dith(ctx, 10, 25, 46, 24, PAL.wall, PAL.wallL);
  px(ctx, 50, 25, 6, 24, PAL.wallD);
  dith(ctx, 48, 25, 3, 24, PAL.wall, PAL.wallD);

  timberFrame(ctx, 9, 24, 48, 26, [16, 34]);

  window2(ctx, 14, 28);
  plankDoor(ctx, 30, 38, 12, 12);
  stoneCourse(ctx, 7, 50, 52, 4);

  // Mailbox with a raised flag
  box(ctx, 60, 38, 7, 8, PAL.stone);
  px(ctx, 62, 40, 3, 1, PAL.stoneD);
  px(ctx, 67, 36, 1, 5, PAL.bloom);
  px(ctx, 62, 46, 2, 6, PAL.wood);

  // Notice board with 3 pinned papers
  box(ctx, 0, 32, 14, 12, PAL.wood);
  px(ctx, 1, 33, 12, 10, PAL.woodD);
  px(ctx, 2, 34, 4, 4, PAL.wallL);
  px(ctx, 8, 35, 4, 3, PAL.wallL);
  px(ctx, 3, 39, 5, 3, PAL.wallL);
  px(ctx, 5, 44, 2, 8, PAL.wood);

  // Bracket bell, swinging gently
  const swing = Math.round(Math.sin(t * 0.003));
  px(ctx, 44, 22, 6, 1, PAL.wood);
  px(ctx, 49, 22, 1, 3, PAL.wood);
  box(ctx, 47 + swing, 25, 5, 5, PAL.gold);
  px(ctx, 49 + swing, 30, 1, 1, PAL.goldD);

  // Weathervane above the ridge
  px(ctx, 30, 0, 1, 5, PAL.stoneD);
  px(ctx, 27, 1, 7, 1, PAL.stoneD);
  px(ctx, 33, 0, 3, 3, PAL.gold);
}

/**
 * AZRA's AI Arcane Sanctuary. 70x63 logical (140x125 world) at 560,45.
 * Stone body, a tall steep roof so it reads as grand rather than domestic
 * (Task 14 silhouette pass — same footprint, more roof / less wall), a
 * chunky glowing rune lintel and 3 floating crystals bobbing above the
 * ridge. No chimney — nothing burns here.
 *
 * Silhouette: the ridge (y=6) and the foundation (y=58..62) are pinned to
 * their original positions — only the split between roof and wall moves.
 * Roof rows went 10 -> 13 (height 20 -> 26, +6); wall height shrank by the
 * same 6 (30 -> 24) so the overall box is unchanged, just taller-roofed.
 */
export function drawAzraSanctuary(ctx: PixelCtx, t: number): void {
  // Body (box at x=8, w=54) is centred at x=35.
  steppedRoof(ctx, gableRoof(18, 54, 6, 13, 35), SANCTUARY_ROOF);

  box(ctx, 4, 30, 62, 5, SANCTUARY_ROOF.x);
  px(ctx, 5, 33, 60, 1, PAL.stoneD);

  // Stone body — shorter than before (24 vs 30) to pay for the taller roof.
  box(ctx, 8, 34, 54, 24, PAL.stone);
  dith(ctx, 9, 35, 52, 22, PAL.stone, PAL.stoneL);
  px(ctx, 50, 35, 6, 22, PAL.stoneD);
  dith(ctx, 48, 35, 3, 22, PAL.stone, PAL.stoneD);

  // Corner piers — light from upper-left
  px(ctx, 8, 34, 3, 24, PAL.stoneL);
  px(ctx, 59, 34, 3, 24, PAL.stoneD);

  // Glowing rune lintel across the top of the wall — enlarged and outlined
  // (Task 14 prop pass) so it reads at 1x instead of vanishing into dots.
  const pulse = 0.55 + 0.45 * Math.sin(t * 0.004);
  for (let rx = 10; rx < 58; rx += 7) px(ctx, rx, 34, 5, 3, PAL.out);
  for (let rx = 10; rx < 58; rx += 7) px(ctx, rx + 1, 34, 3, 1, PAL.glassL);
  try {
    ctx.globalAlpha = pulse;
    for (let rx = 10; rx < 58; rx += 7) px(ctx, rx + 1, 35, 3, 1, PAL.arcane);
  } finally {
    ctx.globalAlpha = 1;
  }
  for (let rx = 10; rx < 58; rx += 7) px(ctx, rx + 1, 36, 3, 1, PAL.arcaneD);

  window2(ctx, 14, 39);
  window2(ctx, 45, 39);
  plankDoor(ctx, 30, 46, 12, 12);
  stoneCourse(ctx, 6, 58, 58, 4);

  // 3 floating crystals, bobbing independently above the ridge — enlarged
  // with an outline and a soft halo (Task 14 prop pass).
  for (let i = 0; i < 3; i++) {
    const cx = 21 + i * 14;
    const bob = Math.round(Math.sin(t * 0.0025 + i * 2) * 2);
    const cy = -14 + bob;
    try {
      ctx.globalAlpha = 0.25;
      px(ctx, cx - 2, cy - 2, 9, 9, PAL.arcane);
    } finally {
      ctx.globalAlpha = 1;
    }
    px(ctx, cx, cy, 5, 5, PAL.out);
    px(ctx, cx + 1, cy + 1, 3, 3, PAL.arcane);
    px(ctx, cx + 1, cy + 1, 1, 1, PAL.glassL);
    px(ctx, cx + 2, cy + 3, 1, 1, PAL.arcaneD);
  }
}

/**
 * Career & Work Experience Archives. 70x53 logical (140x105 world) at
 * 750,150. Stone with alternating quoins, a stepped-pixel wall clock,
 * 2 tall shuttered windows and 3 stacked crates. No chimney.
 *
 * Silhouette (Task 14): a flat parapet replaces the gable so it reads
 * institutional rather than domestic, the wall widens to fill more of the
 * footprint (58 -> 64 wide), and the height the gable used to take (16px)
 * shrinks to a 10px flat cap — the freed 6px goes to the wall so the
 * building overall reads low, wide and slab-like. The wall's bottom edge
 * (y=50, where the foundation starts) is unchanged.
 */
export function drawCareerArchives(ctx: PixelCtx, t: number): void {
  // Flat parapet cap — no gable, wide and low (institutional, not domestic).
  box(ctx, 2, 6, 66, 10, ARCHIVES_ROOF.m);
  px(ctx, 3, 7, 64, 2, ARCHIVES_ROOF.l);
  px(ctx, 3, 12, 64, 3, ARCHIVES_ROOF.d);

  // Body (box at x=3, w=64) is wider than before — fills more of the
  // footprint's width, another institutional cue.
  box(ctx, 3, 16, 64, 34, PAL.stone);
  dith(ctx, 4, 17, 54, 32, PAL.stone, PAL.stoneL);
  px(ctx, 61, 17, 5, 32, PAL.stoneD);
  dith(ctx, 58, 17, 3, 32, PAL.stone, PAL.stoneD);

  // Alternating quoins down both edges
  for (let qy = 16; qy < 46; qy += 6) {
    px(ctx, 3, qy, 4, 4, PAL.stoneL);
    px(ctx, 63, qy, 4, 4, PAL.stoneL);
  }

  // 2 tall narrow windows with closed wooden shutters (no glass)
  const tallShutteredWindow = (x: number, y: number) => {
    box(ctx, x - 1, y - 1, 11, 19, PAL.wood);
    px(ctx, x, y, 9, 17, PAL.woodD);
    for (let i = y + 2; i < y + 16; i += 4) px(ctx, x, i, 9, 1, PAL.woodL);
    px(ctx, x + 4, y, 1, 17, PAL.wood);
  };
  tallShutteredWindow(10, 20);
  tallShutteredWindow(48, 20);

  plankDoor(ctx, 29, 40, 12, 10);
  stoneCourse(ctx, 1, 50, 66, 4);

  // Wall clock — stepped pixel face with two hands, the minute hand ticks
  const CLOCK = [4, 6, 6, 4] as const;
  const clockCx = 35;
  CLOCK.forEach((w, i) => px(ctx, clockCx - w / 2 - 1, 16 + i - 1, w + 2, 3, PAL.out));
  CLOCK.forEach((w, i) => px(ctx, clockCx - w / 2, 16 + i, w, 1, PAL.wallL));
  const tick = Math.floor(t / 500) % 2;
  px(ctx, clockCx + tick, 17, 1, 2, PAL.woodD);
  px(ctx, clockCx - 1, 18, 2, 1, PAL.woodD);
  px(ctx, clockCx, 18, 1, 1, PAL.gold);

  // 3 stacked crates against the wall, right of the second window
  box(ctx, 59, 40, 7, 8, PAL.wood);
  px(ctx, 60, 41, 5, 6, PAL.woodL);
  px(ctx, 60, 44, 5, 1, PAL.woodD);
  box(ctx, 60, 32, 6, 8, PAL.wood);
  px(ctx, 61, 33, 4, 6, PAL.woodL);
  px(ctx, 61, 36, 4, 1, PAL.woodD);
  box(ctx, 59, 24, 7, 8, PAL.wood);
  px(ctx, 60, 25, 5, 6, PAL.woodL);
  px(ctx, 60, 28, 5, 1, PAL.woodD);
}

/**
 * DevOps & Telemetry Power Station. 70x55 logical (140x110 world) at
 * 60,260. Flat industrial roof (no gable), stone body with a metal-plate
 * seam, twin chimney stacks with offset smoke, a pipe run, 2 pressure
 * gauges and 3 status lamps blinking on a hash-offset phase.
 */
export function drawDevopsStation(ctx: PixelCtx, t: number): void {
  // Chimneys sit behind the roof cap, so they draw first.
  chimney(ctx, 16, 0, 9, 13);
  chimney(ctx, 44, 0, 9, 13);

  // Flat concrete roof cap — no gable here
  box(ctx, 4, 6, 62, 6, DEVOPS_ROOF.x);
  px(ctx, 5, 7, 60, 1, DEVOPS_ROOF.l);

  // Stone body with a metal-plate seam
  box(ctx, 8, 12, 54, 40, PAL.stone);
  dith(ctx, 9, 13, 52, 38, PAL.stone, PAL.stoneL);
  px(ctx, 55, 13, 6, 38, PAL.stoneD);
  dith(ctx, 53, 13, 3, 38, PAL.stone, PAL.stoneD);
  px(ctx, 9, 30, 52, 2, PAL.stoneD);
  px(ctx, 9, 30, 52, 1, PAL.stoneL);

  window2(ctx, 14, 36);
  plankDoor(ctx, 44, 38, 12, 14);
  stoneCourse(ctx, 6, 52, 58, 4);

  // Horizontal pipe run along the base with brass valve stubs
  px(ctx, 8, 46, 54, 2, PAL.stoneD);
  px(ctx, 8, 46, 54, 1, PAL.stoneL);
  for (let vx = 12; vx < 40; vx += 10) {
    px(ctx, vx, 44, 2, 4, PAL.gold);
    px(ctx, vx, 48, 2, 1, PAL.goldD);
  }

  // 2 pressure gauges, gold rims with a black-out dial and a needle — sized
  // up and given a needle for contrast (Task 14 prop pass: the original
  // 4x4 dial was flagged as unreadable at native scale).
  const gauge = (x: number, y: number) => {
    px(ctx, x - 1, y - 1, 10, 10, PAL.out);
    px(ctx, x, y, 8, 8, PAL.gold);
    px(ctx, x + 1, y + 1, 6, 6, PAL.stoneD);
    px(ctx, x + 3, y + 1, 1, 3, PAL.gold);
    px(ctx, x + 3, y + 3, 2, 1, PAL.goldD);
  };
  gauge(17, 14);
  gauge(31, 14);

  // 3 status lamps, each blinking on its own hash-offset phase — enlarged
  // with an outline ring so they read as lit indicators at native scale.
  for (let i = 0; i < 3; i++) {
    const phase = hash(i, 41) % 6;
    const on = Math.floor(t / 300 + phase) % 2 === 0;
    const lx = 42 + i * 7;
    px(ctx, lx - 1, 13, 6, 6, PAL.out);
    px(ctx, lx, 14, 4, 4, on ? PAL.leaf : PAL.leafD);
  }

  // Twin smoke plumes, offset in phase so they don't puff in lockstep.
  // Both chimneys occupy y = 0..13, so both anchor at y = -13.
  chimneySmoke(ctx, 20, -13, t);
  chimneySmoke(ctx, 48, -13, t + 300);
}

/**
 * Academy of Enverga (Honors Dojo). 70x55 logical (140x110 world) at
 * 60,560. Timber + plaster pagoda with a double-eave roof (two stacked
 * gableRoof calls), paired paper lanterns, a training dummy and a
 * vertical banner. No chimney.
 */
export function drawEnvergaDojo(ctx: PixelCtx, t: number): void {
  // Upper tier — narrow, both roofs share the body's centre at x=35.
  steppedRoof(ctx, gableRoof(16, 34, 4, 6, 35), DOJO_ROOF);
  box(ctx, 14, 16, 42, 3, DOJO_ROOF.x);

  // Lower tier — wide, the main eave
  steppedRoof(ctx, gableRoof(30, 58, 20, 6, 35), DOJO_ROOF);
  box(ctx, 4, 32, 62, 5, DOJO_ROOF.x);
  px(ctx, 5, 35, 60, 1, PAL.woodD);

  // Plaster body
  box(ctx, 8, 36, 54, 20, PAL.wall);
  dith(ctx, 9, 37, 52, 18, PAL.wall, PAL.wallL);
  px(ctx, 55, 37, 6, 18, PAL.wallD);
  dith(ctx, 53, 37, 3, 18, PAL.wall, PAL.wallD);

  timberFrame(ctx, 8, 36, 54, 20, [18, 38]);

  window2(ctx, 14, 40);
  window2(ctx, 47, 40);
  plankDoor(ctx, 30, 46, 12, 10);
  stoneCourse(ctx, 6, 56, 58, 4);

  // Paired paper lanterns flanking the door
  lantern(ctx, 16, 44, t);
  lantern(ctx, 48, 44, t + 400);

  // Training dummy beside the entrance
  px(ctx, 62, 42, 3, 14, PAL.wood);
  px(ctx, 60, 44, 7, 2, PAL.woodD);
  box(ctx, 60, 38, 7, 6, PAL.woodL);

  // Vertical banner hanging on the left wall
  px(ctx, 1, 18, 6, 30, PAL.roofD);
  px(ctx, 2, 19, 4, 27, PAL.roof);
  dith(ctx, 2, 40, 4, 6, PAL.roof, PAL.roofD);
  px(ctx, 2, 47, 4, 2, PAL.roofX);
}

/**
 * Franze's Gamer Cottage. 70x55 logical (140x110 world) at 560,535.
 * Stucco + timber, mirrored from the Guild's chimney/sign side so it
 * doesn't read as the same building: a glowing CRT bay window, a
 * controller-glyph sign, and a doormat.
 */
export function drawGamerCottage(ctx: PixelCtx, t: number): void {
  // Chimney on the RIGHT (Guild's is on the left) — draws before the roof.
  chimney(ctx, 48, 0, 9, 13);

  // Body (box at x=8, w=54) is centred at x=35.
  steppedRoof(ctx, gableRoof(24, 56, 4, 9, 35), COTTAGE_ROOF);

  box(ctx, 4, 22, 62, 5, COTTAGE_ROOF.x);
  px(ctx, 5, 25, 60, 1, PAL.woodD);

  box(ctx, 8, 26, 54, 30, PAL.wall);
  dith(ctx, 9, 27, 52, 28, PAL.wall, PAL.wallL);
  px(ctx, 55, 27, 6, 28, PAL.wallD);
  dith(ctx, 53, 27, 3, 28, PAL.wall, PAL.wallD);

  // Single asymmetric centre post, unlike the Guild's two flanking posts
  timberFrame(ctx, 8, 26, 54, 30, [20]);

  // CRT glow bay window — the cottage's signature feature
  box(ctx, 16, 30, 15, 13, PAL.wood);
  px(ctx, 17, 31, 13, 11, PAL.glassD);
  const glow = 0.5 + 0.5 * Math.sin(t * 0.01);
  try {
    ctx.globalAlpha = 0.5 + 0.5 * glow;
    px(ctx, 18, 32, 11, 9, PAL.glass);
    px(ctx, 19, 33, 4, 3, PAL.glassL);
  } finally {
    ctx.globalAlpha = 1;
  }

  plankDoor(ctx, 38, 42, 12, 14);
  stoneCourse(ctx, 6, 56, 58, 4);

  // Doormat
  px(ctx, 37, 56, 14, 2, PAL.roofD);
  px(ctx, 38, 56, 12, 1, PAL.roof);

  // Controller-glyph hanging sign, on the right (opposite the Guild's)
  hangingSign(ctx, 60, 28);

  // Chimney occupies y = 0..13; anchor smoke above its cap.
  chimneySmoke(ctx, 52, -13, t);
}

export const BUILDINGS: Record<string, BuildingSpec> = {
  "projects-guild": { x: 70, y: 60, draw: drawProjectsGuild },
  "village-post": { x: 350, y: 55, draw: drawVillagePost },
  "azra-sanctuary": { x: 560, y: 45, draw: drawAzraSanctuary },
  "career-archives": { x: 750, y: 150, draw: drawCareerArchives },
  "devops-station": { x: 60, y: 260, draw: drawDevopsStation },
  "enverga-dojo": { x: 60, y: 560, draw: drawEnvergaDojo },
  "gamer-cottage": { x: 560, y: 535, draw: drawGamerCottage },
};
