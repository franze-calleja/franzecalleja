"use client";

import { useEffect, useRef, type ReactNode } from "react";

type PointerTiltProps = {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees on each axis. */
  maxTilt?: number;
};

/**
 * Tilts its content toward the mouse pointer for a sense of depth.
 * Desktop pointers only; touch devices and reduced-motion users get a static
 * element. Writes the transform directly to the DOM inside one rAF loop that
 * stops once the motion settles, so it never re-renders React.
 */
export default function PointerTilt({ children, className, maxTilt = 6 }: PointerTiltProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frameId: number | null = null;

    const render = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      element.style.transform = `perspective(900px) rotateX(${currentY.toFixed(3)}deg) rotateY(${currentX.toFixed(3)}deg)`;

      const settled = Math.abs(targetX - currentX) < 0.01 && Math.abs(targetY - currentY) < 0.01;
      frameId = settled ? null : requestAnimationFrame(render);
    };

    const schedule = () => {
      if (frameId === null) frameId = requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = element.getBoundingClientRect();
      // Ignore the pointer once the element is off screen.
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const offsetX = (event.clientX - (rect.left + rect.width / 2)) / window.innerWidth;
      const offsetY = (event.clientY - (rect.top + rect.height / 2)) / window.innerHeight;
      targetX = Math.max(-1, Math.min(1, offsetX * 2)) * maxTilt;
      targetY = Math.max(-1, Math.min(1, offsetY * 2)) * -maxTilt;
      schedule();
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      schedule();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      if (frameId !== null) cancelAnimationFrame(frameId);
      element.style.transform = "";
    };
  }, [maxTilt]);

  return (
    <div ref={ref} className={className} style={{ transformStyle: "preserve-3d" }}>
      {children}
    </div>
  );
}
