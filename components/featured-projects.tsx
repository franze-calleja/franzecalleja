import { ExternalLink } from "lucide-react";
import Link from "next/link";

import content from "@/app/profile-data.json";

const featuredProjects = content.projects.items.slice(0, 4);

export default function FeaturedProjects() {
  return (
    <section id="projects" className="border-t border-foreground/35 py-12 sm:py-16">
      <div className="flex items-end justify-between gap-6 border-b border-foreground/35 pb-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
            {content.projects.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Featured Projects
          </h2>
        </div>
        <Link
          href="/projects"
          className="inline-flex h-10 shrink-0 items-center gap-2 border border-foreground px-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-foreground hover:text-background sm:h-11 sm:px-4"
        >
          <span className="hidden sm:inline">Show more</span>
          <span className="sm:hidden">More</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2 lg:gap-8">
        {featuredProjects.map((project) => (
          <a
            key={project.name}
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className="group flex min-h-56 flex-col border border-foreground/55 p-6 transition-colors hover:bg-foreground hover:text-background sm:p-7"
          >
            <div className="flex items-start justify-between gap-6">
              <h3 className="max-w-xl text-2xl font-bold leading-tight sm:text-3xl">
                {project.name}
              </h3>
              <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-(--muted) transition-colors group-hover:text-background" aria-hidden="true" />
            </div>
            <p className="mt-4 max-w-2xl text-base leading-7 text-(--muted) transition-colors group-hover:text-background/70">
              {project.description}
            </p>
            <ul className="mt-auto flex flex-wrap gap-2 pt-7" aria-label={`${project.name} technologies`}>
              {project.technologies.map((technology) => (
                <li
                  key={technology}
                  className="border border-foreground/55 px-2.5 py-1 font-mono text-xs font-semibold transition-colors group-hover:border-background/70"
                >
                  {technology}
                </li>
              ))}
            </ul>
          </a>
        ))}
      </div>

    </section>
  );
}