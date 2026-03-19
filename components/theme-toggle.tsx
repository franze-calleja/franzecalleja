"use client";

import { Moon, SunMedium } from "lucide-react";

export default function ThemeToggle() {
  const toggleTheme = () => {
    const root = document.documentElement;
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";

    root.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
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