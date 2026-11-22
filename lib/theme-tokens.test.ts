import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { contrastRatio } from "./color-contrast";

/**
 * Guards the theme palette in app/globals.css: the accent must stay readable
 * as text, and the bottom-nav indicator (on its inverted pill) and its icon
 * must stay distinguishable as UI graphics.
 */
const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

function tokens(selector: RegExp): Record<string, string> {
  const block = css.match(selector)?.[1] ?? "";
  const out: Record<string, string> = {};
  for (const [, name, value] of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out[name] = value.trim();
  }
  return out;
}

const themes = {
  light: {
    vars: tokens(/:root\s*\{([^}]*)\}/),
    accent: "#B34700",
    navActive: "#E0662A",
    navActiveForeground: "#0E100F",
  },
  dark: {
    vars: tokens(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/),
    accent: "#E0662A",
    navActive: "#B34700",
    navActiveForeground: "#f3efdd",
  },
};

describe.each(Object.entries(themes))("%s theme tokens", (_, { vars, accent, navActive, navActiveForeground }) => {
  it("uses the spec's accent colour", () => {
    expect(vars["--accent"]?.toLowerCase()).toBe(accent.toLowerCase());
  });

  it("uses the accent shade that suits the inverted nav pill", () => {
    expect(vars["--nav-active"]?.toLowerCase()).toBe(navActive.toLowerCase());
    expect(vars["--nav-active-foreground"]?.toLowerCase()).toBe(navActiveForeground.toLowerCase());
  });

  it("keeps the accent readable as text on the page background (>= 4.5:1)", () => {
    expect(contrastRatio(vars["--accent"], vars["--background"])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the nav indicator visible on its pill (>= 3:1)", () => {
    expect(contrastRatio(vars["--nav-active"], vars["--nav-background"])).toBeGreaterThanOrEqual(3);
  });

  it("keeps the active nav icon visible on the indicator (>= 3:1)", () => {
    expect(contrastRatio(vars["--nav-active-foreground"], vars["--nav-active"])).toBeGreaterThanOrEqual(3);
  });
});
