import { describe, it, expect } from "vitest";
import { bladeVariant, patchTone } from "../components/game/game-terrain";

describe("blade variants", () => {
  it("is stable for the same tile", () => {
    expect(bladeVariant(4, 9)).toBe(bladeVariant(4, 9));
  });

  it("returns one of six variants", () => {
    for (let c = 0; c < 30; c++) {
      for (let r = 0; r < 24; r++) {
        const v = bladeVariant(c, r);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(5);
      }
    }
  });

  it("does not repeat across adjacent tiles in a fixed pattern", () => {
    // The old renderer placed identical blades in every tile, producing a
    // visible 32px checkerboard. Neighbours must differ often.
    let differing = 0;
    for (let c = 0; c < 29; c++) {
      for (let r = 0; r < 24; r++) {
        if (bladeVariant(c, r) !== bladeVariant(c + 1, r)) differing++;
      }
    }
    expect(differing / (29 * 24)).toBeGreaterThan(0.6);
  });
});

describe("patchwork tone", () => {
  it("only ever returns a grass ramp key", () => {
    const allowed = ["grassL", "grass", "grassD"];
    for (let c = 0; c < 30; c++) {
      for (let r = 0; r < 24; r++) expect(allowed).toContain(patchTone(c, r));
    }
  });

  it("forms contiguous blobs rather than per-tile noise", () => {
    // Neighbouring tiles should usually share a tone, or the field reads as
    // static instead of as soft patches.
    let same = 0;
    for (let c = 0; c < 29; c++) {
      for (let r = 0; r < 24; r++) {
        if (patchTone(c, r) === patchTone(c + 1, r)) same++;
      }
    }
    expect(same / (29 * 24)).toBeGreaterThan(0.55);
  });

  it("uses more than one tone across the map", () => {
    const seen = new Set<string>();
    for (let c = 0; c < 30; c++) for (let r = 0; r < 24; r++) seen.add(patchTone(c, r));
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });
});
