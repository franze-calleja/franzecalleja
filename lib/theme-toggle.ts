import React from "react";

/**
 * Toggles the theme between dark and light with a circular expanding ripple
 * effect originating from the clicked coordinate using the modern View Transitions API.
 */
export function toggleThemeWithRipple(
  event?: React.MouseEvent<HTMLElement> | MouseEvent,
) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const currentTheme = root.dataset.theme || "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  const isReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!document.startViewTransition || isReducedMotion) {
    root.dataset.theme = nextTheme;
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {}
    return;
  }

  // Determine origin coordinates for circular clip-path
  let x = window.innerWidth - 48;
  let y = 48;

  if (event) {
    if (event.clientX && event.clientY) {
      x = event.clientX;
      y = event.clientY;
    } else if (event.currentTarget) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
  }

  // Calculate the maximum radius needed to cover the entire viewport
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = document.startViewTransition(() => {
    root.dataset.theme = nextTheme;
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {}
  });

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 900,
        delay: 150,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
}
