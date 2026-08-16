import {
  ArrowLeft,
  Bot,
  Box,
  CheckCircle2,
  Code,
  Container,
  Database,
  GitBranch,
  Layers,
  Paintbrush,
  PenTool,
  Server,
  Sparkles,
  Terminal,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import content from "@/app/profile-data.json";

export const metadata: Metadata = {
  title: "Tech Stack & Skills",
  description:
    "Comprehensive overview of Franze William Calleja's production technologies, infrastructure toolchains, agentic AI harnesses, and core engineering competencies.",
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
  terminal: Terminal,
  bot: Bot,
  sparkles: Sparkles,
};

export default function StackPage() {
  const techItems = content.techstack.items;
  const categories = content.skills.categories;

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-5 sm:px-8 sm:pb-32 sm:pt-8 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12 sm:space-y-16">
        {/* Page Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
              Profile Index // Technical Arsenal
            </p>
            <h1 className="mt-3 text-4xl font-black leading-[0.92] tracking-tight sm:mt-4 sm:text-6xl lg:text-7xl">
              TECH STACK & SKILLS.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
              A comprehensive breakdown of active production technologies, cloud infrastructure, AI orchestration workflows, and full-stack engineering competencies.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex h-10 shrink-0 items-center gap-2 border border-foreground/60 px-4 font-mono text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-foreground hover:bg-foreground hover:text-background sm:h-11 sm:px-5"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Section 1: Core Technologies & Daily Drivers */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-foreground/35 pb-3">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--muted)">
                {"01 // Technologies & Tools"}
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight sm:text-3xl">
                Core Toolchain ({techItems.length})
              </h2>
            </div>
            <span className="hidden font-mono text-xs text-(--muted) sm:inline">
              Production Active
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {techItems.map((tech) => {
              const Icon = iconMap[tech.icon] ?? Code;

              return (
                <article
                  key={tech.label}
                  className="group flex items-center justify-between border border-foreground/35 bg-background p-3.5 transition-all duration-200 hover:border-foreground hover:bg-foreground/5 hover:shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-foreground/30 text-foreground transition-colors group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-foreground">
                        {tech.label}
                      </h3>
                      <p className="truncate font-mono text-[11px] text-(--muted)">
                        {tech.category}
                      </p>
                    </div>
                  </div>

                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                    title="Active in production"
                    aria-label="Active in production"
                  />
                </article>
              );
            })}
          </div>
        </section>

        {/* Section 2: Core Engineering Competencies */}
        <section className="space-y-6">
          <div className="border-b border-foreground/35 pb-3">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--muted)">
              {"02 // Domain Competencies"}
            </p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight sm:text-3xl">
              Architectural & Domain Mastery
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((cat, idx) => (
              <article
                key={cat.name}
                className="flex flex-col border border-foreground/50 bg-background p-6 transition-all duration-200 hover:border-foreground sm:p-7"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
                    {`0${idx + 1} // DOMAIN`}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-(--muted)">
                    {cat.items.length} Focus Areas
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                  {cat.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-(--muted)">
                  {cat.description}
                </p>

                <div className="my-5 border-t border-foreground/20" />

                <ul className="space-y-2.5">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Bottom Navigation CTA */}
        <section className="border-t border-foreground/35 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-xs text-(--muted)">
              Franze William Calleja // 2026
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link
                href="/projects"
                className="inline-flex h-9 items-center border border-foreground/40 px-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
              >
                View Projects →
              </Link>
              <Link
                href="/stats"
                className="inline-flex h-9 items-center border border-foreground/40 px-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
              >
                Telemetry & Vitals →
              </Link>
              <Link
                href="/chat"
                className="inline-flex h-9 items-center border border-foreground/40 px-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
              >
                Open Terminal →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
