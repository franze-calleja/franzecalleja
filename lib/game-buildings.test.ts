import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";
import { BUILDINGS, ROOF_TONES } from "../components/game/game-buildings";
import { WORLD_OBJECTS } from "../components/game/game-data";

function recorder() {
  const rects: { x: number; y: number; w: number; h: number; color: string; alpha: number }[] = [];
  const calls: string[] = [];
  let fill = "";
  const ctx = {
    globalAlpha: 1,
    get fillStyle() { return fill; },
    set fillStyle(v: string) { fill = v; },
    fillRect(x: number, y: number, w: number, h: number) {
      rects.push({ x, y, w, h, color: fill, alpha: ctx.globalAlpha });
    },
    save() { calls.push("save"); }, restore() { calls.push("restore"); },
    translate() { calls.push("translate"); }, scale() { calls.push("scale"); },
    createLinearGradient() { calls.push("createLinearGradient"); return {}; },
    createRadialGradient() { calls.push("createRadialGradient"); return {}; },
    arc() { calls.push("arc"); }, ellipse() { calls.push("ellipse"); },
    imageSmoothingEnabled: true,
  };
  return { ctx, rects, calls };
}

describe("Projects Showcase Guild", () => {
  it("is registered at the coordinates the world object declares", () => {
    const spec = BUILDINGS["projects-guild"];
    const obj = WORLD_OBJECTS.find((o) => o.name === "Projects Showcase Guild")!;
    expect(spec.x).toBe(obj.x);
    expect(spec.y).toBe(obj.y);
  });

  it("honours the pixel contract — no gradients, no curves", () => {
    const { ctx, calls } = recorder();
    BUILDINGS["projects-guild"].draw(ctx, 0);
    ["createLinearGradient", "createRadialGradient", "arc", "ellipse"]
      .forEach((banned) => expect(calls).not.toContain(banned));
  });

  it("paints only palette colours", () => {
    const { ctx, rects } = recorder();
    BUILDINGS["projects-guild"].draw(ctx, 0);
    const allowed = new Set<string>(Object.values(PAL));
    rects.forEach((r) => expect(allowed.has(r.color), `${r.color} not in palette`).toBe(true));
  });

  it("stays within its 70x55 logical footprint", () => {
    const { ctx, rects } = recorder();
    BUILDINGS["projects-guild"].draw(ctx, 0);
    // Chimney, chimney smoke, and hanging sign may overhang above and to
    // the left by design; the stone foundation course may overhang 4px
    // below the wall's own bottom edge (stoneCourse at y=56,h=4 -> y=60).
    rects.forEach((r) => {
      expect(r.x).toBeGreaterThanOrEqual(-4);
      expect(r.x + r.w).toBeLessThanOrEqual(74);
      expect(r.y + r.h).toBeLessThanOrEqual(60);
    });
  });

  it("emits chimney smoke above the chimney cap, not across its face", () => {
    const { ctx, rects } = recorder();
    BUILDINGS["projects-guild"].draw(ctx, 400);
    const smoke = rects.filter((r) => r.color === PAL.smoke);
    expect(smoke.length).toBeGreaterThan(0);
    // The chimney body occupies y = 0..13; every puff must sit above its cap.
    smoke.forEach((r) => expect(r.y + r.h).toBeLessThanOrEqual(0));
  });

  it("animates — output differs between two timestamps", () => {
    const a = recorder(); BUILDINGS["projects-guild"].draw(a.ctx, 0);
    const b = recorder(); BUILDINGS["projects-guild"].draw(b.ctx, 800);
    // Compare full rects (including alpha) so a building whose only
    // animation is an alpha flicker (e.g. lantern) still registers as
    // animated, even if no rect's geometry moves.
    expect(JSON.stringify(a.rects)).not.toBe(JSON.stringify(b.rects));
  });
});

const KEYS = [
  "projects-guild", "village-post", "azra-sanctuary",
  "career-archives", "devops-station", "enverga-dojo", "gamer-cottage",
] as const;

const NAMES: Record<string, string> = {
  "projects-guild": "Projects Showcase Guild",
  "village-post": "Village Post & Inquiries Lodge",
  "azra-sanctuary": "AZRA's AI Arcane Sanctuary",
  "career-archives": "Career & Work Experience Archives",
  "devops-station": "DevOps & Telemetry Power Station",
  "enverga-dojo": "Academy of Enverga (Honors Dojo)",
  "gamer-cottage": "Franze's Gamer Cottage",
};

describe("all seven buildings", () => {
  it("are all registered", () => {
    KEYS.forEach((k) => expect(BUILDINGS[k], `${k} missing`).toBeDefined());
  });

  it("sit at their world object coordinates", () => {
    KEYS.forEach((k) => {
      const obj = WORLD_OBJECTS.find((o) => o.name === NAMES[k])!;
      expect(BUILDINGS[k].x, `${k} x`).toBe(obj.x);
      expect(BUILDINGS[k].y, `${k} y`).toBe(obj.y);
    });
  });

  it("all honour the pixel contract", () => {
    KEYS.forEach((k) => {
      const { ctx, calls } = recorder();
      BUILDINGS[k].draw(ctx, 0);
      ["createLinearGradient", "createRadialGradient", "arc", "ellipse"]
        .forEach((banned) => expect(calls, `${k} used ${banned}`).not.toContain(banned));
    });
  });

  it("all paint only palette colours", () => {
    const allowed = new Set<string>(Object.values(PAL));
    KEYS.forEach((k) => {
      const { ctx, rects } = recorder();
      BUILDINGS[k].draw(ctx, 0);
      rects.forEach((r) => expect(allowed.has(r.color), `${k} used ${r.color}`).toBe(true));
    });
  });

  it("all leave globalAlpha restored", () => {
    KEYS.forEach((k) => {
      const { ctx } = recorder();
      BUILDINGS[k].draw(ctx, 500);
      expect(ctx.globalAlpha, `${k} leaked alpha`).toBe(1);
    });
  });

  it("are visually distinct from one another", () => {
    const sigs = KEYS.map((k) => {
      const { ctx, rects } = recorder();
      BUILDINGS[k].draw(ctx, 0);
      return JSON.stringify(rects);
    });
    expect(new Set(sigs).size).toBe(KEYS.length);
  });

  it("all actually draw something", () => {
    KEYS.forEach((k) => {
      const { ctx, rects } = recorder();
      BUILDINGS[k].draw(ctx, 0);
      expect(rects.length, `${k} drew nothing`).toBeGreaterThan(0);
    });
  });
});

describe("per-building roof tones (Task 14)", () => {
  it("every building has its own registered RoofTone", () => {
    KEYS.forEach((k) => expect(ROOF_TONES[k], `${k} missing a RoofTone`).toBeDefined());
  });

  it("every building's RoofTone is distinct from every other building's", () => {
    const sigs = KEYS.map((k) => JSON.stringify(ROOF_TONES[k]));
    expect(new Set(sigs).size).toBe(KEYS.length);
  });

  it("the Guild keeps the approved reference red ramp", () => {
    const guild = ROOF_TONES["projects-guild"];
    expect(guild).toEqual({ l: PAL.roofL, m: PAL.roof, d: PAL.roofD, x: PAL.roofX });
  });

  it("all roof tones use only PAL values", () => {
    const allowed = new Set<string>(Object.values(PAL));
    KEYS.forEach((k) => {
      const tone = ROOF_TONES[k];
      (["l", "m", "d", "x"] as const).forEach((step) => {
        expect(allowed.has(tone[step]), `${k}.${step} (${tone[step]}) is not a PAL value`).toBe(true);
      });
    });
  });

  it("each tone's four steps are themselves distinct colours", () => {
    KEYS.forEach((k) => {
      const tone = ROOF_TONES[k];
      const steps = [tone.l, tone.m, tone.d, tone.x];
      expect(new Set(steps).size, `${k} roof tone has duplicate steps`).toBe(4);
    });
  });
});

// Every building with a chimney gets its own discriminating smoke test —
// a footprint-bounds test alone does not catch a bad smoke anchor (Task 8).
// Each chimney here occupies y = 0..13, so every puff must sit at or above
// y = 0 (r.y + r.h <= 0), never on the chimney's own face.
describe("chimney smoke anchors", () => {
  it("devops-station: both stacks emit smoke above their caps", () => {
    const { ctx, rects } = recorder();
    BUILDINGS["devops-station"].draw(ctx, 400);
    const smoke = rects.filter((r) => r.color === PAL.smoke);
    expect(smoke.length).toBeGreaterThan(0);
    smoke.forEach((r) => expect(r.y + r.h).toBeLessThanOrEqual(0));
  });

  it("gamer-cottage: smoke emits above the chimney cap", () => {
    const { ctx, rects } = recorder();
    BUILDINGS["gamer-cottage"].draw(ctx, 400);
    const smoke = rects.filter((r) => r.color === PAL.smoke);
    expect(smoke.length).toBeGreaterThan(0);
    smoke.forEach((r) => expect(r.y + r.h).toBeLessThanOrEqual(0));
  });
});
