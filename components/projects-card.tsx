import { ArrowUpRight } from "lucide-react";

import content from "@/app/profile-data.json";
import SectionCard from "./section-card";

export default function ProjectsCard() {
  return (
    <SectionCard className="lg:col-start-1 lg:col-span-2">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
            {content.projects.eyebrow}
          </p>
          <a
            href={content.projects.viewAllHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <ul className="grid gap-1.5 sm:grid-cols-2">
          {content.projects.items.map((project) => (
            <li key={project.name}>
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col gap-1 rounded-lg border border-[color:var(--border)] p-3 transition-colors hover:bg-[color:var(--hover)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold sm:text-sm">{project.name}</p>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <p className="text-[0.7rem] leading-5 text-[color:var(--muted)] sm:text-xs">
                  {project.description}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}
