"use client";

import { useEffect, useState } from "react";
import { GitHubCalendar } from "react-github-calendar";
import BrutalBlock from "./brutal-block";

const CALENDAR_THEME = {
  light: ["#e4e0ce", "#b0aa98", "#7a7462", "#44402e", "#0E100F"],
  dark: ["#1e2020", "#2c3a2a", "#3e5a38", "#5a8050", "#86b878"],
};

export default function BSideGithubContributions() {
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
    <BrutalBlock>
      <span className="bs-idx">10 / GITHUB ACTIVITY</span>
      <div style={{ marginTop: "0.8rem", overflowX: "auto", scrollbarWidth: "none" }}>
        <GitHubCalendar
          username="franze-calleja"
          colorScheme={colorScheme}
          theme={CALENDAR_THEME}
          blockSize={10}
          blockMargin={3}
          fontSize={11}
        />
      </div>
    </BrutalBlock>
  );
}
