import { describe, it, expect } from "vitest";
import { createMultiClickCounter } from "./multi-click";

describe("createMultiClickCounter", () => {
  it("fires on the Nth click within the window", () => {
    const c = createMultiClickCounter({ threshold: 5, windowMs: 1500 });
    expect(c.click(0)).toBe(false);
    expect(c.click(100)).toBe(false);
    expect(c.click(200)).toBe(false);
    expect(c.click(300)).toBe(false);
    expect(c.click(400)).toBe(true); // 5th within window
  });

  it("does not fire when clicks are too slow", () => {
    const c = createMultiClickCounter({ threshold: 3, windowMs: 500 });
    expect(c.click(0)).toBe(false);
    expect(c.click(600)).toBe(false);  // window lapsed -> restart at 1
    expect(c.click(700)).toBe(false);  // only 2 within window
  });

  it("restarts the window when it lapses, fresh count begins", () => {
    const c = createMultiClickCounter({ threshold: 2, windowMs: 300 });
    expect(c.click(0)).toBe(false);
    expect(c.click(1000)).toBe(false); // lapsed, count = 1
    expect(c.click(1100)).toBe(true);  // 2 within window
  });

  it("resets after firing so it can fire again", () => {
    const c = createMultiClickCounter({ threshold: 2, windowMs: 1000 });
    expect(c.click(0)).toBe(false);
    expect(c.click(100)).toBe(true);
    expect(c.click(200)).toBe(false); // count restarted
    expect(c.click(300)).toBe(true);
  });
});
