import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const GAME_DIR = join(process.cwd(), "components", "game");

/**
 * Support modules that live in components/game but are not renderers: they
 * never touch a CanvasRenderingContext2D and so are outside the pixel
 * contract's scope.
 *  - game-data.ts    — map/world/NPC data (carries its own hex-tagged
 *                      fields, e.g. WorldObject.color and bush.berry, as
 *                      historical identifiers, not paint colours)
 *  - game-audio.ts   — the Web Audio synth engine, no canvas calls
 *  - game-mask.ts    — precomputes a placement exclusion grid, no drawing
 *  - game-palette.ts — the palette itself: the one file allowed to define
 *                      hex colour literals, since every renderer's colours
 *                      must trace back to it
 */
const NON_RENDERER_FILES = new Set([
  "game-data.ts",
  "game-audio.ts",
  "game-mask.ts",
  "game-palette.ts",
]);

/**
 * Every renderer module, discovered by reading the directory rather than
 * hard-coding a list — a hard-coded array silently stops covering new
 * renderers (game-landmarks.ts was added after this project's brief was
 * written and would have been invisible to a stale list). `.tsx` files are
 * React components (game-canvas.tsx and friends), not renderer modules, and
 * are excluded by extension; the remaining `.ts` files are filtered against
 * the explicit non-renderer exclusion list above.
 */
const RENDERERS = readdirSync(GAME_DIR)
  .filter((f) => f.endsWith(".ts") && !NON_RENDERER_FILES.has(f))
  .sort();

/**
 * Strips `//` line comments and `/* *\/` block comments before scanning.
 * Both contract checks below care about what the program actually does,
 * not prose that mentions a technique: game-interior.ts documents the
 * per-station hex colours its predecessor used to hard-code, and
 * game-landmarks.ts's fountain has a comment contrasting its droplet
 * technique with "a quadraticCurveTo stream". Matching raw source text
 * would fail on those two lines for a violation that isn't there. No
 * renderer file in this project embeds "//" or block-comment markers
 * inside a string literal, so this simple strip is safe here.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function readRenderer(file: string): string {
  return readFileSync(join(GAME_DIR, file), "utf8");
}

describe("project-wide pixel contract", () => {
  it("found at least one renderer module to check", () => {
    // Guards against every check below passing vacuously because the
    // directory read or the exclusion list swallowed everything.
    expect(RENDERERS.length).toBeGreaterThan(0);
    expect(RENDERERS).toEqual([
      "game-buildings.ts",
      "game-interior.ts",
      "game-landmarks.ts",
      "game-pixel.ts",
      "game-props.ts",
      "game-terrain.ts",
    ]);
  });

  it("no renderer module calls a gradient or curve API", () => {
    const FORBIDDEN = [
      /createLinearGradient/,
      /createRadialGradient/,
      /\.arc\(/,
      /\.ellipse\(/,
      /bezierCurveTo/,
      /quadraticCurveTo/,
    ];
    let checked = 0;
    RENDERERS.forEach((file) => {
      const src = stripComments(readRenderer(file));
      FORBIDDEN.forEach((re) => {
        expect(re.test(src), `${file} matches ${re}`).toBe(false);
      });
      checked++;
    });
    expect(checked).toBe(RENDERERS.length);
  });

  it("no renderer module contains a raw hex colour literal", () => {
    let checked = 0;
    RENDERERS.forEach((file) => {
      const src = stripComments(readRenderer(file));
      expect(/#[0-9a-fA-F]{6}\b/.test(src), `${file} has a hex literal`).toBe(false);
      checked++;
    });
    expect(checked).toBe(RENDERERS.length);
  });

  it("the unused 3.1MB map.png is gone", () => {
    expect(existsSync(join(process.cwd(), "public", "game", "map.png"))).toBe(false);
  });

  it("game-canvas.tsx is no longer a monolith", () => {
    const src = readFileSync(join(GAME_DIR, "game-canvas.tsx"), "utf8");
    const lineCount = src.split("\n").length;
    expect(lineCount).toBeGreaterThan(0);
    expect(lineCount).toBeLessThan(2500);
  });
});
