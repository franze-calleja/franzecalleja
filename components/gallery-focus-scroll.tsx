"use client";

import { useEffect } from "react";

/**
 * Keyboard support for the scroll-driven /projects gallery. Its panels are
 * translated sideways by page scroll, so a focused panel can sit off-screen;
 * on focus, scroll the page to the point where that panel slides into view.
 * Does nothing when the gallery is static (reduced motion, phones, no support).
 */
export default function GalleryFocusScroll() {
  useEffect(() => {
    const gallery = document.querySelector<HTMLElement>(".gallery");
    const track = gallery?.querySelector<HTMLElement>(".gallery__track");
    if (!gallery || !track) return;

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Element;
      // Keyboard focus only: a mouse press also focuses the link, and moving
      // the page under the pointer then would lose the click.
      if (!target.matches(":focus-visible")) return;
      if (getComputedStyle(track).animationName === "none") return;
      const panel = target.closest<HTMLElement>(".gallery__panel");
      if (!panel) return;
      const index = Number(panel.style.getPropertyValue("--i"));
      const count = Number(gallery.style.getPropertyValue("--n"));
      if (!(count > 1)) return;
      const top = gallery.getBoundingClientRect().top + window.scrollY;
      const runway = gallery.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + (index / (count - 1)) * runway, behavior: "instant" });
    };

    gallery.addEventListener("focusin", onFocusIn);
    return () => gallery.removeEventListener("focusin", onFocusIn);
  }, []);

  return null;
}
