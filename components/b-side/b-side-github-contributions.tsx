"use client";

import { Github, Users } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { GitHubCalendar } from "react-github-calendar";
import BrutalBlock from "./brutal-block";

const CALENDAR_THEME = {
  light: ["#e4e0ce", "#b0aa98", "#7a7462", "#44402e", "#0E100F"],
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

export default function BSideGithubContributions() {
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
    <BrutalBlock>
      <span className="bs-idx">10 / GITHUB ACTIVITY</span>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginTop: "0.8rem" }}>
        <a
          href={`https://github.com/${USERNAME}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bs-mono"
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem", fontWeight: 700 }}
        >
          <Github style={{ width: "1rem", height: "1rem" }} />
          {USERNAME}
        </a>
        {followers !== null && (
          <span className="bs-mono" style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", opacity: 0.65 }}>
            <Users style={{ width: "0.8rem", height: "0.8rem" }} />
            {followers.toLocaleString()} followers
          </span>
        )}
      </div>
      <div style={{ marginTop: "0.8rem", display: "flex", justifyContent: "center" }}>
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
    </BrutalBlock>
  );
}
