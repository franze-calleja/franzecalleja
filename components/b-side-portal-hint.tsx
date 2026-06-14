"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD = 5;
// a touch above the portal's 1500ms tap window, so the countdown bounces back
// to full only once a tap streak has truly lapsed
const RESET_MS = 1700;

// A glitchy "leaking" portal affordance pinned near the avatar. It listens to
// the portal's `b-side:tap` broadcast to count down, and tapping it also feeds
// the hotspot (dispatches the same `b-side:avatar-click` the avatar uses).
export default function BSidePortalHint() {
  const [remaining, setRemaining] = useState(THRESHOLD);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onTap = (event: Event) => {
      const detail = (event as CustomEvent<{ remaining: number }>).detail;
      if (!detail) return;

      setRemaining(detail.remaining);
      if (resetTimer.current) clearTimeout(resetTimer.current);

      // after a partial streak, bounce the label back to full once the window
      // lapses (on a successful trigger we navigate away before this matters)
      if (detail.remaining > 0) {
        resetTimer.current = setTimeout(() => setRemaining(THRESHOLD), RESET_MS);
      }
    };

    window.addEventListener("b-side:tap", onTap);
    return () => {
      window.removeEventListener("b-side:tap", onTap);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const tap = () =>
    window.dispatchEvent(new CustomEvent("b-side:avatar-click"));

  const label =
    remaining >= THRESHOLD
      ? `TAP ME ${THRESHOLD}×`
      : remaining > 0
        ? `${remaining} MORE…`
        : "WARPING…";

  return (
    <button
      type="button"
      onClick={tap}
      aria-label={
        remaining > 0
          ? `Secret B-Side portal — tap ${remaining} more time${remaining === 1 ? "" : "s"} to enter`
          : "Entering the B-Side"
      }
      className="bside-hint"
    >
      <span className="bside-hint__arrow" aria-hidden="true">
        &#8598;
      </span>
      <span className="bside-hint__label" data-text={label}>
        {label}
      </span>
    </button>
  );
}
