"use client";

import content from "@/app/profile-data.json";
import { useEffect, useState } from "react";
import SectionCard from "./section-card";

const items = content.testimonials.items;
const INTERVAL_MS = 4000;

export default function TestimonialsCard() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % items.length);
        setVisible(true);
      }, 300);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const item = items[index];

  return (
    <SectionCard style={{ animationDelay: "660ms" }}>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
            {content.testimonials.eyebrow}
          </p>
          {/* dot indicators */}
          <div className="flex gap-1" aria-hidden="true">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setVisible(false);
                  setTimeout(() => { setIndex(i); setVisible(true); }, 300);
                }}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? "bg-foreground" : "bg-(--border)"}`}
              />
            ))}
          </div>
        </div>

        <figure
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
          className="space-y-2 rounded-md border border-(--border) p-3"
        >
          <blockquote>
            <p className="text-xs leading-relaxed text-foreground sm:text-sm">
              &ldquo;{item.quote}&rdquo;
            </p>
          </blockquote>
          <figcaption className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              {item.name}
            </p>
            <p className="text-xs text-(--muted)">{item.role}</p>
          </figcaption>
        </figure>
      </div>
    </SectionCard>
  );
}
