"use client";

import { Github, Users } from "lucide-react";
import { useEffect, useState } from "react";
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

export default function BSideGithubContributions() {
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
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
