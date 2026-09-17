import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Mobile viewport contract for the game's full-screen overlays.
 *
 * A centred overlay panel (`flex items-center justify-center` + a panel that
 * clips with `overflow-hidden`) has a specific failure mode on short
 * viewports: once the content is taller than the screen, the excess is cut
 * off equally at BOTH ends and there is no way to scroll to it. The footer
 * and the header close button go off-screen, and since a touch device has no
 * Esc key, the overlay becomes impossible to dismiss.
 *
 * The fix is the pattern game-modals.tsx already uses: bound the panel's
 * height against the viewport and give the body its own scroll region
 * (`flex-1 min-h-0 overflow-y-auto`). These tests pin that contract so a
 * future overlay can't quietly reintroduce the trap.
 */

const GAME_DIR = join(process.cwd(), "components", "game");

const read = (file: string) => readFileSync(join(GAME_DIR, file), "utf8");

/** Overlays that render as a centred, height-bounded panel. */
const CENTRED_OVERLAYS = ["game-character-select.tsx", "game-modals.tsx"];

describe("Game overlay mobile viewport contract", () => {
  CENTRED_OVERLAYS.forEach((file) => {
    describe(file, () => {
      const source = read(file);

      it("bounds the panel height against the viewport", () => {
        // Without a max-height the panel grows past the screen and its
        // clipped ends become unreachable.
        expect(source).toMatch(/max-h-\[\d+(?:svh|dvh|vh|%)\]|max-h-full/);
      });

      it("gives the panel body a real scroll region", () => {
        // min-h-0 is required for a flex child to be allowed to shrink far
        // enough for overflow-y-auto to actually engage.
        expect(source).toContain("overflow-y-auto");
        expect(source).toContain("min-h-0");
      });
    });
  });

  describe("game-character-select.tsx", () => {
    const source = read("game-character-select.tsx");

    it("hides keyboard-only hints on touch-sized viewports", () => {
      // "[← / →] Cycle", "[Space/Enter] Equip" and "Use [A]/[D]" describe keys
      // a phone does not have, and they crowd out the controls that do work.
      const keyboardHints = source.match(/\[(?:←|Space|Esc|A)[^\]]*\][^<]*/g) ?? [];
      expect(keyboardHints.length).toBeGreaterThan(0);

      for (const hint of keyboardHints) {
        const line = source.slice(0, source.indexOf(hint)).split("\n").length;
        const enclosing = source.split("\n").slice(Math.max(0, line - 4), line).join("\n");
        expect(
          enclosing,
          `keyboard hint near line ${line} should be hidden below the sm breakpoint`,
        ).toMatch(/hidden\s+sm:/);
      }
    });

    it("keeps the dismiss control reachable without a keyboard", () => {
      // The footer must not be inside the scrolling region: it carries the
      // only pointer-driven way out on a phone.
      const footerIndex = source.indexOf("RETURN TO GAME");
      expect(footerIndex).toBeGreaterThan(-1);
      const footerBlock = source.slice(footerIndex - 1200, footerIndex);
      expect(footerBlock).toMatch(/shrink-0/);
    });
  });
});
