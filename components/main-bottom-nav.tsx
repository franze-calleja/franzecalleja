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

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-5 z-60 flex justify-center px-5 sm:bottom-7"
    >
      <div className="flex items-center gap-1 rounded-full border border-foreground/15 bg-background/95 p-1.5 shadow-[0_12px_30px_rgba(14,16,15,0.14)] backdrop-blur-sm">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-foreground/8"
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