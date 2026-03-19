import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import content from "@/app/profile-data.json";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected projects by Franze William Calleja, including web, mobile, and full-stack systems with their technologies.",
};

export default function ProjectsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-4 font-sans sm:px-10 sm:py-7 lg:px-16 lg:py-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
              {content.projects.eyebrow}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              All Projects
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-[color:var(--muted)] transition-colors hover:bg-[color:var(--hover)] hover:text-[color:var(--foreground)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>

        <ul className="grid gap-2 sm:grid-cols-2 auto-rows-fr">
          {content.projects.items.map((project) => (
            <li key={project.name} className="h-full">
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full min-h-[14rem] flex-col gap-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4 transition-colors hover:bg-[color:var(--hover)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold sm:text-base">{project.name}</p>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[color:var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <p className="text-sm leading-6 text-[color:var(--muted)]">
                  {project.description}
                </p>
                <div className="mt-auto flex flex-wrap gap-1 pt-2">
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
    </main>
  );
}