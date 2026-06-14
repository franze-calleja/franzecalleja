"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { KONAMI_SEQUENCE, createSequenceMatcher } from "@/lib/konami";
import { createMultiClickCounter } from "@/lib/multi-click";

// Plays a glitch flash on the overlay element, then runs `after`.
// Falls back to a plain timeout if GSAP/motion is unavailable.
async function playWarp(overlay: HTMLElement, after: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  overlay.style.display = "flex";

  if (reduced) {
    overlay.style.opacity = "1";
    window.setTimeout(after, 250);
    return;
  }

  try {
    const { default: gsap } = await import("gsap");
    const tl = gsap.timeline({ onComplete: after });
    try {
      tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.15 })
        .to(overlay, { x: 6, duration: 0.04, repeat: 8, yoyo: true })
        .to(overlay, { filter: "hue-rotate(180deg) contrast(2)", duration: 0.15 })
        .to(overlay, { duration: 0.25 });
    } catch (err) {
      // building the timeline failed after creation: kill it so onComplete
      // can't fire alongside the fallback below
      tl.kill();
      throw err;
    }
  } catch {
    window.setTimeout(after, 250);
  }
}

const DPAD = [
  { k: "ArrowUp", s: "↑" }, { k: "ArrowDown", s: "↓" },
  { k: "ArrowLeft", s: "←" }, { k: "ArrowRight", s: "→" },
  { k: "b", s: "B" }, { k: "a", s: "A" },
];

export default function DimensionPortal() {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const matcherRef = useRef(createSequenceMatcher(KONAMI_SEQUENCE));
  const clickerRef = useRef(createMultiClickCounter({ threshold: 5, windowMs: 1500 }));
  const warpingRef = useRef(false);
  const [showDpad, setShowDpad] = useState(false);
  const [warpLabel, setWarpLabel] = useState("ENTERING THE B-SIDE…");

  const onB = pathname.startsWith("/b-side");

  const warpTo = useCallback(
    (dest: string) => {
      if (warpingRef.current) return;
      warpingRef.current = true;
      setWarpLabel(
        dest === "/b-side" ? "ENTERING THE B-SIDE…" : "EXITING THE B-SIDE…",
      );
      const overlay = overlayRef.current;
      if (!overlay) {
        router.push(dest);
        warpingRef.current = false;
        return;
      }
      playWarp(overlay, () => {
        router.push(dest);
        // hide overlay shortly after navigation
        window.setTimeout(() => {
          const o = overlayRef.current;
          if (o) {
            o.style.display = "none";
            o.style.opacity = "0";
            o.style.filter = "none";
          }
          warpingRef.current = false;
        }, 400);
      });
    },
    [router],
  );

  const feedKey = useCallback(
    (key: string) => {
      if (onB) return;
      if (matcherRef.current.push(key)) warpTo("/b-side");
    },
    [onB, warpTo],
  );

  // keyboard konami (ignore when typing in a field)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) {
        return;
      }
      feedKey(e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [feedKey]);

  // avatar hotspot clicks (dispatched from profile-header)
  useEffect(() => {
    const handler = () => {
      if (onB) return;
      if (clickerRef.current.click(Date.now())) warpTo("/b-side");
    };
    window.addEventListener("b-side:avatar-click", handler);
    return () => window.removeEventListener("b-side:avatar-click", handler);
  }, [onB, warpTo]);

  // exit from inside the dimension (footer button or ESC)
  useEffect(() => {
    const exit = () => onB && warpTo("/");
    const onKey = (e: KeyboardEvent) => {
      if (onB && e.key === "Escape") warpTo("/");
    };
    window.addEventListener("b-side:exit", exit);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("b-side:exit", exit);
      window.removeEventListener("keydown", onKey);
    };
  }, [onB, warpTo]);

  return (
    <>
      {/* glitch warp overlay */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        style={{
          display: "none",
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          opacity: 0,
          alignItems: "center",
          justifyContent: "center",
          background:
            "repeating-linear-gradient(0deg,#000 0px,#000 2px,#111 3px,#111 4px)",
          color: "#33ff66",
          fontFamily: "monospace",
          fontSize: "1.1rem",
          letterSpacing: "0.2em",
          pointerEvents: "none",
        }}
      >
        {warpLabel}
      </div>

      {/* touch d-pad: only on the main site, toggled by a small glyph */}
      {!onB && (
        <div style={{ position: "fixed", right: 12, bottom: 12, zIndex: 50 }}>
          {showDpad ? (
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 2.2rem)", gap: 4, background: "var(--background)", border: "2px solid var(--foreground)", padding: 6 }}
            >
              {DPAD.map(({ k, s }) => (
                <button
                  key={k}
                  type="button"
                  aria-label={`Code key ${s}`}
                  onClick={() => feedKey(k)}
                  style={{ border: "2px solid var(--foreground)", background: "transparent", color: "var(--foreground)", fontFamily: "monospace", height: "2.2rem", cursor: "pointer" }}
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                aria-label="Hide code pad"
                onClick={() => setShowDpad(false)}
                style={{ gridColumn: "span 3", border: "2px solid var(--foreground)", background: "transparent", color: "var(--foreground)", fontFamily: "monospace", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label="Open secret code pad"
              onClick={() => setShowDpad(true)}
              style={{ width: "1.6rem", height: "1.6rem", border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontFamily: "monospace", opacity: 0.5, cursor: "pointer" }}
            >
              ◳
            </button>
          )}
        </div>
      )}
    </>
  );
}
