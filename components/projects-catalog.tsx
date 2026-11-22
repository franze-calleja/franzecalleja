import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";


interface ProjectsCatalogProps {
  projects: Array<{
    name: string;
    description: string;
    href: string;
    technologies: string[];
    image?: string;
  }>;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The /projects gallery. Statically it is a list (lg+) or a swipe-able snap
 * row (below lg); the scroll-driven sideways motion and parallax layers are
 * added in globals.css (`.gallery*`) only when motion is allowed.
 */
export default function ProjectsCatalog({ projects }: ProjectsCatalogProps) {
  const total = projects.length;

  return (
    <section
      aria-label="Projects"
      className="gallery mt-8"
      style={{ "--n": total + 1 } as CSSProperties}
    >
      <div className="gallery__stage">
        <ol className="gallery__track -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:-mx-10 sm:px-10 lg:mx-0 lg:flex-col lg:gap-10 lg:overflow-visible lg:px-0">
          {projects.map((project, index) => {
            const hasShot = Boolean(project.image?.trim());

            return (
              <li
                key={project.name}
                className={`gallery__panel w-[85vw] shrink-0 snap-center sm:w-[60vw] lg:w-auto ${hasShot ? "" : "gallery__panel--text"}`}
                style={{ "--i": index } as CSSProperties}
              >
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative isolate grid h-full gap-5 border border-foreground/55 bg-background p-4 transition-colors hover:border-foreground sm:p-6 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-10 lg:p-8"
                >
                  <span
                    aria-hidden="true"
                    className="gallery__ghost pointer-events-none absolute -top-6 right-3 -z-10 select-none font-black leading-none tracking-tighter text-[6rem] lg:-top-10 lg:text-[11rem]"
                  >
                    {pad(index + 1)}
                  </span>

                  <div className="gallery__frame relative aspect-[16/10] overflow-hidden border border-foreground/70 bg-foreground/5">
                    {hasShot ? (
                      <div className="gallery__shot absolute inset-0">
                        <Image
                          src={project.image!}
                          alt={`${project.name} screenshot`}
                          fill
                          sizes="(min-width: 1024px) 40vw, 85vw"
                          className="object-cover object-top"
                        />
                      </div>
                    ) : (
                      <p
                        aria-hidden="true"
                        className="gallery__textname absolute inset-0 flex items-end p-4 text-3xl font-black uppercase leading-[0.9] tracking-tight sm:p-6 sm:text-5xl"
                      >
                        {project.name}
                      </p>
                    )}
                  </div>

                  <div className="gallery__copy flex flex-col gap-3">
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
                      {pad(index + 1)} / {pad(total)}
                    </p>
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{project.name}</h2>
                      <ArrowUpRight
                        className="mt-1 h-5 w-5 shrink-0 text-(--muted) transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="line-clamp-3 text-base leading-7 text-(--muted)">{project.description}</p>
                    <ul className="flex flex-wrap gap-2 pt-2" aria-label={`${project.name} technologies`}>
                      {project.technologies.map((technology) => (
                        <li key={technology} className="border border-foreground/55 px-2.5 py-1 font-mono text-xs font-semibold">
                          {technology}
                        </li>
                      ))}
                    </ul>
                  </div>
                </a>
              </li>
            );
          })}

          <li
            className="gallery__panel gallery__end flex w-[85vw] shrink-0 snap-center items-center justify-center sm:w-[60vw] lg:w-auto"
            style={{ "--i": total } as CSSProperties}
          >
            <Link
              href="/"
              className="inline-flex h-12 items-center gap-2 border border-foreground px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-foreground hover:text-background"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>
          </li>
        </ol>
      </div>
    </section>
  );
}
