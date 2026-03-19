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
    <SectionCard className="lg:col-start-1 lg:col-span-2">
      <div className="space-y-2.5">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
          {content.techstack.eyebrow}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {content.techstack.items.map((tech) => {
            const Icon = iconMap[tech.icon] ?? Code;

            return (
              <span
                key={tech.label}
                className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)]"
              >
                <Icon className="h-3.5 w-3.5 text-[color:var(--muted)]" />
                {tech.label}
              </span>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
