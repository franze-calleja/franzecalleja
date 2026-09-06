import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { drawTrees, TREE_CANOPY, TREE_TONE, TREE_TRUNK } from "../components/game/game-props";
import { DECORATIVE_TREES } from "../components/game/game-data";

function recorder() {
  const rects: { color: string }[] = [];
  const calls: string[] = [];
  let fill = "";
  const ctx = {
    globalAlpha: 1,
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect() { rects.push({ color: fill }); },
    save() {}, restore() {}, translate() {}, scale() {},
    createLinearGradient() { calls.push("createLinearGradient"); return {}; },
    createRadialGradient() { calls.push("createRadialGradient"); return {}; },
    arc() { calls.push("arc"); }, ellipse() { calls.push("ellipse"); },
    imageSmoothingEnabled: true,
  };
  return { ctx, rects, calls };
}

const SPECIES = Object.keys(TREE_CANOPY) as (keyof typeof TREE_CANOPY)[];

describe("per-species canopy tables (Task 15)", () => {
  it("every species from DECORATIVE_TREES has its own registered canopy table", () => {
    const usedTypes = new Set(DECORATIVE_TREES.map((t) => t.type));
    usedTypes.forEach((type) => expect(TREE_CANOPY[type], `${type} missing a canopy table`).toBeDefined());
  });

  it("no two species share the same canopy table (each has a distinct silhouette)", () => {
    const sigs = SPECIES.map((s) => JSON.stringify(TREE_CANOPY[s]));
    expect(new Set(sigs).size).toBe(SPECIES.length);
  });

  it("species differ in canopy height (row count) — not all four share one table", () => {
    const rowCounts = SPECIES.map((s) => TREE_CANOPY[s].length);
    expect(new Set(rowCounts).size).toBeGreaterThan(1);
  });

  it("species differ in canopy width (max row width)", () => {
    const maxWidths = SPECIES.map((s) => Math.max(...TREE_CANOPY[s].map(([w]) => w)));
    expect(new Set(maxWidths).size).toBeGreaterThan(1);
  });

  it("every canopy silhouette scallops — width isn't a smooth monotonic arc", () => {
    SPECIES.forEach((s) => {
      const widths = TREE_CANOPY[s].map(([w]) => w);
      let direction = 0;
      let changes = 0;
      for (let i = 1; i < widths.length; i++) {
        const d = Math.sign(widths[i] - widths[i - 1]);
        if (d !== 0 && d !== direction) {
          if (direction !== 0) changes++;
          direction = d;
        }
      }
      expect(changes, `${s}'s canopy widens/narrows smoothly like a plain arc`).toBeGreaterThan(0);
    });
  });

  it("pine reads as the tallest, narrowest conifer of the four", () => {
    const rowCounts = SPECIES.map((s) => TREE_CANOPY[s].length);
    const maxWidths = SPECIES.map((s) => Math.max(...TREE_CANOPY[s].map(([w]) => w)));
    const pineIdx = SPECIES.indexOf("pine");
    expect(rowCounts[pineIdx]).toBe(Math.max(...rowCounts));
    expect(maxWidths[pineIdx]).toBeLessThan(Math.max(...maxWidths));
  });
});

describe("per-species foliage ramp (Task 15)", () => {
  it("every species has a registered 4-step tone ramp with 4 distinct colours", () => {
    SPECIES.forEach((s) => {
      const tone = TREE_TONE[s];
      expect(tone, `${s} missing a tone ramp`).toBeDefined();
      const steps = [tone.l, tone.m, tone.d, tone.x];
      expect(new Set(steps).size, `${s} ramp has duplicate steps`).toBe(4);
    });
  });

  it("every tone step is a real PAL colour (no literals)", () => {
    const allowed = new Set<string>(Object.values(PAL));
    SPECIES.forEach((s) => {
      const tone = TREE_TONE[s];
      (["l", "m", "d", "x"] as const).forEach((k) =>
        expect(allowed.has(tone[k]), `${s}.${k} (${tone[k]}) is not a PAL value`).toBe(true)
      );
    });
  });

  it("sakura reads as a distinct blossom canopy, not a green tree", () => {
    expect(TREE_TONE.sakura).not.toEqual(TREE_TONE.grand_oak);
    expect([TREE_TONE.sakura.l, TREE_TONE.sakura.m, TREE_TONE.sakura.d]).toContain(PAL.bloom2);
  });

  it("the full render actually paints all four foliage steps used by green species", () => {
    const { ctx, rects } = recorder();
    drawTrees(ctx as never, 0);
    const used = new Set(rects.map((r) => r.color));
    // DECORATIVE_TREES includes grand_oak, pine and maple — all on the green ramp.
    expect(used.has(PAL.leafL), "leafL (lightest) never painted").toBe(true);
    expect(used.has(PAL.leaf)).toBe(true);
    expect(used.has(PAL.leafD)).toBe(true);
    expect(used.has(PAL.leafX), "leafX (deepest) never painted").toBe(true);
  });

  it("the full render paints the sakura blossom tones too", () => {
    const { ctx, rects } = recorder();
    drawTrees(ctx as never, 0);
    const used = new Set(rects.map((r) => r.color));
    expect(used.has(PAL.bloom2)).toBe(true);
  });
});

describe("per-species trunk (Task 15)", () => {
  it("every species has a registered trunk footprint", () => {
    SPECIES.forEach((s) => expect(TREE_TRUNK[s], `${s} missing a trunk`).toBeDefined());
  });

  it("the trunk uses a full lit/shadow wood ramp, not a flat fill", () => {
    const { ctx, rects } = recorder();
    drawTrees(ctx as never, 0);
    const used = new Set(rects.map((r) => r.color));
    expect(used.has(PAL.woodL), "no lit trunk edge painted").toBe(true);
    expect(used.has(PAL.woodD) || used.has(PAL.woodX), "no shadowed trunk edge painted").toBe(true);
  });
});
