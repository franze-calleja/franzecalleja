"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Code2, Server, Activity, Plus, Sparkles, type LucideIcon } from "lucide-react";

import content from "@/app/profile-data.json";

type ArsenalCategory = {
  index: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  items: string[];
};

const arsenalCategories: ArsenalCategory[] = [
  {
    index: "01",
    title: "Frontend & Interfaces",
    subtitle: "Component design systems, responsive web, and cross-platform mobile",
    icon: Code2,
    items: [
      "TypeScript",
      "React",
      "Next.js",
      "shadcn/ui",
      "TanStack Query",
      "React Native",
      "Expo",
      "Tailwind CSS",
      "Vitest",
      "Zustand",
    ],
  },
  {
    index: "02",
    title: "Backend & Systems",
    subtitle: "High-throughput services, API architecture, and database engineering",
    icon: Server,
    items: [
      "Node.js",
      "Express.js",
      "Python",
      "Flask",
      "Prisma ORM",
      "PostgreSQL",
      "MySQL",
      "PHP",
      "Rust (Axum)",
      "RESTful APIs",
    ],
  },
  {
    index: "03",
    title: "DevOps & Infrastructure",
    subtitle: "Cloud infrastructure, containerization, telemetry metrics, and uptime alerts",
    icon: Activity,
    items: [
      "Docker",
      "Grafana",
      "Prometheus",
      "Loki",
      "Alloy",
      "Uptime Kuma",
      "Node Exporter",
      "Dozzle",
      "CI/CD Pipelines",
      "AWS / GCP",
      "Hostinger Cloud",
    ],
  },
  {
    index: "04",
    title: "AI & Workflow Automation",
    subtitle: "Agentic harnesses, local LLMs, and automated workflow orchestration",
    icon: Sparkles,
    items: [
      "Claude Code",
      "Codex",
      "Ollama",
      "Hermes",
      "n8n",
      "Gemini API",
      "Agentic Workflows",
      "Model Orchestration",
    ],
  },
];

/**
 * Technical Arsenal as a folded stack: one bold strip per category; the open
 * strip unfolds (inverted) to show its subtitle and tools. One open at a time,
 * the first open on load.
 */
export default function TechnicalArsenal() {
  const [openIndex, setOpenIndex] = useState<string | null>(arsenalCategories[0]?.index ?? null);

  return (
    <section id="technical-arsenal" className="border-t border-foreground/35 py-12 sm:py-16">
      {/* Section Header */}
      <div className="flex items-end justify-between gap-6 border-b border-foreground/35 pb-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
            {content.techstack.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Technical Arsenal
          </h2>
        </div>
        <Link
          href="/stack"
          data-magnetic
          className="inline-flex h-10 shrink-0 items-center gap-2 border border-foreground px-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-foreground hover:text-background sm:h-11 sm:px-4"
        >
          <span className="hidden sm:inline">View Full Stack & Skills</span>
          <span className="sm:hidden">Full Stack</span>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <ol className="arsenal mt-8 border-b border-foreground/35" data-has-open={openIndex !== null || undefined}>
        {arsenalCategories.map((group) => {
          const Icon = group.icon;
          const isOpen = openIndex === group.index;
          const panelId = `arsenal-${group.index}`;

          return (
            <li
              key={group.index}
              className="arsenal-strip border-t border-foreground/35 transition-colors duration-300"
              data-open={isOpen || undefined}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : group.index)}
                className="grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 px-1 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:grid-cols-[3.5rem_2rem_minmax(0,1fr)_auto_auto] sm:px-3"
              >
                <span className="arsenal-muted font-mono text-xs font-semibold tracking-[0.12em] text-(--muted)">
                  {group.index}
                </span>
                <Icon className="hidden h-5 w-5 sm:block" aria-hidden="true" />
                <span className="arsenal-title text-xl font-black uppercase leading-tight tracking-tight sm:text-3xl">
                  {group.title}
                </span>
                <span className="arsenal-muted hidden font-mono text-xs font-semibold uppercase tracking-[0.12em] text-(--muted) sm:block">
                  {group.items.length} tools
                </span>
                <Plus className="arsenal-plus h-5 w-5" aria-hidden="true" />
              </button>

              <div id={panelId} className="fold" data-open={isOpen || undefined} inert={!isOpen}>
                <div>
                  <div className="grid gap-5 px-1 pb-7 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:px-3">
                    <span className="hidden sm:block" />
                    <div>
                      <p className="arsenal-muted max-w-2xl text-sm leading-relaxed text-(--muted)">{group.subtitle}</p>
                      <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${group.title} technologies`}>
                        {group.items.map((item) => (
                          <li key={item}>
                            <span className="arsenal-chip inline-block border px-2.5 py-1 font-mono text-xs font-semibold">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
