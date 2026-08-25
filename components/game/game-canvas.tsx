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
} from "./game-data";
import { retroAudio } from "./game-audio";
import GameDialogue from "./game-dialogue";
import GameModal from "./game-modals";
import GameControls from "./game-controls";
import { Volume2, VolumeX, Maximize2, MapPin, MousePointer } from "lucide-react";

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

// Multi-species big trees (Grand Oak, Pine, Autumn Maple, Sakura)
const DECORATIVE_TREES = [
  { x: 860, y: 110, w: 64, h: 80, type: "grand_oak" as const },
  { x: 900, y: 220, w: 48, h: 78, type: "pine" as const },
  { x: 850, y: 310, w: 58, h: 74, type: "maple" as const },
  { x: 890, y: 440, w: 58, h: 74, type: "sakura" as const },
  { x: 840, y: 550, w: 64, h: 80, type: "grand_oak" as const },
  { x: 230, y: 140, w: 58, h: 74, type: "sakura" as const },
  { x: 15, y: 410, w: 48, h: 78, type: "pine" as const },
];

// Flower pot positions (strictly inside grass fields and garden pens)
const FLOWER_POTS = [
  // 1. Right Side Fenced Garden Pen (Safely below Career Archives building at y: 275..343)
  { x: 810, y: 288, type: "rose" as const },
  { x: 844, y: 288, type: "sunflower" as const },
  { x: 810, y: 318, type: "lily" as const },
  { x: 844, y: 318, type: "orchid" as const },

  // 2. North-West Projects Fenced Garden Pen (Shifted into dedicated left garden pen)
  { x: 68, y: 56, type: "sunflower" as const },
  { x: 96, y: 56, type: "rose" as const },
  { x: 68, y: 84, type: "orchid" as const },
  { x: 96, y: 84, type: "lily" as const },

  // 3. Central Plaza Garden Planter Pots (Planted neatly beside the avenue)
  { x: 305, y: 280, type: "rose" as const },
  { x: 650, y: 280, type: "orchid" as const },
];

// Multi-species bushes (Berry Bush, Flowering Hedge, Wild Shrub)
const DECORATIVE_BUSHES = [
  { x: 895, y: 270, type: "berry_bush" as const, berry: "#ef4444" },
  { x: 830, y: 370, type: "berry_bush" as const, berry: "#38bdf8" },
  { x: 880, y: 530, type: "flowering_hedge" as const, berry: "#f472b6" },
  { x: 780, y: 480, type: "flowering_hedge" as const, berry: "#ffffff" },
  { x: 50, y: 130, type: "wild_shrub" as const, berry: "#facc15" },
  { x: 330, y: 60, type: "berry_bush" as const, berry: "#facc15" },
  { x: 50, y: 530, type: "wild_shrub" as const, berry: "#ef4444" },
  { x: 490, y: 540, type: "flowering_hedge" as const, berry: "#38bdf8" },
];

// Rich 3D Village Outdoor Furniture
export interface VillageFurniture {
  id: string;
  type: "bench" | "chess_table" | "wishing_well" | "birdbath" | "streetlamp" | "barrel_stack";
  x: number;
  y: number;
  w: number;
  h: number;
}

const VILLAGE_FURNITURE: VillageFurniture[] = [
  // 1. Cozy Park Benches (Oak Slats + Cast Iron Scrollwork)
  { id: "bench-nw", type: "bench", x: 195, y: 55, w: 42, h: 24 },
  { id: "bench-plaza-left", type: "bench", x: 260, y: 345, w: 42, h: 24 },
  { id: "bench-plaza-right", type: "bench", x: 650, y: 345, w: 42, h: 24 },
  { id: "bench-sw", type: "bench", x: 220, y: 630, w: 42, h: 24 },
  { id: "bench-se", type: "bench", x: 500, y: 610, w: 42, h: 24 },

  // 2. Carved Stone Chess / Picnic Tables with Stools
  { id: "chess-nw", type: "chess_table", x: 280, y: 145, w: 46, h: 32 },
  { id: "chess-east", type: "chess_table", x: 840, y: 435, w: 46, h: 32 },

  // 3. Ancient Village Wishing Well (North-East Grove near Sanctuary)
  { id: "well-ne", type: "wishing_well", x: 725, y: 70, w: 50, h: 56 },

  // 4. Carved Limestone Birdbaths with Bluebird
  { id: "birdbath-left", type: "birdbath", x: 240, y: 475, w: 30, h: 30 },
  { id: "birdbath-right", type: "birdbath", x: 700, y: 330, w: 30, h: 30 },

  // 5. Classic Wrought Iron Streetlamps (Warm Glowing Lanterns)
  { id: "lamp-nw", type: "streetlamp", x: 335, y: 190, w: 22, h: 48 },
  { id: "lamp-ne", type: "streetlamp", x: 625, y: 190, w: 22, h: 48 },
  { id: "lamp-sw", type: "streetlamp", x: 335, y: 450, w: 22, h: 48 },
  { id: "lamp-se", type: "streetlamp", x: 625, y: 450, w: 22, h: 48 },

  // 6. Rustic Harvest Oak Barrels & Fruit Crates
  { id: "barrels-sw", type: "barrel_stack", x: 275, y: 545, w: 40, h: 30 },
  { id: "barrels-se", type: "barrel_stack", x: 870, y: 595, w: 40, h: 30 },
];

// Pathway & Garden Fences with Dedicated Entrance Openings
const PATHWAY_FENCES = [
  // 1. North-West Projects Border Fences (leaves x: 106..194 open for entrance)
  { x: 60, y: 170, w: 46, h: 18 },
  { x: 194, y: 170, w: 120, h: 18 },

  // 2. North-East AI Sanctuary Border Fences (leaves x: 546..660 open for entrance)
  { x: 470, y: 150, w: 76, h: 18 },
  { x: 700, y: 150, w: 45, h: 18 },

  // 3. South-West Academy Dojo Border Fences (leaves x: 116..200 open for entrance)
  { x: 60, y: 480, w: 56, h: 18 },
  { x: 200, y: 480, w: 136, h: 18 },

  // 4. South-East Gamer Cottage Border Fences (leaves x: 586..664 open for entrance)
  { x: 470, y: 470, w: 116, h: 18 },
  { x: 750, y: 470, w: 80, h: 18 },

  // 5. East Forest Grove Border Fences (leaves y: 340..370 open for entrance)
  { x: 900, y: 260, w: 18, h: 80 },
  { x: 900, y: 370, w: 18, h: 90 },

  // 6. Enclosed Garden Pens
  { x: 800, y: 275, w: 68, h: 68 },
  { x: 58, y: 46, w: 58, h: 62 },
];

// Pathway bounding boxes to ensure flowers only grow on genuine grass
const PATH_AREAS = [
  { x: 340, y: 300, w: 160, h: 160 }, // Central Plaza
  { x: 370, y: 440, w: 90, h: 280 },  // South Entrance
  { x: 375, y: 140, w: 80, h: 170 },  // North Trail to Village Post
  { x: 110, y: 150, w: 80, h: 120 },  // NW Trail
  { x: 110, y: 240, w: 260, h: 80 },  // West Trail
  { x: 470, y: 150, w: 100, h: 160 }, // NE Trail
  { x: 550, y: 150, w: 150, h: 80 },  // East Trail to Sanctuary
  { x: 690, y: 160, w: 90, h: 70 },   // East Trail to Career Archives
  { x: 120, y: 480, w: 270, h: 70 },  // SW Trail
  { x: 120, y: 530, w: 80, h: 120 },  // SW Trail to Dojo
  { x: 440, y: 470, w: 260, h: 70 },  // SE Trail
  { x: 560, y: 520, w: 120, h: 140 }, // SE Trail to Cottage
  { x: 660, y: 470, w: 160, h: 60 },  // Trail to Court
  { x: 730, y: 535, w: 90, h: 100 },  // Basketball Court
];

function isInsidePathOrBuilding(x: number, y: number): boolean {
  for (const pa of PATH_AREAS) {
    if (x + 28 >= pa.x && x <= pa.x + pa.w + 4 && y + 28 >= pa.y && y <= pa.y + pa.h + 4) {
      return true;
    }
  }
  for (const obj of WORLD_OBJECTS) {
    if (x + 32 >= obj.x && x <= obj.x + obj.width + 8 && y + 32 >= obj.y && y <= obj.y + obj.height + 8) {
      return true;
    }
  }
  return false;
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

// --- RICH POKÉMON STRIPED TERRAIN & REALISTIC 3D COBBLESTONE PATHWAYS ---

function drawOrganicGround(ctx: CanvasRenderingContext2D) {
  const tileSize = 32;
  const cols = Math.ceil(MAP_TOTAL_WIDTH / tileSize);
  const rows = Math.ceil(MAP_TOTAL_HEIGHT / tileSize);

  // 1. POKÉMON STRIPED LAWN WITH RICH MULTI-TONE PIXEL BLADES
  for (let c = 0; c < cols; c++) {
    const isStripeLight = c % 2 === 0;
    const baseGreen = isStripeLight ? "#6ec957" : "#54b23f";
    const darkAccent = isStripeLight ? "#5ab545" : "#449c32";
    const lightHighlight = isStripeLight ? "#8cee73" : "#68be51";
    const sunlitGlint = isStripeLight ? "#bef264" : "#78cf42";
    const deepShadow = isStripeLight ? "#368026" : "#22541d";

    for (let r = 0; r < rows; r++) {
      const x = c * tileSize;
      const y = r * tileSize;
      const isPerimeter = c === 0 || r === 0 || c === cols - 1 || r === rows - 1;

      if (isPerimeter) {
        ctx.fillStyle = "#14491e";
        ctx.fillRect(x, y, tileSize, tileSize);
        ctx.fillStyle = "#1e6b30";
        ctx.fillRect(x + 3, y + 3, tileSize - 6, tileSize - 6);
        ctx.fillStyle = "#28873d";
        ctx.fillRect(x + 7, y + 7, tileSize - 14, tileSize - 14);
      } else {
        // Base grass lawn fill
        ctx.fillStyle = baseGreen;
        ctx.fillRect(x, y, tileSize, tileSize);

        // Horizontal mowing stripe
        ctx.fillStyle = darkAccent;
        ctx.fillRect(x, y + 14, tileSize, 3);
        ctx.fillRect(x, y + 28, tileSize, 2);

        // Multi-tone 3D pixel grass blade clusters
        // Clump 1 (Top-Left)
        ctx.fillStyle = deepShadow;
        ctx.fillRect(x + 5, y + 9, 4, 2);
        ctx.fillStyle = lightHighlight;
        ctx.fillRect(x + 4, y + 4, 2, 5);
        ctx.fillRect(x + 7, y + 2, 2, 7);
        ctx.fillStyle = sunlitGlint;
        ctx.fillRect(x + 5, y + 3, 1, 2);
        ctx.fillRect(x + 8, y + 1, 1, 2);

        // Clump 2 (Bottom-Right)
        ctx.fillStyle = deepShadow;
        ctx.fillRect(x + 19, y + 24, 4, 2);
        ctx.fillStyle = lightHighlight;
        ctx.fillRect(x + 18, y + 18, 2, 6);
        ctx.fillRect(x + 21, y + 16, 2, 8);
        ctx.fillStyle = sunlitGlint;
        ctx.fillRect(x + 19, y + 17, 1, 2);
        ctx.fillRect(x + 22, y + 15, 1, 2);

        // Clump 3 (Mid Accent)
        if ((c + r) % 3 === 0) {
          ctx.fillStyle = lightHighlight;
          ctx.fillRect(x + 13, y + 10, 2, 4);
          ctx.fillStyle = sunlitGlint;
          ctx.fillRect(x + 14, y + 9, 1, 2);
        }

        // Flowers, Clovers & Dandelions ONLY inside actual grass fields
        if (!isInsidePathOrBuilding(x, y)) {
          const hash = (c * 59 + r * 83) % 31;
          if (hash === 1) {
            // Yellow Buttercups with calyx stem
            ctx.fillStyle = "#15803d";
            ctx.fillRect(x + 10, y + 13, 2, 3);
            ctx.fillStyle = "#fde047";
            ctx.fillRect(x + 8, y + 8, 6, 6);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x + 10, y + 10, 2, 2);
            ctx.fillStyle = "#eab308";
            ctx.fillRect(x + 9, y + 9, 1, 1);
          } else if (hash === 2) {
            // Red Rosebuds with stem
            ctx.fillStyle = "#15803d";
            ctx.fillRect(x + 22, y + 17, 2, 3);
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(x + 20, y + 12, 6, 6);
            ctx.fillStyle = "#fca5a5";
            ctx.fillRect(x + 21, y + 13, 2, 2);
            ctx.fillStyle = "#991b1b";
            ctx.fillRect(x + 23, y + 15, 2, 2);
          } else if (hash === 3) {
            // Blue Oran Flowers
            ctx.fillStyle = "#15803d";
            ctx.fillRect(x + 14, y + 25, 2, 3);
            ctx.fillStyle = "#38bdf8";
            ctx.fillRect(x + 12, y + 20, 6, 6);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x + 14, y + 22, 2, 2);
          } else if (hash === 4) {
            // 4-leaf lucky clover
            ctx.fillStyle = "#16a34a";
            ctx.fillRect(x + 16, y + 8, 7, 7);
            ctx.fillStyle = "#4ade80";
            ctx.fillRect(x + 17, y + 9, 2, 2);
            ctx.fillRect(x + 20, y + 9, 2, 2);
            ctx.fillRect(x + 17, y + 12, 2, 2);
            ctx.fillRect(x + 20, y + 12, 2, 2);
            ctx.fillStyle = "#15803d";
            ctx.fillRect(x + 19, y + 11, 1, 1);
          } else if (hash === 5) {
            // White Clover Blossom Puff
            ctx.fillStyle = "#15803d";
            ctx.fillRect(x + 8, y + 26, 2, 3);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x + 6, y + 21, 6, 6);
            ctx.fillStyle = "#fef08a";
            ctx.fillRect(x + 8, y + 23, 2, 2);
          } else if (hash === 6) {
            // Wild Purple Violet
            ctx.fillStyle = "#c084fc";
            ctx.fillRect(x + 24, y + 6, 5, 5);
            ctx.fillStyle = "#fef08a";
            ctx.fillRect(x + 26, y + 8, 2, 2);
          }
        }
      }
    }
  }

  // 2. ORGANIC WINDING COBBLESTONE & SAND PATHWAYS
  ctx.fillStyle = "#f5eed4";

  // Branch 1: South-to-Center Main Plaza Avenue
  ctx.fillRect(340, 300, 160, 160);
  ctx.fillRect(370, 440, 90, 280);
  ctx.fillRect(375, 140, 80, 170); // North Trail to Village Post

  // Branch 2: North-West Trail to Projects Showcase Guild
  ctx.fillRect(110, 150, 80, 120);
  ctx.fillRect(110, 240, 260, 80);

  // Branch 3: North-East Trail meandering to AZRA's AI Sanctuary & Career Archives
  ctx.fillRect(470, 150, 100, 160);
  ctx.fillRect(550, 150, 150, 80);
  ctx.fillRect(690, 160, 90, 70); // East Trail to Career Archives

  // Branch 4: South-West Trail to Academy of Enverga Dojo
  ctx.fillRect(120, 480, 270, 70);
  ctx.fillRect(120, 530, 80, 120);

  // Branch 5: South-East Trail to Franze's Gamer Cottage & Basketball Court
  ctx.fillRect(440, 470, 260, 70);
  ctx.fillRect(560, 520, 120, 140);
  ctx.fillRect(660, 470, 160, 60);

  // 3. REALISTIC 3D BEVELED COBBLESTONE PAVERS & OVERHANGING GRASS FRINGES
  const renderPavers = (startX: number, startY: number, w: number, h: number) => {
    // Outer Curb Edging Line
    ctx.strokeStyle = "#c5b382";
    ctx.lineWidth = 2;
    ctx.strokeRect(startX + 1, startY + 1, w - 2, h - 2);

    for (let px = startX + 2; px < startX + w - 12; px += 16) {
      for (let py = startY + 2; py < startY + h - 12; py += 16) {
        // Paver Mortar Shadow Bottom-Right
        ctx.fillStyle = "#c5b382";
        ctx.fillRect(px, py, 16, 16);

        // Paver Top-Left Bevel Highlight
        ctx.fillStyle = "#fefbf0";
        ctx.fillRect(px, py, 15, 15);

        // Paver Main Stone Body
        const isAlt = (px + py) % 32 === 0;
        ctx.fillStyle = isAlt ? "#ede3c2" : "#fbf7ea";
        ctx.fillRect(px + 1, py + 1, 13, 13);

        // Speckled Pebble Grain on Random Pavers
        if ((px * 37 + py * 71) % 11 === 0) {
          ctx.fillStyle = "#d8c79c";
          ctx.fillRect(px + 4, py + 4, 2, 2);
          ctx.fillRect(px + 9, py + 8, 2, 1);
        }
      }
    }

    // Natural Grass Overhang Fringe Tuft along Path Borders
    ctx.fillStyle = "#54b23f";
    for (let gx = startX + 4; gx < startX + w - 8; gx += 12) {
      // Top border fringe
      ctx.fillRect(gx, startY - 2, 3, 4);
      ctx.fillRect(gx + 1, startY + 2, 2, 2);
      // Bottom border fringe
      ctx.fillRect(gx + 4, startY + h - 2, 3, 4);
    }
  };

  renderPavers(340, 300, 160, 160);
  renderPavers(370, 440, 90, 280);
  renderPavers(375, 140, 80, 170);
  renderPavers(110, 150, 80, 120);
  renderPavers(110, 240, 260, 80);
  renderPavers(470, 150, 100, 160);
  renderPavers(550, 150, 150, 80);
  renderPavers(690, 160, 90, 70);
  renderPavers(120, 480, 270, 70);
  renderPavers(120, 530, 80, 120);
  renderPavers(440, 470, 260, 70);
  renderPavers(560, 520, 120, 140);
  renderPavers(660, 470, 160, 60);
}

// --- 3D TURNED TIMBER FENCES WITH BRASS PINS, CROSS-BRACES & ENTRANCE GAPS ---

function drawTexturedFences(ctx: CanvasRenderingContext2D) {
  PATHWAY_FENCES.forEach((fence) => {
    const { x, y, w, h } = fence;

    // 1. 3D Angled Soft Drop Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.beginPath();
    ctx.ellipse(x + w / 2 + 2, y + h + 2, w / 2 + 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Double Interlocking Horizontal Cross-Rails
    // Upper Rail (3D Bevel with Top Highlight & Bottom Shadow)
    ctx.fillStyle = "#451a03"; // Underside Shadow
    ctx.fillRect(x, y + 7, w, 2);
    ctx.fillStyle = "#78350f"; // Rail Body
    ctx.fillRect(x, y + 4, w, 4);
    ctx.fillStyle = "#b45309"; // Top Sunlit Highlight
    ctx.fillRect(x, y + 4, w, 1);
    ctx.fillStyle = "#d97706"; // Edge Gleam
    ctx.fillRect(x, y + 5, w, 1);

    // Lower Rail (3D Bevel)
    ctx.fillStyle = "#451a03"; // Underside Shadow
    ctx.fillRect(x, y + 15, w, 2);
    ctx.fillStyle = "#78350f"; // Rail Body
    ctx.fillRect(x, y + 12, w, 4);
    ctx.fillStyle = "#b45309"; // Top Sunlit Highlight
    ctx.fillRect(x, y + 12, w, 1);
    ctx.fillStyle = "#d97706"; // Edge Gleam
    ctx.fillRect(x, y + 13, w, 1);

    // 3. Diagonal Cross-Buck Braces between posts
    const postSpacing = 22;
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 2;
    for (let bx = x; bx + postSpacing <= x + w; bx += postSpacing) {
      ctx.beginPath();
      ctx.moveTo(bx + 4, y + 5);
      ctx.lineTo(bx + postSpacing - 4, y + 15);
      ctx.moveTo(bx + postSpacing - 4, y + 5);
      ctx.lineTo(bx + 4, y + 15);
      ctx.stroke();
    }

    // 4. Vertical Heavy Turned Timber Posts with Pyramidion Caps
    for (let px = x; px <= x + w; px += postSpacing) {
      // Post Drop Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(px, y + 19, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Post Shadow Right-Side
      ctx.fillStyle = "#451a03";
      ctx.fillRect(px - 4, y - 2, 8, 21);

      // Post Main Timber Body
      ctx.fillStyle = "#78350f";
      ctx.fillRect(px - 3, y - 2, 6, 20);

      // Post Left-Side Sunlit Chamfer Highlight
      ctx.fillStyle = "#b45309";
      ctx.fillRect(px - 3, y - 2, 2, 20);
      ctx.fillStyle = "#d97706";
      ctx.fillRect(px - 2, y, 1, 16);

      // 3D Pointed Pyramidion Post Cap Top
      ctx.fillStyle = "#a16207";
      ctx.beginPath();
      ctx.moveTo(px - 4, y - 2);
      ctx.lineTo(px, y - 6);
      ctx.lineTo(px + 4, y - 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#facc15"; // Top apex glint
      ctx.fillRect(px - 1, y - 5, 2, 2);

      // Gold Brass Carriage Bolt Studs with 3D Bevel
      const drawBrassPin = (bx: number, by: number) => {
        ctx.fillStyle = "#ca8a04";
        ctx.fillRect(bx - 1.5, by - 1.5, 3, 3);
        ctx.fillStyle = "#facc15";
        ctx.fillRect(bx - 1, by - 1, 2, 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(bx - 1, by - 1, 1, 1);
      };
      drawBrassPin(px, y + 6);
      drawBrassPin(px, y + 14);

      // Moss & Lichen Tufts at Post Base
      ctx.fillStyle = "#15803d";
      ctx.fillRect(px - 3, y + 16, 2, 3);
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(px - 3, y + 16, 1, 1);
    }
  });
}

// --- SPRITE-STYLE PIXEL FLOWER POTS ---

function drawSpriteFlowerPots(ctx: CanvasRenderingContext2D, time: number) {
  const sway = Math.sin(time * 0.004) * 1.5;

  FLOWER_POTS.forEach((pot) => {
    const px = pot.x;
    const py = pot.y;

    // 1. 3D Drop Shadow on Grass
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(px + 9, py + 20, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Terracotta Ceramic Urn Planter (3D Beveled Pot)
    // Dark Shadow Outline & Base Pedestal Ring
    ctx.fillStyle = "#270803";
    ctx.fillRect(px, py + 7, 18, 13);
    ctx.fillRect(px + 2, py + 19, 14, 3);
    ctx.fillRect(px + 4, py + 21, 10, 2);

    // Terracotta Clay Gradient Shading
    ctx.fillStyle = "#9a3412"; // Deep Clay Shadow
    ctx.fillRect(px + 1, py + 8, 16, 11);
    ctx.fillRect(px + 3, py + 18, 12, 2);

    ctx.fillStyle = "#c2410c"; // Main Body
    ctx.fillRect(px + 2, py + 8, 12, 10);
    ctx.fillRect(px + 4, py + 18, 9, 2);

    ctx.fillStyle = "#ea580c"; // Sunny Highlight Left
    ctx.fillRect(px + 2, py + 8, 4, 10);
    ctx.fillStyle = "#fb923c"; // Specular Glint
    ctx.fillRect(px + 3, py + 9, 2, 7);

    // Fluted Pot Rim with Beveled Lip
    ctx.fillStyle = "#431407";
    ctx.fillRect(px - 1, py + 6, 20, 3);
    ctx.fillStyle = "#fdba74";
    ctx.fillRect(px, py + 6, 18, 2);
    ctx.fillStyle = "#fed7aa";
    ctx.fillRect(px + 2, py + 6, 6, 1);

    // Rich Dark Potting Soil with Grains
    ctx.fillStyle = "#1c0f07";
    ctx.fillRect(px + 2, py + 8, 14, 3);
    ctx.fillStyle = "#451a03";
    ctx.fillRect(px + 4, py + 9, 3, 1);
    ctx.fillRect(px + 10, py + 9, 3, 1);

    // 3. Branching Foliage Stems & Serrated Green Leaves
    ctx.fillStyle = "#14532d";
    ctx.fillRect(px + 2, py + 3, 5, 5);
    ctx.fillRect(px + 11, py + 3, 5, 5);
    ctx.fillRect(px + 6, py + 1, 6, 6);

    ctx.fillStyle = "#16a34a"; // Leaf Highlights
    ctx.fillRect(px + 3, py + 2, 3, 3);
    ctx.fillRect(px + 12, py + 2, 3, 3);
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(px + 4, py + 1, 2, 2);
    ctx.fillRect(px + 13, py + 1, 2, 2);

    // 4. Lush Multi-Layered Botanical Blooms (3D Layered Petals)
    const fx = px + 6 + sway;
    const fy = py - 3;

    if (pot.type === "rose") {
      // Velvet Crimson Rose with Rosette Petals & Dewdrop
      ctx.fillStyle = "#450a0a"; // Shadow Cup
      ctx.fillRect(fx - 2, fy, 10, 9);
      ctx.fillStyle = "#991b1b"; // Deep Ruby
      ctx.fillRect(fx - 1, fy + 1, 8, 7);
      ctx.fillStyle = "#dc2626"; // Vibrant Mid Petals
      ctx.fillRect(fx, fy + 1, 6, 5);
      ctx.fillStyle = "#ef4444"; // Upper Rosette
      ctx.fillRect(fx + 1, fy + 2, 4, 3);
      ctx.fillStyle = "#fca5a5"; // Petal Edge Gleam
      ctx.fillRect(fx + 2, fy + 2, 2, 1);
      // Golden Pollen Core & Dewdrop
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(fx + 2, fy + 3, 2, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(fx + 5, fy + 1, 1, 1);
    } else if (pot.type === "sunflower") {
      // Radiant Golden Sunflower with Textured Seed Disk
      ctx.fillStyle = "#a16207"; // Dark Ray Petals
      ctx.fillRect(fx - 3, fy - 2, 12, 11);
      ctx.fillStyle = "#ca8a04";
      ctx.fillRect(fx - 2, fy - 1, 10, 9);
      ctx.fillStyle = "#eab308"; // Golden Yellow Flakes
      ctx.fillRect(fx - 2, fy, 10, 7);
      ctx.fillStyle = "#fde047"; // Highlight Petal Tips
      ctx.fillRect(fx - 1, fy - 1, 2, 2);
      ctx.fillRect(fx + 5, fy - 1, 2, 2);
      ctx.fillRect(fx - 2, fy + 3, 2, 2);
      ctx.fillRect(fx + 6, fy + 3, 2, 2);

      // Dark Chocolate Center Seed Disk with Micro Grid
      ctx.fillStyle = "#451a03";
      ctx.fillRect(fx, fy + 1, 6, 5);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(fx + 1, fy + 2, 4, 3);
      ctx.fillStyle = "#92400e";
      ctx.fillRect(fx + 2, fy + 3, 2, 1);
    } else if (pot.type === "lily") {
      // Azure Star Lily with Glowing Cyan Stamen
      ctx.fillStyle = "#0c4a6e";
      ctx.fillRect(fx - 2, fy - 1, 10, 10);
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(fx - 1, fy, 8, 8);
      ctx.fillStyle = "#38bdf8"; // Light Blue Petals
      ctx.fillRect(fx, fy + 1, 6, 6);
      ctx.fillStyle = "#7dd3fc";
      ctx.fillRect(fx + 1, fy + 2, 4, 4);
      ctx.fillStyle = "#ffffff"; // Diamond Tip
      ctx.fillRect(fx + 2, fy + 2, 2, 2);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(fx - 1, fy - 2, 2, 2);
      ctx.fillRect(fx + 5, fy - 2, 2, 2);
    } else {
      // Royal Twilight Orchid with Lavender Wing Petals
      ctx.fillStyle = "#581c87";
      ctx.fillRect(fx - 2, fy - 2, 10, 10);
      ctx.fillStyle = "#7e22ce";
      ctx.fillRect(fx - 1, fy - 1, 8, 8);
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(fx, fy, 6, 6);
      ctx.fillStyle = "#c084fc"; // Wing Highlights
      ctx.fillRect(fx - 2, fy + 1, 3, 3);
      ctx.fillRect(fx + 5, fy + 1, 3, 3);
      ctx.fillStyle = "#f3e8ff"; // Lip Center
      ctx.fillRect(fx + 1, fy + 1, 4, 3);
      ctx.fillStyle = "#facc15"; // Golden Throat
      ctx.fillRect(fx + 2, fy + 2, 2, 2);
    }
  });
}

// --- SPRITE-STYLE PIXEL BUSHES & SHRUBS ---

function drawSpriteBushes(ctx: CanvasRenderingContext2D) {
  DECORATIVE_BUSHES.forEach((b) => {
    // 1. Multi-Tone Volumetric Ground Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(b.x + 18, b.y + 22, 19, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (b.type === "berry_bush") {
      // Volumetric Multi-Lobed Dense Berry Shrub (36x26)
      // Root Base Twigs
      ctx.fillStyle = "#451a03";
      ctx.fillRect(b.x + 14, b.y + 18, 8, 5);

      // Deep Shadow Under-Canopy
      ctx.fillStyle = "#052e16";
      ctx.fillRect(b.x + 2, b.y + 5, 32, 18);
      ctx.fillRect(b.x + 5, b.y + 2, 26, 22);

      // Mid-Depth Foliage Mass
      ctx.fillStyle = "#14532d";
      ctx.fillRect(b.x + 4, b.y + 6, 28, 16);
      ctx.fillRect(b.x + 7, b.y + 3, 22, 20);

      // Lush Emerald Front Leaves (Tri-Lobe Foliage)
      ctx.fillStyle = "#15803d";
      ctx.fillRect(b.x + 5, b.y + 5, 12, 12);
      ctx.fillRect(b.x + 19, b.y + 5, 12, 12);
      ctx.fillRect(b.x + 10, b.y + 2, 16, 14);

      // Sunny Highlights on Upper Leaves
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(b.x + 7, b.y + 4, 7, 6);
      ctx.fillRect(b.x + 21, b.y + 4, 7, 6);
      ctx.fillRect(b.x + 13, b.y + 2, 9, 8);

      // Specular Top Leaf Tips
      ctx.fillStyle = "#86efac";
      ctx.fillRect(b.x + 8, b.y + 3, 4, 2);
      ctx.fillRect(b.x + 22, b.y + 3, 4, 2);
      ctx.fillRect(b.x + 15, b.y + 1, 5, 2);

      // Plump 3D Berry Clusters with Specular Sheen
      ctx.fillStyle = b.berry;
      ctx.fillRect(b.x + 6, b.y + 10, 5, 5);
      ctx.fillRect(b.x + 24, b.y + 9, 5, 5);
      ctx.fillRect(b.x + 15, b.y + 14, 5, 5);
      ctx.fillRect(b.x + 10, b.y + 16, 4, 4);

      // Berry Glint Highlights
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(b.x + 7, b.y + 10, 2, 1);
      ctx.fillRect(b.x + 25, b.y + 9, 2, 1);
      ctx.fillRect(b.x + 16, b.y + 14, 2, 1);
    } else if (b.type === "flowering_hedge") {
      // Manicured Flowering Jasmine & Azalea Hedge (38x26)
      ctx.fillStyle = "#022c22"; // Deep Under-Shadow
      ctx.fillRect(b.x + 2, b.y + 6, 34, 18);
      ctx.fillRect(b.x + 6, b.y + 2, 26, 22);

      ctx.fillStyle = "#064e3b";
      ctx.fillRect(b.x + 4, b.y + 7, 30, 16);
      ctx.fillRect(b.x + 8, b.y + 3, 22, 20);

      ctx.fillStyle = "#047857";
      ctx.fillRect(b.x + 6, b.y + 4, 11, 11);
      ctx.fillRect(b.x + 20, b.y + 4, 11, 11);
      ctx.fillRect(b.x + 11, b.y + 7, 15, 11);

      ctx.fillStyle = "#10b981"; // Upper Foliage
      ctx.fillRect(b.x + 7, b.y + 3, 8, 8);
      ctx.fillRect(b.x + 21, b.y + 3, 8, 8);
      ctx.fillRect(b.x + 13, b.y + 4, 10, 8);

      ctx.fillStyle = "#6ee7b7"; // Sunlit Leaves
      ctx.fillRect(b.x + 8, b.y + 3, 5, 2);
      ctx.fillRect(b.x + 22, b.y + 3, 5, 2);
      ctx.fillRect(b.x + 15, b.y + 2, 6, 2);

      // 5-Petal Blossoms with Golden Center Pollen
      ctx.fillStyle = b.berry;
      ctx.fillRect(b.x + 6, b.y + 8, 6, 6);
      ctx.fillRect(b.x + 24, b.y + 7, 6, 6);
      ctx.fillRect(b.x + 15, b.y + 13, 6, 6);
      ctx.fillRect(b.x + 28, b.y + 15, 5, 5);

      ctx.fillStyle = "#fef08a"; // Yellow Flower Core
      ctx.fillRect(b.x + 8, b.y + 10, 2, 2);
      ctx.fillRect(b.x + 26, b.y + 9, 2, 2);
      ctx.fillRect(b.x + 17, b.y + 15, 2, 2);
      ctx.fillRect(b.x + 30, b.y + 17, 1, 1);
    } else {
      // Jagged Organic Wild Route Shrub (34x24)
      ctx.fillStyle = "#052e16";
      ctx.fillRect(b.x + 2, b.y + 4, 30, 18);
      ctx.fillRect(b.x + 6, b.y + 1, 20, 22);

      ctx.fillStyle = "#14532d";
      ctx.fillRect(b.x + 4, b.y + 5, 26, 16);
      ctx.fillRect(b.x + 8, b.y + 2, 16, 20);

      ctx.fillStyle = "#16a34a"; // Dense Center
      ctx.fillRect(b.x + 6, b.y + 3, 20, 14);

      // Jagged Multi-Direction Leaf Notches
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(b.x + 3, b.y + 2, 5, 5);
      ctx.fillRect(b.x + 24, b.y + 2, 5, 5);
      ctx.fillRect(b.x + 13, b.y + 1, 6, 5);
      ctx.fillRect(b.x + 8, b.y + 7, 8, 7);
      ctx.fillRect(b.x + 18, b.y + 7, 8, 7);

      ctx.fillStyle = "#86efac"; // Bright Crown Tips
      ctx.fillRect(b.x + 5, b.y + 1, 3, 2);
      ctx.fillRect(b.x + 25, b.y + 1, 3, 2);
      ctx.fillRect(b.x + 15, b.y, 4, 2);
    }
  });
}

// --- RICH 3D RETRO OUTDOOR VILLAGE FURNITURE ---

function drawVillageFurniture(ctx: CanvasRenderingContext2D, time: number) {
  VILLAGE_FURNITURE.forEach((f) => {
    const fx = f.x;
    const fy = f.y;

    if (f.type === "bench") {
      // =====================================================================
      // 🪑 1. POLISHED OAK & CAST IRON PARK BENCH (42x24)
      // =====================================================================
      // 3D Drop Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(fx + 21, fy + 22, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wrought Iron Legs with Scroll Feet
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(fx + 3, fy + 8, 4, 14);
      ctx.fillRect(fx + 35, fy + 8, 4, 14);
      ctx.fillRect(fx + 1, fy + 19, 7, 3);
      ctx.fillRect(fx + 34, fy + 19, 7, 3);

      // Polished Oak Slatted Backrest (3 Wooden Slats)
      ctx.fillStyle = "#451a03"; // Outline
      ctx.fillRect(fx + 4, fy + 1, 34, 10);

      ctx.fillStyle = "#b45309"; // Main Honey Wood
      ctx.fillRect(fx + 5, fy + 2, 32, 8);

      // Slat Highlights & Divider Grooves
      ctx.fillStyle = "#fde68a"; // Top Slat Gleam
      ctx.fillRect(fx + 5, fy + 2, 32, 1.5);
      ctx.fillStyle = "#78350f"; // Horizontal Slit 1
      ctx.fillRect(fx + 5, fy + 4.5, 32, 1);
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(fx + 5, fy + 5.5, 32, 1);
      ctx.fillStyle = "#78350f"; // Horizontal Slit 2
      ctx.fillRect(fx + 5, fy + 7.5, 32, 1);

      // Brass Rivet Caps on Backrest
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(fx + 6, fy + 3, 2, 2);
      ctx.fillRect(fx + 34, fy + 3, 2, 2);
      ctx.fillRect(fx + 6, fy + 6, 2, 2);
      ctx.fillRect(fx + 34, fy + 6, 2, 2);

      // Wide Polished Oak Seat Planks
      ctx.fillStyle = "#78350f";
      ctx.fillRect(fx + 2, fy + 11, 38, 7);
      ctx.fillStyle = "#d97706";
      ctx.fillRect(fx + 3, fy + 11, 36, 5);
      ctx.fillStyle = "#fef08a"; // Seat Top Highlight
      ctx.fillRect(fx + 3, fy + 11, 36, 1.5);

      // Ornate Wrought Iron Scrolled Armrests
      ctx.fillStyle = "#334155";
      ctx.fillRect(fx + 2, fy + 6, 5, 3);
      ctx.fillRect(fx + 35, fy + 6, 5, 3);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(fx + 2, fy + 6, 5, 1);
      ctx.fillRect(fx + 35, fy + 6, 5, 1);
    } else if (f.type === "chess_table") {
      // =====================================================================
      // ♟️ 2. CARVED STONE CHESS TABLE WITH VELVET STOOLS (46x32)
      // =====================================================================
      // Drop Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(fx + 23, fy + 28, 24, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Left Stool with Royal Crimson Velvet Cushion
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(fx, fy + 16, 9, 13);
      ctx.fillStyle = "#475569";
      ctx.fillRect(fx + 1, fy + 17, 7, 11);
      // Crimson Cushion
      ctx.fillStyle = "#991b1b";
      ctx.fillRect(fx + 1, fy + 14, 7, 4);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(fx + 2, fy + 14, 5, 2);

      // Right Stool with Royal Crimson Velvet Cushion
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(fx + 37, fy + 16, 9, 13);
      ctx.fillStyle = "#475569";
      ctx.fillRect(fx + 38, fy + 17, 7, 11);
      // Crimson Cushion
      ctx.fillStyle = "#991b1b";
      ctx.fillRect(fx + 38, fy + 14, 7, 4);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(fx + 39, fy + 14, 5, 2);

      // Carved Stone Pedestal Column (Center)
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(fx + 17, fy + 14, 12, 15);
      ctx.fillStyle = "#475569";
      ctx.fillRect(fx + 19, fy + 14, 8, 14);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(fx + 20, fy + 14, 4, 14);

      // Round Beveled Limestone Tabletop
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(fx + 10, fy + 3, 26, 14);
      ctx.fillStyle = "#475569";
      ctx.fillRect(fx + 11, fy + 4, 24, 12);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(fx + 12, fy + 4, 22, 2);

      // Crisp 8x8 Ivory & Obsidian Checkered Board
      const cx = fx + 14;
      const cy = fy + 6;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const isWhite = (r + c) % 2 === 0;
          ctx.fillStyle = isWhite ? "#f8fafc" : "#0f172a";
          ctx.fillRect(cx + c * 4.5, cy + r * 2, 4.5, 2);
        }
      }

      // Sculpted 3D Mini Chess Pieces
      ctx.fillStyle = "#ffffff"; // White King & Queen
      ctx.fillRect(cx + 5, cy + 1, 2, 3);
      ctx.fillRect(cx + 9, cy + 2, 2, 2);
      ctx.fillStyle = "#dc2626"; // Black / Red Master Pieces
      ctx.fillRect(cx + 12, cy + 4, 2, 3);
      ctx.fillRect(cx + 3, cy + 5, 2, 2);
    } else if (f.type === "wishing_well") {
      // =====================================================================
      // ⛲ 3. GRAND ANCIENT VILLAGE WISHING WELL (50x56)
      // =====================================================================
      // Well Drop Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(fx + 25, fy + 50, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stone Wall Base (Ashlar Masonry Blocks)
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(fx + 5, fy + 26, 40, 26);
      ctx.fillStyle = "#334155";
      ctx.fillRect(fx + 7, fy + 28, 36, 22);

      // Brick Rows & Mortar Relief
      ctx.fillStyle = "#475569";
      ctx.fillRect(fx + 8, fy + 29, 10, 4);
      ctx.fillRect(fx + 20, fy + 29, 11, 4);
      ctx.fillRect(fx + 33, fy + 29, 9, 4);
      ctx.fillRect(fx + 8, fy + 35, 16, 5);
      ctx.fillRect(fx + 26, fy + 35, 16, 5);
      ctx.fillRect(fx + 8, fy + 42, 12, 5);
      ctx.fillRect(fx + 22, fy + 42, 20, 5);

      // Creeping Green Ivy on Wall
      ctx.fillStyle = "#15803d";
      ctx.fillRect(fx + 7, fy + 38, 6, 7);
      ctx.fillRect(fx + 36, fy + 36, 6, 8);
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(fx + 8, fy + 39, 3, 3);
      ctx.fillRect(fx + 37, fy + 37, 3, 3);

      // Beveled Stone Well Rim Lip
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(fx + 3, fy + 24, 44, 5);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(fx + 5, fy + 24, 40, 3);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(fx + 5, fy + 24, 40, 1);

      // Deep Water Pool Inside Well with Waves & Gold Coins
      const waterRipple = Math.sin(time * 0.005) * 1.5;
      ctx.fillStyle = "#0c4a6e";
      ctx.fillRect(fx + 9, fy + 27, 32, 4);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(fx + 12 + waterRipple, fy + 28, 10, 2);
      ctx.fillStyle = "#e0f2fe";
      ctx.fillRect(fx + 26 - waterRipple, fy + 28, 8, 1);

      // Floating Wish Coins
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(fx + 14, fy + 28, 2, 2);
      ctx.fillRect(fx + 32, fy + 28, 2, 2);

      // Heavy Timber Support Posts
      ctx.fillStyle = "#451a03";
      ctx.fillRect(fx + 6, fy + 6, 5, 20);
      ctx.fillRect(fx + 39, fy + 6, 5, 20);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(fx + 7, fy + 6, 3, 20);
      ctx.fillRect(fx + 40, fy + 6, 3, 20);

      // Turned Wood Spool & Hemp Rope Coil
      ctx.fillStyle = "#92400e";
      ctx.fillRect(fx + 11, fy + 10, 28, 4);
      ctx.fillStyle = "#d97706"; // Rope Spool
      ctx.fillRect(fx + 21, fy + 9, 8, 6);
      ctx.fillRect(fx + 24, fy + 14, 2, 10); // Suspended rope

      // Suspended Oak Water Bucket with Water
      ctx.fillStyle = "#78350f";
      ctx.fillRect(fx + 21, fy + 22, 8, 7);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(fx + 22, fy + 22, 6, 2);
      ctx.fillStyle = "#334155";
      ctx.fillRect(fx + 21, fy + 25, 8, 1.5);

      // Pitched Terracotta Canopy Roof (Gable Roof)
      ctx.fillStyle = "#431407";
      ctx.beginPath();
      ctx.moveTo(fx + 25, fy - 4);
      ctx.lineTo(fx + 49, fy + 8);
      ctx.lineTo(fx + 1, fy + 8);
      ctx.closePath();
      ctx.fill();

      // Scalloped Terracotta Clay Tiles
      ctx.fillStyle = "#c2410c";
      ctx.beginPath();
      ctx.moveTo(fx + 25, fy - 2);
      ctx.lineTo(fx + 47, fy + 8);
      ctx.lineTo(fx + 3, fy + 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ea580c";
      ctx.fillRect(fx + 8, fy + 4, 34, 3);
      ctx.fillStyle = "#fdba74"; // Ridge Cap
      ctx.fillRect(fx + 22, fy - 3, 6, 2);
    } else if (f.type === "birdbath") {
      // =====================================================================
      // 🐦 4. TWO-TIER CARVED LIMESTONE BIRDBATH (30x30)
      // =====================================================================
      // Drop Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(fx + 15, fy + 28, 14, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stepped Pedestal Base Plinth
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(fx + 8, fy + 23, 14, 6);
      ctx.fillStyle = "#475569";
      ctx.fillRect(fx + 9, fy + 24, 12, 4);

      // Fluted Corinthian Column Shaft
      ctx.fillStyle = "#334155";
      ctx.fillRect(fx + 12, fy + 12, 6, 12);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(fx + 14, fy + 12, 2, 12);

      // Wide Lower Scalloped Basin
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(fx + 2, fy + 6, 26, 8);
      ctx.fillStyle = "#475569";
      ctx.fillRect(fx + 3, fy + 7, 24, 6);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(fx + 3, fy + 6, 24, 1.5);

      // Crystal Blue Water in Basin with Caustics
      const bathRipples = Math.sin(time * 0.006) * 1.5;
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(fx + 6, fy + 7, 18, 3);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(fx + 8 + bathRipples, fy + 7, 7, 1.5);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(fx + 17 - bathRipples, fy + 7, 3, 1.5);

      // Two Animated Perched Bluebirds
      const birdBob = Math.sin(time * 0.008) > 0.5 ? 1 : 0;
      // Bluebird 1 (Right)
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(fx + 23, fy + 2 + birdBob, 5, 5);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(fx + 22, fy + 3 + birdBob, 4, 4);
      ctx.fillStyle = "#f97316";
      ctx.fillRect(fx + 28, fy + 4 + birdBob, 2, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(fx + 25, fy + 3 + birdBob, 1, 1);

      // Bluebird 2 (Left - Drinking)
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(fx + 2, fy + 4 - birdBob, 5, 4);
      ctx.fillStyle = "#f97316";
      ctx.fillRect(fx + 6, fy + 6 - birdBob, 2, 2);
    } else if (f.type === "streetlamp") {
      // =====================================================================
      // 🏮 5. VICTORIAN ORNATE GASLIGHT STREETLAMP (22x48)
      // =====================================================================
      // Ground Shadow & Ambient Warm Light Halo
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(fx + 11, fy + 45, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Warm Ambient Radial Ground Halo
      const glowPulse = Math.sin(time * 0.006 + fx) * 3;
      const lampGrad = ctx.createRadialGradient(fx + 11, fy + 14, 3, fx + 11, fy + 14, 32 + glowPulse);
      lampGrad.addColorStop(0, "rgba(253, 224, 71, 0.4)");
      lampGrad.addColorStop(0.5, "rgba(251, 191, 36, 0.15)");
      lampGrad.addColorStop(1, "rgba(253, 224, 71, 0)");
      ctx.fillStyle = lampGrad;
      ctx.beginPath();
      ctx.arc(fx + 11, fy + 14, 32 + glowPulse, 0, Math.PI * 2);
      ctx.fill();

      // Cast Iron Fluted Pedestal Base
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(fx + 6, fy + 38, 10, 8);
      ctx.fillStyle = "#334155";
      ctx.fillRect(fx + 7, fy + 39, 8, 4);

      // Tall Lamp Post Shaft
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(fx + 9.5, fy + 16, 3, 23);
      ctx.fillStyle = "#475569";
      ctx.fillRect(fx + 10.5, fy + 16, 1.5, 23);

      // Scrollwork Bracket Arms
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(fx + 4, fy + 14, 14, 2);
      ctx.fillRect(fx + 5, fy + 12, 12, 2);

      // Brass Finial Crown & Lantern Housing
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(fx + 5, fy + 6, 12, 10);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(fx + 10, fy + 2, 2, 4); // Finial apex
      ctx.fillRect(fx + 4, fy + 5, 14, 2); // Cap rim

      // Glowing Amber Beveled Glass Windows & Flame Filament
      ctx.fillStyle = "#fde047";
      ctx.fillRect(fx + 7, fy + 7, 8, 8);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(fx + 9, fy + 9, 4, 4);
    } else if (f.type === "barrel_stack") {
      // =====================================================================
      // 🍎 6. RUSTIC OAK CIDER BARRELS & APPLE CRATES (40x30)
      // =====================================================================
      // Drop Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(fx + 20, fy + 27, 20, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bottom Left Oak Barrel
      ctx.fillStyle = "#451a03";
      ctx.fillRect(fx + 1, fy + 8, 16, 20);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(fx + 2, fy + 9, 14, 18);
      ctx.fillStyle = "#b45309";
      ctx.fillRect(fx + 5, fy + 9, 8, 18);
      // Steel Hoops
      ctx.fillStyle = "#334155";
      ctx.fillRect(fx + 1, fy + 11, 16, 2);
      ctx.fillRect(fx + 1, fy + 23, 16, 2);

      // Top Oak Barrel (Pyramid Stack)
      ctx.fillStyle = "#451a03";
      ctx.fillRect(fx + 8, fy, 14, 14);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(fx + 9, fy + 1, 12, 12);
      ctx.fillStyle = "#b45309";
      ctx.fillRect(fx + 11, fy + 1, 7, 12);
      ctx.fillStyle = "#334155";
      ctx.fillRect(fx + 8, fy + 3, 14, 2);
      ctx.fillRect(fx + 8, fy + 10, 14, 2);

      // Right Fruit Crate with Apples & Pears
      ctx.fillStyle = "#78350f";
      ctx.fillRect(fx + 20, fy + 12, 18, 16);
      ctx.fillStyle = "#d97706";
      ctx.fillRect(fx + 21, fy + 13, 16, 14);
      ctx.fillStyle = "#b45309";
      ctx.fillRect(fx + 21, fy + 19, 16, 2);

      // Apples in Crate
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(fx + 22, fy + 10, 4, 4);
      ctx.fillRect(fx + 27, fy + 9, 4, 4);
      ctx.fillRect(fx + 32, fy + 11, 4, 4);
      ctx.fillStyle = "#facc15"; // Golden pear
      ctx.fillRect(fx + 25, fy + 11, 4, 4);
      ctx.fillStyle = "#22c55e"; // Leaves
      ctx.fillRect(fx + 29, fy + 8, 2, 2);
    }
  });
}

// --- AUTHENTIC RETRO PIXEL-ART MULTI-SPECIES TREES ---

function drawSpriteTrees(ctx: CanvasRenderingContext2D, time: number) {
  const wind = Math.sin(time * 0.003) * 1.8;

  DECORATIVE_TREES.forEach((t) => {
    const tx = t.x;
    const ty = t.y;
    const wx = tx + wind;

    if (t.type === "grand_oak") {
      // 1. GRAND GREAT OAK TREE (64x80 - 5-Lobed Massive Canopy)
      // Base Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(tx + 32, ty + 74, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trunk with Gnarled Bark Grain & Roots
      ctx.fillStyle = "#271204"; // Trunk Outline
      ctx.fillRect(tx + 22, ty + 42, 20, 36);
      ctx.fillRect(tx + 14, ty + 70, 36, 8);

      ctx.fillStyle = "#78350f"; // Bark Body
      ctx.fillRect(tx + 24, ty + 44, 16, 32);
      ctx.fillRect(tx + 16, ty + 72, 32, 5);

      ctx.fillStyle = "#b45309"; // Bark Grain Highlights
      ctx.fillRect(tx + 26, ty + 46, 3, 28);
      ctx.fillRect(tx + 33, ty + 48, 2, 24);

      ctx.fillStyle = "#451a03"; // Knot Hole & Shading
      ctx.fillRect(tx + 30, ty + 54, 4, 6);
      ctx.fillRect(tx + 36, ty + 46, 3, 30);

      // 5-Lobed Massive Leaf Canopy
      // Outer Silhouette Outline
      ctx.fillStyle = "#052e16";
      ctx.fillRect(wx + 4, ty + 18, 56, 32);
      ctx.fillRect(wx + 10, ty + 8, 44, 46);
      ctx.fillRect(wx + 16, ty + 2, 32, 54);

      // Deep Shadow Pockets
      ctx.fillStyle = "#14532d";
      ctx.fillRect(wx + 6, ty + 20, 52, 28);
      ctx.fillRect(wx + 12, ty + 10, 40, 42);
      ctx.fillRect(wx + 18, ty + 4, 28, 50);

      // Emerald Mid-Tone Foliage Lobes
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(wx + 8, ty + 18, 20, 18); // Left lobe
      ctx.fillRect(wx + 34, ty + 18, 20, 18); // Right lobe
      ctx.fillRect(wx + 18, ty + 6, 26, 22); // Top crown
      ctx.fillRect(wx + 14, ty + 28, 34, 18); // Bottom belly

      // Leaf Bunch Highlights
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(wx + 10, ty + 18, 12, 10);
      ctx.fillRect(wx + 36, ty + 18, 12, 10);
      ctx.fillRect(wx + 22, ty + 8, 18, 12);
      ctx.fillRect(wx + 18, ty + 28, 24, 8);

      // Sun Glints & Leaf Notches
      ctx.fillStyle = "#86efac";
      ctx.fillRect(wx + 12, ty + 14, 6, 4);
      ctx.fillRect(wx + 38, ty + 14, 6, 4);
      ctx.fillRect(wx + 26, ty + 6, 10, 4);
      ctx.fillRect(wx + 22, ty + 26, 8, 3);
    } else if (t.type === "pine") {
      // 2. HIGHLAND CONIFER PINE / FIR TREE (48x78 - 4-Tiered Jagged Needles)
      // Base Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(tx + 24, ty + 74, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Slender Pine Trunk
      ctx.fillStyle = "#291305";
      ctx.fillRect(tx + 18, ty + 50, 12, 26);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(tx + 20, ty + 52, 8, 23);
      ctx.fillStyle = "#b45309";
      ctx.fillRect(tx + 21, ty + 54, 2, 19);

      // 4-Tier Conical Needle Layers (Top to Bottom)
      const renderPineTier = (tierY: number, tierW: number, tierH: number) => {
        const left = wx + 24 - tierW / 2;
        ctx.fillStyle = "#022c22"; // Outline
        ctx.beginPath();
        ctx.moveTo(left, tierY + tierH);
        ctx.lineTo(wx + 24, tierY);
        ctx.lineTo(left + tierW, tierY + tierH);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#064e3b"; // Shadow
        ctx.beginPath();
        ctx.moveTo(left + 2, tierY + tierH - 1);
        ctx.lineTo(wx + 24, tierY + 2);
        ctx.lineTo(left + tierW - 2, tierY + tierH - 1);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#059669"; // Mid
        ctx.beginPath();
        ctx.moveTo(left + 4, tierY + tierH - 3);
        ctx.lineTo(wx + 24, tierY + 3);
        ctx.lineTo(left + tierW - 6, tierY + tierH - 3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#6ee7b7"; // Mint needle tips
        ctx.fillRect(wx + 22, tierY + 3, 4, 3);
        ctx.fillRect(left + 3, tierY + tierH - 4, 3, 2);
        ctx.fillRect(left + tierW - 6, tierY + tierH - 4, 3, 2);
      };

      renderPineTier(ty + 2, 20, 18);  // Tier 1 (Apex)
      renderPineTier(ty + 14, 28, 20); // Tier 2
      renderPineTier(ty + 28, 38, 22); // Tier 3
      renderPineTier(ty + 44, 46, 24); // Tier 4 (Base)
    } else if (t.type === "maple") {
      // 3. GOLDEN AUTUMN BIRCH / MAPLE TREE (58x74 - Warm Autumn Palette)
      // Base Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(tx + 29, ty + 70, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Birch Trunk
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(tx + 22, ty + 42, 14, 30);
      ctx.fillStyle = "#334155"; // Charcoal Bark Flecks
      ctx.fillRect(tx + 23, ty + 48, 4, 2);
      ctx.fillRect(tx + 29, ty + 56, 5, 2);
      ctx.fillRect(tx + 24, ty + 64, 4, 2);

      // Autumn Canopy (Crimson, Burnt Orange, Amber Gold)
      ctx.fillStyle = "#450a0a"; // Deep Crimson Outline
      ctx.fillRect(wx + 4, ty + 16, 50, 30);
      ctx.fillRect(wx + 10, ty + 6, 38, 42);

      ctx.fillStyle = "#7f1d1d"; // Dark Autumn Shadow
      ctx.fillRect(wx + 6, ty + 18, 46, 26);
      ctx.fillRect(wx + 12, ty + 8, 34, 38);

      ctx.fillStyle = "#ea580c"; // Burnt Orange Mid-Tone
      ctx.fillRect(wx + 8, ty + 16, 18, 16);
      ctx.fillRect(wx + 30, ty + 16, 18, 16);
      ctx.fillRect(wx + 16, ty + 6, 24, 20);

      ctx.fillStyle = "#f59e0b"; // Amber Gold Highlights
      ctx.fillRect(wx + 10, ty + 14, 12, 8);
      ctx.fillRect(wx + 32, ty + 14, 12, 8);
      ctx.fillRect(wx + 20, ty + 6, 16, 10);

      ctx.fillStyle = "#fef08a"; // Yellow Sun Glints
      ctx.fillRect(wx + 14, ty + 10, 6, 3);
      ctx.fillRect(wx + 34, ty + 10, 6, 3);
      ctx.fillRect(wx + 24, ty + 4, 8, 3);
    } else {
      // 4. FLOWERING CHERRY BLOSSOM / SAKURA TREE (58x74 - Pink Petal Clouds)
      // Base Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(tx + 29, ty + 70, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark Cherry Wood Trunk
      ctx.fillStyle = "#3f1a0a";
      ctx.fillRect(tx + 22, ty + 42, 14, 30);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(tx + 24, ty + 44, 10, 26);
      ctx.fillStyle = "#b45309";
      ctx.fillRect(tx + 25, ty + 46, 2, 22);

      // Pillowy Pink Blossom Clusters
      ctx.fillStyle = "#500724"; // Outline
      ctx.fillRect(wx + 4, ty + 16, 50, 30);
      ctx.fillRect(wx + 10, ty + 6, 38, 42);

      ctx.fillStyle = "#831843"; // Deep Magenta Shadow
      ctx.fillRect(wx + 6, ty + 18, 46, 26);
      ctx.fillRect(wx + 12, ty + 8, 34, 38);

      ctx.fillStyle = "#db2777"; // Rich Pink Blooms
      ctx.fillRect(wx + 8, ty + 16, 18, 16);
      ctx.fillRect(wx + 30, ty + 16, 18, 16);
      ctx.fillRect(wx + 16, ty + 6, 24, 20);

      ctx.fillStyle = "#f472b6"; // Pale Rose Petal Highlights
      ctx.fillRect(wx + 10, ty + 14, 12, 8);
      ctx.fillRect(wx + 32, ty + 14, 12, 8);
      ctx.fillRect(wx + 20, ty + 6, 16, 10);

      ctx.fillStyle = "#fdf2f8"; // Pure White Petal Tips
      ctx.fillRect(wx + 14, ty + 10, 6, 3);
      ctx.fillRect(wx + 34, ty + 10, 6, 3);
      ctx.fillRect(wx + 24, ty + 4, 8, 3);
    }
  });
}

// --- CUSTOM 3D-STYLE SPRITE BUILDINGS ---

function drawCustomBuildings(ctx: CanvasRenderingContext2D, time: number) {
  // =========================================================================
  // --- 1. PROJECTS SHOWCASE GUILD (NW: 140x110 at x:70, y:60) ---
  // =========================================================================
  const b1X = 70;
  const b1Y = 60;
  const b1W = 140;
  const b1H = 110;

  // 3D Drop Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.beginPath();
  ctx.ellipse(b1X + b1W / 2 + 4, b1Y + b1H + 2, b1W / 2 + 8, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stepped Ashlar Stone Foundation Plinth (3D Bevel)
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(b1X + 4, b1Y + b1H - 16, b1W - 8, 16);
  ctx.fillStyle = "#334155";
  ctx.fillRect(b1X + 6, b1Y + b1H - 14, b1W - 12, 12);
  ctx.fillStyle = "#475569";
  ctx.fillRect(b1X + 8, b1Y + b1H - 14, b1W - 16, 3);
  // Foundation Stone Masonry Grooves
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  for (let sx = b1X + 24; sx < b1X + b1W - 16; sx += 24) {
    ctx.strokeRect(sx, b1Y + b1H - 14, 24, 12);
  }

  // Main Stucco Walls (Cream/Parchment with 3D Shading)
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(b1X + 8, b1Y + 36, b1W - 16, b1H - 50);
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)"; // Right-side shadow for 3D depth
  ctx.fillRect(b1X + b1W / 2, b1Y + 36, b1W / 2 - 8, b1H - 50);

  // Tudor Half-Timber Oak Framework (Dark Walnut Beams with Wood Grain)
  ctx.fillStyle = "#451a03"; // Beam outline & shadow
  ctx.fillRect(b1X + 8, b1Y + 36, b1W - 16, 5); // Upper horizontal belt
  ctx.fillRect(b1X + 8, b1Y + 68, b1W - 16, 5); // Mid horizontal belt
  ctx.fillRect(b1X + 8, b1Y + 36, 6, b1H - 50); // Left corner post
  ctx.fillRect(b1X + b1W - 14, b1Y + 36, 6, b1H - 50); // Right corner post
  ctx.fillRect(b1X + 44, b1Y + 36, 5, b1H - 50); // Left vertical stud
  ctx.fillRect(b1X + b1W - 49, b1Y + 36, 5, b1H - 50); // Right vertical stud

  // Diagonal Half-Timber Cross Braces
  ctx.strokeStyle = "#451a03";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(b1X + 14, b1Y + 41);
  ctx.lineTo(b1X + 44, b1Y + 68);
  ctx.moveTo(b1X + b1W - 14, b1Y + 41);
  ctx.lineTo(b1X + b1W - 44, b1Y + 68);
  ctx.stroke();

  ctx.fillStyle = "#78350f"; // Beam Wood Tone Highlights
  ctx.fillRect(b1X + 9, b1Y + 37, b1W - 18, 3);
  ctx.fillRect(b1X + 9, b1Y + 69, b1W - 18, 3);

  // 3D Mansard Blue Slate Roof with Tile Shingle Texture
  // Under-Roof Shadow Rafters
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(b1X + 2, b1Y + 36, b1W - 4, 6);

  // Mansard Roof Trapezoid
  ctx.fillStyle = "#1e3a8a"; // Base Blue Slate
  ctx.beginPath();
  ctx.moveTo(b1X, b1Y + 38);
  ctx.lineTo(b1X + 26, b1Y);
  ctx.lineTo(b1X + b1W - 26, b1Y);
  ctx.lineTo(b1X + b1W, b1Y + 38);
  ctx.closePath();
  ctx.fill();

  // Roof 3D Ridge Cap & Edge Bevel
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Slate Shingle Horizontal Rows with Scallop Texture
  ctx.strokeStyle = "rgba(147, 197, 253, 0.35)";
  ctx.lineWidth = 1;
  for (let ry = b1Y + 8; ry < b1Y + 36; ry += 6) {
    const inset = ((b1Y + 38 - ry) / 38) * 26;
    ctx.beginPath();
    ctx.moveTo(b1X + inset, ry);
    ctx.lineTo(b1X + b1W - inset, ry);
    ctx.stroke();
  }

  // Roof Cresting & Top Gilded Finials
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(b1X + 26, b1Y - 2, b1W - 52, 3);
  ctx.fillRect(b1X + 24, b1Y - 5, 4, 6);
  ctx.fillRect(b1X + b1W - 28, b1Y - 5, 4, 6);

  // Attic Dormer Gable Window (Center Roof)
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b1X + b1W / 2 - 14, b1Y + 8, 28, 20);
  ctx.fillStyle = "#1e3a8a";
  ctx.beginPath();
  ctx.moveTo(b1X + b1W / 2 - 16, b1Y + 12);
  ctx.lineTo(b1X + b1W / 2, b1Y + 2);
  ctx.lineTo(b1X + b1W / 2 + 16, b1Y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Dormer Window Glow
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(b1X + b1W / 2 - 8, b1Y + 14, 16, 12);
  ctx.strokeStyle = "#451a03";
  ctx.lineWidth = 1;
  ctx.strokeRect(b1X + b1W / 2 - 8, b1Y + 14, 16, 12);

  // Brick Chimney with Masonry Quoins & Rising Smoke
  ctx.fillStyle = "#450a0a";
  ctx.fillRect(b1X + b1W - 34, b1Y - 16, 18, 26);
  ctx.fillStyle = "#991b1b";
  ctx.fillRect(b1X + b1W - 32, b1Y - 14, 14, 24);
  ctx.fillStyle = "#78350f"; // Chimney Cap
  ctx.fillRect(b1X + b1W - 36, b1Y - 18, 22, 4);
  // Chimney Brick Rows
  ctx.strokeStyle = "#450a0a";
  ctx.lineWidth = 1;
  ctx.strokeRect(b1X + b1W - 32, b1Y - 10, 14, 5);
  ctx.strokeRect(b1X + b1W - 32, b1Y - 4, 14, 5);

  const smokeT = (time * 0.003) % 4;
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.beginPath();
  ctx.arc(b1X + b1W - 25, b1Y - 22 - smokeT * 8, 4 + smokeT * 1.5, 0, Math.PI * 2);
  ctx.arc(b1X + b1W - 20 + Math.sin(time * 0.004) * 4, b1Y - 32 - smokeT * 8, 6 + smokeT, 0, Math.PI * 2);
  ctx.fill();

  // Multi-Pane Stained-Glass Bay Windows (Warm Candlelit Interior)
  const drawBayWindow = (wx: number, wy: number) => {
    // 3D Stone Sill & Ledge
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(wx - 2, wy + 26, 30, 4);
    ctx.fillStyle = "#475569";
    ctx.fillRect(wx - 1, wy + 26, 28, 2);

    // Window Frame & Stucco Arch
    ctx.fillStyle = "#451a03";
    ctx.fillRect(wx, wy, 26, 26);

    // Warm Interior Golden Glass
    const candlePulse = Math.sin(time * 0.006 + wx) * 0.15;
    ctx.fillStyle = `rgba(254, 240, 138, ${0.85 + candlePulse})`;
    ctx.fillRect(wx + 2, wy + 2, 22, 22);

    // Iron Window Mullions (Grid)
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(wx + 2, wy + 2, 22, 22);
    ctx.beginPath();
    ctx.moveTo(wx + 13, wy + 2);
    ctx.lineTo(wx + 13, wy + 24);
    ctx.moveTo(wx + 2, wy + 13);
    ctx.lineTo(wx + 24, wy + 13);
    ctx.stroke();

    // Window Planter Box with Blooming Flowers
    ctx.fillStyle = "#78350f";
    ctx.fillRect(wx, wy + 22, 26, 5);
    ctx.fillStyle = "#15803d";
    ctx.fillRect(wx + 2, wy + 19, 22, 4);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(wx + 4, wy + 18, 3, 3);
    ctx.fillRect(wx + 12, wy + 18, 3, 3);
    ctx.fillRect(wx + 19, wy + 18, 3, 3);
  };

  drawBayWindow(b1X + 16, b1Y + 44);
  drawBayWindow(b1X + b1W - 42, b1Y + 44);

  // Grand Portico & Carved Oak Double Entrance Doors
  const dX = b1X + b1W / 2 - 20;
  const dY = b1Y + b1H - 46;

  // Arched Stone Portico Frame
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(dX - 4, dY - 4, 48, 46);
  ctx.fillStyle = "#475569";
  ctx.fillRect(dX - 2, dY - 2, 44, 44);
  ctx.fillStyle = "#fbbf24"; // Keystone
  ctx.fillRect(dX + 18, dY - 5, 4, 5);

  // Double Oak Door Body
  ctx.fillStyle = "#451a03";
  ctx.fillRect(dX, dY, 40, 42);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(dX + 2, dY + 2, 17, 38);
  ctx.fillRect(dX + 21, dY + 2, 17, 38);

  // Door Iron Strap Hinges & Brass Knockers
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(dX + 2, dY + 10, 8, 2);
  ctx.fillRect(dX + 2, dY + 28, 8, 2);
  ctx.fillRect(dX + 30, dY + 10, 8, 2);
  ctx.fillRect(dX + 30, dY + 28, 8, 2);

  ctx.fillStyle = "#facc15"; // Brass Knockers
  ctx.fillRect(dX + 13, dY + 20, 3, 4);
  ctx.fillRect(dX + 24, dY + 20, 3, 4);

  // Flickering Iron Wall Sconce Lanterns Flanking Door
  const lanternFlicker = Math.sin(time * 0.009) * 2;
  const drawLantern = (lx: number, ly: number) => {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(lx, ly, 4, 8);
    ctx.fillStyle = `rgba(254, 240, 138, ${0.9 + lanternFlicker * 0.05})`;
    ctx.fillRect(lx - 1, ly + 2, 6, 6);
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(lx, ly + 3, 4, 4);
  };
  drawLantern(dX - 8, dY + 14);
  drawLantern(dX + 44, dY + 14);  // Hanging Wrought Iron Guild Signboard
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(dX - 28, b1Y + 24, 96, 16);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(dX - 28, b1Y + 24, 96, 16);
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillText("PROJECTS GUILD", b1X + b1W / 2, b1Y + 35);

  // =========================================================================
  // --- 2. AZRA'S AI ARCANE SANCTUARY (NE: 140x125 at x:560, y:45) ---
  // =========================================================================
  const b2X = 560;
  const b2Y = 45;
  const b2W = 140;
  const b2H = 125;

  // 1. 3D Drop Shadow on Grass
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.beginPath();
  ctx.ellipse(b2X + b2W / 2 + 4, b2Y + b2H + 2, b2W / 2 + 10, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Stepped Obsidian & Titanium Cyber Platform (Multi-Tiered Foundation)
  ctx.fillStyle = "#020617";
  ctx.fillRect(b2X + 2, b2Y + b2H - 18, b2W - 4, 18);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b2X + 4, b2Y + b2H - 15, b2W - 8, 15);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(b2X + 6, b2Y + b2H - 12, b2W - 12, 12);
  ctx.fillStyle = "#334155";
  ctx.fillRect(b2X + 8, b2Y + b2H - 12, b2W - 16, 2);

  // Laser-Etched Sapphire Fiber-Optic Circuit Traces
  ctx.strokeStyle = "#0ea5e9";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(b2X + 14, b2Y + b2H - 7);
  ctx.lineTo(b2X + b2W / 2 - 24, b2Y + b2H - 7);
  ctx.lineTo(b2X + b2W / 2 - 12, b2Y + b2H - 2);
  ctx.moveTo(b2X + b2W - 14, b2Y + b2H - 7);
  ctx.lineTo(b2X + b2W / 2 + 24, b2Y + b2H - 7);
  ctx.lineTo(b2X + b2W / 2 + 12, b2Y + b2H - 2);
  ctx.stroke();

  // Corner Power Capacitor Nodes (Blinking Blue/Cyan)
  const capBlink = Math.sin(time * 0.008) > 0;
  ctx.fillStyle = capBlink ? "#38bdf8" : "#0284c7";
  ctx.fillRect(b2X + 8, b2Y + b2H - 10, 4, 4);
  ctx.fillRect(b2X + b2W - 12, b2Y + b2H - 10, 4, 4);

  // 3. Cyber Sanctum Hull (Brushed Dark Titanium with Hex Nano-Mesh)
  ctx.fillStyle = "#090d16";
  ctx.fillRect(b2X + 8, b2Y + 44, b2W - 16, b2H - 60);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b2X + 10, b2Y + 46, b2W - 20, b2H - 64);
  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 2;
  ctx.strokeRect(b2X + 8, b2Y + 44, b2W - 16, b2H - 60);

  // Hexagonal Nano-Mesh Hull Texture
  ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
  ctx.lineWidth = 1;
  for (let hxY = b2Y + 50; hxY < b2Y + b2H - 20; hxY += 8) {
    ctx.beginPath();
    ctx.moveTo(b2X + 12, hxY);
    ctx.lineTo(b2X + b2W - 12, hxY);
    ctx.stroke();
  }

  // 4. Vertical High-Voltage Plasma Conduits with Animated Data Stream
  const dataFlow = (time * 0.02) % 32;
  ctx.fillStyle = "#022c22";
  ctx.fillRect(b2X + 16, b2Y + 46, 8, b2H - 64);
  ctx.fillRect(b2X + b2W - 24, b2Y + 46, 8, b2H - 64);
  ctx.strokeStyle = "#0ea5e9";
  ctx.lineWidth = 1;
  ctx.strokeRect(b2X + 16, b2Y + 46, 8, b2H - 64);
  ctx.strokeRect(b2X + b2W - 24, b2Y + 46, 8, b2H - 64);

  // Streaming Data Pulse Packets
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(b2X + 17, b2Y + 48 + dataFlow, 6, 7);
  ctx.fillRect(b2X + b2W - 23, b2Y + 48 + ((dataFlow + 16) % 32), 6, 7);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(b2X + 19, b2Y + 50 + dataFlow, 2, 3);
  ctx.fillRect(b2X + b2W - 21, b2Y + 50 + ((dataFlow + 16) % 32), 2, 3);

  // 5. 3D Geodesic Glass & Crystal Observatory Dome
  const domePulse = Math.sin(time * 0.005) * 4;
  // Outer Dome Atmospheric Glow
  const domeGlow = ctx.createRadialGradient(
    b2X + b2W / 2,
    b2Y + 44,
    10,
    b2X + b2W / 2,
    b2Y + 44,
    b2W / 2 - 10
  );
  domeGlow.addColorStop(0, "rgba(56, 189, 248, 0.45)");
  domeGlow.addColorStop(0.7, "rgba(14, 165, 233, 0.25)");
  domeGlow.addColorStop(1, "rgba(2, 6, 23, 0.9)");

  ctx.fillStyle = domeGlow;
  ctx.beginPath();
  ctx.arc(b2X + b2W / 2, b2Y + 46, b2W / 2 - 14, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Geodesic Faceted Rib Network (Triangular Crystal Structural Web)
  ctx.strokeStyle = "rgba(186, 230, 253, 0.65)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(b2X + b2W / 2, b2Y + 46, b2W / 2 - 28, Math.PI, 0);
  ctx.stroke();

  // Geodesic Diagonal Trusses
  ctx.beginPath();
  ctx.moveTo(b2X + b2W / 2, b2Y - 10);
  ctx.lineTo(b2X + b2W / 2, b2Y + 46);
  ctx.moveTo(b2X + b2W / 2 - 42, b2Y + 46);
  ctx.lineTo(b2X + b2W / 2 - 20, b2Y + 16);
  ctx.lineTo(b2X + b2W / 2, b2Y - 10);
  ctx.lineTo(b2X + b2W / 2 + 20, b2Y + 16);
  ctx.lineTo(b2X + b2W / 2 + 42, b2Y + 46);
  ctx.moveTo(b2X + b2W / 2 - 34, b2Y + 28);
  ctx.lineTo(b2X + b2W / 2 + 34, b2Y + 28);
  ctx.stroke();

  // Glass Specular Sheen Reflections
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.beginPath();
  ctx.moveTo(b2X + b2W / 2 - 30, b2Y + 10);
  ctx.lineTo(b2X + b2W / 2 - 15, b2Y + 2);
  ctx.lineTo(b2X + b2W / 2 - 20, b2Y + 24);
  ctx.closePath();
  ctx.fill();

  // 6. Floating Gemini AI Core Matrix (Central Radiant Orb & Gyroscopic Rings)
  const coreGrad = ctx.createRadialGradient(
    b2X + b2W / 2,
    b2Y + 24 + domePulse,
    2,
    b2X + b2W / 2,
    b2Y + 24 + domePulse,
    28
  );
  coreGrad.addColorStop(0, "#ffffff");
  coreGrad.addColorStop(0.3, "#67e8f9");
  coreGrad.addColorStop(0.6, "#0284c7");
  coreGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(b2X + b2W / 2, b2Y + 24 + domePulse, 28, 0, Math.PI * 2);
  ctx.fill();

  // Counter-Rotating Gyroscopic Energy Rings
  const ringRot1 = time * 0.003;
  const ringRot2 = -time * 0.004;
  ctx.strokeStyle = "#a5f3fc";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(b2X + b2W / 2, b2Y + 24 + domePulse, 18, 7, ringRot1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#38bdf8";
  ctx.beginPath();
  ctx.ellipse(b2X + b2W / 2, b2Y + 24 + domePulse, 18, 7, ringRot2, 0, Math.PI * 2);
  ctx.stroke();

  // Orbiting Magic Sparkle Glyph Runes
  const runeAngle = time * 0.004;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(b2X + b2W / 2 + Math.cos(runeAngle) * 22 - 1, b2Y + 24 + domePulse + Math.sin(runeAngle) * 10 - 1, 3, 3);
  ctx.fillRect(b2X + b2W / 2 - Math.cos(runeAngle) * 22 - 1, b2Y + 24 + domePulse - Math.sin(runeAngle) * 10 - 1, 3, 3);
  ctx.fillRect(b2X + b2W / 2 + Math.sin(runeAngle) * 12 - 1, b2Y + 24 + domePulse - Math.cos(runeAngle) * 16 - 1, 3, 3);

  // 7. Twin Flanking Crystal Spire Pylons (Floating Anti-Gravity Levitation)
  const drawPylon = (px: number) => {
    ctx.fillStyle = "#020617";
    ctx.fillRect(px, b2Y + 14, 14, 32);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(px + 2, b2Y + 16, 10, 28);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, b2Y + 14, 14, 32);

    // Floating Levitation Torus Ring
    const ringFloat = Math.sin(time * 0.006 + px) * 3;
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(px + 7, b2Y + 10 + ringFloat, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Floating Prismatic Crystal Spire
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(px + 7, b2Y - 2 + ringFloat);
    ctx.lineTo(px + 14, b2Y + 10 + ringFloat);
    ctx.lineTo(px, b2Y + 10 + ringFloat);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(px + 5, b2Y + 2 + ringFloat, 3, 5);
  };
  drawPylon(b2X + 4);
  drawPylon(b2X + b2W - 18);

  // 8. Hexagonal Holographic Energy Portal Door
  const hx = b2X + b2W / 2;
  const hy = b2Y + b2H - 26;
  ctx.fillStyle = "#020617";
  ctx.fillRect(hx - 24, hy - 22, 48, 44);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.strokeRect(hx - 24, hy - 22, 48, 44);

  // Translucent Energy Barrier Matrix with Scrolling Glyphs
  ctx.fillStyle = "rgba(14, 165, 233, 0.4)";
  ctx.fillRect(hx - 20, hy - 18, 40, 40);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx - 20, hy - 2);
  ctx.lineTo(hx + 20, hy - 2);
  ctx.moveTo(hx - 20, hy + 12);
  ctx.lineTo(hx + 20, hy + 12);
  ctx.stroke();

  // Portal Matrix Binary Code Streams
  const matrixShift = Math.floor(time * 0.005);
  ctx.fillStyle = "#bae6fd";
  ctx.font = "bold 5px monospace";
  ctx.textAlign = "center";
  ctx.fillText((matrixShift % 2 === 0 ? "0101" : "1010"), hx, hy + 4);
  ctx.fillText((matrixShift % 3 === 0 ? "AI//AZRA" : "GEMINI"), hx, hy + 18);

  // 9. Floating Luminous Cyber Signboard
  ctx.fillStyle = "#020617";
  ctx.fillRect(hx - 48, b2Y + 54, 96, 16);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(hx - 48, b2Y + 54, 96, 16);
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillText("AZRA AI SANCTUARY", hx, b2Y + 65);

  // =========================================================================
  // --- 3. DEVOPS & TELEMETRY POWER STATION (Mid-West: 140x110 at x:60, y:260) ---
  // =========================================================================
  const b3X = 60;
  const b3Y = 260;
  const b3W = 140;
  const b3H = 110;

  // 3D Drop Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.beginPath();
  ctx.ellipse(b3X + b3W / 2 + 4, b3Y + b3H + 2, b3W / 2 + 8, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Heavy Concrete Base with Hazard Safety Stripes
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(b3X + 4, b3Y + b3H - 16, b3W - 8, 16);
  ctx.fillStyle = "#334155";
  ctx.fillRect(b3X + 6, b3Y + b3H - 14, b3W - 12, 12);
  // Diagonal Yellow/Black Hazard Stripes
  for (let hz = b3X + 8; hz < b3X + b3W - 16; hz += 14) {
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.moveTo(hz, b3Y + b3H - 14);
    ctx.lineTo(hz + 6, b3Y + b3H - 14);
    ctx.lineTo(hz + 2, b3Y + b3H - 2);
    ctx.lineTo(hz - 4, b3Y + b3H - 2);
    ctx.closePath();
    ctx.fill();
  }

  // Corrugated Metal Siding (Emerald Industrial Steel)
  ctx.fillStyle = "#064e3b";
  ctx.fillRect(b3X + 8, b3Y + 36, b3W - 16, b3H - 50);
  ctx.strokeStyle = "#059669";
  ctx.lineWidth = 2;
  ctx.strokeRect(b3X + 8, b3Y + 36, b3W - 16, b3H - 50);

  // Vertical Corrugation Ribs & Rivets
  ctx.strokeStyle = "rgba(52, 211, 153, 0.3)";
  ctx.lineWidth = 1;
  for (let cxRib = b3X + 16; cxRib < b3X + b3W - 16; cxRib += 8) {
    ctx.beginPath();
    ctx.moveTo(cxRib, b3Y + 38);
    ctx.lineTo(cxRib, b3Y + b3H - 16);
    ctx.stroke();
    // Rivet Dots
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(cxRib - 1, b3Y + 40, 2, 2);
    ctx.fillRect(cxRib - 1, b3Y + b3H - 20, 2, 2);
  }

  // Corrugated Roof & Upper Mechanical Deck
  ctx.fillStyle = "#111827";
  ctx.fillRect(b3X, b3Y + 12, b3W, 26);
  ctx.fillStyle = "#10b981";
  ctx.fillRect(b3X + 12, b3Y + 16, b3W - 24, 8);
  ctx.strokeStyle = "#065f46";
  ctx.lineWidth = 2;
  ctx.strokeRect(b3X, b3Y + 12, b3W, 26);

  // Dual Rooftop Exhaust Turbine Fans (Animated Spinning Blades!)
  const fanAngle = time * 0.015;
  const drawTurbineFan = (fx: number) => {
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.ellipse(fx, b3Y + 10, 11, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Spinning Blades
    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx + Math.cos(fanAngle) * 8, b3Y + 10 + Math.sin(fanAngle) * 4);
    ctx.lineTo(fx - Math.cos(fanAngle) * 8, b3Y + 10 - Math.sin(fanAngle) * 4);
    ctx.moveTo(fx + Math.cos(fanAngle + Math.PI / 2) * 8, b3Y + 10 + Math.sin(fanAngle + Math.PI / 2) * 4);
    ctx.lineTo(fx - Math.cos(fanAngle + Math.PI / 2) * 8, b3Y + 10 - Math.sin(fanAngle + Math.PI / 2) * 4);
    ctx.stroke();

    // Rising Steam Vapor
    const steamPulse = (time * 0.004 + fx) % 3;
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(fx, b3Y - 4 - steamPulse * 6, 3 + steamPulse * 1.2, 0, Math.PI * 2);
    ctx.fill();
  };
  drawTurbineFan(b3X + 38);
  drawTurbineFan(b3X + b3W - 38);

  // Radio Telemetry Lattice Mast & Blinking Beacon
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(b3X + b3W / 2 - 2, b3Y - 20, 4, 34);
  // Cross Bracing on Mast
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(b3X + b3W / 2 - 8, b3Y - 14);
  ctx.lineTo(b3X + b3W / 2 + 8, b3Y + 12);
  ctx.moveTo(b3X + b3W / 2 + 8, b3Y - 14);
  ctx.lineTo(b3X + b3W / 2 - 8, b3Y + 12);
  ctx.stroke();

  const beaconBlink = Math.sin(time * 0.008) > 0;
  ctx.fillStyle = beaconBlink ? "#34d399" : "#065f46";
  ctx.beginPath();
  ctx.arc(b3X + b3W / 2, b3Y - 22, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  if (beaconBlink) ctx.fillRect(b3X + b3W / 2 - 1, b3Y - 23, 2, 2);

  // Live Telemetry Server Room Windows (Blinking Activity Lights)
  const drawServerWindow = (wx: number, wy: number) => {
    ctx.fillStyle = "#022c22";
    ctx.fillRect(wx, wy, 28, 26);
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(wx, wy, 28, 26);

    // Blinking Server Rack LEDs
    const ledTick = Math.floor(time * 0.005);
    ctx.fillStyle = (ledTick + wx) % 2 === 0 ? "#34d399" : "#065f46";
    ctx.fillRect(wx + 4, wy + 5, 20, 3);
    ctx.fillStyle = (ledTick + wx) % 3 === 0 ? "#38bdf8" : "#0369a1";
    ctx.fillRect(wx + 4, wy + 11, 16, 3);
    ctx.fillStyle = (ledTick + wx) % 2 === 1 ? "#fbbf24" : "#b45309";
    ctx.fillRect(wx + 4, wy + 17, 18, 3);
  };
  drawServerWindow(b3X + 16, b3Y + 48);
  drawServerWindow(b3X + b3W - 44, b3Y + 48);

  // Heavy Vault Blast Door
  const sdX = b3X + b3W / 2 - 20;
  const sdY = b3Y + b3H - 46;
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(sdX - 2, sdY - 2, 44, 44);
  ctx.fillStyle = "#334155";
  ctx.fillRect(sdX, sdY, 40, 42);
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sdX, sdY, 40, 42);

  // Pneumatic Pistons & Electronic Keypad
  ctx.fillStyle = "#64748b";
  ctx.fillRect(sdX + 4, sdY + 6, 32, 4);
  ctx.fillRect(sdX + 4, sdY + 30, 32, 4);
  ctx.fillStyle = "#34d399";
  ctx.fillRect(sdX + 28, sdY + 16, 6, 8);

  // Stenciled Facility Sign
  ctx.fillStyle = "#111827";
  ctx.fillRect(b3X + b3W / 2 - 42, b3Y + 28, 84, 15);
  ctx.strokeStyle = "#10b981";
  ctx.strokeRect(b3X + b3W / 2 - 42, b3Y + 28, 84, 15);
  ctx.fillStyle = "#34d399";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillText("DEVOPS 24/7 PLANT", b3X + b3W / 2, b3Y + 39);

  // =========================================================================
  // --- 4. ACADEMY OF ENVERGA DOJO (SW: 140x110 at x:60, y:560) ---
  // =========================================================================
  const b4X = 60;
  const b4Y = 560;
  const b4W = 140;
  const b4H = 110;

  // 1. 3D Drop Shadow on Lawn
  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.beginPath();
  ctx.ellipse(b4X + b4W / 2 + 4, b4Y + b4H + 2, b4W / 2 + 8, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Stepped Ashlar Granite Plinth Foundation
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b4X + 4, b4Y + b4H - 16, b4W - 8, 16);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(b4X + 6, b4Y + b4H - 14, b4W - 12, 14);
  ctx.fillStyle = "#334155";
  ctx.fillRect(b4X + 8, b4Y + b4H - 12, b4W - 16, 10);
  ctx.fillStyle = "#64748b";
  ctx.fillRect(b4X + 8, b4Y + b4H - 12, b4W - 16, 2);

  // Carved Stone Relief Joints
  ctx.fillStyle = "#475569";
  for (let sx = b4X + 16; sx < b4X + b4W - 16; sx += 18) {
    ctx.fillRect(sx, b4Y + b4H - 10, 1, 8);
  }

  // 3. Lacquered Crimson Wood Walls with Structural Timber Studs
  ctx.fillStyle = "#5c0e0e";
  ctx.fillRect(b4X + 10, b4Y + 36, b4W - 20, b4H - 50);
  ctx.fillStyle = "#7f1d1d";
  ctx.fillRect(b4X + 12, b4Y + 38, b4W - 24, b4H - 52);

  // Wood Battens & Grain Texture
  ctx.strokeStyle = "rgba(220, 38, 38, 0.25)";
  ctx.lineWidth = 1;
  for (let bx = b4X + 18; bx < b4X + b4W - 18; bx += 8) {
    ctx.beginPath();
    ctx.moveTo(bx, b4Y + 40);
    ctx.lineTo(bx, b4Y + b4H - 16);
    ctx.stroke();
  }

  // 4. Vermilion Structural Pillars with Gold Dougong Bracket Capitals
  const drawDojoPillar = (px: number) => {
    ctx.fillStyle = "#450a0a";
    ctx.fillRect(px, b4Y + 34, 9, b4H - 46);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(px + 1, b4Y + 34, 7, b4H - 46);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(px + 2, b4Y + 36, 2, b4H - 50); // Pillar highlight

    // Multi-Tiered Gold Dougong Bracket Capital (Tokyō)
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(px - 3, b4Y + 34, 15, 3);
    ctx.fillRect(px - 1, b4Y + 37, 11, 3);
    // Base Plinth Fitting
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(px - 2, b4Y + b4H - 16, 13, 4);
  };
  drawDojoPillar(b4X + 12);
  drawDojoPillar(b4X + 44);
  drawDojoPillar(b4X + b4W - 53);
  drawDojoPillar(b4X + b4W - 21);

  // 5. Traditional 3D Curved Pagoda Clay Tile Roof (Irimoya-zukuri Style)
  ctx.fillStyle = "#260606"; // Under-eave shadow
  ctx.fillRect(b4X - 2, b4Y + 36, b4W + 4, 4);

  // Curved Pagoda Roof Slope
  ctx.fillStyle = "#7f1d1d";
  ctx.beginPath();
  ctx.moveTo(b4X - 6, b4Y + 38);
  ctx.quadraticCurveTo(b4X + 18, b4Y + 30, b4X + 26, b4Y + 2);
  ctx.lineTo(b4X + b4W - 26, b4Y + 2);
  ctx.quadraticCurveTo(b4X + b4W - 18, b4Y + 30, b4X + b4W + 6, b4Y + 38);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#f59e0b"; // Gold Eave Trim
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Overlapping Terracotta Kawara Roof Tile Texture Lines
  for (let ry = b4Y + 6; ry < b4Y + 36; ry += 5) {
    const rProgress = (b4Y + 38 - ry) / 32;
    const rxInset = rProgress * 26;
    ctx.strokeStyle = ry % 10 === 0 ? "#b91c1c" : "#991b1b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b4X - 4 + rxInset, ry);
    ctx.lineTo(b4X + b4W + 4 - rxInset, ry);
    ctx.stroke();

    // Circular Eave Kawara Tile Ends (Tomoe Tiles)
    ctx.fillStyle = "#f59e0b";
    for (let tx = b4X - 2 + rxInset; tx < b4X + b4W + 2 - rxInset; tx += 9) {
      ctx.fillRect(tx, ry - 1, 2, 2);
    }
  }

  // Upturned Eaves with Shachihoko Gold Finials & Hanging Wind Bells (Fūrin)
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(b4X - 8, b4Y + 34, 8, 5);
  ctx.fillRect(b4X + b4W, b4Y + 34, 8, 5);
  ctx.fillRect(b4X + 24, b4Y - 2, b4W - 48, 4); // Roof Ridge
  ctx.fillRect(b4X + b4W / 2 - 8, b4Y - 8, 16, 8); // Center Crest Spire

  // Hanging Bronze Wind Bells (Fūrin)
  const bellSway = Math.sin(time * 0.005) * 2;
  const drawFurin = (bx: number, by: number) => {
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + bellSway, by + 6);
    ctx.stroke();
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(bx + bellSway, by + 7, 2.5, 0, Math.PI * 2);
    ctx.fill();
  };
  drawFurin(b4X - 6, b4Y + 39);
  drawFurin(b4X + b4W + 6, b4Y + 39);

  // 6. Authentic Shoji Sliding Screens (Washi Paper with Kumiko Geometric Lattice)
  const shX = b4X + b4W / 2 - 24;
  const shY = b4Y + b4H - 46;
  ctx.fillStyle = "#450a0a";
  ctx.fillRect(shX - 2, shY - 2, 52, 46);

  // Translucent Glowing Washi Paper
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(shX, shY, 23, 42);
  ctx.fillRect(shX + 25, shY, 23, 42);

  // Kumiko Wood Lattice Grid
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 1;
  ctx.strokeRect(shX, shY, 23, 42);
  ctx.strokeRect(shX + 25, shY, 23, 42);
  for (let gy = shY + 7; gy < shY + 42; gy += 7) {
    ctx.beginPath();
    ctx.moveTo(shX, gy);
    ctx.lineTo(shX + 23, gy);
    ctx.moveTo(shX + 25, gy);
    ctx.lineTo(shX + 48, gy);
    ctx.stroke();
  }
  for (let gx = shX + 7; gx < shX + 23; gx += 7) {
    ctx.beginPath();
    ctx.moveTo(gx, shY);
    ctx.lineTo(gx, shY + 42);
    ctx.moveTo(gx + 25, shY);
    ctx.lineTo(gx + 25, shY + 42);
    ctx.stroke();
  }

  // 7. Flanking Stone Honor Lanterns (Tōrō) with Flickering Candlelight
  const drawToro = (lx: number) => {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(lx - 1, b4Y + b4H - 10, 12, 10);
    ctx.fillStyle = "#334155";
    ctx.fillRect(lx, b4Y + b4H - 26, 10, 18);
    ctx.fillStyle = "#475569";
    ctx.fillRect(lx - 2, b4Y + b4H - 28, 14, 4);

    // Warm Flickering Candlelight Core
    const fireFlicker = Math.sin(time * 0.015 + lx) * 0.5;
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(lx + 1, b4Y + b4H - 24, 8, 8);
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(lx + 3 + fireFlicker, b4Y + b4H - 22, 4, 5);

    // Pagoda Stone Roof
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.moveTo(lx - 4, b4Y + b4H - 28);
    ctx.lineTo(lx + 5, b4Y + b4H - 34);
    ctx.lineTo(lx + 14, b4Y + b4H - 28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(lx + 4, b4Y + b4H - 36, 2, 3);
  };
  drawToro(b4X + 20);
  drawToro(b4X + b4W - 30);

  // 8. Gold-Framed Academic Honors Tablet Plaque
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b4X + b4W / 2 - 46, b4Y + 22, 92, 15);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(b4X + b4W / 2 - 46, b4Y + 22, 92, 15);
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ACADEMY OF ENVERGA", b4X + b4W / 2, b4Y + 33);

  // =========================================================================
  // --- 5. FRANZE'S GAMER COTTAGE & PS5 LOUNGE (SE: 140x110 at x:560, y:535) ---
  // =========================================================================
  const b5X = 560;
  const b5Y = 535;
  const b5W = 140;
  const b5H = 110;

  // 1. 3D Drop Shadow on Lawn
  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.beginPath();
  ctx.ellipse(b5X + b5W / 2 + 4, b5Y + b5H + 2, b5W / 2 + 8, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Stepped Fieldstone & Slate Foundation Plinth
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b5X + 4, b5Y + b5H - 16, b5W - 8, 16);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(b5X + 6, b5Y + b5H - 14, b5W - 12, 14);
  ctx.fillStyle = "#334155";
  ctx.fillRect(b5X + 8, b5Y + b5H - 12, b5W - 16, 10);
  ctx.fillStyle = "#475569";
  ctx.fillRect(b5X + 8, b5Y + b5H - 12, b5W - 16, 2);

  // Fieldstone Joint Notches
  ctx.fillStyle = "#64748b";
  for (let fx = b5X + 16; fx < b5X + b5W - 16; fx += 16) {
    ctx.fillRect(fx, b5Y + b5H - 10, 8, 4);
    ctx.fillRect(fx + 8, b5Y + b5H - 6, 7, 4);
  }

  // 3. Cedar Clapboard & Slate Timber Walls
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(b5X + 8, b5Y + 36, b5W - 16, b5H - 50);
  ctx.fillStyle = "#334155";
  ctx.fillRect(b5X + 10, b5Y + 38, b5W - 20, b5H - 52);

  // Horizontal Cedar Board Siding with Wood Grain Notches
  ctx.strokeStyle = "rgba(15, 23, 42, 0.8)";
  ctx.lineWidth = 1;
  for (let cySiding = b5Y + 44; cySiding < b5Y + b5H - 14; cySiding += 7) {
    ctx.beginPath();
    ctx.moveTo(b5X + 10, cySiding);
    ctx.lineTo(b5X + b5W - 10, cySiding);
    ctx.stroke();
    // Wood grain knots
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(b5X + 24 + ((cySiding * 7) % 80), cySiding + 2, 3, 1.5);
  }

  // Heavy Dark Cedar Corner Post Beams
  ctx.fillStyle = "#451a03";
  ctx.fillRect(b5X + 8, b5Y + 36, 5, b5H - 50);
  ctx.fillRect(b5X + b5W - 13, b5Y + 36, 5, b5H - 50);

  // 4. 3D Multi-Pitch Cedar Wood Shake Roof with Overhang
  ctx.fillStyle = "#260606"; // Under-eave shadow
  ctx.fillRect(b5X + 2, b5Y + 36, b5W - 4, 6);

  ctx.fillStyle = "#78350f"; // Main Cedar Shake
  ctx.beginPath();
  ctx.moveTo(b5X, b5Y + 38);
  ctx.lineTo(b5X + 24, b5Y);
  ctx.lineTo(b5X + b5W - 24, b5Y);
  ctx.lineTo(b5X + b5W, b5Y + 38);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#b45309";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Roof Shingle Overlap Texture Lines & Individual Shingles
  for (let sry = b5Y + 6; sry < b5Y + 36; sry += 5) {
    const sProgress = (b5Y + 38 - sry) / 38;
    const sInset = sProgress * 24;
    ctx.strokeStyle = sry % 10 === 0 ? "#92400e" : "rgba(251, 191, 36, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b5X + sInset, sry);
    ctx.lineTo(b5X + b5W - sInset, sry);
    ctx.stroke();

    // Wood Shake Shingle Vertical Slits
    ctx.fillStyle = "#451a03";
    for (let shx = b5X + sInset + 6; shx < b5X + b5W - sInset - 6; shx += 7) {
      ctx.fillRect(shx, sry - 3, 1, 4);
    }
  }

  // Center Attic Dormer Gable Window with Stained Glass Glow
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b5X + b5W / 2 - 14, b5Y + 8, 28, 20);
  ctx.fillStyle = "#78350f";
  ctx.beginPath();
  ctx.moveTo(b5X + b5W / 2 - 16, b5Y + 12);
  ctx.lineTo(b5X + b5W / 2, b5Y + 2);
  ctx.lineTo(b5X + b5W / 2 + 16, b5Y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Dormer Amber Window Glow
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(b5X + b5W / 2 - 8, b5Y + 14, 16, 12);
  ctx.strokeStyle = "#451a03";
  ctx.lineWidth = 1;
  ctx.strokeRect(b5X + b5W / 2 - 8, b5Y + 14, 16, 12);

  // 5. Fieldstone Chimney with Rising Animated Smoke Puffs
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(b5X + b5W - 32, b5Y - 16, 18, 26);
  ctx.fillStyle = "#475569";
  ctx.fillRect(b5X + b5W - 30, b5Y - 14, 14, 24);
  // Fieldstone Texture Notches
  ctx.fillStyle = "#334155";
  ctx.fillRect(b5X + b5W - 28, b5Y - 10, 5, 4);
  ctx.fillRect(b5X + b5W - 22, b5Y - 4, 4, 4);

  const cottageSmoke = (time * 0.003 + 1) % 4;
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.beginPath();
  ctx.arc(b5X + b5W - 23, b5Y - 22 - cottageSmoke * 8, 4 + cottageSmoke * 1.5, 0, Math.PI * 2);
  ctx.arc(b5X + b5W - 18 + Math.sin(time * 0.004) * 4, b5Y - 32 - cottageSmoke * 8, 6 + cottageSmoke, 0, Math.PI * 2);
  ctx.fill();

  // 6. Grand Panoramic Gamer Bay Window (Live RGB PS5 Setup & TV Screen!)
  const gx = b5X + 16;
  const gy = b5Y + 46;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(gx, gy, 52, 34);
  ctx.strokeStyle = "#8b5cf6";
  ctx.lineWidth = 2;
  ctx.strokeRect(gx, gy, 52, 34);

  // Ambient RGB Backlight Glow behind TV
  const rgbHue = (time * 0.05) % 360;
  ctx.fillStyle = `hsla(${rgbHue}, 85%, 60%, 0.25)`;
  ctx.fillRect(gx + 2, gy + 2, 48, 30);

  // TV Screen Displaying Animated Retro Gameplay
  ctx.fillStyle = "#020617";
  ctx.fillRect(gx + 4, gy + 4, 28, 22);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 1;
  ctx.strokeRect(gx + 4, gy + 4, 28, 22);

  // Animated Gameplay Graphics on Screen (Retro Player + Platform)
  const gamePlayerY = gy + 14 + Math.sin(time * 0.01) * 3;
  ctx.fillStyle = "#22c55e"; // Ground Platform
  ctx.fillRect(gx + 6, gy + 20, 24, 4);
  ctx.fillStyle = "#ef4444"; // Jumping Sprite
  ctx.fillRect(gx + 12, gamePlayerY, 5, 5);
  ctx.fillStyle = "#facc15"; // Collectible Coin
  ctx.fillRect(gx + 22, gy + 10, 3, 3);
  ctx.fillStyle = "#ffffff"; // Health Bar HUD
  ctx.fillRect(gx + 6, gy + 6, 8, 2);

  // Illuminated White PS5 Console Tower with Blue LED Glow
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(gx + 36, gy + 8, 6, 20);
  ctx.fillStyle = "#0284c7"; // Blue LED Strip
  ctx.fillRect(gx + 38, gy + 9, 2, 18);
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(gx + 39, gy + 10, 1, 16);

  // DualSense Controllers on Desk
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(gx + 44, gy + 20, 5, 4);
  ctx.fillStyle = "#0284c7";
  ctx.fillRect(gx + 45, gy + 21, 3, 2);

  // 7. Glowing Purple PlayStation Controller Neon Sign
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b5X + b5W / 2 - 38, b5Y + 12, 76, 18);
  ctx.strokeStyle = "#a855f7";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(b5X + b5W / 2 - 38, b5Y + 12, 76, 18);
  ctx.fillStyle = "#c084fc";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillText("PS5 GAMER LOUNGE", b5X + b5W / 2, b5Y + 24);

  // 8. Cottage Entrance Door & Cedar Porch Deck
  const gdx = b5X + b5W - 54;
  const gdy = b5Y + b5H - 46;

  // Porch Steps & Deck Planks
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(gdx - 2, gdy + 34, 46, 12);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(gdx, gdy + 36, 42, 8);
  ctx.fillStyle = "#b45309";
  ctx.fillRect(gdx, gdy + 36, 42, 2);

  // Front Door
  ctx.fillStyle = "#451a03";
  ctx.fillRect(gdx + 6, gdy, 30, 36);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(gdx + 8, gdy + 2, 26, 32);
  ctx.fillStyle = "#fbbf24"; // Brass Knob
  ctx.fillRect(gdx + 28, gdy + 18, 3, 3);

  // Porch Entry Warm Lantern Sconce
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(gdx, gdy + 12, 4, 8);
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(gdx - 1, gdy + 14, 6, 6);

  // =========================================================================
  // --- 6. VILLAGE POST & COURIER LODGE (North Plaza at x:350, y:55, w:130, h:95) ---
  // =========================================================================
  const b6X = 350;
  const b6Y = 55;
  const b6W = 130;
  const b6H = 95;

  // 1. 3D Drop Shadow on Grass
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.beginPath();
  ctx.ellipse(b6X + b6W / 2 + 4, b6Y + b6H + 2, b6W / 2 + 6, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Multi-Tone Cobblestone / Basalt Foundation Plinth
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b6X + 4, b6Y + b6H - 16, b6W - 8, 16);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(b6X + 6, b6Y + b6H - 14, b6W - 12, 12);
  ctx.fillStyle = "#334155";
  ctx.fillRect(b6X + 8, b6Y + b6H - 14, b6W - 16, 3);
  // Staggered Foundation Cobblestone Joints
  ctx.fillStyle = "#475569";
  for (let fx = b6X + 12; fx < b6X + b6W - 16; fx += 14) {
    ctx.fillRect(fx, b6Y + b6H - 11, 10, 4);
    ctx.fillRect(fx + 6, b6Y + b6H - 6, 8, 4);
  }

  // 3. Tudor Stucco Plaster Walls (Warm Ivory / Sandstone)
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(b6X + 8, b6Y + 32, b6W - 16, b6H - 46);
  // Plaster subtle texture & peeking brick courses
  ctx.fillStyle = "#fde68a";
  ctx.fillRect(b6X + 16, b6Y + 42, 22, 12);
  ctx.fillRect(b6X + b6W - 40, b6Y + 60, 20, 10);
  ctx.fillStyle = "#b45309"; // Peeking clay brick patch
  ctx.fillRect(b6X + 18, b6Y + 44, 8, 3);
  ctx.fillRect(b6X + 28, b6Y + 44, 8, 3);
  ctx.fillRect(b6X + 22, b6Y + 48, 9, 3);

  // 4. Heavy Dark Oak Half-Timbering Framing Beams (X-braces, studs & lintels)
  ctx.fillStyle = "#451a03";
  // Outer Border Frame
  ctx.fillRect(b6X + 8, b6Y + 32, b6W - 16, 4); // Top eave lintel
  ctx.fillRect(b6X + 8, b6Y + b6H - 18, b6W - 16, 3); // Base sill
  ctx.fillRect(b6X + 8, b6Y + 32, 6, b6H - 47); // Left corner post
  ctx.fillRect(b6X + b6W - 14, b6Y + 32, 6, b6H - 47); // Right corner post

  // Timber Highlights (Top edge bevels)
  ctx.fillStyle = "#78350f";
  ctx.fillRect(b6X + 9, b6Y + 33, b6W - 18, 2);
  ctx.fillRect(b6X + 9, b6Y + 33, 4, b6H - 49);
  ctx.fillRect(b6X + b6W - 13, b6Y + 33, 4, b6H - 49);

  // Diagonal Tudor Cross-Braces (X-Bracing) on Left & Right Panels
  const drawTimberX = (tx: number, ty: number, tw: number, th: number) => {
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + tw, ty + th);
    ctx.moveTo(tx + tw, ty);
    ctx.lineTo(tx, ty + th);
    ctx.stroke();
    // Inner wood grain highlight
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + tw, ty + th);
    ctx.moveTo(tx + tw, ty);
    ctx.lineTo(tx, ty + th);
    ctx.stroke();
  };
  drawTimberX(b6X + 16, b6Y + 36, 18, 24);
  drawTimberX(b6X + b6W - 36, b6Y + 36, 18, 24);

  // Vertical Stud Posts
  ctx.fillStyle = "#451a03";
  ctx.fillRect(b6X + 38, b6Y + 32, 4, b6H - 47);
  ctx.fillRect(b6X + b6W - 42, b6Y + 32, 4, b6H - 47);

  // 5. Terracotta Scalloped Tile Hip Roof with 3D Overhang
  ctx.fillStyle = "#260606"; // Under-eave shadow
  ctx.fillRect(b6X + 2, b6Y + 32, b6W - 4, 4);

  // Main Terracotta Roof Slope
  ctx.fillStyle = "#7f1d1d";
  ctx.beginPath();
  ctx.moveTo(b6X - 2, b6Y + 34);
  ctx.lineTo(b6X + 24, b6Y);
  ctx.lineTo(b6X + b6W - 24, b6Y);
  ctx.lineTo(b6X + b6W + 2, b6Y + 34);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#b91c1c";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Scalloped Tile Texture Courses
  for (let rsy = b6Y + 6; rsy < b6Y + 32; rsy += 5) {
    const sInset = ((b6Y + 34 - rsy) / 34) * 24;
    ctx.strokeStyle = rsy % 10 === 0 ? "#dc2626" : "#991b1b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b6X + sInset, rsy);
    ctx.lineTo(b6X + b6W - sInset, rsy);
    ctx.stroke();

    // Individual Shingle Ridge Notches
    ctx.fillStyle = "#d97706";
    for (let rx = b6X + sInset + 6; rx < b6X + b6W - sInset - 6; rx += 8) {
      ctx.fillRect(rx, rsy - 2, 2, 2);
    }
  }

  // Golden Roof Ridge Cap
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(b6X + 22, b6Y - 1, b6W - 44, 3);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(b6X + 24, b6Y - 1, b6W - 48, 1);

  // Rooftop Brick Chimney with Smoke Puff
  ctx.fillStyle = "#7f1d1d";
  ctx.fillRect(b6X + 24, b6Y - 12, 10, 14);
  ctx.fillStyle = "#450a0a";
  ctx.fillRect(b6X + 22, b6Y - 14, 14, 3);
  const postSmoke = (time * 0.003 + 2) % 3;
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.beginPath();
  ctx.arc(b6X + 29, b6Y - 18 - postSmoke * 5, 2.5 + postSmoke, 0, Math.PI * 2);
  ctx.fill();

  // 6. Polished 3D Brass Courier Horn Crest Medallion
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(b6X + b6W / 2, b6Y + 16, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Golden Post Horn Icon
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b6X + b6W / 2, b6Y + 16, 5, 0, Math.PI * 1.5);
  ctx.lineTo(b6X + b6W / 2 + 5, b6Y + 16);
  ctx.stroke();
  ctx.fillStyle = "#facc15";
  ctx.fillRect(b6X + b6W / 2 + 3, b6Y + 14, 3, 4);

  // 7. Royal Brass Mailbox & Parcel Box on Porch
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b6X + 18, b6Y + 60, 16, 18);
  ctx.fillStyle = "#ca8a04";
  ctx.fillRect(b6X + 19, b6Y + 61, 14, 16);
  ctx.fillStyle = "#facc15";
  ctx.fillRect(b6X + 20, b6Y + 62, 12, 3); // Mail drop slot
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b6X + 22, b6Y + 63, 8, 1);
  ctx.fillStyle = "#78350f"; // Wood Parcel Package beside mailbox
  ctx.fillRect(b6X + 12, b6Y + 68, 6, 8);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(b6X + 12, b6Y + 68, 6, 8);

  // 8. Leaded Diamond-Lattice Casement Post Window (Warm Interior Glow)
  ctx.fillStyle = "#451a03";
  ctx.fillRect(b6X + b6W - 38, b6Y + 48, 22, 22);
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(b6X + b6W - 36, b6Y + 50, 18, 18);
  // Diamond Lattice Came Grids
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(b6X + b6W - 27, b6Y + 50);
  ctx.lineTo(b6X + b6W - 27, b6Y + 68);
  ctx.moveTo(b6X + b6W - 36, b6Y + 59);
  ctx.lineTo(b6X + b6W - 18, b6Y + 59);
  ctx.stroke();

  // 9. Gilded Oak Signboard
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b6X + b6W / 2 - 44, b6Y + 24, 88, 14);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(b6X + b6W / 2 - 44, b6Y + 24, 88, 14);
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.fillText("VILLAGE POST", b6X + b6W / 2, b6Y + 34);

  // 10. Tudor Oak Entrance Door with Brass Knob & Sconce Lantern
  ctx.fillStyle = "#451a03";
  ctx.fillRect(b6X + b6W / 2 - 13, b6Y + b6H - 42, 26, 40);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(b6X + b6W / 2 - 11, b6Y + b6H - 40, 22, 36);
  // Door Coffered Wood Panels
  ctx.strokeStyle = "#451a03";
  ctx.lineWidth = 1;
  ctx.strokeRect(b6X + b6W / 2 - 9, b6Y + b6H - 37, 8, 14);
  ctx.strokeRect(b6X + b6W / 2 + 1, b6Y + b6H - 37, 8, 14);
  ctx.strokeRect(b6X + b6W / 2 - 9, b6Y + b6H - 19, 8, 12);
  ctx.strokeRect(b6X + b6W / 2 + 1, b6Y + b6H - 19, 8, 12);
  // Brass Handle
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(b6X + b6W / 2 + 5, b6Y + b6H - 24, 2.5, 3);

  // Entry Porch Lantern Sconce
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(b6X + b6W / 2 - 18, b6Y + b6H - 32, 3, 6);
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(b6X + b6W / 2 - 20, b6Y + b6H - 30, 4, 4);

  // =========================================================================
  // --- 7. CAREER & WORK EXPERIENCE ARCHIVES (East Quarter: 140x105 at x:750, y:150) ---
  // =========================================================================
  const b7X = 750;
  const b7Y = 150;
  const b7W = 140;
  const b7H = 105;

  // 1. 3D Drop Shadow on Grass
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.beginPath();
  ctx.ellipse(b7X + b7W / 2 + 4, b7Y + b7H + 2, b7W / 2 + 8, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 3-Tier Stepped Classical Marble Stylobate (Crepidoma Foundation)
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b7X + 2, b7Y + b7H - 18, b7W - 4, 18);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(b7X + 4, b7Y + b7H - 15, b7W - 8, 15);
  ctx.fillStyle = "#334155";
  ctx.fillRect(b7X + 6, b7Y + b7H - 12, b7W - 12, 12);
  ctx.fillStyle = "#64748b";
  ctx.fillRect(b7X + 8, b7Y + b7H - 9, b7W - 16, 9);
  ctx.fillStyle = "#e2e8f0"; // Top marble step highlight
  ctx.fillRect(b7X + 8, b7Y + b7H - 9, b7W - 16, 2);

  // Vertical Marble Step Joints
  ctx.fillStyle = "#94a3b8";
  for (let sx = b7X + 16; sx < b7X + b7W - 16; sx += 20) {
    ctx.fillRect(sx, b7Y + b7H - 7, 1, 6);
  }

  // 3. Classical Ashlar Stone Walls (Honed Granite & Marble)
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(b7X + 10, b7Y + 36, b7W - 20, b7H - 46);
  ctx.fillStyle = "#334155";
  ctx.fillRect(b7X + 12, b7Y + 38, b7W - 24, b7H - 48);

  // Staggered Ashlar Block Courses
  ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
  ctx.lineWidth = 1;
  for (let ay = b7Y + 44; ay < b7Y + b7H - 12; ay += 10) {
    ctx.beginPath();
    ctx.moveTo(b7X + 12, ay);
    ctx.lineTo(b7X + b7W - 12, ay);
    ctx.stroke();
  }
  for (let ay = b7Y + 44; ay < b7Y + b7H - 12; ay += 10) {
    const shift = (ay % 20 === 0) ? 0 : 12;
    for (let ax = b7X + 24 + shift; ax < b7X + b7W - 16; ax += 24) {
      ctx.beginPath();
      ctx.moveTo(ax, ay - 10);
      ctx.lineTo(ax, ay);
      ctx.stroke();
    }
  }

  // 4. 4 Fluted Ionic / Corinthian White Marble Columns with Volute Capitals
  const drawFlutedColumn = (cxPos: number) => {
    // Column Plinth Base
    ctx.fillStyle = "#64748b";
    ctx.fillRect(cxPos - 2, b7Y + b7H - 14, 14, 5);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(cxPos - 1, b7Y + b7H - 13, 12, 3);

    // Fluted Column Shaft
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(cxPos, b7Y + 36, 10, b7H - 49);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.strokeRect(cxPos, b7Y + 36, 10, b7H - 49);

    // Vertical Flute Ridges
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cxPos + 2, b7Y + 38, 1.5, b7H - 53);
    ctx.fillRect(cxPos + 6, b7Y + 38, 1.5, b7H - 53);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(cxPos + 4, b7Y + 38, 1, b7H - 53);

    // Ionic Scroll Volute Capital
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(cxPos - 3, b7Y + 34, 16, 5);
    ctx.fillStyle = "#fbbf24"; // Gold capital ring
    ctx.fillRect(cxPos - 1, b7Y + 38, 12, 2);
  };
  drawFlutedColumn(b7X + 14);
  drawFlutedColumn(b7X + 44);
  drawFlutedColumn(b7X + b7W - 54);
  drawFlutedColumn(b7X + b7W - 24);

  // 5. Classical Triangular Pediment Roof & Dentil Molding Frieze
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b7X + 4, b7Y + 30, b7W - 8, 8); // Architrave beam
  ctx.fillStyle = "#334155";
  ctx.fillRect(b7X + 6, b7Y + 32, b7W - 12, 4);

  // Dentil Molding (Small square stone teeth)
  ctx.fillStyle = "#f8fafc";
  for (let dx = b7X + 8; dx < b7X + b7W - 8; dx += 6) {
    ctx.fillRect(dx, b7Y + 34, 3, 2);
  }

  // Triangular Pediment Tympanum
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.moveTo(b7X - 2, b7Y + 32);
  ctx.lineTo(b7X + b7W / 2, b7Y - 4);
  ctx.lineTo(b7X + b7W + 2, b7Y + 32);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Gold Apex Acroterion Finial
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(b7X + b7W / 2 - 3, b7Y - 8, 6, 5);
  ctx.fillRect(b7X + b7W / 2 - 5, b7Y - 11, 10, 3);
  ctx.fillRect(b7X - 4, b7Y + 30, 4, 4);
  ctx.fillRect(b7X + b7W, b7Y + 30, 4, 4);

  // Carved Tympanum Relief Medallion (Golden Laurel Wreath & Open Codex)
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(b7X + b7W / 2, b7Y + 16, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Golden Laurel Wreath & Scroll
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(b7X + b7W / 2, b7Y + 16, 7, 0, Math.PI * 1.8);
  ctx.stroke();
  ctx.fillRect(b7X + b7W / 2 - 5, b7Y + 13, 10, 6);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b7X + b7W / 2 - 1, b7Y + 13, 2, 6); // Book Spine

  // 6. Arched Stained Glass Cathedral Windows
  const drawArchiveStainedGlass = (wx: number, wy: number) => {
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(wx + 7, wy + 6, 7, Math.PI, 0);
    ctx.rect(wx, wy + 6, 14, 18);
    ctx.fill();

    // Vibrant Stained Glass Mosaic
    ctx.fillStyle = "#0284c7"; // Cyan
    ctx.fillRect(wx + 2, wy + 6, 5, 8);
    ctx.fillStyle = "#38bdf8"; // Light Blue
    ctx.fillRect(wx + 7, wy + 6, 5, 8);
    ctx.fillStyle = "#f59e0b"; // Gold Center
    ctx.fillRect(wx + 3, wy + 14, 8, 8);

    // Stone Arch Keystone
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(wx + 5, wy - 2, 4, 4);
  };
  drawArchiveStainedGlass(b7X + 26, b7Y + 46);
  drawArchiveStainedGlass(b7X + b7W - 40, b7Y + 46);

  // 7. Gilded Classical Architrave Signboard
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(b7X + b7W / 2 - 46, b7Y + 26, 92, 14);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(b7X + b7W / 2 - 46, b7Y + 26, 92, 14);
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.fillText("CAREER ARCHIVES", b7X + b7W / 2, b7Y + 36);

  // 8. Grand Bronze Double Portal Doors with Lion Knockers
  const adX = b7X + b7W / 2 - 18;
  const adY = b7Y + b7H - 46;
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(adX - 2, adY - 2, 40, 44);
  ctx.fillStyle = "#451a03";
  ctx.fillRect(adX, adY, 36, 42);

  // Left & Right Paneled Doors
  ctx.fillStyle = "#78350f";
  ctx.fillRect(adX + 2, adY + 2, 15, 38);
  ctx.fillRect(adX + 19, adY + 2, 15, 38);

  // Coffered Door Panels
  ctx.strokeStyle = "#451a03";
  ctx.lineWidth = 1;
  ctx.strokeRect(adX + 4, adY + 5, 11, 14);
  ctx.strokeRect(adX + 21, adY + 5, 11, 14);
  ctx.strokeRect(adX + 4, adY + 22, 11, 15);
  ctx.strokeRect(adX + 21, adY + 22, 11, 15);

  // Brass Lion Knocker Studs
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(adX + 8, adY + 11, 3, 3);
  ctx.fillRect(adX + 25, adY + 11, 3, 3);
  ctx.fillRect(adX + 12, adY + 26, 3, 3);
  ctx.fillRect(adX + 21, adY + 26, 3, 3);

  // Flanking Stone Urns / Laurel Planters on Steps
  const drawMarbleUrn = (ux: number) => {
    ctx.fillStyle = "#64748b";
    ctx.fillRect(ux, b7Y + b7H - 16, 8, 8);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(ux - 1, b7Y + b7H - 18, 10, 3);
    ctx.fillStyle = "#15803d"; // Trimmed Laurel
    ctx.beginPath();
    ctx.arc(ux + 4, b7Y + b7H - 20, 5, 0, Math.PI * 2);
    ctx.fill();
  };
  drawMarbleUrn(b7X + 10);
  drawMarbleUrn(b7X + b7W - 18);
}

// =========================================================================
// --- REALISTIC 3D BASKETBALL COURT (LeBron GOAT Court: 90x100 at 730, 535) ---
// =========================================================================
function drawBasketballCourt(ctx: CanvasRenderingContext2D) {
  const courtX = 730;
  const courtY = 535;
  const courtW = 90;
  const courtH = 100;

  // 1. 3D Drop Shadow on Lawn
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.beginPath();
  ctx.ellipse(courtX + courtW / 2 + 4, courtY + courtH + 2, courtW / 2 + 6, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Concrete Apron Border
  ctx.fillStyle = "#334155";
  ctx.fillRect(courtX - 4, courtY - 4, courtW + 8, courtH + 8);
  ctx.fillStyle = "#475569";
  ctx.fillRect(courtX - 2, courtY - 2, courtW + 4, courtH + 4);

  // 3. Premium Hardwood Parquet / Terracotta Court Surface
  ctx.fillStyle = "#c2410c";
  ctx.fillRect(courtX, courtY, courtW, courtH);

  // Horizontal Parquet Floor Plank Grooves
  ctx.strokeStyle = "rgba(124, 45, 18, 0.4)";
  ctx.lineWidth = 1;
  for (let py = courtY + 6; py < courtY + courtH; py += 6) {
    ctx.beginPath();
    ctx.moveTo(courtX, py);
    ctx.lineTo(courtX + courtW, py);
    ctx.stroke();
  }

  // 4. Contrasting Royal Purple / Gold Painted Lane Key (LeBron Lakers Tribute!)
  const keyX = courtX + courtW / 2 - 18;
  const keyY = courtY + 4;
  const keyW = 36;
  const keyH = 46;

  ctx.fillStyle = "#4c1d95"; // Royal Purple Key Base
  ctx.fillRect(keyX, keyY, keyW, keyH);
  ctx.strokeStyle = "#fbbf24"; // Gold Key Border
  ctx.lineWidth = 2;
  ctx.strokeRect(keyX, keyY, keyW, keyH);

  // Free Throw Circle
  ctx.fillStyle = "rgba(251, 191, 36, 0.25)";
  ctx.beginPath();
  ctx.ellipse(courtX + courtW / 2, keyY + keyH, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 3-Point Arc
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(courtX + courtW / 2, courtY + 18, 38, 34, 0, 0, Math.PI);
  ctx.stroke();

  // Half-Court Circle & Center Line
  ctx.beginPath();
  ctx.moveTo(courtX, courtY + courtH - 8);
  ctx.lineTo(courtX + courtW, courtY + courtH - 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(courtX + courtW / 2, courtY + courtH - 8, 16, 8, 0, Math.PI, 0);
  ctx.stroke();

  // Perimeter Out-of-Bounds White Court Lines
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(courtX + 2, courtY + 2, courtW - 4, courtH - 4);

  // 5. Realistic 3D Basketball Hoop & Padded Stanchion
  const hx = courtX + courtW / 2;
  const hy = courtY + 6;

  // Stanchion Padded Base
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(hx - 6, hy - 4, 12, 8);
  ctx.fillStyle = "#1e3a8a"; // Blue Padding Cushion
  ctx.fillRect(hx - 5, hy - 3, 10, 6);

  // Overhanging Cantilever Support Arm
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx, hy + 8);
  ctx.stroke();

  // Transparent Shatterproof Glass Backboard
  ctx.fillStyle = "rgba(241, 245, 249, 0.75)";
  ctx.fillRect(hx - 18, hy + 2, 36, 12);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(hx - 18, hy + 2, 36, 12);

  // Inner Red Target Square Box
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(hx - 8, hy + 4, 16, 7);

  // Breakaway Red Iron Rim & Mounting Flange
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(hx - 2, hy + 10, 4, 2);
  ctx.strokeStyle = "#ea580c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(hx, hy + 12, 7, 3.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Woven White Chain/Nylon Net (Detailed Mesh Loops)
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.beginPath();
  ctx.moveTo(hx - 6, hy + 13);
  ctx.lineTo(hx - 3, hy + 21);
  ctx.lineTo(hx + 3, hy + 21);
  ctx.lineTo(hx + 6, hy + 13);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx - 5, hy + 14);
  ctx.lineTo(hx + 2, hy + 20);
  ctx.moveTo(hx + 5, hy + 14);
  ctx.lineTo(hx - 2, hy + 20);
  ctx.stroke();

  // 6. Textured Leather Basketball on Court
  const bx = courtX + courtW / 2 + 18;
  const by = courtY + 58;

  // Ball Drop Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.beginPath();
  ctx.ellipse(bx + 1, by + 6, 6, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Leather Orange Ball
  ctx.fillStyle = "#ea580c";
  ctx.beginPath();
  ctx.arc(bx, by, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c2410c";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Black Curved Seams
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx - 6, by);
  ctx.lineTo(bx + 6, by);
  ctx.moveTo(bx, by - 6);
  ctx.lineTo(bx, by + 6);
  ctx.stroke();

  // Ball Highlight Glint
  ctx.fillStyle = "#fed7aa";
  ctx.fillRect(bx - 3, by - 4, 2, 2);
}

function drawDetailedBanners(ctx: CanvasRenderingContext2D, time: number) {
  const banners = WORLD_OBJECTS.filter((o) => o.type === "banner");

  banners.forEach((banner) => {
    const bx = banner.x;
    const by = banner.y;
    const windSway = Math.sin(time * 0.005 + bx * 0.1) * 3.5;

    // 1. Turned Hardwood Flagpole with Turned Brass Collar Joints
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(bx + 8, by + banner.height + 2, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#451a03"; // Dark outline
    ctx.fillRect(bx + 5, by, 7, banner.height);

    ctx.fillStyle = "#78350f"; // Wood Pole Body
    ctx.fillRect(bx + 6, by + 1, 5, banner.height - 2);

    ctx.fillStyle = "#b45309"; // Wood Highlight
    ctx.fillRect(bx + 7, by + 1, 2, banner.height - 2);

    // Brass Collar Rings
    ctx.fillStyle = "#facc15";
    ctx.fillRect(bx + 5, by + 12, 7, 2);
    ctx.fillRect(bx + 5, by + 42, 7, 2);

    // Finial Spearhead Top
    ctx.fillStyle = "#ca8a04";
    ctx.beginPath();
    ctx.moveTo(bx + 4, by + 4);
    ctx.lineTo(bx + 8.5, by - 5);
    ctx.lineTo(bx + 13, by + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fde047";
    ctx.fillRect(bx + 7, by - 2, 3, 4);

    // Hanging Gold Tassel Cord
    const cordSway = Math.sin(time * 0.004 + bx) * 2;
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + 8.5, by + 3);
    ctx.quadraticCurveTo(bx + 3, by + 14, bx + 4 + cordSway, by + 22);
    ctx.stroke();
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(bx + 3 + cordSway, by + 22, 3, 5);

    // 2. Banner Cloth Specs
    let bgDark = "#7f1d1d";
    let bgMid = "#991b1b";
    let bgLight = "#dc2626";
    let trimColor = "#fbbf24";
    let crestType: "mseuf" | "raones" | "ellipsense" | "techbears" | "lebron" = "mseuf";

    if (banner.id === "banner-mseuf") {
      bgDark = "#450a0a";
      bgMid = "#881337";
      bgLight = "#be123c";
      trimColor = "#facc15";
      crestType = "mseuf";
    } else if (banner.id === "banner-raones") {
      bgDark = "#172554";
      bgMid = "#1e40af";
      bgLight = "#2563eb";
      trimColor = "#67e8f9";
      crestType = "raones";
    } else if (banner.id === "banner-ellipsense") {
      bgDark = "#022c22";
      bgMid = "#065f46";
      bgLight = "#059669";
      trimColor = "#34d399";
      crestType = "ellipsense";
    } else if (banner.id === "banner-techbears") {
      bgDark = "#451a03";
      bgMid = "#b45309";
      bgLight = "#d97706";
      trimColor = "#fde047";
      crestType = "techbears";
    } else if (banner.id === "banner-lebron") {
      bgDark = "#2e1065";
      bgMid = "#581c87";
      bgLight = "#7e22ce";
      trimColor = "#facc15";
      crestType = "lebron";
    }

    // 3. Fluttering Swallowtail Pennant Base
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(bx + 11, by + 4);
    ctx.lineTo(bx + 11 + 34, by + 4);
    ctx.lineTo(bx + 11 + 34 + windSway, by + 42);
    ctx.lineTo(bx + 11 + 17 + windSway / 2, by + 35);
    ctx.lineTo(bx + 11, by + 42);
    ctx.closePath();

    // Fill Base Gradient
    ctx.fillStyle = bgMid;
    ctx.fill();

    // Clip to pennant for drawing rich woven texture & damask weave
    ctx.clip();

    // Damask Fabric Weave (Alternating subtle vertical/horizontal micro-threads)
    ctx.fillStyle = bgDark;
    for (let wy = by + 4; wy < by + 44; wy += 4) {
      ctx.fillRect(bx + 11, wy, 36 + windSway, 1);
    }
    ctx.fillStyle = bgLight;
    for (let wx = bx + 11; wx < bx + 48; wx += 4) {
      ctx.fillRect(wx, by + 4, 1, 40);
    }

    // Diagonal Shading Fold
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.beginPath();
    ctx.moveTo(bx + 24, by + 4);
    ctx.lineTo(bx + 38 + windSway, by + 42);
    ctx.lineTo(bx + 31 + windSway, by + 42);
    ctx.lineTo(bx + 18, by + 4);
    ctx.closePath();
    ctx.fill();

    // Detailed Pixel Emblems
    const cx = bx + 27 + windSway / 2;
    const cy = by + 20;

    if (crestType === "mseuf") {
      // Royal Imperial Crown & Enterprise Pillars
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(cx - 7, cy - 8, 14, 3);
      ctx.fillRect(cx - 9, cy - 5, 18, 5);
      ctx.fillRect(cx - 8, cy - 10, 3, 3);
      ctx.fillRect(cx - 1, cy - 11, 3, 3);
      ctx.fillRect(cx + 6, cy - 10, 3, 3);
      ctx.fillStyle = "#ef4444"; // Ruby gems
      ctx.fillRect(cx - 5, cy - 4, 2, 2);
      ctx.fillRect(cx - 1, cy - 4, 2, 2);
      ctx.fillRect(cx + 3, cy - 4, 2, 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 6px monospace";
      ctx.textAlign = "center";
      ctx.fillText("MSEUF", cx, cy + 8);
    } else if (crestType === "raones") {
      // Tech Startup Spark & Silver Lightning
      ctx.fillStyle = "#e0f2fe";
      ctx.beginPath();
      ctx.moveTo(cx + 2, cy - 11);
      ctx.lineTo(cx - 5, cy - 2);
      ctx.lineTo(cx - 1, cy - 2);
      ctx.lineTo(cx - 3, cy + 6);
      ctx.lineTo(cx + 5, cy - 3);
      ctx.lineTo(cx + 1, cy - 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 6px monospace";
      ctx.textAlign = "center";
      ctx.fillText("RA-1", cx, cy + 10);
    } else if (crestType === "ellipsense") {
      // Alliance Compass Globe
      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(cx - 1, cy - 9, 2, 12);
      ctx.fillRect(cx - 6, cy - 4, 12, 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 6px monospace";
      ctx.textAlign = "center";
      ctx.fillText("ELLIP", cx, cy + 9);
    } else if (crestType === "techbears") {
      // Twin Fleet Chevron Mobility Badges
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 8);
      ctx.lineTo(cx, cy - 3);
      ctx.lineTo(cx + 6, cy - 8);
      ctx.lineTo(cx, cy - 1);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 2);
      ctx.lineTo(cx, cy + 3);
      ctx.lineTo(cx + 6, cy - 2);
      ctx.lineTo(cx, cy + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 6px monospace";
      ctx.textAlign = "center";
      ctx.fillText("FLEET", cx, cy + 11);
    } else if (crestType === "lebron") {
      // Ornate #23 Jersey Numerals & Imperial Gold Crown
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(cx - 6, cy - 11, 12, 2);
      ctx.fillRect(cx - 7, cy - 13, 2, 2);
      ctx.fillRect(cx - 1, cy - 14, 2, 2);
      ctx.fillRect(cx + 5, cy - 13, 2, 2);
      ctx.fillStyle = "#fde047";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("#23 KING", cx, cy);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 6px monospace";
      ctx.fillText("GOAT", cx, cy + 8);
    }

    ctx.restore();

    // 4. Gold-Embroidered Brocade Border & Bullion Fringe
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + 11, by + 4);
    ctx.lineTo(bx + 11 + 34, by + 4);
    ctx.lineTo(bx + 11 + 34 + windSway, by + 42);
    ctx.lineTo(bx + 11 + 17 + windSway / 2, by + 35);
    ctx.lineTo(bx + 11, by + 42);
    ctx.closePath();
    ctx.stroke();

    // Gold bullion fringe tassels along bottom hem
    ctx.fillStyle = trimColor;
    ctx.fillRect(bx + 11, by + 42, 2, 3);
    ctx.fillRect(bx + 17 + windSway * 0.2, by + 40, 2, 3);
    ctx.fillRect(bx + 23 + windSway * 0.4, by + 37, 2, 3);
    ctx.fillRect(bx + 29 + windSway * 0.6, by + 37, 2, 3);
    ctx.fillRect(bx + 35 + windSway * 0.8, by + 40, 2, 3);
    ctx.fillRect(bx + 43 + windSway, by + 42, 2, 3);
  });
}

function drawDetailedStatues(ctx: CanvasRenderingContext2D, time: number) {
  const statues = WORLD_OBJECTS.filter((o) => o.type === "statue");

  statues.forEach((statue) => {
    const sx = statue.x;
    const sy = statue.y;

    // 1. Realistic Stepped Stone Plinth (3D Beveled Masonry Pedestal)
    // Plinth Drop Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(sx + 25, sy + 62, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bottom Masonry Base Tier
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(sx + 4, sy + 48, 42, 14);
    ctx.fillStyle = "#334155";
    ctx.fillRect(sx + 6, sy + 50, 38, 10);
    ctx.fillStyle = "#475569";
    ctx.fillRect(sx + 6, sy + 48, 38, 2);

    // Mid Beveled Pedestal Tier
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(sx + 8, sy + 38, 34, 12);
    ctx.fillStyle = "#475569";
    ctx.fillRect(sx + 10, sy + 40, 30, 8);
    ctx.fillStyle = "#64748b";
    ctx.fillRect(sx + 10, sy + 38, 30, 2);

    // Stone Mortar Lines & Moss Glints
    ctx.fillStyle = "#15803d";
    ctx.fillRect(sx + 6, sy + 54, 4, 3);
    ctx.fillRect(sx + 38, sy + 52, 4, 3);
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(sx + 7, sy + 54, 2, 1);

    const float = Math.sin(time * 0.005 + sx) * 3;

    if (statue.id === "statue-nextjs") {
      // =====================================================================
      // ⚛️ 1. REACT & NEXT.JS ATOM MONOLITH
      // =====================================================================
      // Floating Obsidian Monolith Core
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.moveTo(sx + 25, sy + 2 + float);
      ctx.lineTo(sx + 41, sy + 36 + float);
      ctx.lineTo(sx + 9, sy + 36 + float);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Next.js Monolith Facet Shading
      ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
      ctx.beginPath();
      ctx.moveTo(sx + 25, sy + 2 + float);
      ctx.lineTo(sx + 41, sy + 36 + float);
      ctx.lineTo(sx + 25, sy + 36 + float);
      ctx.closePath();
      ctx.fill();

      // Engraved Next.js "N" Emblem
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("N", sx + 25, sy + 28 + float);

      // 3D Orbiting React Atomic Rings (Tilted Multi-Axis Ellipses)
      const ringTime = time * 0.003;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
      ctx.lineWidth = 1.5;

      // Ring 1 (Horizontal)
      ctx.beginPath();
      ctx.ellipse(sx + 25, sy + 20 + float, 17, 6, ringTime, 0, Math.PI * 2);
      ctx.stroke();

      // Ring 2 (Tilted 60 deg)
      ctx.beginPath();
      ctx.ellipse(sx + 25, sy + 20 + float, 17, 6, ringTime + Math.PI / 3, 0, Math.PI * 2);
      ctx.stroke();

      // Ring 3 (Tilted 120 deg)
      ctx.beginPath();
      ctx.ellipse(sx + 25, sy + 20 + float, 17, 6, ringTime + (2 * Math.PI) / 3, 0, Math.PI * 2);
      ctx.stroke();

      // Orbiting Glowing Electron Sparkles
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(sx + 25 + Math.cos(ringTime * 2) * 15, sy + 20 + float + Math.sin(ringTime * 2) * 5, 2.5, 2.5);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(sx + 25 - Math.cos(ringTime * 2) * 15, sy + 20 + float - Math.sin(ringTime * 2) * 5, 2.5, 2.5);
    } else if (statue.id === "statue-typescript") {
      // =====================================================================
      // 🔷 2. TYPESCRIPT SYSTEMS OBELISK
      // =====================================================================
      // Egyptian Tapered Lapis Granite Obelisk Shaft
      const ox = sx + 25;
      const oy = sy + 6 + float;

      // Obelisk Column
      ctx.fillStyle = "#1e3a8a";
      ctx.beginPath();
      ctx.moveTo(ox - 9, oy + 32);
      ctx.lineTo(ox - 6, oy + 6);
      ctx.lineTo(ox + 6, oy + 6);
      ctx.lineTo(ox + 9, oy + 32);
      ctx.closePath();
      ctx.fill();

      // 3D Shading on Right Face
      ctx.fillStyle = "#172554";
      ctx.beginPath();
      ctx.moveTo(ox, oy + 6);
      ctx.lineTo(ox + 6, oy + 6);
      ctx.lineTo(ox + 9, oy + 32);
      ctx.lineTo(ox, oy + 32);
      ctx.closePath();
      ctx.fill();

      // Gold Pyramidion Cap (Apex Point)
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(ox, oy - 4);
      ctx.lineTo(ox + 6, oy + 6);
      ctx.lineTo(ox - 6, oy + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.fillRect(ox - 2, oy + 1, 4, 4);

      // Engraved Glowing Gold "TS" Inscription & Hieroglyphs
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1;
      ctx.strokeRect(ox - 7, oy + 10, 14, 18);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("TS", ox, oy + 22);

      // Floating Cyan Type-Check Rune Ring
      const tsFloat = Math.sin(time * 0.006) * 2;
      ctx.strokeStyle = "#67e8f9";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(ox, oy + 30 + tsFloat, 12, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (statue.id === "statue-postgres") {
      // =====================================================================
      // 🐘 3. POSTGRESQL & DATABASE SAPPHIRE RELIC
      // =====================================================================
      // Sacred Database Reliquary Altar
      const rx = sx + 25;
      const ry = sy + 18 + float;

      // Faceted Floating Sapphire Database Gem
      ctx.fillStyle = "#1e40af";
      ctx.beginPath();
      ctx.moveTo(rx, ry - 14); // Top point
      ctx.lineTo(rx + 14, ry); // Right corner
      ctx.lineTo(rx, ry + 14); // Bottom point
      ctx.lineTo(rx - 14, ry); // Left corner
      ctx.closePath();
      ctx.fill();

      // Facet Highlights (3D Cut Gem Geometry)
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.moveTo(rx, ry - 14);
      ctx.lineTo(rx + 14, ry);
      ctx.lineTo(rx, ry);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.moveTo(rx, ry - 14);
      ctx.lineTo(rx, ry);
      ctx.lineTo(rx - 14, ry);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#93c5fd"; // Top facet gleam
      ctx.beginPath();
      ctx.moveTo(rx, ry - 14);
      ctx.lineTo(rx + 6, ry - 5);
      ctx.lineTo(rx - 6, ry - 5);
      ctx.closePath();
      ctx.fill();

      // Outer Gem Border
      ctx.strokeStyle = "#bae6fd";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Engraved PostgreSQL Elephant Silhouette / Database Platter Lines
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(rx - 6, ry + 3, 12, 2);
      ctx.fillRect(rx - 4, ry + 7, 8, 2);

      // Orbiting Binary Data Sparks
      const binAngle = time * 0.005;
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 6px monospace";
      ctx.fillText("1", rx + Math.cos(binAngle) * 16, ry + Math.sin(binAngle) * 8);
      ctx.fillText("0", rx - Math.cos(binAngle) * 16, ry - Math.sin(binAngle) * 8);
    } else if (statue.id === "statue-docker") {
      // =====================================================================
      // 🐳 4. DOCKER WHALE TOTEM & CONTAINER SHIP RELIC
      // =====================================================================
      const dx = sx + 25;
      const dy = sy + 18 + float;

      // Sculpted Cyan Mechanical Whale Body
      ctx.fillStyle = "#0369a1"; // Whale Underbody
      ctx.beginPath();
      ctx.ellipse(dx, dy + 10, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#0284c7"; // Whale Main Flank
      ctx.beginPath();
      ctx.ellipse(dx + 1, dy + 8, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Whale Tail & Flipper
      ctx.fillStyle = "#0369a1";
      ctx.beginPath();
      ctx.moveTo(dx - 14, dy + 10);
      ctx.lineTo(dx - 22, dy + 4);
      ctx.lineTo(dx - 20, dy + 12);
      ctx.closePath();
      ctx.fill();

      // Glowing Eye
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(dx + 11, dy + 6, 2, 2);

      // Stacked Microservice Shipping Containers (3D Beveled Cargo Crates)
      // Container 1 (Blue)
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(dx - 10, dy - 2, 8, 7);
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 1;
      ctx.strokeRect(dx - 10, dy - 2, 8, 7);

      // Container 2 (Amber Gold)
      ctx.fillStyle = "#d97706";
      ctx.fillRect(dx - 1, dy - 2, 8, 7);
      ctx.strokeStyle = "#fde047";
      ctx.strokeRect(dx - 1, dy - 2, 8, 7);

      // Container 3 (Emerald Green - Top Tier)
      ctx.fillStyle = "#059669";
      ctx.fillRect(dx - 6, dy - 10, 8, 7);
      ctx.strokeStyle = "#6ee7b7";
      ctx.strokeRect(dx - 6, dy - 10, 8, 7);

      // Blowhole Water Geyser Spout
      const spoutT = (time * 0.008) % 3;
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      ctx.arc(dx + 8, dy - 6 - spoutT * 4, 2 + spoutT, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawCentralFountain(ctx: CanvasRenderingContext2D, time: number) {
  const cx = 420;
  const cy = 378;

  // =====================================================================
  // ⛲ GRAND 3D ROYAL CENTRAL FOUNTAIN OF CONTINUOUS DEPLOYMENT
  // =====================================================================

  // 1. Grand Apron Drop Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18, 68, 36, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Octagonal Mosaic Bluestone Stylobate Apron
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10, 66, 34, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 7, 63, 31, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Multi-Tiered Bluestone Coping / Basin Masonry (Tier 1 Base Rim)
  ctx.fillStyle = "#334155";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 60, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#475569";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 57, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#64748b"; // Polished Top Coping Rim
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 54, 23, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#94a3b8"; // Inner Bevel Highlight
  ctx.beginPath();
  ctx.ellipse(cx, cy - 3, 50, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Radial Stone Mortar Seams (12 segmented chiseled ashlar coping blocks)
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const x1 = cx + Math.cos(angle) * 48;
    const y1 = cy + Math.sin(angle) * 19;
    const x2 = cx + Math.cos(angle) * 58;
    const y2 = cy + Math.sin(angle) * 27;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Emerald Moss & Lichen Floral Accents on Rim
  ctx.fillStyle = "#15803d";
  ctx.fillRect(cx - 48, cy + 6, 7, 4);
  ctx.fillRect(cx + 42, cy + 7, 8, 4);
  ctx.fillRect(cx + 16, cy + 19, 6, 3);
  ctx.fillRect(cx - 24, cy + 20, 6, 3);
  ctx.fillStyle = "#4ade80";
  ctx.fillRect(cx - 47, cy + 6, 3, 2);
  ctx.fillRect(cx + 44, cy + 7, 3, 2);
  ctx.fillStyle = "#fb7185"; // Little Pink Flower on Rim
  ctx.fillRect(cx - 45, cy + 4, 3, 3);
  ctx.fillRect(cx + 45, cy + 5, 3, 3);

  // 4. Crystal Deep Basin Pool & Animated Caustic Ripples
  // Deep Basin Bed
  ctx.fillStyle = "#0369a1";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 46, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  // Turquoise Water Surface Layer
  ctx.fillStyle = "#0284c7";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 44, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Animated Concentric Caustic Wave Ripple Rings
  const rippleT = time * 0.004;
  ctx.strokeStyle = "rgba(103, 232, 249, 0.7)";
  ctx.lineWidth = 1.5;
  for (let r = 0; r < 4; r++) {
    const rOffset = (rippleT + r * 0.7) % 3.0;
    const rw = 14 + rOffset * 9;
    const rh = 6 + rOffset * 3.8;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1, rw, rh, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Glistening Golden Wish Coins & Sapphire Gems on Floor
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(cx - 24, cy + 7, 4, 3);
  ctx.fillRect(cx + 22, cy + 5, 4, 3);
  ctx.fillRect(cx - 8, cy + 11, 4, 3);
  ctx.fillRect(cx + 14, cy + 9, 3, 2);
  ctx.fillStyle = "#38bdf8"; // Sapphire Gem
  ctx.fillRect(cx - 18, cy + 4, 3, 3);
  ctx.fillStyle = "#ffffff"; // Coin Gleams
  ctx.fillRect(cx - 23, cy + 7, 1.5, 1.5);
  ctx.fillRect(cx + 23, cy + 5, 1.5, 1.5);

  // 5. 4 Carved Stone Gargoyle / Lion Water Spouts (Shooting Inward)
  // Left Lion Spout
  ctx.fillStyle = "#334155";
  ctx.fillRect(cx - 52, cy - 2, 8, 8);
  ctx.fillStyle = "#64748b";
  ctx.fillRect(cx - 50, cy - 1, 5, 5);
  // Right Lion Spout
  ctx.fillStyle = "#334155";
  ctx.fillRect(cx + 44, cy - 2, 8, 8);
  ctx.fillStyle = "#64748b";
  ctx.fillRect(cx + 45, cy - 1, 5, 5);

  // Inward Arched Water Streams from Side Spouts
  const spoutWiggle = Math.sin(time * 0.008) * 1.2;
  // Left Inward Stream
  ctx.strokeStyle = "rgba(224, 242, 254, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 44, cy + 2);
  ctx.quadraticCurveTo(cx - 30, cy - 4, cx - 18 + spoutWiggle, cy + 5);
  ctx.stroke();
  // Right Inward Stream
  ctx.beginPath();
  ctx.moveTo(cx + 44, cy + 2);
  ctx.quadraticCurveTo(cx + 30, cy - 4, cx + 18 - spoutWiggle, cy + 5);
  ctx.stroke();

  // 6. Tier 2: Fluted Corinthian Marble Column & Mid-Level Shell Bowl
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(cx - 14, cy - 8, 28, 18);
  ctx.fillStyle = "#334155";
  ctx.fillRect(cx - 11, cy - 24, 22, 20);

  // Column Fluted Highlights & Gold Acanthus Band
  ctx.fillStyle = "#64748b";
  ctx.fillRect(cx - 9, cy - 24, 4, 18);
  ctx.fillRect(cx + 5, cy - 24, 4, 18);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(cx - 2, cy - 24, 4, 18);
  ctx.fillStyle = "#fbbf24"; // Gold Acanthus Band
  ctx.fillRect(cx - 11, cy - 10, 22, 3);
  ctx.fillStyle = "#fde047";
  ctx.fillRect(cx - 9, cy - 10, 18, 1);

  // Mid Scalloped Marble Basin Bowl (Tier 2 Bowl)
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 24, 25, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#334155";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 26, 23, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#64748b";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 27, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#94a3b8"; // Bowl Lip Gleam
  ctx.beginPath();
  ctx.ellipse(cx, cy - 28, 18, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Water in Mid Bowl
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 29, 16, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 7. Cascading Water Curtains from Mid Bowl Lip (4 Streams)
  const cascadeW = Math.sin(time * 0.008) * 1.5;
  ctx.fillStyle = "rgba(224, 242, 254, 0.85)";
  // Far Left Cascade
  ctx.fillRect(cx - 20 + cascadeW * 0.5, cy - 26, 5, 26);
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillRect(cx - 19 + cascadeW * 0.5, cy - 24, 3, 24);

  // Far Right Cascade
  ctx.fillStyle = "rgba(224, 242, 254, 0.85)";
  ctx.fillRect(cx + 15 - cascadeW * 0.5, cy - 26, 5, 26);
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillRect(cx + 16 - cascadeW * 0.5, cy - 24, 3, 24);

  // Center-Front Cascade
  ctx.fillStyle = "rgba(224, 242, 254, 0.85)";
  ctx.fillRect(cx - 4, cy - 23, 8, 24);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - 2, cy - 22, 4, 22);

  // 8. Tier 3: Upper Royal Golden Chalice & Geyser Crown
  ctx.fillStyle = "#78350f";
  ctx.fillRect(cx - 6, cy - 36, 12, 10);
  ctx.fillStyle = "#d97706";
  ctx.fillRect(cx - 5, cy - 36, 10, 8);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(cx - 4, cy - 36, 8, 8);

  // Upper Chalice Bowl with Gold Rim
  ctx.fillStyle = "#b45309";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 38, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 39, 12, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fde047"; // Gold Lip
  ctx.beginPath();
  ctx.ellipse(cx, cy - 40, 10, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#38bdf8"; // Water in Upper Chalice
  ctx.beginPath();
  ctx.ellipse(cx, cy - 41, 8, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 9. Surging High-Pressure Water Geyser & Plume Crown
  const jetPulse = Math.sin(time * 0.01) * 4;
  const jetHeight = 24 + jetPulse;

  // Multi-Tone Upward Water Column
  ctx.fillStyle = "rgba(186, 230, 253, 0.9)";
  ctx.fillRect(cx - 4, cy - 41 - jetHeight, 8, jetHeight);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - 2, cy - 41 - jetHeight, 4, jetHeight);

  // Frothing White Water Foam Crown at Apex
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy - 42 - jetHeight, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(224, 242, 254, 0.8)";
  ctx.beginPath();
  ctx.arc(cx, cy - 42 - jetHeight, 8, 0, Math.PI * 2);
  ctx.fill();

  // Expanding Water Splash Foam Ring in Upper Chalice
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 41, 9, 3.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 10. 12 Dynamic Airborne Water Droplets Leaping & Splashing
  const waterTime = time * 0.005;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 + waterTime;
    const spreadX = Math.cos(angle) * (18 + (i % 3) * 10);
    const dropY = cy - 28 + Math.sin(angle) * (12 + (i % 2) * 6) + (i % 3) * 6;
    ctx.beginPath();
    ctx.arc(cx + spreadX, dropY, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 11. Prismatic Rainbow Mist Shimmer
  const mistPulse = Math.sin(time * 0.004) * 0.15 + 0.25;
  const rainbowGrad = ctx.createLinearGradient(cx - 30, cy - 60, cx + 30, cy - 30);
  rainbowGrad.addColorStop(0, `rgba(239, 68, 68, ${mistPulse * 0.5})`);
  rainbowGrad.addColorStop(0.25, `rgba(234, 179, 8, ${mistPulse * 0.5})`);
  rainbowGrad.addColorStop(0.5, `rgba(34, 197, 94, ${mistPulse * 0.6})`);
  rainbowGrad.addColorStop(0.75, `rgba(56, 189, 248, ${mistPulse * 0.6})`);
  rainbowGrad.addColorStop(1, `rgba(168, 85, 247, ${mistPulse * 0.5})`);

  ctx.strokeStyle = rainbowGrad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx + 4, cy - 38, 28, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
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

  const charactersImageRef = useRef<HTMLImageElement | null>(null);

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
  } | null => {
    const p = playerRef.current;
    const centerX = p.x + 12;
    const centerY = p.y + 14;

    // 1. Check NPCs
    for (const npc of NPCS) {
      const live = npcLiveStateRef.current[npc.id];
      const npcX = live ? live.x : npc.x;
      const npcY = live ? live.y : npc.y;
      const dist = Math.hypot(centerX - (npcX + 14), centerY - (npcY + 14));
      if (dist < 44) {
        return { npc };
      }
    }

    // 2. Check World Objects
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
    const camX = Math.max(
      0,
      Math.min(p.x + p.width / 2 - canvas.width / 2, MAP_TOTAL_WIDTH - canvas.width)
    );
    const camY = Math.max(
      0,
      Math.min(p.y + p.height / 2 - canvas.height / 2, MAP_TOTAL_HEIGHT - canvas.height)
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
        if (activeModalType) setActiveModalType(null);
        if (activeNpc) setActiveNpc(null);
        if (activeWorldObject) setActiveWorldObject(null);
        return;
      }

      if (e.key === " " || e.key === "Enter" || e.key === "e" || e.key === "E") {
        e.preventDefault();
        if (!activeNpc && !activeWorldObject && !activeModalType) {
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
  }, [activeNpc, activeWorldObject, activeModalType, triggerInteraction]);

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

      // --- 2. AUTONOMOUS NPC WANDERING AI ---
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
            const distToPlayer = Math.hypot((nextNx + 14) - (p.x + 12), (nextNy + 16) - (p.y + 14));

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

      // --- 3. FLOATING PROMPT LOOKUP ---
      const nearby = getNearbyInteractable();
      if (nearby && !isPaused) {
        if (nearby.npc) {
          const live = npcLiveStateRef.current[nearby.npc.id];
          const nx = live ? live.x : nearby.npc.x;
          const ny = live ? live.y : nearby.npc.y;
          setInteractPrompt({
            text: `[SPACE] Talk to ${nearby.npc.name}`,
            x: nx + 14,
            y: ny - 12,
          });
        } else if (nearby.worldObject) {
          setInteractPrompt({
            text: `[SPACE] Inspect ${nearby.worldObject.name}`,
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
      const camX = Math.max(
        0,
        Math.min(p.x + p.width / 2 - viewWidth / 2, MAP_TOTAL_WIDTH - viewWidth)
      );
      const camY = Math.max(
        0,
        Math.min(p.y + p.height / 2 - viewHeight / 2, MAP_TOTAL_HEIGHT - viewHeight)
      );

      ctx.save();
      ctx.clearRect(0, 0, viewWidth, viewHeight);
      ctx.translate(-camX, -camY);

      // 1. Organic Winding Ground & Striped Grass (Flowers strictly inside grass)
      drawOrganicGround(ctx);

      // 2. Fenced Pathway Borders with Dedicated Entrances
      drawTexturedFences(ctx);

      // 3. Sprite-Style Pixel Flower Pots
      drawSpriteFlowerPots(ctx, time);

      // 4. Sprite-Style Pixel Bushes & Shrubs
      drawSpriteBushes(ctx);

      // 4b. Rich 3D Village Outdoor Furniture (Benches, Tables, Wishing Well, Birdbaths, Lamps)
      drawVillageFurniture(ctx, time);

      // 5. Basketball Court
      drawBasketballCourt(ctx);

      // 6. Statues & Obelisks
      drawDetailedStatues(ctx, time);

      // 7. Grand Aligned Colonnade of Banners (Aligned at y: 220)
      drawDetailedBanners(ctx, time);

      // 8. Custom Handcrafted Buildings
      drawCustomBuildings(ctx, time);

      // 9. Central Fountain
      drawCentralFountain(ctx, time);

      // 10. Sprite-Style Pixel Forest Trees (Oak & Maple)
      drawSpriteTrees(ctx, time);

      // 11. Dynamic Animated Wandering NPCs
      NPCS.forEach((npc) => {
        const live = npcLiveStateRef.current[npc.id];
        const nx = live ? live.x : npc.x;
        const ny = live ? live.y : npc.y;
        const dir = live ? live.direction : npc.direction;
        const isMoving = live ? live.isMoving : false;
        const frame = live ? live.frame : 0;

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
      });

      // 12. Player Character (Franze Trainer)
      drawSpritesheetCharacter(
        ctx,
        charactersImageRef.current,
        2,
        p.x,
        p.y,
        p.direction,
        p.isMoving,
        p.frame,
        "none"
      );

      // 13. Ambient Floating Particles
      drawParticles(ctx, particlesRef.current);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isColliding, getNearbyInteractable, activeNpc, activeWorldObject, activeModalType]);

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
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="tracking-wider uppercase">FRANZE TOWN // DEV OVERWORLD</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="hidden sm:flex items-center gap-1.5 text-amber-300">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                DISCOVERED: {discoveredLocations.size} / {WORLD_OBJECTS.length + NPCS.length}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1 text-emerald-300">
              <MousePointer className="h-3.5 w-3.5" />
              <span>CLICK TO WALK</span>
            </div>

            <button
              onClick={handleToggleMute}
              className="flex items-center gap-1.5 rounded border border-background/20 bg-background/10 px-2 py-0.5 hover:bg-background/25 active:scale-95 transition-all"
              title="Toggle Background Music & Sound Effects"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />}
              <span className="hidden sm:inline">{isMuted ? "SOUND OFF" : "BGM & SFX"}</span>
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="hidden sm:flex items-center gap-1 rounded px-2 py-0.5 hover:bg-background/20"
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
        {interactPrompt && !activeNpc && !activeWorldObject && !activeModalType && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded border-2 border-foreground bg-foreground/95 px-3 py-1 font-mono text-xs font-bold text-background shadow-lg animate-bounce">
            {interactPrompt.text}
          </div>
        )}

        {/* Active Dialogue Box */}
        {(activeNpc || activeWorldObject) && (
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
        {activeModalType && (
          <GameModal
            type={activeModalType}
            onClose={() => setActiveModalType(null)}
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
        isInteractingDisabled={Boolean(activeNpc || activeWorldObject || activeModalType)}
      />
    </div>
  );
}
