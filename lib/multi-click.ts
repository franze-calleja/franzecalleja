export type MultiClickResult = {
  // true on the click that reaches the threshold within the window
  triggered: boolean;
  // taps still needed before the next trigger (0 on the triggering click)
  remaining: number;
};

export function createMultiClickCounter(options: {
  threshold: number;
  windowMs: number;
}) {
  let count = 0;
  let firstTs = 0;

  return {
    click(now: number): MultiClickResult {
      if (count === 0 || now - firstTs > options.windowMs) {
        count = 1;
        firstTs = now;
      } else {
        count += 1;
      }
      if (count >= options.threshold) {
        count = 0;
        firstTs = 0;
        return { triggered: true, remaining: 0 };
      }
      return { triggered: false, remaining: options.threshold - count };
    },
    reset() {
      count = 0;
      firstTs = 0;
    },
  };
}
