import { describe, it, expect } from "vitest";
import {
  CHARACTER_SKINS,
  GUILD_INTERIOR_WIDTH,
  GUILD_INTERIOR_HEIGHT,
  GUILD_PROJECT_STATIONS,
} from "../components/game/game-data";

describe("Character Skins Roster", () => {
  it("should contain all expected playable hero skins", () => {
    expect(CHARACTER_SKINS.length).toBeGreaterThanOrEqual(8);
    const skinIds = CHARACTER_SKINS.map((s) => s.id);
    expect(skinIds).toContain("franze");
    expect(skinIds).toContain("alliah");
    expect(skinIds).toContain("kisses");
    expect(skinIds).toContain("azra");
    expect(skinIds).toContain("astro");
    expect(skinIds).toContain("node");
    expect(skinIds).toContain("niwdla");
    expect(skinIds).toContain("shinobi");
  });

  it("should have unique IDs and required metadata for every skin", () => {
    const idSet = new Set<string>();
    CHARACTER_SKINS.forEach((skin) => {
      expect(idSet.has(skin.id)).toBe(false);
      idSet.add(skin.id);
      expect(skin.name).toBeTruthy();
      expect(skin.subtitle).toBeTruthy();
      expect(skin.badge).toBeTruthy();
      expect(skin.iconEmoji).toBeTruthy();
      expect(typeof skin.spriteRow).toBe("number");
    });
  });
});

describe("Projects Guild Interior & Stations", () => {
  it("should define interior dimensions and valid project stations", () => {
    expect(GUILD_INTERIOR_WIDTH).toBe(700);
    expect(GUILD_INTERIOR_HEIGHT).toBe(540);
    expect(GUILD_PROJECT_STATIONS.length).toBe(7);

    const ids = new Set<string>();
    GUILD_PROJECT_STATIONS.forEach((st) => {
      expect(ids.has(st.id)).toBe(false);
      ids.add(st.id);
      expect(st.name).toBeTruthy();
      expect(st.shortTitle).toBeTruthy();
      expect(st.color).toMatch(/^#/);
      expect(st.x).toBeGreaterThan(0);
      expect(st.y).toBeGreaterThan(0);
      expect(st.width).toBeGreaterThan(0);
      expect(st.height).toBeGreaterThan(0);
    });
  });
});

