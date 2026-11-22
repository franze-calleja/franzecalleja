import { describe, it, expect } from "vitest";
import { contrastRatio } from "./color-contrast";

describe("contrastRatio", () => {
  it("rates black on white at the 21:1 maximum", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("is symmetric in its arguments", () => {
    expect(contrastRatio("#B34700", "#f3efdd")).toBe(contrastRatio("#f3efdd", "#B34700"));
  });

  it("rates the light-theme accent on cream at about 4.8:1", () => {
    expect(contrastRatio("#B34700", "#f3efdd")).toBeCloseTo(4.8, 1);
  });

  it("rates the dark-theme accent on ink at about 5.5:1", () => {
    expect(contrastRatio("#E0662A", "#0E100F")).toBeCloseTo(5.55, 2);
  });

  it("rates ink on the light-theme accent at about 3.5:1", () => {
    expect(contrastRatio("#0E100F", "#B34700")).toBeCloseTo(3.5, 1);
  });

  it("accepts 3-digit hex", () => {
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 1);
  });
});
