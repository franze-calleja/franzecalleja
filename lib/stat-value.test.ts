import { describe, it, expect } from "vitest";
import { parseStatValue } from "./stat-value";

describe("parseStatValue", () => {
  it("parses a plain number", () => {
    expect(parseStatValue("11")).toEqual({ prefix: "", number: 11, suffix: "", pad: 0 });
  });

  it("keeps a trailing plus as the suffix", () => {
    expect(parseStatValue("28+")).toEqual({ prefix: "", number: 28, suffix: "+", pad: 0 });
  });

  it("records zero-padding for leading-zero values", () => {
    expect(parseStatValue("05")).toEqual({ prefix: "", number: 5, suffix: "", pad: 2 });
    expect(parseStatValue("01")).toMatchObject({ number: 1, pad: 2 });
  });

  it("keeps a percent sign as the suffix", () => {
    expect(parseStatValue("100%")).toMatchObject({ number: 100, suffix: "%", pad: 0 });
  });

  it("keeps trailing words as the suffix", () => {
    expect(parseStatValue("0 Incidents")).toEqual({ prefix: "", number: 0, suffix: " Incidents", pad: 0 });
  });

  it("returns null when the value does not start with a number", () => {
    expect(parseStatValue("LeBron James #1")).toBeNull();
  });

  it.each(["11", "28+", "05", "01", "100%", "62"])("round-trips %s to the exact original text", (input) => {
    const parsed = parseStatValue(input)!;
    expect(parsed.prefix + String(parsed.number).padStart(parsed.pad, "0") + parsed.suffix).toBe(input);
  });
});
