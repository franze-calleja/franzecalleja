"use client";

import { Moon, SunMedium } from "lucide-react";
import { toggleThemeWithRipple } from "@/lib/theme-toggle";

export default function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={(e) => toggleThemeWithRipple(e)}
      className="theme-switch shrink-0 rounded-full border border-(--border) bg-transparent p-1 text-foreground transition-colors hover:bg-(--hover)"
      aria-label="Toggle color theme"
    >
      <span className="theme-switch__track">
        <span className="theme-switch__icon theme-switch__icon--sun" aria-hidden="true">
          <SunMedium className="h-3.5 w-3.5" />
        </span>
        <span className="theme-switch__icon theme-switch__icon--moon" aria-hidden="true">
          <Moon className="h-3.5 w-3.5" />
        </span>
        <span className="theme-switch__knob" aria-hidden="true" />
      </span>
    </button>
  );
}