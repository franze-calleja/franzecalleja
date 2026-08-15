import { BriefcaseBusiness, Code2, FolderKanban, GraduationCap } from "lucide-react";

import content from "@/app/profile-data.json";
import MainBottomNav from "@/components/main-bottom-nav";

const statistics = [
  { label: "Selected projects", value: content.projects.items.length, icon: FolderKanban },
  { label: "Technologies", value: content.techstack.items.length, icon: Code2 },
  { label: "Professional roles", value: content.experience.steps.length, icon: BriefcaseBusiness },
  { label: "Degree", value: content.education.items.length, icon: GraduationCap },
];

export default function StatsPage() {
  return (
    <main className="min-h-screen bg-background px-5 pb-28 pt-5 sm:px-10 sm:pb-32 sm:pt-8 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
          Profile index / 2026
        </p>
        <h1 className="mt-4 text-5xl font-black leading-[0.92] tracking-tight sm:text-6xl">
          BY THE NUMBERS.
        </h1>
        <section className="mt-12 grid border-l border-t border-foreground/35 sm:grid-cols-2 lg:grid-cols-4">
          {statistics.map((statistic) => {
            const Icon = statistic.icon;

            return (
              <article key={statistic.label} className="min-h-52 border-b border-r border-foreground/35 p-5 sm:p-6">
                <Icon className="h-5 w-5" aria-hidden="true" />
                <p className="mt-10 text-5xl font-black tracking-tight">{statistic.value}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.1em] text-(--muted)">
                  {statistic.label}
                </p>
              </article>
            );
          })}
        </section>
        <section className="mt-12 grid gap-8 border-t border-foreground/35 pt-6 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">Core stack</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {content.techstack.items.slice(0, 8).map((item) => (
                <span key={item.label} className="border border-foreground/35 px-3 py-2 font-mono text-xs">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">Current availability</p>
            <p className="mt-4 text-2xl font-bold">{content.availability.status}</p>
            <p className="mt-2 max-w-xl leading-7 text-foreground/75">{content.availability.description}</p>
          </div>
        </section>
      </div>
      <MainBottomNav />
    </main>
  );
}