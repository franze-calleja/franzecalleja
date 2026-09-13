import { PAL } from "./game-palette";
import {
  UNIT, px, box, dith, withSprite, pixelDisc, window2, stoneCourse,
  plankDoor, lantern, chimney, chimneySmoke,
  type PixelCtx,
} from "./game-pixel";
import {
  GUILD_INTERIOR_WIDTH, GUILD_INTERIOR_HEIGHT, GUILD_PROJECT_STATIONS,
  VILLAGE_POST_INTERIOR_WIDTH, VILLAGE_POST_INTERIOR_HEIGHT,
  AZRA_SANCTUARY_INTERIOR_WIDTH, AZRA_SANCTUARY_INTERIOR_HEIGHT,
  DEVOPS_STATION_INTERIOR_WIDTH, DEVOPS_STATION_INTERIOR_HEIGHT,
  CAREER_ARCHIVE_INTERIOR_WIDTH, CAREER_ARCHIVE_INTERIOR_HEIGHT,
  ACADEMY_INTERIOR_WIDTH, ACADEMY_INTERIOR_HEIGHT,
  GAMER_COTTAGE_INTERIOR_WIDTH, GAMER_COTTAGE_INTERIOR_HEIGHT,
  type ProjectStation,
} from "./game-data";

// This module replaces the Guild interior's two renderers — the last
// unconverted surface in the game. They used to paint with 6 gradient call
// sites (a radial pedestal-floor halo and linear screen gradient per
// pedestal; a linear carpet gradient, linear sun-shaft, radial fireplace
// halo and radial chandelier halo in the room itself), 8 curve calls
// (arcs/ellipses/quadratics for the shadow, firebox arch and animated
// flames) and 13 rgba() fills — the one remaining visible style break
// between the Guild and the rest of the sprite-art world.
//
// Reused from the toolkit rather than rebuilt: `chimney`/`chimneySmoke` for
// the hearth (originally bespoke bezier flames), `window2` for the wall
// windows, `lantern` for the wall sconces, `plankDoor` for the exit and
// `pixelDisc` for a round central rug in place of the old rectangular
// runner (pixelDisc only draws circles — a deliberate redesign, not a
// literal shape-for-shape port).
//
// Text (the fireplace plaque, Architect Astro's nameplate, the exit sign)
// is NOT drawn by this module: PixelCtx is a narrowed slice of
// CanvasRenderingContext2D that deliberately excludes fillText/font/stroke
// APIs, to keep gradients and curves out of reach of renderer code, and
// fillText is collateral to that narrowing rather than something the pixel
// contract itself forbids — canvas text is an established pattern here
// (game-canvas.tsx already draws every overworld NPC's nameplate this way).
// Those three labels are restored by the caller (game-canvas.tsx), on the
// full context, using that same nameplate technique. Project identity for
// each station also still reaches the player through the DOM
// "Inspect <name>" prompt and the station's own modal, both unchanged.
//
// Room dimensions are GUILD_INTERIOR_WIDTH/HEIGHT (world px, unchanged) at
// this module's own withSprite scale, so W/H stay in step with the data
// file automatically.
const W = GUILD_INTERIOR_WIDTH / UNIT; // 350 logical
const H = GUILD_INTERIOR_HEIGHT / UNIT; // 270 logical
const POST_W = VILLAGE_POST_INTERIOR_WIDTH / UNIT;
const POST_H = VILLAGE_POST_INTERIOR_HEIGHT / UNIT;
const SANCTUARY_W = AZRA_SANCTUARY_INTERIOR_WIDTH / UNIT;
const SANCTUARY_H = AZRA_SANCTUARY_INTERIOR_HEIGHT / UNIT;
const DEVOPS_W = DEVOPS_STATION_INTERIOR_WIDTH / UNIT;
const DEVOPS_H = DEVOPS_STATION_INTERIOR_HEIGHT / UNIT;
const ARCHIVE_W = CAREER_ARCHIVE_INTERIOR_WIDTH / UNIT;
const ARCHIVE_H = CAREER_ARCHIVE_INTERIOR_HEIGHT / UNIT;
const ACADEMY_W = ACADEMY_INTERIOR_WIDTH / UNIT;
const ACADEMY_H = ACADEMY_INTERIOR_HEIGHT / UNIT;
const COTTAGE_W = GAMER_COTTAGE_INTERIOR_WIDTH / UNIT;
const COTTAGE_H = GAMER_COTTAGE_INTERIOR_HEIGHT / UNIT;

// Book-spine colours for the west shelf — a fixed rotation through PAL, not
// each project's own accent (station.color is a hex literal outside PAL,
// so it can drive nothing this module paints; the "paints only palette
// colours" contract test would fail the instant it touched a fillRect).
const BOOK_TONES = [PAL.roof, PAL.arcane, PAL.leaf, PAL.gold, PAL.steel, PAL.glass] as const;

// Per-station display tones. The original used `station.color` — a
// distinct hex per station (#38bdf8, #a855f7, #34d399, #f59e0b, #ec4899,
// #60a5fa, #fbbf24) — for the floor halo, screen border/gradient, LED
// blink and nameplate border, so a player could tell the 7 pedestals apart
// on sight. Uniform PAL.arcane lost that entirely. This is the same fix as
// BOOK_TONES: a fixed rotation through PAL rather than the literal hex
// (which the "paints only palette colours" contract forbids). Indexed by
// `station.projectIndex` (0-5 for the six real projects); the master codex
// (projectIndex -1) always gets the last, gold-toned slot — a deliberate
// callback to its own original gold accent.
//
// aem's original #a855f7 is purple, which the palette had no ramp for
// (round 1 substituted PAL.leafL/leafD as a stand-in). That collided
// visually with upfps's PAL.grassL/grassS — both greens, RGB distance
// ~10-16, well under a just-noticeable difference once each is flattened
// into a 14x8 glow box — reintroducing the "can't tell pedestals apart"
// problem for those two stations. Fixed at the root: PAL.violetL/violetD
// (game-palette.ts) gives aem its own hue instead of borrowing another
// station's. Minimum pairwise RGB distance across all 7 glow tones below
// is now ~73 (arcane vs. glassL), comfortably clear of that threshold.
const STATION_TONES: readonly { glow: string; back: string }[] = [
  { glow: PAL.arcane, back: PAL.arcaneD },   // 0 website — cyan
  { glow: PAL.violetL, back: PAL.violetD },  // 1 aem — violet (matches original #a855f7)
  { glow: PAL.grassL, back: PAL.grassS },    // 2 upfps — grass green
  { glow: PAL.roofL, back: PAL.roofD },      // 3 phd — amber/red
  { glow: PAL.bloom2, back: PAL.bloom },     // 4 nfc — pink
  { glow: PAL.glassL, back: PAL.glassD },    // 5 college-portal — blue
  { glow: PAL.goldL, back: PAL.goldD },      // 6 master codex — gold
] as const;

function stationTone(station: ProjectStation): { glow: string; back: string } {
  const REAL_PROJECT_COUNT = STATION_TONES.length - 1;
  const idx = station.projectIndex >= 0
    ? station.projectIndex % REAL_PROJECT_COUNT
    : STATION_TONES.length - 1;
  return STATION_TONES[idx];
}

/**
 * Pedestal: stepped stone plinth with a pulsing arcane display floating
 * above it — the sprite-art replacement for the original's radial floor
 * halo, linear screen gradient and blinking-LED capacitor nodes.
 *
 * `station.x`/`y` are world px (unchanged, still consumed as-is by
 * collision and the interact-prompt in game-canvas.tsx); Math.floor keeps
 * the logical position an integer even for a station whose world y is odd
 * (station-master's y=275), rather than propagating a stray .5 into every
 * offset drawn from it.
 */
export function drawStationPedestal(
  ctx: PixelCtx, station: ProjectStation, t: number
): void {
  const x = Math.floor(station.x / UNIT);
  const y = Math.floor(station.y / UNIT);

  // Ground shadow — opaque, on the wood floor tone, not the grass shadow
  // tone the outdoor props use.
  px(ctx, x + 7, y + 26, 18, 1, PAL.woodX);

  // Stepped base plinth.
  box(ctx, x + 8, y + 18, 16, 8, PAL.stone);
  stoneCourse(ctx, x + 7, y + 24, 18, 3);

  // Column body, gold trim rings top and bottom.
  box(ctx, x + 10, y + 4, 12, 15, PAL.stoneD);
  dith(ctx, x + 11, y + 5, 10, 13, PAL.stoneD, PAL.stone);
  px(ctx, x + 9, y + 4, 14, 1, PAL.gold);
  px(ctx, x + 9, y + 18, 14, 1, PAL.gold);

  // Pulsing display floating above the column, tinted per station (see
  // STATION_TONES) — the one luminous element on the pedestal, so the one
  // place alpha is allowed. Restored to 1 in `finally` even if a future
  // edit makes the body above throw.
  const tone = stationTone(station);
  box(ctx, x + 8, y - 8, 16, 10, tone.back);
  try {
    const pulse = 0.55 + 0.45 * Math.sin(t * 0.004 + x);
    ctx.globalAlpha = pulse;
    px(ctx, x + 9, y - 7, 14, 8, tone.glow);
  } finally {
    ctx.globalAlpha = 1;
  }
  px(ctx, x + 11, y - 6, 4, 3, PAL.glassL);
}

export function drawGuildInterior(
  ctx: PixelCtx, t: number, charactersImage: HTMLImageElement | null
): void {
  withSprite(ctx, 0, 0, () => {
    // --- Plank floor: alternating rows with a solid seam. The original
    // floor wasn't itself a gradient (flat per-tile fills plus an rgba
    // sparkle), so this needn't dither the way a genuine ramp would — two
    // flat tones read as distinct planks without a per-pixel checkerboard
    // spanning the room's full width every row. ---
    for (let y = 0; y < H; y += 6) {
      const base = (y / 6) % 2 === 0 ? PAL.wood : PAL.woodL;
      px(ctx, 0, y, W, 5, base);
      px(ctx, 0, y + 5, W, 1, PAL.woodD);
    }

    // --- North wall: two stone courses over a wood wainscot strip. ---
    stoneCourse(ctx, 0, 0, W, 8);
    stoneCourse(ctx, 0, 8, W, 8);
    px(ctx, 0, 15, W, 1, PAL.gold);
    px(ctx, 0, 16, W, 4, PAL.wood);
    px(ctx, 0, 19, W, 1, PAL.woodD);

    // --- East/west stone pillar walls. ---
    stoneCourse(ctx, 0, 0, 10, 250);
    stoneCourse(ctx, W - 10, 0, 10, 250);

    // --- South wall with the exit doorway back to the overworld. ---
    px(ctx, 0, 250, W, 20, PAL.stoneX);
    px(ctx, 0, 249, W, 1, PAL.stone);
    plankDoor(ctx, 155, 244, 40, 26);

    // --- Windows flanking the hearth. ---
    window2(ctx, 70, 4);
    window2(ctx, 270, 4);

    // --- Wall-sconce lanterns. ---
    lantern(ctx, 18, 6, t);
    lantern(ctx, W - 27, 6, t);

    // --- Stone hearth: the toolkit's `chimney` reused as a fireplace
    // breast, a dark firebox cavity, pulsing embers (luminous, alpha
    // restored) and rising smoke — replacing the original's animated
    // bezier flames and radial floor-warmth gradient. ---
    chimney(ctx, 150, 0, 50, 36);
    px(ctx, 165, 20, 20, 14, PAL.out);
    try {
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.008);
      px(ctx, 168, 27, 14, 5, PAL.roof);
      px(ctx, 171, 24, 8, 3, PAL.roofL);
    } finally {
      ctx.globalAlpha = 1;
    }
    chimneySmoke(ctx, 175, -6, t);

    // --- West bookshelf: fixed-rotation spines, not per-project colour. ---
    box(ctx, 40, 40, 40, 18, PAL.woodD);
    px(ctx, 42, 42, 36, 14, PAL.wood);
    for (let i = 0; i < 8; i++) {
      const bx = 43 + i * 4;
      px(ctx, bx, 43, 3, 6, BOOK_TONES[i % BOOK_TONES.length]);
      px(ctx, bx, 50, 3, 6, BOOK_TONES[(i + 3) % BOOK_TONES.length]);
    }

    // --- East drafting desk with a rolled blueprint. Architect Astro
    // himself is drawn by the caller (game-canvas.tsx), which still has
    // drawImage — PixelCtx deliberately doesn't. ---
    box(ctx, 260, 41, 40, 17, PAL.wood);
    px(ctx, 262, 43, 36, 13, PAL.woodD);
    box(ctx, 266, 45, 14, 9, PAL.glassD);
    px(ctx, 267, 46, 12, 7, PAL.glassL);
    px(ctx, 284, 49, 10, 3, PAL.gold);

    // --- Central guild rug: a gold-bordered disc under the master
    // station, replacing the old rectangular runner carpet's linear
    // gradient. Outer disc drawn with its own outline; the inner disc
    // (8 rows starting one row down, each 6px narrower — 3px per side)
    // leaves a 1px gold border top and bottom (rows 0 and 9 of the outer
    // disc, which the inner disc never reaches) and a 3px gold border on
    // each side, with no separate stroke call. ---
    pixelDisc(ctx, W / 2, 150, [20, 34, 44, 50, 52, 52, 50, 44, 34, 20], PAL.gold);
    pixelDisc(ctx, W / 2, 151, [28, 38, 44, 46, 46, 44, 38, 28], PAL.roof, false);

    // --- Project exhibition pedestals, one per station. ---
    GUILD_PROJECT_STATIONS.forEach((s) => drawStationPedestal(ctx, s, t));
  });

  void charactersImage; // Architect Astro at the desk is drawn by the caller.
}

/**
 * Village Post interior: a working courier lodge built around one clear
 * service counter. Mail slots, pinned dispatches, parcels and brass lamps
 * make the room specific to contact and correspondence rather than another
 * generic exhibition space.
 */
export function drawVillagePostInterior(ctx: PixelCtx, t: number): void {
  withSprite(ctx, 0, 0, () => {
    // Oak plank floor with a central postal-red runner.
    for (let y = 0; y < POST_H; y += 6) {
      px(ctx, 0, y, POST_W, 5, (y / 6) % 2 === 0 ? PAL.woodL : PAL.wood);
      px(ctx, 0, y + 5, POST_W, 1, PAL.woodD);
    }
    box(ctx, 151, 72, 48, 174, PAL.roofD);
    px(ctx, 154, 74, 42, 170, PAL.roof);
    dith(ctx, 155, 75, 40, 168, PAL.roof, PAL.roofD);

    // Stone-and-timber room shell with a south exit.
    stoneCourse(ctx, 0, 0, POST_W, 9);
    px(ctx, 0, 9, POST_W, 11, PAL.wall);
    px(ctx, 0, 19, POST_W, 2, PAL.woodD);
    stoneCourse(ctx, 0, 0, 10, 250);
    stoneCourse(ctx, POST_W - 10, 0, 10, 250);
    px(ctx, 0, 250, POST_W, 20, PAL.stoneX);
    px(ctx, 0, 249, POST_W, 1, PAL.stone);
    plankDoor(ctx, 155, 244, 40, 26);

    // Pigeonhole sorting wall: 18 readable mail compartments.
    box(ctx, 28, 27, 104, 40, PAL.woodD);
    px(ctx, 31, 30, 98, 34, PAL.woodX);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 6; col++) {
        const x = 33 + col * 16;
        const y = 32 + row * 10;
        box(ctx, x, y, 13, 7, PAL.wood);
        px(ctx, x + 2, y + 2, 8, 3, (row + col) % 2 === 0 ? PAL.wallL : PAL.goldL);
      }
    }

    // Dispatch notice board with pinned letters and route slips.
    box(ctx, 230, 28, 86, 39, PAL.wood);
    px(ctx, 234, 32, 78, 31, PAL.woodD);
    box(ctx, 240, 36, 18, 18, PAL.wallL);
    box(ctx, 264, 34, 36, 10, PAL.goldL);
    box(ctx, 268, 48, 28, 11, PAL.glassL);
    px(ctx, 247, 35, 2, 2, PAL.bloom);
    px(ctx, 280, 33, 2, 2, PAL.bloom);

    // Brass-lit service counter, the room's interaction focal point.
    lantern(ctx, 142, 37, t);
    lantern(ctx, 201, 37, t + 300);
    box(ctx, 105, 82, 140, 42, PAL.woodD);
    px(ctx, 109, 86, 132, 34, PAL.wood);
    dith(ctx, 111, 88, 128, 30, PAL.wood, PAL.woodL);
    px(ctx, 102, 80, 146, 7, PAL.goldD);
    px(ctx, 104, 80, 142, 3, PAL.goldL);
    // Envelopes waiting on the counter.
    box(ctx, 126, 72, 25, 10, PAL.wallL);
    px(ctx, 128, 74, 21, 1, PAL.goldD);
    box(ctx, 198, 74, 22, 8, PAL.glassL);

    // Parcel stacks frame the room without crowding the walking lane.
    box(ctx, 34, 86, 42, 28, PAL.wood);
    px(ctx, 52, 87, 4, 26, PAL.goldD);
    box(ctx, 42, 69, 29, 17, PAL.woodL);
    px(ctx, 54, 70, 3, 15, PAL.goldD);
    box(ctx, 278, 88, 38, 26, PAL.wood);
    px(ctx, 294, 89, 4, 24, PAL.goldD);
  });
}

/** AZRA's observatory: a stone chamber focused on one animated Oracle Core. */
export function drawAzraSanctuaryInterior(ctx: PixelCtx, t: number): void {
  withSprite(ctx, 0, 0, () => {
    // Dark stone tiles with a cyan rune path leading from the door.
    for (let y = 0; y < SANCTUARY_H; y += 12) {
      stoneCourse(ctx, 0, y, SANCTUARY_W, 12);
    }
    px(ctx, 169, 64, 12, 182, PAL.arcaneD);
    dith(ctx, 171, 66, 8, 178, PAL.arcaneD, PAL.glassD);

    // Chamber shell and south exit.
    stoneCourse(ctx, 0, 0, SANCTUARY_W, 12);
    stoneCourse(ctx, 0, 0, 10, 250);
    stoneCourse(ctx, SANCTUARY_W - 10, 0, 10, 250);
    px(ctx, 0, 250, SANCTUARY_W, 20, PAL.stoneX);
    px(ctx, 0, 249, SANCTUARY_W, 1, PAL.arcane);
    plankDoor(ctx, 155, 244, 40, 26);

    // Crystal archive shelves across the north wall.
    box(ctx, 24, 24, 94, 34, PAL.stoneD);
    box(ctx, 232, 24, 94, 34, PAL.stoneD);
    for (let i = 0; i < 6; i++) {
      const leftX = 29 + i * 14;
      const rightX = 237 + i * 14;
      box(ctx, leftX, 30, 8, 20, i % 2 === 0 ? PAL.glassD : PAL.violetD);
      px(ctx, leftX + 2, 27, 4, 4, i % 2 === 0 ? PAL.glassL : PAL.violetL);
      box(ctx, rightX, 30, 8, 20, i % 2 === 0 ? PAL.violetD : PAL.glassD);
      px(ctx, rightX + 2, 27, 4, 4, i % 2 === 0 ? PAL.violetL : PAL.glassL);
    }

    // Four rune pylons frame the core and mark its collision footprint.
    const pylons = [[118, 88], [216, 88], [118, 147], [216, 147]] as const;
    pylons.forEach(([x, y], index) => {
      box(ctx, x, y, 16, 34, PAL.stoneD);
      px(ctx, x + 3, y + 3, 10, 25, PAL.stone);
      const lit = Math.floor(t / 260 + index) % 2 === 0;
      px(ctx, x + 6, y + 8, 4, 12, lit ? PAL.arcane : PAL.violetL);
      px(ctx, x + 5, y + 30, 6, 2, PAL.goldD);
    });

    // Oracle Core: one controlled pulse, surrounded by stepped rune rings.
    pixelDisc(ctx, 175, 118, [18, 30, 38, 44, 48, 48, 44, 38, 30, 18], PAL.goldD);
    pixelDisc(ctx, 175, 120, [14, 24, 30, 34, 34, 30, 24, 14], PAL.violetD, false);
    try {
      ctx.globalAlpha = 0.58 + 0.42 * Math.sin(t * 0.005);
      pixelDisc(ctx, 175, 112, [8, 14, 18, 20, 18, 14, 8], PAL.arcane);
      px(ctx, 172, 109, 6, 6, PAL.glassL);
    } finally {
      ctx.globalAlpha = 1;
    }

    // Sparse orbiting data motes make the pulse legible without visual noise.
    const phase = Math.floor(t / 180) % 4;
    const motes = [[151, 110], [174, 91], [198, 110], [174, 137]] as const;
    motes.forEach(([x, y], index) => {
      px(ctx, x, y, 3, 3, index === phase ? PAL.wallL : PAL.arcaneD);
    });
  });
}

/** DevOps operations bay: racks, power storage and a live telemetry console. */
export function drawDevopsStationInterior(ctx: PixelCtx, t: number): void {
  withSprite(ctx, 0, 0, () => {
    // Industrial floor plates with a central cable trench.
    for (let y = 0; y < DEVOPS_H; y += 12) {
      stoneCourse(ctx, 0, y, DEVOPS_W, 12);
      px(ctx, 0, y + 10, DEVOPS_W, 1, PAL.steelD);
    }
    px(ctx, 168, 62, 14, 184, PAL.out);
    px(ctx, 171, 62, 8, 184, PAL.steelX);
    for (let y = 68; y < 240; y += 18) px(ctx, 172, y, 6, 2, PAL.arcaneD);

    // Reinforced room shell and south exit.
    stoneCourse(ctx, 0, 0, DEVOPS_W, 12);
    stoneCourse(ctx, 0, 0, 10, 250);
    stoneCourse(ctx, DEVOPS_W - 10, 0, 10, 250);
    px(ctx, 0, 250, DEVOPS_W, 20, PAL.steelX);
    px(ctx, 0, 249, DEVOPS_W, 1, PAL.glassD);
    plankDoor(ctx, 155, 244, 40, 26);

    // North-wall server racks: indicator clusters make them read as live systems.
    const racks = [26, 72, 252, 298] as const;
    racks.forEach((x, index) => {
      box(ctx, x, 24, 36, 58, PAL.out);
      box(ctx, x + 2, 26, 32, 54, PAL.steelD);
      for (let row = 0; row < 5; row++) {
        const y = 29 + row * 10;
        px(ctx, x + 5, y, 26, 6, PAL.steel);
        px(ctx, x + 7, y + 2, 3, 2, (Math.floor(t / 220) + row + index) % 3 === 0 ? PAL.grassL : PAL.arcane);
        px(ctx, x + 13, y + 2, 2, 2, PAL.glassL);
        px(ctx, x + 18, y + 2, 8, 1, PAL.steelL);
      }
    });

    // Battery cabinets frame the room without closing the central route.
    [[38, 104], [284, 104]].forEach(([x, y]) => {
      box(ctx, x, y, 30, 54, PAL.out);
      box(ctx, x + 2, y + 2, 26, 50, PAL.steelD);
      px(ctx, x + 7, y + 8, 16, 24, PAL.grassD);
      px(ctx, x + 10, y + 11, 10, 15, PAL.grassL);
      px(ctx, x + 8, y + 38, 14, 4, PAL.goldD);
    });

    // The live operations console is the room's focal point and interaction target.
    box(ctx, 111, 88, 128, 44, PAL.out);
    box(ctx, 114, 91, 122, 38, PAL.steelD);
    px(ctx, 118, 95, 54, 24, PAL.glassD);
    try {
      ctx.globalAlpha = 0.62 + 0.38 * Math.sin(t * 0.006);
      px(ctx, 121, 98, 48, 18, PAL.arcane);
      px(ctx, 178, 98, 50, 18, PAL.grassD);
      px(ctx, 181, 101, 44, 3, PAL.grassL);
    } finally {
      ctx.globalAlpha = 1;
    }
    px(ctx, 118, 121, 112, 4, PAL.steel);
    for (let x = 122; x < 228; x += 13) px(ctx, x, 122, 7, 2, PAL.goldD);
    px(ctx, 106, 130, 138, 7, PAL.steelX);
    px(ctx, 110, 130, 130, 2, PAL.steelL);
  });
}

/** Career archive reading room, centered on a timeline desk. */
export function drawCareerArchiveInterior(ctx: PixelCtx, t: number): void {
  withSprite(ctx, 0, 0, () => {
    stoneCourse(ctx, 0, 0, ARCHIVE_W, ARCHIVE_H);
    for (let y = 12; y < 250; y += 16) {
      px(ctx, 8, y, ARCHIVE_W - 16, 1, PAL.stoneD);
      for (let x = 16 + ((y / 16) % 2) * 8; x < ARCHIVE_W - 16; x += 32) px(ctx, x, y + 8, 1, 6, PAL.stoneL);
    }
    stoneCourse(ctx, 0, 0, ARCHIVE_W, 12);
    stoneCourse(ctx, 0, 0, 10, 250);
    stoneCourse(ctx, ARCHIVE_W - 10, 0, 10, 250);
    px(ctx, 0, 250, ARCHIVE_W, 20, PAL.woodD);
    plankDoor(ctx, 155, 244, 40, 26);

    // Two dense document shelves make the room read as an archive, not an office.
    [20, 288].forEach((x) => {
      box(ctx, x, 28, 42, 132, PAL.wood);
      for (let y = 36; y < 150; y += 20) {
        px(ctx, x + 4, y, 34, 3, PAL.woodD);
        for (let book = 0; book < 7; book++) px(ctx, x + 6 + book * 4, y + 4, 3, 12, BOOK_TONES[(book + Math.floor(y / 20)) % BOOK_TONES.length]);
      }
    });
    // Career timeline desk / interaction target.
    box(ctx, 108, 91, 134, 42, PAL.out);
    box(ctx, 111, 94, 128, 36, PAL.woodD);
    px(ctx, 116, 99, 118, 22, PAL.wallL);
    for (let x = 124; x < 224; x += 24) {
      px(ctx, x, 105, 8, 8, PAL.violetD);
      px(ctx, x + 2, 107, 4, 4, Math.floor(t / 450 + x) % 2 ? PAL.gold : PAL.grassL);
      px(ctx, x + 8, 108, 14, 2, PAL.steelD);
    }
    px(ctx, 104, 132, 142, 7, PAL.wood);
  });
}

/** Academy honors dojo, with a medal display and open training floor. */
export function drawAcademyInterior(ctx: PixelCtx, t: number): void {
  withSprite(ctx, 0, 0, () => {
    for (let y = 0; y < ACADEMY_H; y += 14) stoneCourse(ctx, 0, y, ACADEMY_W, 14);
    stoneCourse(ctx, 0, 0, ACADEMY_W, 12);
    px(ctx, 0, 250, ACADEMY_W, 20, PAL.woodD);
    plankDoor(ctx, 155, 244, 40, 26);
    // Tatami grid holds the eye on the training floor.
    box(ctx, 74, 76, 202, 112, PAL.grassD);
    for (let x = 76; x < 274; x += 32) px(ctx, x, 78, 1, 108, PAL.grassL);
    for (let y = 78; y < 186; y += 28) px(ctx, 76, y, 198, 1, PAL.grassL);
    // Honors display is the interaction target.
    box(ctx, 128, 28, 94, 36, PAL.wood);
    box(ctx, 131, 31, 88, 30, PAL.out);
    for (let x = 140; x < 210; x += 18) {
      px(ctx, x, 36, 10, 14, PAL.goldD);
      px(ctx, x + 2, 38, 6, 8, Math.floor(t / 350 + x) % 2 ? PAL.gold : PAL.wallL);
    }
    // Training dummies and lanterns flank the open floor.
    [42, 298].forEach((x) => {
      px(ctx, x + 8, 94, 4, 72, PAL.wood);
      px(ctx, x, 112, 20, 4, PAL.woodD);
      box(ctx, x + 3, 80, 14, 16, PAL.woodL);
    });
    [52, 286].forEach((x, index) => lantern(ctx, x, 34, t + index * 300));
  });
}

/** Franze's Gamer Cottage: a symmetrical night-game den around a CRT wall. */
export function drawGamerCottageInterior(ctx: PixelCtx, t: number): void {
  withSprite(ctx, 0, 0, () => {
    for (let y = 0; y < COTTAGE_H; y += 16) {
      stoneCourse(ctx, 0, y, COTTAGE_W, 16);
      px(ctx, 8, y + 12, COTTAGE_W - 16, 1, PAL.woodD);
    }
    stoneCourse(ctx, 0, 0, COTTAGE_W, 12);
    stoneCourse(ctx, 0, 0, 10, 250);
    stoneCourse(ctx, COTTAGE_W - 10, 0, 10, 250);
    px(ctx, 0, 250, COTTAGE_W, 20, PAL.woodD);
    plankDoor(ctx, 155, 244, 40, 26);

    // Symmetric shelving makes the CRT the deliberate focal point.
    [22, 292].forEach((x) => {
      box(ctx, x, 28, 36, 78, PAL.out);
      box(ctx, x + 2, 30, 32, 74, PAL.woodD);
      for (let y = 36; y < 96; y += 18) {
        px(ctx, x + 5, y, 26, 2, PAL.woodL);
        px(ctx, x + 7, y + 4, 5, 8, PAL.arcane);
        px(ctx, x + 15, y + 4, 5, 8, PAL.goldD);
        px(ctx, x + 23, y + 4, 4, 8, PAL.violetD);
      }
    });
    // CRT setup, console, and animated scanline.
    box(ctx, 112, 26, 126, 68, PAL.out);
    box(ctx, 116, 30, 118, 58, PAL.steelX);
    px(ctx, 120, 34, 110, 48, PAL.glassD);
    try {
      ctx.globalAlpha = 0.58 + 0.32 * Math.sin(t * 0.008);
      px(ctx, 124, 38, 102, 40, PAL.arcane);
      px(ctx, 128, 42 + (Math.floor(t / 80) % 16), 94, 2, PAL.glassL);
    } finally { ctx.globalAlpha = 1; }
    px(ctx, 148, 94, 54, 6, PAL.steel);
    px(ctx, 156, 100, 38, 4, PAL.woodD);

    // Lounge rug and two aligned couches leave a clear interaction route.
    box(ctx, 114, 142, 122, 56, PAL.violetD);
    px(ctx, 118, 146, 114, 48, PAL.violetL);
    [70, 248].forEach((x) => {
      box(ctx, x, 146, 48, 32, PAL.out);
      box(ctx, x + 3, 149, 42, 26, PAL.woodD);
      px(ctx, x + 6, 153, 36, 14, PAL.wallD);
    });
    // Controller stand is the interaction target.
    box(ctx, 150, 116, 50, 18, PAL.out);
    px(ctx, 154, 119, 42, 12, PAL.wood);
    px(ctx, 164, 122, 10, 5, PAL.arcane);
    px(ctx, 178, 122, 10, 5, PAL.gold);
  });
}
