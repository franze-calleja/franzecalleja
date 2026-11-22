"use client";

import Link from "next/link";
import { ChartNoAxesColumn, House, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type CSSProperties } from "react";

const navigationItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/stats", label: "Stats", icon: ChartNoAxesColumn },
] as const;

export default function MainBottomNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // Hide while scrolling down, show on scroll up or near the page end.
  // Writes a data attribute directly so scrolling never re-renders React.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    let lastY = window.scrollY;
    let frameId: number | null = null;

    const update = () => {
      frameId = null;
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) < 6) return;

      const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 80;
      const hide = delta > 0 && y > 120 && !nearBottom;
      nav.dataset.hidden = hide ? "true" : "false";
      lastY = y;
    };

    const onScroll = () => {
      if (frameId === null) frameId = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId !== null) cancelAnimationFrame(frameId);
      nav.dataset.hidden = "false";
    };
  }, [pathname]);

  const activeIndex = navigationItems.findIndex((item) => item.href === pathname);
  const hasActive = activeIndex !== -1;

  return (
    <nav
      ref={navRef}
      aria-label="Main navigation"
      className="main-bottom-nav fixed inset-x-0 bottom-5 z-60 flex justify-center px-5 sm:bottom-7"
    >
      <div className="main-bottom-nav__shell relative flex items-center gap-1 rounded-full p-1.5">
        <span
          aria-hidden="true"
          className={`main-bottom-nav__indicator pointer-events-none absolute h-11 w-11 rounded-full transition-opacity duration-200 ${
            hasActive ? "opacity-100" : "opacity-0"
          }`}
          style={{ transform: `translateX(${Math.max(activeIndex, 0) * 3}rem)` }}
        />
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
              style={{ "--vt-name": `nav-item-${index}` } as CSSProperties}
              className={`main-bottom-nav__item relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-200 ${
                isActive
                  ? "main-bottom-nav__item--active"
                  : "hover:bg-(--nav-hover)"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}