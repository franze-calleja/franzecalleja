import { describe, it, expect } from "vitest";
import { createMultiClickCounter } from "./multi-click";

describe("createMultiClickCounter", () => {
  it("fires on the Nth click within the window", () => {
    const c = createMultiClickCounter({ threshold: 5, windowMs: 1500 });
    expect(c.click(0).triggered).toBe(false);
    expect(c.click(100).triggered).toBe(false);
    expect(c.click(200).triggered).toBe(false);
    expect(c.click(300).triggered).toBe(false);
    expect(c.click(400).triggered).toBe(true); // 5th within window
  });

  it("reports how many taps remain before the trigger", () => {
    const c = createMultiClickCounter({ threshold: 5, windowMs: 1500 });
    expect(c.click(0).remaining).toBe(4);
    expect(c.click(100).remaining).toBe(3);
    expect(c.click(200).remaining).toBe(2);
    expect(c.click(300).remaining).toBe(1);
    expect(c.click(400).remaining).toBe(0); // triggering click reports 0 left
  });

  it("does not fire when clicks are too slow", () => {
    const c = createMultiClickCounter({ threshold: 3, windowMs: 500 });
    expect(c.click(0).triggered).toBe(false);
    expect(c.click(600).triggered).toBe(false);  // window lapsed -> restart at 1
    expect(c.click(700).triggered).toBe(false);  // only 2 within window
  });

  it("resets the remaining count when the window lapses", () => {
    const c = createMultiClickCounter({ threshold: 3, windowMs: 500 });
    expect(c.click(0).remaining).toBe(2);
    expect(c.click(600).remaining).toBe(2); // lapsed -> fresh count, 2 still needed
  });

  it("restarts the window when it lapses, fresh count begins", () => {
    const c = createMultiClickCounter({ threshold: 2, windowMs: 300 });
    expect(c.click(0).triggered).toBe(false);
    expect(c.click(1000).triggered).toBe(false); // lapsed, count = 1
    expect(c.click(1100).triggered).toBe(true);  // 2 within window
  });

  it("resets after firing so it can fire again", () => {
    const c = createMultiClickCounter({ threshold: 2, windowMs: 1000 });
    expect(c.click(0).triggered).toBe(false);
    expect(c.click(100).triggered).toBe(true);
    expect(c.click(200).triggered).toBe(false); // count restarted
    expect(c.click(300).triggered).toBe(true);
  });
});
