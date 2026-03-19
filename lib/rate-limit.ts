// In-memory sliding-window rate limiter.
//
// This is intentionally simple — it resets on serverless cold starts and does
// not share state across function instances. For a personal portfolio that is
// the right trade-off: zero external dependencies, zero latency overhead, and
// still effective at stopping a single client from hammering the endpoint
// within one warm-lambda window.

const store = new Map<string, number[]>();

/** Maximum requests allowed per window per IP. */
const MAX_REQUESTS = 10;

/** Length of the sliding window in milliseconds. */
const WINDOW_MS = 60_000; // 1 minute

export interface RateLimitResult {
  /** Whether the request is allowed to proceed. */
  allowed: boolean;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Seconds until the oldest hit falls out of the window. */
  resetInSeconds: number;
}

/**
 * Check (and record) a request from `ip`.
 *
 * @param ip  The client's IP address used as the rate-limit key.
 */
export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Keep only hits that fall inside the current window.
  const hits = (store.get(ip) ?? []).filter((t) => t > windowStart);

  if (hits.length >= MAX_REQUESTS) {
    // Tell the caller how many seconds until the oldest hit expires.
    const resetInSeconds = Math.ceil((hits[0]! + WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  hits.push(now);
  store.set(ip, hits);

  // Periodically evict fully-expired entries so the Map does not grow forever.
  if (store.size > 5_000) {
    for (const [key, times] of store) {
      if (times.every((t) => t <= windowStart)) {
        store.delete(key);
      }
    }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - hits.length,
    resetInSeconds: 60,
  };
}
