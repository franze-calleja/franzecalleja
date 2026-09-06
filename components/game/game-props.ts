import { PAL } from "./game-palette";
import {
  px, box, dith, hash, withSprite, gableRoof, steppedRoof, stoneCourse, timberFrame, lantern,
  type PixelCtx, type RoofTone,
} from "./game-pixel";
import { DECORATIVE_TREES, FLOWER_POTS, DECORATIVE_BUSHES, VILLAGE_FURNITURE, PATHWAY_FENCES } from "./game-data";

// This module replaces five renderers (fences, flower pots, bushes, village
// furniture, trees) that predated the pixel contract and painted with
// ctx.arc/ellipse, gradients and rgba() literals. Every shape here is built
// the way game-buildings.ts builds buildings: px/box/dith rows, an outline
// pass before a fill pass on anything round, and colour only from PAL.

const WELL_ROOF_TONE: RoofTone = { l: PAL.roofL, m: PAL.roof, d: PAL.roofD, x: PAL.roofX };

// --- Fences ---------------------------------------------------------------

/** Logical spacing between fence posts (~22 world px, matching the original). */
const POST_SPACING = 11;

/** Horizontal rail-and-post run, `length` logical px long, built on `timberFrame`. */
export function fenceRunHorizontal(c: PixelCtx, length: number): void {
  const THICK = 8;
  // Opaque stepped shadow — 3-row stepped ellipse, narrow-wide-narrow, no
  // ctx.ellipse, no alpha, scaled to the run's own length (Task 10 follow-up:
  // every other renderer got this shadow, fences were the sole exception).
  const narrow = Math.max(0, length - 4);
  px(c, 2, THICK + 1, narrow, 1, PAL.grassX);
  px(c, 0, THICK + 2, length, 1, PAL.grassX);
  px(c, 2, THICK + 3, narrow, 1, PAL.grassX);

  px(c, -1, -1, length + 2, THICK + 2, PAL.out);
  const posts: number[] = [];
  for (let p = POST_SPACING; p < length - 2; p += POST_SPACING) posts.push(p);
  timberFrame(c, 0, 0, length, THICK, posts);
  // Lower rail — reads as a two-rail farm fence rather than a picket line.
  px(c, 2, THICK - 3, length - 4, 2, PAL.wood);
  px(c, 2, THICK - 3, length - 4, 1, PAL.woodL);
}

/** Vertical rail-and-rung run for the two north-south border fences. */
export function fenceRunVertical(c: PixelCtx, length: number): void {
  const THICK = 8;
  // Opaque stepped shadow — the same narrow-wide-narrow ellipse, rotated:
  // 3 columns instead of 3 rows, scaled to the run's own length.
  const narrow = Math.max(0, length - 4);
  px(c, THICK + 1, 2, 1, narrow, PAL.grassX);
  px(c, THICK + 2, 0, 2, length, PAL.grassX);
  px(c, THICK + 4, 2, 1, narrow, PAL.grassX);

  px(c, -1, -1, THICK + 2, length + 2, PAL.out);
  px(c, 0, 0, THICK, length, PAL.wood);
  px(c, 0, 0, 1, length, PAL.woodL);
  px(c, THICK - 1, 0, 1, length, PAL.woodD);
  for (let p = POST_SPACING; p < length - 2; p += POST_SPACING) {
    px(c, 1, p, THICK - 2, 2, PAL.woodD);
    px(c, 1, p, THICK - 2, 1, PAL.woodL);
  }
}

/**
 * Pathway & garden border fences. Most runs are horizontal (w >> h); the two
 * East Forest Grove borders are tall and narrow (h >> w) and get the
 * vertical variant. `t` is accepted for interface parity — fences are
 * static scenery, nothing here animates.
 */
export function drawFences(ctx: CanvasRenderingContext2D, t: number): void {
  void t;
  PATHWAY_FENCES.forEach((fence) => {
    withSprite(ctx as unknown as PixelCtx, fence.x, fence.y, () => {
      const c = ctx as unknown as PixelCtx;
      const vertical = fence.h > fence.w * 1.5;
      const length = Math.round((vertical ? fence.h : fence.w) / 2);
      if (vertical) fenceRunVertical(c, length);
      else fenceRunHorizontal(c, length);
    });
  });
}

// --- Flower pots ------------------------------------------------------------

/** Stepped bloom rows, top to bottom — the replacement for ctx.arc. */
const BLOOM_ROWS = [2, 4, 4, 2] as const;

/** Bloom colour per pot type, keyed off the palette's two floral tones plus
 *  the gold and glass ramps so all four pots read distinctly. */
const BLOOM_TONE: Record<(typeof FLOWER_POTS)[number]["type"], string> = {
  rose: PAL.bloom,
  sunflower: PAL.gold,
  lily: PAL.glass,
  orchid: PAL.bloom2,
};

/**
 * Flower pots dotted through the garden pens and plaza planters. Terracotta
 * urn built from the roof ramp (the only warm-red tones in the palette),
 * topped with a small stepped bloom that sways gently.
 */
export function drawFlowerPots(ctx: CanvasRenderingContext2D, t: number): void {
  const sway = Math.round(Math.sin(t * 0.003));

  FLOWER_POTS.forEach((pot) => {
    withSprite(ctx as unknown as PixelCtx, pot.x, pot.y, () => {
      const c = ctx as unknown as PixelCtx;

      // Opaque stepped shadow — no ellipse, no alpha
      px(c, 1, 12, 8, 1, PAL.grassX);
      px(c, 0, 13, 10, 1, PAL.grassX);
      px(c, 1, 14, 8, 1, PAL.grassX);

      // Terracotta urn: 3-tone ramp with a dithered shading boundary
      box(c, 0, 4, 9, 8, PAL.roof);
      px(c, 1, 5, 2, 6, PAL.roofL);
      dith(c, 3, 5, 3, 6, PAL.roof, PAL.roofD);
      px(c, 7, 5, 1, 6, PAL.roofX);

      // Beveled rim and dark soil line
      box(c, -1, 2, 11, 3, PAL.roofD);
      px(c, 0, 2, 9, 1, PAL.roofL);
      px(c, 1, 4, 7, 1, PAL.woodD);

      // Stem leaves flanking the bloom
      px(c, 1, 1, 2, 2, PAL.leaf);
      px(c, 6, 1, 2, 2, PAL.leaf);
      px(c, 2, 2, 1, 1, PAL.leafD);
      px(c, 6, 2, 1, 1, PAL.leafD);

      // Bloom: outline pass, then fill, tone keyed by pot type, swaying gently
      const tone = BLOOM_TONE[pot.type];
      const bx = 4 + sway;
      BLOOM_ROWS.forEach((w, r) => px(c, bx - w / 2 - 1, r - 1, w + 2, 3, PAL.out));
      BLOOM_ROWS.forEach((w, r) => px(c, bx - w / 2, r, w, 1, tone));
      px(c, bx, 0, 1, 1, PAL.wallL); // sunlit petal glint
    });
  });
}

// --- Bushes -----------------------------------------------------------------

/** Stepped canopy rows, top to bottom — the round-bush replacement for ctx.arc. */
const BUSH_CANOPY = [6, 12, 16, 16, 12, 6] as const;

/** Maps each bush's original rgba() berry colour to the nearest opaque palette tone. */
function berryTone(hex: string): string {
  switch (hex) {
    case "#ef4444": return PAL.bloom;   // red
    case "#38bdf8": return PAL.glass;   // sky blue
    case "#f472b6": return PAL.bloom2;  // pink
    case "#facc15": return PAL.gold;    // gold
    default: return PAL.wallL;          // white, or anything unmapped
  }
}

/**
 * Berry bushes, flowering hedges and wild shrubs. All three share one
 * stepped canopy; only the fruit/blossom dressing differs by type.
 */
export function drawBushes(ctx: CanvasRenderingContext2D, t: number): void {
  void t; // bushes are static scenery — no animation
  DECORATIVE_BUSHES.forEach((bush) => {
    withSprite(ctx as unknown as PixelCtx, bush.x, bush.y, () => {
      const c = ctx as unknown as PixelCtx;
      const cx = 9; // canopy centre, logical

      // Opaque stepped shadow — no ellipse, no alpha
      px(c, cx - 5, 12, 10, 1, PAL.grassX);
      px(c, cx - 7, 13, 14, 1, PAL.grassX);
      px(c, cx - 5, 14, 10, 1, PAL.grassX);

      // Canopy: outline pass, then a lit-upper / shaded-lower fill
      BUSH_CANOPY.forEach((w, r) => px(c, cx - w / 2 - 1, r - 1, w + 2, 3, PAL.out));
      BUSH_CANOPY.forEach((w, r) => px(c, cx - w / 2, r, w, 1, r < 3 ? PAL.leaf : PAL.leafD));
      dith(c, cx - 6, 2, 12, 2, PAL.leaf, PAL.leafD);
      px(c, cx - 3, 1, 6, 1, PAL.grassL); // sun-catching crown tip

      const tone = berryTone(bush.berry);
      const seed = hash(bush.x, bush.y);

      if (bush.type === "wild_shrub") {
        // Jagged wild growth: stray leaf tufts breaking the round silhouette,
        // stable per bush via hash so they don't shimmer between frames.
        px(c, cx - 8 + (seed % 3), 4, 2, 2, PAL.grassL);
        px(c, cx + 6 - (seed % 3), 8, 2, 2, PAL.grassL);
      } else {
        // Berry / blossom clusters
        px(c, cx - 5, 6, 2, 2, tone);
        px(c, cx + 4, 5, 2, 2, tone);
        px(c, cx - 1, 9, 2, 2, tone);
        if (bush.type === "flowering_hedge") px(c, cx - 1, 9, 1, 1, PAL.wallL); // petal glint
      }
    });
  });
}

// --- Village furniture --------------------------------------------------

/** Stepped tabletop/basin rows shared by the chess table and birdbath. */
const ROUND_TOP = [10, 14, 14, 10] as const;

function drawBench(c: PixelCtx): void {
  // Opaque stepped shadow — 3-row stepped ellipse, no ctx.ellipse, no alpha
  px(c, 4, 10, 13, 1, PAL.grassX);
  px(c, 2, 11, 17, 1, PAL.grassX);
  px(c, 4, 12, 13, 1, PAL.grassX);

  // Wrought-iron legs
  px(c, 2, 6, 2, 6, PAL.out);
  px(c, 17, 6, 2, 6, PAL.out);

  // Slatted oak backrest — 3-tone ramp with a dithered boundary
  box(c, 2, 0, 17, 5, PAL.wood);
  px(c, 2, 0, 17, 1, PAL.woodL);
  dith(c, 3, 1, 15, 3, PAL.wood, PAL.woodD);

  // Seat plank
  box(c, 1, 5, 19, 4, PAL.woodD);
  px(c, 2, 5, 17, 1, PAL.woodL);
}

function drawChessTable(c: PixelCtx): void {
  // Opaque stepped shadow — 3-row stepped ellipse
  px(c, 4, 14, 15, 1, PAL.grassX);
  px(c, 2, 15, 19, 1, PAL.grassX);
  px(c, 4, 16, 15, 1, PAL.grassX);

  // Two stone stools
  box(c, 0, 10, 4, 6, PAL.stoneD);
  box(c, 19, 10, 4, 6, PAL.stoneD);

  // Pedestal column
  box(c, 9, 8, 5, 8, PAL.stone);
  px(c, 10, 8, 1, 8, PAL.stoneL);

  // Round beveled tabletop: outline pass, then fill
  ROUND_TOP.forEach((w, r) => px(c, 12 - w / 2 - 1, r - 1, w + 2, 3, PAL.out));
  ROUND_TOP.forEach((w, r) => px(c, 12 - w / 2, r, w, 1, r < 2 ? PAL.stoneL : PAL.stone));

  // 4x4 checkerboard inset, aligned to the tabletop's own 4 fill rows
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const light = (row + col) % 2 === 0;
      px(c, 8 + col * 2, row, 2, 1, light ? PAL.wallL : PAL.out);
    }
  }
}

function drawWishingWell(c: PixelCtx): void {
  // Opaque stepped shadow — 3-row stepped ellipse
  px(c, 4, 25, 17, 1, PAL.grassX);
  px(c, 2, 26, 21, 1, PAL.grassX);
  px(c, 4, 27, 17, 1, PAL.grassX);

  // Timber support posts, wood ramp with lit left edge
  px(c, 3, 3, 3, 12, PAL.wood);
  px(c, 3, 3, 1, 12, PAL.woodL);
  px(c, 19, 3, 3, 12, PAL.wood);
  px(c, 19, 3, 1, 12, PAL.woodL);

  // Tiny canopy roof, built from the same toolkit as building roofs
  steppedRoof(c, gableRoof(6, 22, 0, 4, 12), WELL_ROOF_TONE);

  // Stone drum body: 3-tone ramp with a dithered boundary
  box(c, 2, 14, 21, 12, PAL.stone);
  dith(c, 3, 15, 8, 10, PAL.stone, PAL.stoneL);
  px(c, 19, 15, 3, 10, PAL.stoneD);
  stoneCourse(c, 0, 22, 25, 4);

  // Well rim lip
  px(c, 1, 12, 23, 3, PAL.stoneD);
  px(c, 2, 12, 21, 1, PAL.stoneL);

  // Water and a bucket hanging from the crossbeam
  px(c, 5, 13, 15, 2, PAL.glassD);
  px(c, 7, 13, 5, 1, PAL.glass);
  px(c, 10, 6, 1, 6, PAL.woodD);
  box(c, 8, 12, 5, 4, PAL.wood);
}

/** Basin rim rows, smaller than the chess table's tabletop. */
const BASIN = [6, 8, 8, 6] as const;

function drawBirdbath(c: PixelCtx, t: number): void {
  // Opaque stepped shadow — 3-row stepped ellipse
  px(c, 3, 13, 7, 1, PAL.grassX);
  px(c, 2, 14, 11, 1, PAL.grassX);
  px(c, 3, 15, 7, 1, PAL.grassX);

  // Fluted pedestal
  box(c, 6, 6, 3, 6, PAL.stone);
  px(c, 6, 6, 1, 6, PAL.stoneL);
  box(c, 4, 11, 7, 3, PAL.stoneD);

  // Basin: outline pass, then fill, opaque water inset
  BASIN.forEach((w, r) => px(c, 7 - w / 2 - 1, 2 + r - 1, w + 2, 3, PAL.out));
  BASIN.forEach((w, r) => px(c, 7 - w / 2, 2 + r, w, 1, r < 2 ? PAL.stoneL : PAL.stone));
  px(c, 4, 3, 6, 2, PAL.glassD);
  px(c, 5, 3, 4, 1, PAL.glass);

  // A perched bird, bobbing on a slow phase — opaque, no alpha
  const bob = Math.sin(t * 0.004) > 0.5 ? 0 : 1;
  px(c, 10, bob, 3, 2, PAL.glassD);
  px(c, 12, bob, 1, 1, PAL.gold);
}

function drawStreetlamp(c: PixelCtx, t: number): void {
  // Opaque stepped shadow — 3-row stepped ellipse
  px(c, 3, 21, 5, 1, PAL.grassX);
  px(c, 2, 22, 7, 1, PAL.grassX);
  px(c, 3, 23, 5, 1, PAL.grassX);

  // Cast-iron pedestal base
  box(c, 2, 19, 7, 4, PAL.out);
  px(c, 3, 20, 5, 2, PAL.stoneD);

  // Post: highlight/shadow edges instead of a gradient
  px(c, 4, 4, 3, 16, PAL.stoneD);
  px(c, 4, 4, 1, 16, PAL.stoneL);
  px(c, 6, 4, 1, 16, PAL.out);

  // Lantern head, reusing the toolkit's flickering glow — the only place
  // this module touches globalAlpha, matching the ONLY-for-luminous rule.
  lantern(c, 3, 2, t);
}

function drawBarrelStack(c: PixelCtx): void {
  // Opaque stepped shadow — 3-row stepped ellipse
  px(c, 4, 13, 13, 1, PAL.grassX);
  px(c, 2, 14, 17, 1, PAL.grassX);
  px(c, 4, 15, 13, 1, PAL.grassX);

  // Bottom barrel: wood ramp with steel hoops
  box(c, 0, 4, 8, 10, PAL.wood);
  px(c, 1, 5, 2, 8, PAL.woodL);
  px(c, 6, 5, 1, 8, PAL.woodD);
  px(c, 0, 5, 8, 1, PAL.stoneD);
  px(c, 0, 11, 8, 1, PAL.stoneD);

  // Top barrel, staggered pyramid-style
  box(c, 4, 0, 7, 6, PAL.wood);
  px(c, 5, 1, 2, 4, PAL.woodL);
  px(c, 4, 1, 7, 1, PAL.stoneD);
  px(c, 4, 4, 7, 1, PAL.stoneD);

  // Fruit crate beside the barrels
  box(c, 10, 6, 9, 8, PAL.wood);
  px(c, 11, 7, 7, 6, PAL.woodL);
  px(c, 12, 5, 2, 2, PAL.bloom);
  px(c, 15, 4, 2, 2, PAL.gold);
  px(c, 14, 5, 1, 1, PAL.leaf);
}

/**
 * Benches, chess tables, the wishing well, birdbaths, streetlamps and
 * barrel stacks. Every round part (tabletop, basin, lantern glow) is a
 * stepped pixel shape or a toolkit part — no ctx.arc/ellipse, no gradients.
 */
export function drawFurniture(ctx: CanvasRenderingContext2D, t: number): void {
  VILLAGE_FURNITURE.forEach((f) => {
    withSprite(ctx as unknown as PixelCtx, f.x, f.y, () => {
      const c = ctx as unknown as PixelCtx;
      switch (f.type) {
        case "bench": drawBench(c); break;
        case "chess_table": drawChessTable(c); break;
        case "wishing_well": drawWishingWell(c); break;
        case "birdbath": drawBirdbath(c, t); break;
        case "streetlamp": drawStreetlamp(c, t); break;
        case "barrel_stack": drawBarrelStack(c); break;
      }
    });
  });
}

// --- Trees ------------------------------------------------------------------

/** Stepped canopy rows, top to bottom — the replacement for ctx.arc. */
const CANOPY = [6, 12, 18, 22, 24, 24, 22, 18, 12, 6] as const;

/**
 * Decorative forest trees. All four species (grand oak, pine, maple,
 * sakura) share one canopy silhouette in this pass — the sprite-art
 * language is the trunk-and-leaf-mass toolkit shape, not the species'
 * old individually-painted foliage.
 */
export function drawTrees(ctx: CanvasRenderingContext2D, t: number): void {
  DECORATIVE_TREES.forEach((tree, i) => {
    withSprite(ctx as unknown as PixelCtx, tree.x, tree.y, () => {
      const c = ctx as unknown as PixelCtx;
      const sway = Math.round(Math.sin(t * 0.0015 + hash(tree.x, tree.y) * 0.05));

      // Opaque stepped shadow — no ellipse, no alpha
      px(c, 6, 30, 12, 1, PAL.grassX);
      px(c, 4, 31, 16, 1, PAL.grassX);
      px(c, 6, 32, 12, 1, PAL.grassX);

      // Trunk
      box(c, 10, 20, 5, 12, PAL.wood);
      px(c, 11, 21, 1, 10, PAL.woodL);
      px(c, 13, 21, 1, 10, PAL.woodD);

      // Canopy: outline pass, then fill, then a lit upper-left face
      CANOPY.forEach((w, r) => px(c, 12 - w / 2 + sway - 1, r - 1, w + 2, 3, PAL.out));
      CANOPY.forEach((w, r) => px(c, 12 - w / 2 + sway, r, w, 1, r < 4 ? PAL.leaf : PAL.leafD));
      dith(c, 12 - 8 + sway, 3, 8, 2, PAL.leaf, PAL.leafD);
      px(c, 12 - 6 + sway, 2, 4, 1, PAL.grassL);

      // Occasional fruit, stable per tree
      if (hash(tree.x, tree.y) % 3 === 0) px(c, 14 + sway, 6, 2, 2, PAL.bloom);
      void i;
    });
  });
}
