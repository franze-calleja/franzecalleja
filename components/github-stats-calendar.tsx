"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Github, Users, GitCommit, Flame } from "lucide-react";
import { GitHubCalendar } from "react-github-calendar";

const CALENDAR_THEME = {
  light: ["#e8e3cf", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  dark: ["#1e2020", "#2c3a2a", "#3e5a38", "#5a8050", "#86b878"],
};

const USERNAME = "franze-calleja";

function lastNWeeks(weeks: number) {
  return (data: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[]) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return data.filter((d) => d.date >= cutoffStr);
  };
}

function subscribeToTheme(callback: () => void) {
  const root = document.documentElement;
  const observer = new MutationObserver(callback);
  observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getThemeSnapshot(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getThemeServerSnapshot(): "light" | "dark" {
  return "light";
}

function subscribeToMobile(callback: () => void) {
  const mq = window.matchMedia("(max-width: 639px)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getMobileSnapshot() {
  return window.matchMedia("(max-width: 639px)").matches;
}

function getMobileServerSnapshot() {
  return false;
}

export default function GithubStatsCalendar() {
  const colorScheme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
  const [followers, setFollowers] = useState<number | null>(null);
  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    getMobileSnapshot,
    getMobileServerSnapshot,
  );

  useEffect(() => {
    fetch(`https://api.github.com/users/${USERNAME}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    })
      .then((r) => r.json())
      .then((d) => setFollowers(d.followers))
      .catch(() => {});
  }, []);

  return (
    <article className="border border-foreground/50 bg-background p-5 transition-all duration-300 hover:border-foreground hover:shadow-xl sm:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/20 pb-4">
        <div className="flex items-center gap-2.5">
          <Github className="h-5 w-5 text-foreground" aria-hidden="true" />
          <div>
            <div className="flex items-center gap-2">
              <a
                href={`https://github.com/${USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm font-bold tracking-tight text-foreground hover:underline sm:text-base"
              >
                @{USERNAME}
              </a>
              <span className="inline-flex items-center gap-1 border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <p className="font-mono text-xs text-(--muted)">
              Public commit history & contribution velocity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {followers !== null && (
            <span className="flex items-center gap-1.5 font-mono text-xs text-(--muted)">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {followers.toLocaleString()} followers
            </span>
          )}
          <a
            href={`https://github.com/${USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden border border-foreground/35 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider transition-colors hover:border-foreground hover:bg-foreground hover:text-background sm:inline-block"
          >
            Visit Profile ↗
          </a>
        </div>
      </div>

      {/* Calendar Area */}
      <div className="github-calendar-wrapper mt-6 flex w-full justify-center overflow-x-auto pb-2">
        <GitHubCalendar
          username={USERNAME}
          colorScheme={colorScheme}
          theme={CALENDAR_THEME}
          blockSize={isMobile ? 10 : 12}
          blockMargin={isMobile ? 2.5 : 3.5}
          fontSize={12}
          transformData={isMobile ? lastNWeeks(26) : undefined}
        />
      </div>

      {/* Footer Meta */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-foreground/15 pt-3 font-mono text-[11px] text-(--muted)">
        <span className="flex items-center gap-1.5">
          <GitCommit className="h-3.5 w-3.5" />
          Continuously shipping open-source & enterprise code
        </span>
        <span className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-amber-500" />
          Updated in real-time via GitHub API
        </span>
      </div>
    </article>
  );
}
