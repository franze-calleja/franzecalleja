"use client";

import React from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { retroAudio } from "./game-audio";

interface GameControlsProps {
  onDirectionChange: (direction: "up" | "down" | "left" | "right" | null) => void;
  onInteract: () => void;
  onRunToggle: (running: boolean) => void;
  onChangeSkin?: () => void;
  isInteractingDisabled?: boolean;
}

export default function GameControls({
  onDirectionChange,
  onInteract,
  onRunToggle,
  onChangeSkin,
  isInteractingDisabled = false,
}: GameControlsProps) {
  const handleTouchStart = (dir: "up" | "down" | "left" | "right") => {
    retroAudio.playStep();
    onDirectionChange(dir);
  };

  const handleTouchEnd = () => {
    onDirectionChange(null);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-50 flex items-end justify-between px-4 sm:hidden">
      {/* Retro D-Pad (Left) */}
      <div className="pointer-events-auto relative h-36 w-36 select-none touch-none">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1">
          {/* Top Row */}
          <div />
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleTouchStart("up");
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTouchEnd();
            }}
            onMouseDown={() => handleTouchStart("up")}
            onMouseUp={() => handleTouchEnd()}
            className="flex items-center justify-center rounded-t-md border-2 border-foreground bg-foreground/90 text-background shadow active:bg-foreground"
            aria-label="Move Up"
          >
            <ChevronUp className="h-6 w-6" />
          </button>
          <div />

          {/* Middle Row */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleTouchStart("left");
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTouchEnd();
            }}
            onMouseDown={() => handleTouchStart("left")}
            onMouseUp={() => handleTouchEnd()}
            className="flex items-center justify-center rounded-l-md border-2 border-foreground bg-foreground/90 text-background shadow active:bg-foreground"
            aria-label="Move Left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="border-2 border-foreground bg-foreground/70" />

          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleTouchStart("right");
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTouchEnd();
            }}
            onMouseDown={() => handleTouchStart("right")}
            onMouseUp={() => handleTouchEnd()}
            className="flex items-center justify-center rounded-r-md border-2 border-foreground bg-foreground/90 text-background shadow active:bg-foreground"
            aria-label="Move Right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Bottom Row */}
          <div />
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleTouchStart("down");
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTouchEnd();
            }}
            onMouseDown={() => handleTouchStart("down")}
            onMouseUp={() => handleTouchEnd()}
            className="flex items-center justify-center rounded-b-md border-2 border-foreground bg-foreground/90 text-background shadow active:bg-foreground"
            aria-label="Move Down"
          >
            <ChevronDown className="h-6 w-6" />
          </button>
          <div />
        </div>
      </div>

      {/* Retro Action Buttons (Right) */}
      <div className="pointer-events-auto flex items-center gap-2.5 pb-2 select-none touch-none">
        {/* [C] Change Skin Button */}
        {onChangeSkin && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              retroAudio.playInteract();
              onChangeSkin();
            }}
            onClick={() => {
              retroAudio.playInteract();
              onChangeSkin();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border-3 border-foreground bg-purple-600 font-mono text-sm font-black text-white shadow-[0_3px_0_0_#4c1d95] active:translate-y-1 active:shadow-none"
            aria-label="C Button (Change Skin)"
          >
            C
          </button>
        )}

        {/* [B] Run / Cancel Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onRunToggle(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onRunToggle(false);
          }}
          onMouseDown={() => onRunToggle(true)}
          onMouseUp={() => onRunToggle(false)}
          className="flex h-13 w-13 items-center justify-center rounded-full border-3 border-foreground bg-amber-500 font-mono text-base font-black text-slate-950 shadow-[0_4px_0_0_#78350f] active:translate-y-1 active:shadow-none"
          aria-label="B Button (Run)"
        >
          B
        </button>

        {/* [A] Action / Interact Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            if (!isInteractingDisabled) {
              retroAudio.playInteract();
              onInteract();
            }
          }}
          onMouseDown={() => {
            if (!isInteractingDisabled) {
              retroAudio.playInteract();
              onInteract();
            }
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full border-3 border-foreground bg-emerald-500 font-mono text-lg font-black text-slate-950 shadow-[0_4px_0_0_#065f46] active:translate-y-1 active:shadow-none"
          aria-label="A Button (Interact)"
        >
          A
        </button>
      </div>
    </div>
  );
}
