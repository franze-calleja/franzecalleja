"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A sleek, dynamic cursor follower dot with smooth trailing lag physics.
 * Automatically adapts between light/dark themes and scales over interactive elements.
 */
export default function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const posRef = useRef({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    // Only enable on pointer-capable desktop screens with fine hover
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mediaQuery.matches) return;

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      if (!isVisible) {
        posRef.current.x = e.clientX;
        posRef.current.y = e.clientY;
        setIsVisible(true);
      }

      // Check if hovering over interactive element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        target.closest(
          "a, button, input, textarea, select, [role='button'], .cursor-pointer, summary",
        )
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const onMouseDown = () => setIsClicked(true);
    const onMouseUp = () => setIsClicked(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    document.documentElement.addEventListener("mouseenter", onMouseEnter);

    let animationFrameId: number;

    const render = () => {
      // Linear interpolation (lerp) for smooth trailing lag delay
      const speed = 0.18;
      posRef.current.x += (mouseRef.current.x - posRef.current.x) * speed;
      posRef.current.y += (mouseRef.current.y - posRef.current.y) * speed;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      document.documentElement.removeEventListener("mouseenter", onMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-9999 hidden rounded-full transition-[width,height,opacity] duration-200 ease-out md:block ${
        !isVisible
          ? "opacity-0"
          : isHovered
            ? "h-8 w-8 bg-white opacity-100"
            : isClicked
              ? "h-2 w-2 bg-white opacity-95"
              : "h-2.5 w-2.5 bg-white opacity-90"
      }`}
      style={{
        willChange: "transform",
        mixBlendMode: "difference",
      }}
    />
  );
}
