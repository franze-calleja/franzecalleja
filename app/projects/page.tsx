import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

import content from "@/app/profile-data.json";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Projects & Production Systems",
  description:
    "Selected engineering projects by Franze William Calleja, including enterprise web platforms, mobile systems, cloud infrastructure, and headless CMS architectures.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "Projects & Production Systems | Franze William Calleja",
    description:
      "Selected engineering projects by Franze William Calleja, including enterprise web platforms, mobile systems, cloud infrastructure, and headless CMS architectures.",
    url: `${SITE_URL}/projects`,
    images: ["/og-image.png"],
  },
};

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-background px-5 pb-28 pt-5 sm:px-10 sm:pb-32 sm:pt-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-foreground/35 pb-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
            {content.projects.eyebrow} / Full index
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">
            All Projects
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/75 sm:text-lg">
            A selection of web, mobile, operations, and infrastructure work.
          </p>
        </header>

        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:gap-8">
          {content.projects.items.map((project, index) => (
            <li key={project.name}>
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-64 flex-col border border-foreground/55 p-6 transition-colors hover:bg-foreground hover:text-background sm:p-7"
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="font-mono text-xs font-semibold tracking-[0.12em] text-(--muted) transition-colors group-hover:text-background/70">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{project.name}</h2>
                  </div>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-(--muted) transition-colors group-hover:text-background" aria-hidden="true" />
                </div>
                <p className="mt-5 text-base leading-7 text-(--muted) transition-colors group-hover:text-background/70">
                  {project.description}
                </p>
                <ul className="mt-auto flex flex-wrap gap-2 pt-7" aria-label={`${project.name} technologies`}>
                  {project.technologies.map((technology) => (
                    <li key={technology} className="border border-foreground/55 px-2.5 py-1 font-mono text-xs font-semibold transition-colors group-hover:border-background/70">
                      {technology}
                    </li>
                  ))}
                </ul>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}