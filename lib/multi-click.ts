export function createMultiClickCounter(options: {
  threshold: number;
  windowMs: number;
}) {
  let count = 0;
  let firstTs = 0;

  return {
    click(now: number): boolean {
      if (count === 0 || now - firstTs > options.windowMs) {
        count = 1;
        firstTs = now;
      } else {
        count += 1;
      }
      if (count >= options.threshold) {
        count = 0;
        firstTs = 0;
        return true;
      }
      return false;
    },
    reset() {
      count = 0;
      firstTs = 0;
    },
  };
}
