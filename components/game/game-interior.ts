import { PAL } from "./game-palette";
import {
  UNIT, px, box, dith, withSprite, pixelDisc, window2, stoneCourse,
  plankDoor, lantern, chimney, chimneySmoke,
  type PixelCtx,
} from "./game-pixel";
import {
  GUILD_INTERIOR_WIDTH, GUILD_INTERIOR_HEIGHT, GUILD_PROJECT_STATIONS,
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
// Text is dropped entirely (nameplates, the fireplace's carved plaque, the
// exit sign): PixelCtx has no fillText, matching every other sprite-art
// renderer in this codebase (e.g. hangingSign draws a blank plank, not a
// label). Project identity still reaches the player through the DOM
// "Inspect <name>" prompt and the station's own modal, both unchanged.
//
// Room dimensions are GUILD_INTERIOR_WIDTH/HEIGHT (world px, unchanged) at
// this module's own withSprite scale, so W/H stay in step with the data
// file automatically.
const W = GUILD_INTERIOR_WIDTH / UNIT; // 350 logical
const H = GUILD_INTERIOR_HEIGHT / UNIT; // 270 logical

// Book-spine colours for the west shelf — a fixed rotation through PAL, not
// each project's own accent (station.color is a hex literal outside PAL,
// so it can drive nothing this module paints; the "paints only palette
// colours" contract test would fail the instant it touched a fillRect).
const BOOK_TONES = [PAL.roof, PAL.arcane, PAL.leaf, PAL.gold, PAL.steel, PAL.glass] as const;

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

  // Pulsing arcane display floating above the column — the one luminous
  // element on the pedestal, so the one place alpha is allowed. Restored
  // to 1 in `finally` even if a future edit makes the body above throw.
  box(ctx, x + 8, y - 8, 16, 10, PAL.arcaneD);
  try {
    const pulse = 0.55 + 0.45 * Math.sin(t * 0.004 + x);
    ctx.globalAlpha = pulse;
    px(ctx, x + 9, y - 7, 14, 8, PAL.arcane);
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
    // (8 rows starting one row down, each 6px narrower) leaves a 1px gold
    // border on every edge with no separate stroke call. ---
    pixelDisc(ctx, W / 2, 150, [20, 34, 44, 50, 52, 52, 50, 44, 34, 20], PAL.gold);
    pixelDisc(ctx, W / 2, 151, [28, 38, 44, 46, 46, 44, 38, 28], PAL.roof, false);

    // --- Project exhibition pedestals, one per station. ---
    GUILD_PROJECT_STATIONS.forEach((s) => drawStationPedestal(ctx, s, t));
  });

  void charactersImage; // Architect Astro at the desk is drawn by the caller.
}
