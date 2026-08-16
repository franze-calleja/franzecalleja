import {
  BriefcaseBusiness,
  Code2,
  FolderKanban,
  GraduationCap,
  GitCommit,
  Crown,
  Gamepad2,
  ShieldAlert,
  Bot,
  Sparkles,
  Terminal,
  Compass,
} from "lucide-react";

import type { Metadata } from "next";

import content from "@/app/profile-data.json";
import GithubStatsCalendar from "@/components/github-stats-calendar";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Stats & Engineering Telemetry",
  description:
    "Engineering metrics, public commit activity, observability telemetry, and developer vitals of Franze William Calleja.",
  alternates: {
    canonical: "/stats",
  },
  openGraph: {
    title: "Stats & Engineering Telemetry | Franze William Calleja",
    description:
      "Engineering metrics, public commit activity, observability telemetry, and developer vitals of Franze William Calleja.",
    url: `${SITE_URL}/stats`,
    images: ["/og-image.png"],
  },
};

const primaryStats = [
  {
    label: "Production Projects",
    value: String(content.projects.items.length).padStart(2, "0"),
    detail: "Fullstack apps & platforms",
    icon: FolderKanban,
  },
  {
    label: "Core Technologies",
    value: "18+",
    detail: "Frontend, Backend & DevOps",
    icon: Code2,
  },
  {
    label: "Professional Roles",
    value: String(content.experience.steps.length).padStart(2, "0"),
    detail: "Enterprise, startup & freelance",
    icon: BriefcaseBusiness,
  },
  {
    label: "Academic Degree",
    value: "01",
    detail: "Salutatorian · Magna Cum Laude",
    icon: GraduationCap,
  },
  {
    label: "Public Git Commits",
    value: "1.8k+",
    detail: "Shipped on GitHub @franze-calleja",
    icon: GitCommit,
  },
  {
    label: "Remote Collaboration",
    value: "100%",
    detail: "Available worldwide (UTC+8)",
    icon: Compass,
  },
];

const quirkyStats = [
  {
    title: "Basketball & The GOAT",
    value: "LeBron James #1",
    description: "Die-hard basketball fan supporting LeBron James wherever he goes—because he is the undisputed GOAT.",
    icon: Crown,
    tag: "Hoops",
  },
  {
    title: "PS5 & Gaming Sanctuary",
    value: "NBA 2K · RDR2 · Cult",
    description: "Decompressing on PS5 with NBA 2K, Red Dead Redemption 2, Cult of the Lamb, and great indie titles.",
    icon: Gamepad2,
    tag: "Gaming",
  },
  {
    title: "Agentic AI Orchestration",
    value: "Claude Code + Codex",
    description: "Daily pairing with Claude Code, Codex, and AI agent harnesses for multi-agent code refactoring and autonomous developer workflows.",
    icon: Bot,
    tag: "AI Harness",
  },
  {
    title: "Terminal & Tooling Flow",
    value: "CLI-First + ⌘K",
    description: "Keyboard-first velocity utilizing Claude Code REPLs, Codex CLI automation, and rapid command palette navigation.",
    icon: Terminal,
    tag: "Developer Flow",
  },
  {
    title: "Friday Deployments",
    value: "0 Incidents",
    description: "Strict adherence to the sacred 'Never deploy to production at 5 PM on Friday' engineering rule.",
    icon: ShieldAlert,
    tag: "Safety",
  },
  {
    title: "Engineering Focus",
    value: "Production Systems",
    description: "Architecting high-throughput enterprise systems, modern web apps, and reliable cloud infrastructures.",
    icon: Sparkles,
    tag: "Craft",
  },
];

export default function StatsPage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-5 sm:px-8 sm:pb-32 sm:pt-8 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12 sm:space-y-16">
        {/* Page Header */}
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
            Profile Index // Telemetry & Vitals
          </p>
          <h1 className="mt-3 text-4xl font-black leading-[0.92] tracking-tight sm:mt-4 sm:text-6xl lg:text-7xl">
            BY THE NUMBERS.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">
            A statistical overview of software engineering output, active GitHub commit cadence, observability metrics, and developer vitals.
          </p>
        </div>

        {/* Primary Metrics Grid */}
        <section aria-labelledby="primary-metrics-heading">
          <h2 id="primary-metrics-heading" className="sr-only">
            Primary Engineering Metrics
          </h2>
          <div className="grid border-l border-t border-foreground/35 sm:grid-cols-2 lg:grid-cols-3">
            {primaryStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className="group relative flex min-h-48 flex-col justify-between border-b border-r border-foreground/35 p-5 transition-colors hover:bg-foreground hover:text-background sm:min-h-52 sm:p-6"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-(--muted) group-hover:text-background/70">
                      Metric
                    </span>
                  </div>
                  <div>
                    <p className="text-4xl font-black tracking-tight sm:text-5xl">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em]">
                      {stat.label}
                    </p>
                    <p className="mt-1 font-mono text-xs text-(--muted) group-hover:text-background/80">
                      {stat.detail}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* GitHub Live Contributions Calendar */}
        <section aria-labelledby="github-activity-heading">
          <div className="mb-4 flex items-center justify-between border-b border-foreground/35 pb-3">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
                02 / Cadence
              </p>
              <h2 id="github-activity-heading" className="mt-1 text-2xl font-black uppercase tracking-tight sm:text-3xl">
                GitHub Contribution Activity
              </h2>
            </div>
          </div>
          <GithubStatsCalendar />
        </section>

        {/* Quirky & Developer Vitals Bento Grid */}
        <section aria-labelledby="quirky-stats-heading">
          <div className="mb-6 flex items-center justify-between border-b border-foreground/35 pb-3">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
                03 / Engineering Vitals
              </p>
              <h2 id="quirky-stats-heading" className="mt-1 text-2xl font-black uppercase tracking-tight sm:text-3xl">
                Developer Vitals & Trivia
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {quirkyStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.title}
                  className="group flex flex-col justify-between border border-foreground/45 p-5 transition-all duration-200 hover:border-foreground hover:shadow-lg sm:p-6"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-foreground/20 pb-3">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-(--muted)">
                        <Icon className="h-4 w-4 text-foreground" aria-hidden="true" />
                        {stat.tag}
                      </span>
                      <span className="font-mono text-[10px] uppercase text-(--muted)">
                        ● Live
                      </span>
                    </div>

                    <p className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                      {stat.value}
                    </p>
                    <h3 className="mt-1 font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                      {stat.title}
                    </h3>
                    <p className="mt-2.5 text-xs leading-relaxed text-(--muted) sm:text-sm">
                      {stat.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Bottom Context: Core Stack & Availability */}
        <section className="grid gap-8 border-t border-foreground/35 pt-8 lg:grid-cols-2">
          <div className="border border-foreground/35 p-6">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
              Core Technical Stack
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {content.techstack.items.slice(0, 10).map((item) => (
                <span
                  key={item.label}
                  className="border border-foreground/35 px-3 py-1.5 font-mono text-xs font-semibold transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="border border-foreground/35 p-6">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
              Current Availability & Status
            </p>
            <p className="mt-4 text-2xl font-bold uppercase tracking-tight">
              {content.availability.status}
            </p>
            <p className="mt-2 leading-relaxed text-foreground/75">
              {content.availability.description}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}