"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import ProjectHoverPreview, { type ProjectPreviewData } from "@/components/project-hover-preview";

interface ProjectsCatalogProps {
  projects: Array<{
    name: string;
    description: string;
    href: string;
    technologies: string[];
    image?: string;
  }>;
}

export default function ProjectsCatalog({ projects }: ProjectsCatalogProps) {
  const [activePreview, setActivePreview] = useState<ProjectPreviewData | null>(null);

  return (
    <>
      <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:gap-8">
        {projects.map((project, index) => (
          <li key={project.name}>
            <a
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setActivePreview(project)}
              onMouseLeave={() => setActivePreview(null)}
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

      <ProjectHoverPreview activeProject={activePreview} />
    </>
  );
}
