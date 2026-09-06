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
  CharacterSkin,
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
import { collectStatues, collectBanners } from "./game-landmarks";
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

/**
 * The fountain is a single fixed-position landmark (not data-driven, unlike
 * every other category), so it takes part in the scene layer's y-sort as
 * one hardcoded Drawable rather than through a collect* function.
 *
 * Every other category's baseline is the bottom edge of its *solid*
 * footprint, not its shadow — so this is `cy + 10 + 34 = 422`: the bottom
 * of the widest opaque apron ring ("2. Octagonal Mosaic Bluestone
 * Stylobate Apron" below, `ellipse(cx, cy + 10, 66, 34, ...)`), not the
 * translucent drop-shadow ellipse above it (`cy + 18` centre, ry 36,
 * bottom ~432 — that shape is alpha-blended shadow, not the fountain's
 * own edge, the same way a building's baseline isn't measured from its
 * cast shadow either). The fountain has no collision box, so a player can
 * walk right up to and past this baseline; it was previously computed
 * from the shadow's centre instead of the masonry's bottom edge (Fix
 * round 1) — 396 vs. the correct 422, a 26px error a player would walk
 * straight through.
 */
const FOUNTAIN_BASELINE = 422;

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

// =========================================================================
// --- PROJECTS SHOWCASE GUILD INTERIOR RENDERER (700 x 540) ---
// =========================================================================
function drawProjectStationPedestal(
  ctx: CanvasRenderingContext2D,
  station: ProjectStation,
  time: number
) {
  const sx = station.x;
  const sy = station.y;
  const sw = station.width;
  const sh = station.height;

  // 1. Radial Floor Glow Halo
  const halo = ctx.createRadialGradient(
    sx + sw / 2,
    sy + sh / 2 + 10,
    4,
    sx + sw / 2,
    sy + sh / 2 + 10,
    44
  );
  halo.addColorStop(0, `${station.color}40`);
  halo.addColorStop(0.6, `${station.color}15`);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sx + sw / 2, sy + sh / 2 + 10, 44, 0, Math.PI * 2);
  ctx.fill();

  // 2. 3D Volumetric Drop Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.beginPath();
  ctx.ellipse(sx + sw / 2, sy + sh + 2, sw / 2 + 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Stepped Marble & Polished Walnut Pedestal Plinth
  // Tier 1 Base Plinth
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(sx - 4, sy + sh - 10, sw + 8, 12);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(sx - 2, sy + sh - 8, sw + 4, 8);

  // Tier 2 Column Body
  ctx.fillStyle = "#334155";
  ctx.fillRect(sx, sy + 14, sw, sh - 22);
  ctx.fillStyle = "#475569";
  ctx.fillRect(sx + 2, sy + 14, sw - 4, sh - 22);

  // Gold Trim Rings
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(sx - 2, sy + 14, sw + 4, 3);
  ctx.fillRect(sx - 2, sy + sh - 13, sw + 4, 3);

  // 4. Glowing Holographic Terminal Vitrine (Floating Screen)
  const hoverFloat = Math.sin(time * 0.005 + sx) * 3;

  // Glass Case Backing
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.fillRect(sx + 6, sy - 12 + hoverFloat, sw - 12, 24);
  ctx.strokeStyle = station.color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sx + 6, sy - 12 + hoverFloat, sw - 12, 24);

  // Live Screen Color Gradient
  const screenGrad = ctx.createLinearGradient(
    sx,
    sy - 12 + hoverFloat,
    sx,
    sy + 12 + hoverFloat
  );
  screenGrad.addColorStop(0, `${station.color}40`);
  screenGrad.addColorStop(1, "rgba(15, 23, 42, 0.9)");
  ctx.fillStyle = screenGrad;
  ctx.fillRect(sx + 8, sy - 10 + hoverFloat, sw - 16, 20);

  // Tech Badge Icon Miniature on Screen
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillText("⚡ PROJ", sx + sw / 2, sy - 1 + hoverFloat);
  ctx.fillStyle = station.color;
  ctx.font = "bold 7px monospace";
  ctx.fillText(station.shortTitle.slice(0, 9), sx + sw / 2, sy + 7 + hoverFloat);

  // Corner Capacitor Nodes (Blinking LED dots)
  const isBlink = Math.floor(time / 400) % 2 === 0;
  ctx.fillStyle = isBlink ? "#4ade80" : "#166534";
  ctx.fillRect(sx + 8, sy - 9 + hoverFloat, 2, 2);
  ctx.fillRect(sx + sw - 10, sy - 9 + hoverFloat, 2, 2);

  // 5. Nameplate Plaque Below Pedestal
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillRect(sx + sw / 2 - 42, sy + sh + 4, 84, 12);
  ctx.strokeStyle = station.color;
  ctx.lineWidth = 1;
  ctx.strokeRect(sx + sw / 2 - 42, sy + sh + 4, 84, 12);

  ctx.fillStyle = station.color;
  ctx.font = "bold 7.5px monospace";
  ctx.textAlign = "center";
  ctx.fillText(station.shortTitle, sx + sw / 2, sy + sh + 13);
}

function drawProjectsGuildInterior(
  ctx: CanvasRenderingContext2D,
  time: number,
  charactersImage: HTMLImageElement | null
) {
  const gw = GUILD_INTERIOR_WIDTH; // 700
  const gh = GUILD_INTERIOR_HEIGHT; // 540

  // 1. Dark Atmospheric Void Backdrop
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, gw, gh);

  // 2. Room Outer Drop Shadow & Wall Boundary
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(40, 60, gw - 80, gh - 90);

  // 3. Herringbone / Parquet Oak Hardwood Floor (Interior Area: x: 60..640, y: 110..480)
  const floorX = 60;
  const floorY = 110;
  const floorW = gw - 120; // 580
  const floorH = gh - 150; // 390

  // Rich Walnut / Golden Oak Base Flooring
  ctx.fillStyle = "#3e2723";
  ctx.fillRect(floorX, floorY, floorW, floorH);

  // Parquet Herringbone Diagonal Slats
  const plankW = 20;
  const plankH = 10;
  for (let py = floorY; py < floorY + floorH; py += plankH) {
    for (let px = floorX; px < floorX + floorW; px += plankW) {
      const isAlt = ((px - floorX) / plankW + (py - floorY) / plankH) % 2 === 0;
      ctx.fillStyle = isAlt ? "#5d4037" : "#4e342e";
      ctx.fillRect(px, py, plankW - 1, plankH - 1);

      // Wood Grain Highlight Slat
      ctx.fillStyle = isAlt ? "#6d4c41" : "#5c3d2e";
      ctx.fillRect(px + 1, py + 1, plankW - 3, 1.5);

      // Occasional polished parquet gleam
      if ((px * 7 + py * 13) % 47 === 0) {
        ctx.fillStyle = "rgba(255, 235, 179, 0.08)";
        ctx.fillRect(px, py, plankW - 1, plankH - 1);
      }
    }
  }

  // Floor Perimeter Mahogany Inlay Border
  ctx.fillStyle = "#271206";
  ctx.fillRect(floorX, floorY, floorW, 4);
  ctx.fillRect(floorX, floorY + floorH - 4, floorW, 4);
  ctx.fillRect(floorX, floorY, 4, floorH);
  ctx.fillRect(floorX + floorW - 4, floorY, 4, floorH);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(floorX + 4, floorY + 4, floorW - 8, 1.5);
  ctx.fillRect(floorX + 4, floorY + floorH - 5.5, floorW - 8, 1.5);

  // 4. Grand Royal Blue & Gold Guild Runner Carpet
  const carpetX = 280;
  const carpetW = 140;
  const carpetY = floorY + 10;
  const carpetH = floorH - 15;

  // Velvet Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(carpetX - 3, carpetY, carpetW + 6, carpetH);

  // Royal Cobalt Velvet Body
  const carpetGrad = ctx.createLinearGradient(carpetX, 0, carpetX + carpetW, 0);
  carpetGrad.addColorStop(0, "#172554");
  carpetGrad.addColorStop(0.5, "#1e3a8a");
  carpetGrad.addColorStop(1, "#172554");
  ctx.fillStyle = carpetGrad;
  ctx.fillRect(carpetX, carpetY, carpetW, carpetH);

  // Gold Filigree Embroidery Border
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2;
  ctx.strokeRect(carpetX + 5, carpetY + 5, carpetW - 10, carpetH - 10);
  ctx.strokeStyle = "#fef08a";
  ctx.lineWidth = 1;
  ctx.strokeRect(carpetX + 9, carpetY + 9, carpetW - 18, carpetH - 18);

  // Carpet Diamond Medallions
  for (let my = carpetY + 30; my < carpetY + carpetH - 30; my += 50) {
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.moveTo(carpetX + carpetW / 2, my - 12);
    ctx.lineTo(carpetX + carpetW / 2 + 16, my);
    ctx.lineTo(carpetX + carpetW / 2, my + 12);
    ctx.lineTo(carpetX + carpetW / 2 - 16, my);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1e3a8a";
    ctx.beginPath();
    ctx.moveTo(carpetX + carpetW / 2, my - 7);
    ctx.lineTo(carpetX + carpetW / 2 + 9, my);
    ctx.lineTo(carpetX + carpetW / 2, my + 7);
    ctx.lineTo(carpetX + carpetW / 2 - 9, my);
    ctx.closePath();
    ctx.fill();
  }

  // Tasseled Gold Carpet Fringes
  ctx.fillStyle = "#fbbf24";
  for (let fx = carpetX; fx < carpetX + carpetW; fx += 4) {
    ctx.fillRect(fx, carpetY - 3, 2.5, 3);
    ctx.fillRect(fx, carpetY + carpetH, 2.5, 3);
  }

  // 5. Ashlar Stone Foundation & Dark Mahogany Wainscoting Walls (Top, Left, Right)
  // Top North Wall (y: 35..110)
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(50, 35, gw - 100, 75);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(54, 38, gw - 108, 42);

  // Stone Brick Mortar Joints
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1.5;
  for (let sy = 38; sy < 80; sy += 14) {
    ctx.beginPath();
    ctx.moveTo(54, sy);
    ctx.lineTo(gw - 54, sy);
    ctx.stroke();
    const offset = sy % 28 === 0 ? 0 : 18;
    for (let sx = 54 + offset; sx < gw - 54; sx += 36) {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy + 14);
      ctx.stroke();
    }
  }

  // Lower Mahogany Wainscoting Panel on North Wall (y: 80..110)
  ctx.fillStyle = "#3e1c07";
  ctx.fillRect(54, 80, gw - 108, 30);
  ctx.fillStyle = "#78350f";
  for (let wx = 60; wx < gw - 70; wx += 28) {
    ctx.fillRect(wx, 83, 24, 24);
    ctx.fillStyle = "#270f03";
    ctx.strokeRect(wx + 2, 85, 20, 20);
    ctx.fillStyle = "#78350f";
  }
  // Gold Chair Rail & Baseboard
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(54, 79, gw - 108, 2);
  ctx.fillStyle = "#270f03";
  ctx.fillRect(54, 107, gw - 108, 4);

  // Left & Right Wainscoted Timber Walls
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(50, 35, 12, gh - 75);
  ctx.fillRect(gw - 62, 35, 12, gh - 75);
  ctx.fillStyle = "#451a03";
  ctx.fillRect(58, 35, 4, gh - 75);
  ctx.fillRect(gw - 62, 35, 4, gh - 75);

  // 6. Arched Stained Glass Cathedral Windows (West Wall at x:60, y:190 and East Wall at x:610, y:190)
  const drawStainedGlassWindow = (wx: number, wy: number) => {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(wx - 2, wy - 2, 16, 74);
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(wx, wy, 12, 70);
    // Ruby & Amber Glass Panes
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(wx + 2, wy + 4, 8, 16);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(wx + 2, wy + 24, 8, 18);
    ctx.fillStyle = "#06b6d4";
    ctx.fillRect(wx + 2, wy + 46, 8, 20);
    // Leaded Cames
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(wx, wy, 12, 70);

    // Sunlight Shaft cast across floor
    const lightAngle = wx < 200 ? 1 : -1;
    const sunGrad = ctx.createLinearGradient(
      wx + 6,
      wy + 35,
      wx + 6 + lightAngle * 140,
      wy + 180
    );
    sunGrad.addColorStop(0, "rgba(254, 240, 138, 0.22)");
    sunGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.12)");
    sunGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.moveTo(wx + 6, wy + 20);
    ctx.lineTo(wx + 6 + lightAngle * 150, wy + 160);
    ctx.lineTo(wx + 6 + lightAngle * 170, wy + 220);
    ctx.lineTo(wx + 6, wy + 70);
    ctx.closePath();
    ctx.fill();
  };

  drawStainedGlassWindow(54, 210);
  drawStainedGlassWindow(gw - 66, 210);

  // 7. Grand Stone Fireplace & Chimney (Top Center: x: 300..400, y: 40..112)
  const fpX = 300;
  const fpY = 40;
  const fpW = 100;
  const fpH = 72;

  // Stone Chimney Breast
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(fpX - 4, fpY, fpW + 8, fpH);
  ctx.fillStyle = "#334155";
  ctx.fillRect(fpX, fpY + 4, fpW, fpH - 4);

  // Heavy Carved Mantelpiece
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(fpX - 8, fpY + 24, fpW + 16, 8);
  ctx.fillStyle = "#475569";
  ctx.fillRect(fpX - 6, fpY + 24, fpW + 12, 2.5);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(fpX + fpW / 2 - 20, fpY + 8, 40, 14); // Guild Crest Plaque
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(fpX + fpW / 2 - 18, fpY + 10, 36, 10);
  ctx.fillStyle = "#facc15";
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.fillText("PROJ GUILD", fpX + fpW / 2, fpY + 18);

  // Arched Firebox Cavity
  ctx.fillStyle = "#020617";
  ctx.fillRect(fpX + 16, fpY + 34, fpW - 32, 38);
  ctx.fillStyle = "#1c1917";
  ctx.beginPath();
  ctx.arc(fpX + fpW / 2, fpY + 42, 22, Math.PI, 0);
  ctx.fill();

  // Cast Iron Fire Grate & Burning Logs
  ctx.fillStyle = "#292524";
  ctx.fillRect(fpX + 22, fpY + 60, fpW - 44, 8);
  ctx.fillStyle = "#451a03";
  ctx.fillRect(fpX + 26, fpY + 56, fpW - 52, 6);

  // Animated Fire Flames & Sparks
  const f1 = Math.sin(time * 0.015) * 4;
  const f2 = Math.cos(time * 0.02) * 5;
  const f3 = Math.sin(time * 0.025 + 1.5) * 3;

  // Outer Crimson Flame
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.moveTo(fpX + 30, fpY + 62);
  ctx.quadraticCurveTo(fpX + 42 + f1, fpY + 38, fpX + 50 + f2, fpY + 32);
  ctx.quadraticCurveTo(fpX + 58 + f3, fpY + 38, fpX + 70, fpY + 62);
  ctx.closePath();
  ctx.fill();

  // Core Amber / Yellow Flame
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.moveTo(fpX + 36, fpY + 62);
  ctx.quadraticCurveTo(fpX + 46 + f2, fpY + 44, fpX + 50 + f1, fpY + 38);
  ctx.quadraticCurveTo(fpX + 54 + f3, fpY + 44, fpX + 64, fpY + 62);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.moveTo(fpX + 42, fpY + 62);
  ctx.lineTo(fpX + 50, fpY + 46 + f1);
  ctx.lineTo(fpX + 58, fpY + 62);
  ctx.closePath();
  ctx.fill();

  // Leaping Fire Sparks
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(
    fpX + 46 + Math.sin(time * 0.03) * 12,
    fpY + 30 - ((time * 0.05) % 20),
    2,
    2
  );
  ctx.fillRect(
    fpX + 54 + Math.cos(time * 0.025) * 10,
    fpY + 28 - (((time + 300) * 0.04) % 18),
    1.5,
    1.5
  );

  // Radial Warm Firelight Gradient on Room Floor
  const fireHalo = ctx.createRadialGradient(
    fpX + fpW / 2,
    fpY + 60,
    10,
    fpX + fpW / 2,
    fpY + 60,
    160
  );
  fireHalo.addColorStop(0, "rgba(251, 146, 60, 0.35)");
  fireHalo.addColorStop(0.5, "rgba(245, 158, 11, 0.15)");
  fireHalo.addColorStop(1, "rgba(245, 158, 11, 0)");
  ctx.fillStyle = fireHalo;
  ctx.beginPath();
  ctx.arc(fpX + fpW / 2, fpY + 60, 160, 0, Math.PI * 2);
  ctx.fill();

  // 8. Bookshelves & Tech Trophy Cabinets (North-West & North-East Corners)
  // West Tech Library
  ctx.fillStyle = "#270f03";
  ctx.fillRect(80, 80, 80, 36);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(82, 82, 76, 32);
  // Colorful Software Engineering Books
  const bookColors = [
    "#ef4444",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#06b6d4",
  ];
  for (let bx = 86; bx < 152; bx += 8) {
    const col = bookColors[Math.floor((bx * 3) / 8) % bookColors.length];
    ctx.fillStyle = col;
    ctx.fillRect(bx, 84, 6, 12);
    ctx.fillRect(bx, 99, 6, 12);
  }

  // East Drafting Desk & Architecture Blueprints (with Architect Astro)
  const deskX = 520;
  const deskY = 82;
  ctx.fillStyle = "#270f03";
  ctx.fillRect(deskX, deskY, 80, 34);
  ctx.fillStyle = "#9a3412";
  ctx.fillRect(deskX + 2, deskY + 2, 76, 30);
  // Rolled Blueprints on Desk
  ctx.fillStyle = "#0284c7";
  ctx.fillRect(deskX + 8, deskY + 6, 26, 18);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.strokeRect(deskX + 10, deskY + 8, 22, 14);
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(deskX + 40, deskY + 12, 20, 5); // Brass Drafting Compass

  // Architect Astro standing at the drafting table (Row 0 sprite)
  drawSpritesheetCharacter(
    ctx,
    charactersImage,
    0,
    deskX + 26,
    deskY + 18,
    "down",
    false,
    0,
    "none"
  );
  // Architect Astro Nameplate
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillRect(deskX + 42 - 46, deskY + 6, 92, 12);
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 7.5px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Architect Astro 🛠️", deskX + 42, deskY + 15);

  // 9. Interactive 3D Project Exhibition Stations / Pedestals
  GUILD_PROJECT_STATIONS.forEach((station) => {
    drawProjectStationPedestal(ctx, station, time);
  });

  // 10. South Entrance Double Oak Doors & Welcome Mat (x: 310..390, y: 470..520)
  const doorX = 310;
  const doorY = gh - 70;
  const doorW = 80;

  // Crimson Embroidered Welcome Exit Mat
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(doorX - 10, doorY - 14, doorW + 20, 26);
  ctx.fillStyle = "#991b1b";
  ctx.fillRect(doorX - 8, doorY - 12, doorW + 16, 22);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 2;
  ctx.strokeRect(doorX - 6, doorY - 10, doorW + 12, 18);
  ctx.fillStyle = "#fef08a";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillText("▼ EXIT TO TOWN ▼", doorX + doorW / 2, doorY + 3);

  // South Wall & Double Oak Doorway
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(50, gh - 60, doorX - 50, 60);
  ctx.fillRect(doorX + doorW, gh - 60, gw - (doorX + doorW) - 50, 60);
  ctx.fillStyle = "#3e1c07";
  ctx.fillRect(54, gh - 56, doorX - 58, 20);
  ctx.fillRect(doorX + doorW + 4, gh - 56, gw - (doorX + doorW) - 58, 20);

  // Double Door Frame
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(doorX - 4, doorY, doorW + 8, 48);
  ctx.fillStyle = "#451a03";
  ctx.fillRect(doorX, doorY + 2, 38, 44);
  ctx.fillRect(doorX + 42, doorY + 2, 38, 44);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(doorX + 3, doorY + 5, 32, 38);
  ctx.fillRect(doorX + 45, doorY + 5, 32, 38);
  // Brass Handles
  ctx.fillStyle = "#facc15";
  ctx.fillRect(doorX + 30, doorY + 22, 3, 6);
  ctx.fillRect(doorX + 47, doorY + 22, 3, 6);

  // 11. Overhead Wrought-Iron Chandeliers with Warm Pulsing Halos
  const drawChandelier = (cx: number, cy: number) => {
    // Hanging Chains
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Wheel Ring
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4 Candles & Flames
    const candles = [-18, -6, 6, 18];
    candles.forEach((ox) => {
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(cx + ox - 2, cy - 8, 4, 8);
      // Flame
      const cPulse = Math.sin(time * 0.01 + ox) * 2;
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(cx + ox - 2, cy - 8);
      ctx.lineTo(cx + ox, cy - 14 + cPulse);
      ctx.lineTo(cx + ox + 2, cy - 8);
      ctx.closePath();
      ctx.fill();
    });

    // Radial Amber Glow on Floor
    const cHalo = ctx.createRadialGradient(cx, cy + 80, 5, cx, cy + 80, 90);
    cHalo.addColorStop(0, "rgba(254, 240, 138, 0.2)");
    cHalo.addColorStop(1, "rgba(254, 240, 138, 0)");
    ctx.fillStyle = cHalo;
    ctx.beginPath();
    ctx.arc(cx, cy + 80, 90, 0, Math.PI * 2);
    ctx.fill();
  };

  drawChandelier(200, 100);
  drawChandelier(500, 100);
  drawChandelier(350, 240);
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
        // branch (Task 16 is render-order only for the overworld).
        drawProjectsGuildInterior(ctx, time, charactersImageRef.current);
        drawPlayer();
      } else {
        // Render Overworld Scene
        // 1. Ground band — always beneath everything else, unsorted: the
        // cached terrain, tall-grass clump bases and the court are flat on
        // the ground, so nothing should ever draw beneath them.
        if (terrainCacheRef.current) {
          drawTerrain(ctx, terrainCacheRef.current);
        }
        drawTallGrassBases(ctx);
        drawBasketballCourt(ctx);

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
