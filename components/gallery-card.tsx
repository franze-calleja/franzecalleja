"use client";

import content from "@/app/profile-data.json";
import { useEffect, useRef, useState } from "react";
import SectionCard from "./section-card";

const AUTO_SCROLL_MS = 2800;

export default function GalleryCard() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || content.gallery.items.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return;
      }

      const item = viewport.querySelector<HTMLElement>("[data-gallery-item]");
      if (!item) {
        return;
      }

      const atEnd = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 2;
      if (atEnd) {
        viewport.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      viewport.scrollBy({ left: item.offsetWidth, behavior: "smooth" });
    }, AUTO_SCROLL_MS);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <SectionCard className="lg:col-span-3">
      <div className="space-y-2.5">
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
              {content.gallery.eyebrow}
            </p>
            <p className="text-xs text-(--muted) sm:text-sm">
              {content.gallery.subtitle}
            </p>
          </div>
          <p className="text-xs text-(--muted)">
            {content.gallery.items.length} items
          </p>
        </div>

        <div
          ref={viewportRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {content.gallery.items.map((item) => (
            <div
              key={item.label}
              data-gallery-item
              className="group relative aspect-4/5 shrink-0 basis-1/2 overflow-hidden rounded-md border border-(--border) sm:basis-1/3 lg:basis-1/5"
            >
              <div className={`absolute inset-0 bg-linear-to-br ${item.tone}`} />
              <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.14),transparent_45%,rgba(0,0,0,0.36))]" />
              <div className="relative flex h-full flex-col justify-between p-3 text-white">
                <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.2em] backdrop-blur-sm">
                  {item.label}
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-tight">{item.title}</p>
                  <p className="text-[0.7rem] leading-5 text-white/75 sm:text-xs">
                    {item.caption}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}