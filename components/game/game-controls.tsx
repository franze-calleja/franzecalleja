"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { retroAudio } from "./game-audio";
import { resolveDpadDirection, type DpadDirection } from "./game-dpad";

interface GameControlsProps {
  onDirectionChange: (direction: DpadDirection | null) => void;
  onInteract: () => void;
  onRunToggle: (running: boolean) => void;
  onChangeSkin?: () => void;
  isInteractingDisabled?: boolean;
}

/** Arms of the pad, in grid order, with the cell each one occupies. */
const DPAD_ARMS: {
  dir: DpadDirection;
  label: string;
  Icon: typeof ChevronUp;
  className: string;
}[] = [
  { dir: "up", label: "Move Up", Icon: ChevronUp, className: "col-start-2 row-start-1 rounded-t-md" },
  { dir: "left", label: "Move Left", Icon: ChevronLeft, className: "col-start-1 row-start-2 rounded-l-md" },
  { dir: "right", label: "Move Right", Icon: ChevronRight, className: "col-start-3 row-start-2 rounded-r-md" },
  { dir: "down", label: "Move Down", Icon: ChevronDown, className: "col-start-2 row-start-3 rounded-b-md" },
];

export default function GameControls({
  onDirectionChange,
  onInteract,
  onRunToggle,
  onChangeSkin,
  isInteractingDisabled = false,
}: GameControlsProps) {
  const dpadRef = useRef<HTMLDivElement>(null);
  const [activeDir, setActiveDir] = useState<DpadDirection | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // The latest direction, readable from an event handler without making that
  // handler depend on render state.
  const activeDirRef = useRef<DpadDirection | null>(null);
  const isRunningRef = useRef(false);
  // Whether a mouse button is currently held on the pad, so mousemove only
  // steers while dragging (desktop convenience; touch is the real path).
  const isMouseDownRef = useRef(false);

  // The parent passes these as inline arrows, so their identity changes on
  // every one of its renders. Reading them through a ref keeps the handlers
  // below stable — and, critically, keeps the unmount cleanup from re-running
  // on every parent render and cancelling an in-progress press.
  const callbacksRef = useRef({ onDirectionChange, onRunToggle });
  // Assigned in an effect rather than during render: refs must not be written
  // while rendering. No dep array, so it refreshes after every render and the
  // handlers always see the current props.
  useEffect(() => {
    callbacksRef.current = { onDirectionChange, onRunToggle };
  });

  /**
   * Single funnel for direction changes. Fires the callback only on an actual
   * change, so sliding a thumb across one arm doesn't spam the game loop (or
   * the step sound) on every touchmove sample.
   */
  const applyDirection = useCallback((dir: DpadDirection | null) => {
    if (dir === activeDirRef.current) return;
    activeDirRef.current = dir;
    setActiveDir(dir);
    if (dir) retroAudio.playStep();
    callbacksRef.current.onDirectionChange(dir);
  }, []);

  const steerTo = useCallback(
    (clientX: number, clientY: number) => {
      const el = dpadRef.current;
      if (!el) return;
      applyDirection(resolveDpadDirection(clientX, clientY, el.getBoundingClientRect()));
    },
    [applyDirection],
  );

  const releaseDpad = useCallback(() => {
    isMouseDownRef.current = false;
    applyDirection(null);
  }, [applyDirection]);

  const setRunning = useCallback((running: boolean) => {
    if (running === isRunningRef.current) return;
    isRunningRef.current = running;
    setIsRunning(running);
    callbacksRef.current.onRunToggle(running);
  }, []);

  // If this overlay unmounts mid-press — a route change, the controls being
  // hidden — the game would otherwise keep the last direction and run state
  // latched. Empty deps: this must fire on real unmount only, never on a
  // parent re-render.
  useEffect(() => {
    return () => {
      if (activeDirRef.current) callbacksRef.current.onDirectionChange(null);
      if (isRunningRef.current) callbacksRef.current.onRunToggle(false);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-50 flex items-end justify-between px-4 sm:hidden">
      {/* Retro D-Pad (Left) */}
      <div
        ref={dpadRef}
        // Touch is handled on the pad as a whole rather than per arm: a touch
        // stays captured by the element it started on, so per-arm handlers
        // can't see a thumb slide from one direction into the next.
        onTouchStart={(e) => {
          e.preventDefault();
          const t = e.touches[0];
          if (t) steerTo(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const t = e.touches[0];
          if (t) steerTo(t.clientX, t.clientY);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          releaseDpad();
        }}
        // Without this the player walks forever when the OS steals the touch
        // (notification shade, incoming call, system edge gesture): touchcancel
        // fires in place of touchend, and the direction never gets cleared.
        onTouchCancel={(e) => {
          e.preventDefault();
          releaseDpad();
        }}
        onMouseDown={(e) => {
          isMouseDownRef.current = true;
          steerTo(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          if (isMouseDownRef.current) steerTo(e.clientX, e.clientY);
        }}
        onMouseUp={releaseDpad}
        // Releasing the mouse outside the pad never fires mouseup on it.
        onMouseLeave={releaseDpad}
        className="pointer-events-auto relative h-36 w-36 touch-none select-none"
      >
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1">
          {DPAD_ARMS.map(({ dir, label, Icon, className }) => (
            <button
              key={dir}
              type="button"
              aria-label={label}
              aria-pressed={activeDir === dir}
              // The pad owns the pointer input; the arms are the visual and
              // the accessible names for it.
              tabIndex={-1}
              className={`pointer-events-none flex items-center justify-center border-2 border-foreground text-background shadow transition-colors ${className} ${
                activeDir === dir ? "bg-foreground" : "bg-foreground/90"
              }`}
            >
              <Icon className="h-6 w-6" />
            </button>
          ))}

          <div className="col-start-2 row-start-2 border-2 border-foreground bg-foreground/70" />
        </div>
      </div>

      {/* Retro Action Buttons (Right) */}
      <div className="pointer-events-auto flex items-center gap-2.5 pb-2 select-none touch-none">
        {/* [C] Change Skin Button */}
        {onChangeSkin && (
          <button
            type="button"
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
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            setRunning(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setRunning(false);
          }}
          // Same latch risk as the d-pad: without this an interrupted touch
          // leaves the player sprinting with no button held.
          onTouchCancel={(e) => {
            e.preventDefault();
            setRunning(false);
          }}
          onMouseDown={() => setRunning(true)}
          onMouseUp={() => setRunning(false)}
          onMouseLeave={() => setRunning(false)}
          aria-pressed={isRunning}
          className={`flex h-13 w-13 items-center justify-center rounded-full border-3 border-foreground bg-amber-500 font-mono text-base font-black text-slate-950 transition-all ${
            isRunning ? "translate-y-1 shadow-none" : "shadow-[0_4px_0_0_#78350f]"
          }`}
          aria-label="B Button (Run)"
        >
          B
        </button>

        {/* [A] Action / Interact Button */}
        <button
          type="button"
          disabled={isInteractingDisabled}
          onTouchStart={(e) => {
            e.preventDefault();
            if (isInteractingDisabled) return;
            retroAudio.playInteract();
            onInteract();
          }}
          onMouseDown={() => {
            if (isInteractingDisabled) return;
            retroAudio.playInteract();
            onInteract();
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full border-3 border-foreground bg-emerald-500 font-mono text-lg font-black text-slate-950 shadow-[0_4px_0_0_#065f46] transition-all active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:translate-y-1 disabled:border-foreground/40 disabled:bg-emerald-500/30 disabled:text-slate-950/40 disabled:shadow-none"
          aria-label="A Button (Interact)"
        >
          A
        </button>
      </div>
    </div>
  );
}
