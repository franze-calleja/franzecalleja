import { WORLD_OBJECTS, type WorldObject } from "./game-data";
import {
  px, box, dith, withSprite, pixelDisc, pixelRing,
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
 * The flat court surface only: apron, hardwood, key, circles, arcs and
 * out-of-bounds lines. Flat on the ground, in the ground band with terrain
 * and tall-grass bases — never y-sorted, so it never needs a baseline. The
 * hoop (backboard, post, rim, net, ball) used to be drawn here too, but
 * those are standing objects, not ground texture — see `drawBasketballHoop`
 * / `collectBasketballHoop`, which now handle them as their own y-sorted
 * Drawable (fix round 2 / review item 7). `time` is accepted so this
 * function's signature matches every other reconstructed renderer, even
 * though nothing here animates now that the ball has moved out.
 */
export function drawBasketballCourt(ctx: CanvasRenderingContext2D, time: number): void {
  void time;
  withSprite(ctx as unknown as PixelCtx, 730, 535, () => {
    const c = ctx as unknown as PixelCtx;
    // Top-left anchored, matching PATH_AREAS's { x: 730, y: 535, w: 90, h:
    // 100 } exactly — that rect drives the stone path texture painted
    // underneath by drawPaths(), so the court's own art must start at this
    // sprite's local (0, 0) and extend to (w, h), never centre on it (an
    // earlier version centred here, silently shifting the court 45 world px
    // off the texture it's supposed to sit on). w=45 and h=50 are the full
    // logical width/height (90/UNIT and 100/UNIT) — not half-widths.
    const w = 45;
    const h = 50;
    // True centre (w/2=22.5) is fractional since w is odd; every coordinate
    // in this renderer must stay an integer (withSprite's own contract), so
    // every "centred" element below is centred on this instead, 1 world px
    // off true centre — imperceptible, and it keeps `Number.isInteger` true
    // for every rect this function emits.
    const cx = 22;

    // Opaque stepped drop shadow — no ellipse, no alpha.
    px(c, 3, h + 1, w - 6, 1, PAL.grassX);
    px(c, 1, h + 2, w - 2, 1, PAL.grassX);
    px(c, 3, h + 3, w - 6, 1, PAL.grassX);

    // Concrete apron border, then the terracotta hardwood surface inset.
    box(c, -2, -2, w + 4, h + 4, PAL.stoneD);
    px(c, -1, -1, w + 2, 1, PAL.stoneL);
    box(c, 0, 0, w, h, PAL.roof);
    dith(c, 1, 1, w - 2, h - 2, PAL.roof, PAL.roofD);
    // Parquet plank grooves.
    for (let py = 4; py < h; py += 3) px(c, 1, py, w - 2, 1, PAL.roofX);

    // Painted lane / key, gold-bordered.
    const keyW = 16, keyH = 22;
    box(c, cx - keyW / 2, 2, keyW, keyH, PAL.steelX);
    px(c, cx - keyW / 2, 2, keyW, 1, PAL.gold);
    px(c, cx - keyW / 2, 2, 1, keyH, PAL.gold);
    px(c, cx + keyW / 2 - 1, 2, 1, keyH, PAL.gold);

    // Free-throw circle at the head of the key.
    pixelRing(c, cx, keyH, FREE_THROW_RING, PAL.pathL);
    // 3-point arc — upper half only, hugging the court's top edge.
    pixelRing(c, cx, -1, THREE_PT_RING, PAL.pathL);
    // Half-court circle bulging up from the bottom baseline, plus the line.
    px(c, 1, h - 4, w - 2, 1, PAL.pathL);
    pixelRing(c, cx, h - 4 - CENTER_RING.length, CENTER_RING, PAL.pathL);
    // Perimeter out-of-bounds line.
    px(c, 1, 1, w - 2, 1, PAL.pathL);
    px(c, 1, h - 2, w - 2, 1, PAL.pathL);
    px(c, 1, 1, 1, h - 2, PAL.pathL);
    px(c, w - 2, 1, 1, h - 2, PAL.pathL);
  });
}

/**
 * The hoop: padded stanchion base, straight support post, backboard, rim,
 * net, and the ball. Split out of drawBasketballCourt (fix round 2 / review
 * item 7) because unlike the flat court surface, these are STANDING objects
 * — the backboard alone sits at world y~519..531, well above the ground —
 * so leaving them in the unsorted ground band meant a player walking north
 * of the hoop was always painted over the backboard instead of behind it.
 * Anchored at the same (730, 535) sprite origin and using the same
 * `cx`/`hy` local coordinates as the court surface, so the hoop lines up
 * with it pixel-for-pixel.
 */
function drawBasketballHoop(ctx: CanvasRenderingContext2D, time: number): void {
  withSprite(ctx as unknown as PixelCtx, 730, 535, () => {
    const c = ctx as unknown as PixelCtx;
    const cx = 22;
    const hy = 2;

    box(c, cx - 3, hy - 2, 6, 4, PAL.steelX);
    px(c, cx - 2, hy - 1, 4, 2, PAL.steel);
    px(c, cx - 1, hy - 4, 2, 4, PAL.steelD); // straight support post — always was a line, not a curve
    box(c, cx - 9, hy - 10, 18, 6, PAL.glass);
    px(c, cx - 8, hy - 9, 16, 1, PAL.glassL);
    px(c, cx - 4, hy - 8, 8, 3, PAL.bloom); // red target square
    px(c, cx - 1, hy - 4, 2, 1, PAL.bloom); // rim
    const NET = [8, 6, 4, 2] as const;
    NET.forEach((nw, i) => px(c, cx - nw / 2, hy - 3 + i, nw, 1, PAL.wallL));

    // Basketball, with a subtle idle bounce. Position is a fixed integer
    // (not w/4, which is fractional) placed right-of-centre on the court.
    const bounce = Math.round(Math.abs(Math.sin(time * 0.003)) * 2);
    const bx = 32, by = 28 - bounce;
    px(c, bx - 2, by + 5, 6, 1, PAL.grassX); // ball shadow, opaque
    const BALL = [4, 6, 6, 4] as const;
    pixelDisc(c, bx, by, BALL, PAL.roof);
    px(c, bx - 3, by + 2, 6, 1, PAL.roofX); // seam
    px(c, bx, by, 1, 4, PAL.roofX); // seam
    px(c, bx - 2, by, 1, 1, PAL.roofL); // glint
  });
}

/**
 * One Drawable for the hoop, baseline at the stanchion base's own bottom
 * edge — `box(c, cx-3, hy-2, 6, 4, ...)` bottoms out at local y = hy+2 = 4,
 * i.e. world y = 535 + 2*4 = 543 — so it takes part in the scene layer's
 * y-sort instead of sitting in the unsorted ground band with the flat court
 * surface.
 */
export function collectBasketballHoop(ctx: CanvasRenderingContext2D, time: number): Drawable[] {
  return [{ baseline: 543, draw: () => drawBasketballHoop(ctx, time) }];
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
type BannerCut = "swallowtail" | "pennant" | "notched" | "square" | "championship";

/** Nearest opaque palette ramp per banner's original rgba scheme. Lebron's
 *  royal purple now maps to PAL.violetL/violetD (added for the Guild
 *  interior's aem station) instead of borrowing the blue "arcane" ramp —
 *  that substitution predated violet's addition to the palette. Violet is
 *  only a light/dark pair (no separate mid tone), so `dark` and `mid` both
 *  use violetD and `light` is violetL; the gold trim doubles as a nod to
 *  Lebron's own purple-and-gold colours. */
const BANNER_TONE: Record<string, BannerTone> = {
  "banner-mseuf": { dark: PAL.roofX, mid: PAL.roofD, light: PAL.roof, trim: PAL.gold },
  "banner-raones": { dark: PAL.steelX, mid: PAL.steel, light: PAL.steelL, trim: PAL.arcane },
  "banner-ellipsense": { dark: PAL.leafX, mid: PAL.leafD, light: PAL.leaf, trim: PAL.leafL },
  "banner-techbears": { dark: PAL.goldX, mid: PAL.goldD, light: PAL.gold, trim: PAL.goldL },
  "banner-lebron": { dark: PAL.violetD, mid: PAL.violetD, light: PAL.violetL, trim: PAL.gold },
};
const DEFAULT_BANNER_TONE: BannerTone = { dark: PAL.roofX, mid: PAL.roofD, light: PAL.roof, trim: PAL.gold };
const BANNER_CUT: Record<string, BannerCut> = {
  "banner-mseuf": "square",
  "banner-raones": "pennant",
  "banner-ellipsense": "notched",
  "banner-techbears": "swallowtail",
  "banner-lebron": "championship",
};

const CLOTH_X0 = 4, CLOTH_W = 19, CLOTH_Y0 = 2, CLOTH_H = 18;

function drawOneBanner(ctx: CanvasRenderingContext2D, time: number, banner: WorldObject): void {
  withSprite(ctx as unknown as PixelCtx, banner.x, banner.y, () => {
    const c = ctx as unknown as PixelCtx;
    const tone = BANNER_TONE[banner.id] ?? DEFAULT_BANNER_TONE;
    const cut = BANNER_CUT[banner.id] ?? "swallowtail";

    // A shared stone-and-brass podium makes this row feel like a career
    // avenue of standards, rather than loose flags planted in grass.
    px(c, 2, 26, 20, 2, PAL.grassX);
    box(c, 5, 22, 13, 5, PAL.out);
    px(c, 6, 23, 11, 2, PAL.stone);
    px(c, 4, 27, 15, 2, PAL.stoneD);
    px(c, 6, 27, 11, 1, PAL.stoneL);

    // Framed ceremonial mount: pole, crossbar, and a deliberately visible
    // hanging point. The bracket is shared; the cloth cut and crest vary.
    box(c, 1, -4, 3, 27, PAL.wood);
    px(c, 1, -4, 1, 27, PAL.woodL);
    px(c, 1, 6, 3, 1, PAL.gold);
    px(c, 1, 17, 3, 1, PAL.gold);
    box(c, 2, 0, 22, 3, PAL.out);
    px(c, 3, 1, 20, 1, tone.trim);

    // Spearhead finial — a monotonic taper (point to base), the same shape
    // family gableRoof already builds for a roof, hand-rolled here since it
    // is only 3 rows.
    px(c, 1, -7, 2, 1, PAL.goldD);
    px(c, 0, -6, 4, 1, PAL.gold);
    px(c, -1, -5, 6, 1, PAL.goldD);

    // Hanging tassel cord — a short dithered strip, not a bezier.
    dith(c, 1, 1, 1, 4, PAL.gold, PAL.goldD);
    px(c, 0, 5, 2, 2, PAL.goldD);

    // Cloth: vertical strips drift independently. The final columns are
    // cut to each organisation's standard shape instead of one shared tail.
    const seamCol = Math.floor(CLOTH_W * 0.5);
    for (let col = 0; col < CLOTH_W; col++) {
      const x = CLOTH_X0 + col;
      const wy = Math.round(Math.sin(time * 0.005 + banner.x * 0.05 + col * 0.35) * 2);
      const fill = col < seamCol ? tone.mid : tone.light;
      const isTail = col > CLOTH_W * 0.72;
      if (isTail && cut === "swallowtail") {
        px(c, x, CLOTH_Y0 + wy, 1, 7, fill);
        px(c, x, CLOTH_Y0 + wy + 12, 1, 6, fill);
      } else if (isTail && cut === "notched") {
        px(c, x, CLOTH_Y0 + wy, 1, col % 2 === 0 ? 14 : 18, fill);
      } else if (isTail && cut === "pennant") {
        px(c, x, CLOTH_Y0 + wy + Math.floor((col - 13) / 2), 1, CLOTH_H - Math.floor((col - 13) / 2) * 2, fill);
      } else if (isTail && cut === "championship") {
        px(c, x, CLOTH_Y0 + wy, 1, 16, fill);
      } else {
        px(c, x, CLOTH_Y0 + wy, 1, CLOTH_H, fill);
      }
    }
    const seamWy = Math.round(Math.sin(time * 0.005 + banner.x * 0.05 + seamCol * 0.35) * 2);
    dith(c, CLOTH_X0 + seamCol - 1, CLOTH_Y0 + seamWy, 2, CLOTH_H, tone.dark, tone.mid);

    // Hem, hoist trim and a short inscription stripe give the standard a
    // readable hierarchy even at native pixel scale.
    px(c, CLOTH_X0, CLOTH_Y0, 1, CLOTH_H, tone.trim);
    px(c, CLOTH_X0, CLOTH_Y0, CLOTH_W, 1, tone.trim);
    px(c, CLOTH_X0 + 2, CLOTH_Y0 + 14, 10, 1, tone.dark);

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

function drawStatuePlinth(c: PixelCtx, accent: string): void {
  // A shared technical-reliquary base, with an inset rune instead of a
  // generic stone block. This ties scattered artifacts to the same system.
  px(c, 3, 32, 19, 1, PAL.grassX);
  px(c, 1, 33, 23, 1, PAL.grassX);
  box(c, 2, 25, 21, 7, PAL.out);
  px(c, 3, 26, 19, 4, PAL.stone);
  px(c, 3, 26, 19, 1, PAL.stoneL);
  px(c, 4, 30, 17, 1, PAL.stoneD);
  box(c, 5, 20, 15, 6, PAL.stoneD);
  px(c, 6, 21, 13, 3, PAL.steel);
  px(c, 10, 21, 4, 2, accent);
  px(c, 11, 20, 2, 5, accent);
  px(c, 3, 28, 2, 2, PAL.leaf);
  px(c, 20, 27, 2, 2, PAL.leaf);
}

/** Faceted gem silhouette — a symmetric taper, exactly what `pixelDisc`
 *  already builds, reused here instead of a bespoke diamond shape. */
const GEM = [4, 10, 14, 10, 4] as const;
/** Whale-body silhouette — a short, wide `pixelDisc` (few rows, big
 *  widths), which reads as a flattened oval body rather than a tall circle. */
const WHALE_BODY = [10, 16, 20, 14, 8] as const;

function drawNextjsMotif(c: PixelCtx, time: number, float: number): void {
  // Portal monolith: a dark frame around a bright server-rendered core.
  box(c, 5, 3 + float, 14, 17, PAL.out);
  box(c, 7, 5 + float, 10, 13, PAL.steelX);
  px(c, 9, 7 + float, 6, 9, PAL.glassD);
  px(c, 10, 8 + float, 4, 3, PAL.glassL);
  pixelRing(c, 12, 13 + float, [4, 12, 16, 12, 4], PAL.arcane);
  const orbit = time * 0.003;
  px(c, 12 + Math.round(Math.cos(orbit) * 9), Math.round(15 + float + Math.sin(orbit) * 3), 1, 1, PAL.wallL);
  px(c, 12 - Math.round(Math.cos(orbit) * 9), Math.round(15 + float - Math.sin(orbit) * 3), 1, 1, PAL.glassL);
}

function drawTypescriptMotif(c: PixelCtx, float: number): void {
  // Inscribed systems obelisk, with an unmistakable T-rune face.
  const topY = 3 + float;
  px(c, 10, topY - 2, 4, 2, PAL.goldL);
  box(c, 7, topY, 10, 19, PAL.out);
  px(c, 8, topY + 1, 8, 17, PAL.arcaneD);
  px(c, 9, topY + 4, 6, 2, PAL.glassL);
  px(c, 11, topY + 6, 2, 8, PAL.glassL);
  px(c, 9, topY + 16, 6, 1, PAL.arcane);
}

function drawPostgresMotif(c: PixelCtx, time: number, float: number): void {
  const cx = 12, cy = 14 + float;
  // Faceted data vault, not merely a floating gem.
  pixelDisc(c, cx, cy, GEM, PAL.out);
  pixelDisc(c, cx, cy, [2, 8, 12, 8, 2], PAL.violetD);
  px(c, cx - 2, cy - 4, 4, 3, PAL.glassL);
  px(c, cx - 5, cy + 1, 10, 1, PAL.steelL);
  // Orbiting binary data motes, replacing the "1"/"0" glyphs.
  const orbit = time * 0.005;
  px(c, cx + Math.round(Math.cos(orbit) * 8), cy + Math.round(Math.sin(orbit) * 4), 1, 1, PAL.glassL);
  px(c, cx - Math.round(Math.cos(orbit) * 8), cy - Math.round(Math.sin(orbit) * 4), 1, 1, PAL.glassL);
}

function drawDockerMotif(c: PixelCtx, time: number, float: number): void {
  const dx = 12, dy = 10 + float;
  // Container totem: three sealed units carry a whale crest at the base.
  [[dx - 8, dy + 7, PAL.arcaneD], [dx - 3, dy + 3, PAL.glassD], [dx + 2, dy + 7, PAL.goldD]].forEach(([x, y, tone]) => {
    box(c, x as number, y as number, 5, 5, PAL.out);
    px(c, x as number + 1, y as number + 1, 3, 3, tone as string);
  });
  pixelDisc(c, dx, dy + 15, WHALE_BODY, PAL.steel);
  px(c, dx - 7, dy + 16, 1, 1, PAL.glassL);
  px(c, dx - 10, dy + 14, 3, 3, PAL.steelD);

  // Blowhole droplets on a sine path — never an arc.
  const ph = (time * 0.004) % 1;
  px(c, dx + 4, Math.round(dy - 3 - ph * 5), 1, 1, PAL.glassL);
}

function drawOneStatue(ctx: CanvasRenderingContext2D, time: number, statue: WorldObject): void {
  withSprite(ctx as unknown as PixelCtx, statue.x, statue.y, () => {
    const c = ctx as unknown as PixelCtx;
    const accent = statue.id === "statue-typescript" ? PAL.arcane : statue.id === "statue-postgres" ? PAL.violetL : statue.id === "statue-docker" ? PAL.glassL : PAL.arcane;
    drawStatuePlinth(c, accent);
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
