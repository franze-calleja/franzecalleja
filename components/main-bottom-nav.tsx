"use client";

import Link from "next/link";
import { ChartNoAxesColumn, House, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/stats", label: "Stats", icon: ChartNoAxesColumn },
] as const;

export default function MainBottomNav() {
  const pathname = usePathname();

  const activeIndex = navigationItems.findIndex((item) => item.href === pathname);
  const hasActive = activeIndex !== -1;

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-5 z-60 flex justify-center px-5 sm:bottom-7"
    >
      <div className="main-bottom-nav__shell relative flex items-center gap-1 rounded-full p-1.5">
        <span
          aria-hidden="true"
          className={`main-bottom-nav__indicator pointer-events-none absolute h-11 w-11 rounded-full transition-opacity duration-200 ${
            hasActive ? "opacity-100" : "opacity-0"
          }`}
          style={{ transform: `translateX(${Math.max(activeIndex, 0) * 3}rem)` }}
        />
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
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