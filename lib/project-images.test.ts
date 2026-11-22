import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

import content from "../app/profile-data.json";

/**
 * Project screenshots are shown in a 360px hover preview, so each file must be
 * small enough to load the instant a card is hovered.
 */
const MAX_BYTES = 250 * 1024;
const images = content.projects.items.map((p) => p.image).filter((src) => src.trim() !== "");

describe.each(images)("project image %s", (src) => {
  const file = join(process.cwd(), "public", src);

  it("exists in public/", () => {
    expect(existsSync(file)).toBe(true);
  });

  it(`is at most ${MAX_BYTES / 1024} KB`, () => {
    expect(statSync(file).size).toBeLessThanOrEqual(MAX_BYTES);
  });
});
