import { describe, it, expect } from "vitest";
import {
  DPAD_DEAD_ZONE_RATIO,
  resolveDpadDirection,
  type DpadBounds,
} from "../components/game/game-dpad";

/** The on-screen pad is h-36 w-36 — 144px — anchored at an arbitrary offset. */
const PAD: DpadBounds = { left: 20, top: 400, width: 144, height: 144 };
const CENTRE_X = PAD.left + PAD.width / 2;
const CENTRE_Y = PAD.top + PAD.height / 2;

describe("resolveDpadDirection", () => {
  it("maps each arm to its direction", () => {
    expect(resolveDpadDirection(CENTRE_X, PAD.top + 8, PAD)).toBe("up");
    expect(resolveDpadDirection(CENTRE_X, PAD.top + PAD.height - 8, PAD)).toBe("down");
    expect(resolveDpadDirection(PAD.left + 8, CENTRE_Y, PAD)).toBe("left");
    expect(resolveDpadDirection(PAD.left + PAD.width - 8, CENTRE_Y, PAD)).toBe("right");
  });

  it("releases in the central dead zone", () => {
    expect(resolveDpadDirection(CENTRE_X, CENTRE_Y, PAD)).toBeNull();

    // Just inside the dead zone radius still releases...
    const radius = Math.min(PAD.width, PAD.height) * DPAD_DEAD_ZONE_RATIO;
    expect(resolveDpadDirection(CENTRE_X + radius - 1, CENTRE_Y, PAD)).toBeNull();
    // ...and just outside it engages.
    expect(resolveDpadDirection(CENTRE_X + radius + 1, CENTRE_Y, PAD)).toBe("right");
  });

  it("keeps the dead zone inside the pad's centre cell", () => {
    // The pad renders as a 3x3 grid; the centre cell is a third of the pad.
    // A dead zone larger than that would eat into the arms.
    const radius = Math.min(PAD.width, PAD.height) * DPAD_DEAD_ZONE_RATIO;
    expect(radius).toBeLessThan(PAD.width / 6);
  });

  it("resolves corners to their dominant axis so a diagonal slide never stalls", () => {
    // Top-right corner, further across than up => right, not null.
    expect(resolveDpadDirection(PAD.left + 140, PAD.top + 30, PAD)).toBe("right");
    // Top-right corner, further up than across => up.
    expect(resolveDpadDirection(PAD.left + 110, PAD.top + 4, PAD)).toBe("up");
  });

  it("never returns null while sliding between two adjacent arms", () => {
    // Walk the thumb along the pad's top edge from the left arm to the right
    // arm. Every sample must yield a direction: a null here is the stutter
    // the cell-based hit test used to produce at the corners.
    const y = PAD.top + 6;
    for (let x = PAD.left + 2; x <= PAD.left + PAD.width - 2; x += 2) {
      expect(resolveDpadDirection(x, y, PAD), `stalled at x=${x}`).not.toBeNull();
    }
  });

  it("breaks an exact diagonal tie deterministically", () => {
    const offset = 50; // equal dx and dy, well outside the dead zone
    const a = resolveDpadDirection(CENTRE_X + offset, CENTRE_Y + offset, PAD);
    const b = resolveDpadDirection(CENTRE_X + offset, CENTRE_Y + offset, PAD);
    expect(a).toBe(b);
    expect(a).toBe("down");
  });

  it("treats a zero-sized pad as no input instead of dividing by zero", () => {
    const empty: DpadBounds = { left: 0, top: 0, width: 0, height: 0 };
    expect(resolveDpadDirection(0, 0, empty)).toBeNull();
    expect(resolveDpadDirection(50, 50, empty)).toBeNull();
  });

  it("scales the dead zone with the pad, not with absolute pixels", () => {
    const big: DpadBounds = { left: 0, top: 0, width: 288, height: 288 };
    const small: DpadBounds = { left: 0, top: 0, width: 72, height: 72 };
    // A point 25% of the way out from centre is outside the dead zone at
    // either size, because the zone is defined as a ratio.
    expect(resolveDpadDirection(144 + 72, 144, big)).toBe("right");
    expect(resolveDpadDirection(36 + 18, 36, small)).toBe("right");
  });
});
