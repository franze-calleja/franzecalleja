"use client";

import { useEffect, useRef } from "react";

// Animates direct children of the container into view with a brutalist
// "slam" stagger. Always reveals content; only animates when motion is allowed.
export function useGsapReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => {
      el.querySelectorAll<HTMLElement>('[data-reveal="true"]').forEach((n) => {
        n.dataset.revealed = "true";
      });
    };

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      reveal();
      return;
    }

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { default: gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          const targets = el.querySelectorAll<HTMLElement>('[data-reveal="true"]');
          targets.forEach((n) => (n.dataset.revealed = "true"));
          gsap.from(targets, {
            opacity: 0,
            y: 24,
            duration: 0.5,
            ease: "back.out(1.6)",
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
        }, el);
      } catch {
        // GSAP failed to load: just show content
        reveal();
      }
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return ref;
}
