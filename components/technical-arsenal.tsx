import Link from "next/link";
import { ArrowUpRight, Code2, Server, Activity, Sparkles, type LucideIcon } from "lucide-react";

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
    title: "DevOps & Observability",
    subtitle: "Containerization, telemetry metrics, log aggregation, and uptime alerts",
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
      "AWS / GCP",
      "Hostinger Cloud",
    ],
  },
];

export default function TechnicalArsenal() {
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
          className="inline-flex h-10 shrink-0 items-center gap-2 border border-foreground px-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-foreground hover:text-background sm:h-11 sm:px-4"
        >
          <span className="hidden sm:inline">View Full Stack & Skills</span>
          <span className="sm:hidden">Full Stack</span>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Bento Grid */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:gap-6">
        {arsenalCategories.map((group) => {
          const Icon = group.icon;

          return (
            <article
              key={group.index}
              className="group flex flex-col border border-foreground/55 p-6 transition-all duration-300 hover:border-foreground hover:shadow-lg sm:p-7"
            >
              {/* Header with index and icon */}
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
                  {group.index} / ARSENAL
                </span>
                <span className="flex h-8 w-8 items-center justify-center border border-foreground/30 text-foreground transition-colors group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                {group.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-(--muted)">
                {group.subtitle}
              </p>

              {/* Divider */}
              <div className="my-5 border-t border-foreground/20" />

              {/* Technology Badges */}
              <ul className="flex flex-wrap gap-2" aria-label={`${group.title} technologies`}>
                {group.items.map((item) => (
                  <li key={item}>
                    <span className="inline-block border border-foreground/35 px-2.5 py-1 font-mono text-xs font-semibold text-foreground/90 transition-all duration-200 hover:border-foreground hover:bg-foreground hover:text-background">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Bottom pill count */}
              <div className="mt-auto pt-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-(--muted)">
                  {group.items.length} core technologies
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
