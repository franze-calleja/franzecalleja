"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MAP_TOTAL_WIDTH,
  MAP_TOTAL_HEIGHT,
  PLAYER_SPAWN_X,
  PLAYER_SPAWN_Y,
  WORLD_OBJECTS,
  NPCS,
  WorldObject,
  NPC,
  CHARACTER_SKINS,
  GUILD_INTERIOR_WIDTH,
  GUILD_INTERIOR_HEIGHT,
  GUILD_PROJECT_STATIONS,
  ProjectStation,
  DECORATIVE_TREES,
  FLOWER_POTS,
  DECORATIVE_BUSHES,
  VILLAGE_FURNITURE,
  PATHWAY_FENCES,
} from "./game-data";
import { retroAudio } from "./game-audio";
import { sortByBaseline, type Drawable } from "./game-pixel";
import { collectBuildings } from "./game-buildings";
import {
  collectFences, collectFlowerPots, collectBushes, collectFurniture, collectTrees,
} from "./game-props";
import {
  collectStatues, collectBanners, drawCentralFountain, drawBasketballCourt,
  collectBasketballHoop, FOUNTAIN_BASELINE,
} from "./game-landmarks";
import { drawGuildInterior } from "./game-interior";
import { PAL } from "./game-palette";
import {
  renderTerrainToCache,
  drawTerrain,
  drawTallGrassBases,
  collectTallGrassTips,
  isInTallGrass,
  spawnLeaves,
  type Leaf,
} from "./game-terrain";
import GameDialogue from "./game-dialogue";
import GameModal from "./game-modals";
import GameControls from "./game-controls";
import GameCharacterSelect from "./game-character-select";
import { Volume2, VolumeX, Maximize2, MapPin, MousePointer, Sparkles } from "lucide-react";

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  direction: "down" | "up" | "left" | "right";
  isMoving: boolean;
  frame: number;
  animTimer: number;
}

interface NpcLiveState {
  x: number;
  y: number;
  direction: "down" | "up" | "left" | "right";
  isMoving: boolean;
  frame: number;
  animTimer: number;
  targetX: number;
  targetY: number;
  idleTimer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

// --- SPRITESHEET CHARACTER RENDERER ---

function drawSpritesheetCharacter(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  row: number,
  x: number,
  y: number,
  direction: "down" | "up" | "left" | "right",
  isMoving: boolean,
  frame: number,
  customEffect?: "azra" | "allia" | "none"
) {
  // 1. Soft Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 30, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const float = customEffect === "azra" ? Math.sin(Date.now() * 0.005) * 4 : 0;

  // Custom Arcane Aura for AZRA
  if (customEffect === "azra") {
    const grad = ctx.createRadialGradient(
      x + 16,
      y + 16 + float,
      4,
      x + 16,
      y + 16 + float,
      24
    );
    grad.addColorStop(0, "rgba(56, 189, 248, 0.8)");
    grad.addColorStop(0.5, "rgba(14, 165, 233, 0.3)");
    grad.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x + 16, y + 16 + float, 24, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting cyan sparkles
    const angle = Date.now() * 0.004;
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(
      x + 16 + Math.cos(angle) * 16,
      y + 14 + float + Math.sin(angle) * 8,
      3,
      3
    );
  } else if (customEffect === "allia") {
    // Sweetheart Sparkling Heart Aura for Allia Mikaela
    const heartFloat = Math.sin(Date.now() * 0.004) * 3;
    const heartTime = Date.now() * 0.003;
    const pinkGrad = ctx.createRadialGradient(
      x + 16,
      y + 16,
      4,
      x + 16,
      y + 16,
      20
    );
    pinkGrad.addColorStop(0, "rgba(244, 114, 182, 0.4)");
    pinkGrad.addColorStop(0.6, "rgba(251, 113, 133, 0.12)");
    pinkGrad.addColorStop(1, "rgba(244, 114, 182, 0)");
    ctx.fillStyle = pinkGrad;
    ctx.beginPath();
    ctx.arc(x + 16, y + 16, 20, 0, Math.PI * 2);
    ctx.fill();

    // Floating Pixel Heart Sparkle above Allia
    const hx = x + 16 + Math.cos(heartTime) * 6;
    const hy = y - 4 + heartFloat;
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(hx - 2, hy, 2, 2);
    ctx.fillRect(hx + 1, hy, 2, 2);
    ctx.fillRect(hx - 3, hy + 2, 7, 2);
    ctx.fillRect(hx - 2, hy + 4, 5, 2);
    ctx.fillRect(hx - 1, hy + 6, 3, 2);
    ctx.fillRect(hx, hy + 8, 1, 1);
    ctx.fillStyle = "#ffe4e6";
    ctx.fillRect(hx - 2, hy + 2, 1, 1);
  }

  if (!img) {
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(x + 8, y + 8 + float, 16, 24);
    return;
  }

  const step = isMoving ? frame % 2 : 0;
  let colIndex = 0;

  if (direction === "down") {
    colIndex = isMoving ? 4 + step : 0;
  } else if (direction === "up") {
    colIndex = isMoving ? 6 + step : 1;
  } else {
    colIndex = isMoving ? 8 + step : 2;
  }

  const sx = colIndex * 16;
  const sy = row * 16;
  const sw = 16;
  const sh = 16;
  const dw = 32;
  const dh = 32;
  const destY = y + float;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (direction === "left") {
    ctx.translate(x + dw, destY);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
  } else {
    ctx.drawImage(img, sx, sy, sw, sh, x, destY, dw, dh);
  }

  ctx.restore();
}

// --- REALISTIC 3D SPRITE SHIH TZU: KISSES ---

function drawKissesTheDog(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: "down" | "up" | "left" | "right",
  isMoving: boolean,
  frame: number,
  time: number
) {
  // 1. Soft Oval Ground Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 28, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const isFlipped = direction === "right";
  const stepOffset = isMoving ? (frame % 2 === 0 ? 2.5 : -2.5) : 0;
  const tailWag = Math.sin(time * 0.016) * 4.5;
  const breath = Math.sin(time * 0.006) * 1;
  const earBounce = isMoving ? Math.sin(time * 0.014) * 2.5 : Math.sin(time * 0.005) * 1;

  ctx.save();
  ctx.translate(x + 16, y + 16);
  if (isFlipped) {
    ctx.scale(-1, 1);
  }

  // 2. Shih Tzu Arched Plume Tail (Curling high over the back)
  ctx.fillStyle = "#fae8b6"; // Tail base
  ctx.beginPath();
  ctx.moveTo(-8, 3 + breath);
  ctx.quadraticCurveTo(-18 + tailWag, -10, -10 + tailWag, -12);
  ctx.quadraticCurveTo(-4, -6, -4, 2 + breath);
  ctx.closePath();
  ctx.fill();

  // Fluffy White Feathered Plume Tip
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-12 + tailWag, -14, 7, 6);
  ctx.fillRect(-14 + tailWag, -11, 4, 4);
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(-9 + tailWag, -13, 3, 3);

  // 3. Compact Fluffy Paws & Legs
  ctx.fillStyle = "#e2d1a8"; // Shadow leg
  ctx.fillRect(-7 + stepOffset, 8, 4.5, 6);
  ctx.fillRect(4 - stepOffset, 8, 4.5, 6);
  // White fluffy paw toes
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-7 + stepOffset, 11.5, 4.5, 2.5);
  ctx.fillRect(4 - stepOffset, 11.5, 4.5, 2.5);

  // 4. Soft Cream & Ivory Fur Torso (Fluffy Shih Tzu Body)
  // Deep Fur Shading Under-belly
  ctx.fillStyle = "#e2d1a8";
  ctx.fillRect(-10, 0 + breath, 19, 11);

  // Main Soft Cream Body
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(-9, 0 + breath, 17, 10);

  // Bright Warm Ivory Highlight
  ctx.fillStyle = "#fffbeb";
  ctx.fillRect(-8, 0 + breath, 15, 4);

  // White Fluffy Chest Apron & Belly Fur
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(1, 2 + breath, 8, 8);
  ctx.fillRect(-3, 6 + breath, 7, 4);
  ctx.fillStyle = "#fffbeb";
  ctx.fillRect(2, 4 + breath, 6, 5);

  // 5. Red Leather Collar & Jingling Gold Heart Tag
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(3, -1 + breath, 7, 3);
  // Gold Heart Tag with Specular Glint
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(5, 2 + breath, 3, 3);
  ctx.fillStyle = "#fde047";
  ctx.fillRect(6, 2 + breath, 1.5, 1.5);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(5, 2 + breath, 1, 1);

  // 6. Shih Tzu Head & Muzzle (Cream & White Face)
  // Head Base
  ctx.fillStyle = "#e2d1a8";
  ctx.fillRect(4, -11 + breath, 13, 12);

  // Cream Forehead & Cheeks
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(5, -11 + breath, 11, 11);
  ctx.fillStyle = "#fffbeb"; // Forehead highlight
  ctx.fillRect(6, -11 + breath, 8, 4);

  // Topknot Head Fur & Red Ribbon Bow
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(7, -14 + breath, 6, 4);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(8, -14 + breath, 4, 2);
  // Red/Pink Ribbon Bow
  ctx.fillStyle = "#f43f5e";
  ctx.fillRect(6, -13 + breath, 3, 3);
  ctx.fillRect(11, -13 + breath, 3, 3);
  ctx.fillStyle = "#fb7185";
  ctx.fillRect(8.5, -12.5 + breath, 3, 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(9, -12.5 + breath, 1, 1);

  // Short Snout / Muzzle (White Mustache & Beard)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(11, -6 + breath, 7, 6);
  ctx.fillRect(12, -4 + breath, 5, 4);
  ctx.fillStyle = "#fffbeb";
  ctx.fillRect(10, -5 + breath, 3, 4);

  // Button Nose (Glossy Black with Specular Highlight)
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(15, -7 + breath, 3.5, 3);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(15.5, -7 + breath, 1, 1);

  // Big Sparkling Dark Puppy Eyes
  ctx.fillStyle = "#1e1b4b";
  ctx.fillRect(9, -7 + breath, 3.5, 3.5);
  ctx.fillStyle = "#ffffff"; // Double Specular Highlights
  ctx.fillRect(9.5, -7 + breath, 1.5, 1.5);
  ctx.fillRect(11, -5.5 + breath, 1, 1);

  // 7. Signature Dark Chocolate Drop Ears (Shih Tzu Fluffy Ears)
  // Back / Shadow Ear Layer
  ctx.fillStyle = "#270f03";
  ctx.fillRect(2, -10 + breath + earBounce, 5, 10);
  // Rich Dark Chocolate Brown Ear Fluff
  ctx.fillStyle = "#451a03";
  ctx.fillRect(3, -9 + breath + earBounce, 4, 9);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(4, -8 + breath + earBounce, 2.5, 7);
  // Ear Fringe Highlights
  ctx.fillStyle = "#92400e";
  ctx.fillRect(3, -5 + breath + earBounce, 2, 4);

  // 8. Happy Panting Pink Tongue
  const tonguePant = Math.sin(time * 0.01) > 0;
  if (tonguePant) {
    ctx.fillStyle = "#fb7185";
    ctx.fillRect(14, 0 + breath, 3.5, 3.5);
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(15, 1 + breath, 2, 2.5);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(14.5, 0.5 + breath, 1, 1);
  }

  // 9. Floating Sweetheart Love Sparkles
  const heartFloat = Math.sin(time * 0.004) * 2;
  ctx.fillStyle = "#fb7185";
  ctx.fillRect(5, -18 + heartFloat, 2, 2);
  ctx.fillRect(9, -18 + heartFloat, 2, 2);
  ctx.fillRect(4, -16 + heartFloat, 8, 2);
  ctx.fillRect(5, -14 + heartFloat, 6, 2);
  ctx.fillRect(7, -12 + heartFloat, 2, 2);

  ctx.restore();
}

/**
 * The Guild interior's two static text labels — the fireplace's guild
 * plaque and the exit sign above the south door. Both were dropped when
 * drawProjectsGuildInterior moved into game-interior.ts, because that
 * module only receives PixelCtx (no fillText/font). Restored here on the
 * full context, using the same fillText + backing-rect technique the
 * overworld's NPC nameplates use below (canvas text is fine; it's UI, not
 * the gradient/curve/alpha art the pixel contract restricts). Positions
 * match game-interior.ts's hearth (world 300..400, 0..72) and door
 * (world 310..390, 488..540).
 */
function drawGuildInteriorLabels(ctx: CanvasRenderingContext2D): void {
  // Guild crest plaque, on the chimney breast above the firebox.
  ctx.fillStyle = PAL.gold;
  ctx.fillRect(325, 28, 50, 14);
  ctx.fillStyle = PAL.out;
  ctx.fillRect(327, 30, 46, 10);
  ctx.fillStyle = PAL.goldL;
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.fillText("PROJ GUILD", 350, 38);

  // Exit sign above the south doorway.
  ctx.fillStyle = PAL.roofD;
  ctx.fillRect(295, 466, 110, 16);
  ctx.strokeStyle = PAL.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(295, 466, 110, 16);
  ctx.fillStyle = PAL.goldL;
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillText("▼ EXIT TO TOWN ▼", 350, 477);
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const pt of particles) {
    pt.x += pt.vx;
    pt.y += pt.vy;

    if (pt.x < 0) pt.x = MAP_TOTAL_WIDTH;
    if (pt.y > MAP_TOTAL_HEIGHT) pt.y = 0;

    ctx.fillStyle = pt.color;
    ctx.globalAlpha = pt.alpha;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.globalAlpha = 1.0;
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [discoveredLocations, setDiscoveredLocations] = useState<Set<string>>(new Set());

  const [activeNpc, setActiveNpc] = useState<NPC | null>(null);
  const [activeWorldObject, setActiveWorldObject] = useState<WorldObject | null>(null);
  const [activeModalType, setActiveModalType] = useState<string | null>(null);
  const [interactPrompt, setInteractPrompt] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  // Scene Management (Overworld vs Building Interiors)
  const [currentScene, setCurrentScene] = useState<"overworld" | "projects-guild">("overworld");
  const currentSceneRef = useRef<"overworld" | "projects-guild">("overworld");
  useEffect(() => {
    currentSceneRef.current = currentScene;
  }, [currentScene]);

  // Character Skin Customization
  const [selectedSkinId, setSelectedSkinId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("franze_game_hero_skin");
      if (saved && CHARACTER_SKINS.some((s) => s.id === saved)) {
        return saved;
      }
    }
    return "franze";
  });
  const [isCharacterSelectOpen, setIsCharacterSelectOpen] = useState<boolean>(false);

  const selectedSkinRef = useRef<string>(selectedSkinId);
  useEffect(() => {
    selectedSkinRef.current = selectedSkinId;
  }, [selectedSkinId]);

  const charactersImageRef = useRef<HTMLImageElement | null>(null);
  const terrainCacheRef = useRef<HTMLCanvasElement | null>(null);

  // Player state
  const playerRef = useRef<Player>({
    x: PLAYER_SPAWN_X,
    y: PLAYER_SPAWN_Y,
    width: 24,
    height: 28,
    speed: 3.6,
    direction: "down",
    isMoving: false,
    frame: 0,
    animTimer: 0,
  });

  // Live autonomous NPC states
  const npcLiveStateRef = useRef<Record<string, NpcLiveState>>({});

  const targetDestinationRef = useRef<{ x: number; y: number } | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mobileDirRef = useRef<"up" | "down" | "left" | "right" | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const particlesRef = useRef<Particle[]>([]);
  const leavesRef = useRef<Leaf[]>([]);
  const wasInGrassRef = useRef(false);

  // Initialize live NPC positions & wander anchors
  useEffect(() => {
    NPCS.forEach((npc) => {
      npcLiveStateRef.current[npc.id] = {
        x: npc.x,
        y: npc.y,
        direction: npc.direction,
        isMoving: false,
        frame: 0,
        animTimer: 0,
        targetX: npc.x,
        targetY: npc.y,
        idleTimer: Math.floor(Math.random() * 80) + 40,
      };
    });
  }, []);

  // Load Characters Spritesheet & Initialize BGM
  useEffect(() => {
    retroAudio.initBgm();
    const cImg = new Image();
    cImg.src = "/game/Characters_V3_Colour.png";
    cImg.onload = () => {
      charactersImageRef.current = cImg;
    };
  }, []);

  // Build the static sprite-art terrain once on mount. document.createElement
  // requires a browser environment, so this must run inside an effect, never
  // at module scope where Next.js would also execute it during SSR.
  useEffect(() => {
    terrainCacheRef.current = renderTerrainToCache();
  }, []);

  const handleToggleMute = () => {
    const muted = retroAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen().catch(() => {});
    } else {
      void document.exitFullscreen().catch(() => {});
    }
  };

  // Collision detection
  const isColliding = useCallback((px: number, py: number): boolean => {
    const pLeft = px + 4;
    const pRight = px + 20;
    const pTop = py + 16;
    const pBottom = py + 30;

    // --- 1. PROJECTS GUILD INTERIOR SCENE COLLISION ---
    if (currentSceneRef.current === "projects-guild") {
      // Interior Boundaries (x: 60..640, y: 110..480)
      if (pLeft < 60 || pRight > GUILD_INTERIOR_WIDTH - 60 || pTop < 112) {
        return true;
      }
      if (pBottom > GUILD_INTERIOR_HEIGHT - 60) {
        // Allow stepping into the south exit doorway threshold
        if (pLeft >= 305 && pRight <= 395) {
          return false;
        }
        return true;
      }

      // Grand Stone Fireplace (x: 295..405, y: 38..112)
      if (pRight > 295 && pLeft < 405 && pBottom > 38 && pTop < 112) {
        return true;
      }

      // West Bookshelf (x: 76..164, y: 76..116)
      if (pRight > 76 && pLeft < 164 && pBottom > 76 && pTop < 116) {
        return true;
      }

      // East Drafting Desk (x: 516..604, y: 76..116)
      if (pRight > 516 && pLeft < 604 && pBottom > 76 && pTop < 116) {
        return true;
      }

      // Interactive 3D Project Stations
      for (const st of GUILD_PROJECT_STATIONS) {
        if (
          pRight > st.x - 2 &&
          pLeft < st.x + st.width + 2 &&
          pBottom > st.y + 12 &&
          pTop < st.y + st.height + 4
        ) {
          return true;
        }
      }

      return false;
    }

    // --- 2. OVERWORLD COLLISION ---
    // Bounds
    if (
      pLeft < 24 ||
      pRight > MAP_TOTAL_WIDTH - 24 ||
      pTop < 24 ||
      pBottom > MAP_TOTAL_HEIGHT - 24
    ) {
      return true;
    }

    // World Objects
    for (const obj of WORLD_OBJECTS) {
      const objLeft = obj.x;
      const objRight = obj.x + obj.width;
      const objTop = obj.y;
      const objBottom = obj.y + obj.height;

      if (obj.type === "building" || obj.type === "azra") {
        const doorLeft = objLeft + obj.width / 2 - 18;
        const doorRight = objLeft + obj.width / 2 + 18;
        const isNearDoor = pLeft >= doorLeft && pRight <= doorRight && pTop >= objBottom - 24;
        if (isNearDoor) continue;
      }

      if (
        pRight > objLeft + 4 &&
        pLeft < objRight - 4 &&
        pBottom > objTop + 14 &&
        pTop < objBottom
      ) {
        return true;
      }
    }

    // Tree Trunks (Only collide at base of trunk, player can walk under canopy)
    for (const tree of DECORATIVE_TREES) {
      const trunkLeft = tree.x + tree.w / 2 - 10;
      const trunkRight = tree.x + tree.w / 2 + 10;
      const trunkTop = tree.y + tree.h - 22;
      const trunkBottom = tree.y + tree.h;

      if (
        pRight > trunkLeft &&
        pLeft < trunkRight &&
        pBottom > trunkTop &&
        pTop < trunkBottom
      ) {
        return true;
      }
    }

    // Pathway Fences (Respecting open entrance gaps)
    for (const fence of PATHWAY_FENCES) {
      if (
        pRight > fence.x + 2 &&
        pLeft < fence.x + fence.w - 2 &&
        pBottom > fence.y + 4 &&
        pTop < fence.y + fence.h
      ) {
        return true;
      }
    }

    // Flower Pots & Planters (Solid Obstacle - player cannot phase through flower pots)
    for (const pot of FLOWER_POTS) {
      const potLeft = pot.x;
      const potRight = pot.x + 18;
      const potTop = pot.y + 6;
      const potBottom = pot.y + 22;

      if (
        pRight > potLeft &&
        pLeft < potRight &&
        pBottom > potTop &&
        pTop < potBottom
      ) {
        return true;
      }
    }

    // Decorative Bushes & Shrubs (Solid Obstacle - player cannot phase through bushes)
    for (const bush of DECORATIVE_BUSHES) {
      const bushLeft = bush.x + 2;
      const bushRight = bush.x + 36;
      const bushTop = bush.y + 6;
      const bushBottom = bush.y + 24;

      if (
        pRight > bushLeft &&
        pLeft < bushRight &&
        pBottom > bushTop &&
        pTop < bushBottom
      ) {
        return true;
      }
    }

    // Village Outdoor Furniture (Benches, Tables, Well, Birdbaths, Lamps)
    for (const f of VILLAGE_FURNITURE) {
      const fLeft = f.x;
      const fRight = f.x + f.w;
      const fTop = f.y + (f.h > 24 ? f.h - 16 : 2);
      const fBottom = f.y + f.h;

      if (
        pRight > fLeft &&
        pLeft < fRight &&
        pBottom > fTop &&
        pTop < fBottom
      ) {
        return true;
      }
    }

    // NPCs (Solid Character Collision - player cannot phase through NPCs)
    for (const npc of NPCS) {
      const live = npcLiveStateRef.current[npc.id];
      const nx = live ? live.x : npc.x;
      const ny = live ? live.y : npc.y;
      const nLeft = nx + 4;
      const nRight = nx + 28;
      const nTop = ny + 12;
      const nBottom = ny + 30;

      if (
        pRight > nLeft &&
        pLeft < nRight &&
        pBottom > nTop &&
        pTop < nBottom
      ) {
        return true;
      }
    }

    return false;
  }, []);

  // Nearby interactable lookup
  const getNearbyInteractable = useCallback((): {
    npc?: NPC;
    worldObject?: WorldObject;
    projectStation?: ProjectStation;
    doorTransition?: "enter_projects_guild" | "exit_guild";
    doorName?: string;
  } | null => {
    const p = playerRef.current;
    const centerX = p.x + 12;
    const centerY = p.y + 14;

    // --- 1. PROJECTS GUILD INTERIOR INTERACTIONS ---
    if (currentSceneRef.current === "projects-guild") {
      // Check Exit Door Mat (South Door)
      if (
        Math.hypot(centerX - 350, centerY - 475) < 40 ||
        (p.y >= 455 && p.x >= 300 && p.x <= 400)
      ) {
        return { doorTransition: "exit_guild", doorName: "Exit to Franze Town" };
      }

      // Check Architect Astro at Drafting Desk
      if (Math.hypot(centerX - 566, centerY - 110) < 46) {
        const astroNpc = NPCS.find((n) => n.id === "npc-engineer");
        if (astroNpc) return { npc: astroNpc };
      }

      // Check Project Exhibition Stations
      for (const st of GUILD_PROJECT_STATIONS) {
        const stCenterX = st.x + st.width / 2;
        const stCenterY = st.y + st.height / 2;
        const dist = Math.hypot(centerX - stCenterX, centerY - stCenterY);
        if (dist < 46) {
          return { projectStation: st };
        }
      }
      return null;
    }

    // --- 2. OVERWORLD INTERACTIONS ---
    // Check Projects Guild Entrance Doorway (x: 140, y: 170)
    if (
      Math.hypot(centerX - 140, centerY - 168) < 38 ||
      (p.y <= 174 && p.x >= 122 && p.x <= 158 && p.y >= 152)
    ) {
      return { doorTransition: "enter_projects_guild", doorName: "Projects Showcase Guild" };
    }

    // Check Overworld NPCs
    for (const npc of NPCS) {
      const live = npcLiveStateRef.current[npc.id];
      const npcX = live ? live.x : npc.x;
      const npcY = live ? live.y : npc.y;
      const dist = Math.hypot(centerX - (npcX + 14), centerY - (npcY + 14));
      if (dist < 44) {
        return { npc };
      }
    }

    // Check World Objects
    for (const obj of WORLD_OBJECTS) {
      const nearX = Math.max(obj.x, Math.min(centerX, obj.x + obj.width));
      const nearY = Math.max(obj.y, Math.min(centerY, obj.y + obj.height));
      const dist = Math.hypot(centerX - nearX, centerY - nearY);

      if (dist < 42) {
        return { worldObject: obj };
      }
    }

    return null;
  }, []);

  // Trigger Interaction
  const triggerInteraction = useCallback(() => {
    if (activeNpc || activeWorldObject || activeModalType) return;

    const nearby = getNearbyInteractable();
    if (!nearby) return;

    if (nearby.doorTransition === "enter_projects_guild") {
      retroAudio.playDiscovery();
      setCurrentScene("projects-guild");
      leavesRef.current = []; // overworld-space leaves must not follow indoors
      const p = playerRef.current;
      p.x = 338;
      p.y = 430;
      p.direction = "up";
      p.isMoving = false;
      targetDestinationRef.current = null;
      return;
    }

    if (nearby.doorTransition === "exit_guild") {
      retroAudio.playInteract();
      setCurrentScene("overworld");
      const p = playerRef.current;
      p.x = 128;
      p.y = 182;
      p.direction = "down";
      p.isMoving = false;
      targetDestinationRef.current = null;
      return;
    }

    if (nearby.projectStation) {
      retroAudio.playInteract();
      const modalKey =
        nearby.projectStation.projectIndex >= 0
          ? `project_${nearby.projectStation.projectIndex}`
          : "projects";
      setActiveModalType(modalKey);
      setDiscoveredLocations((prev) => new Set([...prev, nearby.projectStation!.id]));
      return;
    }

    retroAudio.playInteract();

    if (nearby.npc) {
      const live = npcLiveStateRef.current[nearby.npc.id];
      if (live) {
        const p = playerRef.current;
        const dx = p.x - live.x;
        const dy = p.y - live.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          live.direction = dx > 0 ? "right" : "left";
        } else {
          live.direction = dy > 0 ? "down" : "up";
        }
        live.isMoving = false;
      }

      setActiveNpc(nearby.npc);
      setDiscoveredLocations((prev) => new Set([...prev, nearby.npc!.id]));
    } else if (nearby.worldObject) {
      setActiveWorldObject(nearby.worldObject);
      setDiscoveredLocations((prev) => new Set([...prev, nearby.worldObject!.id]));
    }
  }, [activeNpc, activeWorldObject, activeModalType, getNearbyInteractable]);

  // Canvas Click / Tap to Move
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickScreenX = (e.clientX - rect.left) * scaleX;
    const clickScreenY = (e.clientY - rect.top) * scaleY;

    const p = playerRef.current;
    const isInterior = currentSceneRef.current === "projects-guild";
    const currentMapW = isInterior ? GUILD_INTERIOR_WIDTH : MAP_TOTAL_WIDTH;
    const currentMapH = isInterior ? GUILD_INTERIOR_HEIGHT : MAP_TOTAL_HEIGHT;

    const camX = Math.max(
      0,
      Math.min(p.x + p.width / 2 - canvas.width / 2, currentMapW - canvas.width)
    );
    const camY = Math.max(
      0,
      Math.min(p.y + p.height / 2 - canvas.height / 2, currentMapH - canvas.height)
    );

    retroAudio.startBgmOnInteraction();

    const worldClickX = clickScreenX + camX;
    const worldClickY = clickScreenY + camY;

    const distToPlayer = Math.hypot(worldClickX - (p.x + 12), worldClickY - (p.y + 14));
    if (distToPlayer < 36) {
      triggerInteraction();
      return;
    }

    targetDestinationRef.current = { x: worldClickX - 12, y: worldClickY - 14 };
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      retroAudio.startBgmOnInteraction();

      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (isCharacterSelectOpen) {
          setIsCharacterSelectOpen(false);
          return;
        }
        if (activeModalType) setActiveModalType(null);
        if (activeNpc) setActiveNpc(null);
        if (activeWorldObject) setActiveWorldObject(null);
        return;
      }

      if (e.key === "c" || e.key === "C") {
        if (!activeNpc && !activeWorldObject && !activeModalType) {
          e.preventDefault();
          retroAudio.playInteract();
          setIsCharacterSelectOpen((prev) => !prev);
          return;
        }
      }

      if (e.key === " " || e.key === "Enter" || e.key === "e" || e.key === "E") {
        e.preventDefault();
        if (!activeNpc && !activeWorldObject && !activeModalType && !isCharacterSelectOpen) {
          triggerInteraction();
        }
        return;
      }

      if (e.key === "Shift") {
        isRunningRef.current = true;
      }

      keysRef.current[e.key.toLowerCase()] = true;
      targetDestinationRef.current = null;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        isRunningRef.current = false;
      }
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeNpc, activeWorldObject, activeModalType, isCharacterSelectOpen, triggerInteraction]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    particlesRef.current = Array.from({ length: 24 }).map(() => ({
      x: Math.random() * MAP_TOTAL_WIDTH,
      y: Math.random() * MAP_TOTAL_HEIGHT,
      vx: -0.5 - Math.random() * 0.5,
      vy: 0.3 + Math.random() * 0.4,
      size: 3 + Math.random() * 3,
      color: Math.random() > 0.5 ? "#fde047" : "#86efac",
      alpha: 0.4 + Math.random() * 0.4,
    }));

    const render = () => {
      const time = Date.now();
      const p = playerRef.current;
      const keys = keysRef.current;
      const mobileDir = mobileDirRef.current;
      const targetDest = targetDestinationRef.current;
      const isPaused = Boolean(activeNpc || activeWorldObject || activeModalType);
      const isInterior = currentSceneRef.current === "projects-guild";

      // --- 1. PLAYER MOVEMENT UPDATE ---
      let dx = 0;
      let dy = 0;

      if (!isPaused) {
        if (keys["w"] || keys["arrowup"] || mobileDir === "up") {
          dy -= 1;
          p.direction = "up";
        }
        if (keys["s"] || keys["arrowdown"] || mobileDir === "down") {
          dy += 1;
          p.direction = "down";
        }
        if (keys["a"] || keys["arrowleft"] || mobileDir === "left") {
          dx -= 1;
          p.direction = "left";
        }
        if (keys["d"] || keys["arrowright"] || mobileDir === "right") {
          dx += 1;
          p.direction = "right";
        }

        if (targetDest && dx === 0 && dy === 0) {
          const distX = targetDest.x - p.x;
          const distY = targetDest.y - p.y;
          const dist = Math.hypot(distX, distY);

          if (dist > 6) {
            dx = distX / dist;
            dy = distY / dist;
            if (Math.abs(distX) > Math.abs(distY)) {
              p.direction = distX > 0 ? "right" : "left";
            } else {
              p.direction = distY > 0 ? "down" : "up";
            }
          } else {
            targetDestinationRef.current = null;
          }
        }
      }

      const speed = isRunningRef.current ? 5.5 : 3.4;
      p.isMoving = dx !== 0 || dy !== 0;

      if (p.isMoving) {
        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        const nextX = p.x + dx * speed;
        const nextY = p.y + dy * speed;

        if (!isColliding(nextX, p.y)) {
          p.x = nextX;
        }
        if (!isColliding(p.x, nextY)) {
          p.y = nextY;
        }

        // Automatic seamless door triggers when stepping across door thresholds
        if (isInterior) {
          if (p.y >= 485 && p.x >= 305 && p.x <= 395) {
            retroAudio.playInteract();
            setCurrentScene("overworld");
            p.x = 128;
            p.y = 182;
            p.direction = "down";
            p.isMoving = false;
            targetDestinationRef.current = null;
          }
        } else {
          // Stepping into Projects Guild Front Door
          if (p.y <= 165 && p.x >= 122 && p.x <= 158 && p.y >= 150) {
            retroAudio.playDiscovery();
            setCurrentScene("projects-guild");
            leavesRef.current = []; // overworld-space leaves must not follow indoors
            p.x = 338;
            p.y = 430;
            p.direction = "up";
            p.isMoving = false;
            targetDestinationRef.current = null;
          }
        }

        p.animTimer += 1;
        if (p.animTimer % 7 === 0) {
          p.frame = (p.frame + 1) % 4;
          if (p.frame % 2 === 0) {
            retroAudio.playStep();
          }
        }
      } else {
        p.frame = 0;
      }

      // --- 1b. TALL GRASS ENTRY DETECTION & RUSTLE FEEDBACK ---
      if (!isInterior) {
        const inGrass = isInTallGrass(p.x + 12, p.y + 20);
        if (inGrass && !wasInGrassRef.current) {
          retroAudio.playRustle();
          leavesRef.current.push(...spawnLeaves(p.x + 12, p.y + 24));
        }
        wasInGrassRef.current = inGrass;
      }

      // Age leaf-burst particles and drop expired ones (own short-lived
      // array — the 24-particle ambient pool below wraps forever).
      leavesRef.current = leavesRef.current.filter((l) => {
        l.life -= 1;
        l.x += l.vx;
        l.y += l.vy;
        l.vy += 0.03;
        return l.life > 0;
      });

      // --- 2. AUTONOMOUS NPC WANDERING AI (Overworld only) ---
      if (!isInterior) {
        NPCS.forEach((npc) => {
          const live = npcLiveStateRef.current[npc.id];
          if (!live || activeNpc?.id === npc.id) return;

          if (live.isMoving) {
            const ndx = live.targetX - live.x;
            const ndy = live.targetY - live.y;
            const dist = Math.hypot(ndx, ndy);

            if (dist > 2) {
              const moveSpeed = 1.0;
              const nextNx = live.x + (ndx / dist) * moveSpeed;
              const nextNy = live.y + (ndy / dist) * moveSpeed;

              // Prevent NPC from phasing into the player
              const p = playerRef.current;
              const distToPlayer = Math.hypot(
                nextNx + 14 - (p.x + 12),
                nextNy + 16 - (p.y + 14)
              );

              if (distToPlayer > 26) {
                live.x = nextNx;
                live.y = nextNy;
              } else {
                live.isMoving = false;
                live.frame = 0;
                live.idleTimer = Math.floor(Math.random() * 80) + 40;
              }

              if (Math.abs(ndx) > Math.abs(ndy)) {
                live.direction = ndx > 0 ? "right" : "left";
              } else {
                live.direction = ndy > 0 ? "down" : "up";
              }

              live.animTimer += 1;
              if (live.animTimer % 8 === 0) {
                live.frame = (live.frame + 1) % 4;
              }
            } else {
              live.isMoving = false;
              live.frame = 0;
              live.idleTimer = Math.floor(Math.random() * 120) + 60;
            }
          } else {
            live.idleTimer -= 1;
            if (live.idleTimer <= 0 && npc.wanderRadius > 0) {
              const angle = Math.random() * Math.PI * 2;
              const r = Math.random() * npc.wanderRadius;
              live.targetX = npc.anchorX + Math.cos(angle) * r;
              live.targetY = npc.anchorY + Math.sin(angle) * r;
              live.isMoving = true;
            }
          }
        });
      }

      // --- 3. FLOATING PROMPT LOOKUP ---
      const nearby = getNearbyInteractable();
      if (nearby && !isPaused) {
        if (nearby.doorTransition) {
          setInteractPrompt({
            text: `[SPACE / E] ${nearby.doorName}`,
            x: p.x + 12,
            y: p.y - 12,
          });
        } else if (nearby.projectStation) {
          setInteractPrompt({
            text: `[SPACE / E] Inspect ${nearby.projectStation.shortTitle}`,
            x: nearby.projectStation.x + nearby.projectStation.width / 2,
            y: nearby.projectStation.y - 14,
          });
        } else if (nearby.npc) {
          const live = npcLiveStateRef.current[nearby.npc.id];
          const nx = live ? live.x : nearby.npc.x;
          const ny = live ? live.y : nearby.npc.y;
          setInteractPrompt({
            text: `[SPACE / E] Talk to ${nearby.npc.name}`,
            x: nx + 14,
            y: ny - 12,
          });
        } else if (nearby.worldObject) {
          setInteractPrompt({
            text: `[SPACE / E] Inspect ${nearby.worldObject.name}`,
            x: nearby.worldObject.x + nearby.worldObject.width / 2,
            y: nearby.worldObject.y - 10,
          });
        }
      } else {
        setInteractPrompt(null);
      }

      // --- 4. VIEWPORT CAMERA TRACKING ---
      const viewWidth = canvas.width;
      const viewHeight = canvas.height;
      const currentMapW = isInterior ? GUILD_INTERIOR_WIDTH : MAP_TOTAL_WIDTH;
      const currentMapH = isInterior ? GUILD_INTERIOR_HEIGHT : MAP_TOTAL_HEIGHT;

      const camX = Math.max(
        0,
        Math.min(p.x + p.width / 2 - viewWidth / 2, currentMapW - viewWidth)
      );
      const camY = Math.max(
        0,
        Math.min(p.y + p.height / 2 - viewHeight / 2, currentMapH - viewHeight)
      );

      // Baseline for the player: the world y of their feet, where they
      // visually "touch the ground". Used as this frame's y-sort key in the
      // overworld's scene layer below (and, for the interior branch, drawn
      // standalone since that scene is a separate, unsorted branch).
      const playerFeetY = p.y + 28;

      ctx.save();
      ctx.clearRect(0, 0, viewWidth, viewHeight);
      ctx.translate(-camX, -camY);

      // Player Character (Selected Custom Skin) — resolved up front so both
      // branches below can draw the player at the right moment.
      const currentSkin =
        CHARACTER_SKINS.find((s) => s.id === selectedSkinRef.current) ||
        CHARACTER_SKINS[0];
      const drawPlayer = () => {
        if (currentSkin.spriteType === "dog") {
          drawKissesTheDog(ctx, p.x, p.y, p.direction, p.isMoving, p.frame, time);
        } else {
          drawSpritesheetCharacter(
            ctx,
            charactersImageRef.current,
            currentSkin.spriteRow,
            p.x,
            p.y,
            p.direction,
            p.isMoving,
            p.frame,
            currentSkin.customEffect || "none"
          );
        }
      };

      if (isInterior) {
        // Render Projects Guild Interior Scene — a separate, unsorted
        // branch (Task 16 is render-order only for the overworld). Still
        // not y-sorted with the player after this task's conversion: the
        // player is always drawn last here, so it always renders in front
        // of the hearth, bookshelf, desk and every pedestal regardless of
        // where the player actually stands (unlike the overworld below,
        // which now sorts by baseline). Flagged, not fixed, per Task 12.
        drawGuildInterior(ctx, time, charactersImageRef.current);
        // The hearth plaque and exit sign: canvas text, restored here
        // because game-interior.ts only has PixelCtx (no fillText/font).
        drawGuildInteriorLabels(ctx);
        // Architect Astro stands fixed at the drafting desk. This needs
        // drawImage, which PixelCtx (and so game-interior.ts) deliberately
        // doesn't expose, so it stays here rather than in the sprite-art
        // module. Position matches game-interior.ts's desk art (logical
        // 260,41 = world 520,82) and the fixed hit-test radius around
        // (566,110) in getNearbyInteractable below.
        const astroDeskX = 520;
        const astroDeskY = 82;
        drawSpritesheetCharacter(
          ctx, charactersImageRef.current, 0, astroDeskX + 26, astroDeskY + 18,
          "down", false, 0, "none"
        );
        // Astro's nameplate, matching the overworld NPC nameplate style
        // (rgba backing + fillText) rather than the generic per-NPC block
        // below, since this is a fixed guild-only render, not a live NPC.
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(astroDeskX + 42 - 46, astroDeskY + 6, 92, 12);
        ctx.fillStyle = PAL.arcane;
        ctx.font = "bold 7.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Architect Astro 🛠️", astroDeskX + 42, astroDeskY + 15);
        drawPlayer();
      } else {
        // Render Overworld Scene
        // 1. Ground band — always beneath everything else, unsorted: the
        // cached terrain, tall-grass clump bases and the court surface are
        // flat on the ground, so nothing should ever draw beneath them. The
        // hoop is a standing object, not ground texture, so it lives in the
        // sorted layer below instead (collectBasketballHoop).
        if (terrainCacheRef.current) {
          drawTerrain(ctx, terrainCacheRef.current);
        }
        drawTallGrassBases(ctx);
        drawBasketballCourt(ctx, time);

        // 2. Sorted layer — every entity with a footprint that can occlude
        // or be occluded (fences, pots, bushes, furniture, statues,
        // banners, buildings, the fountain, trees, NPCs, tall-grass tufts
        // and the player) is collected as a Drawable keyed by baseline —
        // the world y where it touches the ground — then painted back to
        // front. This is what fixes the player always drawing in front of
        // buildings (they used to be two fixed, unconditionally-ordered
        // draw passes), and folds the old two-call tall-grass depth split
        // into the same mechanism: each tuft now carries its own baseline
        // instead of the caller splitting one band into "before" and
        // "after" the player.
        //
        // Built in a fixed order every frame (NPCS is an array; BUILDINGS'
        // Object.values preserves its static insertion order) so that any
        // two entities with equal baselines keep a stable relative order
        // across frames instead of flickering.
        const npcDrawables: Drawable[] = NPCS.map((npc) => {
          const live = npcLiveStateRef.current[npc.id];
          const nx = live ? live.x : npc.x;
          const ny = live ? live.y : npc.y;
          const dir = live ? live.direction : npc.direction;
          const isMoving = live ? live.isMoving : false;
          const frame = live ? live.frame : 0;

          return {
            baseline: ny + 28,
            draw: () => {
              if (npc.spriteType === "dog") {
                drawKissesTheDog(ctx, nx, ny, dir, isMoving, frame, time);
              } else {
                drawSpritesheetCharacter(
                  ctx,
                  charactersImageRef.current,
                  npc.spriteRow,
                  nx,
                  ny,
                  dir,
                  isMoving,
                  frame,
                  npc.spriteType === "azra"
                    ? "azra"
                    : npc.spriteType === "sweetheart"
                    ? "allia"
                    : "none"
                );
              }

              const nameTagW = Math.max(56, npc.nameTag.length * 6.5 + 14);
              ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
              ctx.fillRect(nx + 16 - nameTagW / 2, ny - 10, nameTagW, 13);
              if (npc.spriteType === "azra") {
                ctx.fillStyle = "#38bdf8";
              } else if (npc.spriteType === "sweetheart") {
                ctx.fillStyle = "#fb7185";
              } else if (npc.spriteType === "dog") {
                ctx.fillStyle = "#fde047";
              } else {
                ctx.fillStyle = "#ffffff";
              }
              ctx.font = "bold 8px monospace";
              ctx.textAlign = "center";
              ctx.fillText(npc.nameTag, nx + 16, ny - 1);
            },
          };
        });

        const sceneDrawables: Drawable[] = [
          ...collectFences(ctx, time),
          ...collectFlowerPots(ctx, time),
          ...collectBushes(ctx, time),
          ...collectFurniture(ctx, time),
          ...collectStatues(ctx, time),
          ...collectBanners(ctx, time),
          ...collectBuildings(ctx, time),
          { baseline: FOUNTAIN_BASELINE, draw: () => drawCentralFountain(ctx, time) },
          ...collectBasketballHoop(ctx, time),
          ...collectTrees(ctx, time),
          ...npcDrawables,
          ...collectTallGrassTips(ctx, time),
          { baseline: playerFeetY, draw: drawPlayer },
        ];

        sortByBaseline(sceneDrawables).forEach((d) => d.draw());
      }

      // Leaf burst on grass entry — drawn above the sorted scene layer, own
      // short-lived array, culled above. Overworld only: leaves are stored
      // in overworld world-space, so they must not be drawn over an
      // interior scene (the ref itself is cleared on the
      // overworld->interior transition; this guard also covers the ~0.4s
      // window where a burst could still be aging).
      if (!isInterior) {
        for (const leaf of leavesRef.current) {
          ctx.fillStyle = leaf.color;
          ctx.globalAlpha = Math.max(0, leaf.life / leaf.maxLife);
          ctx.fillRect(leaf.x, leaf.y, 3, 3);
        }
        ctx.globalAlpha = 1.0;
      }

      // Ambient Floating Particles — overlay, always on top.
      drawParticles(ctx, particlesRef.current);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    isColliding,
    getNearbyInteractable,
    activeNpc,
    activeWorldObject,
    activeModalType,
    selectedSkinId,
    currentScene,
  ]);

  // Responsive Canvas Sizing
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const width = containerRef.current.clientWidth;
      canvasRef.current.width = Math.min(width, 960);
      canvasRef.current.height = Math.min(window.innerHeight * 0.68, 560);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeSkin = CHARACTER_SKINS.find((s) => s.id === selectedSkinId) || CHARACTER_SKINS[0];

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center select-none">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border-4 border-foreground bg-slate-950 shadow-[0_16px_50px_rgba(0,0,0,0.5)]"
        style={{
          boxShadow: "8px 8px 0px 0px rgba(0,0,0,0.85)",
        }}
      >
        {/* Top Game Bar */}
        <div className="flex items-center justify-between border-b-2 border-foreground bg-foreground px-3 py-1.5 font-mono text-xs font-bold text-background">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${currentScene === "projects-guild" ? "bg-amber-400" : "bg-red-500"} animate-pulse`} />
            <span className="tracking-wider uppercase">
              {currentScene === "projects-guild"
                ? "PROJECTS GUILD // EXHIBITION HALL"
                : "FRANZE TOWN // DEV OVERWORLD"}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
            <div className="hidden lg:flex items-center gap-1.5 text-amber-300">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                DISCOVERED: {discoveredLocations.size} / {WORLD_OBJECTS.length + NPCS.length + GUILD_PROJECT_STATIONS.length}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1 text-emerald-300">
              <MousePointer className="h-3.5 w-3.5" />
              <span>CLICK TO WALK</span>
            </div>

            {/* Change Character Appearance Button */}
            <button
              onClick={() => {
                retroAudio.playInteract();
                setIsCharacterSelectOpen(true);
              }}
              className="flex items-center gap-1.5 rounded border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-amber-300 hover:bg-amber-500/35 hover:border-amber-400 active:scale-95 transition-all cursor-pointer shadow-sm"
              title="Change Character Appearance (Press C)"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">SKIN: {activeSkin.name.toUpperCase()}</span>
              <span className="sm:hidden">{activeSkin.iconEmoji}</span>
            </button>

            <button
              onClick={handleToggleMute}
              className="flex items-center gap-1.5 rounded border border-background/20 bg-background/10 px-2 py-0.5 hover:bg-background/25 active:scale-95 transition-all cursor-pointer"
              title="Toggle Background Music & Sound Effects"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />}
              <span className="hidden sm:inline">{isMuted ? "SOUND OFF" : "BGM & SFX"}</span>
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="hidden sm:flex items-center gap-1 rounded px-2 py-0.5 hover:bg-background/20 cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* HTML5 Game Canvas */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="block h-auto w-full cursor-pointer bg-emerald-950"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Floating Interaction Prompt */}
        {interactPrompt && !activeNpc && !activeWorldObject && !activeModalType && !isCharacterSelectOpen && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded border-2 border-foreground bg-foreground/95 px-3 py-1 font-mono text-xs font-bold text-background shadow-lg animate-bounce">
            {interactPrompt.text}
          </div>
        )}

        {/* Active Dialogue Box */}
        {(activeNpc || activeWorldObject) && !isCharacterSelectOpen && (
          <GameDialogue
            npc={activeNpc}
            worldObject={activeWorldObject}
            onClose={() => {
              setActiveNpc(null);
              setActiveWorldObject(null);
            }}
            onOpenModal={(type) => setActiveModalType(type)}
          />
        )}

        {/* Active Full Inspect Modal */}
        {activeModalType && !isCharacterSelectOpen && (
          <GameModal
            type={activeModalType}
            onClose={() => setActiveModalType(null)}
          />
        )}

        {/* Character Skin Select Modal */}
        {isCharacterSelectOpen && (
          <GameCharacterSelect
            currentSkinId={selectedSkinId}
            onSelectSkin={(skinId) => {
              setSelectedSkinId(skinId);
              if (typeof window !== "undefined") {
                localStorage.setItem("franze_game_hero_skin", skinId);
              }
              setIsCharacterSelectOpen(false);
            }}
            onClose={() => setIsCharacterSelectOpen(false)}
          />
        )}
      </div>

      {/* Mobile Controls */}
      <GameControls
        onDirectionChange={(dir) => {
          mobileDirRef.current = dir;
          targetDestinationRef.current = null;
        }}
        onInteract={triggerInteraction}
        onRunToggle={(running) => {
          isRunningRef.current = running;
        }}
        onChangeSkin={() => setIsCharacterSelectOpen(true)}
        isInteractingDisabled={Boolean(activeNpc || activeWorldObject || activeModalType || isCharacterSelectOpen)}
      />
    </div>
  );
}
