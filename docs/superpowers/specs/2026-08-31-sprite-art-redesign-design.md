# Game World: Sprite-Art Redesign

**Date:** 2026-08-31
**Branch:** `sprite-art-redesign`
**Status:** Approved

## Context

`/game` renders a 960×760 top-down village on an HTML5 canvas. `components/game/game-canvas.tsx`
is 5,766 lines and holds map constants, ~15 draw functions, and the whole React component
(state, input, camera, render loop). Characters and the guild interior use a 16×16 spritesheet
(`Characters_V3_Colour.png`); everything else is drawn with canvas primitives.

The work began as a bounded request — make the grass look like Pokémon grass — and expanded
into an art-direction change for the whole world. That expansion is what makes this a spec
rather than a chat design.

The core diagnosis: **the current art is vector illustration drawn with rectangles, not sprite
art.** It uses 19 gradients, 105 arcs/ellipses, and 121 translucent `rgba()` fills. Sprite art
uses none of those — it uses opaque flat colour ramps, dithering, and hard outlines. No amount
of added detail fixes the style while those primitives remain.

## Decisions already made

Settled during brainstorming, recorded here so the plan does not relitigate them:

| Decision | Choice | Rationale |
|---|---|---|
| Perspective | **Projection B** — head-on with a visible stepped roof plane | Gen 5 Black/White. Delivers the "3DS" read without 3D |
| Detail level | **Level 3** — material texture plus per-building character props | At 70×55 logical px, this is where Gen 5 buildings sit |
| Palette | **Cool Gen 5** — plum-black outlines, cooler shadows | Most neutral; safest under both site themes |
| Theme | **Keep the fantasy village** | Content maps onto it (Guild = projects, Dojo = education) |
| Build strategy | **Toolkit first, then rebuild renderers on it** | Consistency by construction; buildings 2–7 get cheap |

**Explicitly rejected:** true polygonal 3D (three.js / R3F). It is technically feasible but the
blocker is asset production, not rendering — every building becomes a mesh someone models in
Blender, and none of the existing ~6,000 lines transfers. See [Rejected](#rejected-alternatives).

## Goals

1. The overworld reads as deliberate sprite art, not as illustrated shapes.
2. All world art shares one pixel grid with the character sprites.
3. All world art draws from one fixed palette.
4. Each of the 7 buildings is visually distinct and signals its purpose.
5. Terrain gains Pokémon-style grass: patchwork tone, dithered path edges, tall-grass patches
   with sway, rustle audio and a leaf burst.
6. Terrain rendering costs less per frame than it does today, despite carrying more detail.
7. `game-canvas.tsx` is meaningfully smaller.

## Non-goals

- Redrawing `Characters_V3_Colour.png`. The character sprites are already correct sprite art and
  set the pixel grid everything else conforms to.
- Changing map layout, building footprints, collision, NPC routes, dialogue, or modals. This is
  art only. Building rects stay exactly where they are.
- Wild-encounter mechanics. Tall grass is decorative.
- Adopting `Buildings_Colour2.png`. It is competent pixel art but a modern-American-town theme
  (diner, church, hotel) that clashes with the fantasy village.
- Migrating to WebGL.

## The pixel contract

Everything below depends on one rule.

Characters are 16×16 source sprites drawn at 32×32 (`game-canvas.tsx:301-306`) — **one logical
pixel is 2 world pixels**. World art currently draws 1-world-pixel detail
(`game-canvas.tsx:534`), giving the ground twice the pixel density of the sprites standing on
it. That mismatch is why the terrain reads as noise.

The contract, enforced by the toolkit rather than by discipline:

1. **Unit = 2 world px.** Art is authored in logical pixels; the toolkit multiplies by 2.
2. **No gradients.** Flat ramps of 3–5 tones per material, with dithering for transitions.
3. **No arcs, ellipses, or beziers.** Curves are stepped as pixel staircases.
4. **No translucent fills** in static art. Opaque only. Alpha is reserved for genuinely
   luminous things — smoke, lantern glow, AZRA's aura.
5. **Every object gets a 1-logical-px outline** in the palette's tinted near-black.
6. **Light comes from the upper-left**, consistently, everywhere.

Building footprints of 140×110 world px become **70×55 logical px** — a generous sprite budget,
comparable to Gen 5.

## Design

### 1. `components/game/game-palette.ts`

Exports one frozen palette object, ~40 named colours grouped by material: `out`, roof
(`roofL/roof/roofD/roofX`), wall, wood, stone, glass, door, metal/gold, foliage, grass, smoke.
Every other module imports from here. No colour literal appears anywhere else in game code —
that invariant is what stops the palette drifting back to ad-hoc Tailwind hexes.

### 2. `components/game/game-pixel.ts`

The primitives, all taking logical coordinates and scaling by the unit internally:

- `px(ctx, x, y, w, h, color)` — the base fill; the only place `fillRect` is called
- `box(ctx, x, y, w, h, fill)` — outlined rect
- `dith(ctx, x, y, w, h, c1, c2)` — 1px checkerboard dither for ramp transitions
- `steppedRoof(ctx, rows, palette)` — outline pass then fill pass, so internal step seams are
  covered; produces the receding roof plane
- `shingleCourse`, `window2`, `plankDoor`, `stoneCourse`, `timberFrame` — reusable building parts
- `lantern(ctx, x, y, t)`, `chimneySmoke(ctx, x, y, t)`, `flowerBox`, `ivy` — animated props
- `hash(a, b)` — the one deterministic pseudo-random source, so scatter is stable across frames

These are exactly the helpers written repeatedly in the brainstorming mockups; the mockups are
preserved in `.superpowers/brainstorm/` as reference.

### 3. `components/game/game-terrain.ts` — the grass

Replaces `drawOrganicGround` (`game-canvas.tsx:491-702`).

- **Base grass** on the 2px grid: six blade-cluster variants selected by `hash(col,row)`, which
  removes the current 32px checkerboard where every tile places blades at identical offsets.
- **Palette softening.** Current `#bef264` → `#22541d` spans far too much value inside one tile.
  New range roughly `#92c973` → `#4a7d37`; the two stripe tones sit close enough that mowing
  stripes suggest rather than shout.
- **Patchwork zones.** A cheap value-noise field sampled per tile shifts the base across ~3
  sibling greens, so the field is not one flat tone.
- **Dithered path edges.** The 13 `renderPavers` rects currently end in hard lines. A 3-cell
  scatter band using a stable hash lets grass finger into stone.
- **Tall grass.** `TALL_GRASS_AREAS` in `game-data.ts`, hand-placed in field pockets away from
  buildings, paths and NPC routes. Drawn in **two passes** — bases before the player, tips
  *after* — so the player stands waist-deep in it. That overlap is the signature Pokémon read
  and costs one extra call in the render order.

### 4. Rustle feedback

On the player entering a tall-grass patch: `retroAudio.playRustle()` — a new method in the
existing procedural WebAudio style of `playStep` (`game-audio.ts:216`) — plus a short leaf burst.

The existing particle pool (`game-canvas.tsx:4770`) is 24 fixed ambient particles that wrap
forever with no lifetime, so leaves get a **separate short-lived array** rather than contorting
it.

### 5. `components/game/game-buildings.ts`

All 7 rebuilt in projection B at Level 3. Footprints and coordinates unchanged.

| Building | Coords | Character props |
|---|---|---|
| Projects Showcase Guild | 70,60 | Hanging guild sign, chimney + smoke, lantern, flower boxes, ivy |
| Village Post & Inquiries Lodge | 350,55 | Mailbox, notice board with pinned papers, bracket bell, weathervane |
| AZRA's AI Arcane Sanctuary | 560,45 | Floating crystals, glowing rune band, starlight motes, no chimney |
| Career & Work Experience Archives | 750,150 | Stacked crates, wall clock, tall narrow windows, shutters |
| DevOps & Telemetry Power Station | 60,260 | Twin smokestacks, pipe runs, pressure gauges, blinking status lamps |
| Academy of Enverga (Honors Dojo) | 60,560 | Tiled pagoda roof, paired paper lanterns, training dummy, banner |
| Franze's Gamer Cottage | 560,535 | CRT glow in the window, cosy chimney, controller sign, doormat |

Shared structure comes from the toolkit; only the props table and material choices differ per
building. This is what keeps building 7 as detailed as building 1.

### 6. `components/game/game-props.ts`

Same treatment for `drawVillageFurniture`, `drawSpriteTrees`, `drawSpriteBushes`,
`drawSpriteFlowerPots`, `drawTexturedFences`, `drawDetailedStatues`, `drawDetailedBanners`,
`drawBasketballCourt`, and `drawCentralFountain`.

The fountain is the worst offender in the file — 26 curves against 37 rects — and needs full
reconstruction as stepped pixel rings with dithered water and a 3-frame ripple cycle. The
basketball court (7 curves, 9 rects) is the same problem at smaller scale.

### 7. Guild interior

`drawProjectsGuildInterior` (4 gradients, 8 curves, 13 rgba) gets the same pass. Leaving it in
the old style would make entering the guild a visible style break.

### 8. Performance

Terrain is fully redrawn every frame today: ~18k `fillRect` calls, plus `isInsidePathOrBuilding`
(`game-canvas.tsx:188`) looping 14 path areas × 17 world objects for all 720 tiles — ~22k
iterations per frame for output that never changes. Level 3 detail would multiply this.

Two changes, both required rather than optional:

1. **Offscreen terrain cache.** Static layers (grass, patchwork, paths, dithered edges) render
   once to an `OffscreenCanvas` at startup and blit per frame. Only tall grass, particles, water
   and prop animation stay per-frame.
2. **Precomputed exclusion mask.** Replace the per-tile `isInsidePathOrBuilding` calls with a
   boolean grid built once.

Buildings can be cached the same way if profiling shows they need it, but their animated props
(smoke, lanterns, lamps) mean they cannot be cached wholesale — static body cached, props drawn
live.

### 9. Resulting file structure

```
components/game/
  game-palette.ts     ~60   the ~40-colour world palette
  game-pixel.ts      ~300   toolkit primitives
  game-terrain.ts    ~400   grass, paths, tall grass
  game-buildings.ts  ~900   7 buildings
  game-props.ts      ~700   furniture, trees, fountain, statues, banners, court
  game-interior.ts   ~400   guild interior
  game-canvas.tsx   ~1800   React component, state, input, camera, render loop
```

`game-canvas.tsx` drops from 5,766 lines to roughly 1,800 — the component and loop, with the art
behind module boundaries.

### 10. Cleanup

`public/game/map.png` is 3.1 MB and referenced nowhere in `components/`, `app/`, or `lib/`.
Delete it — it is the single largest file in the repo and ships nothing.

`Buildings_Colour2.png` is also unreferenced but only 31 KB. Keep it, moved to
`docs/assets/reference/`, as a technique reference for outline weight and ramp construction. It
is not shipped from `public/` and not used at runtime.

## Testing

`vitest.config.ts` restricts tests to `lib/**/*.test.ts` with `environment: "node"`, and the
existing `lib/game-skins.test.ts` imports from `../components/game/game-data`. Canvas rendering
therefore cannot be unit-tested here; visual verification happens against the dev server.

Pure logic that will be tested, following that precedent:

- Palette: every value is a valid hex colour; no duplicate names; size within budget.
- `hash()`: deterministic, and its distribution across 6 variants is roughly even.
- Blade-variant selection: stable for a given `(col,row)` across calls.
- `TALL_GRASS_AREAS`: no patch overlaps a `PATH_AREAS` rect or a `WORLD_OBJECTS` footprint.
- Precomputed exclusion mask: matches `isInsidePathOrBuilding` for all 720 tiles — a direct
  equivalence test against the current implementation, which is the change most able to
  silently break flower placement.

## Risks

- **Scale of change.** Nearly all world art is touched. Mitigated by ordering: toolkit → terrain
  → one building → review → remaining six. The review checkpoint after the first building is the
  point to correct style before it is replicated.
- **1× vs 6× perception.** Mockups were viewed at 4–6× zoom; the map renders at 1×, where a
  logical pixel is 2 screen pixels. Some Level 3 detail will visually merge. First building gets
  checked at true scale before the rest proceed.
- **Animated props and the cache.** Smoke, lanterns and status lamps prevent wholesale building
  caching. If per-frame cost regresses, split static body from animated props per building.

## Rejected alternatives

### Rejected: true polygonal 3D

Real 3DS Pokémon is polygonal with a perspective camera, so "3DS sprites" cannot be copied
literally. Rebuilding in three.js / R3F is feasible but wrong here: the world is currently
authored *as code* that can be edited in a text editor, and 3D replaces that with a Blender
asset pipeline of 30–50 models. None of the existing ~6,000 lines transfers, the 16×16 character
spritesheet and its skin-picker (`game-character-select.tsx`) would need billboarding or
rigging, and the payload is heavy for a portfolio that should load fast on a phone.

What actually reads as 3D in a 3DS screenshot is the **tilted camera**, not the polygons — Gen 5
achieved it with 2D sprites in Castelia City. Projection B buys the same effect on Canvas 2D.

### Rejected: HD-2D (Octopath Traveler)

Pixel sprites on a perspective ground with bloom and depth-of-field. The bloom and DOF that sell
the style need per-frame blur compositing, which is expensive on Canvas 2D and would push the
project to WebGL anyway.

### Rejected: data-driven building descriptors

Describing buildings as `{roof, walls, props[]}` and writing one generic renderer is more
compact, but seven buildings do not earn the abstraction, and the output would read as
variations of a single house — the opposite of the Level 3 goal.

### Rejected: keeping the current pixel density

Fixing only repetition and palette while leaving 1-world-pixel detail was offered and declined.
It leaves the ground out-detailing the sprites standing on it, which is the root cause.
