"use client";

import { Github, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { GitHubCalendar } from "react-github-calendar";
import SectionCard from "./section-card";

const CALENDAR_THEME = {
  light: ["#e4e0ce", "#b0aa98", "#7a7462", "#44402e", "#0E100F"],
  dark: ["#1e2020", "#2c3a2a", "#3e5a38", "#5a8050", "#86b878"],
};

const USERNAME = "franze-calleja";

// Trims activity data to the last N weeks so the grid fits on narrow screens.
function lastNWeeks(weeks: number) {
  return (data: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[]) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return data.filter((d) => d.date >= cutoffStr);
  };
}

export default function GithubContributionsCard() {
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");
  const [followers, setFollowers] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () =>
      setColorScheme(root.dataset.theme === "dark" ? "dark" : "light");
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch(`https://api.github.com/users/${USERNAME}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    })
      .then((r) => r.json())
      .then((d) => setFollowers(d.followers))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <SectionCard className="lg:col-span-3" style={{ animationDelay: "840ms" }}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <a
            href={`https://github.com/${USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
          >
            <Github className="h-4 w-4 shrink-0" />
            {USERNAME}
          </a>
          {followers !== null && (
            <span className="flex items-center gap-1.5 text-xs text-(--muted)">
              <Users className="h-3.5 w-3.5" />
              {followers.toLocaleString()} followers
            </span>
          )}
        </div>
        <div className="flex justify-center">
          <GitHubCalendar
            username={USERNAME}
            colorScheme={colorScheme}
            theme={CALENDAR_THEME}
            blockSize={isMobile ? 9 : 11}
            blockMargin={isMobile ? 2 : 3}
            fontSize={11}
            transformData={isMobile ? lastNWeeks(26) : undefined}
          />
        </div>
      </div>
    </SectionCard>
  );
}
