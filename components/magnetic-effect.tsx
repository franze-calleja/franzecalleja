"use client";

import { useEffect } from "react";

const MAX_OFFSET_PX = 6;

/**
 * Pulls any `[data-magnetic]` element slightly toward the mouse pointer.
 * One delegated listener for the whole page; it only sets the `--mx`/`--my`
 * CSS variables, and globals.css turns them into a `translate`. Desktop
 * pointers only; disabled for reduced motion.
 */
export default function MagneticEffect() {
  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    let active: HTMLElement | null = null;
    // Rect captured on enter, before any translate, so the pull doesn't drift.
    let activeRect: DOMRect | null = null;

    const release = (element: HTMLElement) => {
      element.style.removeProperty("--mx");
      element.style.removeProperty("--my");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-magnetic]")
        : null;

      if (target !== active) {
        if (active) release(active);
        active = target;
        activeRect = target?.getBoundingClientRect() ?? null;
      }
      if (!active || !activeRect) return;

      const dx = (event.clientX - (activeRect.left + activeRect.width / 2)) / (activeRect.width / 2);
      const dy = (event.clientY - (activeRect.top + activeRect.height / 2)) / (activeRect.height / 2);
      const clamp = (value: number) => Math.max(-1, Math.min(1, value)) * MAX_OFFSET_PX;
      active.style.setProperty("--mx", `${clamp(dx).toFixed(2)}px`);
      active.style.setProperty("--my", `${clamp(dy).toFixed(2)}px`);
    };

    const reset = () => {
      if (active) release(active);
      active = null;
      activeRect = null;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", reset, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", reset);
      document.documentElement.removeEventListener("pointerleave", reset);
      reset();
    };
  }, []);

  return null;
}
