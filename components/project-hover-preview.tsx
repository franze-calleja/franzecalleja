"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import { ExternalLink, Lock, ShieldCheck, Globe, Smartphone, Activity } from "lucide-react";

import { previewPosition } from "@/lib/preview-position";

export type ProjectPreviewData = {
  name: string;
  description: string;
  href: string;
  technologies: string[];
  image?: string;
};

interface ProjectHoverPreviewProps {
  activeProject: ProjectPreviewData | null;
  /** Every project the page can preview; their screenshots load up front so a hover shows one instantly. */
  projects: ProjectPreviewData[];
}

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const CARD = { width: 360, height: 260 };
/** Fraction of the remaining distance the card closes each frame. */
const FOLLOW_SPEED = 0.22;

function subscribeFinePointer(onChange: () => void) {
  const mediaQuery = window.matchMedia(FINE_POINTER);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getProjectDomain(href: string): string {
  try {
    const url = new URL(href);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return href.replace(/^https?:\/\//, "");
  }
}

function getProjectCategory(project: ProjectPreviewData) {
  const name = project.name.toLowerCase();
  const tech = project.technologies.map((t) => t.toLowerCase());

  if (tech.includes("react native") || tech.includes("expo")) {
    return { label: "Mobile App", icon: Smartphone };
  }
  if (name.includes("attendance") || name.includes("nfc")) {
    return { label: "IoT & Hardware", icon: Activity };
  }
  if (name.includes("hrims") || name.includes("upfps") || name.includes("portal") || name.includes("cms")) {
    return { label: "Enterprise Platform", icon: Lock };
  }
  if (name.includes("aem") || name.includes("algorithmic")) {
    return { label: "AI Governance", icon: ShieldCheck };
  }
  return { label: "Web Platform", icon: Globe };
}

export default function ProjectHoverPreview({ activeProject, projects }: ProjectHoverPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -500, y: -500 });
  const posRef = useRef({ x: -500, y: -500 });
  const isFinePointer = useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false,
  );
  const isActive = activeProject !== null;

  // Track the cursor cheaply all the time, so a hover starts at the cursor.
  useEffect(() => {
    if (!isFinePointer) return;
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [isFinePointer]);

  // Follow the cursor only while a project is hovered.
  useEffect(() => {
    if (!isFinePointer || !isActive) return;

    const place = () => {
      const { x, y } = previewPosition(posRef.current, CARD, { width: window.innerWidth, height: window.innerHeight });
      if (containerRef.current) containerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    // Start at the cursor instead of gliding in from wherever the last hover ended.
    posRef.current = { ...mouseRef.current };
    place();

    let animationFrameId = 0;
    const render = () => {
      posRef.current.x += (mouseRef.current.x - posRef.current.x) * FOLLOW_SPEED;
      posRef.current.y += (mouseRef.current.y - posRef.current.y) * FOLLOW_SPEED;
      place();
      animationFrameId = requestAnimationFrame(render);
    };
    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isFinePointer, isActive]);

  if (!isFinePointer) return null;

  const category = activeProject ? getProjectCategory(activeProject) : null;
  const CategoryIcon = category ? category.icon : Globe;
  const domain = activeProject ? getProjectDomain(activeProject.href) : "";
  const isInternal = domain.includes("mseufcandelaria.com") && !domain.startsWith("mseufcandelaria.com");

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-9990 hidden w-[340px] sm:w-[360px] md:block transition-[opacity,scale] duration-250 ease-out will-change-transform ${
        activeProject
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95"
      }`}
      style={{ transformOrigin: "center left" }}
    >
      <div className="overflow-hidden border border-foreground bg-background shadow-[0_24px_60px_rgba(14,16,15,0.35)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
        {/* Mini Browser Bar */}
        <div className="flex items-center justify-between border-b border-foreground/30 bg-(--surface) px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-foreground/50 bg-red-500/80" />
            <span className="h-2 w-2 rounded-full border border-foreground/50 bg-amber-500/80" />
            <span className="h-2 w-2 rounded-full border border-foreground/50 bg-emerald-500/80" />
          </div>

          <div className="flex max-w-[200px] items-center gap-1 truncate rounded border border-foreground/25 bg-background/80 px-2 py-0.5 font-mono text-[10px] text-foreground/80">
            {isInternal ? (
              <Lock className="h-2.5 w-2.5 shrink-0 text-amber-500" />
            ) : (
              <Globe className="h-2.5 w-2.5 shrink-0 text-(--muted)" />
            )}
            <span className="truncate">{domain || "localhost:3000"}</span>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-wider text-(--muted)">
            PREVIEW
          </span>
        </div>

        {/* Preview Screen Body */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-foreground/5">
          {projects
            .filter((project) => project.image?.trim())
            .map((project) => (
              <Image
                key={project.name}
                src={project.image!}
                alt=""
                fill
                sizes="360px"
                quality={85}
                loading="eager"
                className={`object-cover object-top ${project.name === activeProject?.name ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          {activeProject?.image?.trim() ? null : (
            <div className="flex h-full w-full flex-col justify-between p-4 font-mono text-xs">
              {/* Top Row: System Tag & Category */}
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 border border-foreground/30 bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                  <CategoryIcon className="h-3 w-3" />
                  <span>{category?.label}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-(--muted)">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{isInternal ? "Enterprise Auth" : "Online"}</span>
                </span>
              </div>

              {/* Center Architecture Wireframe Blueprint */}
              <div className="my-auto space-y-1.5 rounded border border-foreground/20 bg-background/60 p-2.5">
                <div className="flex items-center justify-between text-[10px] text-(--muted)">
                  <span className="font-bold text-foreground truncate max-w-[200px]">
                    {activeProject?.name}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  <div className="h-5 rounded bg-foreground/10 flex items-center justify-center text-[9px]">
                    UI / App
                  </div>
                  <div className="h-5 rounded bg-foreground/10 flex items-center justify-center text-[9px]">
                    API / ORM
                  </div>
                  <div className="h-5 rounded bg-foreground/10 flex items-center justify-center text-[9px]">
                    DB / Cache
                  </div>
                </div>
              </div>

              {/* Bottom Row Tech Stack Chips */}
              <div className="flex flex-wrap gap-1">
                {activeProject?.technologies.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="border border-foreground/25 bg-background px-1.5 py-0.5 text-[9px] font-semibold text-foreground/80"
                  >
                    {tech}
                  </span>
                ))}
                {(activeProject?.technologies.length ?? 0) > 4 && (
                  <span className="px-1 py-0.5 text-[9px] text-(--muted)">
                    +{(activeProject?.technologies.length ?? 0) - 4}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer Detail */}
        <div className="border-t border-foreground/20 bg-background p-2.5">
          <p className="line-clamp-1 font-mono text-[11px] font-bold uppercase tracking-wide text-foreground">
            {activeProject?.name}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-(--muted)">
            {activeProject?.description}
          </p>
        </div>
      </div>
    </div>
  );
}
