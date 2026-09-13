import { describe, it, expect } from "vitest";
import { PAL } from "../components/game/game-palette";

describe("World palette", () => {
  it("every value is a valid 6-digit hex colour", () => {
    Object.entries(PAL).forEach(([name, value]) => {
      expect(value, `${name} is not a valid hex colour`).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it("stays within the 56-colour budget", () => {
    const count = Object.keys(PAL).length;
    expect(count).toBeGreaterThanOrEqual(30);
    expect(count).toBeLessThanOrEqual(56);
  });

  it("has no duplicate colours under different names", () => {
    const values = Object.values(PAL);
    expect(new Set(values).size).toBe(values.length);
  });

  it("exposes the material ramps the toolkit depends on", () => {
    ["out", "roofL", "roof", "roofD", "roofX", "wallL", "wall", "wallD", "wallX",
     "wood", "woodL", "woodD", "stoneL", "stone", "stoneD",
     "glassL", "glass", "glassD", "door", "doorL", "doorD",
     "gold", "goldD", "leaf", "leafD", "grass", "grassD", "grassX"]
      .forEach((key) => expect(PAL).toHaveProperty(key));
  });

  it("is frozen so renderers cannot mutate it", () => {
    expect(Object.isFrozen(PAL)).toBe(true);
  });
});
