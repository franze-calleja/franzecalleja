"use client";

import { useEffect, useState } from "react";
import { GitHubCalendar } from "react-github-calendar";
import SectionCard from "./section-card";

const CALENDAR_THEME = {
  light: ["#e4e0ce", "#b0aa98", "#7a7462", "#44402e", "#0E100F"],
  dark: ["#1e2020", "#2c3a2a", "#3e5a38", "#5a8050", "#86b878"],
};

export default function GithubContributionsCard() {
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const sync = () =>
      setColorScheme(root.dataset.theme === "dark" ? "dark" : "light");
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <SectionCard className="lg:col-span-2" style={{ animationDelay: "840ms" }}>
      <div className="space-y-2.5">
        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
            GitHub Activity
          </p>
          <p className="text-xs text-(--muted) sm:text-sm">
            Contribution history · last 365 days
          </p>
        </div>
        <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <GitHubCalendar
            username="franze-calleja"
            colorScheme={colorScheme}
            theme={CALENDAR_THEME}
            blockSize={10}
            blockMargin={3}
            fontSize={11}
          />
        </div>
      </div>
    </SectionCard>
  );
}
