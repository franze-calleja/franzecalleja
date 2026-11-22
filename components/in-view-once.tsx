"use client";

import type { ReactNode } from "react";

import { useInViewOnce } from "@/lib/use-in-view-once";

/**
 * Wraps server-rendered content and marks it `data-armed` / `data-in` so CSS
 * can play a one-shot entrance (see the stats count-up in globals.css).
 */
export default function InViewOnce({ className, children }: { className?: string; children: ReactNode }) {
  const { ref, armed, inView } = useInViewOnce<HTMLDivElement>();
  return (
    <div ref={ref} className={className} data-armed={armed || undefined} data-in={inView || undefined}>
      {children}
    </div>
  );
}
