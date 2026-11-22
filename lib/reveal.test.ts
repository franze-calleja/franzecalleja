import { describe, it, expect } from "vitest";
import { shouldReveal } from "./reveal";

const entry = (ratio: number, rectHeight: number, rootHeight: number, isIntersecting = true) => ({
  isIntersecting,
  intersectionRatio: ratio,
  intersectionRect: { height: rectHeight },
  rootBounds: { height: rootHeight },
});

describe("shouldReveal", () => {
  it("reveals once the visible share reaches the threshold", () => {
    expect(shouldReveal(entry(0.3, 300, 900), 0.3)).toBe(true);
  });

  it("waits while too little of a normal-sized element is visible", () => {
    expect(shouldReveal(entry(0.1, 100, 900), 0.3)).toBe(false);
  });

  it("reveals an element taller than the viewport once it fills half the viewport", () => {
    // 400% zoom: a 1152px grid in a 270px viewport can never reach a 0.3 ratio.
    expect(shouldReveal(entry(0.23, 270, 270), 0.3)).toBe(true);
  });

  it("never reveals a non-intersecting element", () => {
    expect(shouldReveal(entry(0, 0, 900, false), 0.3)).toBe(false);
  });

  it("falls back to the ratio when the root size is unknown", () => {
    expect(shouldReveal({ isIntersecting: true, intersectionRatio: 0.5, intersectionRect: { height: 10 }, rootBounds: null }, 0.3)).toBe(true);
  });
});
