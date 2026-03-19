import {
  Box,
  Code,
  Database,
  GitBranch,
  Layers,
  PenTool,
  Paintbrush,
  Server,
  Container,
  Zap,
} from "lucide-react";

import Link from "next/link";

import content from "@/app/profile-data.json";
import SectionCard from "./section-card";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  code: Code,
  layers: Layers,
  zap: Zap,
  paintbrush: Paintbrush,
  server: Server,
  database: Database,
  box: Box,
  "git-branch": GitBranch,
  "pen-tool": PenTool,
  container: Container,
};

export default function TechStackCard() {
  return (
    <SectionCard className="lg:col-start-1 lg:col-span-2" style={{ animationDelay: "300ms" }}>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
            {content.techstack.eyebrow}
          </p>
          <Link
            href={content.techstack.viewAllHref ?? "/stack"}
            className="inline-flex items-center gap-1 text-xs font-medium text-(--muted) transition-colors hover:text-foreground"
          >
            View all
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {content.techstack.items.map((tech) => {
            const Icon = iconMap[tech.icon] ?? Code;

            return (
              <span
                key={tech.label}
                className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-md border border-(--border) px-3 py-1.5 text-xs font-medium text-foreground transition-colors"
              >
                <span
                  className="absolute inset-0 z-0 -translate-x-full bg-foreground transition-transform duration-300 ease-out group-hover:translate-x-0"
                  aria-hidden="true"
                />
                <span className="relative z-10 inline-flex items-center gap-1.5 transition-colors group-hover:text-background">
                  <Icon className="h-3.5 w-3.5 text-(--muted) transition-colors group-hover:text-background" />
                  {tech.label}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
