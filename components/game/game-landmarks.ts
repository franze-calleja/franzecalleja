import { WORLD_OBJECTS, type WorldObject } from "./game-data";
import {
  px, box, dith, withSprite, pixelDisc, pixelRing, gableRoof, steppedRoof,
  type PixelCtx, type Drawable,
} from "./game-pixel";
import { PAL } from "./game-palette";

// This module holds every fixed, non-collision landmark that predates the
// pixel contract and used to paint with gradients/arcs/rgba: statues and
// banners (each collected as an individually baseline-sorted Drawable, since
// that per-item sort is what fixed the old occlusion bug), plus the two
// heaviest curve users in the whole codebase — the central fountain (26
// arcs vs. 37 rects) and the basketball court (7 arcs vs. 9 rects) — which
// used to live in game-canvas.tsx as one-off, non-data-driven fixtures.
// They moved here for the same reason statues/banners did: this is where
// the "not data-driven, individually fixed" scene furniture belongs, and
// keeping them beside the toolkit's other pixelDisc/pixelRing consumers
// makes the shared row-width tables easy to compare against.

// --- Basketball court -------------------------------------------------------

/** Centre-circle / free-throw-circle / 3-point-arc row-width tables — all
 *  even, all consumed by `pixelRing` so they read as painted lines, not
 *  filled discs (rule: court markings are outlines in PAL.pathL, no fill). */
const FREE_THROW_RING = [8, 14, 18, 18, 14, 8] as const;
const THREE_PT_RING = [24, 34, 42, 46] as const; // upper half only — the arc hugs the baseline
const CENTER_RING = [10, 16, 18] as const; // half-circle bulge at the court's own bottom edge

/**
 * Flat on the ground, in the ground band with terrain and tall-grass bases
 * — never y-sorted, so it never needs a baseline. `time` is accepted so its
 * signature matches every other reconstructed renderer, and gives the ball
 * a small idle bounce instead of sitting dead still.
 */
export function drawBasketballCourt(ctx: CanvasRenderingContext2D, time: number): void {
  withSprite(ctx as unknown as PixelCtx, 730, 535, () => {
    const c = ctx as unknown as PixelCtx;
    const w = 45; // half of the original 90-world-px court, in logical units
    const h = 50; // half of the original 100-world-px court

    // Opaque stepped drop shadow — no ellipse, no alpha.
    px(c, -w / 2 + 3, h + 1, w - 6, 1, PAL.grassX);
    px(c, -w / 2 + 1, h + 2, w - 2, 1, PAL.grassX);
    px(c, -w / 2 + 3, h + 3, w - 6, 1, PAL.grassX);

    // Concrete apron border, then the terracotta hardwood surface inset.
    box(c, -w / 2 - 2, -2, w + 4, h + 4, PAL.stoneD);
    px(c, -w / 2 - 1, -1, w + 2, 1, PAL.stoneL);
    box(c, -w / 2, 0, w, h, PAL.roof);
    dith(c, -w / 2 + 1, 1, w - 2, h - 2, PAL.roof, PAL.roofD);
    // Parquet plank grooves.
    for (let py = 4; py < h; py += 3) px(c, -w / 2 + 1, py, w - 2, 1, PAL.roofX);

    // Painted lane / key, gold-bordered.
    const keyW = 16, keyH = 22;
    box(c, -keyW / 2, 2, keyW, keyH, PAL.steelX);
    px(c, -keyW / 2, 2, keyW, 1, PAL.gold);
    px(c, -keyW / 2, 2, 1, keyH, PAL.gold);
    px(c, keyW / 2 - 1, 2, 1, keyH, PAL.gold);

    // Free-throw circle at the head of the key.
    pixelRing(c, 0, keyH, FREE_THROW_RING, PAL.pathL);
    // 3-point arc — upper half only, hugging the court's top edge.
    pixelRing(c, 0, -1, THREE_PT_RING, PAL.pathL);
    // Half-court circle bulging up from the bottom baseline, plus the line.
    px(c, -w / 2 + 1, h - 4, w - 2, 1, PAL.pathL);
    pixelRing(c, 0, h - 4 - CENTER_RING.length, CENTER_RING, PAL.pathL);
    // Perimeter out-of-bounds line.
    px(c, -w / 2 + 1, 1, w - 2, 1, PAL.pathL);
    px(c, -w / 2 + 1, h - 2, w - 2, 1, PAL.pathL);
    px(c, -w / 2 + 1, 1, 1, h - 2, PAL.pathL);
    px(c, w / 2 - 2, 1, 1, h - 2, PAL.pathL);

    // Hoop: padded stanchion base, straight support post, backboard, rim, net.
    const hx = 0, hy = 2;
    box(c, hx - 3, hy - 2, 6, 4, PAL.steelX);
    px(c, hx - 2, hy - 1, 4, 2, PAL.steel);
    px(c, hx - 1, hy - 4, 2, 4, PAL.steelD); // straight support post — always was a line, not a curve
    box(c, hx - 9, hy - 10, 18, 6, PAL.glass);
    px(c, hx - 8, hy - 9, 16, 1, PAL.glassL);
    px(c, hx - 4, hy - 8, 8, 3, PAL.bloom); // red target square
    px(c, hx - 1, hy - 4, 2, 1, PAL.bloom); // rim
    const NET = [8, 6, 4, 2] as const;
    NET.forEach((nw, i) => px(c, hx - nw / 2, hy - 3 + i, nw, 1, PAL.wallL));

    // Basketball, with a subtle idle bounce.
    const bounce = Math.round(Math.abs(Math.sin(time * 0.003)) * 2);
    const bx = w / 4, by = h - 22 - bounce;
    px(c, bx - 2, by + 5, 6, 1, PAL.grassX); // ball shadow, opaque
    const BALL = [4, 6, 6, 4] as const;
    pixelDisc(c, bx, by, BALL, PAL.roof);
    px(c, bx - 3, by + 2, 6, 1, PAL.roofX); // seam
    px(c, bx, by, 1, 4, PAL.roofX); // seam
    px(c, bx - 2, by, 1, 1, PAL.roofL); // glint
  });
}

// --- Central fountain --------------------------------------------------------

/**
 * The fountain is a single fixed-position landmark (not data-driven, unlike
 * every other category), so it takes part in the scene layer's y-sort as
 * one hardcoded Drawable rather than through a collect* function — the call
 * site in game-canvas.tsx builds `{ baseline: FOUNTAIN_BASELINE, draw: ()
 * => drawCentralFountain(ctx, time) }` directly.
 *
 * Reconstructed as concentric `pixelDisc` tiers anchored at world (420,
 * 378): the basin is drawn with `pixelDisc(c, 0, BASIN_Y, BASIN, ...)`
 * where BASIN_Y=13, an 8-row table, so its outline (each row's outline
 * band spans `[y+i-1, y+i+2)` — see pixelDisc's two-pass doc comment)
 * bottoms out at local y = 13 + 8 + 1 = 22, i.e. world y = 378 + 2*22 =
 * 422. That is the fountain's own
 * opaque footprint edge, matching the pre-conversion apron ring's baseline
 * exactly (both derive from the same real-world size), so this constant is
 * unchanged from before the reconstruction: 422. A regression test
 * (lib/game-landmarks.test.ts, "FOUNTAIN_BASELINE") renders the fountain in
 * world space and asserts this by construction rather than by comment, so
 * this comment cannot silently go stale the way the pre-Task-16 shadow-vs-
 * masonry mixup did (26px error a player would have walked straight
 * through, since the fountain has no collision box). The ground shadow is
 * drawn coincident with the basin's own bottom rows — the same convention
 * game-props.ts uses for every other prop's shadow — not offset further
 * below the way the old translucent drop-shadow ellipse was.
 */
export const FOUNTAIN_BASELINE = 422;

const BASIN = [30, 46, 56, 60, 60, 56, 46, 30] as const; // 8 rows, outline bottoms at local y=22
const COPING = [20, 34, 44, 48, 48, 44, 34, 20] as const;
const POOL = [10, 20, 26, 28, 28, 26, 20, 10] as const;
const MID = [18, 28, 34, 34, 28, 18] as const;
const WATER_MID = [14, 14] as const;
const TOP = [8, 14, 14, 8] as const;
/** Ripple band width per animation frame — deliberately uneven counts so a
 *  frame change is visible in the *number* of rects drawn, not just their
 *  position (a same-count-different-position ripple would pass a weaker,
 *  vacuous "did something change" test without actually proving the branch
 *  fires on all three frames). */
const RIPPLE_W = [16, 22, 28] as const;

export function drawCentralFountain(ctx: CanvasRenderingContext2D, time: number): void {
  withSprite(ctx as unknown as PixelCtx, 420, 378, () => {
    const c = ctx as unknown as PixelCtx;
    const frame = Math.floor(time / 200) % 3;

    // Opaque stepped shadow, peeking from beneath the basin's silhouette —
    // no ellipse, no alpha, drawn first so the basin paints over its centre.
    px(c, -32, 20, 64, 1, PAL.grassX);
    px(c, -28, 21, 56, 1, PAL.grassX);
    px(c, -25, 22, 50, 1, PAL.grassX);

    // Tier 1: bluestone apron basin — outer rim, inset coping, water pool.
    // y=13 so the outline pass (which bleeds 1 row above and 2 below the
    // last table entry — see pixelDisc's doc comment) bottoms out at local
    // y = 13 + 8 + 1 = 22, i.e. world y = 378 + 2*22 = 422 = FOUNTAIN_BASELINE.
    const BASIN_Y = 13;
    pixelDisc(c, 0, BASIN_Y, BASIN, PAL.stone);
    COPING.forEach((w, i) => px(c, -w / 2, BASIN_Y + i, w, 1, PAL.stoneL));
    POOL.forEach((w, i) => {
      const tone = (i + frame) % 2 === 0 ? PAL.glass : PAL.glassD;
      px(c, -w / 2, BASIN_Y + i, w, 1, tone);
    });
    // Ripple shimmer — one dithered band whose width cycles with the frame,
    // so the rect count itself (not just pixel colour) changes per frame.
    const rw = RIPPLE_W[frame];
    dith(c, -rw / 2, BASIN_Y + 3, rw, 1, PAL.glassL, PAL.glass);

    // Moss and wish-coin accents on the rim.
    px(c, -26, BASIN_Y + 5, 3, 2, PAL.leaf);
    px(c, 24, BASIN_Y + 4, 3, 2, PAL.leaf);
    px(c, -10, BASIN_Y + 6, 2, 2, PAL.gold);
    px(c, 12, BASIN_Y + 5, 2, 2, PAL.gold);

    // Lion-spout inward streams — small droplets on a swaying path, not a
    // quadraticCurveTo stream.
    const spoutSway = Math.round(Math.sin(time * 0.006) * 2);
    px(c, -33, BASIN_Y + 1, 4, 4, PAL.stone);
    px(c, 30, BASIN_Y + 1, 4, 4, PAL.stone);
    px(c, -20 + spoutSway, BASIN_Y + 3, 1, 1, PAL.glassL);
    px(c, 20 - spoutSway, BASIN_Y + 3, 1, 1, PAL.glassL);

    // Column from the basin up to the mid bowl.
    box(c, -5, 8, 10, 6, PAL.stone);
    px(c, -4, 8, 2, 6, PAL.stoneL);

    // Tier 2: mid scalloped bowl, with its own small water inset.
    pixelDisc(c, 0, 2, MID, PAL.stoneL);
    WATER_MID.forEach((w, i) => px(c, -w / 2, 3 + i, w, 1, i === 0 ? PAL.glassD : PAL.glass));
    px(c, -9, 3, 3, 1, PAL.goldD); // gold acanthus band accent
    px(c, 6, 3, 3, 1, PAL.gold);

    // Column from the mid bowl up to the top chalice.
    box(c, -3, -5, 6, 6, PAL.stone);
    px(c, -2, -5, 2, 6, PAL.stoneL);

    // Tier 3: golden chalice crown, with a water inset.
    pixelDisc(c, 0, -9, TOP, PAL.gold);
    px(c, -3, -8, 6, 2, PAL.glassD);

    // Geyser jet, pulsing in height.
    const jetH = 6 + Math.round(Math.sin(time * 0.01) * 2);
    px(c, -1, -10 - jetH, 2, jetH, PAL.glassL);
    px(c, 0, -10 - jetH, 1, jetH, PAL.wallL);

    // Spout droplets on a sine path — 1x1 pixels, never an arc.
    for (let i = 0; i < 5; i++) {
      const ph = ((time * 0.002 + i * 0.2) % 1 + 1) % 1;
      const dx = Math.round(Math.sin(ph * Math.PI * 2 + i) * 5);
      const dy = Math.round(-10 - jetH + ph * (jetH + 6));
      px(c, dx, dy, 1, 1, PAL.glassL);
    }
  });
}

// --- Banners -----------------------------------------------------------------

interface BannerTone { dark: string; mid: string; light: string; trim: string }

/** Nearest opaque palette ramp per banner's original rgba scheme. Lebron's
 *  royal purple has no palette equivalent (the world palette has no purple
 *  ramp) so it maps to the blue "arcane" ramp instead — still a cool, rich
 *  "royal" tone with the same gold trim, not a literal colour match. */
const BANNER_TONE: Record<string, BannerTone> = {
  "banner-mseuf": { dark: PAL.roofX, mid: PAL.roofD, light: PAL.roof, trim: PAL.gold },
  "banner-raones": { dark: PAL.steelX, mid: PAL.steel, light: PAL.steelL, trim: PAL.arcane },
  "banner-ellipsense": { dark: PAL.leafX, mid: PAL.leafD, light: PAL.leaf, trim: PAL.leafL },
  "banner-techbears": { dark: PAL.goldX, mid: PAL.goldD, light: PAL.gold, trim: PAL.goldL },
  "banner-lebron": { dark: PAL.arcaneX, mid: PAL.arcaneD, light: PAL.arcane, trim: PAL.gold },
};
const DEFAULT_BANNER_TONE: BannerTone = { dark: PAL.roofX, mid: PAL.roofD, light: PAL.roof, trim: PAL.gold };

const CLOTH_X0 = 5, CLOTH_W = 17, CLOTH_Y0 = 2, CLOTH_H = 19;

function drawOneBanner(ctx: CanvasRenderingContext2D, time: number, banner: WorldObject): void {
  withSprite(ctx as unknown as PixelCtx, banner.x, banner.y, () => {
    const c = ctx as unknown as PixelCtx;
    const tone = BANNER_TONE[banner.id] ?? DEFAULT_BANNER_TONE;

    // Opaque stepped shadow at the pole's base.
    px(c, 3, CLOTH_Y0 + CLOTH_H, 6, 1, PAL.grassX);
    px(c, 2, CLOTH_Y0 + CLOTH_H + 1, 8, 1, PAL.grassX);
    px(c, 3, CLOTH_Y0 + CLOTH_H + 2, 6, 1, PAL.grassX);

    // Turned hardwood flagpole with brass collar rings.
    box(c, 2, -3, 4, CLOTH_H + 5, PAL.wood);
    px(c, 2, -3, 1, CLOTH_H + 5, PAL.woodL);
    px(c, 2, 5, 4, 1, PAL.gold);
    px(c, 2, 15, 4, 1, PAL.gold);

    // Spearhead finial — a monotonic taper (point to base), the same shape
    // family gableRoof already builds for a roof, hand-rolled here since it
    // is only 3 rows.
    px(c, 3, -6, 1, 1, PAL.goldD);
    px(c, 2, -5, 3, 1, PAL.gold);
    px(c, 1, -4, 5, 1, PAL.goldD);

    // Hanging tassel cord — a short dithered strip, not a bezier.
    dith(c, 1, 1, 1, 4, PAL.gold, PAL.goldD);
    px(c, 0, 5, 2, 2, PAL.goldD);

    // Cloth: vertical px strips, each column's y-offset a rounded sine wave
    // so the free edge ripples — never a bezier. The trailing third forks
    // into a swallowtail by leaving a gap in its middle rows.
    const seamCol = Math.floor(CLOTH_W * 0.5);
    for (let col = 0; col < CLOTH_W; col++) {
      const x = CLOTH_X0 + col;
      const wy = Math.round(Math.sin(time * 0.005 + banner.x * 0.05 + col * 0.35) * 2);
      const fill = col < seamCol ? tone.mid : tone.light;
      if (col > CLOTH_W * 0.72) {
        const notchStart = Math.round(CLOTH_H * 0.35);
        const notchEnd = Math.round(CLOTH_H * 0.65);
        px(c, x, CLOTH_Y0 + wy, 1, notchStart, fill);
        px(c, x, CLOTH_Y0 + wy + notchEnd, 1, CLOTH_H - notchEnd, fill);
      } else {
        px(c, x, CLOTH_Y0 + wy, 1, CLOTH_H, fill);
      }
    }
    const seamWy = Math.round(Math.sin(time * 0.005 + banner.x * 0.05 + seamCol * 0.35) * 2);
    dith(c, CLOTH_X0 + seamCol - 1, CLOTH_Y0 + seamWy, 2, CLOTH_H, tone.dark, tone.mid);

    // Gold trim border along the hoist edge and top/bottom hems.
    px(c, CLOTH_X0, CLOTH_Y0, 1, CLOTH_H, tone.trim);
    px(c, CLOTH_X0, CLOTH_Y0, CLOTH_W, 1, tone.trim);

    // Crest badge, distinct per org, using only the trim/dark tones.
    const cx = CLOTH_X0 + Math.round(CLOTH_W * 0.55);
    const cy = CLOTH_Y0 + Math.round(CLOTH_H * 0.4);
    switch (banner.id) {
      case "banner-mseuf": // crown
        px(c, cx - 3, cy, 2, 2, tone.trim);
        px(c, cx - 1, cy - 1, 2, 2, tone.trim);
        px(c, cx + 2, cy, 2, 2, tone.trim);
        px(c, cx - 4, cy + 2, 8, 2, tone.trim);
        px(c, cx - 2, cy + 2, 1, 1, PAL.bloom);
        break;
      case "banner-raones": // lightning bolt
        px(c, cx + 1, cy - 4, 2, 3, tone.trim);
        px(c, cx - 1, cy - 1, 2, 3, tone.trim);
        px(c, cx + 1, cy + 2, 2, 3, tone.trim);
        break;
      case "banner-ellipsense": // globe
        pixelDisc(c, cx, cy - 4, [4, 6, 6, 4], tone.trim, false);
        px(c, cx - 3, cy - 1, 6, 1, tone.dark);
        break;
      case "banner-techbears": // chevron fleet badge
        px(c, cx - 4, cy - 3, 2, 2, tone.trim);
        px(c, cx, cy - 1, 2, 2, tone.trim);
        px(c, cx + 3, cy - 3, 2, 2, tone.trim);
        px(c, cx - 4, cy + 1, 2, 2, tone.trim);
        px(c, cx + 3, cy + 1, 2, 2, tone.trim);
        break;
      case "banner-lebron": // crown + star
        px(c, cx - 3, cy, 2, 2, tone.trim);
        px(c, cx - 1, cy - 1, 2, 2, tone.trim);
        px(c, cx + 2, cy, 2, 2, tone.trim);
        px(c, cx - 4, cy + 2, 8, 2, tone.trim);
        px(c, cx - 1, cy + 4, 2, 2, PAL.wallL);
        break;
    }

    // Bullion fringe tassels along the bottom hem, following the same sway.
    for (let i = 0; i < 4; i++) {
      const fx = CLOTH_X0 + 2 + i * 4;
      const fwy = Math.round(Math.sin(time * 0.005 + banner.x * 0.05 + (fx - CLOTH_X0) * 0.35) * 2);
      px(c, fx, CLOTH_Y0 + CLOTH_H + fwy, 2, 3, tone.trim);
    }
  });
}

/** One Drawable per banner, baseline = banner.y + banner.height — the same
 *  obj.y + obj.height convention as buildings, since WorldObject shares the
 *  field. */
export function collectBanners(ctx: CanvasRenderingContext2D, time: number): Drawable[] {
  return WORLD_OBJECTS.filter((o) => o.type === "banner").map((banner) => ({
    baseline: banner.y + banner.height,
    draw: () => drawOneBanner(ctx, time, banner),
  }));
}

/** Draws every banner directly, bypassing the y-sort — used by the test
 *  suite and available the same way drawFences/drawBushes/etc. are in
 *  game-props.ts. */
export function drawBanners(ctx: CanvasRenderingContext2D, time: number): void {
  collectBanners(ctx, time).forEach((d) => d.draw());
}

// --- Statues -----------------------------------------------------------------

function drawStatuePlinth(c: PixelCtx): void {
  // Opaque stepped shadow — no ellipse, no alpha.
  px(c, 4, 32, 17, 1, PAL.grassX);
  px(c, 2, 33, 21, 1, PAL.grassX);
  px(c, 4, 34, 17, 1, PAL.grassX);

  // Bottom masonry tier.
  box(c, 2, 24, 21, 7, PAL.stone);
  px(c, 2, 24, 21, 1, PAL.stoneL);
  dith(c, 3, 25, 19, 5, PAL.stone, PAL.stoneD);

  // Mid beveled tier.
  box(c, 4, 19, 17, 6, PAL.stoneL);
  dith(c, 5, 20, 15, 4, PAL.stoneL, PAL.stone);

  // Moss accents.
  px(c, 3, 27, 2, 2, PAL.leaf);
  px(c, 19, 26, 2, 2, PAL.leaf);
}

/** Faceted gem silhouette — a symmetric taper, exactly what `pixelDisc`
 *  already builds, reused here instead of a bespoke diamond shape. */
const GEM = [4, 10, 14, 10, 4] as const;
/** Whale-body silhouette — a short, wide `pixelDisc` (few rows, big
 *  widths), which reads as a flattened oval body rather than a tall circle. */
const WHALE_BODY = [10, 16, 20, 14, 8] as const;

function drawNextjsMotif(c: PixelCtx, time: number, float: number): void {
  const topY = 2 + float;
  const rows = gableRoof(2, 18, 0, 5, 12);
  const shifted = rows.map(([x, y, w]) => [x, y + topY, w] as const);
  steppedRoof(c, [...shifted], { l: PAL.glassL, m: PAL.glass, d: PAL.glassD, x: PAL.steelX });

  // A single stepped orbit ring plus two sparkle motes chasing each other
  // around it — the replacement for three tilted ctx.ellipse rings.
  pixelRing(c, 12, 14 + float, [4, 14, 18, 14, 4], PAL.glass);
  const orbit = time * 0.003;
  px(c, 12 + Math.round(Math.cos(orbit) * 9), Math.round(15 + float + Math.sin(orbit) * 3), 1, 1, PAL.wallL);
  px(c, 12 - Math.round(Math.cos(orbit) * 9), Math.round(15 + float - Math.sin(orbit) * 3), 1, 1, PAL.glassL);
}

function drawTypescriptMotif(c: PixelCtx, float: number): void {
  const topY = 4 + float;
  const rows = gableRoof(6, 16, 0, 10, 12);
  const shifted = rows.map(([x, y, w]) => [x, y + topY, w] as const);
  steppedRoof(c, [...shifted], { l: PAL.glassL, m: PAL.glass, d: PAL.glassD, x: PAL.steelX });
  // Gold pyramidion cap.
  px(c, 10, topY - 3, 4, 3, PAL.gold);
  px(c, 11, topY - 4, 2, 1, PAL.goldL);
  // Type-check rune ring at the base.
  pixelRing(c, 12, topY + 21, [8, 14, 8], PAL.glass);
}

function drawPostgresMotif(c: PixelCtx, time: number, float: number): void {
  const cx = 12, cy = 18 + float;
  pixelDisc(c, cx, cy - 7, GEM, PAL.glass);
  px(c, cx - 1, cy - 6, 2, 2, PAL.glassL); // facet gleam
  px(c, cx - 3, cy - 1, 6, 1, PAL.wallL);
  px(c, cx - 2, cy + 2, 4, 1, PAL.wallL);
  // Orbiting binary data motes, replacing the "1"/"0" glyphs.
  const orbit = time * 0.005;
  px(c, cx + Math.round(Math.cos(orbit) * 8), cy + Math.round(Math.sin(orbit) * 4), 1, 1, PAL.glassL);
  px(c, cx - Math.round(Math.cos(orbit) * 8), cy - Math.round(Math.sin(orbit) * 4), 1, 1, PAL.glassL);
}

function drawDockerMotif(c: PixelCtx, time: number, float: number): void {
  const dx = 12, dy = 18 + float;
  pixelDisc(c, dx, dy + 6, WHALE_BODY, PAL.steel);
  px(c, dx - 8, dy + 8, 1, 1, PAL.glassL); // eye
  px(c, dx - 10, dy + 6, 3, 3, PAL.steelD); // tail flipper

  // Stacked shipping containers.
  box(c, dx - 5, dy - 1, 4, 4, PAL.glass);
  box(c, dx, dy - 1, 4, 4, PAL.gold);
  box(c, dx - 3, dy - 5, 4, 4, PAL.arcane); // top crate — arcane cyan reads against grass better than leaf-green

  // Blowhole droplets on a sine path — never an arc.
  const ph = (time * 0.004) % 1;
  px(c, dx + 4, Math.round(dy - 3 - ph * 5), 1, 1, PAL.glassL);
}

function drawOneStatue(ctx: CanvasRenderingContext2D, time: number, statue: WorldObject): void {
  withSprite(ctx as unknown as PixelCtx, statue.x, statue.y, () => {
    const c = ctx as unknown as PixelCtx;
    drawStatuePlinth(c);
    const float = Math.round(Math.sin(time * 0.005 + statue.x) * 1.5);

    switch (statue.id) {
      case "statue-nextjs": drawNextjsMotif(c, time, float); break;
      case "statue-typescript": drawTypescriptMotif(c, float); break;
      case "statue-postgres": drawPostgresMotif(c, time, float); break;
      case "statue-docker": drawDockerMotif(c, time, float); break;
    }
  });
}

/** One Drawable per statue, baseline = statue.y + statue.height. */
export function collectStatues(ctx: CanvasRenderingContext2D, time: number): Drawable[] {
  return WORLD_OBJECTS.filter((o) => o.type === "statue").map((statue) => ({
    baseline: statue.y + statue.height,
    draw: () => drawOneStatue(ctx, time, statue),
  }));
}

/** Draws every statue directly, bypassing the y-sort — see drawBanners. */
export function drawStatues(ctx: CanvasRenderingContext2D, time: number): void {
  collectStatues(ctx, time).forEach((d) => d.draw());
}
