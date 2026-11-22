"use client";

import { useState, type CSSProperties } from "react";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

import content from "@/app/profile-data.json";
import ProjectHoverPreview, { type ProjectPreviewData } from "@/components/project-hover-preview";

const featuredProjects = content.projects.items.slice(0, 4);

export default function FeaturedProjects() {
  const [activePreview, setActivePreview] = useState<ProjectPreviewData | null>(null);

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
          data-magnetic
          className="inline-flex h-10 shrink-0 items-center gap-2 border border-foreground px-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-foreground hover:text-background sm:h-11 sm:px-4"
        >
          <span className="hidden sm:inline">Show more</span>
          <span className="sm:hidden">More</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Sticky stack: each card pins and the next slides over it. */}
      <ol
        className="project-stack mt-8 gap-6 sm:gap-10"
        style={{ "--count": featuredProjects.length } as CSSProperties}
      >
        {featuredProjects.map((project, index) => (
          <li
            key={project.name}
            className="project-stack__card"
            style={
              {
                "--i": index,
              } as CSSProperties
            }
          >
            <a
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setActivePreview(project)}
              onMouseLeave={() => setActivePreview(null)}
              className="group flex h-full min-h-64 flex-col border border-foreground/55 bg-background p-6 shadow-[0_-12px_30px_-18px_rgba(0,0,0,0.35)] transition-colors hover:bg-foreground hover:text-background sm:min-h-72 sm:p-8 lg:p-10"
            >
              <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted) transition-colors group-hover:text-background/70">
                {String(index + 1).padStart(2, "0")} / {String(featuredProjects.length).padStart(2, "0")}
              </p>
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
          </li>
        ))}
      </ol>

      <ProjectHoverPreview activeProject={activePreview} projects={featuredProjects} />
    </section>
  );
}