import {
  ArrowLeft,
  Box,
  Code,
  Container,
  Database,
  GitBranch,
  Layers,
  Paintbrush,
  PenTool,
  Server,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import content from "@/app/profile-data.json";
import SectionCard from "@/components/section-card";

export const metadata: Metadata = {
  title: "Tech Stack & Skills",
  description:
    "Franze William Calleja's organized tech stack and skill capability levels, ordered by familiarity.",
};

type TechItem = {
  label: string;
  icon: string;
  level: number;
};

type SkillSummaryItem = {
  label: string;
  level: number;
};

const iconMap: Record<string, LucideIcon> = {
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

const sortedTechStack = [...(content.techstack.items as TechItem[])].sort(
  (left, right) => right.level - left.level,
);

const skillsSummary = content.skills.overall as SkillSummaryItem[];

export default function StackPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-4 font-sans sm:px-10 sm:py-7 lg:px-16 lg:py-8">
      <div className="w-full space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--surface) px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
              Combined view
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Tech Stack & Skills
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-(--muted) sm:text-[0.95rem]">
              Ordered by familiarity so the strongest tools and capabilities are
              easy to scan first.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1 self-start rounded-full border border-(--border) px-3 py-1.5 text-xs font-medium text-(--muted) transition-colors hover:bg-(--hover) hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>

        <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
          <SectionCard style={{ animationDelay: "0ms" }}>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-foreground" aria-hidden="true" />
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
                      {content.techstack.eyebrow}
                    </p>
                  </div>
                  <p className="text-sm text-(--muted)">
                    Ordered from strongest to emerging familiarity.
                  </p>
                </div>
                
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {sortedTechStack.map((tech) => {
                  const Icon = iconMap[tech.icon] ?? Code;

                  return (
                    <article
                      key={tech.label}
                      className="space-y-3 rounded-lg border border-(--border) bg-(--surface) p-3 transition-colors hover:bg-(--hover)"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-(--border) bg-(--hover)">
                            <Icon className="h-4 w-4 text-(--muted)" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold leading-tight text-foreground">
                              {tech.label}
                            </p>
                            <p className="text-[0.7rem] text-(--muted)">
                              Familiarity meter
                            </p>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-(--muted)">
                          {tech.level}%
                        </p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-(--hover)">
                        <div
                          className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out"
                          style={{ width: `${tech.level}%` }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          <SectionCard style={{ animationDelay: "120ms" }}>
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-foreground" aria-hidden="true" />
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
                    {content.skills.eyebrow}
                  </p>
                </div>
                <p className="text-sm text-(--muted)">
                  Overall capability by area.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {skillsSummary.map((skill) => (
                  <SkillMeter key={skill.label} item={skill} />
                ))}
              </div>

              <div className="rounded-lg border border-(--border) bg-(--surface) p-3 text-xs leading-6 text-(--muted)">
                Detailed breakdown is preserved in the data source for future use
                and deeper pages.
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}

function SkillMeter({ item }: { item: SkillSummaryItem }) {
  return (
    <div className="space-y-1.5 rounded-md border border-(--border) bg-(--surface) p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{item.label}</p>
        <p className="text-xs font-medium text-(--muted)">{item.level}%</p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-(--hover)">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out"
          style={{ width: `${item.level}%` }}
        />
      </div>
    </div>
  );
}
