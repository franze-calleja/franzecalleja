import { WORLD_OBJECTS, type WorldObject } from "./game-data";
import type { Drawable } from "./game-pixel";

// Statues and banners predate the pixel contract (game-props.ts's header
// comment covers the other five) and still paint with gradients/arcs/rgba —
// out of scope for Task 16, which is render-order only. This module exists
// so each statue/banner can be collected as an individually baseline-sorted
// Drawable instead of the whole category drawing as one opaque block ahead
// of (or behind) everything else, which was the root of the occlusion bug.

function drawOneBanner(ctx: CanvasRenderingContext2D, time: number, banner: WorldObject): void {
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
}

/** One Drawable per banner, baseline = banner.y + banner.height — the same
 *  obj.y + obj.height convention as buildings, since WorldObject shares the
 *  field. */
export function collectBanners(ctx: CanvasRenderingContext2D, time: number): Drawable[] {
  return WORLD_OBJECTS.filter((o) => o.type === "banner").map((banner) => ({
    baseline: banner.y + banner.height,
    draw: () => drawOneBanner(ctx, time, banner),
  }));
}

function drawOneStatue(ctx: CanvasRenderingContext2D, time: number, statue: WorldObject): void {
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
}

/** One Drawable per statue, baseline = statue.y + statue.height. */
export function collectStatues(ctx: CanvasRenderingContext2D, time: number): Drawable[] {
  return WORLD_OBJECTS.filter((o) => o.type === "statue").map((statue) => ({
    baseline: statue.y + statue.height,
    draw: () => drawOneStatue(ctx, time, statue),
  }));
}
