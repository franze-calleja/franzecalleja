import { describe, it, expect } from "vitest";
import { latestStartYear } from "./experience-years";

describe("latestStartYear", () => {
  it("returns the latest start year, reading the first year in each period", () => {
    expect(latestStartYear(["August 2025 - January 2026", "February - May 2025"])).toBe(2025);
  });

  it("picks the maximum across periods", () => {
    expect(latestStartYear(["2023 - Present", "January 2026 - Present"])).toBe(2026);
  });

  it("returns null when no period has a year", () => {
    expect(latestStartYear(["Present"])).toBeNull();
  });

  it("returns null for no periods", () => {
    expect(latestStartYear([])).toBeNull();
  });
});
