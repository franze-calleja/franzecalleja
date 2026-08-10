import { describe, it, expect, vi, afterEach } from "vitest";

import { checkRateLimit } from "./rate-limit";

// rate-limit.ts holds one module-level Map, so hits persist across tests in this
// file. Every test takes a fresh IP to stay isolated from its neighbours.
let ipCounter = 0;
const nextIp = () => `10.0.0.${ipCounter++}`;

afterEach(() => {
  vi.useRealTimers();
});

describe("checkRateLimit", () => {
  it("allows ten requests in a window and counts remaining down to zero", () => {
    const ip = nextIp();

    const results = Array.from({ length: 10 }, () => checkRateLimit(ip));

    expect(results.every((result) => result.allowed)).toBe(true);
    expect(results.map((result) => result.remaining)).toEqual([
      9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
    ]);
  });

  it("denies the eleventh request inside the same window", () => {
    const ip = nextIp();

    for (let i = 0; i < 10; i += 1) {
      checkRateLimit(ip);
    }

    const denied = checkRateLimit(ip);

    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
    expect(denied.resetInSeconds).toBeGreaterThan(0);
    expect(denied.resetInSeconds).toBeLessThanOrEqual(60);
  });

  it("allows requests again once the window has elapsed", () => {
    vi.useFakeTimers();
    const ip = nextIp();

    for (let i = 0; i < 10; i += 1) {
      checkRateLimit(ip);
    }

    expect(checkRateLimit(ip).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    const afterWindow = checkRateLimit(ip);

    expect(afterWindow.allowed).toBe(true);
    expect(afterWindow.remaining).toBe(9);
  });

  it("tracks each IP independently", () => {
    const busy = nextIp();
    const quiet = nextIp();

    for (let i = 0; i < 10; i += 1) {
      checkRateLimit(busy);
    }

    expect(checkRateLimit(busy).allowed).toBe(false);
    expect(checkRateLimit(quiet).allowed).toBe(true);
  });
});
