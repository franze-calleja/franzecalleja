import { describe, it, expect } from "vitest";
import {
  AZRA_SANCTUARY_INTERIOR_HEIGHT,
  AZRA_SANCTUARY_INTERIOR_WIDTH,
  CHARACTER_SKINS,
  DEVOPS_STATION_INTERIOR_HEIGHT,
  DEVOPS_STATION_INTERIOR_WIDTH,
  GUILD_INTERIOR_WIDTH,
  GUILD_INTERIOR_HEIGHT,
  GUILD_PROJECT_STATIONS,
  NPCS,
  VILLAGE_POST_INTERIOR_HEIGHT,
  VILLAGE_POST_INTERIOR_WIDTH,
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
  it("keeps the Guild doorway clear of Architect Astro's collision area", () => {
    const astro = NPCS.find((npc) => npc.id === "npc-engineer");
    expect(astro).toBeDefined();

    // These are the same collision bodies used by GameCanvas. The player
    // returns through the natural Guild doorway at (128, 182).
    const playerLeft = 128 + 4;
    const playerRight = 128 + 20;
    const playerTop = 182 + 16;
    const playerBottom = 182 + 30;
    const astroLeft = astro!.x + 4 - astro!.wanderRadius;
    const astroRight = astro!.x + 28 + astro!.wanderRadius;
    const astroTop = astro!.y + 12 - astro!.wanderRadius;
    const astroBottom = astro!.y + 30 + astro!.wanderRadius;

    expect(
      playerRight <= astroLeft ||
      playerLeft >= astroRight ||
      playerBottom <= astroTop ||
      playerTop >= astroBottom
    ).toBe(true);
  });

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

describe("Village Post Interior", () => {
  it("uses the shared interior viewport dimensions", () => {
    expect(VILLAGE_POST_INTERIOR_WIDTH).toBe(700);
    expect(VILLAGE_POST_INTERIOR_HEIGHT).toBe(540);
  });
});

describe("AZRA Sanctuary Interior", () => {
  it("keeps its natural doorway exit clear of AZRA's patrol", () => {
    const azra = NPCS.find((npc) => npc.id === "npc-azra");
    expect(azra).toBeDefined();

    // The player returns from the Sanctuary at (620, 180). Expand AZRA's
    // collision body by her complete wander radius to test every patrol point.
    const playerLeft = 620 + 4;
    const playerRight = 620 + 20;
    const playerTop = 180 + 16;
    const playerBottom = 180 + 30;
    const azraLeft = azra!.x + 4 - azra!.wanderRadius;
    const azraRight = azra!.x + 28 + azra!.wanderRadius;
    const azraTop = azra!.y + 12 - azra!.wanderRadius;
    const azraBottom = azra!.y + 30 + azra!.wanderRadius;

    expect(
      playerRight <= azraLeft ||
      playerLeft >= azraRight ||
      playerBottom <= azraTop ||
      playerTop >= azraBottom
    ).toBe(true);
  });

  it("uses the shared interior viewport dimensions", () => {
    expect(AZRA_SANCTUARY_INTERIOR_WIDTH).toBe(700);
    expect(AZRA_SANCTUARY_INTERIOR_HEIGHT).toBe(540);
  });
});

describe("DevOps Station Interior", () => {
  it("keeps the natural Power Station exit clear of the SRE Node patrol", () => {
    const sreNode = NPCS.find((npc) => npc.id === "npc-devops");
    expect(sreNode).toBeDefined();

    // The player returns through the exterior door at (148, 380). Account
    // for the SRE Node's whole wander range, not just its anchor point.
    const playerLeft = 148 + 4;
    const playerRight = 148 + 20;
    const playerTop = 380 + 16;
    const playerBottom = 380 + 30;
    const nodeLeft = sreNode!.x + 4 - sreNode!.wanderRadius;
    const nodeRight = sreNode!.x + 28 + sreNode!.wanderRadius;
    const nodeTop = sreNode!.y + 12 - sreNode!.wanderRadius;
    const nodeBottom = sreNode!.y + 30 + sreNode!.wanderRadius;

    expect(
      playerRight <= nodeLeft ||
      playerLeft >= nodeRight ||
      playerBottom <= nodeTop ||
      playerTop >= nodeBottom
    ).toBe(true);
  });

  it("uses the shared interior viewport dimensions", () => {
    expect(DEVOPS_STATION_INTERIOR_WIDTH).toBe(700);
    expect(DEVOPS_STATION_INTERIOR_HEIGHT).toBe(540);
  });
});
