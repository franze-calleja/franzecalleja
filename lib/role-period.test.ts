import { describe, it, expect } from "vitest";
import { parseRolePeriod, rulerYears } from "./role-period";

const now = new Date(2026, 10, 22); // 22 Nov 2026

describe("parseRolePeriod", () => {
  it("parses a month-year start that runs to the present", () => {
    expect(parseRolePeriod("August 2025 - Present", now)).toEqual({ start: 2025 + 7 / 12, end: 2026 + 11 / 12, ongoing: true });
  });

  it("borrows the end's year when the start names only a month", () => {
    expect(parseRolePeriod("February - May 2025", now)).toEqual({ start: 2025 + 1 / 12, end: 2025 + 5 / 12, ongoing: false });
  });

  it("treats a bare start year as January", () => {
    expect(parseRolePeriod("2023 - Present", now)).toMatchObject({ start: 2023, ongoing: true });
  });

  it("parses a closed range across years", () => {
    expect(parseRolePeriod("August 2025 - January 2026", now)).toEqual({ start: 2025 + 7 / 12, end: 2026 + 1 / 12, ongoing: false });
  });

  it("accepts en dashes and three-letter months", () => {
    expect(parseRolePeriod("Aug 2025 – Jan 2026", now)).toEqual({ start: 2025 + 7 / 12, end: 2026 + 1 / 12, ongoing: false });
  });

  it("returns null when there is no year to place the role", () => {
    expect(parseRolePeriod("Present", now)).toBeNull();
  });
});

describe("rulerYears", () => {
  it("spans whole years from the earliest start to the year after the latest end", () => {
    expect(rulerYears([{ start: 2023, end: 2026.9 }, { start: 2025.1, end: 2025.4 }])).toEqual([2023, 2024, 2025, 2026, 2027]);
  });

  it("returns no years for no spans", () => {
    expect(rulerYears([])).toEqual([]);
  });
});
