import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import content from "@/app/profile-data.json";
import SectionCard from "./section-card";

const previewProjects = content.projects.items.slice(0, 4);

export default function ProjectsCard() {
  return (
    <SectionCard className="lg:col-start-1 lg:col-span-2">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
            {content.projects.eyebrow}
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ul className="grid gap-1.5 sm:grid-cols-2 auto-rows-fr">
          {previewProjects.map((project) => (
            <li key={project.name} className="h-full">
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full min-h-[10.25rem] flex-col gap-1 rounded-lg border border-[color:var(--border)] p-3 transition-colors hover:bg-[color:var(--hover)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold sm:text-sm">{project.name}</p>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <p
                  className="text-[0.7rem] leading-5 text-[color:var(--muted)] sm:text-xs"
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {project.description}
                </p>
                <div className="mt-auto flex flex-wrap gap-1 pt-1">
                  {project.technologies.map((technology) => (
                    <span
                      key={technology}
                      className="rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[color:var(--muted)]"
                    >
                      {technology}
                    </span>
                  ))}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}
