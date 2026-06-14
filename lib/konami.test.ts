import { describe, it, expect } from "vitest";
import { KONAMI_SEQUENCE, createSequenceMatcher } from "./konami";

describe("createSequenceMatcher", () => {
  it("returns true only when the full sequence completes", () => {
    const m = createSequenceMatcher(KONAMI_SEQUENCE);
    const results = KONAMI_SEQUENCE.map((k) => m.push(k));
    // only the last push completes the sequence
    expect(results.slice(0, -1).every((r) => r === false)).toBe(true);
    expect(results[results.length - 1]).toBe(true);
  });

  it("is case-insensitive for letter keys", () => {
    const m = createSequenceMatcher(["a", "b"]);
    expect(m.push("A")).toBe(false);
    expect(m.push("B")).toBe(true);
  });

  it("restarts on a wrong key, re-counting a key that equals the first symbol", () => {
    const m = createSequenceMatcher(["ArrowUp", "ArrowDown"]);
    expect(m.push("ArrowUp")).toBe(false);   // progress 1
    expect(m.push("ArrowUp")).toBe(false);   // mismatch, but equals first -> progress stays 1
    expect(m.push("ArrowDown")).toBe(true);  // completes
  });

  it("fully resets on an unrelated key", () => {
    const m = createSequenceMatcher(["ArrowUp", "ArrowDown"]);
    expect(m.push("ArrowUp")).toBe(false);
    expect(m.push("x")).toBe(false);         // unrelated -> progress 0
    expect(m.push("ArrowDown")).toBe(false); // not the first symbol, no completion
  });

  it("exposes the canonical Konami sequence", () => {
    expect(KONAMI_SEQUENCE).toEqual([
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
    ]);
  });
});
