"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Check, Sparkles, User, ShieldCheck } from "lucide-react";
import { retroAudio } from "./game-audio";
import { CharacterSkin, CHARACTER_SKINS } from "./game-data";

interface GameCharacterSelectProps {
  currentSkinId: string;
  onSelectSkin: (skinId: string) => void;
  onClose: () => void;
}

export default function GameCharacterSelect({
  currentSkinId,
  onSelectSkin,
  onClose,
}: GameCharacterSelectProps) {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const idx = CHARACTER_SKINS.findIndex((s) => s.id === currentSkinId);
    return idx >= 0 ? idx : 0;
  });

  const selectedSkin = CHARACTER_SKINS[selectedIndex] || CHARACTER_SKINS[0];
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const charactersImageRef = useRef<HTMLImageElement | null>(null);

  // Load characters spritesheet
  useEffect(() => {
    const img = new Image();
    img.src = "/game/Characters_V3_Colour.png";
    img.onload = () => {
      charactersImageRef.current = img;
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        e.preventDefault();
        e.stopPropagation();
        retroAudio.playCancel();
        onClose();
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        e.stopPropagation();
        retroAudio.playMenuHover();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : CHARACTER_SKINS.length - 1));
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        e.stopPropagation();
        retroAudio.playMenuHover();
        setSelectedIndex((prev) => (prev < CHARACTER_SKINS.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        if (selectedSkin.id !== currentSkinId) {
          retroAudio.playSuccess();
          onSelectSkin(selectedSkin.id);
        } else {
          retroAudio.playCancel();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, selectedSkin, currentSkinId, onSelectSkin, onClose]);

  // Animated Character Sprite Preview
  useEffect(() => {
    let animId: number;

    const renderPreview = () => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      const time = Date.now();
      const isWalk = Math.floor(time / 200) % 2 === 0;
      const breath = Math.sin(time * 0.006) * 1.5;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 10;

      // Drop Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 22, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (selectedSkin.spriteType === "dog") {
        // Render animated Shih Tzu preview
        const tailWag = Math.sin(time * 0.016) * 4.5;
        const earBounce = Math.sin(time * 0.008) * 1.5;

        ctx.save();
        ctx.translate(cx, cy);

        // Plume Tail
        ctx.fillStyle = "#fae8b6";
        ctx.beginPath();
        ctx.moveTo(-10, 3 + breath);
        ctx.quadraticCurveTo(-20 + tailWag, -10, -12 + tailWag, -14);
        ctx.quadraticCurveTo(-4, -6, -4, 2 + breath);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-14 + tailWag, -16, 8, 6);

        // Paws
        ctx.fillStyle = "#e2d1a8";
        ctx.fillRect(-8, 8, 5, 7);
        ctx.fillRect(4, 8, 5, 7);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-8, 12, 5, 3);
        ctx.fillRect(4, 12, 5, 3);

        // Cream Body
        ctx.fillStyle = "#fef3c7";
        ctx.fillRect(-11, 0 + breath, 22, 12);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(1, 2 + breath, 10, 10);

        // Red Collar & Heart Tag
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(3, -1 + breath, 8, 3.5);
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(6, 2.5 + breath, 3, 3);

        // Head & Muzzle
        ctx.fillStyle = "#fef3c7";
        ctx.fillRect(4, -12 + breath, 14, 13);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(12, -7 + breath, 8, 7);

        // Nose
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(16.5, -8 + breath, 4, 3.5);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(17, -8 + breath, 1.5, 1.5);

        // Eyes
        ctx.fillStyle = "#1e1b4b";
        ctx.fillRect(10, -8 + breath, 4, 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(10.5, -8 + breath, 1.5, 1.5);

        // Ribbon Bow
        ctx.fillStyle = "#f43f5e";
        ctx.fillRect(7, -15 + breath, 4, 4);
        ctx.fillRect(13, -15 + breath, 4, 4);
        ctx.fillStyle = "#fb7185";
        ctx.fillRect(10, -14.5 + breath, 3, 3);

        // Dark Ears
        ctx.fillStyle = "#451a03";
        ctx.fillRect(2, -10 + breath + earBounce, 5, 10);
        ctx.fillStyle = "#78350f";
        ctx.fillRect(3, -9 + breath + earBounce, 3, 8);

        ctx.restore();
      } else {
        // Spritesheet character preview
        const img = charactersImageRef.current;
        if (img) {
          const colIndex = isWalk ? 4 : 0;
          const sx = colIndex * 16;
          const sy = selectedSkin.spriteRow * 16;
          const sw = 16;
          const sh = 16;
          const dw = 48;
          const dh = 48;

          // Custom Aura
          if (selectedSkin.customEffect === "azra") {
            const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 32);
            grad.addColorStop(0, "rgba(56, 189, 248, 0.8)");
            grad.addColorStop(0.5, "rgba(14, 165, 233, 0.3)");
            grad.addColorStop(1, "rgba(56, 189, 248, 0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, 32, 0, Math.PI * 2);
            ctx.fill();
          } else if (selectedSkin.customEffect === "allia") {
            const pinkGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 32);
            pinkGrad.addColorStop(0, "rgba(244, 63, 94, 0.7)");
            pinkGrad.addColorStop(0.5, "rgba(251, 113, 133, 0.3)");
            pinkGrad.addColorStop(1, "rgba(244, 63, 94, 0)");
            ctx.fillStyle = pinkGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, 32, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.drawImage(img, sx, sy, sw, sh, cx - dw / 2, cy - dh / 2 + breath, dw, dh);
        } else {
          ctx.fillStyle = selectedSkin.previewColor;
          ctx.fillRect(cx - 16, cy - 24, 32, 48);
        }
      }

      animId = requestAnimationFrame(renderPreview);
    };

    animId = requestAnimationFrame(renderPreview);
    return () => cancelAnimationFrame(animId);
  }, [selectedSkin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-xl border-4 border-foreground bg-(--surface) font-mono shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
        style={{
          boxShadow: "8px 8px 0px 0px rgba(0,0,0,0.85), inset 0 0 0 2px var(--surface)",
        }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-foreground bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-background">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            <span className="text-sm">CHOOSE YOUR HERO // HERO SELECT</span>
          </div>

          <button
            onClick={() => {
              retroAudio.playCancel();
              onClose();
            }}
            className="flex h-6 w-6 items-center justify-center rounded border border-background/20 bg-background/10 hover:bg-red-500 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Close (Esc)"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Main Hero Showcase Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-lg border-2 border-foreground/30 bg-background/50 p-4 shadow-inner">
            {/* Animated Sprite Stage */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-xl border-2 border-foreground/40 bg-gradient-to-b from-slate-900 to-slate-950 shadow-md">
                <canvas
                  ref={previewCanvasRef}
                  width={140}
                  height={140}
                  className="h-full w-full"
                  style={{ imageRendering: "pixelated" }}
                />
                <div className="absolute top-2 left-2 rounded bg-foreground/90 px-1.5 py-0.5 text-[9px] font-bold text-background uppercase">
                  {selectedSkin.badge}
                </div>
              </div>
            </div>

            {/* Character Info & Equip Action */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedSkin.iconEmoji}</span>
                    <h3 className="text-lg font-extrabold text-foreground tracking-wide">
                      {selectedSkin.name}
                    </h3>
                  </div>
                  {selectedSkin.id === currentSkinId && (
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-500/50 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-400 shadow">
                      <ShieldCheck className="h-3 w-3" />
                      EQUIPPED
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-amber-400 mt-0.5">
                  {selectedSkin.subtitle} • {selectedSkin.role}
                </p>

                <p className="text-xs leading-relaxed text-(--muted) mt-2 bg-(--surface)/80 border border-foreground/15 rounded p-2">
                  {selectedSkin.description}
                </p>
              </div>

              {/* Equip / Selected Button */}
              <div className="pt-1 flex items-center gap-2">
                {selectedSkin.id === currentSkinId ? (
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-emerald-500 bg-emerald-600/30 py-2 font-bold text-xs text-emerald-300 opacity-90 cursor-default"
                  >
                    <Check className="h-4 w-4" />
                    <span>CURRENTLY EQUIPPED</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      retroAudio.playSuccess();
                      onSelectSkin(selectedSkin.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-foreground bg-amber-500 hover:bg-amber-400 active:scale-95 py-2 font-bold text-xs text-slate-950 shadow-md transition-all cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>SELECT & PLAY AS {selectedSkin.name.toUpperCase()}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Character Roster Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase text-(--muted) tracking-wider">
                AVAILABLE CHARACTERS & SKINS ({CHARACTER_SKINS.length})
              </span>
              <div className="flex items-center gap-1 text-[10px] text-(--muted)">
                <span>Use [A]/[D] or Arrow keys</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CHARACTER_SKINS.map((skin, idx) => {
                const isSelected = idx === selectedIndex;
                const isEquipped = skin.id === currentSkinId;

                return (
                  <button
                    key={skin.id}
                    onClick={() => {
                      retroAudio.playMenuHover();
                      setSelectedIndex(idx);
                    }}
                    className={`relative flex flex-col items-center justify-center p-2.5 rounded-lg border-2 text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-amber-400 bg-amber-500/15 shadow-[0_0_12px_rgba(251,191,36,0.3)] scale-102"
                        : "border-foreground/20 bg-(--surface)/60 hover:border-foreground/50 hover:bg-(--surface)"
                    }`}
                  >
                    {isEquipped && (
                      <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-400 shadow animate-pulse" />
                    )}

                    <span className="text-2xl mb-1">{skin.iconEmoji}</span>
                    <span className="font-bold text-xs text-foreground truncate w-full">
                      {skin.name}
                    </span>
                    <span className="text-[9px] text-(--muted) truncate w-full mt-0.5">
                      {skin.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Navigation & Instructions */}
        <div className="flex items-center justify-between border-t-2 border-foreground/20 bg-foreground/5 px-4 py-2.5 text-xs text-(--muted)">
          <div className="flex items-center gap-3">
            <span>[← / →] Cycle</span>
            <span>[Space/Enter] Equip</span>
            <span>[Esc / C] Close</span>
          </div>

          <button
            onClick={() => {
              retroAudio.playCancel();
              onClose();
            }}
            className="rounded border border-foreground/30 bg-background px-3 py-1 font-bold text-foreground hover:bg-foreground hover:text-background transition-all active:scale-95 cursor-pointer"
          >
            RETURN TO GAME
          </button>
        </div>
      </div>
    </div>
  );
}
